import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import { baseMenuItems, menuCategories } from '../data/menudata';
import {
  addMenuItem,
  deleteOrder,
  subscribeMenuItems,
  subscribeOrders,
  updateOrderStatus
} from '../services/database';

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
    id: 'orders',
    label: 'Receive Orders',
    mobileLabel: 'Orders',
    title: 'Receive Orders',
    description: 'Confirm incoming delivery and reservation requests.'
  },
  {
    id: 'add-item',
    label: 'Add Item',
    mobileLabel: 'Add Item',
    title: 'Add Item / Food',
    description: 'New items are saved to the customer delivery menu.'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    mobileLabel: 'Inventory',
    title: 'Inventory System',
    description: 'Track current stock levels for staff and kitchen use.'
  }
];

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
  const [orders, setOrders] = useState([]);
  const [customMenuItems, setCustomMenuItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [dbError, setDbError] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [activeOrderTab, setActiveOrderTab] = useState('receiving');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const inventoryItems = useMemo(
    () => [...baseMenuItems, ...customMenuItems],
    [customMenuItems]
  );

  const waitingOrders = orders.filter((order) => order.status === 'Waiting').length;
  const lowStockItems = inventoryItems.filter((item) => Number(item.stock || 0) <= 12).length;

  const getOrderWorkflowCount = (tab) =>
    orders.filter((order) => tab.statuses.includes(order.status)).length;

  const getStatusClass = (status) =>
    `status-${String(status).toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    if (authLoading || !isAdmin) {
      return undefined;
    }

    const unsubscribeItems = subscribeMenuItems(
      setCustomMenuItems,
      () => setDbError('Unable to load menu items from Firebase.')
    );
    const unsubscribeOrders = subscribeOrders(
      setOrders,
      () => setDbError('Unable to load orders from Firebase.')
    );

    return () => {
      unsubscribeItems();
      unsubscribeOrders();
    };
  }, [authLoading, isAdmin]);

  useEffect(() => {
    document.body.classList.add('has-admin-mobile-nav');

    return () => {
      document.body.classList.remove('has-admin-mobile-nav');
    };
  }, []);

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
    const confirmed = await confirm({
      title: 'Receive this order?',
      description: `${order.orderNumber || 'This order'} will move to the food preparation workflow.`,
      confirmText: 'Receive Order',
      cancelText: 'Not Yet',
      tone: 'default'
    });

    if (!confirmed) {
      return;
    }

    await handleUpdateOrderStatus(order.firebaseId, 'Received');
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
      title: 'Delete completed order?',
      description: `${order.orderNumber || 'This order'} will be permanently removed from the order list.`,
      confirmText: 'Delete Order',
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
        return (
          <button
            type="button"
            className="btn btn-danger btn-small"
            onClick={() => handleDeleteOrder(order)}
            disabled={deletingOrderId === order.firebaseId}
          >
            {deletingOrderId === order.firebaseId ? 'Deleting...' : 'Delete'}
          </button>
        );
      case 'Waiting':
      default:
        return (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => setSelectedOrder(order)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'View Details'}
          </button>
        );
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
            <span className={`staff-status ${getStatusClass(selectedOrder.status)}`}>
              {selectedOrder.status}
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
            <div className="admin-order-detail-wide">
              <span>Delivery address</span>
              <strong>{getOrderAddress(selectedOrder)}</strong>
            </div>
          </div>

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

          <div className="admin-order-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
              Close
            </button>
            {['Waiting', 'Pending'].includes(selectedOrder.status) && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleReceiveOrder(selectedOrder)}
                disabled={updatingOrderId === selectedOrder.firebaseId}
              >
                {updatingOrderId === selectedOrder.firebaseId ? 'Accepting...' : 'Accept Delivery'}
              </button>
            )}
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

  const renderOrdersPanel = () => {
    const currentWorkflowTab =
      orderWorkflowTabs.find((tab) => tab.id === activeOrderTab) || orderWorkflowTabs[0];
    const filteredOrders = orders.filter((order) =>
      currentWorkflowTab.statuses.includes(order.status)
    );

    return (
      <section className="admin-panel admin-tab-panel">
        <div className="admin-panel-header">
          <h2>{adminTabs[0].title}</h2>
          <p>{adminTabs[0].description}</p>
        </div>

        <div className="admin-order-tabs" role="tablist" aria-label="Order workflow">
          {orderWorkflowTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeOrderTab === tab.id}
              className={`admin-order-tab ${activeOrderTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveOrderTab(tab.id)}
            >
              <span>{tab.label}</span>
              <strong>{getOrderWorkflowCount(tab)}</strong>
            </button>
          ))}
        </div>

        <div className="staff-orders">
          {orders.length === 0 ? (
            <div className="admin-empty-state">No customer orders yet.</div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-empty-state">{currentWorkflowTab.emptyText}</div>
          ) : (
            filteredOrders.map((order) => (
              <article key={order.id} className="staff-order-card">
                <div>
                  <h3>{order.orderNumber}</h3>
                  <p>{order.customer} - {order.service}</p>
                  <small>{(order.items || []).join(', ')}</small>
                </div>
                <div className="staff-order-actions">
                  <span className={`staff-status ${getStatusClass(order.status)}`}>
                    {order.status}
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
        <h2>{adminTabs[1].title}</h2>
        <p>{adminTabs[1].description}</p>
      </div>

      <form className="admin-add-form" onSubmit={handleAddItem}>
        <input
          type="text"
          name="name"
          placeholder="Item or food name"
          value={itemForm.name}
          onChange={handleItemInputChange}
          className="form-input"
          required
        />
        <div className="form-row-2">
          <input
            type="number"
            name="price"
            placeholder="Price"
            min="1"
            value={itemForm.price}
            onChange={handleItemInputChange}
            className="form-input"
            required
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            min="0"
            value={itemForm.stock}
            onChange={handleItemInputChange}
            className="form-input"
            required
          />
        </div>
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
        <textarea
          name="description"
          placeholder="Description"
          value={itemForm.description}
          onChange={handleItemInputChange}
          className="form-input reservation-notes"
          rows="4"
          required
        />
        <button type="submit" className="btn btn-primary btn-full" disabled={savingItem}>
          {savingItem ? 'Saving Item...' : 'Add Item to Menu'}
        </button>
      </form>
    </section>
  );

  const renderInventoryPanel = () => (
    <section className="admin-panel inventory-panel admin-tab-panel">
      <div className="admin-panel-header">
        <h2>{adminTabs[2].title}</h2>
        <p>{adminTabs[2].description}</p>
      </div>

      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => {
              const stock = Number(item.stock || 0);
              const stockStatus = stock <= 0 ? 'Out' : stock <= 12 ? 'Low' : 'Available';

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.staffAdded && <span className="staff-added-label">Staff added</span>}
                  </td>
                  <td>{menuCategories.find((category) => category.id === item.category)?.name}</td>
                  <td>P{Number(item.price).toFixed(2)}</td>
                  <td>{stock}</td>
                  <td>
                    <span className={`inventory-status inventory-${stockStatus.toLowerCase()}`}>
                      {stockStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <span className="service-eyebrow">Admin / Staff Account</span>
        <h1>Order Receiving and Inventory</h1>
        <p>Receive customer orders, monitor stock, and add new food or drink items.</p>
      </section>

      <section className="admin-stats" aria-label="Admin summary">
        <div className="admin-stat">
          <span>{waitingOrders}</span>
          <p>Waiting orders</p>
        </div>
        <div className="admin-stat">
          <span>{inventoryItems.length}</span>
          <p>Menu items</p>
        </div>
        <div className="admin-stat">
          <span>{lowStockItems}</span>
          <p>Low stock items</p>
        </div>
      </section>

      {dbError && <div className="admin-error">{dbError}</div>}

      <section className="admin-tabs-shell">
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`admin-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-tab-content">
          {activeTab === 'orders' && renderOrdersPanel()}
          {activeTab === 'add-item' && renderAddItemPanel()}
          {activeTab === 'inventory' && renderInventoryPanel()}
        </div>
      </section>

      <nav className="admin-mobile-nav" aria-label="Admin sections">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-mobile-nav-link ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.mobileLabel}
          </button>
        ))}
      </nav>

      {renderOrderDetailsModal()}
    </div>
  );
};

export default Admin;
