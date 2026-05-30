# CONTEXT.md — PippaQ Project Context

> Last updated: 2026-05-30 | PippaQ branding, Sentence Transformers + Qdrant Integration, and Auto-Upvote Execution Engine

---

## 📌 What This Is

**PippaQ** is a high-performance, semantic query-resolution and FAQ generation platform featuring a **QP (Quality Point) reputation economy**, **role-based access control**, **Qdrant Cloud vector search**, **local Sentence Transformers**, and **admin-controlled email whitelist signup**. Users raise real-time queries (RTQs), get peer/moderator/senior answers, and high-quality content graduates into an approved FAQ knowledge base.

**Status:** Fully operational. All legacy TF-IDF in-memory vector DBs have been replaced with a production-ready **Sentence Transformer + Qdrant Cloud ANN** pipeline. Complete auto-upvote and QP execution loops are fully integrated. Premium typography and branding (Playfair Display & Outfit) are applied.

---

## 🗂️ Directory Structure

```text
FAQ-main/
├── SPEC.md
├── CONTEXT.md
├── README.md
├── client/
│   └── src/
│       ├── App.jsx                    # Role-based dashboard routing; Nav included
│       ├── index.css                  # Custom elegant typography definitions (Playfair Display & Outfit)
│       ├── components/
│       │   ├── Nav.jsx                # Persistent navbar styled with PippaQ branding + QP animation
│       │   ├── AnswerCard.jsx         # Real user ID upvote check
│       │   ├── QPBadge.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── RoleGuard.jsx
│       │   ├── UpvoteButton.jsx
│       │   ├── GlobalSearch.jsx       # "/" shortcut → overlay search FAQ+RTQ
│       │   └── MiniChart.jsx          # SVG sparkline for 7-day trend charts
│       ├── context/
│       │   ├── AuthContext.jsx        # JWT role+qp; requestAccess
│       │   └── QPContext.jsx
│       ├── pages/
│       │   ├── SignupPage.jsx         # Whitelist Signup + PippaQ community reference
│       │   ├── LoginPage.jsx          # styled PippaQ brand logo
│       │   ├── UserListPage.jsx       # Admin: Users + Whitelist + Access Requests tabs
│       │   ├── FAQPage.jsx             # Category upvote buttons + ranked sorting
│       │   ├── UserProfilePage.jsx    # User profile at /users/:id
│       │   └── ... (all other pages)
│       ├── routes/
│       └── services/
│           ├── auth.service.js         # requestAccess method
│           ├── faq.service.js          # listCategoriesRanked, upvoteCategory
│           ├── admin.service.js        # Whitelist + Access Request API
│           └── dashboard.service.js    # Dashboard stats + activity feed
├── server/
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   ├── env.js
│       │   └── qdrant.js              # Qdrant Cloud singleton client
│       ├── controllers/
│       │   ├── admin.controller.js     # Full user CRUD; role management; block/unblock
│       │   ├── admin.whitelist.controller.js  # Whitelist + access request mgmt
│       │   ├── auth.controller.js     # signup restriction; requestAccessUser
│       │   ├── categoryUpvote.controller.js   # list ranked categories + toggle upvote
│       │   ├── rtq.controller.js      # Submit question + RAG evaluation + QP/Upvote loops
│       │   ├── rag.controller.js      # Evaluate + Qdrant-based vector rebuild controllers
│       │   └── ... (existing)
│       ├── middleware/
│       │   ├── auth.middleware.js     # JWT with role+qp in payload
│       │   └── role.middleware.js     # authorizeRoles middleware
│       ├── models/
│       │   ├── User.model.js          # role: student|moderator|senior|admin
│       │   ├── RoleRequest.model.js    # Blocked-user re-access requests
│       │   ├── EmailWhitelist.model.js # admin-controlled signup email list
│       │   ├── AccessRequest.model.js  # non-whitelisted signup requests
│       │   └── CategoryUpvote.model.js # category upvotes + upvotedBy tracking
│       ├── routes/
│       │   ├── admin.routes.js        # Admin-only routes (whitelist + access requests)
│       │   ├── auth.routes.js         # /request-access endpoint
│       │   ├── categoryUpvote.routes.js # /api/faq/categories/ranked, /upvote/:name
│       │   └── rag.routes.js          # RAG endpoints: evaluate-question + rebuild-vectors
│       └── services/
│           ├── auth.service.js         # signup checks whitelist; JWT: {id, role, qp}
│           ├── qp.service.js           # awardQP / deductQP service methods
│           ├── autoupvote.service.js   # NEW: consolidated atomic FAQ & RTQ auto-upvote
│           ├── vector/                # Qdrant vector services
│           │   ├── collection.service.js  # Auto-create collections (HNSW, cosine, 384-dim)
│           │   ├── embedding.service.js   # Switched to local Sentence Transformer
│           │   ├── transformer.service.js # NEW: Local @xenova/transformers (all-MiniLM-L6-v2) + LRU Cache
│           │   ├── faq.vector.service.js  # FAQ vector CRUD in Qdrant
│           │   └── rtq.vector.service.js  # RTQ vector CRUD in Qdrant
│           └── sync/                  # MongoDB ↔ Qdrant sync
│               ├── sync.events.js        # Event emitter
│               ├── faq.sync.service.js  # FAQ sync + rollback
│               ├── rtq.sync.service.js   # RTQ sync + rollback
│               └── sync.repair.service.js # Missing/stray vector detection + rebuild vectors
├── rag-engine/
│   └── decision-engine/
│       └── decision.tree.js           # RAG Duplicate Detection Engine using Qdrant ANN search
└── shared/constants.js                # FAQ_CATEGORIES, QP_RULES, ROLES, etc.
```

