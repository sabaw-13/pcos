import React, { useContext, useMemo, useState } from 'react';
import { CartContext } from '../context/cartcontext';
import CategoryIcon from './categoryicon';

const ProductCard = ({ item }) => {
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);

  const resolveType = (value) => {
    const label = String(value || '').toLowerCase();

    if (label.includes('drink')) return 'drinks';
    if (label.includes('appetizer')) return 'appetizers';
    if (label.includes('ramen')) return 'ramen';
    if (label.includes('burger') || label.includes('sandwich')) return 'burger-sandwiches';
    if (label.includes('rice')) return 'rice-bowls';
    if (label.includes('add-on')) return 'add-ons';
    if (label.includes('short order')) return 'short-orders';

    return 'all';
  };

  const iconType = useMemo(() => resolveType(item.image || item.category), [item.image, item.category]);

  const detailSummary = useMemo(() => {
    if (item.category === 'drinks') {
      return 'Smooth, refreshing, and best served chilled.';
    }
    if (item.category === 'appetizers') {
      return 'Snackable starters made for sharing or pairing with drinks.';
    }
    if (item.category === 'ramen-regular' || item.category === 'ramen-special') {
      return 'Warm ramen bowls with rich broth and satisfying toppings.';
    }
    if (item.category === 'burger-sandwiches') {
      return 'Made to order with rich sauces and hearty fillings.';
    }
    if (item.category === 'rice-bowls') {
      return 'Comfort meals served hot with savory flavors.';
    }
    if (item.category === 'add-ons') {
      return 'Simple extras to complete your meal.';
    }
    if (item.category === 'short-orders') {
      return 'Savory cafe plates cooked for bigger cravings.';
    }
    return 'Freshly prepared with quality ingredients.';
  }, [item.category]);

  const handleQuantityChange = (event) => {
    const nextQuantity = Number(event.target.value);
    setQuantity(Number.isNaN(nextQuantity) ? 1 : Math.max(1, nextQuantity));
  };

  const handleQuantityStep = (change) => {
    setQuantity((current) => Math.max(1, current + change));
  };

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setQuantity(1);
  };

  const PlusIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5V19M5 12H19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );

  const StarIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.8L14.55 8.96L20.25 9.79L16.13 13.81L17.1 19.49L12 16.81L6.9 19.49L7.87 13.81L3.75 9.79L9.45 8.96L12 3.8Z"
        fill="currentColor"
      />
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
        {item.popular && (
          <div className="popular-badge popular-icon-badge" aria-label="Popular item" title="Popular">
            <StarIcon />
          </div>
        )}
      </div>

      <div className="product-card-content">
        <h3 className="product-card-name">{item.name}</h3>
        <p className="product-card-description">{item.description}</p>
        <p className="product-card-meta">{detailSummary}</p>

        <div className="product-card-footer">
          <span className="product-card-price">P{item.price.toFixed(2)}</span>
          <div className="product-card-actions">
            <div className="product-quantity-selector" aria-label={`${item.name} quantity`}>
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
            <button type="button" onClick={handleAddToCart} className="btn-add-to-cart">
              <PlusIcon />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
