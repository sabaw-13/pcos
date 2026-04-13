import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { addOrder } from '../services/database';

const Reservation = () => {
  const { currentUser, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser || isAdmin) {
      setReservationError('Please log in with a customer account before submitting a reservation.');
      return;
    }

    const orderNumber = `#RS-${Date.now().toString().slice(-6)}`;

    try {
      setSavingReservation(true);
      await addOrder({
        orderNumber,
        customer: formData.name,
        service: 'Online Reservation',
        items: [`Table for ${formData.guests}`, `${formData.date} ${formData.time}`],
        total: 0,
        status: 'Waiting',
        customerId: currentUser.uid,
        contact: {
          email: formData.email || currentUser.email,
          phone: formData.phone
        },
        reservation: {
          date: formData.date,
          time: formData.time,
          guests: Number(formData.guests),
          notes: formData.notes
        }
      });
      setReservationNumber(orderNumber);
      setReservationError('');
      setSubmitted(true);
    } catch (error) {
      setReservationError('Unable to save this reservation to Firebase.');
    } finally {
      setSavingReservation(false);
    }
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
          <button type="button" className="btn btn-primary" onClick={() => setSubmitted(false)}>
            Edit Reservation
          </button>
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

  return (
    <div className="reservation-page">
      <section className="reservation-panel">
        <div className="reservation-copy">
          <span className="service-eyebrow">Step 1 of 1</span>
          <h1>Online Reservation</h1>
          <p>
            Fill out the form and submit your table request in one step.
          </p>
        </div>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-row-2">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-row-2">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="form-input"
              required
            />
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-row">
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
          </div>
          <div className="form-row">
            <textarea
              name="notes"
              placeholder="Special request"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-input reservation-notes"
              rows="4"
            />
          </div>
          {reservationError && <p className="checkout-error">{reservationError}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={savingReservation}>
            {savingReservation ? 'Saving Reservation...' : 'Submit Reservation'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Reservation;
