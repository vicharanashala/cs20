# PRODUCT.md — PippaQ

> Complete specification to recreate PippaQ from scratch.

---

## What Is PippaQ

PippaQ is a high-performance, semantic query-resolution and FAQ generation platform built for communities and organizations. Users submit real-time queries (RTQs), receive answers from peers, moderators, and seniors, and high-quality resolved content graduates into an approved FAQ knowledge base. A QP (Quality Point) reputation economy incentivizes participation and quality.

**Tech Stack:**
- Frontend: React + Vite + Tailwind CSS + DaisyUI + Lucide Icons
- Backend: Node.js + Express + MongoDB (Mongoose)
- Vector Search: Qdrant Cloud (ANN, cosine similarity, 384-dim HNSW)
- Embeddings: `@xenova/transformers` — local ONNX execution of `all-MiniLM-L6-v2`
- Auth: JWT (payload includes `id`, `role`, `qp`)
- Typography: Playfair Display (brand accent) + Outfit (body/headers) via Google Fonts
- Dev: `npm run dev` → frontend on port 3000, backend on port 5000

---

## Directory Structure

```
FAQ-main/
├── SPEC.md
├── CONTEXT.md
├── README.md
├── client/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Nav.jsx
│       │   ├── AnswerCard.jsx
│       │   ├── QPBadge.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── RoleGuard.jsx
│       │   ├── UpvoteButton.jsx
│       │   ├── GlobalSearch.jsx
│       │   └── MiniChart.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── QPContext.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── SignupPage.jsx
│       │   ├── StudentDashboard.jsx
│       │   ├── SeniorDashboard.jsx
│       │   ├── FAQPage.jsx
│       │   ├── RTQPage.jsx
│       │   ├── RTQDetailPage.jsx
│       │   ├── TrackQuestionPage.jsx
│       │   ├── WorkingHistoryPage.jsx
│       │   ├── UserListPage.jsx
│       │   ├── UserProfilePage.jsx
│       │   └── AboutPage.jsx
│       ├── routes/
│       └── services/
│           ├── auth.service.js
│           ├── faq.service.js
│           ├── admin.service.js
│           └── dashboard.service.js
├── server/
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   ├── env.js
│       │   └── qdrant.js
│       ├── controllers/
│       │   ├── admin.controller.js
│       │   ├── admin.whitelist.controller.js
│       │   ├── auth.controller.js
│       │   ├── categoryUpvote.controller.js
│       │   ├── rtq.controller.js
│       │   ├── faq.controller.js
│       │   └── rag.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── role.middleware.js
│       ├── models/
│       │   ├── User.model.js
│       │   ├── RoleRequest.model.js
│       │   ├── EmailWhitelist.model.js
│       │   ├── AccessRequest.model.js
│       │   ├── CategoryUpvote.model.js
│       │   ├── FAQ.model.js
│       │   ├── Answer.model.js
│       │   ├── FAQConversionRequest.model.js
│       │   └── RTQ.model.js
│       ├── routes/
│       │   ├── admin.routes.js
│       │   ├── auth.routes.js
│       │   ├── faq.routes.js
│       │   ├── categoryUpvote.routes.js
│       │   └── rag.routes.js
│       └── services/
│           ├── auth.service.js
│           ├── qp.service.js
│           ├── autoupvote.service.js
│           ├── vector/
│           │   ├── collection.service.js
│           │   ├── embedding.service.js
│           │   ├── transformer.service.js
│           │   ├── faq.vector.service.js
│           │   └── rtq.vector.service.js
│           └── sync/
│               ├── sync.events.js
│               ├── faq.sync.service.js
│               ├── rtq.sync.service.js
│               └── sync.repair.service.js
├── rag-engine/
│   └── decision-engine/
│       └── decision.tree.js
├── scripts/
│   └── migrate-categories.js
└── shared/
    └── constants.js
```

---

## Roles

Four user roles with strictly enforced access control via `authorizeRoles` middleware:

