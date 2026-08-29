const express = require('express')
const router = express.Router();

const pool = require('../config/db')
const bcrypt = require('bcrypt')

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, branch, year, created_at FROM users",
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
      `SELECT id, username, email, branch, year, created_at 
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users
            (username, email, password_hash, branch, year) 
            VALUES 
            ($1, $2, $3, $4, $5)
            RETURNING id, username, email, branch, year, created_at`,
      [username, email, hashedPassword, branch, year],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
