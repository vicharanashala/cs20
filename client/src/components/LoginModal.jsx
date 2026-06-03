import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-primary">Sign in required</h3>
              <p className="text-xs text-muted">to perform this action</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-muted mb-5">
            Please sign up or log in to continue. You'll need an account to upvote and participate.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { onClose(); navigate('/login'); }}
              className="w-full btn-primary py-2.5"
            >
              Go to Login
            </button>
            <button
              onClick={() => { onClose(); navigate('/signup'); }}
              className="w-full btn-secondary py-2.5"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}