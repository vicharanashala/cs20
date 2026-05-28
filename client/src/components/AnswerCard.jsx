import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn, timeAgo } from '../utils/helpers';
import UpvoteButton from './UpvoteButton';
import { useAuth } from '../context/AuthContext';

export default function AnswerCard({ answer, onUpvote, showModeratorControls = false, onApprove, onReject }) {
  const { user } = useAuth();
  // FIX #15: was hardcoded 'currentUser' string — now checks actual user ID
  const hasUpvoted = answer.upvotedBy?.some(id =>
    (id?._id || id)?.toString() === user?._id?.toString()
  );

  return (
    <div className={cn(
      'border rounded-lg p-3 space-y-2',
      answer.isApproved ? 'border-green-200 bg-green-50/30' : 'border-border bg-white'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {answer.isApproved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle className="w-3 h-3" /> Approved
              </span>
            )}
            <span className="text-xs text-muted">{timeAgo(answer.createdAt)}</span>
          </div>
          <p className="text-sm text-primary leading-relaxed">{answer.answer}</p>
          {answer.userId?.name && (
            <p className="text-xs text-muted">
              Answered by <span className="font-medium text-primary">{answer.userId.name}</span>
              {answer.userId?.role === 'moderator' && (
                <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Moderator</span>
              )}
              {answer.userId?.role === 'senior' && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Senior</span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <UpvoteButton
            upvotes={answer.upvotes}
            onUpvote={onUpvote}
            hasUpvoted={hasUpvoted}
          />
          {showModeratorControls && !answer.isApproved && (
            <div className="flex gap-1">
              <button
                onClick={() => onApprove?.(answer._id)}
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onReject?.(answer._id)}
                className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
