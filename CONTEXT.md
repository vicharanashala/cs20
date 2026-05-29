# CONTEXT.md — Q&A Platform Project Context

> Generated: 2026-05-28 | Last updated: 2026-05-29 (FAQ category upvoting & Qdrant UUID fix)

---

## 📌 What This Is

A semantic query-resolution and FAQ generation platform with a **QP (Quality Point) reputation economy**, **role-based access control**, **Qdrant Cloud vector search**, and **admin-controlled email whitelist signup**. Users raise real-time queries, get peer/moderator/senior answers, and high-quality content graduates into an approved FAQ knowledge base.

**Status:** All 19 diagnosed bugs fixed. Qdrant Cloud integrated. Admin role system active. Email whitelist signup gate active. Server on port 5000, client on port 3000.

---

## 🗂️ Directory Structure

```
FAQ-main/
├── SPEC.md
├── CONTEXT.md
├── client/
│   └── src/
│       ├── App.jsx                    # Role-based dashboard routing; Nav included
│       ├── components/
│       │   ├── Nav.jsx                # Persistent nav bar
│       │   ├── AnswerCard.jsx         # Real user ID upvote check
│       │   ├── QPBadge.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── RoleGuard.jsx
│       │   └── UpvoteButton.jsx
│       ├── context/
│       │   ├── AuthContext.jsx        # JWT role+qp; requestAccess
│       │   └── QPContext.jsx
│       ├── pages/
│       │   ├── SignupPage.jsx         # Email whitelist gate + request approval flow
│       │   ├── UserListPage.jsx       # Admin: Users + Whitelist + Access Requests tabs
│       │   ├── FAQPage.jsx             # Category upvote buttons + ranked sorting
│       │   └── ... (all other pages)
│       ├── routes/
│       └── services/
│           ├── auth.service.js         # requestAccess method
│           ├── faq.service.js          # listCategoriesRanked, upvoteCategory
│           └── admin.service.js        # Whitelist + Access Request API
├── server/
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   ├── env.js
│       │   └── qdrant.js              # NEW: Qdrant Cloud singleton client
│       ├── controllers/
│       │   ├── admin.controller.js     # Full user CRUD; role management; block/unblock
│       │   ├── admin.whitelist.controller.js  # NEW: whitelist + access request mgmt
│       │   ├── auth.controller.js     # signup restriction; requestAccessUser
│       │   ├── categoryUpvote.controller.js   # NEW: list ranked categories + toggle upvote
│       │   └── ... (existing)
│       ├── middleware/
│       │   ├── auth.middleware.js     # JWT with role+qp in payload
│       │   └── role.middleware.js     # authorizeRoles middleware
│       ├── models/
│       │   ├── User.model.js          # role: student|moderator|senior|admin
│       │   ├── RoleRequest.model.js    # Blocked-user re-access requests
│       │   ├── EmailWhitelist.model.js # NEW: admin-controlled signup email list
│       │   ├── AccessRequest.model.js  # NEW: non-whitelisted signup requests
│       │   └── CategoryUpvote.model.js # NEW: category upvotes + upvotedBy tracking
│       ├── routes/
│       │   ├── admin.routes.js        # Admin-only routes (whitelist + access requests)
│       │   ├── auth.routes.js         # /request-access endpoint
│       │   ├── categoryUpvote.routes.js # NEW: /api/faq/categories/ranked, /upvote/:name
│       │   └── vector.routes.js       # NEW: /api/vector/health, /api/vector/rebuild
│       └── services/
│           ├── auth.service.js         # signup checks whitelist; JWT: {id, role, qp}
│           ├── qp.service.js
│           ├── vector/                # NEW: Qdrant vector services
│           │   ├── collection.service.js  # Auto-create collections (HNSW, cosine, 384-dim)
│           │   ├── embedding.service.js   # TF-IDF n-gram embedder
│           │   ├── faq.vector.service.js  # FAQ vector CRUD in Qdrant
│           │   ├── rtq.vector.service.js  # RTQ vector CRUD in Qdrant
│           │   └── similarity.service.js
│           └── sync/                  # NEW: MongoDB ↔ Qdrant sync
│               ├── sync.events.js        # Event emitter
│               ├── faq.sync.service.js  # FAQ sync + rollback
│               ├── rtq.sync.service.js   # RTQ sync + rollback
│               └── sync.repair.service.js # Missing/stray vector detection + reindex
├── rag-engine/
│   ├── embedding/embedder.js          # Corpus-aware TF-IDF n-gram embedder (384-dim)
│   └── vectorDB/                      # Legacy in-memory vector DB (superseded by Qdrant)
└── shared/constants.js                # FAQ_CATEGORIES, QP_RULES, ROLES, etc.
```

---

## ✅ Fixes Applied (19 issues) + New Features

### 🔴 Critical (original 19)

