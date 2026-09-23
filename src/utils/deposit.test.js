import { createDepositPayment, getDepositAmounts } from './deposit';

test('uses a 100 peso reservation fee when no environment override is set', () => {
  const previousFee = process.env.REACT_APP_RESERVATION_FEE;
  delete process.env.REACT_APP_RESERVATION_FEE;
  try {
    jest.isolateModules(() => {
      const { createReservationFeePayment } = require('./deposit');
      expect(createReservationFeePayment('1234567890123')).toMatchObject({
        type: 'reservation-fee', depositAmount: 100, remainingBalance: 0, status: 'pending-verification'
      });
    });
  } finally {
    if (previousFee === undefined) delete process.env.REACT_APP_RESERVATION_FEE;
    else process.env.REACT_APP_RESERVATION_FEE = previousFee;
  }
});

test('splits totals in pesos without losing a cent', () => {
  expect(getDepositAmounts(270)).toEqual({ depositAmount: 135, remainingBalance: 135 });
  expect(getDepositAmounts(135.01)).toEqual({ depositAmount: 67.51, remainingBalance: 67.5 });
});

test.each([0, -1, NaN, Infinity])('rejects invalid total %s', (total) => {
  expect(() => getDepositAmounts(total)).toThrow();
});

test('requires a reference and never treats submission as verified payment', () => {
  expect(() => createDepositPayment(100, ' ')).toThrow();
  expect(createDepositPayment(100, ' 1234567890123 ')).toMatchObject({
    referenceNumber: '1234567890123', status: 'pending-verification', depositAmount: 50, remainingBalance: 50
  });
});
