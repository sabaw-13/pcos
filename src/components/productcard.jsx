import React, { useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CartContext } from '../context/cartcontext';
import CategoryIcon from './categoryicon';

const ProductCard = ({ item }) => {
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  const resolveType = (value) => {
    const label = String(value || '').toLowerCase();

    if (label.includes('drink')) return 'drinks';
    if (label.includes('burger') || label.includes('sandwich')) return 'burger-sandwiches';
    if (label.includes('rice')) return 'rice-bowls';

    return 'all';
  };

  const iconType = useMemo(() => resolveType(item.image || item.category), [item.image, item.category]);

  const detailSummary = useMemo(() => {
    if (item.category === 'drinks') {
      return 'Smooth, refreshing, and best served chilled.';
    }
    if (item.category === 'burger-sandwiches') {
      return 'Made to order with rich sauces and hearty fillings.';
    }
    if (item.category === 'rice-bowls') {
      return 'Comfort meals served hot with savory flavors.';
    }
    return 'Freshly prepared with quality ingredients.';
  }, [item.category]);

  const handleOpenQuantityModal = () => {
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const handleCloseQuantityModal = () => {
    setShowQuantityModal(false);
  };

  const handleQuantityChange = (event) => {
    const nextQuantity = Number(event.target.value);
    setQuantity(Number.isNaN(nextQuantity) ? 1 : Math.max(1, nextQuantity));
  };

  const handleQuantityStep = (change) => {
    setQuantity((current) => Math.max(1, current + change));
  };

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setShowQuantityModal(false);
  };

  const PlusIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5V19M5 12H19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="product-card-menu">
      <div className="product-card-image">
        <div className="menu-image-chip">
          <span className="menu-image-icon" aria-hidden="true">
            <CategoryIcon type={iconType} />
          </span>
          <span className="menu-image-label">{item.image}</span>
        </div>
        {item.popular && <div className="popular-badge">Popular</div>}
      </div>

      <div className="product-card-content">
        <h3 className="product-card-name">{item.name}</h3>
        <p className="product-card-description">{item.description}</p>
        <p className="product-card-meta">{detailSummary}</p>

        <div className="product-card-footer">
          <span className="product-card-price">P{item.price.toFixed(2)}</span>
          <button type="button" onClick={handleOpenQuantityModal} className="btn-add-to-cart">
            <PlusIcon />
            Add to cart
          </button>
        </div>
      </div>

      {showQuantityModal && createPortal(
        <div className="quantity-modal-overlay" role="presentation" onClick={handleCloseQuantityModal}>
          <div
            className="quantity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`quantity-modal-title-${item.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="quantity-modal-header">
              <span className="service-eyebrow">Select Quantity</span>
              <h2 id={`quantity-modal-title-${item.id}`}>{item.name}</h2>
              <p>P{item.price.toFixed(2)} each</p>
            </div>

            <div className="quantity-selector">
              <button type="button" onClick={() => handleQuantityStep(-1)} aria-label="Decrease quantity">
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                aria-label="Quantity"
              />
              <button type="button" onClick={() => handleQuantityStep(1)} aria-label="Increase quantity">
                +
              </button>
            </div>

            <div className="quantity-modal-total">
              <span>Total</span>
              <strong>P{(item.price * quantity).toFixed(2)}</strong>
            </div>

            <div className="quantity-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCloseQuantityModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddToCart}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductCard;
