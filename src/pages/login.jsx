import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import { ADMIN_EMAIL, createCustomerAccount, loginAdmin, loginCustomer } from '../services/auth';

const EyeIcon = ({ hidden = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    {hidden && (
      <path
        d="M4 4l16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin, logout } = useAuth();
  const { confirm } = useConfirm();
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = authMode === 'signup';

  const authContent = useMemo(() => {
    if (isSignup) {
      return {
        eyebrow: 'New customer',
        title: 'Create your cafe account',
        description: 'Save your details once, then order delivery and reserve a table faster next time.',
        submit: 'Create Account',
        busy: 'Creating Account...'
      };
    }

    return {
      eyebrow: 'Welcome back',
      title: 'Log in to Persimmonay',
      description: 'Continue to your delivery orders, reservations, and latest cafe updates.',
      submit: 'Log In',
      busy: 'Checking Account...'
    };
  }, [isSignup]);

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setAuthError('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setAuthBusy(true);
      setAuthError('');

      if (formData.email.trim().toLowerCase() === ADMIN_EMAIL) {
        await loginAdmin({
          email: formData.email,
          password: formData.password
        });
        navigate('/admin');
        return;
      }

      if (authMode === 'signup') {
        await createCustomerAccount({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      } else {
        await loginCustomer({
          email: formData.email,
          password: formData.password
        });
      }

      navigate('/menu');
    } catch (error) {
      setAuthError(error.message || 'Unable to complete login.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Log out of your account?',
      description: 'You will be signed out and returned to the login page.',
      confirmText: 'Log Out',
      cancelText: 'Stay Signed In',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    navigate('/login', { replace: true });
    await logout();
  };

  return (
    <div className={`login-page dynamic-login-page login-mode-${authMode}`}>
      <div className="login-shell">
        <section className="login-card auth-login-card" aria-label="Account form">
          <span className="service-eyebrow">{authContent.eyebrow}</span>
          <h1>{authContent.title}</h1>
          <p>{authContent.description}</p>

          {currentUser && (
            <div className="auth-session-panel">
              <div>
                <strong>{isAdmin ? 'Admin / Staff signed in' : 'Customer signed in'}</strong>
                <span>{currentUser.email}</span>
              </div>
              <div className="auth-session-actions">
                <Link to={isAdmin ? '/admin' : '/menu'} className="btn btn-primary btn-small">
                  Continue
                </Link>
                <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="auth-mode-tabs" aria-label="Auth mode">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => handleAuthModeChange('login')}
              >
                Log In
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => handleAuthModeChange('signup')}
              >
                Create Account
              </button>
            </div>

            {isSignup && (
              <label className="login-field">
                <span>Full name</span>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Juan Dela Cruz"
                  value={formData.name}
                  onChange={handleInputChange}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="login-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                required
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </label>

            {authError && <p className="checkout-error">{authError}</p>}

            <button type="submit" className="btn btn-primary btn-full login-submit" disabled={authBusy}>
              {authBusy ? authContent.busy : authContent.submit}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
