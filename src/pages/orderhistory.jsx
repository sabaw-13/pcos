import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const [orders] = useState([
    {
      id: 1,
      orderNumber: '#12345',
      date: '2026-03-25',
      items: ['Latte', 'Croissant', 'Muffin'],
      total: 14.97,
      status: 'Completed',
      time: '2:30 PM'
    },
    {
      id: 2,
      orderNumber: '#12344',
      date: '2026-03-24',
      items: ['Cappuccino', 'Almond Croissant'],
      total: 8.48,
      status: 'Completed',
      time: '10:15 AM'
    },
    {
      id: 3,
      orderNumber: '#12343',
      date: '2026-03-23',
      items: ['Espresso', 'Blueberry Muffin', 'Iced Tea'],
      total: 9.97,
      status: 'Completed',
      time: '3:45 PM'
    },
    {
      id: 4,
      orderNumber: '#12342',
      date: '2026-03-22',
      items: ['Mocha', 'Plain Croissant'],
      total: 7.48,
      status: 'Completed',
      time: '9:00 AM'
    }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed':
        return 'status-completed';
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
        <p>View all your past orders</p>
      </div>

      <div className="order-history-content">
        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h2>No Orders Yet</h2>
            <p>Start ordering from our menu to see your order history here.</p>
            <Link to="/menu" className="btn btn-primary">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-info">
                    <h3 className="order-number">{order.orderNumber}</h3>
                    <p className="order-date">{new Date(order.date).toLocaleDateString()} at {order.time}</p>
                  </div>
                  <div className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    <h4>Items:</h4>
                    <ul className="items-list">
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-amount">P{order.total.toFixed(2)}</span>
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
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
