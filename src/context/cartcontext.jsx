import React, { createContext, useEffect, useState } from 'react';

export const CartContext = createContext();

const CART_STORAGE_KEY = 'persimmonay-cart';

const getStoredCart = () => {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart);

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(getStoredCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, quantity = 1) => {
    const quantityToAdd = Math.max(1, Number(quantity) || 1);

    setCart((currentCart) => {
      const existingItem = currentCart.find(cartItem => cartItem.id === item.id);

      if (!existingItem) {
        return [...currentCart, { ...item, quantity: quantityToAdd }];
      }

      return currentCart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
          : cartItem
      );
    });
  };

  const removeFromCart = (itemId) => {
    setCart((currentCart) => currentCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart((currentCart) => currentCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