| # | File | Fix |
|---|------|-----|
| 1 | `rtq.controller.js` | RAG evaluated before RTQ is created; rejected questions no longer persist |
| 2 | `rtq.routes.js` | All static paths placed before `/:id` |
| 3 | `rtq.controller.js` | `convertToFAQ` populates `answers.userId`; sorts by upvotes in JS |
| 4 | `qp.service.js` | `QPTransaction.amount` positive; `type` encodes direction |
| 5 | `ProfilePage.jsx` | `tx.reason` (was `tx.description`) |
| 6 | `NotificationsPage.jsx` | `notif.qpImpact` (was `notif.qpChange`) |
| 7 | `user.service.js` | Duplication noted |
| 8 | `App.jsx` | No double-routing; role-based dashboard |
| 9 | `TrackQuestionPage.jsx` | Status dropdown matches enum: `unresolved / partial / resolved` |
| 10 | `user.controller.js` | Removed duplicate `getLeaderboard` |
| 11 | `embedder.js` etc. | Corpus-aware IDF via `rebuildVocabulary` |
| 12 | `rtq.controller.js` (`markAccepted`) | No duplicate QP for questioner |
| 13 | `qp.service.js` | `checkAutoPromotion` called inside `awardQP` |
| 14 | `QPContext.jsx` | `useEffect` fetches QP on mount |
| 15 | `AnswerCard.jsx` | Upvote uses `user._id` from `useAuth()` |
| 16 | `Nav.jsx` (new), `App.jsx` | Persistent nav bar on all authenticated pages |
| 17 | `App.jsx` | `/dashboard` → `SeniorDashboard` for senior/admin |
| 18 | `RaiseQuestionPage.jsx` | Dead `FAQ_MATCH` status removed |
| 19 | Routes audit | `PATCH /api/admin/assign-role` is the correct live endpoint |

### 🟢 Qdrant Cloud Integration (NEW — v2)

| # | File | Purpose |
|---|------|---------|
| Q1 | `config/qdrant.js` | Singleton Qdrant client, retry logic, connection validation |
| Q2 | `services/vector/collection.service.js` | Auto-create faq_collection + rtq_collection (HNSW, cosine, 384-dim, payload indexes) |
| Q3 | `services/vector/embedding.service.js` | Text preprocessing + `generateEmbedding()` using rag-engine embedder |
| Q4 | `services/vector/similarity.service.js` | Cosine/dot/euclidean similarity |
| Q5 | `services/vector/faq.vector.service.js` | insert/search/update/delete FAQ vectors |
| Q6 | `services/vector/rtq.vector.service.js` | insert/search/update/delete RTQ vectors |
| Q7 | `services/sync/sync.events.js` | Event emitter for sync operations |
| Q8 | `services/sync/faq.sync.service.js` | FAQ MongoDB↔Qdrant sync with rollback |
| Q9 | `services/sync/rtq.sync.service.js` | RTQ MongoDB↔Qdrant sync with rollback |
| Q10 | `services/sync/sync.repair.service.js` | Missing/stray vector detection + full reindex |
| Q11 | `routes/vector.routes.js` | `GET /api/vector/health`, `POST /api/vector/rebuild` |
| Q12 | `server.js` | Startup: validate Qdrant → initialize collections |
| Q13 | `app.js` | Mounted `/api/vector` routes |
| Q14 | `rtq.controller.js` | Wired syncRTQInsert on accept, syncRTQDelete on remove, syncRTQDelete+syncFAQInsert on convert |
| Q15 | `faq.controller.js` | Wired syncFAQInsert on create, syncFAQUpdate on update, syncFAQDelete on delete |
| Q16 | `services/vector/*.js` | Format MongoDB 24-character ObjectId to standard 36-character UUID for Qdrant point IDs to resolve Bad Request error |

### 🟡 Admin Role System (NEW — v2)

| # | File | Purpose |
|---|------|---------|
| A1 | `models/RoleRequest.model.js` | Blocked-user re-access requests (pre-existing) |
| A2 | `auth.service.js` | JWT now includes `{id, role, qp}` — role enforced via middleware |
| A3 | `auth.controller.js` | `requestReAccessUser` for blocked users |
| A4 | `server.js` | `INITIAL_ADMIN_EMAIL` env var — auto-promotes user to admin on startup |
| A5 | `admin.controller.js` | Full CRUD: getUsers, addUser, updateUser, deleteUser, assignRole, blockUser, unblockUser, reactivateUser |
| A6 | `admin.routes.js` | All routes require `authorizeRoles('admin')`; `/assign-role` back-compat route |

### 🔵 Email Whitelist System (NEW — v3)

| # | File | Purpose |
|---|------|---------|
| W1 | `models/EmailWhitelist.model.js` | Stores admin-approved signup emails |
| W2 | `models/AccessRequest.model.js` | Stores pending signup requests from non-whitelisted users |
| W3 | `auth.service.js` (`signupUser`) | Checks whitelist before creating user; returns `{restricted: true}` if not in list |
| W4 | `auth.service.js` (`requestAccess`) | Creates AccessRequest for non-whitelisted users |
| W5 | `controllers/admin.whitelist.controller.js` | `getWhitelist`, `addToWhitelist`, `removeFromWhitelist`, `getAccessRequests`, `approveAccessRequest`, `rejectAccessRequest` |
| W6 | `admin.routes.js` | `GET/POST/DELETE /admin/whitelist`, `GET/POST /admin/access-requests/:id/approve|reject` |
| W7 | `pages/SignupPage.jsx` | Shows "Access Restricted" → "Request Approval" button → "Request Submitted" on non-whitelisted signup |
| W8 | `pages/UserListPage.jsx` | Admin tabs: **Users** + **Email Whitelist** + **Access Requests** |

