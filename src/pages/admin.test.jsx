import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Admin from './admin';
import { useSearchParams } from 'react-router-dom';
import { subscribeOrders, subscribeMenuItems, updateOrderStatus, updateReservationFoodStatus } from '../services/database';

jest.mock('react-router-dom', () => {
  return { Navigate: () => null, useSearchParams: jest.fn() };
}, { virtual: true });
jest.mock('../context/authcontext', () => ({
  useAuth: () => ({ authLoading: false, currentUser: { uid: 'admin' }, isAdmin: true })
}));
jest.mock('../context/confirmcontext', () => ({ useConfirm: () => ({ confirm: async () => true }) }));
jest.mock('../components/reservationroutemap', () => () => null);
jest.mock('../services/database', () => ({
  subscribeOrders: jest.fn(), subscribeMenuItems: jest.fn(), updateOrderStatus: jest.fn(),
  updateReservationFoodStatus: jest.fn()
}));

let order;
let publish;
beforeEach(() => {
  jest.clearAllMocks();
  useSearchParams.mockReturnValue([new URLSearchParams('tab=reservations')]);
  order = {
    id: 'reservation-1', firebaseId: 'reservation-1', orderNumber: '#RS-123', customer: 'Customer',
    service: 'Online Reservation', status: 'Pending', total: 270,
    reservation: { orderingMode: 'preorder', guests: 2 },
    preorderItems: [{ id: 1, name: 'Nachos', quantity: 2, price: 135 }], items: ['Nachos x 2']
  };
  subscribeOrders.mockImplementation((callback) => { publish = callback; callback([order]); return jest.fn(); });
  subscribeMenuItems.mockImplementation((callback) => { callback([]); return jest.fn(); });
  updateOrderStatus.mockImplementation(async (id, status) => { order = { ...order, status }; publish([order]); });
  updateReservationFoodStatus.mockImplementation(async (id, preorderStatus) => {
    order = { ...order, preorderStatus }; publish([order]);
  });
});

const openQueue = (rerender) => {
  useSearchParams.mockReturnValue([new URLSearchParams('tab=delivery-orders')]);
  rerender(<Admin />);
  fireEvent.click(screen.getByRole('tab', { name: /In Progress/i }));
};

test('accepting a pre-order enters the food queue and food completion preserves the reservation', async () => {
  const { rerender } = render(<Admin />);
  fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
  await waitFor(() => expect(updateOrderStatus).toHaveBeenCalledWith('reservation-1', 'Waiting'));
  openQueue(rerender);
  expect(screen.getByText('#RS-123')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Start Preparing' }));
  await waitFor(() => expect(updateReservationFoodStatus).toHaveBeenCalledWith('reservation-1', 'Preparing'));
  fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));
  await waitFor(() => expect(updateReservationFoodStatus).toHaveBeenCalledWith('reservation-1', 'Completed'));
  expect(order.status).toBe('Waiting');
  fireEvent.click(screen.getByRole('tab', { name: /Completed History/i }));
  expect(screen.getByText('#RS-123')).toBeInTheDocument();
});

test('pending pre-orders do not enter the food queue', () => {
  const { rerender } = render(<Admin />);
  openQueue(rerender);
  expect(screen.queryByText('#RS-123')).not.toBeInTheDocument();
});

test('dashboard date filters update sales and recent orders together', () => {
  useSearchParams.mockReturnValue([new URLSearchParams('tab=dashboard')]);
  const fixtures = [
    { id: '1', orderNumber: '#ONE', service: 'Online Delivery', status: 'Completed', total: 100, createdAt: new Date(2026, 8, 17, 12).getTime(), items: ['Tea x 1'] },
    { id: '2', orderNumber: '#TWO', service: 'Walk In', status: 'Completed', total: 200, createdAt: new Date(2026, 8, 18, 12).getTime(), items: ['Coffee x 2'] },
    { id: '3', orderNumber: '#THREE', service: 'Walk In', status: 'Preparing', total: 300, createdAt: new Date(2026, 8, 18, 13).getTime(), items: ['Coffee x 3'] }
  ];
  subscribeOrders.mockImplementation((callback) => { callback(fixtures); return jest.fn(); });
  render(<Admin />);
  const sales = () => within(screen.getByText('Sales', { exact: true }).closest('article'));
  fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-17' } });
  fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-09-17' } });
  expect(sales().getByText('P100.00')).toBeInTheDocument();
  expect(screen.queryByText('#TWO')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-09-18' } });
  expect(sales().getByText('P300.00')).toBeInTheDocument();
  expect(screen.getByText('#TWO')).toBeInTheDocument();
  expect(within(screen.getByText('Total Orders').closest('article')).getByText('3')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-09-01' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Choose valid dates');
});

test('accepting a table-only reservation does not create a food order', async () => {
  order.reservation.orderingMode = 'at-cafe';
  order.preorderItems = [];
  const { rerender } = render(<Admin />);
  fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
  await waitFor(() => expect(updateOrderStatus).toHaveBeenCalled());
  openQueue(rerender);
  expect(screen.queryByText('#RS-123')).not.toBeInTheDocument();
});
