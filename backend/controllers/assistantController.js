const pool = require('../config/db');
const { GoogleGenAI } = require('@google/genai');
const { createChunks } = require('../services/chunkingService');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function inferCategory(question) {
  const q = question.toLowerCase();
  if (/placement|internship|package|recruit|job|offer|salary|company visit|interview/.test(q)) return 'Placements & Internships';
  if (/professor|teacher|faculty|teaching style|attendance policy/.test(q)) return 'Professors & Courses';
  if (/exam|syllabus|grade|assignment|semester|notes|study material/.test(q)) return 'Academics & Notes';
  if (/hostel|room|mess|warden|roommate|campus life|clubs|fest|events/.test(q)) return 'Campus Life';
  return null; // unsure — no category boost applied, safe fallback
}

// Step 1 — Convert text to vector
async function getEmbedding(text, taskType = 'RETRIEVAL_DOCUMENT') {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { taskType }
  });
  return response.embeddings[0].values;
}

// Helper — Deduplicate retrieved chunks to limit chunks from the same post
function deduplicateChunks(candidates, topK, maxChunksPerPost = 1) {
  const postCounts = new Map();
  const selected = [];

  for (const chunk of candidates) {
    const count = postCounts.get(chunk.post_id) || 0;
    if (count < maxChunksPerPost) {
      selected.push(chunk);
      postCounts.set(chunk.post_id, count + 1);
      if (selected.length >= topK) break;
    }
  }

  return selected;
}

