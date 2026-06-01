import React, { useEffect, useState, useContext } from 'react';
import { CartContext } from '../context/cartcontext';
import ProductCard from '../components/productcard';
import CartPreview from '../components/cartpreview';
import { baseMenuItems, menuCategories } from '../data/menudata';
import { subscribeMenuItems } from '../services/database';

const DeliveryIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3 7.5H14V16.5H3V7.5ZM14 10H18L21 13V16.5H14V10ZM7.5 18.5A1.5 1.5 0 1 1 7.5 21.5A1.5 1.5 0 0 1 7.5 18.5ZM17.5 18.5A1.5 1.5 0 1 1 17.5 21.5A1.5 1.5 0 0 1 17.5 18.5Z"
      fill="currentColor"
    />
  </svg>
);

const WalkInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 4.25A2.25 2.25 0 1 1 12 8.75A2.25 2.25 0 0 1 12 4.25ZM10 10H14L16.5 19.5H14.25L12.9 14.75H11.1L9.75 19.5H7.5L10 10ZM7 11.25H9V14.25H7A2.25 2.25 0 0 1 4.75 12A2.25 2.25 0 0 1 7 9.75H8.5V11.25H7ZM15 11.25H17A2.25 2.25 0 0 0 19.25 9A2.25 2.25 0 0 0 17 6.75H15.5V8.25H17A.75.75 0 0 1 17 9.75H15V11.25Z"
      fill="currentColor"
    />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20L16.65 16.65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customMenuItems, setCustomMenuItems] = useState([]);
  const [menuError, setMenuError] = useState('');
  const { cart, orderMode, setOrderMode } = useContext(CartContext);

  const categories = menuCategories;
  const menuItems = [...baseMenuItems, ...customMenuItems];

  useEffect(() => {
    const unsubscribe = subscribeMenuItems(
      setCustomMenuItems,
      () => setMenuError('Unable to load staff-added menu items right now.')
    );

    return unsubscribe;
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (!orderMode) {
    return (
      <div className="menu-container">
        <div className="menu-header">
          <div className="menu-header-content customer-header-block menu-order-gate">
            <span className="menu-order-gate-kicker">Start Order</span>
            <h1 className="menu-title">Order</h1>
            <p className="menu-order-gate-note">
              Choose your order type first.
            </p>
            <div className="menu-order-choice-buttons">
              <button
                type="button"
                className="menu-order-choice-button"
                onClick={() => setOrderMode('delivery')}
              >
                <span className="menu-order-choice-icon">
                  <DeliveryIcon />
                </span>
                <span className="menu-order-choice-label">Delivery</span>
              </button>
              <button
                type="button"
                className="menu-order-choice-button"
                onClick={() => setOrderMode('walk-in')}
              >
                <span className="menu-order-choice-icon">
                  <WalkInIcon />
                </span>
                <span className="menu-order-choice-label">Walk In</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <div className="menu-header">
        <div className="menu-header-content customer-header-block">
          <div className="menu-order-header-row">
            <div>
              <h1 className="menu-title">Order Food and Drinks</h1>
              <p className="menu-order-mode-label">
                {orderMode === 'walk-in' ? 'Walk In order' : 'Delivery order'}
              </p>
            </div>
            <button
              type="button"
              className="btn menu-order-back-button"
              onClick={() => setOrderMode('')}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="menu-layout">
        <div className="menu-main">
          <div className="menu-controls">
            <select
              className="category-mobile-select"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              aria-label="Filter menu category"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">
                <SearchIcon />
              </span>
            </div>
          </div>

          {menuError && <p className="checkout-error">{menuError}</p>}

          {filteredItems.length > 0 ? (
            <div key={`grid-${selectedCategory}`} className="items-grid category-animate">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="menu-item-animate"
                  style={{ '--item-delay': `${idx * 55}ms` }}
                >
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div key={`empty-${selectedCategory}`} className="no-items category-animate">
              <div className="no-items-icon">No Match</div>
              <h3>No items found</h3>
              <p>Try adjusting your search or category filters</p>
            </div>
          )}
        </div>

        <CartPreview itemCount={cart.length} />
      </div>
    </div>
  );
};

export default Menu;
