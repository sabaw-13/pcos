import React from 'react';

const normalizeType = (type) => {
  const value = String(type || '').toLowerCase();

  if (value === 'all' || value === 'all items') {
    return 'all';
  }
  if (value === 'drinks' || value === 'drink') {
    return 'drinks';
  }
  if (value === 'appetizers' || value === 'appetizer') {
    return 'appetizers';
  }
  if (value === 'ramen' || value === 'ramen-regular' || value === 'ramen-special') {
    return 'ramen';
  }
  if (value === 'burger-sandwiches' || value === 'burger' || value === 'sandwich') {
    return 'burger-sandwiches';
  }
  if (value === 'rice-bowls' || value === 'rice' || value === 'rice bowl') {
    return 'rice-bowls';
  }
  if (value === 'add-ons' || value === 'add-on') {
    return 'add-ons';
  }
  if (value === 'short-orders' || value === 'short order') {
    return 'short-orders';
  }

  return value;
};

const CategoryIcon = ({ type }) => {
  const normalized = normalizeType(type);

  if (normalized === 'all') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (normalized === 'drinks') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4H17L16 20H8L7 4Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M9 4V2H15V4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M11 10H13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized === 'appetizers') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10H20L18 19H6L4 10Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 10C8 7 10 5 12 5C14 5 16 7 16 10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M9 14H15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized === 'ramen') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12H20L18 20H6L4 12Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M7 8C8.5 6.5 10 6.5 11.5 8C13 9.5 14.5 9.5 16 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 12L6 5M16 12L18 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized === 'burger-sandwiches') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11C4 8 7 6 12 6C17 6 20 8 20 11H4Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 14H20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 17H19C19 18.7 17.7 20 16 20H8C6.3 20 5 18.7 5 17Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (normalized === 'add-ons') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5V19M5 12H19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10L7 19H17L20 10H4Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10C8 7.5 9.8 6 12 6C14.2 6 16 7.5 16 10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 14H14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default CategoryIcon;
