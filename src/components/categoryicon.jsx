import React from 'react';

const normalizeType = (type) => {
  const value = String(type || '').toLowerCase();

  if (value === 'all' || value === 'all items') {
    return 'all';
  }
  if (value === 'drinks' || value === 'drink') {
    return 'drinks';
  }
  if (value === 'burger-sandwiches' || value === 'burger' || value === 'sandwich') {
    return 'burger-sandwiches';
  }
  if (value === 'rice-bowls' || value === 'rice' || value === 'rice bowl') {
    return 'rice-bowls';
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

  if (normalized === 'burger-sandwiches') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11C4 8 7 6 12 6C17 6 20 8 20 11H4Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 14H20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 17H19C19 18.7 17.7 20 16 20H8C6.3 20 5 18.7 5 17Z" fill="none" stroke="currentColor" strokeWidth="2" />
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
