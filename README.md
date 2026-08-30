# Campus Connect

> A full-stack student community platform combining discussion forums,
> semantic search, and Retrieval-Augmented Generation (RAG) to make
> campus knowledge easier to discover.

## Live Application

-   **Frontend:** https://campus-connect-six-self.vercel.app
-   **Backend API:** https://campus-connect-96xf.onrender.com

## Overview

Campus Connect is a college community platform where students can share
experiences, ask questions, participate in discussions, and discover
useful campus information.

Traditional keyword search can miss useful posts when students phrase
the same question differently. Campus Connect addresses this using
**semantic search with vector embeddings**. It also includes an **AI
Campus Assistant** that retrieves relevant student posts and uses them
as context before generating an answer.

The goal is to make student-generated knowledge searchable and useful
without replacing it with unsupported, generic AI responses.

## Features

### Community Platform

-   User registration and login
-   JWT-based authentication
-   Create and view student posts
-   Comment on discussions
-   Upvote and downvote posts
-   Organize discussions by category
-   View individual post details

### Semantic Search

Search queries are converted into vector embeddings and compared with
stored post embeddings using PostgreSQL and pgvector.

This allows the system to retrieve posts based on **semantic meaning**,
rather than relying only on exact keyword matches.

Search ranking incorporates semantic similarity, inferred post category,
and community vote weight.

### AI Campus Assistant

The AI assistant uses a Retrieval-Augmented Generation pipeline to
answer campus-specific questions using existing Campus Connect posts.

The flow is:

1.  Convert the student's question into an embedding.
2.  Retrieve semantically similar posts from PostgreSQL using pgvector.
3.  Rank the retrieved posts using relevance and community signals.
4.  Provide the relevant posts to Gemini as context.
5.  Generate an answer grounded in the retrieved student discussions.
6.  Return the relevant posts as sources alongside the answer.

When sufficiently relevant information is unavailable, the assistant can
indicate that the community has not discussed the topic instead of
producing an unsupported campus-specific response.

### Community-Aware Ranking

Community votes contribute to a post's retrieval weight, providing an
additional signal that can help useful community contributions rank more
prominently.

### Category-Aware Retrieval

The system can infer common campus-related categories from a query,
including:

-   Placements & Internships
-   Professors & Courses
-   Academics & Notes
-   Campus Life

Relevant categories can receive an additional ranking boost during
retrieval.

## Tech Stack

  Layer            Technologies
  ---------------- --------------------------------------
  Frontend         React, Vite, React Router, Axios
  Backend          Node.js, Express.js
  Database         PostgreSQL, pgvector
  Authentication   JWT, bcrypt
  AI / RAG         Google Gemini API, Gemini Embeddings
  Deployment       Vercel, Render

## Architecture

``` text
                         Campus Connect
                               |
                    +----------+----------+
                    |                     |
               React Frontend        Express Backend
                    |                     |
                    |              REST API Endpoints
                    |                     |
                    +---------------------+
                                          |
                          +---------------+---------------+
                          |                               |
                     PostgreSQL                      Gemini API
                          |                               |
                       pgvector                    Generation +
                          |                         Embeddings
                          |
                 Posts / Users / Votes /
                 Comments / Embeddings
```

## Semantic Search Flow

``` text
Student Search Query
        |
        v
Gemini Embedding Model
        |
        v
Query Vector
        |
        v
PostgreSQL + pgvector
        |
        v
Vector Similarity Search
        |
        v
Category + Community Signals
        |
        v
Ranked Relevant Posts
```

## RAG Assistant Flow

``` text
Student Question
        |
        v
Generate Query Embedding
        |
        v
Retrieve Relevant Posts
        |
        v
Rank and Filter Context
        |
        v
Construct Grounded Prompt
        |
        v
Gemini
        |
        v
Answer + Source Posts
```

## Project Structure

