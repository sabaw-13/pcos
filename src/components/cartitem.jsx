import React from 'react';
import CategoryIcon from './categoryicon';

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const labelToType = (label) => {
    const value = String(label || '').toLowerCase();

    if (value.includes('drink')) return 'drinks';
    if (value.includes('burger') || value.includes('sandwich')) return 'burger-sandwiches';
    if (value.includes('rice')) return 'rice-bowls';
    if (value.includes('all')) return 'all';

    return null;
  };

  const iconType = labelToType(item.image);

  const TrashIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7H19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 7V5H15V7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 9L9 20H15L16 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 11V17M13 11V17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {iconType ? (
          <span className="item-emoji item-icon" aria-label={`${item.image} icon`}>
            <CategoryIcon type={iconType} />
          </span>
        ) : (
          <span className="item-emoji">{item.image}</span>
        )}
      </div>

      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.name}</h3>
        <p className="cart-item-description">{item.description}</p>
      </div>

      <div className="cart-item-quantity">
        <button onClick={() => handleQuantityChange(item.quantity - 1)} className="qty-btn">
          -
        </button>
        <span className="qty-value">{item.quantity}</span>
        <button onClick={() => handleQuantityChange(item.quantity + 1)} className="qty-btn">
          +
        </button>
      </div>

      <div className="cart-item-price">
        <span className="item-total">P{(item.price * item.quantity).toFixed(2)}</span>
        <span className="item-unit">P{item.price.toFixed(2)} each</span>
      </div>

      <button onClick={() => onRemove(item)} className="btn-remove" aria-label={`Remove ${item.name}`}>
        <TrashIcon />
      </button>
    </div>
  );
};

export default CartItem;
