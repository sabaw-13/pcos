import { runTransaction, set } from 'firebase/database';
import { addOrder, updateOrderStatus } from './database';

jest.mock('./firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  onValue: jest.fn(), push: () => ({ key: 'new-order' }), ref: jest.fn(), remove: jest.fn(),
  serverTimestamp: () => 123, set: jest.fn(() => Promise.resolve()), update: jest.fn(), runTransaction: jest.fn()
}));

beforeEach(() => set.mockResolvedValue(undefined));

test('submission cannot mark a delivery deposit verified', async () => {
  await addOrder({ service: 'Online Delivery', total: 301, status: 'Completed', payment: { referenceNumber: '123', status: 'verified', depositAmount: 1 } });
  expect(set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    status: 'Pending', payment: expect.objectContaining({ status: 'pending-verification', depositAmount: 150.5, remainingBalance: 150.5 })
  }));
});

test.each(['Waiting', 'Delivering', 'Completed'])('blocks unverified payment from moving to %s', async (status) => {
  runTransaction.mockImplementation(async (_, transform) => ({ committed: transform({ payment: { depositRate: 0.5, status: 'pending-verification' } }) !== undefined }));
  await expect(updateOrderStatus('order', status)).rejects.toThrow('Verify');
});

test('allows verified payments and preserves existing order fields', async () => {
  runTransaction.mockImplementation(async (_, transform) => {
    expect(transform({ total: 100, payment: { depositRate: 0.5, status: 'verified' } })).toMatchObject({ total: 100, status: 'Waiting' });
    return { committed: true };
  });
  await expect(updateOrderStatus('order', 'Waiting')).resolves.toBeUndefined();
});
