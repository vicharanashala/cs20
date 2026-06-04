import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, AtSign, Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2, BookOpen } from 'lucide-react';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [restricted, setRestricted] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const { signup, verifyOtp, requestAccess } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSignup = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signup(form);
      setUserId(res.userId);
      setStep(2);
    } catch (err) {
      if (err.restricted || err.response?.data?.restricted) {
        setRestricted(true);
        setError(err.message || err.response?.data?.message || 'Access Restricted. This email is not on the accepted list.');
      } else {
        setError(err.message || err.response?.data?.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestAccess(form);
      setAccessRequested(true);
    } catch (err) {
      setError(err.message || err.error || err.response?.data?.message || err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(userId, otp);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-accent' : 'text-muted'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          step === 1 ? 'bg-gradient-to-br from-accent to-violet-600 text-white' : step === 2 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-muted'
        }`}>
          {step === 2 ? '✓' : '1'}
        </div>
        <span className="hidden sm:inline">Details</span>
      </div>
      <div className={`w-12 h-0.5 rounded-full ${step === 2 ? 'bg-gradient-to-r from-accent to-violet-500' : 'bg-slate-200'}`} />
      <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? 'text-accent' : 'text-muted'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          step === 2 ? 'bg-gradient-to-br from-accent to-violet-600 text-white' : 'bg-slate-100 text-muted'
        }`}>
          2
        </div>
        <span className="hidden sm:inline">Verify</span>
      </div>
    </div>
  );

  const FormField = ({ icon: Icon, label, ...inputProps }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
        <input {...inputProps} className="input-icon" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Left decorative panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="blob-accent w-72 h-72 -top-20 -left-20" />
        <div className="blob-accent w-96 h-96 -bottom-32 -right-20 opacity-10" />
        <div className="blob-accent w-48 h-48 top-1/3 right-1/4 opacity-15" />

        <div className="relative z-10 max-w-md text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-8 animate-float">
            <img src="/PippaQ1.webp" alt="PippaQ Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
          </div>
          <h2 className="font-brand text-4xl font-bold text-primary mb-4 tracking-tight">
            Join <span className="text-gradient">PippaQ</span>
          </h2>
          <p className="text-muted text-lg leading-relaxed">
            Become part of a community that transforms questions into a living knowledge base through peer collaboration.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="text-center mb-6 lg:hidden">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img src="/PippaQ1.webp" alt="PippaQ Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(217,119,6,0.2)]" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">
              {step === 1 && !restricted ? 'Create Account' : step === 1 && restricted && !accessRequested ? 'Request Access' : step === 1 && accessRequested ? 'Request Submitted' : 'Verify Email'}
            </h1>
            <p className="text-muted mt-1 text-sm">
              {step === 1 && !restricted ? 'Join the PippaQ community' : step === 1 && restricted && !accessRequested ? 'Your email requires approval' : step === 1 && accessRequested ? 'Your request is being reviewed' : 'Enter the verification code'}
            </p>
          </div>

          {!restricted && <StepIndicator />}

          <div className="card p-8 shadow-card-elevated border-border/40">
            {step === 1 && !restricted && (
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{error}</span>
                  </div>
                )}
                <FormField icon={User} label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                <FormField icon={AtSign} label="Username" name="username" value={form.username} onChange={handleChange} placeholder="unique_handle" required />
                <FormField icon={Mail} label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                <FormField icon={Lock} label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
                <button type="submit" disabled={loading} className="btn-gradient w-full flex items-center justify-center gap-2">
                  {loading ? 'Creating account...' : <>Create account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {step === 1 && restricted && !accessRequested && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Access Restricted</p>
                    <p className="text-xs text-amber-600 mt-0.5">Your email is not on the accepted list</p>
                  </div>
                </div>
                <p className="text-sm text-muted text-center">
                  Complete the form below to request admin approval.
                </p>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                <FormField icon={User} label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                <FormField icon={AtSign} label="Username" name="username" value={form.username} onChange={handleChange} placeholder="unique_handle" required />
                <FormField icon={Mail} label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                <FormField icon={Lock} label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
                <button onClick={handleRequestAccess} disabled={loading} className="btn-gradient w-full">
                  {loading ? 'Submitting...' : 'Request Approval'}
                </button>
                <button onClick={() => setRestricted(false)} className="btn-outline w-full text-sm">
                  ← Go Back
                </button>
              </div>
            )}

            {step === 1 && restricted && accessRequested && (
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Request Submitted!</h3>
                  <p className="text-sm text-muted mt-2">
                    An admin will review your request. You will be notified once approved.
                  </p>
                </div>
                <Link to="/login" className="btn-gradient w-full inline-block text-center">
                  Go to Sign In
                </Link>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleVerify} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-7 h-7 text-accent" />
                  </div>
                  <p className="text-sm text-muted">Check your email for the 6-digit OTP code.</p>
                </div>
                <div>
                  <label className="label text-center block">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input text-center text-2xl tracking-[0.5em] font-mono font-bold"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-gradient w-full">
                  {loading ? 'Verifying...' : 'Verify account'}
                </button>
                <button type="button" onClick={() => setStep(1)} className="btn-outline w-full text-sm">
                  ← Back
                </button>
              </form>
            )}

            {step === 1 && !restricted && (
              <div className="mt-6 space-y-3 text-center">
                <p className="text-sm text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
                </p>
                <Link to="/faq" className="inline-flex items-center gap-1.5 text-sm text-muted font-medium hover:text-accent transition-colors">
                  <BookOpen className="w-3.5 h-3.5" />
                  Browse FAQs without signing in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}