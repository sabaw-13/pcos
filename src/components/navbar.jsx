import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">PC</span>
          <span className="logo-text">Persimonay</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/menu" className={`nav-link ${isActive('/menu') ? 'active' : ''}`}>
            Menu
          </Link>
          <Link to="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`}>
            Cart
          </Link>
          <Link to="/order-history" className={`nav-link ${isActive('/order-history') ? 'active' : ''}`}>
            Orders
          </Link>
        </div>

        <Link to="/login" className="navbar-cart navbar-login" aria-label="Go to login">
          <span className="cart-icon">Log In</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
