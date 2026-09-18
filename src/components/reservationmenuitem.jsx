import React, { useState } from 'react';

const ReservationMenuItem = ({ item, selectedQuantity, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const remaining = Math.max(0, Number(item.stock ?? 20) - selectedQuantity);
  const amount = Math.min(quantity, Math.max(1, remaining));
  const changeQuantity = (value) => setQuantity(Math.max(1, Math.min(remaining, Math.floor(Number(value) || 1))));

  return (
    <div className="reservation-menu-row">
      <div>
        <strong>{item.name}</strong>
        <span>P{Number(item.price).toFixed(2)}{Number(item.stock ?? 20) <= 0 ? ' - Sold out' : ''}</span>
        {selectedQuantity > 0 && <small>{selectedQuantity} added</small>}
      </div>
      <div className="product-card-actions reservation-menu-actions">
        <div className="product-quantity-selector">
          <button type="button" aria-label={`Decrease quantity for ${item.name}`} disabled={amount <= 1 || remaining === 0} onClick={() => changeQuantity(amount - 1)}>-</button>
          <input type="number" min="1" max={Math.max(1, remaining)} step="1" aria-label={`Quantity for ${item.name}`} value={amount} disabled={remaining === 0} onChange={(event) => changeQuantity(event.target.value)} />
          <button type="button" aria-label={`Increase quantity for ${item.name}`} disabled={amount >= remaining} onClick={() => changeQuantity(amount + 1)}>+</button>
        </div>
        <button type="button" className="btn-add-to-cart" aria-label={`Add ${item.name}`} disabled={remaining === 0} onClick={() => { onAdd(amount); setQuantity(1); }}>
          <span aria-hidden="true">+</span> Add
        </button>
      </div>
    </div>
  );
};

export default ReservationMenuItem;
