require('dotenv').config();
const pool = require('./config/db');
const { embedPost } = require('./controllers/assistantController'); // adjust path to match your actual file

async function backfill() {
  try {
    // Find posts that exist in `posts` but have no row in `post_chunks`
    const result = await pool.query(`
      SELECT p.id, p.title, p.content
      FROM posts p
      LEFT JOIN (SELECT DISTINCT post_id FROM post_chunks) pc ON p.id = pc.post_id
      WHERE pc.post_id IS NULL
    `);

    const missingPosts = result.rows;
    console.log(`Found ${missingPosts.length} posts missing chunks/embeddings.`);

    for (const post of missingPosts) {
      console.log(`Embedding post ${post.id}: "${post.title}"`);
      await embedPost(post.id, post.title, post.content);
    }

    console.log('Backfill complete.');
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

backfill();