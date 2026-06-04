# CONTEXT.md — PippaQ Project Context

> Last updated: 2026-06-04 | About Page Symbolism Icons, Directed Release Animations, Card Hover Clipping Fix, and Q-Card Text Overflow Resolution

---

## 📌 What This Is

**PippaQ** is a high-performance, semantic query-resolution and FAQ generation platform featuring a **QP (Quality Point) reputation economy**, **role-based access control**, **Qdrant Cloud vector search**, **local Sentence Transformers**, and **admin-controlled email whitelist signup**. Users raise real-time queries (RTQs), get peer/moderator/senior answers, and high-quality content graduates into an approved FAQ knowledge base.

**Status:** Fully operational. All legacy TF-IDF in-memory vector DBs have been replaced with a production-ready **Sentence Transformer + Qdrant Cloud ANN** pipeline. Complete auto-upvote, multi-moderator RTQ loops, decision rollback transactions, and QP execution loops are fully integrated. Premium typography and branding (Playfair Display & Outfit) are applied.

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
│       │   ├── FAQPage.jsx            # Category upvote buttons + settings gear icon dropdown menu
│       │   ├── UserProfilePage.jsx    # User profile at /users/:id
│       │   └── ... (all other pages)
│       ├── routes/
│       └── services/
│           ├── auth.service.js         # requestAccess method
│           ├── faq.service.js          # listCategoriesRanked, upvoteCategory, reviewFAQ, toggleTrendingFAQ
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
│       │   ├── rtq.controller.js      # Submit question + RAG evaluation + QP/Upvote loops + multi-moderator
│       │   ├── faq.controller.js      # FAQ CRUD + Qdrant vectors + review/trending toggles
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
│       │   ├── CategoryUpvote.model.js # category upvotes + upvotedBy tracking
│       │   ├── FAQ.model.js           # markedForReview and isTrending flags
│       │   └── Answer.model.js        # approvals/rejections Arrays + markedForReview flag
│       ├── routes/
│       │   ├── admin.routes.js        # Admin-only routes (whitelist + access requests)
│       │   ├── auth.routes.js         # /request-access endpoint
│       │   ├── faq.routes.js          # /review-faq and /toggle-trending endpoints
│       │   ├── categoryUpvote.routes.js # /api/faq/categories/ranked, /upvote/:name
│       │   └── rag.routes.js          # RAG endpoints: evaluate-question + rebuild-vectors
│       └── services/
│           ├── auth.service.js         # signup checks whitelist; JWT: {id, role, qp}
│           ├── qp.service.js           # awardQP / deductQP service methods
│           ├── autoupvote.service.js   # consolidated atomic FAQ & RTQ auto-upvote
│           ├── vector/                # Qdrant vector services
│           │   ├── collection.service.js  # Auto-create collections (HNSW, cosine, 384-dim)
│           │   ├── embedding.service.js   # Sentence Transformer embeddings
│           │   ├── transformer.service.js # Local @xenova/transformers (all-MiniLM-L6-v2) + LRU Cache
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
* **F3+R1 (FAQ ≤ 50%, RTQ > 60%):** REJECT, no penalty, auto-upvote matching RTQ.
* **F3+R2/R3 (FAQ ≤ 50%, RTQ ≤ 60%):** ACCEPT → route to RTQ.

