import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-card-elevated max-w-sm w-full p-8 animate-scaleIn border border-border/60"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary">Sign in required</h2>
          <p className="text-sm text-muted mt-1">You need to be logged in to perform this action.</p>
        </div>
        <div className="space-y-3">
          <Link to="/login" className="btn-gradient w-full block text-center" onClick={onClose}>
            Sign in
          </Link>
          <Link to="/signup" className="btn-outline w-full block text-center" onClick={onClose}>
            Create account
          </Link>
          <button onClick={onClose} className="btn-ghost w-full text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}