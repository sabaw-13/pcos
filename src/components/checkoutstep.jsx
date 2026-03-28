import React from 'react';

const CheckoutStep = ({ title, children }) => {
  return (
    <div className="checkout-step">
      <h2 className="step-title">{title}</h2>
      <div className="step-content">
        {children}
      </div>
    </div>
  );
};

export default CheckoutStep;