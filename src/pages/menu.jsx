import React, { useEffect, useState, useContext } from 'react';
import { CartContext } from '../context/cartcontext';
import ProductCard from '../components/productcard';
import CartPreview from '../components/cartpreview';
import CategoryIcon from '../components/categoryicon';
import { baseMenuItems, menuCategories } from '../data/menudata';
import { subscribeMenuItems } from '../services/database';

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
  const { cart } = useContext(CartContext);

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

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const activeCategoryName =
    categories.find((category) => category.id === selectedCategory)?.name || 'All Items';

  return (
    <div className="menu-container">
      <div className="menu-header">
        <div className="menu-header-content">
          <div className="menu-flow-bar">
            <span className="menu-flow-step active">1. Browse</span>
            <span className="menu-flow-step">2. Cart</span>
            <span className="menu-flow-step">3. Checkout</span>
          </div>
          <h1 className="menu-title">Order Food and Drinks</h1>
          <p className="menu-description">
            Search the menu, add your items, then head to cart when you are ready.
          </p>
        </div>
      </div>

      <div className="menu-layout">
        <div className="menu-main">
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

          <div className="categories-container">
            <div className="categories-scroll">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                >
                  <span className="category-icon">
                    <CategoryIcon type={category.icon} />
                  </span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="items-header">
            <h2 className="items-count">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
            </h2>
            <div className="items-header-tags">
              <span className="active-category-tag">Showing: {activeCategoryName}</span>
              {menuError && <span className="active-category-tag">{menuError}</span>}
              {filteredItems.some((item) => item.popular) && selectedCategory === 'all' && (
                <span className="popular-badge">Includes Popular Items</span>
              )}
            </div>
          </div>

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

        <CartPreview cartTotal={cartTotal} itemCount={cart.length} />
      </div>
    </div>
  );
};

export default Menu;