| Role | Description |
|---|---|
| `student` | Can submit RTQs, answer questions, upvote, track own questions |
| `moderator` | All student permissions + approve/reject answers, accept/reject RTQs, request FAQ conversions |
| `senior` | All moderator permissions + initiate FAQ conversions, edit/delete FAQs, view working history |
| `admin` | Full access including user management, whitelist control, access request approval |

Role badge colors: Student → Slate, Moderator → Purple, Senior → Blue, Admin → Red.

---

## Data Models

### User
- `name`, `email` (unique), `password` (bcrypt)
- `role`: enum `['student', 'moderator', 'senior', 'admin']`
- `qp`: Number (Quality Points balance)
- `isBlocked`: Boolean

### RTQ (Real-Time Query)
- `title`, `body`, `category`, `tags[]`
- `status`: enum `['unresolved', 'partially_resolved', 'resolved']`, default `unresolved`
- `isAccepted`: Boolean
- `answers[]`: ref Answer
- `upvotes`: Number, `upvotedBy[]`: ref User
- `askedBy`: ref User
- `faqId`: ref FAQ (bidirectional link)
- `rejections[]`: ref User (tracks moderator rejections)
- `acceptedBy`: ref User (populated with role)

### Answer
- `body`, `author`: ref User
- `upvotes`: Number, `upvotedBy[]`
- `approvals[]`: ref User, `rejections[]`: ref User
- `approvedBy`: ref User (populated with role)
- `markedForReview`: Boolean
- `isAccepted`: Boolean

### FAQ
- `question`, `answer`, `category`, `tags[]`
- `upvotes`: Number, `upvotedBy[]`
- `markedForReview`: Boolean
- `isTrending`: Boolean
- `createdBy`: ref User
- `rtqId`: ref RTQ (bidirectional link)

### FAQConversionRequest
- `rtqId`: ref RTQ
- `answerId`: ref Answer
- `requestedBy`: ref User (populated with role)
- `status`: enum `['pending', 'approved', 'rejected']`
- `requestedAt`: Date

### EmailWhitelist
- `email` (unique)
- `addedBy`: ref User

### AccessRequest
- `name`, `email`, `reason`
- `status`: enum `['pending', 'approved', 'rejected']`

### CategoryUpvote
- `category`: String (unique)
- `upvotes`: Number
- `upvotedBy[]`: ref User

---

## Shared Constants (`shared/constants.js`)

### FAQ_CATEGORIES (10 standardized values)
These are the canonical category names used everywhere. No numeric prefixes, no em-dashes — use standard hyphens only.

### QP_RULES
```
QUESTION_SUBMIT:          0
QUESTION_ACCEPTED:       +5
QUESTION_REJECTED:       -5  (on second moderator rejection)
QUESTION_UPVOTE_BONUS:   +5  (auto-upvote on duplicate detection)
ANSWER_APPROVED:         +5  (answerer)
ANSWER_REJECTED:         -3  (answerer)
MODERATOR_APPROVE:       +3
MODERATOR_REJECT:        +3
MODERATOR_ACCEPT:        +3
FAQ_CONVERSION_SENIOR:  +10
FAQ_CONVERSION_ANSWERER:+10
```

### ROLES
```
STUDENT, MODERATOR, SENIOR, ADMIN
```

---

## Core Systems

### 1. Semantic Embedding (Sentence Transformers)
- Model: `@xenova/transformers` local ONNX execution of `all-MiniLM-L6-v2`
- Produces 384-dimensional dense vectors
- LRU embedding cache in `transformer.service.js` (max 500 entries) avoids recomputing duplicate texts
- Warmed up on server startup for sub-10ms first queries
- `rebuild-vectors` endpoint: pulls all MongoDB entries, recomputes vectors, re-indexes Qdrant

### 2. Qdrant Cloud Vector Search
- `qdrant.js`: singleton Qdrant Cloud client
- `collection.service.js`: auto-creates collections with HNSW, cosine similarity, 384-dim
- `faq.vector.service.js`: FAQ CRUD in Qdrant
- `rtq.vector.service.js`: RTQ CRUD in Qdrant
- `sync/`: MongoDB ↔ Qdrant sync with event emitter, per-entity sync services, and repair utility for missing/stray vectors

