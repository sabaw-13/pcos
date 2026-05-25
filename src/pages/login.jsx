import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import { ADMIN_EMAIL, createCustomerAccount, loginAdmin, loginCustomer } from '../services/auth';

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
        busy: 'Creating Account...',
        previewTitle: 'Ready for your first order',
        previewStatus: 'Account setup',
        previewMeta: 'Delivery and reservations stay in one place.',
        highlights: [
          { label: 'Fast checkout', value: 'Saved contact details' },
          { label: 'Reservation tracking', value: 'Share arrival only with consent' },
          { label: 'Order updates', value: 'See status changes in your account' }
        ]
      };
    }

    return {
      eyebrow: 'Welcome back',
      title: 'Log in to Persimmonay',
      description: 'Continue to your delivery orders, reservations, and latest cafe updates.',
      submit: 'Log In',
      busy: 'Checking Account...',
      previewTitle: 'Today at the cafe',
      previewStatus: 'Open for orders',
      previewMeta: 'GCash checkout, reservations, and order tracking are ready.',
      highlights: [
        { label: 'Delivery', value: 'Browse menu and checkout with GCash' },
        { label: 'Reservations', value: 'Track your active booking' },
        { label: 'Admin', value: 'Staff accounts open the dashboard automatically' }
      ]
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
        <section className="login-visual-panel" aria-label="Persimmonay Cafe account overview">
          <div className="login-brand-lockup">
            <span className="login-logo-mark">PC</span>
            <div>
              <span className="service-eyebrow">Persimmonay Cafe</span>
              <h1>{authContent.previewTitle}</h1>
            </div>
          </div>

          <div className="login-preview-card">
            <div className="login-preview-header">
              <span>{authContent.previewStatus}</span>
              <strong>{isSignup ? 'New' : 'Live'}</strong>
            </div>
            <p>{authContent.previewMeta}</p>
            <div className="login-highlight-list">
              {authContent.highlights.map((item) => (
                <div className="login-highlight-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="login-service-strip" aria-label="Available account tools">
            <span>Delivery</span>
            <span>Reservation</span>
            <span>History</span>
          </div>
        </section>

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
                >
                  {showPassword ? 'Hide' : 'Show'}
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
