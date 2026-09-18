import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import CategoryIcon from '../components/categoryicon';
import ReservationRouteMap from '../components/reservationroutemap';
import { baseMenuItems, menuCategories } from '../data/menudata';
import {
  addOrder,
  addMenuItem,
  deleteOrder,
  subscribeMenuItems,
  subscribeOrders,
  updateOrderStatus,
  updateReservationFoodStatus,
  updateReservationArrivalStatus
} from '../services/database';
import {
  getReservationArrivalStatus,
  isReservationOrder
} from '../utils/reservationarrival';
import { getQueueStatus, getReservationFoodStatus } from '../utils/orderqueue';
import { getDashboardRange, getDashboardBuckets, localDateValue } from '../utils/dashboardfilters';

const emptyItemForm = {
  name: '',
  price: '',
  category: 'drinks',
  description: '',
  image: 'Drink'
};

const emptyWalkInForm = {
  customer: '',
  selectedItemId: '',
  quantity: '1'
};

const adminTabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    mobileLabel: 'Dash',
    title: 'Admin Dashboard',
    description: 'Track order volume, current work, and sales performance.'
  },
  {
    id: 'delivery-orders',
    label: 'Orders',
    mobileLabel: 'Orders',
    title: 'Orders',
    description: 'Receive and manage customer delivery orders.'
  },
  {
    id: 'walk-in',
    label: 'Walk In',
    mobileLabel: 'Walk In',
    title: 'Walk-In Counter',
    description: 'Staff can receive walk-in orders and mark them completed from the counter.'
  },
  {
    id: 'reservations',
    label: 'Reservations',
    mobileLabel: 'Reserve',
    title: 'Reservation Orders',
    description: 'Manage table reservations, arrival updates, and shared arrival locations.'
  },
  {
    id: 'add-item',
    label: 'Add Item',
    mobileLabel: 'Add Item',
    title: 'Add Item / Food',
    description: 'New items are saved to the customer delivery menu.'
  }
];

const getValidAdminTab = (tabId) =>
  adminTabs.some((tab) => tab.id === tabId) ? tabId : 'dashboard';

const getAdminTabById = (tabId) =>
  adminTabs.find((tab) => tab.id === tabId) || adminTabs[0];

const orderWorkflowTabs = [
  {
    id: 'receiving',
    label: 'Receiving',
    statuses: ['Waiting', 'Pending'],
    emptyText: 'No orders waiting to be received.'
  },
  {
    id: 'delivery',
    label: 'In Progress',
    statuses: ['Received', 'Preparing', 'Delivering', 'Customer Received'],
    emptyText: 'No customer orders in progress.'
  },
  {
    id: 'completed',
    label: 'Completed History',
    statuses: ['Completed'],
    emptyText: 'No completed orders yet.'
  }
];

const salesStatuses = ['Completed', 'Customer Received'];

