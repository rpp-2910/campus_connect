require('dotenv').config();
const pool = require('../config/db');
const { embedPost } = require('../controllers/assistantController');

async function embedAllPosts() {
  const posts = await pool.query('SELECT id, title, content FROM posts');
  console.log(`Embedding ${posts.rows.length} posts...`);

  for (const post of posts.rows) {
    await embedPost(post.id, post.title, post.content);
    console.log(`✅ Embedded chunks for post ${post.id}: "${post.title}"`);
  }

  console.log('Done — all posts embedded!');
  process.exit(0);
}

embedAllPosts();