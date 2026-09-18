import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useConfirm } from '../context/confirmcontext';
import { addOrder, subscribeMenuItems, subscribeOrders, updateReservationLocation } from '../services/database';
import { baseMenuItems, menuCategories } from '../data/menudata';
import ReservationMenuItem from '../components/reservationmenuitem';
import {
  defaultReservationArrivalStatus,
  formatReservationLocationTime,
  getArrivalStatusFromLocation,
  getReservationArrivalStatus,
  getReservationAvailabilityText,
  isActiveReservation,
  isReservationOrder,
  reservationLocationConsentText
} from '../utils/reservationarrival';

const getGeolocationErrorMessage = (error) => {
  if (error?.code === 1) {
    return 'Location permission is blocked. Please allow location access in your browser, then click Share Current Location again.';
  }

  if (error?.code === 2) {
    return 'Your location is currently unavailable. Please turn on device location and try again.';
  }

  if (error?.code === 3) {
    return 'Location request timed out. Please try again.';
  }

  return 'Unable to get your location. Please allow location access and try again.';
};

const Reservation = () => {
  const { currentUser, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [reservationNumber, setReservationNumber] = useState('');
  const [reservationError, setReservationError] = useState('');
  const [savingReservation, setSavingReservation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locatingCustomer, setLocatingCustomer] = useState(false);
  const [latestLocation, setLatestLocation] = useState(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [activeReservation, setActiveReservation] = useState(null);
  const [checkingReservation, setCheckingReservation] = useState(true);
  const [orderingMode, setOrderingMode] = useState('at-cafe');
  const [customMenuItems, setCustomMenuItems] = useState([]);
  const [menuError, setMenuError] = useState('');
  const [quantities, setQuantities] = useState({});
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [savedPreorder, setSavedPreorder] = useState(null);
  const liveLocationWatchId = useRef(null);
  const menuItems = [...baseMenuItems, ...customMenuItems];
  const selectedItems = orderingMode === 'preorder'
    ? menuItems.filter((item) => quantities[item.id] > 0).map((item) => ({
        id: item.id, name: item.name, price: Number(item.price), quantity: quantities[item.id]
      }))
    : [];
  const preorderTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredMenu = menuItems.filter((item) =>
    (category === 'all' || item.category === category) &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!currentUser || isAdmin) return;
    setFormData((current) => ({
      ...current,
      name: current.name || currentUser.displayName || '',
      email: current.email || currentUser.email || ''
    }));
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (!currentUser || isAdmin || orderingMode !== 'preorder') return undefined;
    return subscribeMenuItems(
      (items) => { setCustomMenuItems(items); setMenuError(''); },
      () => setMenuError('Staff-added menu items are unavailable right now.')
    );
  }, [currentUser, isAdmin, orderingMode]);

  useEffect(() => {
    if (!currentUser || isAdmin) {
      setActiveReservation(null);
      setCheckingReservation(false);
      return undefined;
    }

    setCheckingReservation(true);

    const unsubscribe = subscribeOrders(
      (orders) => {
        const existingActiveReservation = orders.find((order) =>
          order.customerId === currentUser.uid &&
          isReservationOrder(order) &&
          isActiveReservation(order)
        );

        setActiveReservation(existingActiveReservation || null);
        setCheckingReservation(false);
      },
      () => {
        setReservationError('Unable to check your existing reservations right now.');
        setCheckingReservation(false);
      }
    );

    return unsubscribe;
  }, [currentUser, isAdmin]);

  useEffect(() => {
    return () => {
      if (liveLocationWatchId.current) {
        navigator.geolocation?.clearWatch(liveLocationWatchId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeReservation?.status === 'Waiting') {
      return;
    }

    if (liveLocationWatchId.current) {
      navigator.geolocation?.clearWatch(liveLocationWatchId.current);
      liveLocationWatchId.current = null;
    }

    setLiveSharing(false);
  }, [activeReservation]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (savingReservation) return;
    if (!currentUser || isAdmin) {
      setReservationError('Please log in with a customer account before submitting a reservation.');
      return;
    }

    if (activeReservation) {
      setReservationError('This account already has an active reservation. Please complete, cancel, or wait for it to expire before making another one.');
      return;
    }

    if (orderingMode === 'preorder' && selectedItems.length === 0) {
      setReservationError('Choose at least one menu item or select Order at the cafe.');
      return;
    }

    if (selectedItems.some((item) => {
      const menuItem = menuItems.find((entry) => entry.id === item.id);
      return !Number.isInteger(item.quantity) || item.quantity < 1 ||
        item.quantity > Number(menuItem.stock ?? 20) || !Number.isFinite(item.price) || item.price < 0;
    })) {
      setReservationError('Please check the quantities and availability of your selected items.');
      return;
    }

    const preorder = { orderingMode, items: selectedItems, total: preorderTotal };
    const orderNumber = `#RS-${Date.now().toString().slice(-6)}`;

    try {
      setSavingReservation(true);
      await addOrder({
        orderNumber,
        customer: formData.name,
        service: 'Online Reservation',
        items: [
          `Table for ${formData.guests}`, `${formData.date} ${formData.time}`,
          orderingMode === 'preorder' ? 'Pre-order - pay at the cafe' : 'Order at the cafe',
          ...selectedItems.map((item) => `${item.name} x ${item.quantity} - P${(item.price * item.quantity).toFixed(2)}`)
        ],
        total: preorderTotal,
        preorderItems: selectedItems,
        paymentMethod: 'at-cafe',
        status: 'Pending',
        reservationArrivalStatus: defaultReservationArrivalStatus,
        locationSharingEnabled: false,
        customerId: currentUser.uid,
        contact: {
          email: formData.email || currentUser.email,
          phone: formData.phone
        },
        reservation: {
          orderingMode,
          date: formData.date,
          time: formData.time,
          guests: Number(formData.guests),
          notes: formData.notes
        }
      });
      setReservationNumber(orderNumber);
      setSavedPreorder(preorder);
      setReservationError('');
      setLocationError('');
      setLatestLocation(null);
      setSubmitted(true);
    } catch (error) {
      setReservationError('Unable to save this reservation to Firebase.');
    } finally {
      setSavingReservation(false);
    }
  };

  const stopLiveLocation = () => {
    if (liveLocationWatchId.current) {
      navigator.geolocation.clearWatch(liveLocationWatchId.current);
      liveLocationWatchId.current = null;
    }

    setLiveSharing(false);
  };

  const canShareReservationLocation = (order) =>
    Boolean(order) && isActiveReservation(order) && order.status === 'Waiting';

  const handleShareActiveReservationLocation = async (order) => {
    const orderId = order.firebaseId || order.id;

    if (!canShareReservationLocation(order)) {
      setLocationError(
        order?.status === 'Pending'
          ? 'Location sharing will be available after the admin accepts your reservation.'
          : 'Location sharing is disabled for inactive reservations.'
      );
      return;
    }

    const agreed = await confirm({
      title: 'Share location for this reservation?',
      description: reservationLocationConsentText,
      confirmText: 'I Agree',
      cancelText: 'Not Now',
      tone: 'default'
    });

    if (!agreed) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser.');
      return;
    }

    if (liveLocationWatchId.current) {
      return;
    }

    setLocatingCustomer(true);
    setLocationError('');

    liveLocationWatchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const sharedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          reservation_id: orderId,
          customer_id: order.customerId || currentUser?.uid || '',
          customer: order.customer || '',
          consentStatus: true
        };

        try {
          await updateReservationLocation(orderId, {
            ...sharedLocation,
            reservationArrivalStatus: getArrivalStatusFromLocation(sharedLocation)
          });
          setLatestLocation(sharedLocation);
          setLiveSharing(true);
        } catch (error) {
          setLocationError('Unable to save your latest location right now.');
        } finally {
          setLocatingCustomer(false);
        }
      },
      (error) => {
        setLocationError(getGeolocationErrorMessage(error));
        setLocatingCustomer(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  };

  if (submitted) {
    return (
      <div className="reservation-page">
        <div className="reservation-confirmation">
          <span className="reservation-status">Reservation request sent</span>
          <h1>We saved your table request.</h1>
          <p>
            {formData.name}, your online reservation for {formData.guests} guest
            {formData.guests === '1' ? '' : 's'} is queued for confirmation.
          </p>
          <div className="reservation-summary">
            <span>{reservationNumber}</span>
            <span>{formData.date || 'Selected date'}</span>
            <span>{formData.time || 'Selected time'}</span>
          </div>
          <div className="reservation-food-summary">
            <strong>{savedPreorder?.orderingMode === 'preorder' ? 'Pre-order - pay at the cafe' : 'Order at the cafe'}</strong>
            <ul>{savedPreorder?.items.map((item) => (
              <li key={item.id}>{item.name} x {item.quantity} - P{(item.price * item.quantity).toFixed(2)}</li>
            ))}</ul>
            {savedPreorder?.orderingMode === 'preorder' && <p>Food total: P{savedPreorder.total.toFixed(2)}</p>}
          </div>
          <div className="reservation-arrival-panel reservation-confirmation-tracking">
            <div className="reservation-arrival-header">
              <div>
                <span className="tracking-label">Reservation pending</span>
                <strong>Waiting for admin acceptance</strong>
                <p className="reservation-tracking-note">
                  Arrival tracking and location sharing will open after the restaurant accepts your reservation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || isAdmin) {
    return (
      <div className="reservation-page">
        <div className="reservation-confirmation">
          <span className="reservation-status">Customer login required</span>
          <h1>Log in to reserve online.</h1>
          <p>Reservations are only available for customer accounts.</p>
          <Link to="/login" className="btn btn-primary">
            Open Customer Login
          </Link>
        </div>
      </div>
    );
  }

  if (checkingReservation) {
    return (
      <div className="reservation-page">
        <div className="reservation-confirmation">
          <span className="reservation-status">Checking reservation</span>
          <h1>Please wait.</h1>
          <p>We are checking if this account already has an active reservation.</p>
        </div>
      </div>
    );
  }

  if (activeReservation) {
    const activeLatestLocation = latestLocation || activeReservation.latestReservationLocation;
    const canShareLocation = canShareReservationLocation(activeReservation);

    return (
      <div className="reservation-page">
        <div className="reservation-confirmation">
          <span className="reservation-status">Active reservation found</span>
          <h1>Your active reservation</h1>
          <div className="reservation-food-summary">
            <ul>{(activeReservation.items || []).map((item, index) => <li key={index}>{item}</li>)}</ul>
            {activeReservation.reservation?.orderingMode === 'preorder' && (
              <strong>Food total: P{Number(activeReservation.total || 0).toFixed(2)} - pay at the cafe</strong>
            )}
          </div>
          <div className="reservation-arrival-panel reservation-confirmation-tracking">
            <div className="reservation-arrival-header">
              <div>
                <span className="tracking-label">Reservation arrival</span>
                <strong>{getReservationArrivalStatus(activeReservation)}</strong>
                <p className="reservation-tracking-note">
                  {canShareLocation
                    ? 'Share your current location only while this reservation is active so the restaurant can prepare before you arrive.'
                    : 'Arrival tracking and location sharing will open after the restaurant accepts your reservation.'}
                </p>
              </div>
              <span className="reservation-active-pill active">
                {getReservationAvailabilityText(activeReservation)}
              </span>
            </div>

            <div className="reservation-location-actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => handleShareActiveReservationLocation(activeReservation)}
                disabled={!canShareLocation || locatingCustomer || liveSharing}
              >
                {liveSharing ? 'Live Sharing On' : locatingCustomer ? 'Starting...' : 'Start Live Location'}
              </button>
              {liveSharing && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={stopLiveLocation}
                >
                  Stop Sharing
                </button>
              )}
              <span>
                {activeLatestLocation
                  ? `${liveSharing ? 'Live location active. ' : ''}Last shared ${formatReservationLocationTime(activeLatestLocation.timestamp)}`
                  : canShareLocation
                    ? 'No location shared'
                    : 'Waiting for admin acceptance'}
              </span>
            </div>

            {locationError && <p className="checkout-error">{locationError}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-page">
      <section className="reservation-panel">
        <div className="reservation-copy">
          <h1>Online Reservation</h1>
        </div>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-field">
              <span>Full name</span>
              <input
                type="text"
                name="name"
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </label>
          </div>
          <div className="form-row-2">
            <label className="form-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </label>
            <label className="form-field">
              <span>Phone number</span>
              <input
                type="tel"
                name="phone"
                placeholder="09XX XXX XXXX"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </label>
          </div>
          <div className="form-row-2">
            <label className="form-field">
              <span>Reservation date</span>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </label>
            <label className="form-field">
              <span>Arrival time</span>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Number of guests</span>
              <select
                name="guests"
                value={formData.guests}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="1">1 guest</option>
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
                <option value="5">5 guests</option>
                <option value="6">6 guests</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Special request</span>
              <textarea
                name="notes"
                placeholder="Optional notes for table setup or food preparation"
                value={formData.notes}
                onChange={handleInputChange}
                className="form-input reservation-notes"
                rows="4"
              />
            </label>
          </div>
          <fieldset className="reservation-food-options" disabled={savingReservation}>
            <legend>Food order</legend>
            <div className="reservation-ordering-modes">
              <label><input type="radio" name="orderingMode" value="at-cafe" checked={orderingMode === 'at-cafe'} onChange={() => { setOrderingMode('at-cafe'); setReservationError(''); }} /> Order at the cafe</label>
              <label><input type="radio" name="orderingMode" value="preorder" checked={orderingMode === 'preorder'} onChange={() => { setOrderingMode('preorder'); setReservationError(''); }} /> Pre-order from the menu</label>
            </div>
            {orderingMode === 'preorder' && (
              <>
                <div className="reservation-menu-filters">
                  <input className="form-input" type="search" aria-label="Search reservation menu" placeholder="Search menu" value={search} onChange={(event) => setSearch(event.target.value)} />
                  <select className="form-input" aria-label="Reservation menu category" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {menuCategories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                  </select>
                </div>
                {menuError && <p className="checkout-error">{menuError}</p>}
                <div className="reservation-menu-list">
                  {filteredMenu.map((item) => (
                    <ReservationMenuItem key={item.id} item={item} selectedQuantity={quantities[item.id] || 0}
                      onAdd={(amount) => setQuantities((current) => ({ ...current, [item.id]: Math.min(Number(item.stock ?? 20), (current[item.id] || 0) + amount) }))} />
                  ))}
                  {filteredMenu.length === 0 && <p>No menu items found.</p>}
                </div>
                <div className="reservation-food-summary" aria-live="polite">
                  <ul>{selectedItems.map((item) => <li key={item.id}>
                    {item.name} x {item.quantity} - P{(item.price * item.quantity).toFixed(2)}
                    <button type="button" className="reservation-remove-item" aria-label={`Remove ${item.name}`} title={`Remove ${item.name}`} onClick={() => setQuantities((current) => ({ ...current, [item.id]: 0 }))}>&times;</button>
                  </li>)}</ul>
                  <strong>Food total: P{preorderTotal.toFixed(2)}</strong>
                  <p>Payment at the cafe</p>
                </div>
              </>
            )}
          </fieldset>
          {reservationError && <p className="checkout-error" role="alert">{reservationError}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={savingReservation}>
            {savingReservation ? 'Saving Reservation...' : 'Submit Reservation'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Reservation;