### 3. RAG Duplicate Detection (Decision Tree)
`rag-engine/decision-engine/decision.tree.js` runs semantic ANN search against Qdrant on every new RTQ submission:

| Rule | FAQ Score | RTQ Score | Outcome |
|---|---|---|---|
| F1 | > 80% | — | REJECT, deduct 5 QP, auto-upvote FAQ |
| F2+R1 | 50–80% | > 60% | REJECT, deduct 5 QP, auto-upvote FAQ |
| F2+R2 | 50–80% | 20–60% | REJECT, no penalty |
| F2+R3 | 50–80% | ≤ 20% | ACCEPT → route to RTQ |
| F3+R1 | ≤ 50% | > 60% | REJECT, no penalty, auto-upvote RTQ |
| F3+R2/R3 | ≤ 50% | ≤ 60% | ACCEPT → route to RTQ |

### 4. Auto-Upvote Engine (`autoupvote.service.js`)
- Atomic `$inc` + `$addToSet` to prevent double upvotes
- Fetches original author ID, awards `QUESTION_UPVOTE_BONUS` (+5 QP)
- Sends notification to author
- Fully integrated with decision tree outcomes in `rtq.controller.js`

### 5. QP Economy (`qp.service.js`)
- `awardQP(userId, amount)` and `deductQP(userId, amount)`
- JWT payload always reflects current QP on login; frontend `QPContext` tracks live balance
- All QP mutations are atomic and tied to specific moderation/answer events (see QP_RULES)

---

## API Endpoints

### Auth (`auth.routes.js`)
- `POST /auth/signup` — restricted to whitelisted emails; returns JWT
- `POST /auth/login` — returns JWT with `{id, role, qp}`
- `POST /auth/request-access` — creates AccessRequest for non-whitelisted emails

### RTQ (`rtq.routes.js`)
- `GET /rtq` — list RTQs (supports `filter=history` for seniors)
- `POST /rtq` — submit question (triggers RAG decision tree)
- `GET /rtq/:id` — RTQ detail with populated answers, acceptedBy (with role), approvedBy (with role)
- `POST /rtq/:id/answer` — add answer; senior answering auto-resolves RTQ status to `resolved`
- `PATCH /rtq/status/:questionId` — update status (owner only)
- `POST /rtq/:id/upvote` — toggle upvote on RTQ
- `POST /rtq/:id/answer/:answerId/upvote` — toggle upvote on answer
- `POST /rtq/:id/accept` — accept RTQ (moderator/senior/admin); awards QP
- `POST /rtq/:id/reject` — reject RTQ (moderator); first rejection sets rejected, second causes deletion + QP deduction
- `POST /rtq/:id/answer/:answerId/approve` — approve answer (moderator); max 2 approvals per question per moderator
- `POST /rtq/:id/answer/:answerId/reject` — reject answer (moderator)
- `DELETE /rtq/:id` — permanent remove (senior/admin only)
- Decision rollback: all accept/reject/approve/reject endpoints implement idempotent QP rollback when a moderator changes a prior decision

### FAQ (`faq.routes.js`)
- `GET /faq` — list FAQs with category filter, sort options
- `POST /faq` — create FAQ (senior/admin)
- `PUT /faq/:id` — edit FAQ (senior/admin)
- `DELETE /faq/:id` — delete FAQ (senior/admin); removes Qdrant vector
- `POST /faq/:id/upvote` — toggle upvote
- `PATCH /faq/review-faq/:id` — flag for review (moderator/senior/admin)
- `PATCH /faq/toggle-trending/:id` — toggle trending (moderator/senior/admin)
- `POST /rtq/:id/convert` — senior initiates RTQ→FAQ conversion (opens review modal); awards +10 QP to senior and +10 to answerer; prevents duplicate via `rtq.faqId` check
- `GET /faq/conversion-requests` — list pending conversion requests (senior/admin)
- `POST /faq/conversion-requests/:id/approve` — approve, auto-index in Qdrant with rollback safety
- `POST /faq/conversion-requests/:id/reject` — reject request

