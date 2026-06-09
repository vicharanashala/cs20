# 🧠 PippaQ — Semantic Q&A & FAQ Platform

A **high-performance, semantic query-resolution and FAQ generation platform** featuring a **QP (Quality Point) reputation economy**, **role-based access control**, **Qdrant Cloud vector search**, **local Sentence Transformers**, and **admin-controlled email whitelist signup**. Users raise real-time queries (RTQs), get peer/moderator/senior answers, and high-quality content graduates into an approved FAQ knowledge base.

> **Stack:** React + Vite | Express.js + MongoDB | Qdrant Cloud | Sentence Transformers (all-MiniLM-L6-v2)

---

## ✨ Features

### 🔐 Authentication & Access Control
- Email whitelist-gated signup with OTP verification
- Role-based access control — **Student**, **Moderator**, **Senior**, **Admin**
- JWT authentication with role + QP payload
- Access request flow for non-whitelisted users (admin approval required)
- Re-access request system for blocked users
- 100 QP welcome bonus on account activation

### 👨‍🎓 Peer Panel (Student & Moderator)

| Page | Feature | Description |
|------|---------|-------------|
| **Dashboard** | Quick Stats | Personal QP score, rank, recent activity, quick links to all features |
| **RTQ Page** | Real-Time Questions | Browse, search, filter by status/category, expand answers inline |
| **Raise Question** | Ask a Question | Submit questions through RAG duplicate detection engine |
| **Track Questions** | Personal Tracker | Track own submitted questions with interactive status selectors |
| **FAQ Page** | Knowledge Base | Browse approved FAQs by category, upvote, search |
| **Leaderboard** | Rankings | Peer leaderboard (Student/Moderator) with crown & trophy badges |
| **Notifications** | Activity Feed | QP changes, approvals, rejections, promotions |
| **QP History** | Transaction Log | Full history of QP earnings and deductions |

### 🎓 Senior Panel (Senior & Admin)

| Page | Feature | Description |
|------|---------|-------------|
| **Dashboard** | Command Center | Senior-specific stats, quick actions, pending reviews |
| **RTQ Management** | Full Control | Accept/reject questions, approve/reject answers, flag for review, permanently remove |
| **Add to FAQ** | Controlled Conversion | Multi-step review modal to convert resolved RTQs into approved FAQs |
| **Add New FAQ** | Manual Creation | Directly create new FAQ entries with category and tags |
| **Working History** | Personal Audit Trail | Track all RTQ→FAQ conversions performed by the senior |
| **Leaderboard** | Senior Rankings | Independent senior/admin leaderboard track |
| **FAQ Conversion Requests** | Review Panel | Approve/reject FAQ conversion requests from moderators |
| **User Management** | Admin Controls | Whitelist management, access request approvals, role assignments, block/unblock users |

### 🧠 RAG Duplicate Detection Engine
- **Semantic Embeddings** via local `@xenova/transformers` (all-MiniLM-L6-v2, 384-dim vectors)
- **Qdrant Cloud ANN Search** with HNSW indexes and cosine distance
- **Decision Tree** evaluates FAQ + RTQ similarity to accept, reject, or penalize duplicate submissions
- **LRU Embedding Cache** (500 entries) for sub-10ms repeated queries
- **Auto-Upvote Engine** — duplicate submissions automatically upvote matching FAQ/RTQ entries

### 💰 QP Reputation Economy
- Granular point system rewarding quality contributions across all roles
- Automatic penalties for duplicate/low-quality submissions
- **QP < 50** → Question-raising restricted
- **QP ≥ 500** → Auto-promotion request to Moderator
- **100 QP** welcome bonus on first signup
- Full transaction history with notifications

---

## 🎨 Design System

The UI follows a **premium academic-tech** aesthetic inspired by Linear and Notion — minimal, structured, and trustworthy.

### Typography
| Font | Usage |
|------|-------|
| **Playfair Display** | Brand accent, logo, elegant headings |
| **Outfit** | Body text, navigation, UI elements |

### Design Principles
- **Glassmorphism** — Frosted-glass overlays with backdrop blur for modals and search
- **Gradient Accents** — Accent-to-violet gradient buttons, badges, and icon containers
- **Micro-Animations** — Accordion transitions, scale-in modals, hover effects, floating elements
- **Card-Based Layout** — Consistent card design with subtle shadows and border accents
- **Status-Coded Borders** — Left border color coding (green/amber/red) for question status

### Shared Component Library

