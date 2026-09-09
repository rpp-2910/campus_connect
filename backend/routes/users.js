const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, branch, year, role, created_at FROM users",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, username, email, branch, year, role, created_at 
       FROM users WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { username, email, password, branch, year } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check if user already exists
    const existing = await pool.query(
      `SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = LOWER($2)`,
      [cleanEmail, cleanUsername]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }
      return res.status(400).json({ error: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users
        (username, email, password_hash, branch, year, role) 
       VALUES 
        ($1, $2, $3, $4, $5, 'student')
       RETURNING id, username, email, branch, year, role, created_at`,
      [cleanUsername, cleanEmail, hashedPassword, branch || null, year ? parseInt(year, 10) : null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
