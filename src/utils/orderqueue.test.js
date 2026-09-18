import { getQueueStatus } from './orderqueue';

const reservation = {
  service: 'Online Reservation', reservation: { orderingMode: 'preorder' },
  preorderItems: [{ name: 'Nachos', quantity: 1 }], status: 'Waiting'
};

test.each(['Waiting', 'Arrived'])('accepted food stays queued when reservation is %s', (status) => {
  expect(getQueueStatus({ ...reservation, status })).toBe('Received');
});

test.each(['Pending', 'Cancelled'])('%s reservations do not enter the food queue', (status) => {
  expect(getQueueStatus({ ...reservation, status })).toBeNull();
});

test('arrival cancellation removes food from the queue', () => {
  expect(getQueueStatus({ ...reservation, reservationArrivalStatus: 'Cancelled' })).toBeNull();
});

test('food status persists independently of arrival', () => {
  expect(getQueueStatus({ ...reservation, status: 'Arrived', preorderStatus: 'Preparing' })).toBe('Preparing');
});

test('ordinary orders retain their existing workflow', () => {
  expect(getQueueStatus({ service: 'Online Delivery', status: 'Delivering' })).toBe('Delivering');
  expect(getQueueStatus({ service: 'Walk In', status: 'Received' })).toBe('Received');
});
