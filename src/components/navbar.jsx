import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { CartContext } from '../context/cartcontext';
import { useConfirm } from '../context/confirmcontext';
import { subscribeOrders } from '../services/database';
import { isReservationOrder } from '../utils/reservationarrival';

const ORDER_STATUS_STORAGE_PREFIX = 'persimmonay-order-status-seen';
const ADMIN_NOTICE_STORAGE_PREFIX = 'persimmonay-admin-notice-seen';

const getSeenStatusKey = (userId) => `${ORDER_STATUS_STORAGE_PREFIX}:${userId}`;
const getAdminNoticeKey = (userId, noticeType) =>
  `${ADMIN_NOTICE_STORAGE_PREFIX}:${userId}:${noticeType}`;

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

const readAdminNoticeIds = (userId, noticeType) => {
  try {
    return JSON.parse(window.localStorage.getItem(getAdminNoticeKey(userId, noticeType)) || '[]');
  } catch (error) {
    return [];
  }
};

const hasAdminNoticeSnapshot = (userId, noticeType) =>
  window.localStorage.getItem(getAdminNoticeKey(userId, noticeType)) !== null;

const saveAdminNoticeIds = (userId, noticeType, orders) => {
  const seenIds = orders.map((order) => order.firebaseId || order.id);
  window.localStorage.setItem(getAdminNoticeKey(userId, noticeType), JSON.stringify(seenIds));
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isCustomer, logout } = useAuth();
  const { cart } = useContext(CartContext);
  const { confirm } = useConfirm();
  const [customerOrders, setCustomerOrders] = useState([]);
  const [orderStatusNoticeCount, setOrderStatusNoticeCount] = useState(0);
  const [adminOrderNoticeCount, setAdminOrderNoticeCount] = useState(0);
  const [adminReservationNoticeCount, setAdminReservationNoticeCount] = useState(0);
  const cartItemCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

  const navItems = isCustomer
    ? [
        { path: '/menu', label: 'Order', mobileLabel: 'Order' },
        { path: '/reservation', label: 'Reservation', mobileLabel: 'Reserve' },
        { path: '/cart', label: 'Cart', mobileLabel: 'Cart' },
        { path: '/order-history', label: 'Orders', mobileLabel: 'Orders' },
        { path: '/history', label: 'History', mobileLabel: 'History' }
      ]
      : isAdmin
        ? [
            { path: '/admin?tab=dashboard', label: 'Dashboard', mobileLabel: 'Dash' },
            { path: '/admin?tab=delivery-orders', label: 'Orders', mobileLabel: 'Orders' },
            { path: '/admin?tab=walk-in', label: 'Walk In', mobileLabel: 'Walk In' },
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
    const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';

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
      const activeCustomerOrders = orders.filter((order) =>
        order.customerId === currentUser.uid &&
        order.service !== 'Walk In' &&
        !isReservationOrder(order) &&
        !['Completed', 'Cancelled'].includes(order.status)
      );
      const seenStatuses = readSeenStatuses(currentUser.uid);
      const hasStoredStatuses = Object.keys(seenStatuses).length > 0;

      setCustomerOrders(activeCustomerOrders);

      if (!hasStoredStatuses) {
        saveSeenStatuses(currentUser.uid, activeCustomerOrders);
        setOrderStatusNoticeCount(0);
        return;
      }

      const mergedSeenStatuses = { ...seenStatuses };
      let addedNewOrderStatus = false;
      const changedCount = activeCustomerOrders.filter((order) => {
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

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      setAdminOrderNoticeCount(0);
      setAdminReservationNoticeCount(0);
      return undefined;
    }

    const currentAdminTab = new URLSearchParams(location.search).get('tab') || 'dashboard';

    const unsubscribe = subscribeOrders((orders) => {
      const deliveryQueue = orders.filter(
        (order) => !isReservationOrder(order) && ['Waiting', 'Pending'].includes(order.status)
      );
      const reservationQueue = orders.filter(
        (order) => isReservationOrder(order) && order.status === 'Pending'
      );
      const deliveryNoticeType = 'delivery-orders';
      const reservationNoticeType = 'reservations';

      if (!hasAdminNoticeSnapshot(currentUser.uid, deliveryNoticeType)) {
        saveAdminNoticeIds(currentUser.uid, deliveryNoticeType, deliveryQueue);
        setAdminOrderNoticeCount(0);
      } else if (location.pathname === '/admin' && currentAdminTab === deliveryNoticeType) {
        saveAdminNoticeIds(currentUser.uid, deliveryNoticeType, deliveryQueue);
        setAdminOrderNoticeCount(0);
      } else {
        const seenDeliveryIds = new Set(readAdminNoticeIds(currentUser.uid, deliveryNoticeType));
        const unseenDeliveryCount = deliveryQueue.filter(
          (order) => !seenDeliveryIds.has(order.firebaseId || order.id)
        ).length;
        setAdminOrderNoticeCount(unseenDeliveryCount);
      }

      if (!hasAdminNoticeSnapshot(currentUser.uid, reservationNoticeType)) {
        saveAdminNoticeIds(currentUser.uid, reservationNoticeType, reservationQueue);
        setAdminReservationNoticeCount(0);
      } else if (location.pathname === '/admin' && currentAdminTab === reservationNoticeType) {
        saveAdminNoticeIds(currentUser.uid, reservationNoticeType, reservationQueue);
        setAdminReservationNoticeCount(0);
      } else {
        const seenReservationIds = new Set(readAdminNoticeIds(currentUser.uid, reservationNoticeType));
        const unseenReservationCount = reservationQueue.filter(
          (order) => !seenReservationIds.has(order.firebaseId || order.id)
        ).length;
        setAdminReservationNoticeCount(unseenReservationCount);
      }
    });

    return unsubscribe;
  }, [currentUser, isAdmin, location.pathname, location.search]);

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

    if (isAdmin && item.path === '/admin?tab=delivery-orders' && adminOrderNoticeCount > 0) {
      return (
        <span className="nav-cart-count nav-admin-count" aria-label={`${adminOrderNoticeCount} new orders`}>
          {adminOrderNoticeCount}
        </span>
      );
    }

    if (isAdmin && item.path === '/admin?tab=reservations' && adminReservationNoticeCount > 0) {
      return (
        <span className="nav-cart-count nav-admin-count" aria-label={`${adminReservationNoticeCount} new reservations`}>
          {adminReservationNoticeCount}
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
