const pool = require('../config/db');
const { embedPost } = require('./assistantController');
const { deleteS3Object } = require('../services/s3Service');

// 1. Get all posts with vote & comment counts, author metadata, and ownership IDs
async function getPosts(req, res) {
  try {
    const { category, year_min } = req.query;

    let query = `
      SELECT 
        p.id, 
        p.user_id, 
        p.title, 
        p.content, 
        p.category, 
        p.created_at,
        u.username, 
        u.year, 
        u.branch,
        COALESCE(COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 1) -
                 COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = -1), 0) AS vote_count,
        COUNT(DISTINCT c.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN votes v ON p.id = v.post_id
      LEFT JOIN comments c ON p.id = c.post_id
    `;

    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }
    if (year_min) {
      values.push(year_min);
      conditions.push(`u.year >= $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += `
      GROUP BY p.id, p.user_id, u.username, u.year, u.branch
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Get posts failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 2. Get single post by ID, including comments with user_id and optional current_user_vote
async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id || null;

    const postResult = await pool.query(
      `SELECT
        p.id,
        p.user_id,
        p.title,
        p.content,
        p.category,
        p.created_at,
        u.username,
        u.year,
        u.branch,
        COALESCE(COUNT(v.id) FILTER (WHERE v.vote_type = 1) -
                 COUNT(v.id) FILTER (WHERE v.vote_type = -1), 0) AS vote_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN votes v ON p.id = v.post_id
       WHERE p.id = $1
       GROUP BY p.id, p.user_id, u.username, u.year, u.branch`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const commentsResult = await pool.query(
      `SELECT 
         c.id, 
         c.post_id, 
         c.content, 
         c.created_at, 
         c.user_id, 
         u.username, 
         u.year, 
         u.branch
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    let currentUserVote = null;
    if (currentUserId) {
      const voteRes = await pool.query(
        `SELECT vote_type FROM votes WHERE post_id = $1 AND user_id = $2`,
        [id, currentUserId]
      );
      if (voteRes.rows.length > 0) {
        currentUserVote = voteRes.rows[0].vote_type;
      }
    }

    res.json({
      ...postResult.rows[0],
      is_owner: currentUserId ? postResult.rows[0].user_id === currentUserId : false,
      current_user_vote: currentUserVote,
      comments: commentsResult.rows,
    });
  } catch (err) {
    console.error("Get post by ID failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 3. Create post (requires login) and embed post
async function createPost(req, res) {
  try {
    const { title, content, category } = req.body;
    const user_id = req.user.id;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, title, content, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title.trim(), content.trim(), category || 'General']
    );

    const newPost = result.rows[0];

    // Embed the post so it's searchable by semantic search and assistant
    try {
      await embedPost(newPost.id, `${newPost.title}\n${newPost.content}`);
    } catch (embedErr) {
      console.error(`Warning: Failed to generate embedding for post ${newPost.id}:`, embedErr);
      // Don't fail post creation completely if embedding API has a momentary glitch
    }

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Create post failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 4. Update post (PATCH /posts/:id) — author only, regenerates embedding
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role || 'student';

    const postCheck = await pool.query(
      `SELECT id, user_id, title, content, category FROM posts WHERE id = $1`,
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = postCheck.rows[0];
    const isOwner = post.user_id === user_id;
    const isModerator = user_role === 'moderator' || user_role === 'admin';

    if (!isOwner && !isModerator) {
      return res.status(403).json({ error: "Forbidden — only the author can edit this post" });
    }

    const updatedTitle = title !== undefined ? title.trim() : post.title;
    const updatedContent = content !== undefined ? content.trim() : post.content;
    const updatedCategory = category !== undefined ? category : post.category;

    if (!updatedTitle || !updatedContent) {
      return res.status(400).json({ error: "Title and content cannot be empty" });
    }

    const updateRes = await pool.query(
      `UPDATE posts 
       SET title = $1, content = $2, category = $3
       WHERE id = $4
       RETURNING *`,
      [updatedTitle, updatedContent, updatedCategory, id]
    );

    const updatedPost = updateRes.rows[0];

    // CRITICAL: Must regenerate embedding on save so search and RAG don't serve stale text
    try {
      await embedPost(id, `${updatedTitle}\n${updatedContent}`);
      console.log(`✅ Embedding regenerated for updated post ${id}`);
    } catch (embedErr) {
      console.error(`Warning: Failed to refresh embedding for post ${id}:`, embedErr);
    }

    res.json(updatedPost);
  } catch (err) {
    console.error("Update post failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 5. Delete post (DELETE /posts/:id) — author/moderator only, cascades DB and deletes S3 files
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role || 'student';

    const postCheck = await pool.query(
      `SELECT id, user_id FROM posts WHERE id = $1`,
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = postCheck.rows[0];
    const isOwner = post.user_id === user_id;
    const isModerator = user_role === 'moderator' || user_role === 'admin';

    if (!isOwner && !isModerator) {
      return res.status(403).json({ error: "Forbidden — not your post" });
    }

    // Retrieve all attachment S3 keys before DB cascade removes them
    const attachmentsRes = await pool.query(
      `SELECT id, s3_key FROM post_attachments WHERE post_id = $1`,
      [id]
    );

    // Attempt to delete each file in S3
    for (const att of attachmentsRes.rows) {
      const s3Res = await deleteS3Object(att.s3_key);
      if (!s3Res.success) {
        if (s3Res.isAccessDenied) {
          return res.status(502).json({
            error: "Attachment deletion failed due to AWS S3 IAM permission 's3:DeleteObject' not being granted to server credentials. Post and files were retained.",
            code: "S3_DELETE_PERMISSION_DENIED",
            attachmentId: att.id,
          });
        }
        return res.status(502).json({
          error: `Failed to delete attachment ${att.id} from S3: ${s3Res.message}`,
          code: s3Res.code,
        });
      }
    }

    // All S3 files safely deleted (or post had no attachments) — now delete DB post
    // Foreign key CASCADE will remove votes, comments, embeddings, and post_attachments
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: "Post deleted successfully", id: Number(id) });
  } catch (err) {
    console.error("Delete post failed:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
