import { getReservationArrivalStatus, isReservationOrder } from './reservationarrival';

export const getReservationFoodStatus = (order) => {
  if (!isReservationOrder(order) || order.reservation?.orderingMode !== 'preorder' ||
      !Array.isArray(order.preorderItems) || order.preorderItems.length === 0 ||
      !['Waiting', 'Arrived', 'Completed'].includes(order.status) ||
      getReservationArrivalStatus(order) === 'Cancelled') {
    return null;
  }

  return order.preorderStatus || (order.status === 'Completed' ? 'Completed' : 'Received');
};

export const getQueueStatus = (order) =>
  isReservationOrder(order) ? getReservationFoodStatus(order) : order.status;
