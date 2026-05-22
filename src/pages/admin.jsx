import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import ReservationRouteMap from '../components/reservationroutemap';
import { menuCategories } from '../data/menudata';
import {
  addMenuItem,
  deleteOrder,
  subscribeOrders,
  updateOrderStatus,
  updateReservationArrivalStatus
} from '../services/database';
import {
  getReservationArrivalStatus,
  isReservationOrder
} from '../utils/reservationarrival';

const emptyItemForm = {
  name: '',
  price: '',
  category: 'drinks',
  description: '',
  stock: '',
  image: 'Drink'
};

const adminTabs = [
  {
    id: 'delivery-orders',
    label: 'Orders',
    mobileLabel: 'Orders',
    title: 'Orders',
    description: 'Receive and manage customer delivery orders.'
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
  adminTabs.some((tab) => tab.id === tabId) ? tabId : 'delivery-orders';

const orderWorkflowTabs = [
  {
    id: 'receiving',
    label: 'Receiving',
    statuses: ['Waiting', 'Pending'],
    emptyText: 'No orders waiting to be received.'
  },
  {
    id: 'preparing',
    label: 'Preparing Food',
    statuses: ['Received', 'Preparing'],
    emptyText: 'No orders in food preparation.'
  },
  {
    id: 'delivery',
    label: 'Delivery',
    statuses: ['Delivering', 'Customer Received'],
    emptyText: 'No orders out for delivery.'
  },
  {
    id: 'completed',
    label: 'Completed History',
    statuses: ['Completed'],
    emptyText: 'No completed orders yet.'
  }
];

const Admin = () => {
  const { authLoading, currentUser, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [dbError, setDbError] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [activeTab, setActiveTab] = useState(() => getValidAdminTab(searchParams.get('tab')));
  const [activeOrderTab, setActiveOrderTab] = useState('receiving');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMapOrder, setSelectedMapOrder] = useState(null);

  useEffect(() => {
    setActiveTab(getValidAdminTab(searchParams.get('tab')));
  }, [searchParams]);

  const deliveryOrders = orders.filter((order) => !isReservationOrder(order));
  const reservationOrders = orders.filter((order) => isReservationOrder(order));

  const matchesOrderWorkflowTab = (order, tab, orderType) => {
    if (orderType === 'reservation') {
      return isReservationOrder(order);
    }

    return !isReservationOrder(order) && tab.statuses.includes(order.status);
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
    const confirmed = await confirm({
      title: isReservation ? 'Accept this reservation?' : 'Receive this order?',
      description: isReservation
        ? `${order.orderNumber || 'This reservation'} will move to waiting.`
        : `${order.orderNumber || 'This request'} will move to the food preparation workflow.`,
      confirmText: isReservation ? 'Accept Reservation' : 'Receive Order',
      cancelText: 'Not Yet',
      tone: 'default'
    });

    if (!confirmed) {
      return;
    }

    await handleUpdateOrderStatus(order.firebaseId, isReservation ? 'Waiting' : 'Received');
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
    if (paymentMethod === 'cod') return 'Cash on Delivery';
    if (paymentMethod === 'gcash') return 'GCash';
    return paymentMethod || 'Not specified';
  };

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

  const renderOrderAction = (order) => {
    const isUpdating = updatingOrderId === order.firebaseId;

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
        return (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => handleUpdateOrderStatus(order.firebaseId, 'Preparing')}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Food Preparation'}
          </button>
        );
      case 'Preparing':
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
              <strong>{getPaymentMethodLabel(selectedOrder.paymentMethod)}</strong>
            </div>
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
              </>
            ) : (
              <div className="admin-order-detail-wide">
                <span>Delivery address</span>
                <strong>{getOrderAddress(selectedOrder)}</strong>
              </div>
            )}
          </div>

          {!isReservationOrder(selectedOrder) && (
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
      stock: Number(itemForm.stock),
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

  const renderOrdersPanel = (orderType) => {
    const currentAdminTab = orderType === 'reservation' ? adminTabs[1] : adminTabs[0];
    const workflowTabs = orderWorkflowTabs;
    const currentWorkflowTab =
      workflowTabs.find((tab) => tab.id === activeOrderTab) || workflowTabs[0];
    const allOrdersForType = orderType === 'reservation' ? reservationOrders : deliveryOrders;
    const filteredOrders = orderType === 'reservation'
      ? allOrdersForType
      : orders.filter((order) => matchesOrderWorkflowTab(order, currentWorkflowTab, orderType));

    return (
      <section className="admin-panel admin-tab-panel">
        <div className="admin-panel-header">
          <h2>{currentAdminTab.title}</h2>
          <p>{currentAdminTab.description}</p>
        </div>

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
                : 'No online delivery orders yet.'}
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
                  <span className={`staff-status ${getStatusClass(getAdminStatusLabel(order))}`}>
                    {getAdminStatusLabel(order)}
                  </span>
                  {renderOrderAction(order)}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    );
  };

  const renderAddItemPanel = () => (
    <section className="admin-panel admin-tab-panel">
      <div className="admin-panel-header">
        <h2>{adminTabs[2].title}</h2>
        <p>{adminTabs[2].description}</p>
      </div>

      <form className="admin-add-form" onSubmit={handleAddItem}>
        <label className="form-field">
          <span>Item or food name</span>
          <input
            type="text"
            name="name"
            placeholder="Example: Iced Latte"
            value={itemForm.name}
            onChange={handleItemInputChange}
            className="form-input"
            required
          />
        </label>
        <div className="form-row-2">
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
            <span>Available stock</span>
            <input
              type="number"
              name="stock"
              placeholder="0"
              min="0"
              value={itemForm.stock}
              onChange={handleItemInputChange}
              className="form-input"
              required
            />
          </label>
        </div>
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
            placeholder="Short description customers will see on the menu"
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
    </section>
  );

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <span className="service-eyebrow">Admin / Staff Account</span>
        <h1>Orders and Menu Management</h1>
        <p>Manage online delivery orders, reservations, and customer menu items.</p>
      </section>

      {dbError && <div className="admin-error">{dbError}</div>}

      <section className="admin-tabs-shell">
        <div className="admin-tab-content">
          {activeTab === 'delivery-orders' && renderOrdersPanel('delivery')}
          {activeTab === 'reservations' && renderOrdersPanel('reservation')}
          {activeTab === 'add-item' && renderAddItemPanel()}
        </div>
      </section>

      {renderOrderDetailsModal()}
      {renderReservationMapModal()}
    </div>
  );
};

export default Admin;
