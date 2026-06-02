import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Create Account</h1>
          <p className="text-muted mt-2">
            {step === 1 && !restricted ? 'Join the PippaQ community' : step === 1 && restricted && !accessRequested ? 'Request Access' : step === 1 && accessRequested ? 'Request Submitted' : 'Enter the verification code'}
          </p>
        </div>
        <div className="card p-8">
          {step === 1 && !restricted && (
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Username</label>
                <input name="username" value={form.username} onChange={handleChange} className="input" placeholder="unique_handle" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="input" placeholder="Min 6 characters" required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}

          {step === 1 && restricted && !accessRequested && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm font-medium text-center">
                Access Restricted — Your email is not on the accepted list
              </div>
              <p className="text-sm text-muted text-center">
                Complete the form below to submit a request to the admin for approval.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Username</label>
                <input name="username" value={form.username} onChange={handleChange} className="input" placeholder="unique_handle" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="input" placeholder="Min 6 characters" required minLength={6} />
              </div>
              <button onClick={handleRequestAccess} disabled={loading} className="btn-primary w-full">
                {loading ? 'Submitting...' : 'Request Approval'}
              </button>
              <button onClick={() => setRestricted(false)} className="btn-secondary w-full">
                ← Go Back
              </button>
            </div>
          )}

          {step === 1 && restricted && accessRequested && (
            <div className="space-y-5 text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Request Submitted Successfully
              </div>
              <p className="text-sm text-muted">
                An admin will review your request. You will be notified once approved.
              </p>
              <Link to="/login" className="btn-primary w-full inline-block text-center">
                Go to Sign In
              </Link>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <p className="text-sm text-muted text-center">Check your email for the OTP code.</p>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input text-center text-xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify account'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full">
                ← Back
              </button>
            </form>
          )}

          {step === 1 && !restricted && (
            <p className="text-center text-sm text-muted mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}