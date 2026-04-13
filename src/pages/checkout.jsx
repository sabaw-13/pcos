import React, { useContext, useState } from 'react';
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
    city: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    paymentMethod: 'card'
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [orderError, setOrderError] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const deliveryFields = ['name', 'email', 'phone', 'address', 'city', 'zipCode'];
  const paymentFields = formData.paymentMethod === 'card' ? ['cardNumber', 'cardExpiry', 'cardCVC'] : [];

  const filledDeliveryFields = deliveryFields.filter((field) => formData[field].trim() !== '').length;
  const filledPaymentFields = paymentFields.filter((field) => formData[field].trim() !== '').length;

  const deliveryProgress = filledDeliveryFields / deliveryFields.length;
  const paymentProgress =
    paymentFields.length > 0 ? filledPaymentFields / paymentFields.length : 1;

  let progressPercent = 0;
  if (currentStep === 1) {
    progressPercent = deliveryProgress * 50;
  } else if (currentStep === 2) {
    progressPercent = 50 + paymentProgress * 50;
  } else {
    progressPercent = 100;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!currentUser || isAdmin) {
      setOrderError('Please log in with a customer account before placing a delivery order.');
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
          street: formData.address,
          city: formData.city,
          zipCode: formData.zipCode
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
        <p className="page-step-label">Step 3 of 3</p>
        <h1>Checkout</h1>
        <p>Complete delivery details, payment, and review.</p>
      </div>

      <div className="checkout-layout">
        <div className="progress-steps">
          <div className="progress-line" aria-hidden="true">
            <div className="progress-line-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          {[1, 2, 3].map(step => (
            <div
              key={step}
              className={`progress-step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
            >
              <div className="step-circle">{step < currentStep ? '✓' : step}</div>
              <div className="step-label">
                {step === 1 ? 'Delivery' : step === 2 ? 'Payment' : 'Review'}
              </div>
            </div>
          ))}
        </div>

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
                  />
                </div>
                <div className="form-row-2">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </form>
            </CheckoutStep>
          )}

          {currentStep === 2 && (
            <CheckoutStep title="Payment Information">
              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                  />
                  <span className="method-label">💳 Credit Card</span>
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleInputChange}
                  />
                  <span className="method-label">🅿️ PayPal</span>
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="apple"
                    checked={formData.paymentMethod === 'apple'}
                    onChange={handleInputChange}
                  />
                  <span className="method-label">🍎 Apple Pay</span>
                </label>
              </div>

              {formData.paymentMethod === 'card' && (
                <form className="form-group">
                  <div className="form-row">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      maxLength="16"
                    />
                  </div>
                  <div className="form-row-2">
                    <input
                      type="text"
                      name="cardExpiry"
                      placeholder="MM/YY"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                    <input
                      type="text"
                      name="cardCVC"
                      placeholder="CVC"
                      value={formData.cardCVC}
                      onChange={handleInputChange}
                      className="form-input"
                      maxLength="3"
                    />
                  </div>
                </form>
              )}
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
                    <span>Tax</span>
                    <span>P{tax.toFixed(2)}</span>
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
                  <p>{formData.city}, {formData.zipCode}</p>
                  <p className="contact">{formData.phone}</p>
                </div>
              </div>
            </CheckoutStep>
          )}

          <div className="checkout-buttons">
            {currentStep > 1 && (
              <button onClick={handlePreviousStep} className="btn btn-secondary">
                Previous
              </button>
            )}

            {currentStep < 3 ? (
              <button onClick={handleNextStep} className="btn btn-primary">
                Continue
              </button>
            ) : (
              <button
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
              <span>Tax:</span>
              <span>P{tax.toFixed(2)}</span>
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
