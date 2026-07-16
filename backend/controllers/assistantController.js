const pool = require('../config/db');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Step 1 — Convert text to vector
async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { taskType: 'RETRIEVAL_DOCUMENT' }
  });
  return response.embeddings[0].values;
}

// Step 2 — Store embedding for a post
async function embedPost(postId, text) {
  const embedding = await getEmbedding(text);
  await pool.query(
    `INSERT INTO embeddings (post_id, content_text, embedding)
     VALUES ($1, $2, $3)
     ON CONFLICT (post_id) DO UPDATE 
     SET embedding = EXCLUDED.embedding,
         content_text = EXCLUDED.content_text`,
    [postId, text, JSON.stringify(embedding)]
  );
}

// Step 3 — Find similar posts using pgvector
async function retrieveRelevantPosts(queryEmbedding, topK = 5) {
  const result = await pool.query(
    `SELECT
      e.post_id,
      p.title,
      p.content,
      u.username,
      u.year,
      p.category,
      p.created_at,
      e.vote_weight,
      (1 - (e.embedding <=> $1::vector)) * e.vote_weight AS score
     FROM embeddings e
     JOIN posts p ON e.post_id = p.id
     JOIN users u ON p.user_id = u.id
     ORDER BY score DESC
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), topK]
  );
  return result.rows;
}

// Step 4 — Main ask handler
async function askAssistant(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const queryEmbedding = await getEmbedding(question);
    const relevantPosts = await retrieveRelevantPosts(queryEmbedding, 5);

    if (relevantPosts.length === 0 || relevantPosts[0].score < 0.72) {
      return res.json({
        answer: "No one has posted about this yet on Campus Connect. Your question could help future students!",
        sources: [],
        no_results: true,
        prompt_to_post: true
      });
    }

    const context = relevantPosts.map((p, i) => `
[Source ${i + 1}]
Author: ${p.username}
Year: ${p.year}th Year Student
Category: ${p.category}
Posted: ${new Date(p.created_at).toLocaleDateString()}
Community Trust Score: ${Number(p.vote_weight).toFixed(2)} (based on upvotes)
Title: ${p.title}
Content: ${p.content}
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

    res.json({
      answer,
      sources: relevantPosts
        .filter(p => Number(p.score) >= 0.72)
        .map(p => ({
            post_id: p.post_id,
            title: p.title,
            username: p.username,
            year: p.year,
            category: p.category,
            relevance_score: parseFloat(Number(p.score).toFixed(2))
        })),
      no_results: false,
      prompt_to_post: false
    });

  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Step 5 — Update vote weight when post gets upvoted
async function updateVoteWeight(postId) {
  const voteResult = await pool.query(
    `SELECT COALESCE(SUM(vote_type), 0) AS total 
     FROM votes WHERE post_id = $1`,
    [postId]
  );
  const totalVotes = parseInt(voteResult.rows[0].total);
  const weight = Math.max(0.5, 1 + totalVotes * 0.1);
  await pool.query(
    `UPDATE embeddings SET vote_weight = $1 WHERE post_id = $2`,
    [weight, postId]
  );
}

module.exports = { askAssistant, embedPost, getEmbedding, updateVoteWeight };