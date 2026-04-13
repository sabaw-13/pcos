import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { subscribeOrders } from '../services/database';

const OrderHistory = () => {
  const { currentUser, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');

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
        return 'status-pending';
      case 'Pending':
        return 'status-pending';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>Order History</h1>
        <p>View Firebase delivery and reservation requests</p>
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
                  <button className="btn btn-secondary btn-small">
                    Reorder
                  </button>
                  <button className="btn btn-secondary btn-small">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderHistory;
