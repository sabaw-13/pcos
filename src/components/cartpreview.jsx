import React from 'react';
import { Link } from 'react-router-dom';
import CartIcon from './carticon';

const CartPreview = ({ itemCount }) => {
  if (itemCount === 0) {
    return null;
  }

  return (
    <Link
      to="/cart"
      className="menu-mobile-cart-bar"
      aria-label={`View cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
    >
      <CartIcon className="menu-mobile-cart-icon" />
      <span className="menu-mobile-cart-badge">{itemCount}</span>
    </Link>
  );
};

export default CartPreview;