| Component | Description |
|-----------|-------------|
| `Nav` | Persistent navbar with PippaQ branding, QP animation, and global search |
| `GlobalSearch` | "/" shortcut overlay searching FAQ + RTQ simultaneously |
| `UpvoteButton` | Toggleable upvote with optimistic updates |
| `Avatar` | Role-colored avatar with initials |
| `StatusBadge` | Dynamic role-aware status badges (moderator=blue, senior=purple) |
| `EmptyState` | Illustrated empty state with optional action button |
| `SkeletonLoader` | Shimmer loading placeholders for all page layouts |
| `BackToTop` | Smooth scroll-to-top floating button |
| `Breadcrumb` | Navigation breadcrumb trail |
| `MiniChart` | SVG sparkline for 7-day trend charts |

---

## 📸 App Screenshots

### 🔑 General (Auth & Profile)

<table>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/sign_up.png" width="400"/><br/><b>Sign Up</b></td>
    <td align="center"><img src="assets/UI_Visuals/Login.png" width="400"/><br/><b>Login</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/request_approval.png" width="400"/><br/><b>Request Approval</b></td>
    <td align="center"><img src="assets/UI_Visuals/profile.png" width="400"/><br/><b>Profile</b></td>
  </tr>
</table>

### 👨‍🎓 Peer Panel (Student & Moderator)

<table>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/peer_dashboard.png" width="400"/><br/><b>Peer Dashboard</b></td>
    <td align="center"><img src="assets/UI_Visuals/peer_rtq.png" width="400"/><br/><b>Real-Time Questions</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/peer_duplicate_check.png" width="400"/><br/><b>RAG Duplicate Check</b></td>
    <td align="center"><img src="assets/UI_Visuals/peer_track_question.png" width="400"/><br/><b>Track Questions</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/peer_leaderboard.png" width="400"/><br/><b>Peer Leaderboard</b></td>
    <td align="center"><img src="assets/UI_Visuals/moderator_faq.png" width="400"/><br/><b>FAQ Page (Moderator View)</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/moderator_rtq.png" width="400"/><br/><b>RTQ Moderation</b></td>
    <td align="center"><img src="assets/UI_Visuals/moderator_rtq_ops.png" width="400"/><br/><b>RTQ Moderation Actions</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/moderator_rtq_to_faq_conversion_request.png" width="400"/><br/><b>FAQ Conversion Request Modal</b></td>
    <td></td>
  </tr>
</table>

### 🎓 Senior Panel (Senior & Admin)

<table>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/senior_dashboard.png" width="400"/><br/><b>Senior Dashboard</b></td>
    <td align="center"><img src="assets/UI_Visuals/senior_faq.png" width="400"/><br/><b>FAQ Management</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/senior_rtq.png" width="400"/><br/><b>RTQ Management</b></td>
    <td align="center"><img src="assets/UI_Visuals/senior_rtq_ops.png" width="400"/><br/><b>Senior RTQ Actions</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/senior_add_question.png" width="400"/><br/><b>Add to FAQ Modal</b></td>
    <td align="center"><img src="assets/UI_Visuals/senior_history.png" width="400"/><br/><b>Working History</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/senior_leaderboard.png" width="400"/><br/><b>Senior Leaderboard</b></td>
    <td align="center"><img src="assets/UI_Visuals/admin_whitelist.png" width="400"/><br/><b>Admin Whitelist Management</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/UI_Visuals/admin_access_request.png" width="400"/><br/><b>Admin Access Requests</b></td>
    <td></td>
  </tr>
</table>

---

## 🏗️ Project Structure

