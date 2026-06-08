import { onValue, push, ref, remove, serverTimestamp, set, update } from 'firebase/database';
import { database } from './firebase';

const shouldResetReservationTracking = (status) =>
  ['Arrived', 'Completed', 'Cancelled'].includes(status);

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
  }).then(() => orderRef.key);
};

export const updateOrderStatus = (orderId, status) =>
  update(ref(database, `orders/${orderId}`), {
    status,
    ...(shouldResetReservationTracking(status)
      ? {
          locationSharingEnabled: false,
          locationConsent: false,
          latestReservationLocation: null
        }
      : {}),
    updatedAt: serverTimestamp()
  });

export const updateReservationArrivalStatus = (orderId, reservationArrivalStatus) =>
  update(ref(database, `orders/${orderId}`), {
    reservationArrivalStatus,
    ...(reservationArrivalStatus === 'Cancelled'
      ? {
          locationSharingEnabled: false,
          locationConsent: false,
          latestReservationLocation: null
        }
      : {}),
    updatedAt: serverTimestamp()
  });

export const updateReservationLocation = (orderId, location) =>
  update(ref(database, `orders/${orderId}`), {
    locationSharingEnabled: true,
    locationConsent: Boolean(location.consentStatus ?? true),
    ...(location.reservationArrivalStatus
      ? { reservationArrivalStatus: location.reservationArrivalStatus }
      : {}),
    latestReservationLocation: location,
    updatedAt: serverTimestamp()
  });

export const deleteOrder = (orderId) => remove(ref(database, `orders/${orderId}`));
