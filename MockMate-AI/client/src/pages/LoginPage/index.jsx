import { useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoginPage() {
  const { isAuthenticated, login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isRegisterMode) {
        await register(form);
        toast.success('Account created successfully.');
      } else {
        await login({ email: form.email, password: form.password });
        toast.success('Welcome back.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <article className="auth-brand-panel">
          <h1>MockMate AI</h1>
          <h2>
            {isRegisterMode
              ? 'Master the art of professional interviewing.'
              : 'Master the art of the professional interview.'}
          </h2>
          <p>
            {isRegisterMode
              ? 'Join professionals improving interview clarity, structure, and confidence with AI-led practice.'
              : 'Step into focused mock interviews with resume-aware questions, coding rounds, and strict feedback.'}
          </p>

          {isRegisterMode ? (
            <div className="auth-points">
              <div className="auth-point">
                <strong>AI Mock Analysis</strong>
                <span>Real-time scoring on communication and technical depth.</span>
              </div>
              <div className="auth-point">
                <strong>Interview Readiness</strong>
                <span>Practice sessions built for real hiring scenarios.</span>
              </div>
            </div>
          ) : (
            <blockquote className="auth-quote">
              "MockMate AI improved how I explain decisions under pressure."
            </blockquote>
          )}
        </article>

        <article className="auth-form-panel">
          <h3>{isRegisterMode ? 'Create your account' : 'Welcome back'}</h3>
          <p>
            {isRegisterMode
              ? 'Begin your journey to professional mastery.'
              : 'Continue your interview practice journey.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegisterMode && (
              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
            )}
            <label>
              <span>Email Address</span>
              <input
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="primary-button auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            className="link-button auth-switch-link"
            onClick={() => setIsRegisterMode((prev) => !prev)}
          >
            {isRegisterMode ? (
              <>
                Already have an account? <span className="auth-switch-accent">Log in instead</span>
              </>
            ) : (
              <>
                Don&apos;t have an account? <span className="auth-switch-accent">Create one</span>
              </>
            )}
          </button>
        </article>
      </section>

      <footer className="auth-footer">
        <span>© 2026 MockMate AI. All rights reserved.</span>
        <div>
          <span>Privacy Policy</span>
          <span>Terms</span>
          <span>Support</span>
          <span>Contact</span>
        </div>
      </footer>
    </main>
  );
}

export default LoginPage;