```
FAQ/
├── SPEC.md                              # Project specification
├── CONTEXT.md                           # Detailed implementation context
├── README.md
│
├── client/                              # React + Vite frontend
│   └── src/
│       ├── App.jsx                      # Role-based dashboard routing
│       ├── index.css                    # Design system (Playfair Display & Outfit)
│       ├── components/
│       │   ├── Nav.jsx                  # Persistent navbar with QP animation
│       │   ├── GlobalSearch.jsx         # "/" shortcut → overlay search FAQ+RTQ
│       │   ├── UpvoteButton.jsx         # Toggleable upvote with optimistic UI
│       │   ├── Avatar.jsx              # Role-colored avatar
│       │   ├── Badge.jsx               # Status badges (accepted/rejected/review)
│       │   ├── MiniChart.jsx           # SVG sparkline for trend charts
│       │   └── ...                     # EmptyState, BackToTop, Breadcrumb, etc.
│       ├── context/
│       │   ├── AuthContext.jsx          # JWT auth with role + QP
│       │   └── QPContext.jsx            # QP state management
│       ├── pages/
│       │   ├── LoginPage.jsx            # PippaQ branded login
│       │   ├── SignupPage.jsx           # Whitelist signup + access request flow
│       │   ├── StudentDashboard.jsx     # Student/Moderator dashboard
│       │   ├── SeniorDashboard.jsx      # Senior/Admin dashboard
│       │   ├── FAQPage.jsx              # Knowledge base with categories & upvotes
│       │   ├── RTQPage.jsx              # Real-time questions list
│       │   ├── RTQDetailPage.jsx        # Full question detail + answers
│       │   ├── RaiseQuestionPage.jsx    # Submit question (RAG-evaluated)
│       │   ├── TrackQuestionPage.jsx    # Track own questions
│       │   ├── UserListPage.jsx         # Leaderboard + Admin user management
│       │   ├── WorkingHistoryPage.jsx   # Senior's conversion history
│       │   ├── AboutPage.jsx            # Interactive About page with symbolism
│       │   └── ...                      # Profile, QP History, Add FAQ, etc.
│       └── services/
│           ├── api.js                   # Axios instance with interceptors
│           ├── auth.service.js          # Auth API methods
│           ├── faq.service.js           # FAQ CRUD + conversion requests
│           ├── rtq.service.js           # RTQ operations
│           └── dashboard.service.js     # Dashboard stats + activity feed
│
├── server/                              # Express.js backend
│   └── src/
│       ├── config/
│       │   ├── db.js                    # MongoDB connection
│       │   ├── env.js                   # Environment config
│       │   └── qdrant.js               # Qdrant Cloud singleton client
│       ├── controllers/
│       │   ├── auth.controller.js       # Signup, OTP, login
│       │   ├── faq.controller.js        # FAQ CRUD + review/trending
│       │   ├── faq-conversion.controller.js  # Conversion request workflow
│       │   ├── rtq.controller.js        # RTQ submit + moderation + QP loops
│       │   ├── rag.controller.js        # RAG evaluation + vector rebuild
│       │   ├── admin.controller.js      # User CRUD, roles, block/unblock
│       │   ├── admin.whitelist.controller.js  # Whitelist + access requests
│       │   ├── categoryUpvote.controller.js   # Category ranking + upvotes
│       │   └── qp.controller.js         # QP score + history
│       ├── models/
│       │   ├── User.model.js            # Roles: student|moderator|senior|admin
│       │   ├── FAQ.model.js             # FAQ with review & trending flags
│       │   ├── RTQ.model.js             # RTQ with bidirectional FAQ link
│       │   ├── Answer.model.js          # Approvals/rejections + review flag
│       │   ├── QPTransaction.model.js   # QP earn/deduct ledger
│       │   ├── Notification.model.js    # Role-scoped notifications
│       │   ├── FAQConversionRequest.model.js  # Moderator→Senior conversion requests
│       │   ├── EmailWhitelist.model.js  # Admin-controlled signup gate
│       │   ├── AccessRequest.model.js   # Non-whitelisted signup requests
│       │   └── ...                      # CategoryUpvote, RoleRequest, Question
│       ├── services/
│       │   ├── auth.service.js          # Signup + OTP + JWT generation
│       │   ├── qp.service.js            # Award/deduct QP + auto-promotion
│       │   ├── autoupvote.service.js    # Atomic auto-upvote on duplicates
│       │   ├── notification.service.js  # Notification creation
│       │   ├── vector/                  # Qdrant vector services
│       │   │   ├── transformer.service.js   # Local Sentence Transformer + LRU cache
│       │   │   ├── embedding.service.js     # Embedding pipeline
│       │   │   ├── faq.vector.service.js    # FAQ vector CRUD in Qdrant
│       │   │   └── rtq.vector.service.js    # RTQ vector CRUD in Qdrant
│       │   └── sync/                    # MongoDB ↔ Qdrant sync
│       │       ├── faq.sync.service.js      # FAQ sync + rollback
│       │       ├── rtq.sync.service.js      # RTQ sync + rollback
│       │       └── sync.repair.service.js   # Missing/stray vector detection
│       └── routes/                      # Express route definitions
│
├── rag-engine/                          # RAG Decision Engine
│   └── decision-engine/
│       └── decision.tree.js             # Semantic duplicate detection via Qdrant ANN
│
├── shared/
│   └── constants.js                     # FAQ_CATEGORIES, QP_RULES, ROLES, RAG_THRESHOLDS
│
├── scripts/
│   ├── migrate-categories.js            # Category normalization migration
│   └── bulk-import.js                   # Bulk FAQ import utility
│
└── assets/
    └── UI_Visuals/                      # App screenshots for README
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router v6, Axios |
| **Styling** | Tailwind CSS + Premium Typography (Playfair Display & Outfit via Google Fonts) |
| **Backend** | Express.js, Mongoose ODM, JWT (bcryptjs) |
| **Database** | MongoDB (Atlas) |
| **Vector Store** | Qdrant Cloud (HNSW indexes, cosine distance, 384-dim, metadata payload filters) |
| **Embeddings** | `@xenova/transformers` — local WebAssembly/ONNX execution of `all-MiniLM-L6-v2` |
| **Dev Tools** | `concurrently` (parallel client + server), Vite HMR |

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
│  ├── R1: RTQ > 60%            │ REJECT (no penalty), upvote   │
│  └── R2/R3: RTQ ≤ 60%         │ ACCEPT → Route to RTQ         │
└───────────────────────────────┴───────────────────────────────┘
```

