const express = require('express')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
app.use(express.json());
const pool = require('./config/db');
const verifyToken = require('./middleware/verifyToken');

const PORT = process.env.PORT || 5000;

app.get('/', (req,res)=>{
    res.send("api is running");
});

app.get('/users', async (req,res)=>{
    try{
        const result = await pool.query(
            'SELECT id, username, email, branch, year, created_at FROM users'
        );
        res.json(result.rows);
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
});

app.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT id, username, email, branch, year, created_at 
             FROM users WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/users', async (req,res) =>{
    try{
        const{username, email, password, branch, year} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users
            (username, email, password_hash, branch, year) 
            VALUES 
            ($1, $2, $3, $4, $5)
            RETURNING id, username, email, branch, year, created_at`,
            [username, email, hashedPassword, branch, year]
        );
        res.status(201).json(result.rows[0]);
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
});

app.post('/login', async (req,res) =>{
    try{
        const{email, password} = req.body;

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        if(result.rows.length === 0){
            return res.status(400).json({
                error: 'Invalid email or password'
            });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch){
            return res.status(400).json({
                error: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                branch: user.branch,
                year: user.year
            }
        });
    }
    catch(err){
        res.status(500).json({
            error: err.message
        });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const { category, year_min } = req.query;

        let query = `
            SELECT 
                p.id, p.title, p.content, p.category, p.created_at,
                u.username, u.year, u.branch,
                COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = 1) -
                COUNT(DISTINCT v.id) FILTER (WHERE v.vote_type = -1) AS vote_count,
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
            GROUP BY p.id, u.username, u.year, u.branch
            ORDER BY p.created_at DESC
        `;

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const postResult = await pool.query(
            `SELECT p.id, p.title, p.content, p.category, p.created_at,
                    u.username, u.year, u.branch
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = $1`,
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const commentsResult = await pool.query(
            `SELECT c.id, c.content, c.created_at, u.username
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [id]
        );

        res.json({
            ...postResult.rows[0],
            comments: commentsResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/posts', verifyToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const user_id = req.user.id; // came from the JWT payload verifyToken decoded

        const result = await pool.query(
            `INSERT INTO posts (user_id, title, content, category)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [user_id, title, content, category]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/posts/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const postResult = await pool.query(
            `SELECT user_id FROM posts WHERE id = $1`,
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (postResult.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden — not your post' });
        }

        await pool.query(`DELETE FROM posts WHERE id = $1`, [id]);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Comments routes
// Get all comments for a post
app.get('/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT c.id, c.content, c.created_at, u.username, u.id AS user_id
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a comment to a post (requires login)
app.post('/posts/:id/comments', verifyToken, async (req, res) => {
    try {
        const { id } = req.params; // post id
        const { content } = req.body;
        const user_id = req.user.id;

        // Optional: ensure post exists
        const postCheck = await pool.query(`SELECT id FROM posts WHERE id = $1`, [id]);
        if (postCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const insert = await pool.query(
            `INSERT INTO comments (post_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, post_id, user_id, content, created_at`,
            [id, user_id, content]
        );

        // Attach username
        const comment = insert.rows[0];
        const userRes = await pool.query(
            `SELECT username FROM users WHERE id = $1`,
            [user_id]
        );
        comment.username = userRes.rows[0] ? userRes.rows[0].username : null;

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a comment (only the author can delete)
app.delete('/comments/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const commentResult = await pool.query(
            `SELECT user_id FROM comments WHERE id = $1`,
            [id]
        );

        if (commentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (commentResult.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden — not your comment' });
        }

        await pool.query(`DELETE FROM comments WHERE id = $1`, [id]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upvote/downvote a post (requires login) — upserts, so re-voting changes instead of duplicating
app.post('/posts/:id/vote', verifyToken, async (req, res) => {
    try {
        const { id } = req.params; // post id
        const { vote_type } = req.body; // 1 or -1
        const user_id = req.user.id;

        if (vote_type !== 1 && vote_type !== -1) {
            return res.status(400).json({ error: 'vote_type must be 1 or -1' });
        }

        const result = await pool.query(
            `INSERT INTO votes (post_id, user_id, vote_type)
             VALUES ($1, $2, $3)
             ON CONFLICT (post_id, user_id)
             DO UPDATE SET vote_type = EXCLUDED.vote_type
             RETURNING *`,
            [id, user_id, vote_type]
        );

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove your vote from a post (requires login)
app.delete('/posts/:id/vote', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const result = await pool.query(
            `DELETE FROM votes WHERE post_id = $1 AND user_id = $2 RETURNING *`,
            [id, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No vote found to remove' });
        }

        res.json({ message: 'Vote removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
});