### 3. Consolidated Auto-Upvote Engine
Implemented a new service [autoupvote.service.js](file:///d:/FAQs/FAQ/server/src/services/autoupvote.service.js) to handle duplicate-prevention auto-upvotes:
* **Atomic Operations:** Uses atomic `$inc` and `$addToSet` to prevent a user from upvoting the same question twice.
* **QP Integration:** Automatically fetches the original author's ID and awards the `QUESTION_UPVOTE_BONUS` (+5 QP) while sending a notification to the author.
* Fully integrated with the decision tree outcomes in [rtq.controller.js](file:///d:/FAQs/FAQ/server/src/controllers/rtq.controller.js).

### 4. Premium Branding & Font Stack (PippaQ)
* **Fonts:** Added preconnect tags and loaded **Playfair Display** (elegant serif brand accent) and **Outfit** (sleek sans-serif body/headers) from Google Fonts in [client/index.html](file:///d:/FAQs/FAQ/client/index.html).
* **Visuals:** Updated the navbar, login page, and signup pages to feature the elegant, high-contrast **PippaQ** brand name with customized letter tracking.

### 5. Role-Based UI Constraints & Dashboard UX Refinements
* **Ask a Question button:** Restructured [RTQPage.jsx](file:///d:/FAQs/FAQ/client/src/pages/RTQPage.jsx) so the `+ Ask a Question` button is hidden for `'admin'` and `'senior'` roles, remaining visible only for `'student'` and `'moderator'` users.
* **Dashboard Layouts:** Removed the redundant "Notifications" quick link cards from both [StudentDashboard.jsx](file:///d:/FAQs/FAQ/client/src/pages/StudentDashboard.jsx) and [SeniorDashboard.jsx](file:///d:/FAQs/FAQ/client/src/pages/SeniorDashboard.jsx) (as a dedicated bell indicator exists in the header).
* **Grid Balancing:** Balanced the dashboards' remaining quick link cards (5 on Student, 3 on Senior) to fill the grid rows perfectly without gaps and updated corresponding skeleton loading layout animations.

### 6. Standardized FAQ/RTQ Categories & Migration Utility
* **Standardized Categories:** Locked the master list of categories to 10 standardized, clean, non-index-prefixed values across the entire platform in both client utils and shared constants.
* **Migration Utility:** Created a dedicated database migration tool [migrate-categories.js](file:///d:/FAQs/FAQ/scripts/migrate-categories.js) that cleans up numeric prefixes, maps older categories to correct equivalents, and seeds the `CategoryUpvote` database collection for these 10 clean values.
* **FAQPage Filter Fix:** Fixed "All Categories" in [FAQPage.jsx](file:///d:/FAQs/FAQ/client/src/pages/FAQPage.jsx) showing only General.
* **Category Upvote Normalization & Dash Cleaning:** Added frontend normalization in `loadFAQs` that strips numeric prefixes (e.g. `"9. Rosetta — your internship journal"` → `"Rosetta - your internship journal"`) from `grouped` keys on API response and converts Unicode em-dashes (`—` or `–`) into standard regular hyphens (`-`) with standardized spacing.
* **Retractable/Toggleable Upvotes:** Fixed a UI constraint in [UpvoteButton.jsx](file:///d:/FAQs/FAQ/client/src/components/UpvoteButton.jsx) that was disabling the button when `hasUpvoted` was true. Toggling off upvotes is now fully enabled, allowing users to retract their upvote by clicking the active button again.
* **Flexible Backend Category Matcher:** Modified the category filters in [faq.controller.js](file:///d:/FAQs/FAQ/server/src/controllers/faq.controller.js) and [rtq.controller.js](file:///d:/FAQs/FAQ/server/src/controllers/rtq.controller.js) to query categories using a robust regex pattern.
* **Default Category & Item Sorting:** Updated `filteredCategories` on the FAQPage to sort rendered categories according to their upvote counts (`sortedCategoryNames`) by default, placing the category with the most upvotes at the top. Also added a `sortItems` utility that sorts the FAQs inside each category on the frontend according to the active sort filter selection ('Most Upvoted', 'Newest First', 'Oldest First') to guarantee perfect sorting alignment under all conditions.

### 7. Question Status Marking System
* **Models:** Updated `RTQ.model.js` and `Question.model.js` status enums to `['unresolved', 'partially_resolved', 'resolved']`, with default status as `'unresolved'`.
* **API Endpoints:** Added route `PATCH /rtq/status/:questionId` mapping to the secure `updateRTQStatus` controller (accessible only by the question owner).
* **Auto-Update Hooks:** Integrated a senior answering auto-resolve hook inside `addAnswer` so that when a Senior submits an answer to an RTQ, the question status automatically changes to `'resolved'`.
* **Frontend Division of Concerns:**
  - **Public RTQ Listing & Details Pages**: Display status as premium read-only badges (`Unresolved`, `Partially Resolved`, `Resolved`) using custom visual highlights (Red, Amber, Green).
  - **Track Questions Page**: Renders interactive status dropdown selectors for the owner's RTQ submissions, allowing manual resolution tracking directly from their tracking dashboard.

### 8. Whitelist Request Access System
* **Context & Rules:** Users attempting signup with emails not in the admin whitelist are restricted (`403 Forbidden`).
* **Request Access Flow:**
  - Signup page displays a distinct **"Access Restricted"** message and a **"Request Approval"** button.
  - Submitting a request creates an `AccessRequest` document in the database (`pending` status).
  - Admin view (`UserListPage.jsx` > `Access Requests` tab) can **Approve** (adds email to whitelist, creates active `'student'` user) or **Reject** (marks request as rejected).
* **Fix & Alignment:** Aligned [SignupPage.jsx](file:///d:/FAQs/FAQ/client/src/pages/SignupPage.jsx) error handlers to resolve a mapping mismatch with the custom Axios response interceptor (`api.js`), which rejects promises directly with the payload data object, restoring full visibility of the "Request Approval" flow.

### 9. Dashboard Role Status Visibility
* **Dashboard Header Badges:** Integrated a beautiful, styled, and role-based **Role Status Badge** inside the header of both `StudentDashboard.jsx` and `SeniorDashboard.jsx`.
* **Dynamic Role Representation:** Displays high-contrast HSL badges corresponding to the user's role:
  - `'student'`: Slate badge (`Student`)
  - `'moderator'`: Purple badge (`Moderator`)
  - `'senior'`: Blue badge (`Senior`)
  - `'admin'`: Red badge (`Admin` / `Admin Dashboard` header)
* **Compatibility:** Completely non-disruptive, preserves all existing stats, rank queries, and grid balancing actions.

### 10. Multi-Moderator RTQ Moderation & QP Economy
* **Multi-Moderator Answer Approvals**:
  - Allows multiple moderator approvals per answer (capped at max 2 approvals per question per moderator to prevent collusion).
  - Approvals reward the answerer `+5 QP` and the moderator `+3 QP`.
* **Answer Rejections**:
  - Allows moderator rejections. Rejections penalize the answerer `-3 QP` and reward the moderator `+3 QP`.
* **Question Acceptance**:
  - Accepting an RTQ question changes status to `'resolved'`, sets `isAccepted = true`, and rewards `+5 QP` to the questioner and `+3 QP` to the moderator.
* **Question Rejection (Multi-Moderator)**:
  - First moderator rejection sets status to `'rejected'` and rewards `+3 QP` to the moderator.
  - A second moderator rejection by a different moderator triggers permanent deletion of the question from MongoDB and Qdrant, deducts `5 QP` from the questioner, and rewards `+3 QP` to the second moderator.
* **Decision Transitions & QP Rollbacks**:
  - Implemented automatic, idempotent decision rollback and QP adjustment logic when a moderator changes their decision (e.g. from Accept to Reject, or Approve to Reject):
    - Retracts the previous mark and calculates the precise QP points to deduct or refund from both the user and the moderator before applying the new decision.
* **Sleek Icon-Only Frontend Controls**:
  - Refactored `RTQPage.jsx` and `RTQDetailPage.jsx` selection controls and action panels to use sleek Lucide icons instead of text:
    - Selection/cancel actions are represented by a clean settings gear (`Settings`) icon.
    - Action buttons render as compact, modern check (`Check`), close (`X`), and flag (`Flag`) icons with supportive tooltips.
* **Universal Badge Visibility**:
  - Status marks (`✓ Moderator Accepted`, `✗ Moderator Rejected`, `⚠️ Marked for Review`, `✓ Moderator Approved`, `✗ Moderator Rejected`) are rendered universally, making them visible to all users (including students) across the RTQ list, RTQ detail, track questions, and working history views.
* **FAQ Page Moderator Actions (Settings Dropdown Menu)**:
  - Refactored `FAQPage.jsx` to render a small Lucide `Settings` gear icon button for moderator actions on any FAQ card, hidden completely from student users.
  - Clicking this gear opens a premium popover dropdown menu containing `Flag for Review` (if not reviewed yet), `Set on Trending` / `Remove Trending` (which toggles trending status via `PATCH /faq/toggle-trending/:id`), and senior's `Edit FAQ` and `Delete FAQ` actions.

### 11. Controlled Senior "Add to FAQ" Workflow & Bidirectional Traceability
* **Bidirectional Mapping**: 
  - Added reference field `faqId` on the `RTQ` model and reference field `rtqId` on the `FAQ` model, guaranteeing 100% bi-directional traceability between original resolved questions and approved FAQ entries.
* **Smart Frontend Auto-Selection**:
  - Expanding an RTQ card executes a local 4-tier selection priority scheme to pre-select the best answer:
    1. Senior's own answer (highest priority).
    2. Senior-approved answer.
    3. Moderator-approved answer.
    4. Fallback to the highest upvoted answer.
* **Review Edit Modal Panel**:
  - Replaced immediate RTQ → FAQ conversion with a multi-step popup modal. When a Senior clicks `"Add to FAQ (Initiate)"`, it opens the panel pre-filled with the auto-selected answer, category, and tags.
  - Seniors have full editorial control to modify the answer, choose a standardized category from a dropdown, and customize comma-separated tags before confirming.
* **Traceable Creation Endpoint**:
  - `convertToFAQ` controller parses custom body payloads (`answerId`, `answer`, `category`, `tags`), links documents, resolves original RTQ status to accepted, awards `+10 QP` to the Senior, awards `+10 QP` to the student answerer, and prevents duplicate conversions via `rtq.faqId` checks.

### 12. Senior Personal Working History
* **Personal Audit Trail**:
  - Upgraded the working history backend `listRTQs` to support `filter === 'history'`.
  - Queries `FAQ` entries created by the currently authenticated Senior (`req.user._id`) that originated from an RTQ (`rtqId` present) and lists only those original RTQs.
  - The `WorkingHistoryPage` now acts as a dedicated personal work history listing for the active Senior.

### 13. Git Merge Resolution & Alignment
* **Unified Moderation Gear Panel**:
  - Integrated features from `origin/main` and unified the settings gear moderation actions in [RTQPage.jsx](file:///d:/FAQs/FAQ/client/src/pages/RTQPage.jsx) and [RTQDetailPage.jsx](file:///d:/FAQs/FAQ/client/src/pages/RTQDetailPage.jsx).
  - Standard moderators see the "Request FAQ Conversion" button (`FileText` icon) under the gear.
  - Seniors & Admins see ONLY the permanent remove (`Trash2` icon) button under the gear, keeping the controlled `Add to FAQ (Initiate)` review modal workflow triggered only from the card bottom/expanded views.
  - Owners see the `Mark as Resolved` (`Check` icon) button.
* **Vite CSS Import Warning Cleaned**:
  - Reordered the font `@import` declaration in [index.css](file:///d:/FAQs/FAQ/client/src/index.css) to precede all `@tailwind` statements, ensuring a completely clean product build output with zero warnings or errors.

### 14. Leaderboard Segmented Toggle & Tier Renames
* **Peers & Seniors Separation:** Partitioned the user lists on the Leaderboard page (`UserListPage.jsx`) into **Peers** (Student/Moderator) and **Seniors** (Senior/Admin).
* **Segmented Toggle Group:** Added a modern tab-like button switcher group at the top of the user list. Privilege-holders (Seniors/Admins) can toggle between the "Peers" list and "Seniors" list. Non-privileged users (Students/Moderators) only see the "Peers" list.
* **Independent Ranking Tracks:** Refactored rankings so each tier runs its own leaderboard starting at rank #1, awarding Crown and Trophy badges to top performers in both groups.

### 15. FAQ Conversion Requests Fixes & FAQ Page Relocation
* **Client Service Alignment:** Fixed TypeError crashes in `RTQPage.jsx` and `RTQDetailPage.jsx` by updating legacy `rtqService.requestConversion` calls to `faqService.requestConversion`.
* **Section Relocation:** Shifted the FAQ conversion request review list from the Users page to a collapsible dashboard at the top of the main `FAQPage.jsx` view.
* **Role Expansion:** Updated backend routing (`faq.routes.js`) to grant permissions to the `'senior'` role for listing, approving, and rejecting FAQ requests, in addition to `'admin'`.
* **Database Schema Field:** Added the missing `requestedAt` field to `FAQConversionRequest.model.js` to enable creation timestamping and sorting.
* **Qdrant Vector indexing:** Linked Qdrant synchronization into `approveConversionRequest` so newly approved conversion requests are automatically indexed in Qdrant (with rollback safety). Also populated `requestedBy` to dynamically resolve user roles for notifications.

### 16. Role-Based Highlight Badges and Status Tags
* **Custom Dynamic Highlighting**:
  - Status badges for approved/accepted actions dynamically change styling based on the user's role:
    - **Moderator actions** (Accepted/Approved by a moderator) display a **blue status tag** (`badge-info`) and a **blue "moderator" badge**.
    - **Admin/Senior actions** (Accepted/Approved by an Admin/Senior) display a **purple status tag** (`badge-purple`) and a **purple "senior"/"admin" badge**.
    - **Negative actions (Rejected)** are universally styled in **red (`badge-danger`)**.
  - Role labels rendered next to answer authors have been updated inline to match the blue (moderator) and purple (senior/admin) highlighted themes.
* **Backend Role Exposing**:
  - Modified the backend RTQ controllers to populate the `acceptedBy` field for questions and the `approvedBy` field for answers, exposing roles to the client.
* **Track Question Status Select Dropdown**:
  - Adjusted the status select dropdown styling in `TrackQuestionPage.jsx` so that the options and container are color-coded (Resolved as green, Partially Resolved as lite blue, and Unresolved as red).

### 17. About Page Interactive Logo Symbolism & Styling Refinements
* **Refined Symbol Icons**: Replaced the diamond symbol for Vṛtta with a circle symbol (SVG + label), and the leaf symbol for Jaṭā with a custom waving SVG representing the matted hair of a sage.
* **Directed Release Animations**: Added CSS keyframe animations releasing streams of colored circles (blue, green, orange) from the center logo that travel directly toward their respective pointed cards on hover.
* **Hotspot Symmetrical Pulsing**: Fixed standard ping animations on hotspots by using inline `transformOrigin` styles to make them pulse symmetrically in-place.
* **Cropping & Layout Resolution**: Expanded all SVG `<foreignObject>` container dimensions (e.g., 310x180, 240x240, 500x130) and centered cards inside using custom margins to prevent box-shadow and hover transformations from clipping.
* **Text Overflow Resolution**: Increased the Q Symbol highlight statement card to `height: 92px` (and its `<foreignObject>` to `height: 135px`) to fully fit the paragraph text without letting the last word overflow the bottom border.

---

## 🛠️ Verification & Development Notes
* **Dev Server Command:** `npm run dev` starts the frontend on port 3000 and the backend on port 5000.
* **Validation:** All updated javascript files have passed linter and syntax checks (`node --check`).
* **Git Status:** Clean and pushing successfully to remote repositories.
