import { onValue, push, ref, serverTimestamp, set, update } from 'firebase/database';
import { database } from './firebase';

const toList = (snapshot) => {
  const value = snapshot.val() || {};

  return Object.entries(value)
    .map(([firebaseId, item]) => ({
      ...item,
      firebaseId,
      id: item.id || firebaseId
    }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
};

export const subscribeMenuItems = (onItems, onError) =>
  onValue(ref(database, 'menuItems'), (snapshot) => onItems(toList(snapshot)), onError);

export const addMenuItem = (item) => {
  const itemRef = push(ref(database, 'menuItems'));

  return set(itemRef, {
    ...item,
    id: itemRef.key,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const subscribeOrders = (onOrders, onError) =>
  onValue(ref(database, 'orders'), (snapshot) => onOrders(toList(snapshot)), onError);

export const addOrder = (order) => {
  const orderRef = push(ref(database, 'orders'));

  return set(orderRef, {
    ...order,
    id: orderRef.key,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateOrderStatus = (orderId, status) =>
  update(ref(database, `orders/${orderId}`), {
    status,
    updatedAt: serverTimestamp()
  });
