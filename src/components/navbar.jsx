import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { CartContext } from '../context/cartcontext';
import { useConfirm } from '../context/confirmcontext';
import { subscribeOrders } from '../services/database';
import { isReservationOrder } from '../utils/reservationarrival';

const ORDER_STATUS_STORAGE_PREFIX = 'persimmonay-order-status-seen';

const getSeenStatusKey = (userId) => `${ORDER_STATUS_STORAGE_PREFIX}:${userId}`;

const readSeenStatuses = (userId) => {
  try {
    return JSON.parse(window.localStorage.getItem(getSeenStatusKey(userId)) || '{}');
  } catch (error) {
    return {};
  }
};

const saveSeenStatuses = (userId, orders) => {
  const statuses = orders.reduce((current, order) => ({
    ...current,
    [order.firebaseId || order.id]: order.status || ''
  }), {});

  window.localStorage.setItem(getSeenStatusKey(userId), JSON.stringify(statuses));
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isCustomer, logout } = useAuth();
  const { cart } = useContext(CartContext);
  const { confirm } = useConfirm();
  const [customerOrders, setCustomerOrders] = useState([]);
  const [orderStatusNoticeCount, setOrderStatusNoticeCount] = useState(0);
  const cartItemCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

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

  useEffect(() => {
    if (!currentUser || !isCustomer) {
      setCustomerOrders([]);
      setOrderStatusNoticeCount(0);
      return undefined;
    }

    const unsubscribe = subscribeOrders((orders) => {
      const activeDeliveryOrders = orders.filter((order) =>
        order.customerId === currentUser.uid &&
        !isReservationOrder(order) &&
        !['Completed', 'Cancelled'].includes(order.status)
      );
      const seenStatuses = readSeenStatuses(currentUser.uid);
      const hasStoredStatuses = Object.keys(seenStatuses).length > 0;

      setCustomerOrders(activeDeliveryOrders);

      if (!hasStoredStatuses) {
        saveSeenStatuses(currentUser.uid, activeDeliveryOrders);
        setOrderStatusNoticeCount(0);
        return;
      }

      const mergedSeenStatuses = { ...seenStatuses };
      let addedNewOrderStatus = false;
      const changedCount = activeDeliveryOrders.filter((order) => {
        const orderId = order.firebaseId || order.id;

        if (!seenStatuses[orderId]) {
          mergedSeenStatuses[orderId] = order.status || '';
          addedNewOrderStatus = true;
          return false;
        }

        return seenStatuses[orderId] !== order.status;
      }).length;

      if (addedNewOrderStatus) {
        window.localStorage.setItem(
          getSeenStatusKey(currentUser.uid),
          JSON.stringify(mergedSeenStatuses)
        );
      }

      setOrderStatusNoticeCount(changedCount);
    });

    return unsubscribe;
  }, [currentUser, isCustomer]);

  useEffect(() => {
    if (!currentUser || !isCustomer || location.pathname !== '/order-history') {
      return;
    }

    saveSeenStatuses(currentUser.uid, customerOrders);
    setOrderStatusNoticeCount(0);
  }, [currentUser, customerOrders, isCustomer, location.pathname]);

  const renderNavNotice = (item) => {
    if (isCustomer && item.path === '/cart' && cartItemCount > 0) {
      return (
        <span className="nav-cart-count" aria-label={`${cartItemCount} cart items`}>
          {cartItemCount}
        </span>
      );
    }

    if (isCustomer && item.path === '/order-history' && orderStatusNoticeCount > 0) {
      return (
        <span className="nav-cart-count nav-order-count" aria-label={`${orderStatusNoticeCount} order updates`}>
          {orderStatusNoticeCount}
        </span>
      );
    }

    return null;
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
                    <span>{item.label}</span>
                    {renderNavNotice(item)}
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
              {renderNavNotice(item)}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navbar;
