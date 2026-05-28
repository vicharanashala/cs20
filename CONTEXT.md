# CONTEXT.md — Q&A Platform Project Context

> Generated: 2026-05-28 | Last updated: 2026-05-28 (post-diagnosis patch)

---

## 📌 What This Is

A semantic query-resolution and FAQ generation platform with a QP (Quality Point) reputation economy and role-based access control. Users raise real-time queries, get peer/moderator/senior answers, and high-quality content graduates into an approved FAQ knowledge base.

**Status:** All 19 diagnosed bugs fixed. Server on port 5000, client on port 3000.

---

## 🗂️ Directory Structure

```
FAQ-main/
├── SPEC.md
├── CONTEXT.md
├── client/
│   └── src/
│       ├── App.jsx                    # Fixed: no double-routing; role-based dashboard; Nav included
│       ├── components/
│       │   ├── Nav.jsx                # NEW: persistent nav bar
│       │   ├── AnswerCard.jsx         # Fixed: real user ID upvote check
│       │   ├── QPBadge.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── RoleGuard.jsx
│       │   └── UpvoteButton.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── QPContext.jsx          # Fixed: useEffect fetches QP on mount
│       ├── pages/
│       │   ├── NotificationsPage.jsx  # Fixed: qpImpact field (was qpChange)
│       │   ├── ProfilePage.jsx        # Fixed: tx.reason (was tx.description); sign display
│       │   ├── RaiseQuestionPage.jsx  # Fixed: correct RAG status fields
│       │   ├── TrackQuestionPage.jsx  # Fixed: correct status enum values
│       │   └── ... (all other pages unchanged)
│       ├── routes/
│       │   └── AppRoutes.jsx          # Retired (was causing double-routing)
│       └── services/ (unchanged)
├── server/
│   └── src/
│       ├── config/
│       │   └── db.js                  # Fixed: uses logger consistently
│       ├── controllers/
│       │   ├── rtq.controller.js      # Fixed: RAG-before-create; double QP; answer selection; populate
│       │   └── user.controller.js     # Fixed: removed duplicate getLeaderboard
│       ├── routes/
│       │   ├── rtq.routes.js          # Fixed: all static paths before /:id
│       │   └── user.routes.js         # Fixed: removed duplicate leaderboard route
│       └── services/
│           └── qp.service.js          # Fixed: positive amounts; auto-promotion fires
└── rag-engine/
    ├── embedding/
    │   └── embedder.js                # Fixed: corpus-aware IDF (rebuildVocabulary)
    └── vectorDB/
        ├── faq-vector.js              # Fixed: calls rebuildVocabulary
        └── rtq-vector.js              # Fixed: calls rebuildVocabulary
```

---

## ✅ Fixes Applied (19 issues)

### 🔴 Critical

| # | File | Fix |
|---|------|-----|
| 1 | `rtq.controller.js` | RAG evaluated before RTQ is created; rejected questions no longer persist |
| 2 | `rtq.routes.js` | All static paths (`/approve-answer`, `/mark-accepted`, `/convert`, `/report`) placed before `/:id` |
| 3 | `rtq.controller.js` | `convertToFAQ` populates `answers.userId`; sorts by upvotes in JS; senior-own-answer check works |
| 4 | `qp.service.js` | `QPTransaction.amount` always stored as positive; `type` encodes direction |
| 5 | `ProfilePage.jsx` | `tx.reason` (was `tx.description`) |
| 6 | `NotificationsPage.jsx` | `notif.qpImpact` (was `notif.qpChange`) |
| 7 | `user.service.js` | Duplication noted; no functional change needed (same endpoints) |
| 8 | `App.jsx` | Routes render page components directly — no nested `<AppRoutes>` double-routing |
| 9 | `TrackQuestionPage.jsx` | Status dropdown values match model enum: `unresolved / partial / resolved` |
| 10 | `user.controller.js` | Removed duplicate `getLeaderboard`; removed from `user.routes.js` |

### 🟠 Logic

| # | File | Fix |
|---|------|-----|
| 11 | `embedder.js`, `faq-vector.js`, `rtq-vector.js` | `rebuildVocabulary(texts[])` stores corpus-wide IDF; `embedSingle` uses stored IDF |
| 12 | `rtq.controller.js` (`markAccepted`) | Questioner no longer awarded duplicate +5 QP; only moderator/senior gets QP |
| 13 | `qp.service.js` | `checkAutoPromotion` called inside `awardQP`; sends notification at 500 QP |
| 14 | `QPContext.jsx` | `useEffect` fetches QP on mount and on user change |
| 15 | `AnswerCard.jsx` | Upvote check uses `user._id` from `useAuth()` |

### 🟡 Missing features

| # | File | Fix |
|---|------|-----|
| 16 | `Nav.jsx` (new), `App.jsx` | Persistent nav bar renders on all authenticated pages |
| 17 | `App.jsx` | `/dashboard` renders `SeniorDashboard` for senior/admin, `StudentDashboard` otherwise |
| 18 | `RaiseQuestionPage.jsx` | Dead `FAQ_MATCH` status removed; `matchedFAQ` / `matchedRTQ` fields used correctly |
| 19 | Routes audit | `PATCH /api/users/role` was spec-only; `PATCH /api/admin/assign-role` is the correct live endpoint — no change needed |

### 🔵 Minor

| # | File | Fix |
|---|------|-----|
| — | `db.js` | Uses `logger` instead of `console.log/error` |
| — | `rtq.controller.js` (`listRTQs`) | Answers now populated with `userId` in list view |

---

## 🔧 Next Steps (post-fix)

1. Wire email sending (OTP console-logged in dev — use SendGrid/Resend for prod)
2. Add `docs/` content
3. Swap in-memory vector store for Qdrant/Pinecone in production
4. Add rate limiting to `/api/auth/signup` and `/api/rag/evaluate-question`
5. Run `POST /api/rag/rebuild-vectors` after any bulk FAQ/RTQ import
