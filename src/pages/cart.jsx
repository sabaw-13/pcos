import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/cartcontext';
import CartItem from '../components/cartitem';
import CartIcon from '../components/carticon';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h1>Your Cart is Empty</h1>
          <p>Add some delicious items to get started!</p>
          <Link to="/menu" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1 className="cart-title">
          <CartIcon className="cart-title-icon" />
          Shopping Cart
        </h1>
        <button onClick={clearCart} className="clear-cart-btn">
          Clear All
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items-section">
          <div className="cart-items-list">
            {cart.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="amount">P{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8%)</span>
              <span className="amount">P{tax.toFixed(2)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="amount">P{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="summary-info">
            <div className="info-item">
              <span className="info-icon">📦</span>
              <span>Estimated delivery in 15-20 minutes</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🚚</span>
              <span>Free pickup at our location</span>
            </div>
          </div>

          <Link to="/checkout" className="btn btn-primary btn-full">
            Proceed to Checkout
          </Link>

          <Link to="/menu" className="btn btn-secondary btn-full">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