const formatCurrency = (value) =>
  `P${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const getOrderDate = (order) => {
  const rawDate = order.createdAt || order.updatedAt;

  if (!rawDate) {
    return null;
  }

  if (typeof rawDate === 'number') {
    const normalizedTimestamp = rawDate < 1000000000000 ? rawDate * 1000 : rawDate;
    const date = new Date(normalizedTimestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSalesOrder = (order) =>
  salesStatuses.includes(getQueueStatus(order)) &&
  Number(order.total || 0) > 0;

const isDateInRange = (date, startDate, endDate) =>
  Boolean(date) && date >= startDate && date < endDate;

const getRangeSales = (orders, startDate, endDate) =>
  orders.reduce((total, order) => {
    const orderDate = getOrderDate(order);

    return isDateInRange(orderDate, startDate, endDate)
      ? total + Number(order.total || 0)
      : total;
  }, 0);

const parseOrderItem = (item) => {
  const match = String(item || '').match(/^(.*?)\s+x\s*(\d+)$/i);

  if (!match) {
    return {
      name: String(item || 'Menu item'),
      quantity: 1
    };
  }

  return {
    name: match[1].trim(),
    quantity: Number(match[2] || 1)
  };
};

const getTopSellingItems = (orders) => {
  const itemTotals = orders.reduce((totals, order) => {
    const items = isReservationOrder(order)
      ? (order.preorderItems || []).map((item) => `${item.name} x ${item.quantity}`)
      : order.items || [];
    items.forEach((item) => {
      const parsedItem = parseOrderItem(item);
      totals[parsedItem.name] = (totals[parsedItem.name] || 0) + parsedItem.quantity;
    });

    return totals;
  }, {});

  return Object.entries(itemTotals)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
};

const isWalkInOrder = (order) => order?.service === 'Walk In';

const defaultDashboardDates = () => {
  const today = new Date();
  return {
    date: localDateValue(new Date(today.getFullYear(), today.getMonth(), 1)),
    endDate: localDateValue(today)
  };
};

const Admin = () => {
  const { authLoading, currentUser, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [customMenuItems, setCustomMenuItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [walkInForm, setWalkInForm] = useState(emptyWalkInForm);
  const [walkInItems, setWalkInItems] = useState([]);
  const [dbError, setDbError] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  const [savingWalkInOrder, setSavingWalkInOrder] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [activeTab, setActiveTab] = useState(() => getValidAdminTab(searchParams.get('tab')));
  const [activeOrderTab, setActiveOrderTab] = useState('receiving');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMapOrder, setSelectedMapOrder] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState(defaultDashboardDates);
  const menuItems = [...baseMenuItems, ...customMenuItems];
  const walkInMenuItems = [...menuItems].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' })
  );
  const firstWalkInMenuItemId = walkInMenuItems[0] ? String(walkInMenuItems[0].id) : '';

  useEffect(() => {
    setActiveTab(getValidAdminTab(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (!walkInForm.selectedItemId && firstWalkInMenuItemId) {
      setWalkInForm((current) => ({
        ...current,
        selectedItemId: firstWalkInMenuItemId
      }));
    }
  }, [firstWalkInMenuItemId, walkInForm.selectedItemId]);

  const queueOrders = orders.filter((order) => !isReservationOrder(order) || getReservationFoodStatus(order));
  const reservationOrders = orders.filter((order) => isReservationOrder(order));

  const matchesOrderWorkflowTab = (order, tab, orderType) => {
    if (orderType === 'reservation') {
      return isReservationOrder(order);
    }

    return tab.statuses.includes(getQueueStatus(order));
  };

  const getOrderWorkflowCount = (tab, orderType) =>
    orders.filter((order) => matchesOrderWorkflowTab(order, tab, orderType)).length;

  const getStatusClass = (status) =>
    `status-${String(status).toLowerCase().replace(/\s+/g, '-')}`;

  const getReservationAdminStatus = (order) => {
    if (order.status === 'Arrived') {
      return 'Arrived';
    }

    if (order.status === 'Pending') {
      return 'Pending';
    }

    if (order.status === 'Cancelled') {
      return 'Cancelled';
    }

    return 'Waiting';
  };

  const getAdminStatusLabel = (order) =>
    isReservationOrder(order) ? getReservationAdminStatus(order) : order.status;

  useEffect(() => {
    if (authLoading || !isAdmin) {
      return undefined;
    }

    const unsubscribeOrders = subscribeOrders(
      setOrders,
      () => setDbError('Unable to load orders from Firebase.')
    );

    return () => {
      unsubscribeOrders();
    };
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) {
      return undefined;
    }

    const unsubscribeMenuItems = subscribeMenuItems(
      setCustomMenuItems,
      () => setDbError('Unable to load menu items from Firebase.')
    );

    return () => {
      unsubscribeMenuItems();
    };
  }, [authLoading, isAdmin]);

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-empty-state">Checking admin account...</div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleReceiveOrder = async (order) => {
    const isReservation = isReservationOrder(order);
    const isWalkIn = isWalkInOrder(order);
    const confirmed = await confirm({
      title: isReservation ? 'Accept this reservation?' : 'Receive this order?',
      description: isReservation
        ? `${order.orderNumber || 'This reservation'} will move to waiting.${order.reservation?.orderingMode === 'preorder' ? ' Its food pre-order will enter the In Progress order queue.' : ''}`
        : isWalkIn
          ? `${order.orderNumber || 'This request'} will move to the cashier preparation queue.`
          : `${order.orderNumber || 'This request'} will move directly to delivery.`,
      confirmText: isReservation ? 'Accept Reservation' : 'Receive Order',
      cancelText: 'Not Yet',
      tone: 'default'
    });

    if (!confirmed) {
      return;
    }

    await handleUpdateOrderStatus(
      order.firebaseId,
      isReservation ? 'Waiting' : isWalkIn ? 'Received' : 'Delivering'
    );
    setSelectedOrder(null);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      setDbError('');
      await updateOrderStatus(orderId, status);
    } catch (error) {
      setDbError('Unable to update this order in Firebase.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const handleDeleteOrder = async (order) => {
    const confirmed = await confirm({
      title: isReservationOrder(order) ? 'Delete this reservation?' : 'Delete completed order?',
      description: `${order.orderNumber || 'This request'} will be permanently removed from the list.`,
      confirmText: isReservationOrder(order) ? 'Delete Reservation' : 'Delete Order',
      cancelText: 'Keep Order',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOrderId(order.firebaseId);
      setDbError('');
      await deleteOrder(order.firebaseId);
    } catch (error) {
      setDbError('Unable to delete this order from Firebase.');
    } finally {
      setDeletingOrderId('');
    }
  };

  const handleCancelReservation = async (order) => {
    const confirmed = await confirm({
      title: 'Cancel this reservation?',
      description: `${order.orderNumber || 'This reservation'} will be marked cancelled and location sharing will be disabled.`,
      confirmText: 'Cancel Reservation',
      cancelText: 'Keep Reservation',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    await handleUpdateOrderStatus(order.firebaseId, 'Cancelled');
    setSelectedOrder(null);
  };

  const handleMarkReservationArrived = async (order) => {
    const confirmed = await confirm({
      title: 'Mark reservation as arrived?',
      description: `${order.orderNumber || 'This reservation'} will be marked as arrived.`,
      confirmText: 'Mark Arrived',
      cancelText: 'Not Yet',
      tone: 'default'
    });

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingOrderId(order.firebaseId);
      setDbError('');
      await Promise.all([
        updateOrderStatus(order.firebaseId, 'Arrived'),
        updateReservationArrivalStatus(order.firebaseId, 'Arrived')
      ]);
      setSelectedOrder(null);
    } catch (error) {
      setDbError('Unable to mark this reservation as arrived.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const getOrderAddress = (order) => {
    const addressParts = [
      order.deliveryAddress?.street,
      order.deliveryAddress?.city,
      order.deliveryAddress?.zipCode
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(', ') : 'No delivery address saved';
  };

  const getPaymentMethodLabel = (paymentMethod) => {
    if (paymentMethod === 'cash') return 'Cash';
    if (paymentMethod === 'cod') return 'Cash on Delivery';
    if (paymentMethod === 'gcash') return 'GCash';
    if (paymentMethod === 'pay-at-counter') return 'Pay at Counter';
    if (paymentMethod === 'at-cafe') return 'Pay at the cafe';
    return paymentMethod || 'Not specified';
  };

  const getOrderPaymentMethod = (order) => order.payment?.method || order.paymentMethod;

  const handleCompleteCustomerReceivedOrder = async (order) => {
    const confirmed = await confirm({
      title: 'Complete this order?',
      description: `${order.orderNumber || 'This order'} was marked received by the customer and will move to completed history.`,
      confirmText: 'Mark Completed',
      cancelText: 'Not Yet',
      tone: 'default'
    });

    if (!confirmed) {
      return;
    }

    await handleUpdateOrderStatus(order.firebaseId, 'Completed');
  };

  const handleUpdateFoodStatus = async (order, status) => {
    try {
      setUpdatingOrderId(order.firebaseId);
      setDbError('');
      await updateReservationFoodStatus(order.firebaseId, status);
    } catch (error) {
      setDbError('Unable to update the reservation food order in Firebase.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const renderOrderAction = (order, foodQueue = false) => {
    const isUpdating = updatingOrderId === order.firebaseId;
    const isWalkIn = isWalkInOrder(order);

    if (foodQueue && isReservationOrder(order)) {
      const foodStatus = getReservationFoodStatus(order);
      if (!foodStatus || foodStatus === 'Completed') return null;
      return (
        <button type="button" className="btn btn-primary btn-small" disabled={isUpdating}
          onClick={() => handleUpdateFoodStatus(order, foodStatus === 'Received' ? 'Preparing' : 'Completed')}>
          {isUpdating ? 'Updating...' : foodStatus === 'Received' ? 'Start Preparing' : 'Mark Completed'}
        </button>
      );
    }

    if (isReservationOrder(order)) {
      const reservationAdminStatus = getReservationAdminStatus(order);
      const isInactiveReservation =
        order.status === 'Cancelled' ||
        getReservationArrivalStatus(order) === 'Cancelled';

      const cancelButton = !isInactiveReservation ? (
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => handleCancelReservation(order)}
          disabled={isUpdating}
        >
          {isUpdating ? 'Cancelling...' : 'Cancel'}
        </button>
      ) : null;

      const mapButton = (
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => setSelectedMapOrder(order)}
        >
          View Map
        </button>
      );

      const acceptButton = order.status === 'Pending' && !isInactiveReservation ? (
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => handleReceiveOrder(order)}
          disabled={isUpdating}
        >
          {isUpdating ? 'Accepting...' : 'Accept'}
        </button>
      ) : null;

      const arrivedButton = reservationAdminStatus !== 'Arrived' && order.status !== 'Pending' && !isInactiveReservation ? (
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => handleMarkReservationArrived(order)}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Arrived'}
        </button>
      ) : null;

      if (reservationAdminStatus === 'Arrived' || isInactiveReservation) {
        return (
          <div className="staff-action-group">
            {mapButton}
          </div>
        );
      }

      return (
        <div className="staff-action-group">
          {mapButton}
          {acceptButton}
          {arrivedButton}
          {cancelButton}
        </div>
      );
    }

    switch (order.status) {
      case 'Received':
        if (isWalkIn) {
          return (
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => handleUpdateOrderStatus(order.firebaseId, 'Completed')}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Mark Completed'}
            </button>
          );
        }
        return (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => handleUpdateOrderStatus(order.firebaseId, 'Delivering')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Delivery'}
          </button>
        );
      case 'Preparing':
        if (isWalkIn) {
          return (
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => handleUpdateOrderStatus(order.firebaseId, 'Completed')}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Mark Completed'}
            </button>
          );
        }
        return (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => handleUpdateOrderStatus(order.firebaseId, 'Delivering')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Delivery'}
          </button>
        );
      case 'Delivering':
        return (
          <span className="staff-action-note">
            Waiting for customer to mark received
          </span>
        );
      case 'Customer Received':
        return (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => handleCompleteCustomerReceivedOrder(order)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Mark Completed'}
          </button>
        );
      case 'Completed':
        return null;
      case 'Waiting':
      default:
        return null;
    }
  };

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) {
      return null;
    }

    return (
      <div
        className="admin-order-modal-overlay"
        role="presentation"
        onClick={() => setSelectedOrder(null)}
      >
        <div
          className="admin-order-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="admin-order-modal-header">
            <span className={`staff-status ${getStatusClass(getAdminStatusLabel(selectedOrder))}`}>
              {getAdminStatusLabel(selectedOrder)}
            </span>
            <h2 id="admin-order-modal-title">{selectedOrder.orderNumber}</h2>
            <p>{selectedOrder.customer} - {selectedOrder.service || 'Online Delivery'}</p>
          </div>

          <div className="admin-order-detail-grid">
            <div>
              <span>Customer</span>
              <strong>{selectedOrder.customer || 'Not provided'}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{selectedOrder.contact?.phone || 'Not provided'}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{selectedOrder.contact?.email || 'Not provided'}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{getPaymentMethodLabel(getOrderPaymentMethod(selectedOrder))}</strong>
            </div>
            {!isReservationOrder(selectedOrder) && (
              <>
                {!isWalkInOrder(selectedOrder) && (
                  <>
                    <div>
                      <span>GCash number</span>
                      <strong>{selectedOrder.payment?.gcashNumber || 'Not provided'}</strong>
                    </div>
                    <div className="admin-order-detail-wide admin-payment-reference">
                      <span>GCash reference number</span>
                      <strong>{selectedOrder.payment?.referenceNumber || 'Not provided'}</strong>
                    </div>
                  </>
                )}
              </>
            )}
            {isReservationOrder(selectedOrder) ? (
              <>
                <div>
                  <span>Guests</span>
                  <strong>{selectedOrder.reservation?.guests || 'Not provided'}</strong>
                </div>
                <div>
                  <span>Date and time</span>
                  <strong>
                    {[selectedOrder.reservation?.date, selectedOrder.reservation?.time]
                      .filter(Boolean)
                      .join(' ') || 'Not provided'}
                  </strong>
                </div>
                <div className="admin-order-detail-wide">
                  <span>Reservation notes</span>
                  <strong>{selectedOrder.reservation?.notes || 'No special request'}</strong>
                </div>
                <div className="admin-order-detail-wide">
                  <span>Food order</span>
                  <strong>{selectedOrder.reservation?.orderingMode === 'preorder' ? 'Pre-order from the menu' : 'Order at the cafe'}</strong>
                </div>
                {getReservationFoodStatus(selectedOrder) && (
                  <div><span>Food status</span><strong>{getReservationFoodStatus(selectedOrder)}</strong></div>
                )}
              </> 
            ) : (
              <div className="admin-order-detail-wide">
                <span>{isWalkInOrder(selectedOrder) ? 'Counter note' : 'Delivery address'}</span>
                <strong>
                  {isWalkInOrder(selectedOrder)
                    ? 'Use this order number as the claim number for the walk-in order.'
                    : getOrderAddress(selectedOrder)}
                </strong>
              </div>
            )}
          </div>

          {(!isReservationOrder(selectedOrder) || selectedOrder.reservation?.orderingMode === 'preorder') && (
            <div className="admin-order-items-panel">
              <h3>Order Items</h3>
              <ul>
                {(selectedOrder.items || []).map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
              <div className="admin-order-total">
                <span>Total</span>
                <strong>P{Number(selectedOrder.total || 0).toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div className="admin-order-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
              Close
            </button>
            {((isReservationOrder(selectedOrder) &&
              selectedOrder.status === 'Pending' &&
              getReservationAdminStatus(selectedOrder) !== 'Arrived') ||
              (!isReservationOrder(selectedOrder) && ['Waiting', 'Pending'].includes(selectedOrder.status))) && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleReceiveOrder(selectedOrder)}
                disabled={updatingOrderId === selectedOrder.firebaseId}
              >
                {updatingOrderId === selectedOrder.firebaseId
                  ? 'Accepting...'
                  : isReservationOrder(selectedOrder)
                    ? 'Accept Reservation'
                    : isWalkInOrder(selectedOrder)
                      ? 'Accept Walk-In'
                      : 'Accept Delivery'}
              </button>
            )}
            {isReservationOrder(selectedOrder) &&
              getReservationAdminStatus(selectedOrder) !== 'Arrived' &&
              selectedOrder.status !== 'Pending' &&
              selectedOrder.status !== 'Cancelled' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleMarkReservationArrived(selectedOrder)}
                  disabled={updatingOrderId === selectedOrder.firebaseId}
                >
                  {updatingOrderId === selectedOrder.firebaseId ? 'Updating...' : 'Arrived'}
                </button>
              )}
            {isReservationOrder(selectedOrder) &&
              getReservationAdminStatus(selectedOrder) !== 'Arrived' &&
              !['Completed', 'Cancelled'].includes(selectedOrder.status) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleCancelReservation(selectedOrder)}
                disabled={updatingOrderId === selectedOrder.firebaseId}
              >
                {updatingOrderId === selectedOrder.firebaseId ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            )}
            {isReservationOrder(selectedOrder) && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteOrder(selectedOrder)}
                disabled={deletingOrderId === selectedOrder.firebaseId}
              >
                {deletingOrderId === selectedOrder.firebaseId ? 'Deleting...' : 'Delete Reservation'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReservationMapModal = () => {
    if (!selectedMapOrder) {
      return null;
    }

    return (
      <div
        className="admin-order-modal-overlay"
        role="presentation"
        onClick={() => setSelectedMapOrder(null)}
      >
        <div
          className="admin-order-modal admin-map-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-map-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="admin-order-modal-header">
            <span className={`staff-status ${getStatusClass(getAdminStatusLabel(selectedMapOrder))}`}>
              {getAdminStatusLabel(selectedMapOrder)}
            </span>
            <h2 id="admin-map-modal-title">Reservation Route Map</h2>
            <p>{selectedMapOrder.customer} - {selectedMapOrder.orderNumber}</p>
          </div>

          <ReservationRouteMap reservation={selectedMapOrder} />

          <div className="admin-order-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedMapOrder(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleItemInputChange = (event) => {
    const { name, value } = event.target;
    setItemForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' ? { image: resolveImageLabel(value) } : {})
    }));
  };

  const resolveImageLabel = (category) => {
    if (category === 'drinks') return 'Drink';
    if (category === 'appetizers') return 'Appetizer';
    if (category === 'ramen-regular' || category === 'ramen-special') return 'Ramen';
    if (category === 'burger-sandwiches') return 'Burger';
    if (category === 'rice-bowls') return 'Rice';
    if (category === 'add-ons') return 'Add-on';
    if (category === 'short-orders') return 'Short Order';
    return 'Food';
  };

  const handleAddItem = async (event) => {
    event.preventDefault();

    const newItem = {
      name: itemForm.name,
      price: Number(itemForm.price),
      category: itemForm.category,
      description: itemForm.description,
      image: itemForm.image,
      stock: 20,
      staffAdded: true
    };

    try {
      setSavingItem(true);
      await addMenuItem(newItem);
      setItemForm(emptyItemForm);
      setDbError('');
    } catch (error) {
      setDbError('Unable to save this item to Firebase.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleWalkInInputChange = (event) => {
    const { name, value } = event.target;
    setWalkInForm((current) => ({
      ...current,
      [name]: value
    }));
    setDbError('');
    setWalkInSuccess('');
  };

  const handleAddWalkInItem = () => {
    const selectedMenuItem = menuItems.find((item) => String(item.id) === String(walkInForm.selectedItemId));
    const quantity = Math.max(1, Number(walkInForm.quantity) || 1);

    if (!selectedMenuItem) {
      setDbError('Select a menu item first.');
      return;
    }

    setWalkInItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === selectedMenuItem.id);

      if (!existingItem) {
        return [
          ...currentItems,
          {
            id: selectedMenuItem.id,
            name: selectedMenuItem.name,
            price: Number(selectedMenuItem.price || 0),
            quantity
          }
        ];
      }

      return currentItems.map((item) =>
        item.id === selectedMenuItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    });

    setWalkInForm((current) => ({
      ...current,
      selectedItemId: firstWalkInMenuItemId,
      quantity: '1'
    }));
    setDbError('');
    setWalkInSuccess('');
  };

  const handleRemoveWalkInItem = (itemId) => {
    setWalkInItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setDbError('');
    setWalkInSuccess('');
  };

  const handleRecordWalkInOrder = async (event) => {
    event.preventDefault();

    if (walkInItems.length === 0) {
      setDbError('Add at least one menu item before saving this walk-in order.');
      return;
    }

    const orderNumber = `#WI-${Date.now().toString().slice(-6)}`;
    const total = walkInItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      setSavingWalkInOrder(true);
      setDbError('');
      await addOrder({
        orderNumber,
        customer: walkInForm.customer.trim() || 'Walk-in Customer',
        service: 'Walk In',
        items: walkInItems.map((item) => `${item.name} x ${item.quantity}`),
        total,
        status: 'Received',
        paymentMethod: 'cash'
      });
      setWalkInItems([]);
      setWalkInForm({
        customer: '',
        selectedItemId: firstWalkInMenuItemId,
        quantity: '1'
      });
      setWalkInSuccess(`${orderNumber} added to the walk-in queue.`);
    } catch (error) {
      setDbError('Unable to save this walk-in order right now.');
    } finally {
      setSavingWalkInOrder(false);
    }
  };

  const renderOrdersPanel = (orderType) => {
    const workflowTabs = orderWorkflowTabs;
    const currentWorkflowTab =
      workflowTabs.find((tab) => tab.id === activeOrderTab) || workflowTabs[0];
    const allOrdersForType = orderType === 'reservation' ? reservationOrders : queueOrders;
    const filteredOrders = orderType === 'reservation'
      ? allOrdersForType
      : orders.filter((order) => matchesOrderWorkflowTab(order, currentWorkflowTab, orderType));

    return (
      <section className="admin-panel admin-tab-panel">
        {orderType !== 'reservation' && (
          <div className="admin-order-tabs" role="tablist" aria-label="Order workflow">
            {workflowTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={currentWorkflowTab.id === tab.id}
                className={`admin-order-tab ${currentWorkflowTab.id === tab.id ? 'active' : ''}`}
                onClick={() => setActiveOrderTab(tab.id)}
              >
                <span>{tab.label}</span>
                <strong>{getOrderWorkflowCount(tab, orderType)}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="staff-orders">
          {allOrdersForType.length === 0 ? (
            <div className="admin-empty-state">
              {orderType === 'reservation'
                ? 'No reservation orders yet.'
                : 'No customer orders yet.'}
            </div>
          ) : orderType !== 'reservation' && filteredOrders.length === 0 ? (
            <div className="admin-empty-state">{currentWorkflowTab.emptyText}</div>
          ) : (
            filteredOrders.map((order) => (
              <article
                key={order.id}
                className="staff-order-card staff-order-card-clickable"
                role="button"
                tabIndex="0"
                onClick={() => setSelectedOrder(order)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedOrder(order);
                  }
                }}
              >
                <div>
                  <h3>{order.orderNumber}</h3>
                  <p>{order.customer} - {order.service}</p>
                  <small>{(order.items || []).join(', ')}</small>
                </div>
                <div
                  className="staff-order-actions"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <span className={`staff-status ${getStatusClass(orderType === 'reservation' ? getAdminStatusLabel(order) : getQueueStatus(order))}`}>
                    {orderType === 'reservation' ? getAdminStatusLabel(order) : getQueueStatus(order)}
                  </span>
                  {renderOrderAction(order, orderType !== 'reservation')}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    );
  };

  const renderDashboardPanel = () => {
    const range = getDashboardRange({ ...dashboardFilters, period: 'custom' });
    const filteredOrders = range ? orders.filter((order) =>
      isDateInRange(getOrderDate(order), range.start, range.end)
    ) : [];
    const salesOrders = filteredOrders.filter(isSalesOrder);
    const totalSales = salesOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const dailySalesSeries = range ? getDashboardBuckets(range).map((bucket) => ({
      label: bucket.label, sales: getRangeSales(salesOrders, bucket.start, bucket.end)
    })) : [];
    const topSellingItems = getTopSellingItems(salesOrders);
    const maxDailySales = Math.max(...dailySalesSeries.map((item) => item.sales), 1);
    const activeDeliveryCount = filteredOrders.filter(
      (order) => !['Completed', 'Cancelled', 'Arrived'].includes(getQueueStatus(order) || order.status)
    ).length;
    const pendingReservationCount = filteredOrders.filter((order) => isReservationOrder(order) && order.status === 'Pending').length;
    const completedOrderCount = filteredOrders.filter((order) => getQueueStatus(order) === 'Completed').length;
    const recentSalesOrders = [...salesOrders].sort((a, b) => getOrderDate(b) - getOrderDate(a)).slice(0, 5);
    const setFilter = (name, value) => setDashboardFilters((current) => ({ ...current, [name]: value }));
    const dashboardStats = [
      {
        label: 'Sales',
        value: formatCurrency(totalSales)
      },
      {
        label: 'Total Orders',
        value: filteredOrders.length
      },
      {
        label: 'Average Sale',
        value: formatCurrency(salesOrders.length ? totalSales / salesOrders.length : 0)
      },
      {
        label: 'Active Orders',
        value: activeDeliveryCount
      },
      {
        label: 'Pending Reservations',
        value: pendingReservationCount
      },
      {
        label: 'Completed Orders',
        value: completedOrderCount
      }
    ];

    return (
      <section className="admin-panel admin-tab-panel admin-dashboard-panel">
        <div className="admin-dashboard-header">
          <span className="admin-dashboard-date">
            {new Date().toLocaleDateString('en-PH', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          <div className="admin-dashboard-filters">
          <label>Start date<input className="form-input" type="date" value={dashboardFilters.date} onChange={(event) => setFilter('date', event.target.value)} /></label>
          <label>End date<input className="form-input" type="date" min={dashboardFilters.date} value={dashboardFilters.endDate} onChange={(event) => setFilter('endDate', event.target.value)} /></label>
          </div>
        </div>
        {!range && <p className="checkout-error" role="alert">Choose valid dates with the end date on or after the start date.</p>}

        <div className="admin-dashboard-stats">
          {dashboardStats.map((stat) => (
            <article key={stat.label} className="admin-dashboard-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-dashboard-grid">
          <section className="admin-dashboard-card admin-sales-card">
            <div className="admin-dashboard-card-header">
              <div>
                <h3>Sales Trend</h3>
                <p>Completed customer orders and fulfilled deliveries</p>
              </div>
              <strong>{formatCurrency(totalSales)}</strong>
            </div>
            <div className="admin-sales-chart admin-filtered-sales-chart" aria-label="Sales chart for selected period" style={{ gridTemplateColumns: `repeat(${Math.max(1, dailySalesSeries.length)}, minmax(64px, 1fr))` }}>
              {dailySalesSeries.map((item) => (
                <div key={item.label} className="admin-sales-bar-item">
                  <div className="admin-sales-bar-track">
                    <span
                      className="admin-sales-bar"
                      style={{ height: `${Math.max((item.sales / maxDailySales) * 100, item.sales > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <span>{item.label}</span>
                  <small>{formatCurrency(item.sales)}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-header">
              <div>
                <h3>Top Items</h3>
                <p>By quantity sold</p>
              </div>
            </div>
            <div className="admin-ranked-list">
              {topSellingItems.length === 0 ? (
                <div className="admin-empty-state">No completed sales data yet.</div>
              ) : (
                topSellingItems.map((item, index) => (
                  <div key={item.name} className="admin-ranked-item">
                    <span>{index + 1}</span>
                    <strong>{item.name}</strong>
                    <em>{item.quantity} sold</em>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <div>
                <h3>Recent Sales</h3>
                <p>Latest completed customer orders</p>
            </div>
          </div>
          <div className="admin-sales-table">
            {recentSalesOrders.length === 0 ? (
              <div className="admin-empty-state">No recent sales yet.</div>
            ) : (
              recentSalesOrders.map((order) => {
                const orderDate = getOrderDate(order);

                return (
                  <article key={order.id} className="admin-sales-row">
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{order.customer || 'Customer'} - {order.service || 'Online Delivery'}</span>
                    </div>
                    <span>
                      {orderDate
                        ? orderDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'No date'}
                    </span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    );
  };

  const renderWalkInPanel = () => {
    const walkInTotal = walkInItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
      <section className="admin-panel admin-tab-panel admin-walk-in-panel">
        <div className="admin-panel-header admin-walk-in-header">
          <div>
            <h2>Walk-In Counter</h2>
            <p>Receive counter orders, review the current ticket, and monitor the queue.</p>
          </div>
        </div>

        <div className="admin-walk-in-layout">
          <form className="admin-walk-in-builder admin-walk-in-surface" onSubmit={handleRecordWalkInOrder}>
            <div className="admin-add-preview-header">
              <span>Cashier Input</span>
              <strong>Receive a walk-in order</strong>
            </div>

            <label className="form-field">
              <span>Customer name</span>
              <input
                type="text"
                name="customer"
                placeholder="Walk-in Customer"
                value={walkInForm.customer}
                onChange={handleWalkInInputChange}
                className="form-input"
              />
            </label>

            <div className="form-row-2">
              <label className="form-field">
                <span>Menu item</span>
                <select
                  name="selectedItemId"
                  value={walkInForm.selectedItemId}
                  onChange={handleWalkInInputChange}
                  className="form-input"
                >
                  {walkInMenuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {formatCurrency(item.price)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Quantity</span>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={walkInForm.quantity}
                  onChange={handleWalkInInputChange}
                  className="form-input"
                />
              </label>
            </div>

            <div className="admin-walk-in-actions">
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={handleAddWalkInItem}
              >
                Add Item
              </button>

              <button type="submit" className="btn btn-primary btn-full" disabled={savingWalkInOrder}>
                {savingWalkInOrder ? 'Saving...' : 'Receive Walk-In Order'}
              </button>
            </div>
          </form>

          <aside className="admin-walk-in-ticket admin-walk-in-surface">
            <div className="admin-walk-in-section-head">
              <div className="admin-add-preview-header">
                <span>Order Preview</span>
                <strong>Current counter order</strong>
              </div>
              <div className="admin-walk-in-inline-meta">
                <span>{walkInItems.length} item{walkInItems.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            {walkInItems.length === 0 ? (
              <div className="admin-empty-state admin-walk-in-empty-state">
                Add menu items here before sending the order to the queue.
              </div>
            ) : (
              <div className="admin-walk-in-ticket-card">
                <div className="admin-walk-in-ticket-list">
                  {walkInItems.map((item) => (
                    <article key={item.id} className="admin-walk-in-ticket-item">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.quantity} x {formatCurrency(item.price)}</span>
                      </div>
                      <div className="admin-walk-in-ticket-item-actions">
                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleRemoveWalkInItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="admin-order-total admin-walk-in-total">
                  <span>Total</span>
                  <strong>{formatCurrency(walkInTotal)}</strong>
                </div>
              </div>
            )}

            {walkInSuccess && <div className="admin-walk-in-success">{walkInSuccess}</div>}
          </aside>
        </div>
      </section>
    );
  };

  const renderAddItemPanel = () => (
    <section className="admin-panel admin-tab-panel admin-add-panel">
      <div className="admin-add-layout">
        <form className="admin-add-form" onSubmit={handleAddItem}>
          <label className="form-field">
            <span>Item or food name</span>
            <input
              type="text"
              name="name"
              placeholder="Food name"
              value={itemForm.name}
              onChange={handleItemInputChange}
              className="form-input"
              required
            />
          </label>
          <label className="form-field">
            <span>Price</span>
            <input
              type="number"
              name="price"
              placeholder="0"
              min="1"
              value={itemForm.price}
              onChange={handleItemInputChange}
              className="form-input"
              required
            />
          </label>
          <label className="form-field">
            <span>Menu category</span>
            <select
              name="category"
              value={itemForm.category}
              onChange={handleItemInputChange}
              className="form-input"
            >
              {menuCategories
                .filter((category) => category.id !== 'all')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea
              name="description"
              placeholder="Short menu description"
              value={itemForm.description}
              onChange={handleItemInputChange}
              className="form-input reservation-notes"
              rows="4"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-full" disabled={savingItem}>
            {savingItem ? 'Saving Item...' : 'Add Item to Menu'}
          </button>
        </form>

        <aside className="admin-add-preview">
          <div className="admin-add-preview-header">
            <span>Menu Preview</span>
          </div>

          <article className="admin-menu-preview-card">
            <div className="admin-menu-preview-media">
              <div className="admin-menu-preview-icon" aria-hidden="true">
                <CategoryIcon type={itemForm.category} />
              </div>
              <span>{itemForm.image}</span>
            </div>

            <div className="admin-menu-preview-body">
              <div className="admin-menu-preview-copy">
                <h3>{itemForm.name || 'New menu item'}</h3>
                <p>
                  {itemForm.description || 'Short menu description'}
                </p>
              </div>

              <div className="admin-menu-preview-footer">
                <strong>
                  P{Number(itemForm.price || 0).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </strong>
                <span>
                  {(menuCategories.find((category) => category.id === itemForm.category)?.name) || 'Menu Category'}
                </span>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );

  const activeAdminTab = getAdminTabById(activeTab);

  return (
    <>
      <div className="admin-page">
        <section className="admin-hero">
          <h1>{activeAdminTab.title}</h1>
        </section>

        {dbError && <div className="admin-error">{dbError}</div>}

        <section className="admin-tabs-shell">
          <div className="admin-tab-content">
            {activeTab === 'dashboard' && renderDashboardPanel()}
            {activeTab === 'delivery-orders' && renderOrdersPanel('delivery')}
            {activeTab === 'walk-in' && renderWalkInPanel()}
            {activeTab === 'reservations' && renderOrdersPanel('reservation')}
            {activeTab === 'add-item' && renderAddItemPanel()}
          </div>
        </section>
      </div>

      {renderOrderDetailsModal()}
      {renderReservationMapModal()}
    </>
  );
};

export default Admin;
