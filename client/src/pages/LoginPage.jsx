import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Left decorative panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Floating blobs */}
        <div className="blob-accent w-72 h-72 -top-20 -left-20" />
        <div className="blob-accent w-96 h-96 -bottom-32 -right-20 opacity-10" />
        <div className="blob-accent w-48 h-48 top-1/3 right-1/4 opacity-15" />

        <div className="relative z-10 max-w-md text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-8 animate-float">
            <img src="/PippaQ1.webp" alt="PippaQ Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
          </div>
          <h2 className="font-brand text-4xl font-bold text-primary mb-4 tracking-tight">
            Welcome to <span className="text-gradient">PippaQ</span>
          </h2>
          <p className="text-muted text-lg leading-relaxed">
            A premium knowledge platform where questions find clarity through community intelligence and semantic search.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-accent" />
              </div>
              <span>Knowledge Base</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <span className="text-violet-600 font-bold text-xs">QP</span>
              </div>
              <span>Reputation Economy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="text-center mb-8 lg:mb-10">
            <div className="lg:hidden w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img src="/PippaQ1.webp" alt="PippaQ Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(217,119,6,0.2)]" />
            </div>
            <h1 className="font-brand text-3xl font-bold tracking-tight">
              <span className="text-gradient">PippaQ</span>
            </h1>
            <p className="text-muted mt-2">Sign in to your account</p>
          </div>

          <div className="card p-8 shadow-card-elevated border-border/40">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-icon"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-icon"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-gradient w-full flex items-center justify-center gap-2">
                {loading ? 'Signing in...' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-muted">
                Don't have an account?{' '}
                <Link to="/signup" className="text-accent font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
              <Link to="/faq" className="inline-flex items-center gap-1.5 text-sm text-muted font-medium hover:text-accent transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
                Browse FAQs without signing in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}