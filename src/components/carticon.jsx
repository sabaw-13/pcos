import React from 'react';

const CartIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d="M3 4H5L7.2 14H18.6L21 7H8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9.5" cy="19" r="1.8" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.5" cy="19" r="1.8" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default CartIcon;
