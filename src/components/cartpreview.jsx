import React from 'react';
import { Link } from 'react-router-dom';
import CartIcon from './carticon';

const CartPreview = ({ cartTotal, itemCount }) => {
  if (itemCount === 0) {
    return (
      <div className="cart-preview">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <small>Add items to get started</small>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-preview">
      <div className="cart-preview-header">
        <h3>Order Summary</h3>
        <span className="item-badge">{itemCount}</span>
      </div>

      <div className="cart-preview-total">
        <span>Total:</span>
        <span className="total-price">P{cartTotal.toFixed(2)}</span>
      </div>

      <Link to="/cart" className="btn btn-primary btn-full">
        <CartIcon className="btn-inline-icon" />
        View Cart
      </Link>
    </div>
  );
};

export default CartPreview;
