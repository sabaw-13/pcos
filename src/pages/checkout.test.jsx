import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Checkout from './checkout';
import { CartContext } from '../context/cartcontext';
import { addOrder } from '../services/database';

jest.mock('react-router-dom', () => ({ Link: ({ children }) => <span>{children}</span>, useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../context/authcontext', () => {
  const currentUser = { uid: 'customer', displayName: 'Customer', email: 'customer@example.com' };
  return { useAuth: () => ({ currentUser, isAdmin: false }) };
});
jest.mock('../services/database', () => ({ addOrder: jest.fn() }));

test('delivery checkout requires a reference and saves half of the total including delivery', async () => {
  addOrder.mockResolvedValue('order');
  render(<CartContext.Provider value={{ cart: [{ id: 1, name: 'Coffee', price: 135, quantity: 2 }], clearCart: jest.fn() }}><Checkout /></CartContext.Provider>);
  expect(screen.getByText('Pay 50% now: P150.00')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '09123456789' } });
  fireEvent.change(screen.getByPlaceholderText('Street Address'), { target: { value: 'Test Street' } });
  fireEvent.click(screen.getByText('Continue'));
  fireEvent.click(screen.getByText('Continue'));
  expect(screen.getByText('Please enter your GCash reference number before reviewing your order.')).toBeInTheDocument();
  expect(addOrder).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('GCash reference number'), { target: { value: '1234567890123' } });
  fireEvent.click(screen.getByText('Continue'));
  fireEvent.click(screen.getByText('Place Order'));
  await waitFor(() => expect(addOrder).toHaveBeenCalledWith(expect.objectContaining({
    total: 300, status: 'Pending', payment: expect.objectContaining({ depositAmount: 150, remainingBalance: 150, status: 'pending-verification' })
  })));
});
