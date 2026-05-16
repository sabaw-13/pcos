import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { subscribeOrders } from '../services/database';

const trackingSteps = [
  {
    label: 'Order sent',
    description: 'Your delivery request was sent to Persimonay Cafe.'
  },
  {
    label: 'Cafe received',
    description: 'Staff confirmed the order in the admin panel.'
  },
  {
    label: 'Preparing',
    description: 'Your food and drinks are being prepared.'
  },
  {
    label: 'Food is being delivered',
    description: 'Your order is on the way to your delivery address.'
  },
  {
    label: 'Completed',
    description: 'The customer has received the order.'
  }
];

const statusStepMap = {
  Waiting: 0,
  Pending: 0,
  Received: 1,
  Preparing: 2,
  Delivering: 3,
  Completed: 4
};

const getTrackingIndex = (status) => statusStepMap[status] ?? 0;

const getTrackingMessage = (order) => {
  switch (order.status) {
    case 'Received':
      return 'Your order has been received by the cafe.';
    case 'Preparing':
      return 'The cafe is preparing your order now.';
    case 'Delivering':
      return 'Your food is being delivered.';
    case 'Completed':
      return 'You have received your order.';
    case 'Cancelled':
      return 'This order was cancelled.';
    case 'Waiting':
    default:
      return 'Waiting for the cafe to receive your order.';
  }
};

const getDeliveryAddress = (order) => {
  const addressParts = [
    order.deliveryAddress?.street,
    order.deliveryAddress?.city,
    order.deliveryAddress?.zipCode
  ].filter(Boolean);

  return addressParts.length > 0 ? addressParts.join(', ') : 'No delivery address saved';
};

const getEstimatedTime = (order) => {
  if (order.status === 'Completed' || order.status === 'Cancelled') {
    return 'No active estimate';
  }

  if (!order.createdAt) {
    return '15-20 minutes after cafe confirmation';
  }

  const estimate = new Date(Number(order.createdAt) + 20 * 60 * 1000);

  return estimate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const OrderHistory = () => {
  const { currentUser, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [trackedOrderIds, setTrackedOrderIds] = useState({});

  useEffect(() => {
    if (!currentUser || isAdmin) {
      setOrders([]);
      return undefined;
    }

    const unsubscribe = subscribeOrders(
      (firebaseOrders) => {
        setOrders(firebaseOrders.filter((order) => order.customerId === currentUser.uid));
      },
      () => setOrdersError('Unable to load Firebase orders right now.')
    );

    return unsubscribe;
  }, [currentUser, isAdmin]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed':
        return 'status-completed';
      case 'Received':
        return 'status-completed';
      case 'Waiting':
      case 'Preparing':
      case 'Delivering':
        return 'status-pending';
      case 'Pending':
        return 'status-pending';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const toggleTracking = (orderId) => {
    setTrackedOrderIds((current) => ({
      ...current,
      [orderId]: !current[orderId]
    }));
  };

  const renderTrackingPanel = (order) => {
    const currentStepIndex = getTrackingIndex(order.status);
    const isCancelled = order.status === 'Cancelled';

    return (
      <div className="order-tracking-panel" id={`tracking-${order.id}`}>
        <div className="tracking-summary">
          <div>
            <span className="tracking-label">Live tracking</span>
            <strong>{getTrackingMessage(order)}</strong>
          </div>
          <span className="tracking-refresh">Updates automatically</span>
        </div>

        <ol className={`tracking-steps ${isCancelled ? 'tracking-cancelled' : ''}`}>
          {trackingSteps.map((step, index) => {
            const stepState =
              !isCancelled && index < currentStepIndex
                ? 'complete'
                : !isCancelled && index === currentStepIndex
                  ? 'active'
                  : 'pending';

            return (
              <li key={step.label} className={`tracking-step tracking-step-${stepState}`}>
                <span className="tracking-step-marker">{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="tracking-details-grid">
          <div>
            <span>Estimated time</span>
            <strong>{getEstimatedTime(order)}</strong>
          </div>
          <div>
            <span>Service</span>
            <strong>{order.service || 'Online Delivery'}</strong>
          </div>
          <div>
            <span>Delivery address</span>
            <strong>{getDeliveryAddress(order)}</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>Track Your Orders</h1>
        <p>View live delivery updates from the cafe staff dashboard.</p>
      </div>

      <div className="order-history-content">
        {(!currentUser || isAdmin) && (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h2>Customer Login Required</h2>
            <p>Log in with a customer account to view your order history.</p>
            <Link to="/login" className="btn btn-primary">
              Open Customer Login
            </Link>
          </div>
        )}
        {ordersError && <p className="checkout-error">{ordersError}</p>}
        {currentUser && !isAdmin && orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h2>No Orders Yet</h2>
            <p>Start ordering from our menu to see your order history here.</p>
            <Link to="/menu" className="btn btn-primary">
              Browse Menu
            </Link>
          </div>
        ) : currentUser && !isAdmin ? (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-info">
                    <h3 className="order-number">{order.orderNumber}</h3>
                    <p className="order-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : 'New Firebase request'}
                    </p>
                  </div>
                  <div className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    <h4>Items:</h4>
                    <ul className="items-list">
                      {(order.items || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-amount">P{Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <button type="button" className="btn btn-secondary btn-small">
                    Reorder
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    aria-expanded={Boolean(trackedOrderIds[order.id])}
                    aria-controls={`tracking-${order.id}`}
                    onClick={() => toggleTracking(order.id)}
                  >
                    {trackedOrderIds[order.id] ? 'Hide Tracking' : 'Track Order'}
                  </button>
                </div>
                {trackedOrderIds[order.id] && renderTrackingPanel(order)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderHistory;
