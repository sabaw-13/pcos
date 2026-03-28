import React from 'react';

const Login = () => {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p>Sign in to continue your Persimonay experience.</p>
        <form className="login-form">
          <input type="text" className="form-input" placeholder="Username or Email" />
          <input type="password" className="form-input" placeholder="Password" />
          <button type="button" className="btn btn-primary btn-full">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
