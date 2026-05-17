import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import { subscribeOrders, updateOrderStatus } from '../services/database';

const cafeLocation = {
  name: 'Persimmonay Cafe',
  latitude: 11.04222563458401,
  longitude: 122.06720001912616
};

const trackingSteps = [
  {
    label: 'Order sent',
    description: 'Your delivery request was sent to Persimmonay Cafe.'
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
    label: 'Order received',
    description: 'You confirmed that the order arrived.'
  },
  {
    label: 'Completed',
    description: 'The cafe marked the order completed.'
  }
];

const statusStepMap = {
  Waiting: 0,
  Pending: 0,
  Received: 1,
  Preparing: 2,
  Delivering: 3,
  'Customer Received': 4,
  Completed: 5
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
    case 'Customer Received':
      return 'You marked this order received. The cafe will complete it soon.';
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
  if (
    order.status === 'Customer Received' ||
    order.status === 'Completed' ||
    order.status === 'Cancelled'
  ) {
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

const getDistanceInKm = (from, to) => {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDistance = toRadians(to.latitude - from.latitude);
  const longitudeDistance = toRadians(to.longitude - from.longitude);
  const startLatitude = toRadians(from.latitude);
  const endLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getTravelEstimate = (distanceKm) => {
  const averageDeliverySpeedKph = 24;
  const travelMinutes = Math.max(5, Math.round((distanceKm / averageDeliverySpeedKph) * 60));
  const lowEstimate = Math.max(5, travelMinutes - 3);
  const highEstimate = travelMinutes + 5;

  return `${lowEstimate}-${highEstimate} minutes`;
};

const OrderHistory = () => {
  const { currentUser, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [trackedOrderIds, setTrackedOrderIds] = useState({});
  const [receivingOrderId, setReceivingOrderId] = useState('');
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locatingCustomer, setLocatingCustomer] = useState(false);

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
      case 'Customer Received':
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

  const handleMarkOrderReceived = async (order) => {
    const confirmed = await confirm({
      title: 'Order received?',
      description: `${order.orderNumber || 'This order'} will be marked received and the cafe can complete it.`,
      confirmText: 'Order Received',
      cancelText: 'Not Yet',
      tone: 'default'
    });

    if (!confirmed) {
      return;
    }

    try {
      setReceivingOrderId(order.firebaseId);
      setOrdersError('');
      await updateOrderStatus(order.firebaseId, 'Customer Received');
    } catch (error) {
      setOrdersError('Unable to mark this order received right now.');
    } finally {
      setReceivingOrderId('');
    }
  };

  const handleUseCustomerLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser.');
      return;
    }

    setLocatingCustomer(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocatingCustomer(false);
      },
      () => {
        setLocationError('Unable to get your location. Please allow location access and try again.');
        setLocatingCustomer(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const renderTrackingPanel = (order) => {
    const currentStepIndex = getTrackingIndex(order.status);
    const isCancelled = order.status === 'Cancelled';
    const distanceKm = customerLocation
      ? getDistanceInKm(cafeLocation, customerLocation)
      : null;

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

        <div className="tracking-location-card">
          <div>
            <span>Cafe location</span>
            <strong>
              {cafeLocation.name} ({cafeLocation.latitude.toFixed(6)}, {cafeLocation.longitude.toFixed(6)})
            </strong>
          </div>
          <div>
            <span>Your distance</span>
            <strong>
              {distanceKm ? `${distanceKm.toFixed(1)} km from the cafe` : 'Use your location to calculate'}
            </strong>
          </div>
          <div>
            <span>Estimated travel time</span>
            <strong>{distanceKm ? getTravelEstimate(distanceKm) : 'Waiting for your location'}</strong>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleUseCustomerLocation}
            disabled={locatingCustomer}
          >
            {locatingCustomer ? 'Locating...' : 'Use My Location'}
          </button>
        </div>
        {locationError && <p className="checkout-error">{locationError}</p>}
        {order.status === 'Delivering' && (
          <div className="tracking-received-action">
            <p>Tap this only after your delivery arrives.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleMarkOrderReceived(order)}
              disabled={receivingOrderId === order.firebaseId}
            >
              {receivingOrderId === order.firebaseId ? 'Updating...' : 'Order Received'}
            </button>
          </div>
        )}
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