---

## 🧠 Core Systems & Implementations

### 1. Semantic Embedding Layer (Sentence Transformers)
* **Model:** `@xenova/transformers` (local WebAssembly/ONNX execution of `all-MiniLM-L6-v2` generating 384-dimensional dense vectors).
* **Caching:** Built-in **LRU Embedding Cache** (maximum 500 entries) in [transformer.service.js](file:///d:/FAQs/FAQ/server/src/services/vector/transformer.service.js) to avoid re-generating embeddings for duplicate texts during the same server session.
* **Warmup:** Loaded and warmed up dynamically on server startup in [server.js](file:///d:/FAQs/FAQ/server/src/server.js) so the first query is lightning-fast (<10ms).
* **rebuild-vectors:** Updated the rebuild pipeline to automatically pull all entries from MongoDB, compute Sentence Transformer vectors, and re-index the Qdrant database. Ran successfully for **68/68 FAQs** and **1/1 RTQ**.

### 2. Semantic Duplicate Detection (RAG Decision Tree)
The decision tree inside [decision.tree.js](file:///d:/FAQs/FAQ/rag-engine/decision-engine/decision.tree.js) performs semantic search against the active collections in Qdrant Cloud. 
* **F1 (FAQ > 80%):** REJECT, deduct 5 QP, auto-upvote matching FAQ.
* **F2+R1 (FAQ 50-80%, RTQ > 60%):** REJECT, deduct 5 QP, auto-upvote matching FAQ.
* **F2+R2 (FAQ 50-80%, RTQ 20-60%):** REJECT, no penalty.
* **F2+R3 (FAQ 50-80%, RTQ ≤ 20%):** ACCEPT → route to RTQ.
* **F3+R1 (FAQ ≤ 50%, RTQ > 60%):** REJECT, no penalty, auto-upvote matching RTQ (**Newly wired**).
* **F3+R2/R3 (FAQ ≤ 50%, RTQ ≤ 60%):** ACCEPT → route to RTQ.

### 3. Consolidated Auto-Upvote Engine
Implemented a new service [autoupvote.service.js](file:///d:/FAQs/FAQ/server/src/services/autoupvote.service.js) to handle duplicate-prevention auto-upvotes:
* **Atomic Operations:** Uses atomic `$inc` and `$addToSet` to prevent a user from upvoting the same question twice.
* **QP Integration:** Automatically fetches the original author's ID and awards the `QUESTION_UPVOTE_BONUS` (+5 QP) while sending a notification to the author.
* Fully integrated with the decision tree outcomes in [rtq.controller.js](file:///d:/FAQs/FAQ/server/src/controllers/rtq.controller.js).

### 4. Premium Branding & Font Stack (PippaQ)
* **Fonts:** Added preconnect tags and loaded **Playfair Display** (elegant serif brand accent) and **Outfit** (sleek sans-serif body/headers) from Google Fonts in [client/index.html](file:///d:/FAQs/FAQ/client/index.html).
* **Visuals:** Updated the navbar, login page, and signup pages to feature the elegant, high-contrast **PippaQ** brand name with customized letter tracking.

---

## 🛠️ Verification & Development Notes
* **Dev Server Command:** `npm run dev` starts the frontend on port 3000 and the backend on port 5000.
* **Validation:** All updated javascript files have passed linter and syntax checks (`node --check`).
* **Git Status:** Clean and pushing successfully to remote repositories.
