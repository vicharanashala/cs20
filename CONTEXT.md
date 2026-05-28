# CONTEXT.md — Q&A Platform Project Context

> Generated: 2026-05-28 | Last updated: 2026-05-28

---

## 📌 What This Is

A semantic query-resolution and FAQ generation platform with a QP (Quality Point) reputation economy and role-based access control. Users raise real-time queries, get peer/moderator/senior answers, and high-quality content graduates into an approved FAQ knowledge base.

**Location:** `D:\faq`
**Status:** Partially built — foundation done, controllers/routes/pages not yet written

---

## 🗂️ Directory Structure

```
D:\faq\
├── SPEC.md                    # Full project specification
├── CONTEXT.md                 # This file
├── client/                    # React frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── pages/             # (empty — not yet created)
│       ├── components/        # Shared UI components
│       ├── context/           # AuthContext, QPContext
│       ├── services/          # API service layers
│       ├── routes/            # (AppRoutes.jsx not yet created)
│       └── utils/             # constants, helpers
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # db.js, env.js
│   │   ├── models/            # User, FAQ, RTQ, Question, Answer, QPTransaction, Notification
│   │   ├── middleware/        # auth, role, qp, access (combinator)
│   │   ├── services/          # auth, qp, notification
│   │   ├── controllers/       # (empty — not yet created)
│   │   ├── routes/            # (empty — not yet created)
│   │   └── utils/             # logger, constants
│   └── server.js              # (not yet created)
├── rag-engine/                # RAG + vector similarity engine
│   ├── embedding/embedder.js  # TF-IDF n-gram embedder (384-dim)
│   ├── similarity/cosine.similarity.js
│   ├── vectorDB/faq-vector.js # FAQ index rebuild + findMostSimilar
│   ├── vectorDB/rtq-vector.js # RTQ index rebuild + findMostSimilar
│   ├── decision-engine/decision.tree.js  # Full F1/F2/F3 × R1/R2/R3 decision tree
│   ├── pipeline/question.pipeline.js
│   └── index.js               # Barrel export
├── shared/
│   └── constants.js           # ROLES, QP_RULES, QP_THRESHOLDS, RAG_THRESHOLDS
└── docs/                      # (empty)
```

---

## 👥 Roles

| Role | Description |
|------|-------------|
| `student` | Default. Ask questions, answer (1 per question), upvote, track own |
| `moderator` | + Approve answers, accept/reject questions, mark trendy |
| `senior` | + Create FAQ manually, convert RTQ→FAQ, delete any content, approve answers |
| `admin` | + Manage email whitelist, assign roles, revoke users |

---

## 💰 QP System

### Earning
| Action | QP |
|--------|-----|
| Answer a question | +2 |
| Answer approved by Moderator | +5 |
| Answer approved by Senior | +5 |
| Answer selected for FAQ | +10 bonus |
| Question accepted (valid RTQ entry) | +5 |
| Question promoted to FAQ | +20 |
| Moderator approves answer | +5 |
| Moderator marks question accepted | +5 |
| Senior answers | +5 |
| Senior approves answer | +5 |
| Senior converts RTQ→FAQ | +10 |
| Senior creates new FAQ manually | +15 |

### Penalties
| Action | QP |
|--------|-----|
| Duplicate FAQ match (F1) | -5 |
| F2+R1 match (medium FAQ + high RTQ) | -5 |
| Answer removed by Senior | -3 |
| Question removed | -5 |

### Thresholds
- QP < 50: Cannot raise questions
- QP ≥ 500: Auto-request Moderator promotion

---

## 🧠 RAG Decision Tree

```
User Question → Embed (384-dim TF-IDF) → Compare FAQ vectors + RTQ vectors

F1: FAQ similarity > 80%
  → REJECT + -5 QP + upvote matched FAQ

F2: 50% < FAQ ≤ 80%
  + R1: RTQ > 60%    → REJECT + -5 QP + upvote FAQ & RTQ
  + R2: 20% < RTQ ≤ 60%  → REJECT (no penalty)
  + R3: RTQ ≤ 20%    → ACCEPT → Add to RTQ

F3: FAQ ≤ 50%
  + R1: RTQ > 60%    → REJECT (no penalty) + upvote RTQ
  + R2/R3: RTQ ≤ 60% → ACCEPT → Add to RTQ
```

**Thresholds** (defined in `shared/constants.js`):
- `FAQ_F1`: 0.80
- `FAQ_F2_MIN`: 0.50
- `RTQ_R1`: 0.60
- `RTQ_R2_MIN`: 0.20

---

## 🗄️ MongoDB Models

### User
```
name, username, email, password, role, qp, status,
emailOtp, emailOtpExpires, restrictedAt, createdAt
```

### FAQ
```
question, answer, category, tags, upvotes, upvotedBy[],
createdBy, vectorEmbedding[], isTrending, markedForReview
```

### RTQ
```
question, category, tags, answers[], status, upvotes,
upvotedBy[], postedBy, vectorEmbedding[], approvedAnswer,
isAccepted, acceptedBy, markedForReview, reports[]
```

