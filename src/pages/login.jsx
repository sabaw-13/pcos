import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      description: 'You will be signed out and returned to the cafe landing page.',
      confirmText: 'Log Out',
      cancelText: 'Stay Signed In',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    navigate('/', { replace: true });
    await logout();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="service-eyebrow">Persimonay account</span>
        <h1>{authMode === 'signup' ? 'Create Account' : 'Log In'}</h1>
        <p>
          {authMode === 'signup'
            ? 'Create a customer account to start ordering and reserving online.'
            : 'Log in to place delivery orders or reserve a table online.'}
        </p>

        {currentUser && (
          <div className="auth-session-panel">
            <strong>{isAdmin ? 'Admin / Staff signed in' : 'Customer signed in'}</strong>
            <span>{currentUser.email}</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="auth-mode-tabs" aria-label="Auth mode">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={authMode === 'signup' ? 'active' : ''}
              onClick={() => setAuthMode('signup')}
            >
              Create Account
            </button>
          </div>

          {authMode === 'signup' && (
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            minLength="6"
            required
          />
          {authError && <p className="checkout-error">{authError}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={authBusy}>
            {authBusy
              ? 'Checking Account...'
              : authMode === 'signup'
                ? 'Create Account'
                : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
