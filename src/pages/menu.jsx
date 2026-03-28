import React, { useState, useContext } from 'react';
import { CartContext } from '../context/cartcontext';
import ProductCard from '../components/productcard';
import CartPreview from '../components/cartpreview';
import CategoryIcon from '../components/categoryicon';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20L16.65 16.65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { cart } = useContext(CartContext);

  const categories = [
    { id: 'all', name: 'All Items', icon: 'all' },
    { id: 'drinks', name: 'Drinks', icon: 'drinks' },
    { id: 'burger-sandwiches', name: 'Burger & Sandwiches', icon: 'burger-sandwiches' },
    { id: 'rice-bowls', name: 'Rice Bowls', icon: 'rice-bowls' }
  ];

  const menuItems = [
    {
      id: 1,
      name: 'Strawberry Milkshake',
      price: 65,
      category: 'drinks',
      description: '16oz freshly blended strawberry milkshake',
      image: 'Drink',
      popular: true
    },
    {
      id: 2,
      name: 'Chocolate Milkshake',
      price: 65,
      category: 'drinks',
      description: '16oz rich chocolate milkshake',
      image: 'Drink'
    },
    {
      id: 3,
      name: 'Matcha Milkshake',
      price: 65,
      category: 'drinks',
      description: '16oz creamy matcha milkshake',
      image: 'Drink'
    },
    {
      id: 4,
      name: 'Chicken Sandwich',
      price: 130,
      category: 'burger-sandwiches',
      description: 'Crispy chicken sandwich with signature sauce',
      image: 'Burger',
      popular: true
    },
    {
      id: 5,
      name: 'PersiHotdog Sandwich',
      price: 115,
      category: 'burger-sandwiches',
      description: 'House-style hotdog sandwich',
      image: 'Burger'
    },
    {
      id: 6,
      name: 'Angus Cheese Burger',
      price: 180,
      category: 'burger-sandwiches',
      description: 'Juicy angus patty with melted cheese',
      image: 'Burger',
      popular: true
    },
    {
      id: 7,
      name: 'Hungarian Sausage',
      price: 150,
      category: 'rice-bowls',
      description: 'Savory hungarian sausage rice bowl',
      image: 'Rice'
    },
    {
      id: 8,
      name: 'Litson Kawali',
      price: 150,
      category: 'rice-bowls',
      description: 'Crispy pork belly over steamed rice',
      image: 'Rice'
    },
    {
      id: 9,
      name: 'Sisig Rice Bowl',
      price: 150,
      category: 'rice-bowls',
      description: 'Sizzling sisig served with rice',
      image: 'Rice',
      popular: true
    }
  ];

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
        <div className="menu-header-glow menu-header-glow-left"></div>
        <div className="menu-header-glow menu-header-glow-right"></div>
        <div className="menu-header-content">
          <div className="menu-badge">Freshly Prepared Daily</div>
          <h1 className="menu-title">Persimonay Menu</h1>
          <p className="menu-subtitle">Drinks, burger and sandwiches, and rice bowls</p>
          <p className="menu-description">
            Explore handcrafted favorites, made to order and served with our signature Persimonay
            flavor.
          </p>
          <div className="menu-header-logo-wrap">
            <img
              src="/images/plogo.jpg"
              alt="Persimonay Cafe logo"
              className="menu-header-logo"
            />
          </div>
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
