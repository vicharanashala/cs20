# PippaQ — Premium Q&A & FAQ Platform

A high-performance, semantic query-resolution and FAQ generation platform with a **QP (Quality Point) reputation economy**, **role-based access control**, and a production-ready **RAG (Retrieval-Augmented Generation) duplicate detection engine**.

Built with React, Express, MongoDB, Qdrant Cloud, and local Sentence Transformers.

---

## 🏗️ Architecture

```text
D:\faq\
├── client/          React + Vite frontend (Tailwind CSS + Premium Typography)
├── server/          Express.js backend (MongoDB/Mongoose + Qdrant Integration)
├── rag-engine/      Semantic Decision Engine (Sentence Transformer + Qdrant ANN)
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
# Edit server/.env — set your MongoDB URI, JWT secret, and QDRANT_URL
```

### 3. Start MongoDB & Qdrant

Ensure your local or cloud MongoDB and Qdrant instances are accessible.

### 4. Run the app

```bash
npm run dev
```

* **Client**: http://localhost:3000
* **Server**: http://localhost:5000

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
* **QP < 50** → Cannot raise questions.
* **QP ≥ 500** → Auto-request Moderator promotion.

---

## 🧠 RAG Duplicate Detection Engine

Questions are evaluated semantically against the FAQ and RTQ collections stored in Qdrant:

```text
User Question 
      │
      ▼
Generate Embedding ──► Local Sentence Transformer (all-MiniLM-L6-v2, 384-dim)
      │
      ▼
Qdrant HNSW ANN Search ──► Compare with FAQ/RTQ Collections
      │
      ▼
Apply Decision Tree Rules:
┌───────────────────────────────┬───────────────────────────────┐
│ F1: FAQ similarity > 80%      │ REJECT, -5 QP, upvote FAQ     │
├───────────────────────────────┼───────────────────────────────┤
│ F2: FAQ similarity 50–80%     │                               │
│  ├── R1: RTQ > 60%            │ REJECT, -5 QP, upvote FAQ     │
│  ├── R2: RTQ 20–60%           │ REJECT (no penalty)           │
│  └── R3: RTQ ≤ 20%            │ ACCEPT → Route to RTQ         │
├───────────────────────────────┼───────────────────────────────┤
│ F3: FAQ similarity ≤ 50%      │                               │
│  ├── R1: RTQ > 60%            │ REJECT (no penalty), upvote RTQ│
│  └── R2/R3: RTQ ≤ 60%         │ ACCEPT → Route to RTQ         │
└───────────────────────────────┴───────────────────────────────┘
```

> **Performance Optimization:** Includes an **LRU Embedding Cache** (500 entries) and model warmup on server startup to ensure lightning-fast semantic queries under 10ms.

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

* **Frontend**: React 18, Vite, React Router v6, Axios, Tailwind CSS + Premium Typography (Playfair Display & Outfit)
* **Backend**: Express.js, Mongoose, JWT (bcryptjs)
* **Vector Store**: Qdrant Cloud (HNSW indexes, cosine distance, metadata payload filters)
* **Embeddings**: Native Node.js `@xenova/transformers` (local WebAssembly ONNX execution of `all-MiniLM-L6-v2`)
* **Dev Tools**: `concurrently` to run client + server together
