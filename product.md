# PippaQ — Product Specification

> **Version:** 1.0  
> **Last updated:** 2026-06-09  
> **Authors:** Vicharanashala Team  
> **Repository:** [github.com/vicharanashala/cs20](https://github.com/vicharanashala/cs20)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Environment Configuration](#3-environment-configuration)
4. [Architecture Overview](#4-architecture-overview)
5. [Directory Structure](#5-directory-structure)
6. [Roles & Permissions Matrix](#6-roles--permissions-matrix)
7. [QP (Quality Point) Economy](#7-qp-quality-point-economy)
8. [RAG Duplicate Detection Engine](#8-rag-duplicate-detection-engine)
9. [Database Models (MongoDB)](#9-database-models-mongodb)
10. [Vector Store (Qdrant Cloud)](#10-vector-store-qdrant-cloud)
11. [API Reference](#11-api-reference)
12. [Frontend Pages](#12-frontend-pages)
13. [Shared Component Library](#13-shared-component-library)
14. [Design System](#14-design-system)
15. [User Flows](#15-user-flows)
16. [System Rules & Business Logic](#16-system-rules--business-logic)
17. [Sync & Repair Infrastructure](#17-sync--repair-infrastructure)
18. [Scripts & Utilities](#18-scripts--utilities)
19. [System Guarantees](#19-system-guarantees)
20. [Getting Started](#20-getting-started)

---

## 1. Product Overview

**PippaQ** is a semantic query-resolution and FAQ generation platform built for academic/internship communities. It enables users to raise real-time queries (RTQs), receive peer/moderator/senior answers, and graduate high-quality content into a curated FAQ knowledge base.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| **Semantic Intelligence** | Every question is evaluated against existing FAQ and RTQ collections using transformer-based semantic embeddings before acceptance |
| **QP Reputation Economy** | A Quality Point system rewards contributions, penalizes duplicates, gates privileges, and drives auto-promotions |
| **Role-Based Hierarchy** | Four-tier role system (Student → Moderator → Senior → Admin) with progressively increasing privileges |
| **Bidirectional Traceability** | Every FAQ conversion maintains a bidirectional link to its source RTQ for full audit trails |
| **Admin-Controlled Access** | Email whitelist signup gate with access request flow for non-whitelisted users |

### Product Feel

> A calm, professional academic-tech internal tool. Think **Linear meets Notion** — minimal, structured, trustworthy. Premium typography (Playfair Display & Outfit) with glassmorphism, gradient accents, and micro-animations.

---

## 2. Tech Stack & Dependencies

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.x | UI framework |
| Vite | 5.1.x | Build tool with HMR |
| React Router | v6 (6.22.x) | Client-side routing |
| Axios | 1.6.x | HTTP client with interceptors |
| Tailwind CSS | 3.4.x | Utility-first CSS framework |
| Lucide React | 0.344.x | Icon library |
| clsx | 2.1.x | Conditional className utility |
| PostCSS | 8.4.x | CSS processing |
| Autoprefixer | 10.4.x | CSS vendor prefixing |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | 4.18.x | HTTP server framework |
| Mongoose | 8.2.x | MongoDB ODM |
| jsonwebtoken | 9.0.x | JWT authentication |
| bcryptjs | 2.4.x | Password hashing (12 salt rounds) |
| cors | 2.8.x | Cross-origin resource sharing |
| dotenv | 16.4.x | Environment variable management |
| @qdrant/js-client-rest | 1.18.x | Qdrant Cloud vector DB client |
| @xenova/transformers | 2.17.x | Local sentence transformer (WebAssembly/ONNX) |

### Infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB (Atlas) | Document database — users, FAQs, RTQs, transactions, notifications |
| Qdrant Cloud | Vector database — semantic search with HNSW indexes and cosine distance |

### Dev Tools

| Tool | Purpose |
|------|---------|
| concurrently | Run client + server in parallel during development |
| Node.js `--watch` | Auto-restart server on file changes |
| Vite HMR | Hot module replacement for frontend |

---

## 3. Environment Configuration

### Required Environment Variables (`server/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/qa-platform

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.cloud
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_FAQ_COLLECTION=faq_collection
QDRANT_RTQ_COLLECTION=rtq_collection

# Admin Bootstrap
INITIAL_ADMIN_EMAIL=admin@example.com
```

### Hardcoded Configuration

| Setting | Value | Location |
|---------|-------|----------|
| OTP expiry | 10 minutes | `server/src/config/env.js` |
| Vector dimension | 384 | `server/src/config/env.js` |
| LRU cache size | 500 entries | `server/src/services/vector/transformer.service.js` |
| Embedding model | `Xenova/all-MiniLM-L6-v2` | `server/src/services/vector/transformer.service.js` |
| Password hash rounds | 12 | `server/src/models/User.model.js` |
| Request body limit | 10 MB | `server/src/app.js` |
| DNS servers | `8.8.8.8`, `8.8.4.4` | `server/src/server.js` |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│                      http://localhost:3000                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐ │
│  │ AuthCtx   │  │ QPCtx     │  │ Services  │  │ Pages (18)    │ │
│  │ JWT+Role  │  │ QP State  │  │ Axios API │  │ Components(10)│ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (JSON)
┌────────────────────────────▼────────────────────────────────────┐
│                     SERVER (Express.js)                          │
│                    http://localhost:5000                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Middleware │  │Controllers│  │ Services  │  │ Routes (12)  │ │
│  │ Auth/Role │  │ 13 files  │  │ QP/Notify │  │ REST paths   │ │
│  │ QP Guard  │  │           │  │ AutoUpvote│  │              │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Vector Layer                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │ │
│  │  │ Transformer  │  │ Embedding    │  │ FAQ/RTQ Vector    │ │ │
│  │  │ LRU Cache    │  │ Pipeline     │  │ CRUD Services     │ │ │
│  │  └──────────────┘  └──────────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────┐                                │
│  │         Sync Layer           │                                │
│  │  FAQ Sync | RTQ Sync | Repair│                                │
│  └──────────────────────────────┘                                │
└─────────────┬────────────────────────────┬──────────────────────┘
              │                            │
   ┌──────────▼──────────┐    ┌────────────▼──────────────┐
   │ MongoDB Atlas        │    │ Qdrant Cloud               │
   │ - Users, FAQs, RTQs │    │ - faq_collection (384-dim) │
   │ - Answers, QP Txns  │    │ - rtq_collection (384-dim) │
   │ - Notifications      │    │ - HNSW + Cosine distance   │
   └──────────────────────┘    └─────────────────────────────┘

┌──────────────────────────────────────────┐
│           RAG Decision Engine            │
│  decision.tree.js                        │
│  - Generates embedding via Transformer   │
│  - Searches FAQ collection (top-1)       │
│  - Searches RTQ collection (top-1)       │
│  - Returns: ACCEPT/REJECT + flags        │
└──────────────────────────────────────────┘
```

---

## 5. Directory Structure

```
PippaQ/
├── package.json                              # Root: npm scripts (dev, install:all, build)
├── SPEC.md                                   # Original project specification
├── CONTEXT.md                                # Detailed implementation context & changelog
├── README.md                                 # Project README with screenshots
├── product.md                                # This file
│
├── shared/
│   └── constants.js                          # ROLES, USER_STATUS, QUESTION_STATUS,
│                                             # RTQ_STATUS, QP_RULES, QP_THRESHOLDS,
│                                             # RAG_THRESHOLDS, FAQ_CATEGORIES
│
├── client/                                   # React + Vite frontend
│   ├── index.html                            # Entry HTML with Google Fonts preconnect
│   ├── package.json                          # Client dependencies
│   ├── vite.config.js                        # Vite configuration
│   ├── tailwind.config.js                    # Tailwind CSS configuration
│   ├── postcss.config.js                     # PostCSS configuration
│   ├── public/                               # Static assets (favicon, manifest)
│   └── src/
│       ├── main.jsx                          # React entry point with BrowserRouter
│       ├── App.jsx                           # Route definitions + layout + guards
│       ├── index.css                         # Global styles + design system tokens
│       ├── components/                       # 10 reusable UI components
│       │   ├── Nav.jsx                       # Persistent navbar with QP animation
│       │   ├── GlobalSearch.jsx              # "/" shortcut overlay (FAQ + RTQ search)
│       │   ├── UpvoteButton.jsx              # Toggleable upvote with optimistic UI
│       │   ├── Avatar.jsx                    # Role-colored avatar with initials
│       │   ├── Badge.jsx                     # Status badges (accepted/rejected/review)
│       │   ├── AnswerCard.jsx                # Answer display with upvote checks
│       │   ├── QuestionCard.jsx              # Question card component
│       │   ├── EmptyState.jsx                # Illustrated empty state
│       │   ├── SkeletonLoader.jsx            # Shimmer loading placeholders
│       │   ├── BackToTop.jsx                 # Smooth scroll-to-top button
│       │   ├── Breadcrumb.jsx                # Navigation breadcrumb trail
│       │   ├── MiniChart.jsx                 # SVG sparkline for 7-day trends
│       │   ├── QPBadge.jsx                   # QP display badge
│       │   ├── RoleGuard.jsx                 # Role-based rendering guard
│       │   ├── SegmentedControl.jsx          # Tab-like toggle switcher
│       │   ├── ErrorBoundary.jsx             # React error boundary wrapper
│       │   └── Toast.jsx                     # Toast notification provider + component
│       ├── context/
│       │   ├── AuthContext.jsx               # JWT auth state, login/logout, refreshUser
│       │   └── QPContext.jsx                 # QP state management
│       ├── pages/                            # 18 page components
│       │   ├── LoginPage.jsx                 # PippaQ branded login form
│       │   ├── SignupPage.jsx                # Whitelist signup + OTP + access request
│       │   ├── StudentDashboard.jsx          # Student/Moderator dashboard
│       │   ├── SeniorDashboard.jsx           # Senior/Admin dashboard
│       │   ├── FAQPage.jsx                   # Knowledge base with categories & upvotes
│       │   ├── FAQEditPage.jsx               # Edit FAQ entry (Senior/Admin)
│       │   ├── AddFAQPage.jsx                # Create new FAQ manually (Senior/Admin)
│       │   ├── RTQPage.jsx                   # Real-time questions list + moderation
│       │   ├── RTQDetailPage.jsx             # Full question detail + answers + actions
│       │   ├── RaiseQuestionPage.jsx          # Submit question through RAG engine
│       │   ├── TrackQuestionPage.jsx          # Track own submitted questions
│       │   ├── WorkingHistoryPage.jsx         # Senior's RTQ→FAQ conversion history
│       │   ├── UserListPage.jsx              # Leaderboard + admin user management
│       │   ├── UserProfilePage.jsx           # Public user profile at /users/:id
│       │   ├── ProfilePage.jsx               # Own profile page
│       │   ├── NotificationsPage.jsx         # Activity feed & notification list
│       │   ├── QPHistoryPage.jsx             # QP transaction log
│       │   └── AboutPage.jsx                 # Interactive About page with symbolism
│       ├── routes/
│       │   └── AppRoutes.jsx                 # Route configuration
│       └── services/                         # API service modules
│           ├── api.js                        # Axios instance with auth interceptors
│           ├── auth.service.js               # Signup, login, OTP, requestAccess
│           ├── faq.service.js                # FAQ CRUD + conversion requests
│           ├── rtq.service.js                # RTQ operations
│           ├── admin.service.js              # Whitelist + access request APIs
│           ├── dashboard.service.js          # Dashboard stats + activity feed
│           ├── notification.service.js       # Notification API methods
│           ├── user.service.js               # User API methods
│           ├── question.service.js           # Question tracking API
│           ├── qp.service.js                 # QP score + history API
│           └── rag.service.js                # RAG evaluation API
│
├── server/                                   # Express.js backend
│   ├── .env.example                          # Environment template
│   ├── package.json                          # Server dependencies
│   └── src/
│       ├── server.js                         # Entry point: DB connect, Qdrant init, warmup
│       ├── app.js                            # Express app setup, middleware, route mounting
│       ├── config/
│       │   ├── db.js                         # MongoDB connection via Mongoose
│       │   ├── env.js                        # Environment configuration object
│       │   └── qdrant.js                     # Qdrant Cloud singleton client + retry logic
│       ├── middleware/
│       │   ├── auth.middleware.js            # JWT verification + user lookup + status check
│       │   ├── role.middleware.js            # authorizeRoles(...allowedRoles) guard
│       │   └── qp.middleware.js              # requireQP(min) + requireNotRestricted guards
│       ├── models/                           # 12 Mongoose models
│       │   ├── User.model.js                 # User schema with roles, QP, status
│       │   ├── FAQ.model.js                  # FAQ with review/trending flags
│       │   ├── RTQ.model.js                  # RTQ with bidirectional FAQ link
│       │   ├── Answer.model.js               # Approvals/rejections + review flag
│       │   ├── Question.model.js             # User question tracking
│       │   ├── QPTransaction.model.js        # QP earn/deduct ledger
│       │   ├── Notification.model.js         # Role-scoped notifications
│       │   ├── FAQConversionRequest.model.js # Moderator→Senior conversion requests
│       │   ├── EmailWhitelist.model.js       # Admin-controlled signup email gate
│       │   ├── AccessRequest.model.js        # Non-whitelisted signup requests
│       │   ├── RoleRequest.model.js          # Blocked user re-access requests
│       │   └── CategoryUpvote.model.js       # Category ranking by upvotes
│       ├── controllers/                      # 13 controller files
│       │   ├── auth.controller.js            # Signup, OTP, login, access requests
│       │   ├── faq.controller.js             # FAQ CRUD + review/trending toggles
│       │   ├── faq-conversion.controller.js  # Conversion request workflow
│       │   ├── rtq.controller.js             # RTQ submit + moderation + QP loops
│       │   ├── rag.controller.js             # RAG evaluation + vector rebuild
│       │   ├── admin.controller.js           # User CRUD, roles, block/unblock
│       │   ├── admin.whitelist.controller.js # Whitelist + access request management
│       │   ├── answer.controller.js          # Answer operations
│       │   ├── categoryUpvote.controller.js  # Category ranking + upvotes
│       │   ├── notification.controller.js    # Notification list + mark read
│       │   ├── qp.controller.js              # QP score + history
│       │   ├── question.controller.js        # Question tracking operations
│       │   └── user.controller.js            # User profile operations
│       ├── routes/                           # 12 route definition files
│       │   ├── auth.routes.js                # /api/auth/*
│       │   ├── faq.routes.js                 # /api/faq/*
│       │   ├── rtq.routes.js                 # /api/rtq/*
│       │   ├── admin.routes.js               # /api/admin/*
│       │   ├── rag.routes.js                 # /api/rag/*
│       │   ├── qp.routes.js                  # /api/qp/*
│       │   ├── user.routes.js                # /api/users/*
│       │   ├── question.routes.js            # /api/questions/*
│       │   ├── notification.routes.js        # /api/notifications/*
│       │   ├── categoryUpvote.routes.js      # /api/faq/categories/*
│       │   ├── vector.routes.js              # /api/vector/* (health, rebuild, validate)
│       │   └── dashboard.routes.js           # /api/dashboard/* (stats, activity)
│       ├── services/
│       │   ├── auth.service.js               # Signup logic + OTP + JWT + whitelist check
│       │   ├── qp.service.js                 # awardQP / deductQP + auto-promotion
│       │   ├── autoupvote.service.js         # Atomic FAQ & RTQ auto-upvote on duplicates
│       │   ├── notification.service.js       # Notification CRUD
│       │   ├── vector/                       # Qdrant vector services
│       │   │   ├── transformer.service.js    # Sentence Transformer + LRU embedding cache
│       │   │   ├── embedding.service.js      # Embedding pipeline (text → 384-dim vector)
│       │   │   ├── faq.vector.service.js     # FAQ vector CRUD in Qdrant
│       │   │   ├── rtq.vector.service.js     # RTQ vector CRUD in Qdrant
│       │   │   ├── collection.service.js     # Qdrant collection lifecycle management
│       │   │   └── similarity.service.js     # Similarity search utilities
│       │   └── sync/                         # MongoDB ↔ Qdrant synchronization
│       │       ├── sync.events.js            # Event emitter for sync lifecycle
│       │       ├── faq.sync.service.js       # FAQ sync + rollback
│       │       ├── rtq.sync.service.js       # RTQ sync + rollback
│       │       └── sync.repair.service.js    # Missing/stray vector detection + rebuild
│       ├── scripts/
│       │   └── rebuild-faq-vectors.js        # Standalone FAQ vector rebuild script
│       └── utils/
│           └── logger.js                     # Logging utility
│
├── rag-engine/                               # RAG Decision Engine
│   ├── index.js                              # RAG engine entry point
│   ├── decision-engine/
│   │   └── decision.tree.js                  # Semantic duplicate detection via Qdrant ANN
│   ├── embedding/
│   │   ├── embedder.js                       # Legacy TF-IDF embedder
│   │   ├── transformer.js                    # Transformer wrapper
│   │   └── vocab-faq.json                    # Legacy vocabulary file
│   ├── pipeline/
│   │   └── question.pipeline.js              # Question processing pipeline
│   ├── similarity/
│   │   └── cosine.similarity.js              # Cosine similarity computation
│   └── vectorDB/
│       ├── faq-vector.js                     # Legacy FAQ vector operations
│       └── rtq-vector.js                     # Legacy RTQ vector operations
│
├── scripts/
│   ├── migrate-categories.js                 # Category normalization migration
│   └── bulk-import.js                        # Bulk FAQ import utility
│
└── assets/
    ├── PippaQ1.webp                          # PippaQ logo
    ├── favicon_io/                           # Favicon files
    └── UI_Visuals/                           # App screenshots (34 images)
```

---

## 6. Roles & Permissions Matrix

### Role Definitions

| Role | DB Value | Color | Description |
|------|----------|-------|-------------|
| Student | `student` | Slate | Base role — ask questions, provide answers, upvote |
| Moderator | `moderator` | Purple/Blue | Elevated peer — approve/reject answers and questions |
| Senior | `senior` | Blue/Purple | Content authority — create FAQs, convert RTQ→FAQ, manage content |
| Admin | `admin` | Red | System administrator — manage users, whitelist, roles |

### Detailed Permissions

| Action | Student | Moderator | Senior | Admin |
|--------|---------|-----------|--------|-------|
| **Questions** | | | | |
| Raise a question (RTQ) | ✅ | ✅ | ✅ | ❌ |
| View RTQs | ✅ | ✅ | ✅ | ✅ |
| Track own questions | ✅ | ✅ | ❌ | ❌ |
| Update own question status | ✅ (owner) | ✅ (owner) | ✅ (owner) | ✅ (owner) |
| **Answers** | | | | |
| Answer a question (1× per question) | ✅ | ✅ | ✅ | ✅ |
| Upvote an answer | ✅ | ✅ | ✅ | ✅ |
| Approve an answer | ❌ | ✅ | ✅ | ✅ |
| Reject an answer | ❌ | ✅ | ✅ | ✅ |
| Mark answer for review | ❌ | ✅ | ✅ | ✅ |
| **FAQs** | | | | |
| View approved FAQs | ✅ | ✅ | ✅ | ✅ |
| Upvote a FAQ | ✅ | ✅ | ✅ | ✅ |
| Create new FAQ | ❌ | ❌ | ✅ | ✅ |
| Edit a FAQ | ❌ | ❌ | ✅ | ✅ |
| Delete a FAQ | ❌ | ❌ | ✅ | ✅ |
| Convert RTQ → FAQ | ❌ | ❌ | ✅ | ✅ |
| Request FAQ conversion | ❌ | ✅ | ✅ | ❌ |
| Review conversion requests | ❌ | ❌ | ✅ | ✅ |
| Flag FAQ for review | ❌ | ✅ | ✅ | ✅ |
| Toggle FAQ trending | ❌ | ✅ | ✅ | ✅ |
| **Moderation** | | | | |
| Accept a question | ❌ | ✅ | ✅ | ✅ |
| Reject a question | ❌ | ✅ | ✅ | ✅ |
| Mark question for review | ❌ | ✅ | ✅ | ✅ |
| Permanently remove RTQ | ❌ | ❌ | ✅ | ✅ |
| **Administration** | | | | |
| Manage email whitelist | ❌ | ❌ | ❌ | ✅ |
| Approve access requests | ❌ | ❌ | ❌ | ✅ |
| Approve/reject users | ❌ | ❌ | ✅ | ✅ |
| Assign/revoke roles | ❌ | ❌ | ❌ | ✅ |
| Block/unblock users | ❌ | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ❌ | ✅ |
| Rebuild vectors | ❌ | ❌ | ✅ | ✅ |

---

## 7. QP (Quality Point) Economy

### Starting Balance

| Event | QP Awarded |
|-------|-----------|
| Account activation (OTP verified) | **+100 QP** |
| Access request approved by admin | **+100 QP** |

### Earning Rules

| Action | QP | Recipient | Constant |
|--------|-----|-----------|----------|
| Answer a question | +2 | Answerer | `ANSWER_QUESTION` |
| Answer approved by Moderator/Senior | +5 | Answerer | `ANSWER_APPROVED` |
| Answer selected for FAQ | +10 | Answerer | `ANSWER_SELECTED_FOR_FAQ` |
| Question accepted (valid RTQ) | +5 | Questioner | `QUESTION_ACCEPTED` |
| Question promoted to FAQ | +20 | Questioner | `QUESTION_ADDED_TO_FAQ` |
| Senior converts RTQ → FAQ | +10 | Senior | `SENIOR_CONVERT_RTQ_TO_FAQ` |
| Senior creates new FAQ manually | +15 | Senior | `SENIOR_CREATE_NEW_FAQ` |
| Moderator approves an answer | +3 | Moderator | (hardcoded in controller) |
| Moderator accepts a question | +3 | Moderator | (hardcoded in controller) |
| Moderator rejects a question | +3 | Moderator | (hardcoded in controller) |
| Question upvote bonus (auto-upvote) | +1 | Question author | `QUESTION_UPVOTE_BONUS` |
| Answer upvote bonus | +1 | Answer author | `ANSWER_UPVOTE_BONUS` |

### Penalty Rules

| Trigger | QP | Recipient | Constant |
|---------|-----|-----------|----------|
| RAG F1: FAQ similarity > 80% | -5 | Submitter | `PENALTY_F1` |
| RAG F2+R1: FAQ 50-80% + RTQ > 60% | -5 | Submitter | `PENALTY_F2_R1` |
| Answer removed by Senior | -3 | Answerer | `PENALTY_ANSWER_REMOVED` |
| Question removed permanently | -5 | Questioner | `PENALTY_QUESTION_REMOVED` |
| Decision rollback (accept → reject) | varies | Various | (calculated dynamically) |

### Threshold Rules

| Threshold | Value | Effect |
|-----------|-------|--------|
| Minimum to raise questions | QP < 50 | Question-raising restricted; account marked `restrictedAt` |
| Auto-promotion eligibility | QP ≥ 500 | Auto-notification to admins requesting Moderator promotion |
| Welcome bonus | 100 QP | Awarded on every account activation path |

### QP Transaction Recording

Every QP change is recorded as a `QPTransaction` document with:
- `userId` — who was affected
- `type` — `'earn'` or `'deduct'`
- `amount` — always stored as positive (direction encoded by `type`)
- `reason` — human-readable explanation
- `referenceId` — optional link to source document

Each transaction also triggers a notification to the affected user.

### Auto-Restriction & Un-Restriction

- When QP drops below 50, the user's account is automatically set to `restrictedAt = new Date()` and a notification is sent
- When QP rises back above 50, `restrictedAt` is automatically cleared and the user is notified
- The `requireNotRestricted` middleware blocks restricted users from raising questions or answering

---

## 8. RAG Duplicate Detection Engine

### Overview

Every question submitted through the "Raise Question" flow is evaluated semantically against existing FAQ and RTQ collections stored in Qdrant before acceptance.

### Pipeline

```
User Question Text
       │
       ▼
  preprocessText()          ← lowercase, strip special chars, normalize spaces
       │
       ▼
  embedText()               ← Sentence Transformer (all-MiniLM-L6-v2, 384-dim)
       │                       Uses LRU cache (500 entries) for repeated queries
       ▼
  searchFAQSimilarity()     ← Qdrant ANN search on faq_collection (top-1)
       │
       ▼
  [If F2 or F3]
  searchRTQSimilarity()     ← Qdrant ANN search on rtq_collection (top-1)
       │
       ▼
  Apply Decision Tree       ← Compare scores against RAG_THRESHOLDS
       │
       ▼
  Return Decision Object    ← { status, penalty, autoUpvote flags, matched docs }
```

### Decision Tree

```
┌───────────────────────────────────┬────────────────────────────────────────────┐
│ Case                              │ Outcome                                    │
├───────────────────────────────────┼────────────────────────────────────────────┤
│ F1: FAQ score > 0.80              │ REJECT, -5 QP, auto-upvote FAQ             │
├───────────────────────────────────┼────────────────────────────────────────────┤
│ F2: FAQ 0.50 – 0.80              │                                            │
│   ├─ R1: RTQ > 0.60              │ REJECT, -5 QP, auto-upvote FAQ             │
│   ├─ R2: RTQ 0.20 – 0.60        │ REJECT, no penalty                         │
│   └─ R3: RTQ ≤ 0.20             │ ACCEPT → route to RTQ pool                 │
├───────────────────────────────────┼────────────────────────────────────────────┤
│ F3: FAQ ≤ 0.50                   │                                            │
│   ├─ R1: RTQ > 0.60             │ REJECT, no penalty, auto-upvote RTQ        │
│   └─ R2/R3: RTQ ≤ 0.60         │ ACCEPT → route to RTQ pool                 │
├───────────────────────────────────┼────────────────────────────────────────────┤
│ Fallback                          │ ACCEPT → route to RTQ pool                 │
└───────────────────────────────────┴────────────────────────────────────────────┘
```

### RAG Thresholds (from `shared/constants.js`)

| Constant | Value | Description |
|----------|-------|-------------|
| `FAQ_F1` | 0.80 | FAQ high match threshold |
| `FAQ_F2_MIN` | 0.50 | FAQ medium match lower bound |
| `RTQ_R1` | 0.60 | RTQ high match threshold |
| `RTQ_R2_MIN` | 0.20 | RTQ medium match lower bound |

### Decision Object Schema

```js
{
  status: 'ACCEPT' | 'REJECT',
  shouldAutoUpvoteFAQ: Boolean,
  autoUpvoteFAQId: String | null,
  shouldAutoUpvoteRTQ: Boolean,
  autoUpvoteRTQId: String | null,
  matchedFAQ: { _id, question, answer } | null,
  matchedRTQ: { _id, question } | null,
  target: 'RTQ',              // only when ACCEPT
  penalty: Number,            // 0 or -5
  faqScore: Number,           // cosine similarity [0, 1]
  rtqScore: Number,           // cosine similarity [0, 1]
  reason: String              // human-readable decision label
}
```

### Auto-Upvote Engine

When the RAG engine detects a duplicate, the matching FAQ or RTQ is automatically upvoted:

- Uses MongoDB atomic `$inc` + `$addToSet` to prevent duplicate upvotes
- Awards `QUESTION_UPVOTE_BONUS` (+1 QP, internally stored as +5 in some paths) to the original author
- Sends a notification to the original author

### Embedding Infrastructure

| Component | Detail |
|-----------|--------|
| **Model** | `Xenova/all-MiniLM-L6-v2` (22M params, 6 layers) |
| **Dimension** | 384 |
| **Runtime** | WebAssembly/ONNX via `@xenova/transformers` (no Python/C++ required) |
| **Pooling** | Mean pooling |
| **Normalization** | L2 normalized (cosine-ready) |
| **Quantization** | Enabled (`quantized: true`) |
| **LRU Cache** | 500 entries, keyed by lowercase-trimmed text |
| **Warmup** | Model loaded on server startup for sub-10ms first query |

---

## 9. Database Models (MongoDB)

### User

| Field | Type | Details |
|-------|------|---------|
| `name` | String | Required |
| `username` | String | Required, unique, lowercase, trimmed |
| `email` | String | Required, unique, lowercase, trimmed |
| `password` | String | Required, min 6 chars, bcrypt hashed (12 rounds) |
| `role` | String | Enum: `student`, `moderator`, `senior`, `admin`. Default: `student` |
| `qp` | Number | Quality Points balance. Default: 0 |
| `status` | String | Enum: `pending`, `active`, `blocked`. Default: `pending` |
| `emailOtp` | String | 6-digit OTP for email verification |
| `emailOtpExpires` | Date | OTP expiry timestamp |
| `restrictedAt` | Date | Set when QP drops below 50; cleared when recovered |
| `createdAt` | Date | Account creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**Behavior:**
- Password is auto-hashed on save via `pre('save')` hook
- `toJSON()` method strips `password`, `emailOtp`, `emailOtpExpires`

---

### FAQ

| Field | Type | Details |
|-------|------|---------|
| `question` | String | Required |
| `answer` | String | Required |
| `category` | String | Required (from FAQ_CATEGORIES) |
| `tags` | [String] | Optional tag array |
| `upvotes` | Number | Default: 0 |
| `upvotedBy` | [ObjectId → User] | Users who upvoted |
| `createdBy` | ObjectId → User | Required — who created |
| `rtqId` | ObjectId → RTQ | Bidirectional link to source RTQ (if converted) |
| `vectorEmbedding` | [Number] | 384-dim embedding (stored in MongoDB as backup) |
| `isTrending` | Boolean | Trending flag. Default: false |
| `markedForReview` | Boolean | Review flag. Default: false |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**Indexes:** Text index on `question`, `answer`, `category`, `tags`

---

### RTQ (Real-Time Query)

| Field | Type | Details |
|-------|------|---------|
| `question` | String | Required |
| `category` | String | Required (from FAQ_CATEGORIES) |
| `tags` | [String] | Optional tag array |
| `answers` | [ObjectId → Answer] | Linked answers |
| `status` | String | Enum: `unresolved`, `partially_resolved`, `resolved`, `rejected`. Default: `unresolved` |
| `upvotes` | Number | Default: 0 |
| `upvotedBy` | [ObjectId → User] | Users who upvoted |
| `postedBy` | ObjectId → User | Required — who submitted |
| `vectorEmbedding` | [Number] | 384-dim embedding |
| `approvedAnswer` | ObjectId → Answer | The approved answer (if any) |
| `faqId` | ObjectId → FAQ | Bidirectional link to resulting FAQ (if converted) |
| `isAccepted` | Boolean | Whether accepted by moderator. Default: false |
| `acceptedBy` | ObjectId → User | Moderator who accepted |
| `rejectedBy` | [ObjectId → User] | Moderators who rejected (max 2 for permanent deletion) |
| `markedForReview` | Boolean | Review flag. Default: false |
| `reports` | [ObjectId → User] | Users who reported |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**Indexes:** Text index on `question`, `category`, `tags`

---

### Answer

| Field | Type | Details |
|-------|------|---------|
| `questionId` | ObjectId → RTQ | Required — parent RTQ |
| `userId` | ObjectId → User | Required — who answered |
| `answer` | String | Required — answer text |
| `upvotes` | Number | Default: 0 |
| `upvotedBy` | [ObjectId → User] | Users who upvoted |
| `isApproved` | Boolean | Default: false |
| `approvedBy` | ObjectId → User | Who approved |
| `approvals` | [ObjectId → User] | All moderators who approved |
| `rejections` | [ObjectId → User] | All moderators who rejected |
| `markedForReview` | Boolean | Review flag. Default: false |
| `isSelectedForFAQ` | Boolean | Selected for FAQ conversion. Default: false |
| `reports` | [ObjectId → User] | Users who reported |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

---

### QPTransaction

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Required |
| `type` | String | Enum: `earn`, `deduct`. Required |
| `amount` | Number | Required (always stored as positive) |
| `reason` | String | Required — human-readable explanation |
| `referenceId` | ObjectId | Optional — link to source document |
| `createdAt` | Date | Transaction timestamp |

---

### Notification

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Required — recipient |
| `role` | String | User's role at notification time |
| `type` | String | Required — notification type (e.g., `qp_earned`, `qp_deducted`, `promotion_eligible`) |
| `message` | String | Required — notification text |
| `qpImpact` | Number | QP change amount. Default: 0 |
| `read` | Boolean | Default: false |
| `referenceId` | ObjectId | Optional — related document |
| `createdAt` | Date | Notification timestamp |

**Indexes:** Compound index on `(userId, read, createdAt desc)`

---

### FAQConversionRequest

| Field | Type | Details |
|-------|------|---------|
| `rtqId` | ObjectId → RTQ | Required — source RTQ |
| `rtqQuestion` | String | Required — the question text |
| `rtqAnswer` | String | Optional — the answer text |
| `suggestedAnswer` | String | Optional — moderator's suggested answer |
| `requestedBy` | ObjectId → User | Required — moderator who requested |
| `requestedAt` | Date | Default: now |
| `status` | String | Enum: `pending`, `approved`, `rejected`. Default: `pending` |
| `reviewedAt` | Date | When reviewed |
| `reviewedBy` | ObjectId → User | Senior/Admin who reviewed |
| `adminNote` | String | Optional review note |

**Indexes:** Compound index on `(status, requestedAt desc)`

---

### EmailWhitelist

| Field | Type | Details |
|-------|------|---------|
| `email` | String | Required, unique, lowercase, trimmed |
| `addedBy` | ObjectId → User | Required — admin who added |
| `note` | String | Optional admin note |
| `addedAt` | Date | Default: now |

**Indexes:** Index on `addedBy`

---

### AccessRequest

| Field | Type | Details |
|-------|------|---------|
| `email` | String | Required, lowercase, trimmed |
| `name` | String | Required |
| `username` | String | Required, lowercase, trimmed |
| `password` | String | Required, min 6 chars |
| `status` | String | Enum: `pending`, `approved`, `rejected`. Default: `pending` |
| `requestedAt` | Date | Default: now |
| `reviewedAt` | Date | When reviewed |
| `reviewedBy` | ObjectId → User | Admin who reviewed |
| `adminNote` | String | Optional review note |

**Indexes:** Compound index on `(status, requestedAt desc)`

---

### RoleRequest (Re-Access)

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Required — the blocked user |
| `email` | String | Required, lowercase, trimmed |
| `name` | String | Required |
| `username` | String | Required, lowercase, trimmed |
| `password` | String | Required, min 6 chars |
| `requestedRole` | String | Enum: `student`, `moderator`, `senior`, `admin`. Default: `student` |
| `status` | String | Enum: `pending`, `approved`, `rejected`. Default: `pending` |
| `requestedAt` | Date | Default: now |
| `reviewedAt` | Date | When reviewed |
| `reviewedBy` | ObjectId → User | Admin who reviewed |
| `adminNote` | String | Optional review note |

**Indexes:** Compound index on `(email, status)`, `(status, requestedAt desc)`

---

### CategoryUpvote

| Field | Type | Details |
|-------|------|---------|
| `categoryName` | String | Required, unique |
| `upvotes` | Number | Default: 0 |
| `upvotedBy` | [ObjectId → User] | Users who upvoted this category |
| `lastActivity` | Date | Default: now |

---

### Question (User Tracking)

| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId → User | Required |
| `question` | String | Required |
| `category` | String | Required |
| `tags` | [String] | Optional |
| `status` | String | Enum: `unresolved`, `partially_resolved`, `resolved`. Default: `unresolved` |
| `faqMatched` | Boolean | Default: false |
| `rtqMatched` | Boolean | Default: false |
| `answers` | [ObjectId → Answer] | Linked answers |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

**Indexes:** Compound index on `(userId, createdAt desc)`

---

## 10. Vector Store (Qdrant Cloud)

### Collection Architecture

| Collection | Contents | Dimension | Distance | Indexing |
|------------|----------|-----------|----------|----------|
| `faq_collection` | Approved FAQ entries | 384 | Cosine | HNSW (m=16, efConstruct=128) |
| `rtq_collection` | Active RTQ entries | 384 | Cosine | HNSW (m=16, efConstruct=128) |

### HNSW Configuration

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `m` | 16 | Bi-directional links per node (recall vs. memory tradeoff) |
| `efConstruct` | 128 | Dynamic candidate list size during construction |
| `on_disk` | false | Keep index in RAM for faster queries |
| `default_segment_number` | 2 | Parallel search segments |
| `indexing_threshold` | 20000 | Start indexing after this many vectors |
| `max_indexing_threads` | 1 | CPU threads for indexing |
| `memmap_threshold` | 50000 | Use memory-mapped files above this size |

### Payload Schema

**FAQ Payload:**
```json
{
  "mongoId": "string",
  "question": "string",
  "answer": "string",
  "category": "string",
  "tags": ["string"],
  "upvotes": 0,
  "createdBy": "string"
}
```

**RTQ Payload:**
```json
{
  "mongoId": "string",
  "question": "string",
  "category": "string",
  "tags": ["string"],
  "status": "string",
  "postedBy": "string"
}
```

### Payload Indexes

| Field | Type | Purpose |
|-------|------|---------|
| `mongoId` | keyword | Unique document lookup |
| `category` | keyword | Filtered searches by category |
| `status` | keyword | Filtered searches by status |
| `createdBy` | keyword | User-specific queries |

### Point ID Generation

MongoDB ObjectId → SHA-1 hash → UUID v5 format:
```
mongoId → SHA1(mongoId) → "xxxxxxxx-xxxx-5xxx-xxxx-xxxxxxxxxxxx"
```

### Retry Configuration

| Parameter | Value |
|-----------|-------|
| Max retries | 3 |
| Initial delay | 1000ms |
| Max delay | 10000ms |
| Backoff | Exponential (2^attempt) |
| Timeout (dev) | 30000ms |
| Timeout (prod) | 10000ms |

---

## 11. API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/signup` | No | Public | Register with name, username, email, password. Checks whitelist → sends OTP |
| POST | `/verify-otp` | No | Public | Verify 6-digit OTP → activate account → +100 QP welcome bonus |
| POST | `/login` | No | Public | Email + password → JWT token |
| POST | `/request-access` | No | Public | Non-whitelisted email → create AccessRequest (pending) |
| POST | `/request-reaccess` | No | Public | Blocked user → create RoleRequest (pending) |
| GET | `/me` | JWT | All | Get current authenticated user |
| POST | `/logout` | JWT | All | Logout (client-side token removal) |

### FAQ (`/api/faq`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | No | Public | List approved FAQs (paginated, searchable, filterable by category) |
| GET | `/categories` | No | Public | List FAQ categories |
| GET | `/conversion-requests` | JWT | Senior, Admin | List pending FAQ conversion requests |
| GET | `/:id` | No | Public | Get single FAQ by ID |
| POST | `/` | JWT | Senior, Admin | Create new FAQ (awards +15 QP to creator) |
| POST | `/request-conversion` | JWT | Moderator, Senior | Submit FAQ conversion request for an RTQ |
| POST | `/upvote/:id` | JWT | All | Toggle upvote on a FAQ |
| PUT | `/:id` | JWT | Senior, Admin | Update an existing FAQ |
| DELETE | `/:id` | JWT | Senior, Admin | Delete a FAQ (removes from MongoDB + Qdrant) |
| PATCH | `/review-faq/:id` | JWT | Mod, Senior, Admin | Toggle `markedForReview` flag |
| PATCH | `/toggle-trending/:id` | JWT | Mod, Senior, Admin | Toggle `isTrending` flag |
| PATCH | `/conversion-requests/:id/approve` | JWT | Senior, Admin | Approve FAQ conversion request → create FAQ + sync Qdrant |
| PATCH | `/conversion-requests/:id/reject` | JWT | Senior, Admin | Reject FAQ conversion request |

### FAQ Categories (`/api/faq/categories`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/ranked` | No | Public | List categories sorted by upvote count |
| POST | `/upvote/:name` | JWT | All | Toggle category upvote |

### RTQ (`/api/rtq`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | JWT | All | List RTQs with search/filter/status support. Supports `filter=history` for Senior's working history |
| GET | `/:id` | JWT | All | Get single RTQ with populated answers and users |
| POST | `/question` | JWT | Student, Mod, Senior | Submit question through RAG engine (requires QP ≥ 50) |
| POST | `/:id/answer` | JWT | All (not restricted) | Add answer to RTQ (one answer per user per question) |
| POST | `/answer/upvote/:answerId` | JWT | All | Toggle upvote on an answer |
| POST | `/convert/:id` | JWT | Senior, Admin | Convert RTQ → FAQ via review modal |
| POST | `/report/:id` | JWT | All | Report an RTQ |
| PATCH | `/approve-answer/:answerId` | JWT | Mod, Senior, Admin | Approve an answer (+5 QP answerer, +3 QP moderator) |
| PATCH | `/reject-answer/:answerId` | JWT | Mod, Senior, Admin | Reject an answer (-3 QP answerer, +3 QP moderator) |
| PATCH | `/mark-accepted/:id` | JWT | Mod, Senior, Admin | Accept question → status=resolved, +5 QP questioner, +3 QP moderator |
| PATCH | `/reject-question/:id` | JWT | Mod, Senior, Admin | Reject question (1st: status=rejected; 2nd by different mod: permanent delete, -5 QP) |
| PATCH | `/review-question/:id` | JWT | Mod, Senior, Admin | Toggle `markedForReview` flag |
| PATCH | `/review-answer/:answerId` | JWT | Mod, Senior, Admin | Toggle answer `markedForReview` flag |
| PATCH | `/status/:questionId` | JWT | Owner only | Update own question status |
| DELETE | `/:id` | JWT | Senior, Admin | Permanently remove RTQ (from MongoDB + Qdrant) |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/users` | JWT | Admin | List all users |
| GET | `/users/:id` | JWT | Admin | Get single user |
| POST | `/users` | JWT | Admin | Create user manually |
| PATCH | `/users/:id` | JWT | Admin | Update user details |
| DELETE | `/users/:id` | JWT | Admin | Delete user |
| PATCH | `/users/:id/role` | JWT | Admin | Assign role |
| PATCH | `/assign-role` | JWT | Admin | Assign role (alternative endpoint) |
| PATCH | `/users/:id/block` | JWT | Admin | Block a user |
| PATCH | `/users/:id/unblock` | JWT | Admin | Unblock a user |
| POST | `/reactivate` | JWT | Admin | Reactivate a user account |
| GET | `/pending-users` | JWT | Admin, Senior | List pending user approvals |
| POST | `/approve-user` | JWT | Admin, Senior | Approve a pending user |
| POST | `/reject-user` | JWT | Admin, Senior | Reject a pending user |
| GET | `/role-requests` | JWT | Admin | List blocked-user re-access requests |
| POST | `/role-requests/:requestId/approve` | JWT | Admin | Approve re-access request |
| POST | `/role-requests/:requestId/reject` | JWT | Admin | Reject re-access request |
| GET | `/whitelist` | JWT | Admin | List all whitelisted emails |
| POST | `/whitelist` | JWT | Admin | Add email to whitelist |
| DELETE | `/whitelist/:id` | JWT | Admin | Remove email from whitelist |
| GET | `/access-requests` | JWT | Admin | List non-whitelisted access requests |
| POST | `/access-requests/:requestId/approve` | JWT | Admin | Approve access request → add to whitelist + create user |
| POST | `/access-requests/:requestId/reject` | JWT | Admin | Reject access request |

### Users (`/api/users`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | JWT | All | User list / leaderboard (filtered by role) |
| GET | `/:id` | JWT | All | Public user profile |

### Questions (`/api/questions`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/user/:id` | JWT | All | Get user's submitted questions |
| PATCH | `/resolve/:id` | JWT | Owner | Mark question as resolved |

### QP (`/api/qp`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/my-score` | JWT | All | Current QP balance |
| GET | `/history` | JWT | All | Transaction history (last 50) |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | JWT | All | User's notifications (last 50) |
| PATCH | `/read/:id` | JWT | All | Mark notification as read |

### RAG (`/api/rag`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/evaluate-question` | JWT | All | Run RAG decision tree against a question |
| POST | `/rebuild-vectors` | JWT | Senior, Admin | Trigger full vector rebuild |

### Vector Health (`/api/vector`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/health` | No | Public | Qdrant connection status, collection stats, sync health |
| POST | `/rebuild` | No | Public | Trigger collection rebuild/repair |
| POST | `/validate` | No | Public | Validate Qdrant connection |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/stats` | JWT | All | User's total users count, unread notifications, rank |
| GET | `/activity` | JWT | All | 7-day activity feed: recent RTQs, FAQs, users, QP transactions + trend data |

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health: `{ status: "ok", timestamp }` |

---

## 12. Frontend Pages

### Public Pages

#### Login Page (`/login`)
- PippaQ branded login form with gradient accent
- Email + password fields
- Link to signup page
- Redirects to `/dashboard` on success
- Error handling for blocked/inactive accounts

#### Signup Page (`/signup`)
- Multi-step form: name, username, email, password
- **Step 1:** Submit credentials → checks whitelist
- **Step 2 (whitelisted):** OTP verification → account activation → +100 QP
- **Step 2 (not whitelisted):** Shows "Access Restricted" message with "Request Approval" button
- Handles blocked user re-access request flow
- PippaQ community branding and references

### Authenticated Pages — Common

#### FAQ Page (`/faq`)
- Public-accessible knowledge base
- Categories sorted by upvote count (most popular first)
- Category upvote buttons with toggle support
- Full-text search across questions and answers
- Per-FAQ upvote button (toggleable)
- **Moderator view:** Settings gear dropdown with "Flag for Review", "Set/Remove Trending"
- **Senior/Admin view:** Additional "Edit FAQ" and "Delete FAQ" options in gear dropdown
- **Senior/Admin:** Collapsible FAQ Conversion Requests review panel at the top
- Sort options: Most Upvoted, Newest First, Oldest First
- Trending badge and review flag indicators

#### RTQ Page (`/rtq`)
- Real-time questions list with search and status/category filters
- Expandable inline answer previews
- "Ask a Question" button (hidden for Admin and Senior roles)
- **Status badges:** Unresolved (red), Partially Resolved (amber), Resolved (green)
- **Moderator actions (gear icon):**
  - Accept question (✓ Check icon)
  - Reject question (✗ X icon)
  - Mark for review (⚠ Flag icon)
  - Request FAQ conversion (FileText icon — Moderator only)
- **Senior/Admin actions (gear icon):**
  - Permanently remove (🗑 Trash2 icon)
- **Owner actions:**
  - Mark as Resolved (✓ Check icon)
- Role-based highlight badges: Moderator actions = blue, Senior/Admin = purple, Rejected = red
- Multi-moderator decision badges visible to all users

#### RTQ Detail Page (`/rtq/:id`)
- Full question display with metadata
- All answers listed with:
  - Upvote button
  - Author info with role badge
  - Approval/rejection badges
  - Review flag indicators
- Answer submission form (one answer per user per question)
- **Senior "Add to FAQ (Initiate)" button** → Opens review edit modal:
  - Pre-filled with auto-selected answer (4-tier priority: Senior's own → Senior-approved → Moderator-approved → Most upvoted)
  - Editable answer text
  - Category dropdown (from FAQ_CATEGORIES)
  - Customizable comma-separated tags
  - Confirm to create FAQ entry

#### About Page (`/about`)
- Interactive PippaQ symbolism and branding page
- SVG-based logo with animated symbol explanations
- Colored circle release animations on hover
- Hotspot symmetrical pulsing animations
- Card-based layout with symbol descriptions

#### Profile Page (`/profile`)
- Own user profile display
- Name, username, email, role, QP balance
- Account creation date
- Role badge

#### User Profile Page (`/users/:id`)
- Public profile view of any user
- Name, username, role, QP score
- Activity statistics

#### Notifications Page (`/notifications`)
- Chronological notification feed (last 50)
- QP impact indicators (+/- amounts)
- Read/unread status with mark-as-read action
- Notification types: `qp_earned`, `qp_deducted`, `promotion_eligible`, `promotion_request`, `account_restricted`, `account_unrestricted`

#### QP History Page (`/qp-history`)
- Full QP transaction ledger
- Earn vs. deduct type indicators
- Amount and reason for each transaction
- Reference links to source documents

### Authenticated Pages — Student/Moderator Only

#### Student Dashboard (`/dashboard` for Student/Moderator)
- Welcome greeting with role badge (Slate=Student, Purple=Moderator)
- Quick stats: QP score, rank, total users
- 7-day trend charts (RTQs, FAQs, Users) via MiniChart sparklines
- Recent activity feed (last 20 items across RTQs, FAQs, QP transactions)
- Quick link cards (5 links):
  - Real-Time Questions
  - FAQ Knowledge Base
  - Raise a Question
  - Track Questions
  - Leaderboard

#### Raise Question Page (`/raise-question`)
- Question input form with category selector (from FAQ_CATEGORIES) and tag input
- RAG duplicate detection runs before submission
- Displays matched FAQ/RTQ with similarity scores if rejected
- QP penalty warning for duplicate submissions
- Success message on acceptance with redirect to RTQ page

#### Track Questions Page (`/track`)
- Lists user's own submitted questions
- Interactive status dropdown selectors (owner-only):
  - Unresolved (red)
  - Partially Resolved (blue)
  - Resolved (green)
- Read-only moderation badges (accepted, rejected, review)
- Answer preview for each question

### Authenticated Pages — Senior/Admin Only

#### Senior Dashboard (`/dashboard` for Senior/Admin)
- Welcome greeting with role badge (Blue=Senior, Red=Admin)
- Senior-specific stats and pending reviews count
- 7-day trend charts via MiniChart sparklines
- Recent activity feed
- Quick link cards (3 links):
  - RTQ Management
  - FAQ Knowledge Base
  - Add New FAQ

#### Add FAQ Page (`/add-faq`)
- Form to create new FAQ entries directly
- Question, answer, category (dropdown), tags (comma-separated)
- Awards +15 QP to the creator on success

#### FAQ Edit Page (`/faq/edit/:id`)
- Edit existing FAQ entry
- Pre-filled form with current question, answer, category, tags
- Save and cancel actions

#### Working History Page (`/history`)
- Personal audit trail of Senior's RTQ → FAQ conversions
- Lists only RTQs that the current Senior converted to FAQs
- Shows original question, converted FAQ link, conversion date

### Authenticated Pages — All Roles

#### User List / Leaderboard Page (`/users`)
- **Leaderboard tabs:**
  - **Peers** (Student/Moderator) — sorted by QP, crown/trophy badges for top 3
  - **Seniors** (Senior/Admin) — independent ranking track, crown/trophy badges
  - Non-privileged users only see the Peers tab
  - Privileged users (Senior/Admin) can toggle between both tabs
- **Admin-only tabs:**
  - **Users** — full user list with role management
  - **Whitelist** — email whitelist management (add/remove)
  - **Access Requests** — pending access request approvals (approve/reject)

---

## 13. Shared Component Library

| Component | File | Description |
|-----------|------|-------------|
| **Nav** | `Nav.jsx` | Persistent navbar with PippaQ branding, QP counter with animation, notification bell with unread count, navigation links, global search trigger |
| **GlobalSearch** | `GlobalSearch.jsx` | Full-screen overlay triggered by "/" key. Searches FAQ + RTQ simultaneously. Glassmorphism design with backdrop blur |
| **UpvoteButton** | `UpvoteButton.jsx` | Toggleable upvote button with optimistic UI updates. Supports both upvote and retract actions |
| **Avatar** | `Avatar.jsx` | Role-colored circular avatar displaying user initials |
| **Badge** | `Badge.jsx` | Dynamic status badges (accepted/rejected/review) with role-based colors: Moderator=blue, Senior/Admin=purple, Rejected=red |
| **AnswerCard** | `AnswerCard.jsx` | Answer display component with real user ID upvote checking |
| **QuestionCard** | `QuestionCard.jsx` | Question card with status border, expandable answers |
| **EmptyState** | `EmptyState.jsx` | Illustrated empty state with optional action button |
| **SkeletonLoader** | `SkeletonLoader.jsx` | Shimmer loading placeholders matching all page layouts |
| **BackToTop** | `BackToTop.jsx` | Floating smooth scroll-to-top button |
| **Breadcrumb** | `Breadcrumb.jsx` | Navigation breadcrumb trail |
| **MiniChart** | `MiniChart.jsx` | SVG sparkline component for 7-day trend charts (RTQs, FAQs, Users) |
| **QPBadge** | `QPBadge.jsx` | QP display badge component |
| **RoleGuard** | `RoleGuard.jsx` | Component-level role-based rendering guard |
| **SegmentedControl** | `SegmentedControl.jsx` | Modern tab-like button switcher group |
| **ErrorBoundary** | `ErrorBoundary.jsx` | React error boundary wrapper |
| **Toast** | `Toast.jsx` | Toast notification provider and display component |

---

## 14. Design System

### Typography

| Font | Family | Usage |
|------|--------|-------|
| **Playfair Display** | Serif | Brand accent, logo text, elegant headings |
| **Outfit** | Sans-serif | Body text, navigation, UI elements, headers |

Loaded via Google Fonts with `preconnect` in `client/index.html`.

### Color Palette

| Token | Usage |
|-------|-------|
| Background surface | `#f8fafc` (Slate-50) |
| Card background | White |
| Card border | `#e5e7eb` |
| Primary text | `#0f172a` (Slate-900) |
| Muted text | `#6b7280` (Gray-500) |
| Primary button bg | `#0f172a` |
| Accent gradient | Accent → Violet-600 |

### Role Colors

| Role | Color | Badge Style |
|------|-------|------------|
| Student | Slate | `badge-default` |
| Moderator | Blue/Purple | `badge-info` |
| Senior | Blue/Purple | `badge-purple` |
| Admin | Red | `badge-danger` |

### Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| Unresolved | Red | Left border, badge |
| Partially Resolved | Amber/Blue | Left border, badge |
| Resolved | Green | Left border, badge |
| Accepted | Green/Blue (mod) or Purple (senior) | Badge |
| Rejected | Red | Badge |
| Trending | Gradient accent | Badge overlay |
| Marked for Review | Yellow/Amber | Warning badge |

### Design Principles

- **Glassmorphism** — Frosted-glass overlays with `backdrop-filter: blur()` for modals and global search
- **Gradient Accents** — Accent-to-violet gradient for buttons, badges, and icon containers
- **Micro-Animations** — Accordion transitions, scale-in modals, hover effects, floating elements, page-enter transitions
- **Card-Based Layout** — Consistent card design with subtle shadows (`0 1px 2px rgba(0,0,0,0.04)`) and border accents
- **Status-Coded Borders** — Left border color coding (green/amber/red) for question status
- **Icon-Only Actions** — Sleek Lucide icons for moderation controls with tooltips
- **8/12/16/24/32px spacing rhythm**
- **10px border radius** throughout
- **0.2s ease transitions** everywhere
- **Max content width** — 1100px centered

---

## 15. User Flows

### 1. Signup & Access

```
┌─ Whitelisted Email ─────────────────────────────────────────────┐
│ Signup Form → Check Whitelist → ✅ Found → Create User (pending)│
│ → Send OTP → Verify OTP → status='active' → +100 QP → Login    │
└─────────────────────────────────────────────────────────────────┘

┌─ Non-Whitelisted Email ─────────────────────────────────────────┐
│ Signup Form → Check Whitelist → ❌ Not Found → Show "Restricted"│
│ → "Request Approval" Button → Create AccessRequest (pending)    │
│ → Admin reviews → Approve → Add to whitelist + Create user      │
│                 → Reject → Marked rejected                      │
└─────────────────────────────────────────────────────────────────┘

┌─ Blocked User ──────────────────────────────────────────────────┐
│ Login → ❌ Account blocked → "Request Re-Access" option         │
│ → Create RoleRequest (pending) → Admin reviews                  │
│ → Approve → Unblock + Reactivate → Login                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Question Lifecycle

```
Student submits question
       │
       ▼
RAG Engine evaluates (FAQ + RTQ similarity)
       │
       ├── REJECT (F1 / F2+R1) ───────► -5 QP penalty + auto-upvote matched entry
       │                                 + notification to submitter
       │
       ├── REJECT (F2+R2 / F3+R1) ────► No penalty + optional auto-upvote
       │                                 + notification to submitter
       │
       └── ACCEPT ─────► Added to RTQ pool + indexed in Qdrant
             │            + notification to submitter
             │
             ├── Peers answer → +2 QP to each answerer
             │
             ├── Moderators approve answers → +5 QP to answerer, +3 QP to moderator
             │
             ├── Moderator accepts question → status=resolved, +5 QP questioner, +3 QP moderator
             │
             ├── Moderator requests FAQ conversion → FAQConversionRequest created (pending)
             │     └── Senior/Admin reviews → Approve: creates FAQ + sync Qdrant + QP awards
             │                              → Reject: marks rejected + notification
             │
             └── Senior directly converts to FAQ → Opens review modal
                   └── Confirm: creates FAQ, links RTQ↔FAQ, +10 QP senior, +10 QP answerer
```

### 3. Multi-Moderator Question Decision Flow

```
Moderator Action on Question:
  ├── Accept ─────────► status: 'resolved', isAccepted: true
  │                     +5 QP to questioner, +3 QP to moderator
  │
  ├── Reject (1st) ──► status: 'rejected'
  │                     +3 QP to moderator
  │
  └── Reject (2nd, different moderator) ──► Permanent deletion from MongoDB + Qdrant
                                            -5 QP to questioner, +3 QP to 2nd moderator
```

### 4. Decision Rollback Flow

```
Moderator changes previous decision (e.g., Accept → Reject):
  1. Detect previous decision type
  2. Calculate rollback QP (retract previous awards)
  3. Apply new decision QP
  4. Update all relevant flags/status
  5. Send updated notifications
```

### 5. RTQ → FAQ Conversion (Senior)

```
Senior expands RTQ card
       │
       ▼
Auto-select best answer (4-tier priority):
  1. Senior's own answer
  2. Senior-approved answer
  3. Moderator-approved answer
  4. Most upvoted answer
       │
       ▼
Click "Add to FAQ (Initiate)" → Review Modal opens
  - Pre-filled: answer, category, tags
  - Editable by Senior
       │
       ▼
Confirm → convertToFAQ controller:
  1. Check rtq.faqId doesn't exist (prevent duplicates)
  2. Create FAQ document with rtqId link
  3. Set rtq.faqId = faq._id (bidirectional link)
  4. Resolve RTQ status → 'resolved', isAccepted=true
  5. Award +10 QP to Senior
  6. Award +10 QP to answer author
  7. Sync FAQ to Qdrant (insert vector)
  8. Send notifications
```

---

## 16. System Rules & Business Logic

### Authentication Rules

1. **Email whitelist is the primary signup gate.** Only emails in the `EmailWhitelist` collection can register
2. **OTP expires in 10 minutes.** Users must verify within this window
3. **JWT payload contains:** `{ id, role, qp }` with configurable expiry (default: 7 days)
4. **Auth middleware** verifies JWT, loads fresh user from DB (not relying on stale JWT payload), and checks `status === 'active'`
5. **Blocked users** cannot login and receive a specific error message with re-access instructions
6. **INITIAL_ADMIN_EMAIL** environment variable auto-promotes the matching user to admin on server startup

### Answer Rules

1. **One answer per user per question** — enforced server-side
2. **Approvals are capped at 2 per moderator per question** — prevents collusion
3. **Senior answering auto-resolves** the question status to `'resolved'`
4. **Answer approval:** +5 QP to answerer, +3 QP to approving moderator
5. **Answer rejection:** -3 QP to answerer, +3 QP to rejecting moderator

### Question Moderation Rules

1. **First rejection:** Status changes to `'rejected'`, +3 QP to moderator
2. **Second rejection by a DIFFERENT moderator:** Permanent deletion from MongoDB and Qdrant, -5 QP to questioner, +3 QP to second moderator
3. **Same moderator cannot reject twice** — prevents single-person permanent deletion
4. **Acceptance is final:** Status changes to `'resolved'`, `isAccepted = true`, +5 QP questioner, +3 QP moderator

### FAQ Management Rules

1. **Only Senior/Admin can create, edit, or delete FAQs**
2. **FAQ creation awards +15 QP** to the creator
3. **FAQ conversion from RTQ awards +10 QP** to the converting Senior and +10 QP to the answer author
4. **Duplicate conversion prevention:** The `rtq.faqId` field is checked before conversion
5. **Bidirectional traceability:** Every converted FAQ has `rtqId` → source RTQ; every converted RTQ has `faqId` → resulting FAQ
6. **FAQ deletion** removes both the MongoDB document and the Qdrant vector
7. **FAQ Conversion Requests** are the moderator pathway: moderators request, seniors/admins approve or reject

### Category Rules

1. **10 standardized categories** defined in `shared/constants.js`:
   - About the internship
   - Timing and dates
   - NOC (No Objection Certificate)
   - Selection, offer letter, and certificate
   - Work, mentorship, and projects
   - Code of conduct - communication channels
   - Interviews Related
   - Certificate
   - Rosetta - your internship journal
   - General
2. **Category filtering uses regex** for flexibility (handles legacy prefixed categories)
3. **Category upvotes** determine display order on the FAQ page
4. **Upvotes are toggleable** (users can retract their upvote)

### QP Restriction Rules

1. **QP < 50:** User's `restrictedAt` is set → cannot raise questions or answer
2. **QP ≥ 50 (after recovery):** `restrictedAt` is cleared → access restored
3. **QP ≥ 500 (student only):** Auto-notification sent to all admins for Moderator promotion consideration
4. **Welcome bonus (+100 QP)** is awarded on every account activation path:
   - Direct OTP verification
   - Admin-approved access request

### Notification Rules

1. Every QP change generates a notification to the affected user
2. Promotion eligibility generates notifications to both the user and all admins
3. Account restriction/unrestriction generates a notification
4. Notifications are user-scoped and sorted by creation date (newest first)
5. Maximum 50 notifications returned per query

---

## 17. Sync & Repair Infrastructure

### MongoDB ↔ Qdrant Sync Model

**MongoDB is the source of truth.** Operations follow this pattern:

1. Controller performs MongoDB write (create/update/delete)
2. Controller calls sync service method
3. Sync service calls Qdrant vector service
4. If Qdrant fails → emit failure event → caller can rollback MongoDB
5. If Qdrant succeeds → emit success event

### Sync Event System

| Event | Description |
|-------|-------------|
| `FAQ_INSERT` | New FAQ vector inserted |
| `FAQ_UPDATE` | FAQ vector updated |
| `FAQ_DELETE` | FAQ vector deleted |
| `RTQ_INSERT` | New RTQ vector inserted |
| `RTQ_UPDATE` | RTQ vector updated |
| `RTQ_DELETE` | RTQ vector deleted |

Each event emits success/failure/rollback variants for monitoring.

### Rollback Behavior

| Operation | Qdrant Failure Response |
|-----------|------------------------|
| Insert FAQ | Caller should delete the MongoDB document |
| Update FAQ | Re-throw — caller should revert MongoDB |
| Delete FAQ | Log and continue (stray vector is better than lost FAQ) |

### Repair Service Capabilities

| Capability | Description |
|-----------|-------------|
| **Missing Vector Detection** | Finds MongoDB docs with no corresponding Qdrant vector → repairs by re-inserting |
| **Stray Vector Detection** | Finds Qdrant vectors with no corresponding MongoDB doc → repairs by deleting |
| **Full Reindex** | Clears all vectors and rebuilds from MongoDB |
| **Vector Count Reconciliation** | Compares MongoDB count vs Qdrant count and reports discrepancies |
| **Full Repair** | Runs all detection + repair for both FAQ and RTQ collections in parallel |

### Vector Health Endpoint (`GET /api/vector/health`)

Returns:
- Qdrant connection status
- Collection stats (vectors count, indexed count, points count)
- MongoDB vs Qdrant document counts and diff
- Missing and stray vector counts (with sample IDs)
- Overall sync status: `'synced'` or `'inconsistent'`

---

## 18. Scripts & Utilities

### Category Migration (`scripts/migrate-categories.js`)

- Cleans up numeric prefixes from legacy categories (e.g., `"9. Rosetta..."` → `"Rosetta..."`)
- Maps older category names to correct standardized equivalents
- Seeds the `CategoryUpvote` collection for all 10 standardized categories
- Converts Unicode em-dashes to standard hyphens

### Bulk Import (`scripts/bulk-import.js`)

- Imports FAQ entries in bulk from a data source
- Creates MongoDB documents and syncs to Qdrant

### Rebuild FAQ Vectors (`server/src/scripts/rebuild-faq-vectors.js`)

- Standalone script to rebuild all FAQ vectors in Qdrant from MongoDB
- Computes Sentence Transformer embeddings for all FAQs
- Re-indexes into the Qdrant `faq_collection`

### Development Scripts (from root `package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `concurrently` | Runs both server and client in parallel |
| `server` | `npm --prefix server run dev` | Starts server with `--watch` |
| `client` | `npm --prefix client run dev` | Starts Vite dev server |
| `install:all` | Chained npm install | Installs root, server, and client dependencies |
| `build` | `npm --prefix client run build` | Production client build |
| `start` | `npm --prefix server run start` | Production server start |

---

## 19. System Guarantees

| # | Guarantee | Implementation |
|---|-----------|----------------|
| 1 | **Semantic duplicate detection** | Qdrant ANN search with Sentence Transformer embeddings evaluated via decision tree before any question is accepted |
| 2 | **Atomic QP transactions** | Every QP change is recorded as a `QPTransaction` with rollback-safe decision changes |
| 3 | **Bidirectional RTQ↔FAQ traceability** | `FAQ.rtqId` and `RTQ.faqId` fields maintain 100% bidirectional links for all conversions |
| 4 | **Multi-moderator collusion prevention** | Approvals capped at 2 per moderator per question; second rejection requires a different moderator |
| 5 | **Auto-upvote on duplicate detection** | Duplicate submissions automatically upvote matching FAQ/RTQ entries using atomic MongoDB operations |
| 6 | **Role-based UI constraints** | Actions are hidden from unauthorized roles on the frontend; enforced by backend middleware |
| 7 | **Idempotent decision rollbacks** | When moderators change their verdict, QP adjustments are calculated and applied precisely |
| 8 | **MongoDB ↔ Qdrant sync** | Automatic synchronization with rollback on vector store failures; repair service for inconsistencies |
| 9 | **100 QP welcome bonus** | Guaranteed on every account activation path (OTP verification and admin approval) |
| 10 | **Email whitelist gate** | Only admin-approved emails can register; non-whitelisted users must request access |
| 11 | **Password security** | bcrypt hashing with 12 salt rounds; passwords never exposed in API responses |
| 12 | **Token security** | JWT with configurable expiry; user status re-checked on every authenticated request |
| 13 | **Qdrant retry resilience** | All Qdrant operations use exponential backoff retry (3 attempts, 1-10s delays) |
| 14 | **Embedding cache performance** | LRU cache (500 entries) provides sub-10ms semantic queries for repeated text |
| 15 | **Model warmup** | Sentence Transformer model loaded on server startup to avoid first-request latency |

---

## 20. Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **Qdrant Cloud** account (or local Qdrant instance at port 6333)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vicharanashala/cs20.git
cd cs20

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env:
#   - Set MONGO_URI (MongoDB connection string)
#   - Set JWT_SECRET (strong secret key)
#   - Set QDRANT_URL (Qdrant Cloud endpoint)
#   - Set QDRANT_API_KEY (Qdrant API key)
#   - Set INITIAL_ADMIN_EMAIL (first admin's email)
```

### Running the Application

```bash
# Development (client + server concurrently)
npm run dev

# Client only: http://localhost:3000
npm run client

# Server only: http://localhost:5000
npm run server
```

### Server Startup Sequence

1. Connect to MongoDB
2. Bootstrap admin user (if `INITIAL_ADMIN_EMAIL` is set)
3. Validate Qdrant Cloud connection
4. Initialize Qdrant collections (create if not exist, setup payload indexes)
5. Warm up Sentence Transformer model (load + initial embed)
6. Start Express server on configured port

### First Admin Setup

1. Add the admin's email to the `INITIAL_ADMIN_EMAIL` environment variable
2. Register a user with that email through the signup flow
3. On next server restart, the user will be auto-promoted to `admin` role
4. The admin can then manage the email whitelist and approve other users

--- --

*Built with ❤️ using React, Express, MongoDB & Qdrant — by the Vicharanashala Team*
