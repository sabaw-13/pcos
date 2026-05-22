import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isCustomer, logout } = useAuth();
  const { confirm } = useConfirm();

  const navItems = isCustomer
    ? [
        { path: '/menu', label: 'Delivery', mobileLabel: 'Delivery' },
        { path: '/reservation', label: 'Reservation', mobileLabel: 'Reserve' },
        { path: '/cart', label: 'Cart', mobileLabel: 'Cart' },
        { path: '/order-history', label: 'Orders', mobileLabel: 'Orders' },
        { path: '/history', label: 'History', mobileLabel: 'History' }
      ]
      : isAdmin
        ? [
            { path: '/admin?tab=delivery-orders', label: 'Orders', mobileLabel: 'Orders' },
            { path: '/admin?tab=reservations', label: 'Reservations', mobileLabel: 'Reserve' },
            { path: '/admin?tab=add-item', label: 'Add Item', mobileLabel: 'Add Item' }
          ]
        : [];
  const showMobileBottomNav = navItems.length > 0;

  const isActive = (path) => {
    const [pathname, queryString] = path.split('?');

    if (location.pathname !== pathname) {
      return false;
    }

    if (!queryString) {
      return true;
    }

    const itemTab = new URLSearchParams(queryString).get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab') || 'delivery-orders';

    return itemTab === currentTab;
  };

  useEffect(() => {
    document.body.classList.toggle('has-mobile-bottom-nav', showMobileBottomNav);

    return () => {
      document.body.classList.remove('has-mobile-bottom-nav');
    };
  }, [showMobileBottomNav]);

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
    <>
      <nav className={`navbar ${isAdmin ? 'navbar-admin' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-primary">
            <Link to="/" className="navbar-logo">
              <span className="logo-icon">PC</span>
              <span className="logo-text">Persimmonay</span>
            </Link>

            {navItems.length > 0 && (
              <div className={`navbar-menu navbar-menu-desktop ${isAdmin ? 'navbar-menu-admin' : ''}`}>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="navbar-account-actions">
            {currentUser && (
              <span className="navbar-user-chip">
                {isAdmin ? 'Admin' : 'Customer'}
              </span>
            )}
            {currentUser ? (
              <button type="button" className="navbar-cart navbar-login" onClick={handleLogout}>
                <span className="cart-icon">Log Out</span>
              </button>
            ) : (
              <Link to="/login" className="navbar-cart navbar-login" aria-label="Open login page">
                <span className="cart-icon">Log In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showMobileBottomNav && (
        <nav className="mobile-bottom-nav" aria-label="Feature navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="mobile-nav-label">{item.mobileLabel}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navbar;
