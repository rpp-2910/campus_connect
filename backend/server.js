const express = require('express')
const cors = require('cors');
require("dotenv").config();

const assistantRoutes = require('./routes/assistant');
const userRoutes = require('./routes/users')
const authRoutes = require('./routes/auth');
const authPosts = require('./routes/posts');
const authComments = require("./routes/comments");
const authVotes = require("./routes/votes");

const app = express()

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173', 'https://campus-connect-six-self.vercel.app'],
  credentials: true
}));

app.use('/', assistantRoutes);
app.use("/users", userRoutes);
app.use("/", authRoutes);
app.use("/posts", authPosts);
app.use("/", authComments);
app.use("/", authVotes);

const PORT = process.env.PORT || 5000;

app.get('/', (req,res)=>{
    res.send("api is running");
});

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
});