// Step 2 — Chunk post and store chunk embeddings
async function embedPost(postId, titleOrText, content) {
  let title = '';
  let rawContent = '';

  if (content !== undefined) {
    title = (titleOrText || '').trim();
    rawContent = (content || '').trim();
  } else {
    // Backwards-compatible signature: embedPost(postId, text)
    const lines = (titleOrText || '').split('\n');
    title = (lines[0] || '').trim();
    rawContent = lines.slice(1).join('\n').trim() || title;
  }

  // 1. Create chunks from raw content
  const chunks = createChunks(rawContent);
  if (chunks.length === 0) return;

  // 2. Generate embeddings OUTSIDE any database transaction
  // If Gemini API fails, existing database chunks remain completely untouched
  const preparedChunks = [];
  for (const chunk of chunks) {
    const embeddingText = `${title}\n\n${chunk.chunk_text}`.trim();
    const vector = await getEmbedding(embeddingText, 'RETRIEVAL_DOCUMENT');
    preparedChunks.push({
      chunk_text: chunk.chunk_text,
      chunk_index: chunk.chunk_index,
      embedding: vector,
    });
  }

  // Also prepare full post embedding for legacy embeddings table (rollback safety)
  let legacyEmbedding = null;
  try {
    const fullText = `${title}\n${rawContent}`.trim();
    legacyEmbedding = await getEmbedding(fullText, 'RETRIEVAL_DOCUMENT');
  } catch (err) {
    console.warn(`Warning: Legacy embedding generation failed for post ${postId}:`, err.message);
  }

  // 3. Only after all embeddings succeed, begin short DB transaction to replace chunks
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete old chunks for this post
    await client.query('DELETE FROM post_chunks WHERE post_id = $1', [postId]);

    // Insert new chunks (stores raw chunk_text only)
    for (const chunk of preparedChunks) {
      await client.query(
        `INSERT INTO post_chunks (post_id, chunk_text, chunk_index, embedding)
         VALUES ($1, $2, $3, $4)`,
        [postId, chunk.chunk_text, chunk.chunk_index, JSON.stringify(chunk.embedding)]
      );
    }

    // Keep legacy embeddings table updated for rollback safety
    if (legacyEmbedding) {
      await client.query(
        `INSERT INTO embeddings (post_id, content_text, embedding)
         VALUES ($1, $2, $3)
         ON CONFLICT (post_id) DO UPDATE 
         SET embedding = EXCLUDED.embedding,
             content_text = EXCLUDED.content_text`,
        [postId, `${title}\n${rawContent}`.trim(), JSON.stringify(legacyEmbedding)]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Stored ${preparedChunks.length} chunks for post ${postId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Step 3 — Find similar chunks using pgvector with dynamic vote weight calculation
async function retrieveRelevantPosts(queryEmbedding, topK = 5, inferredCategory = null, minSimilarity = 0.65, maxChunksPerPost = 1) {
  const candidateLimit = Math.max(topK * 4, 20);

  const result = await pool.query(
    `SELECT
      c.id AS chunk_id,
      c.post_id,
      c.chunk_text,
      c.chunk_index,
      p.title,
      p.content,
      u.username,
      u.year,
      p.category,
      p.created_at,
      COALESCE(v.vote_weight, 1.0) AS vote_weight,
      (1 - (c.embedding <=> $1::vector)) AS similarity,
      ((1 - (c.embedding <=> $1::vector)) * 0.80
        +
      (LEAST(COALESCE(v.vote_weight, 1.0), 1.5) - 1) * 0.10
        +
      CASE WHEN p.category = $3 THEN 0.10 ELSE 0 END
      ) AS score
     FROM post_chunks c
     JOIN posts p ON c.post_id = p.id
     JOIN users u ON p.user_id = u.id
     LEFT JOIN (
       SELECT post_id, GREATEST(0.5, 1 + COALESCE(SUM(vote_type), 0) * 0.1) AS vote_weight
       FROM votes
       GROUP BY post_id
     ) v ON p.id = v.post_id
     WHERE (1 - (c.embedding <=> $1::vector)) >= $4
     ORDER BY score DESC
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), candidateLimit, inferredCategory, minSimilarity],
  );

  return deduplicateChunks(result.rows, topK, maxChunksPerPost);
}

// Step 4 — Main ask handler
async function askAssistant(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const queryEmbedding = await getEmbedding(question, 'RETRIEVAL_QUERY');
    const inferredCategory = inferCategory(question);
    // Retrieve up to 5 relevant chunks (allowing up to 2 chunks per post for rich context)
    const relevantPosts = await retrieveRelevantPosts(queryEmbedding, 5, inferredCategory, 0.68, 2);

    console.log(relevantPosts.map(p => ({
      post_id: p.post_id,
      chunk_index: p.chunk_index,
      title: p.title,
      category: p.category,
      similarity: Number(p.similarity).toFixed(3),
      score: Number(p.score).toFixed(3)
    })));

    if (relevantPosts.length === 0 || relevantPosts[0].similarity < 0.68) {
      return res.json({
        answer: "No one has posted about this yet on Campus Connect. Your question could help future students!",
        sources: [],
        no_results: true,
        prompt_to_post: true
      });
    }

    // Ground Gemini strictly with the relevant chunk excerpts + post metadata
    const context = relevantPosts.map((p, i) => `
[Source ${i + 1}]
Author: ${p.username}
Year: ${p.year}th Year Student
Category: ${p.category}
Posted: ${new Date(p.created_at).toLocaleDateString()}
Community Trust Score: ${Number(p.vote_weight).toFixed(2)} (based on upvotes)
Title: ${p.title}
Relevant Excerpt:
${p.chunk_text}
`.trim()).join('\n\n---\n\n');

    const prompt = `You are a helpful senior student assistant for a college campus community platform called Campus Connect.

Your job is to answer junior students' questions using ONLY the real posts written by seniors below.

Rules you must follow:
1. Only use information from the provided sources — never make things up
2. Always cite which source you're drawing from e.g. "According to Source 1..."
3. Mention the author's year when relevant e.g. "A 3rd year student mentioned..."
4. Prioritize sources with higher Community Trust Scores — they are more upvoted and reliable
5. If sources don't have enough information to answer confidently, say so honestly
6. Keep your tone friendly, helpful, and encouraging — like a senior helping a junior
7. Keep answers concise — 3 to 5 sentences unless the question needs more detail

Context from Campus Connect posts:
${context}

Student's question: ${question}

Answer:`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
    });

    const answer = response.text;

    // Deduplicate sources by post_id for UI display
    const seenPostIds = new Set();
    const sources = [];
    for (const p of relevantPosts) {
      if (Number(p.similarity) >= 0.68 && !seenPostIds.has(p.post_id)) {
        seenPostIds.add(p.post_id);
        sources.push({
          post_id: p.post_id,
          title: p.title,
          username: p.username,
          year: p.year,
          category: p.category,
          relevance_score: parseFloat(Number(p.score).toFixed(2))
        });
      }
    }

    res.json({
      answer,
      sources,
      no_results: false,
      prompt_to_post: false
    });

  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Step 5 — Update vote weight when post gets upvoted (retained for backward compatibility)
async function updateVoteWeight(postId) {
  try {
    const voteResult = await pool.query(
      `SELECT COALESCE(SUM(vote_type), 0) AS total 
       FROM votes WHERE post_id = $1`,
      [postId]
    );
    const totalVotes = parseInt(voteResult.rows[0]?.total || 0, 10);
    const weight = Math.max(0.5, 1 + totalVotes * 0.1);
    await pool.query(
      `UPDATE embeddings SET vote_weight = $1 WHERE post_id = $2`,
      [weight, postId]
    );
  } catch (err) {
    // embeddings table fallback
  }
}

async function searchPosts(req, res) {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    // Convert the user's search text into a vector
    const queryEmbedding = await getEmbedding(query, "RETRIEVAL_QUERY");

    // Infer category intent
    const inferredCategory = inferCategory(query);

    // Retrieve top 10 unique posts (maxChunksPerPost = 1 for search)
    const results = await retrieveRelevantPosts(
      queryEmbedding,
      10,
      inferredCategory,
      0.65,
      1
    );

    res.json({
      query,
      results,
    });
  } catch (err) {
    console.error("Search error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
}

module.exports = {
  askAssistant,
  searchPosts,
  embedPost,
  getEmbedding,
  updateVoteWeight,
  retrieveRelevantPosts,
  inferCategory,
};