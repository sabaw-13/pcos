import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Reservation from './reservation';
import { addOrder, subscribeMenuItems, subscribeOrders } from '../services/database';

jest.mock('../utils/deposit', () => {
  process.env.REACT_APP_RESERVATION_FEE = '100';
  return jest.requireActual('../utils/deposit');
});

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>
}), { virtual: true });
jest.mock('../context/authcontext', () => {
  const currentUser = { uid: 'customer-1', email: 'customer@example.com' };
  return { useAuth: () => ({ currentUser, isAdmin: false }) };
});
jest.mock('../context/confirmcontext', () => ({ useConfirm: () => ({ confirm: jest.fn() }) }));
jest.mock('../services/database', () => ({
  addOrder: jest.fn(), subscribeOrders: jest.fn(), subscribeMenuItems: jest.fn(), updateReservationLocation: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
  subscribeOrders.mockImplementation((callback) => { callback([]); return jest.fn(); });
  subscribeMenuItems.mockImplementation((callback) => { callback([]); return jest.fn(); });
  addOrder.mockResolvedValue('reservation-1');
});

const submit = () => {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Customer' } });
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'customer@example.com' } });
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '09123456789' } });
  fireEvent.change(screen.getByLabelText('Reservation date'), { target: { value: '2026-12-20' } });
  fireEvent.change(screen.getByLabelText('Arrival time'), { target: { value: '12:00' } });
  const reference = screen.queryByLabelText('GCash reference number');
  if (reference) fireEvent.change(reference, { target: { value: '1234567890123' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Submit Reservation' }).closest('form'));
};

test('saves a table-only reservation without previously selected food', async () => {
  render(<Reservation />);
  fireEvent.click(screen.getByLabelText('Pre-order from the menu'));
  fireEvent.change(screen.getByLabelText('Quantity for Vegetable Cheezy Nachos'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Vegetable Cheezy Nachos' }));
  fireEvent.click(screen.getByLabelText('Order at the cafe'));
  submit();
  await waitFor(() => expect(addOrder).toHaveBeenCalledWith(expect.objectContaining({
    total: 100, payment: expect.objectContaining({ type: 'reservation-fee', depositAmount: 100, remainingBalance: 0 }), preorderItems: [], reservation: expect.objectContaining({ orderingMode: 'at-cafe' })
  })));
  expect(addOrder.mock.calls[0][0].items).not.toEqual(expect.arrayContaining([expect.stringContaining('Nachos')]));
});

test('saves menu quantities and the food total and displays confirmation', async () => {
  render(<Reservation />);
  fireEvent.click(screen.getByLabelText('Pre-order from the menu'));
  fireEvent.change(screen.getByLabelText('Quantity for Vegetable Cheezy Nachos'), { target: { value: '2' } });
  expect(screen.getByText('Food total: P0.00')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add Vegetable Cheezy Nachos' }));
  expect(screen.getByText('Food total: P270.00')).toBeInTheDocument();
  submit();
  await screen.findByText('Reservation request sent');
  expect(addOrder).toHaveBeenCalledWith(expect.objectContaining({
    total: 270, paymentMethod: 'gcash',
    payment: expect.objectContaining({ depositAmount: 135, remainingBalance: 135, status: 'pending-verification' }),
    preorderItems: [expect.objectContaining({ name: 'Vegetable Cheezy Nachos', quantity: 2, price: 135 })],
    reservation: expect.objectContaining({ orderingMode: 'preorder' })
  }));
  expect(screen.getByText('Food total: P270.00')).toBeInTheDocument();
});

test('requires a menu selection for a pre-order', () => {
  render(<Reservation />);
  fireEvent.click(screen.getByLabelText('Pre-order from the menu'));
  submit();
  expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one menu item');
  expect(addOrder).not.toHaveBeenCalled();
});

test('retains the selection when saving fails so the customer can retry', async () => {
  addOrder.mockRejectedValueOnce(new Error('offline'));
  render(<Reservation />);
  fireEvent.click(screen.getByLabelText('Pre-order from the menu'));
  fireEvent.change(screen.getByLabelText('Quantity for Vegetable Cheezy Nachos'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Vegetable Cheezy Nachos' }));
  submit();
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save');
  expect(screen.getByText('Food total: P135.00')).toBeInTheDocument();
  submit();
  await screen.findByText('Reservation request sent');
  expect(addOrder).toHaveBeenCalledTimes(2);
});

test('steps quantities, limits additions to stock, and removes selected food', () => {
  render(<Reservation />);
  fireEvent.click(screen.getByLabelText('Pre-order from the menu'));
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity for Vegetable Cheezy Nachos' }));
  expect(screen.getByLabelText('Quantity for Vegetable Cheezy Nachos')).toHaveValue(2);
  fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity for Vegetable Cheezy Nachos' }));
  expect(screen.getByLabelText('Quantity for Vegetable Cheezy Nachos')).toHaveValue(1);
  fireEvent.change(screen.getByLabelText('Quantity for Vegetable Cheezy Nachos'), { target: { value: '100' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Vegetable Cheezy Nachos' }));
  expect(screen.getByText('Food total: P2700.00')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Vegetable Cheezy Nachos' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Remove Vegetable Cheezy Nachos' }));
  expect(screen.getByText('Food total: P0.00')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Vegetable Cheezy Nachos' })).toBeEnabled();
});
