import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { CartContext } from '../context/cartcontext';
import CheckoutStep from '../components/checkoutstep';
import { addOrder } from '../services/database';

const Checkout = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { cart, clearCart } = useContext(CartContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'gcash'
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [orderError, setOrderError] = useState('');
  const [deliveryError, setDeliveryError] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    if (!currentUser || isAdmin) {
      return;
    }

    setFormData((current) => ({
      ...current,
      name: current.name || currentUser.displayName || '',
      email: current.email || currentUser.email || ''
    }));
  }, [currentUser, isAdmin]);

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;

  const deliveryFields = ['name', 'email', 'phone', 'address'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (deliveryFields.includes(name)) {
      setDeliveryError('');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const missingDeliveryFields = deliveryFields.filter((field) => formData[field].trim() === '');

      if (missingDeliveryFields.length > 0) {
        setDeliveryError('Please fill up all delivery information fields before continuing.');
        return;
      }
    }

    if (currentStep < 3) {
      setDeliveryError('');
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancelCheckout = () => {
    navigate('/cart');
  };

  const handlePlaceOrder = async () => {
    if (!currentUser || isAdmin) {
      setOrderError('Please log in with a customer account before placing a delivery order.');
      return;
    }

    const missingDeliveryFields = deliveryFields.filter((field) => formData[field].trim() === '');

    if (missingDeliveryFields.length > 0) {
      setCurrentStep(1);
      setDeliveryError('Please fill up all delivery information fields before placing your order.');
      return;
    }

    const orderNumber = `#DL-${Date.now().toString().slice(-6)}`;

    try {
      setSavingOrder(true);
      await addOrder({
        orderNumber,
        customer: formData.name,
        service: 'Online Delivery',
        items: cart.map((item) => `${item.name} x ${item.quantity}`),
        total,
        status: 'Waiting',
        customerId: currentUser.uid,
        contact: {
          email: formData.email || currentUser.email,
          phone: formData.phone
        },
        deliveryAddress: {
          street: formData.address
        },
        paymentMethod: formData.paymentMethod
      });
      setPlacedOrderNumber(orderNumber);
      setOrderPlaced(true);
      setOrderError('');
      setTimeout(() => {
        clearCart();
        navigate('/order-history');
      }, 2000);
    } catch (error) {
      setOrderError('Unable to save this delivery order to Firebase.');
    } finally {
      setSavingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-container">
        <div className="success-screen">
          <div className="success-animation">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your online delivery order has been confirmed and will be prepared soon.</p>
          <div className="order-number">{placedOrderNumber}</div>
          <p className="delivery-time">Estimated delivery prep: 15-20 minutes</p>
        </div>
      </div>
    );
  }

  if (!currentUser || isAdmin) {
    return (
      <div className="checkout-container">
        <div className="success-screen">
          <h1>Customer login required</h1>
          <p>Delivery checkout is only available for customer accounts.</p>
          <Link to="/login" className="btn btn-primary">
            Open Customer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        <div className="checkout-content">
          {currentStep === 1 && (
            <CheckoutStep title="Delivery Information">
              <form className="form-group">
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
                <div className="form-row">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-row">
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
                <div className="form-row">
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </form>
              {deliveryError && <p className="checkout-error">{deliveryError}</p>}
            </CheckoutStep>
          )}

          {currentStep === 2 && (
            <CheckoutStep title="Payment Information">
              <div className="payment-methods">
                <label className="payment-method active">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="gcash"
                    checked
                    readOnly
                  />
                  <span className="method-label">GCash</span>
                </label>
              </div>
            </CheckoutStep>
          )}

          {currentStep === 3 && (
            <CheckoutStep title="Review Your Order">
              <div className="review-section">
                <h3>Order Items</h3>
                <div className="review-items">
                  {cart.map(item => (
                    <div key={item.id} className="review-item">
                      <span>{item.name} x {item.quantity}</span>
                      <span>P{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="review-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>P{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery fee</span>
                    <span>P{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>P{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="review-details">
                  <h3>Delivery Details</h3>
                  <p><strong>{formData.name}</strong></p>
                  <p>{formData.address}</p>
                  <p className="contact">{formData.phone}</p>
                </div>
              </div>
            </CheckoutStep>
          )}

          <div className="checkout-buttons">
            <button type="button" onClick={handleCancelCheckout} className="btn btn-secondary">
              Cancel
            </button>

            {currentStep > 1 && (
              <button type="button" onClick={handlePreviousStep} className="btn btn-secondary">
                Previous
              </button>
            )}

            {currentStep < 3 ? (
              <button type="button" onClick={handleNextStep} className="btn btn-primary">
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="btn btn-primary btn-success"
                disabled={savingOrder}
              >
                {savingOrder ? 'Saving Order...' : 'Place Order'}
              </button>
            )}
          </div>
          {orderError && <p className="checkout-error">{orderError}</p>}
        </div>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id} className="summary-item">
                <span>{item.name}</span>
                <span className="qty">x{item.quantity}</span>
                <span className="price">P{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-total-box">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>P{subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Delivery fee:</span>
              <span>P{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>P{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
