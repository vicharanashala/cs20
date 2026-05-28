<<<<<<< HEAD
# Q&A Platform

A semantic query-resolution and FAQ generation platform with a **QP (Quality Point) reputation economy** and **role-based access control**. Built with React, Express, MongoDB, and a custom RAG engine.

---

## 🏗️ Architecture

```
D:\faq\
├── client/          React + Vite frontend (Tailwind CSS)
├── server/          Express.js backend (MongoDB/Mongoose)
├── rag-engine/      Custom TF-IDF RAG pipeline (no external AI API)
├── shared/          Shared constants (QP rules, RAG thresholds, roles)
└── docs/            Project documentation
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env — set your MongoDB URI and JWT secret
```

### 3. Start MongoDB

Make sure MongoDB is running locally or update `MONGO_URI` in `server/.env`.

### 4. Run the app

```bash
npm run dev
```

- **Client**: http://localhost:3000
- **Server**: http://localhost:5000

---

## 👥 Roles & Access

| Role | Capabilities |
|------|-------------|
| **Student** | Ask RTQ questions, answer (once per question), upvote, track own questions |
| **Moderator** | + Approve answers, accept/reject questions, mark trendy |
| **Senior** | + Create FAQs manually, convert RTQ→FAQ, delete any content, remove RTQs |
| **Admin** | + Manage email whitelist, assign/revoke roles |

---

## 💰 QP (Quality Point) Economy

### Earning QP
| Action | QP |
|--------|-----|
| Answer a question | +2 |
| Answer approved by Moderator/Senior | +5 |
| Answer selected for FAQ | +10 bonus |
| Question accepted (valid RTQ entry) | +5 |
| Question promoted to FAQ | +20 |
| Senior creates new FAQ manually | +15 |

### Penalties
| Action | QP |
|--------|-----|
| Duplicate FAQ match (F1) | -5 |
| F2+R1 match | -5 |
| Answer removed by Senior | -3 |
| Question removed | -5 |

### Thresholds
- **QP < 50** → Cannot raise questions
- **QP ≥ 500** → Auto-request Moderator promotion

---

## 🧠 RAG Decision Tree

Questions are evaluated against the FAQ and RTQ vector stores:

```
User Question → TF-IDF Embed (384-dim) → Compare with FAQ/RTQ vectors

F1: FAQ similarity > 80%   → REJECT + -5 QP (duplicate)
F2: 50–80% FAQ similarity
  + R1: RTQ > 60%          → REJECT + -5 QP (similar RTQ exists)
  + R2: 20–60% RTQ         → REJECT (no penalty)
  + R3: RTQ ≤ 20%          → ACCEPT → Add to RTQ
F3: FAQ ≤ 50% similarity
  + R1: RTQ > 60%          → REJECT (no penalty)
  + R2/R3: RTQ ≤ 60%       → ACCEPT → Add to RTQ
```

> Uses TF-IDF character n-grams (no external AI API required). Swap for OpenAI/sentence-transformers in production.

---

## 📂 Key Routes

| Route | Description |
|-------|-------------|
| `/api/auth/signup` | Register + email OTP |
| `/api/auth/login` | JWT login |
| `/api/faq` | FAQ CRUD + upvote |
| `/api/rtq` | RTQ list + submit question |
| `/api/rtq/:id/answer` | Add answer to RTQ |
| `/api/rag/evaluate-question` | Run RAG decision tree |
| `/api/users` | User management |
| `/api/qp/my-score` | Current QP balance |
| `/api/admin/assign-role` | Admin: change user role |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Tailwind CSS
- **Backend**: Express.js, Mongoose, JWT (bcryptjs for passwords)
- **RAG Engine**: Custom TF-IDF n-gram embedder (384-dim), cosine similarity, in-memory vector DB
- **Database**: MongoDB (vectors stored in documents — swap for Qdrant/Pinecone in production)
- **Dev**: `concurrently` to run client + server together

---

## 📝 Notes

- OTP is **console-logged** in development. Wire to an email provider (SendGrid, Resend) for production.
- Vector DB is **in-memory** (vectors stored in MongoDB documents). For production, swap to Qdrant or Pinecone.
- RESTRICTED users (flagged by seniors) are blocked from asking questions and answering.

---

*Maintained with git. Run `git log --oneline` for full history.*
=======
# FAQ
>>>>>>> 655d58505ffd99f5232d6f5c4fb351452148d89f