### Category Upvotes (`categoryUpvote.routes.js`)
- `GET /faq/categories/ranked` — sorted list of categories by upvote count
- `POST /faq/categories/upvote/:name` — toggle upvote on a category

### Admin (`admin.routes.js`)
- `GET /admin/users` — list all users
- `PUT /admin/users/:id/role` — update role
- `POST /admin/users/:id/block` / `unblock` — block/unblock user
- `GET /admin/whitelist` — list whitelisted emails
- `POST /admin/whitelist` — add email to whitelist
- `DELETE /admin/whitelist/:id` — remove email
- `GET /admin/access-requests` — list access requests
- `POST /admin/access-requests/:id/approve` — approve (adds to whitelist + creates student user)
- `POST /admin/access-requests/:id/reject` — reject request

### RAG (`rag.routes.js`)
- `POST /rag/evaluate-question` — run decision tree on a question
- `POST /rag/rebuild-vectors` — rebuild all Qdrant vectors from MongoDB

---

## Frontend Pages & Behavior

### LoginPage & SignupPage
- PippaQ brand logo with Playfair Display + custom letter tracking
- Signup restricted to whitelisted emails; non-whitelisted users see "Access Restricted" + "Request Approval" button
- Error handling aligned with Axios interceptor (`api.js` rejects with payload data object directly)

### StudentDashboard & SeniorDashboard
- Role Status Badge in header: Student → Slate, Moderator → Purple, Senior → Blue, Admin → Red
- Quick-link cards: 5 cards for Student, 3 for Senior (balanced grid, no gaps)
- No "Notifications" quick-link card (bell indicator exists in navbar)
- Skeleton loading animations match grid layout
- MiniChart SVG sparklines for 7-day trend data

### FAQPage
- Category list sorted by upvote count by default
- Sort options within each category: Most Upvoted, Newest First, Oldest First
- All Categories filter works correctly (not just General)
- Frontend normalization strips numeric prefixes and converts em-dashes to regular hyphens on API response
- FAQ conversion requests collapsible dashboard at top (visible to senior/admin)
- Moderator/senior/admin see a Lucide Settings gear icon on each FAQ card opening a dropdown with: Flag for Review, Set/Remove Trending, Edit FAQ (senior), Delete FAQ (senior)
- Gear icon is hidden from student users

### RTQPage & RTQDetailPage
- "Ask a Question" button hidden for admin and senior roles
- Status badges: Unresolved (Red), Partially Resolved (Amber), Resolved (Green) — read-only
- Role-based highlight badges: moderator actions → blue, admin/senior actions → purple, rejections → red
- Moderation controls use Lucide icon-only buttons: Settings gear for select/cancel, Check/X/Flag for actions with tooltips
- Gear panel: moderators see "Request FAQ Conversion" (FileText icon); seniors/admins see only "Remove" (Trash2 icon)
- Universal status marks visible to all roles: ✓ Accepted, ✗ Rejected, ⚠️ Marked for Review, ✓ Approved, ✗ Rejected
- Expanding an RTQ card auto-selects best answer via 4-tier priority: (1) senior's own answer, (2) senior-approved, (3) moderator-approved, (4) highest upvoted

### TrackQuestionPage
- Owner's RTQ submissions with interactive status dropdown
- Dropdown options color-coded: Resolved → green, Partially Resolved → light blue, Unresolved → red

### WorkingHistoryPage (Senior)
- Lists FAQ entries created by the logged-in senior that originated from an RTQ (rtqId present)
- Personal audit trail of all senior-approved FAQ conversions

### UserListPage (Admin)
- Three tabs: Users, Whitelist, Access Requests
- Users tab: full CRUD, role management, block/unblock
- Leaderboard: segmented toggle — Peers (Student/Moderator) and Seniors (Senior/Admin) as separate ranked lists, each starting at rank #1
- Non-privileged users (student/moderator) only see the Peers list