``` text
campus_connect/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── assistantController.js
│   ├── middleware/
│   ├── routes/
│   │   ├── assistant.js
│   │   ├── auth.js
│   │   ├── comments.js
│   │   ├── posts.js
│   │   ├── users.js
│   │   └── votes.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js
    │   ├── components/
    │   ├── pages/
    │   └── App.jsx
    └── package.json
```

## Getting Started

### Prerequisites

-   Node.js and npm
-   PostgreSQL database
-   pgvector extension
-   Google Gemini API key

### 1. Clone the Repository

``` bash
git clone https://github.com/rpp-2910/campus_connect.git
cd campus_connect
```

### 2. Backend Setup

``` bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

``` env
DB_USER=your_database_user
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=your_database_port

JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit `.env` or expose secret values in the repository.

Start the backend:

``` bash
node server.js
```

The backend runs locally at `http://localhost:5000`.

### 3. Frontend Setup

Open another terminal:

``` bash
cd frontend
npm install
npm run dev
```

Vite serves the frontend locally at `http://localhost:5173`.

For production deployment, configure:

``` env
VITE_API_URL=https://your-backend-domain.com
```

## API Overview

  Area             Purpose
  ---------------- -----------------------------------------------
  Authentication   Registration, login, and authenticated access
  Users            User-related operations
  Posts            Create and retrieve campus discussions
  Comments         Discussion responses
  Votes            Community upvotes and downvotes
  Search           Semantic retrieval of relevant posts
  Assistant        RAG-based campus question answering

## How Retrieval Works

Each searchable post is represented by an embedding and stored alongside
its content.

For a student query, Campus Connect:

1.  Generates a query embedding.
2.  Calculates vector similarity against stored post embeddings.
3.  Filters and ranks relevant results.
4.  Uses category and community signals as additional ranking
    information.
5.  Returns ranked posts to semantic search or supplies them as context
    to the AI assistant.

This separates **retrieval** from **generation**: the system first
determines which community information is relevant and only then asks
the language model to generate a grounded response.

## Deployment

The application is deployed as separate frontend and backend services:

-   **Frontend:** Vercel
-   **Backend:** Render
-   **Database:** Hosted PostgreSQL

The production frontend uses the `VITE_API_URL` environment variable to
communicate with the deployed backend.

Sensitive backend configuration is stored using deployment environment
variables rather than committed to source control.

## Key Concepts Demonstrated

-   Full-stack web application architecture
-   REST API design
-   React frontend development
-   Node.js and Express backend development
-   PostgreSQL relational data management
-   Authentication and authorization with JWT
-   Password hashing with bcrypt
-   Vector embeddings
-   pgvector similarity search
-   Semantic information retrieval
-   Retrieval-Augmented Generation (RAG)
-   Grounding LLM responses in application data
-   Community-aware ranking
-   Category-aware retrieval
-   Environment-based configuration
-   Cloud deployment

## Future Improvements

-   Hybrid semantic and keyword search
-   Query intent and metadata extraction
-   Academic-year-aware filtering
-   Improved search reranking
-   Search filters
-   Improved vote-aware ranking
-   Personalized recommendations
-   Saved posts and bookmarks
-   Notifications
-   Enhanced AI source visualization
-   Additional retrieval evaluation and tuning

## Motivation

Useful college information is often scattered across chats, informal
conversations, seniors' experiences, and old discussion threads. Finding
an answer can depend on knowing the right person or searching with
exactly the right words.

Campus Connect brings those discussions into a structured community
platform and adds semantic retrieval so that existing student knowledge
is easier to discover.

The AI assistant follows the same principle: **student discussions
remain the knowledge source, while AI helps retrieve and synthesize
them.**

## Security Notes

-   Passwords are hashed using bcrypt.
-   Protected requests use JWT-based authentication.
-   Secrets and database credentials are stored in environment
    variables.
-   `.env` files should never be committed to source control.

## Author

Built as a full-stack project exploring community platforms, semantic
search, PostgreSQL vector retrieval, and Retrieval-Augmented Generation.
