export const ROLES = {
  STUDENT: 'student',
  MODERATOR: 'moderator',
  SENIOR: 'senior',
  ADMIN: 'admin'
};

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  BLOCKED: 'blocked'
};

export const QUESTION_STATUS = {
  UNRESOLVED: 'unresolved',
  PARTIAL: 'partial',
  RESOLVED: 'resolved'
};

export const RTQ_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved'
};

export const QP_RULES = {
  ANSWER_QUESTION: 2,
  ANSWER_APPROVED: 5,
  ANSWER_SELECTED_FOR_FAQ: 10,
  QUESTION_ACCEPTED: 5,
  QUESTION_ADDED_TO_FAQ: 20,
  MODERATOR_APPROVE_ANSWER: 5,
  MODERATOR_MARK_ACCEPTED: 5,
  SENIOR_ANSWER: 5,
  SENIOR_APPROVE_ANSWER: 5,
  SENIOR_CONVERT_RTQ_TO_FAQ: 10,
  SENIOR_CREATE_NEW_FAQ: 15,
  PENALTY_F1: -5,
  PENALTY_F2_R1: -5,
  PENALTY_ANSWER_REMOVED: -3,
  PENALTY_QUESTION_REMOVED: -5,
  QUESTION_UPVOTE_BONUS: 1,
  ANSWER_UPVOTE_BONUS: 1,
  UPVOTE_THRESHOLD: 10
};

export const QP_THRESHOLDS = {
  MIN_TO_ASK_QUESTION: 50,
  AUTO_PROMOTE_MODERATOR: 500
};

export const RAG_THRESHOLDS = {
  FAQ_F1: 0.80,
  FAQ_F2_MIN: 0.50,
  RTQ_R1: 0.60,
  RTQ_R2_MIN: 0.20
};

export const FAQ_CATEGORIES = [
  'About the internship',
  'Timing and dates',
  'NOC (No Objection Certificate)',
  'Selection, offer letter, and certificate',
  'Work, mentorship, and projects',
  'Code of conduct - communication channels',
  'Interviews Related',
  'Certificate',
  'Rosetta - your internship journal',
  'General'
];