### UserProfilePage
- User profile at `/users/:id`

### AboutPage
- Interactive SVG logo with symbol cards for each concept (Vṛtta shown with circle SVG, Jaṭā with waving matted-hair SVG)
- CSS keyframe animations: colored circles (blue, green, orange) release from center logo on hover and travel toward respective pointed cards
- Hotspot pulsing via inline `transformOrigin` for symmetrical in-place ping animation
- SVG `<foreignObject>` containers sized generously (e.g., 310×180, 240×240, 500×130) with centered cards to prevent box-shadow and hover transform clipping
- Q Symbol highlight card: `height: 92px`, `<foreignObject>` `height: 135px` to prevent text overflow

### GlobalSearch (`/` shortcut)
- Overlay search across both FAQ and RTQ content

### Nav
- Persistent navbar with PippaQ branding and QP animation
- Bell icon for notifications

---

## Auth & Middleware

### JWT Payload
```json
{ "id": "<userId>", "role": "student|moderator|senior|admin", "qp": 120 }
```

### auth.middleware.js
Validates JWT, attaches decoded user to `req.user`.

### role.middleware.js
`authorizeRoles(...roles)` — rejects requests from users not in the allowed roles list.

### Signup Guard
`auth.service.js` checks `EmailWhitelist` before creating user. Returns 403 if email not whitelisted.

---

## Multi-Moderator Moderation & QP Economy

- Multiple moderators can approve a single answer; capped at max 2 approvals per question per moderator (collusion prevention)
- Approving an answer: answerer +5 QP, moderator +3 QP
- Rejecting an answer: answerer -3 QP, moderator +3 QP
- Accepting an RTQ question: status → resolved, isAccepted = true, questioner +5 QP, moderator +3 QP
- First moderator rejection: status → rejected, moderator +3 QP
- Second moderator rejection (different moderator): permanent deletion from MongoDB + Qdrant, questioner -5 QP, second moderator +3 QP
- Decision rollback: idempotent logic when a moderator changes a prior decision — retracts previous mark, calculates exact QP delta for both user and moderator, then applies new decision

---

## Category System

10 standardized categories locked in `shared/constants.js`. No numeric prefixes anywhere in the DB or UI. Migration utility `scripts/migrate-categories.js` cleans old prefixed data and seeds CategoryUpvote collection.

Backend category filters in `faq.controller.js` and `rtq.controller.js` use a regex pattern for flexible matching.

---

## Styling & Branding

- Fonts: `<link rel="preconnect">` + Google Fonts import for Playfair Display and Outfit in `client/index.html`
- `@import` in `index.css` must come before all `@tailwind` directives (avoids Vite CSS import warning)
- Brand name "PippaQ" rendered with custom letter tracking across navbar, login, signup
- DaisyUI badge variants used: `badge-info` (blue/moderator), custom `badge-purple` (senior/admin), `badge-danger` (rejections/negative)

---

## Environment Variables

```
# Server
PORT=5000
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<secret>
QDRANT_URL=<qdrant cloud cluster URL>
QDRANT_API_KEY=<qdrant api key>

# Client
VITE_API_URL=http://localhost:5000
```

---

## Key Constraints & Business Rules

1. Students and moderators cannot submit to FAQ directly — only via the controlled senior review workflow.
2. A senior can only initiate FAQ conversion after an RTQ is resolved and has an approved answer.
3. `rtq.faqId` is checked before conversion — duplicate conversions are blocked.
4. Category names must match the 10 standardized values in `shared/constants.js`. Any display normalization (prefix stripping, dash conversion) happens on the frontend only — the DB stores clean values.
5. UpvoteButton allows toggling off an existing upvote (retractable upvotes enabled for both FAQ and RTQ).
6. QP balance is embedded in the JWT; `QPContext` tracks live balance on the frontend.
7. All MongoDB ↔ Qdrant mutations include rollback safety via sync services and event emitters.