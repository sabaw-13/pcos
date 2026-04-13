import React, { useContext, useMemo } from 'react';
import { CartContext } from '../context/cartcontext';
import CategoryIcon from './categoryicon';

const ProductCard = ({ item }) => {
  const { addToCart } = useContext(CartContext);

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

  const handleAddToCart = () => {
    addToCart(item);
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
          <button type="button" onClick={handleAddToCart} className="btn-add-to-cart">
            <PlusIcon />
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