### 🟠 FAQ Category Upvoting (NEW — v4)

| # | File | Purpose |
|---|------|---------|
| C1 | `models/CategoryUpvote.model.js` | Stores `categoryName` (unique), `upvotes`, `upvotedBy` (ObjectId[]), `lastActivity` |
| C2 | `controllers/categoryUpvote.controller.js` | `listCategoriesWithUpvotes` (merge FAQ_CATEGORIES + DB data, sort by popularity), `upvoteCategory` (toggle on/off, duplicate prevention) |
| C3 | `routes/categoryUpvote.routes.js` | `GET /api/faq/categories/ranked`, `POST /api/faq/categories/upvote/:categoryName` |
| C4 | `app.js` | Mounted `/api/faq/categories` **before** `/api/faq` to avoid `:id` param collision |
| C5 | `services/faq.service.js` (client) | Added `listCategoriesRanked()`, `upvoteCategory(name)` |
| C6 | `pages/FAQPage.jsx` | Fetches ranked categories on mount; sorts category groups by upvotes desc; inline upvote button per category header; optimistic UI with rollback |

**Design decisions:**
- Dedicated `CategoryUpvote` collection — zero changes to existing `FAQ.model.js` schema
- Toggle pattern (upvote/un-upvote) matches existing `upvoteFAQ` behavior
- Category ranking affects only UI display order — no impact on RAG, QP, or vector sync

---

## 🧠 Architecture Notes

### Qdrant vs MongoDB Responsibilities
- **MongoDB Atlas**: Application data (users, questions, answers, QP transactions, notifications)
- **Qdrant Cloud**: Vector embeddings only (384-dim TF-IDF/BPE vectors for FAQ + RTQ semantic search)
- Separation enables O(log n) ANN similarity search instead of O(n) brute-force

### MongoDB ↔ Qdrant Sync Model
- MongoDB is source of truth
- Qdrant synced on: RTQ create/delete/status-change, FAQ create/update/delete, RTQ→FAQ conversion
- If Qdrant fails: MongoDB operation is rolled back (insert/delete) or logged (update/delete)
- `sync.repair.service.js` can detect missing/stray vectors and full-reindex

### Embedding Model Improvements (Chunks 1–7)

All 7 chunks have been implemented in `rag-engine/embedding/embedder.js`:

| Chunk | Feature | Impact |
|-------|---------|--------|
| 1 | Hash-based stable indexing + importance truncation | Deterministic vectors; top 384 n-grams by weight |
| 2 | Separate IDF vocabularies per corpus (FAQ / RTQ) | No cross-contamination between corpra |
| 3 | Persist IDF vocabulary to disk (`vocab-faq.json`, `vocab-rtq.json`) | Cold start recovery — no IDF degradation |
| 4 | Stop word filtering + Porter stemming | Cleaner token streams; unified morphology |
| 5 | Word-level n-grams (1-2) alongside char n-grams | Phrase-level matching ("reset password" as unit) |
| 6 | Pure-JS BPE tokenizer (opt-in) | Better subword capture; enable with `{ useBPE: true }` |
| 7 | Transformer service stub (`transformer.service.js`) | Ready for `@xenova/transformers`; falls back to TF-IDF |

**To enable BPE mode:**
```js
const embedder = new Embedder({ useBPE: true, bpeVocabSize: 4000 });
embedder.trainBPE(corpusTexts, 4000); // call once at startup
```

**To enable transformer embeddings:**
```bash
npm install @xenova/transformers
```
Then call `getTransformerEmbedder()` instead of the TF-IDF embedder. Model: `Xenova/all-MiniLM-L6-v2` (384-dim).

### Email Whitelist Gate
- ALL signups require email in `EmailWhitelist` collection
- Non-whitelisted users see "Access Restricted" → submit `AccessRequest`
- Admin approves → email added to whitelist + user account auto-created
- `INITIAL_ADMIN_EMAIL` ensures first admin can always be bootstrapped

---

## 🔧 Next Steps

1. ~~Wire email sending (OTP console-logged in dev)~~ — still dev-only
2. Add `docs/` content
3. ~~Qdrant Cloud integrated~~ — add credentials to `.env` when ready
4. Add rate limiting to `/api/auth/signup` and `/api/rag/evaluate-question`
5. Run `POST /api/vector/rebuild` with `{collection: 'faq'}` or `'rtq'` to reindex after bulk import
6. Add email sending (SendGrid/Resend) for production OTP delivery
7. ~~FAQ category upvoting~~ — implemented (v4)