> **Performance:** Includes an **LRU Embedding Cache** (500 entries) and model warmup on server startup for sub-10ms semantic queries.

---

## 👥 Roles & Permissions

| Role | Key Capabilities |
|------|-----------------|
| **Student** | Ask RTQ questions, answer (1×/question), upvote, track own questions |
| **Moderator** | + Approve/reject answers, accept/reject questions, request FAQ conversions |
| **Senior** | + Create FAQs, convert RTQ→FAQ via review panel, delete content, manage working history |
| **Admin** | + Manage email whitelist, approve access requests, assign/revoke roles, block/unblock users |

---

## 💰 QP (Quality Point) Economy

### Earning QP
| Action | QP |
|--------|-----|
| Answer a question | +2 |
| Answer approved by Moderator/Senior | +5 |
| Answer selected for FAQ | +10 |
| Question accepted (valid RTQ) | +5 |
| Question promoted to FAQ | +20 |
| Senior converts RTQ→FAQ | +10 |
| Senior creates new FAQ manually | +15 |
| Welcome bonus (account activation) | +100 |

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

## 📂 Key API Routes

| Route | Description |
|-------|-------------|
| `POST /api/auth/signup` | Register + email OTP verification |
| `POST /api/auth/login` | JWT login |
| `POST /api/auth/request-access` | Request signup approval (non-whitelisted) |
| `GET /api/faq` | List approved FAQs (paginated, searchable) |
| `POST /api/faq` | Create FAQ (Senior/Admin) |
| `GET /api/rtq` | List RTQs with filters |
| `POST /api/rtq/question` | Submit question through RAG engine |
| `POST /api/rtq/:id/answer` | Add answer to RTQ |
| `POST /api/rag/evaluate-question` | Run RAG decision tree |
| `POST /api/faq/request-conversion` | Moderator: request FAQ conversion |
| `GET /api/faq/conversion-requests` | Senior/Admin: list pending conversions |
| `GET /api/users` | User list / leaderboard |
| `GET /api/qp/my-score` | Current QP balance |
| `PATCH /api/admin/assign-role` | Admin: change user role |

---

## 🔄 User Flows

### Signup & Access
```
Whitelisted Email → Signup → OTP Verification → 100 QP Welcome Bonus → Login
Non-Whitelisted   → Access Request → Admin Approval → Account Created → Login
Blocked User      → Re-Access Request → Admin Approval → Account Reactivated
```

### Question Lifecycle
```
Student submits question
      │
      ▼
RAG Engine evaluates (FAQ + RTQ similarity)
      │
      ├── REJECT (duplicate) → -5 QP penalty, auto-upvote match
      │
      └── ACCEPT → Added to RTQ pool
            │
            ├── Peers answer → Moderators approve/reject → QP awarded
            │
            ├── Moderator requests FAQ conversion → Senior reviews → Approved/Rejected
            │
            └── Senior converts to FAQ directly → Published to Knowledge Base
```

### Multi-Moderator Decision Flow
```
Moderator Action on Question:
  ├── Accept → Status: resolved, +5 QP to questioner, +3 QP to moderator
  ├── Reject (1st) → Status: rejected, +3 QP to moderator
  └── Reject (2nd, different moderator) → Permanent deletion, -5 QP to questioner
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (>= 18)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Qdrant Cloud](https://cloud.qdrant.io/) account (or local Qdrant instance)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vicharanashala/cs20.git
   cd cs20
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env — set MONGO_URI, JWT_SECRET, QDRANT_URL, QDRANT_API_KEY
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   - **Client**: http://localhost:3000
   - **Server**: http://localhost:5000

---

## 🛡️ System Guarantees

- ✅ Semantic duplicate detection via Qdrant ANN before any question is accepted
- ✅ Atomic QP transactions with rollback-safe decision changes
- ✅ Bidirectional RTQ↔FAQ traceability for all conversions
- ✅ Multi-moderator approval/rejection with collusion prevention (max 2 per moderator)
- ✅ Auto-upvote on duplicate detection rewards original authors
- ✅ Role-based UI constraints — actions are hidden from unauthorized roles
- ✅ Idempotent decision rollbacks when moderators change their verdict
- ✅ MongoDB ↔ Qdrant sync with automatic rollback on vector store failures
- ✅ 100 QP welcome bonus across all account activation paths
- ✅ Email whitelist gate prevents unauthorized signups

---

## 📄 License

**Authors:** Vicharanashala Team

---

<p align="center">Built with ❤️ using React, Express, MongoDB & Qdrant</p>
