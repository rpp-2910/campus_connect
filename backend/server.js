const express = require('express')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg')
require('dotenv').config()
const app = express()
app.use(express.json());
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})
const PORT = process.env.PORT || 5000

app.get('/', (req,res)=>{
    res.send("api is running");
});

app.get('/users', async (req,res)=>{
    try{
        const result = await pool.query(
            'SELECT * FROM users'
        );

        res.json(result.rows);
    }
    catch(err){
        res.status(500).json({error: err.message});
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
            RETURNING *`,
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

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    }

    catch(err){
        res.status(500).json({
            error: err.message
        });
    }
});

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
});

