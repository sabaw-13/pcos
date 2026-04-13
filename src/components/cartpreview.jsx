import React from 'react';
import { Link } from 'react-router-dom';
import CartIcon from './carticon';

const CartPreview = ({ cartTotal, itemCount }) => {
  if (itemCount === 0) {
    return (
      <div className="cart-preview">
        <div className="empty-state">
          <div className="empty-icon">Cart</div>
          <p>Your cart is empty</p>
          <small>Add items from the menu to continue</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cart-preview">
        <div className="cart-preview-header">
          <h3>Cart Summary</h3>
          <span className="item-badge">{itemCount}</span>
        </div>

        <div className="cart-preview-total">
          <span>Total</span>
          <span className="total-price">P{cartTotal.toFixed(2)}</span>
        </div>

        <p className="cart-preview-note">Review your items before checkout.</p>

        <Link to="/cart" className="btn btn-primary btn-full">
          <CartIcon className="btn-inline-icon" />
          View Cart
        </Link>
      </div>

      <Link to="/cart" className="menu-mobile-cart-bar">
        <span className="menu-mobile-cart-copy">
          <strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong>
          <small>P{cartTotal.toFixed(2)}</small>
        </span>
        <span className="menu-mobile-cart-action">View Cart</span>
      </Link>
    </>
  );
};

export default CartPreview;