### Question (Page 7 tracking)
```
userId, question, category, tags, status,
faqMatched, rtqMatched, answers[]
```

### Answer
```
questionId, userId, answer, upvotes, upvotedBy[],
isApproved, approvedBy, isSelectedForFAQ, reports[]
```

### QPTransaction
```
userId, type (earn/deduct), amount, reason, referenceId
```

### Notification
```
userId, role, type, message, qpImpact, read, referenceId
```

---

## 🌐 Pages (not yet built)

| Route | Page | Access |
|-------|------|--------|
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/faq` | FAQPage (1A) | All authenticated |
| `/rtq` | RTQPage (1B) | All authenticated |
| `/dashboard` | StudentDashboard (2) | Student/Moderator |
| `/dashboard` | SeniorDashboard (3) | Senior/Admin |
| `/add-faq` | AddFAQPage (4A) | Senior only |
| `/raise-question` | RaiseQuestionPage (4B) | Student/Moderator |
| `/profile` | ProfilePage (5) | All authenticated |
| `/users` | UserListPage (6) | All (filtered by role) |
| `/track` | TrackQuestionPage (7) | Student own |
| `/history` | WorkingHistoryPage (8) | Student own |
| `/notifications` | NotificationsPage (9) | All authenticated |

---

## 🔌 API Endpoints (not yet wired)

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login`
- `GET /api/auth/me`

### FAQ
- `GET /api/faq`, `POST /api/faq`, `PUT /api/faq/:id`, `DELETE /api/faq/:id`
- `POST /api/faq/upvote/:id`

### RTQ
- `GET /api/rtq`, `POST /api/rtq/question`, `POST /api/rtq/:id/answer`
- `POST /api/rtq/answer/upvote/:answerId`
- `PATCH /api/rtq/approve-answer/:answerId`
- `PATCH /api/rtq/mark-accepted/:id`
- `DELETE /api/rtq/:id`

### Questions
- `GET /api/questions/user/:id`, `PATCH /api/questions/resolve/:id`

### Users
- `GET /api/users`, `PATCH /api/users/role`, `DELETE /api/users/:id`

### QP
- `GET /api/qp/my-score`, `GET /api/qp/history`, `GET /api/leaderboard`

### Notifications
- `GET /api/notifications`, `PATCH /api/notifications/read/:id`

### Admin
- `POST /api/admin/approve-user`, `GET /api/admin/pending-users`

### RAG
- `POST /api/rag/evaluate-question`

---

## 🎨 Styling

- Background: `#f8fafc` (slate-50)
- Cards: white, border `#e5e7eb`, radius 10px, shadow `0 1px 2px rgba(0,0,0,0.04)`
- Primary button: `#0f172a` bg, white text, radius 10px
- Secondary button: white bg, border `#cbd5e1`
- Text: `#0f172a` primary, `#6b7280` muted
- Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Max width: 1100px centered
- Spacing: 8/12/16/24/32px rhythm
- Focus ring: `0 0 0 3px rgba(15,23,42,0.08)`
- Transitions: `0.2s ease` everywhere

---

## 📋 Changelog

See `git log --oneline` or `git log --format="%h %s"` for all changes, maintained in Conventional Commits style.
Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `style:`, `build:`, `docs:`, `test:`, `chore:`.

## ❌ What's NOT Built Yet

- `server/src/server.js` — Express entry point
- `server/src/app.js` — Express app setup with all routes
- `server/src/controllers/` — All controllers (auth, faq, rtq, question, answer, user, qp, notification, admin, rag)
- `server/src/routes/` — All route files
- `client/src/routes/AppRoutes.jsx` — Route definitions for all pages
- `client/src/pages/` — All page components (Login, Signup, FAQ, RTQ, Dashboards, Raise Question, Profile, Users, Track, History, Notifications)
- Root `package.json` with workspace scripts
- `README.md`
- `docs/` content

---

## 🔧 Next Steps (Recommended Order)

1. Write `server/src/app.js` + `server.js` with all route registrations
2. Write all controllers (auth → faq/rtq → qp/notification → admin)
3. Write `client/src/routes/AppRoutes.jsx`
4. Write all React pages (auth first, then FAQ/RTQ, then dashboards, then rest)
5. Create root `package.json` with `npm run dev` scripts for both client and server
6. Install dependencies and verify build

---

## 📝 Notes

- RAG embedder uses **TF-IDF on character n-grams** (no external AI API required). Swap for OpenAI/sentence-transformers in production.
- Vector DB is **in-memory** (vectors stored in MongoDB documents). Swap for Qdrant/Pinecone in production.
- OTP is **logged to console** in dev (`auth.service.js`). Wire to an email provider (SendGrid, Resend) for production.
- QP middleware (`requireNotRestricted`) checks `user.restrictedAt` timestamp — if set, all write actions are blocked.
- The `secureAccess()` middleware combinator in `access.middleware.js` lets you chain `[authenticate, authorizeRoles(...), requireQP(n), requireNotRestricted]` cleanly.