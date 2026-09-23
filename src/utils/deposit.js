export const CAFE_GCASH_NUMBER = process.env.REACT_APP_CAFE_GCASH_NUMBER || '09XX XXX XXXX';
export const CAFE_GCASH_QR_IMAGE = process.env.REACT_APP_CAFE_GCASH_QR_IMAGE || '/images/gcash-qr.svg';

export const getDepositAmounts = (total) => {
  const cents = Math.round(Number(total) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('A positive order total is required.');
  const depositCents = Math.ceil(cents / 2);
  return { depositAmount: depositCents / 100, remainingBalance: (cents - depositCents) / 100 };
};

export const createDepositPayment = (total, referenceNumber) => {
  if (!referenceNumber?.trim()) throw new Error('Enter your GCash reference number for the 50% deposit.');
  return {
    ...getDepositAmounts(total), method: 'gcash', gcashNumber: CAFE_GCASH_NUMBER,
    referenceNumber: referenceNumber.trim(), status: 'pending-verification', depositRate: 0.5
  };
};

export const RESERVATION_FEE = Number(process.env.REACT_APP_RESERVATION_FEE || 100);

export const createReservationFeePayment = (referenceNumber) => {
  if (!Number.isFinite(RESERVATION_FEE) || RESERVATION_FEE <= 0) throw new Error('The cafe must configure its reservation fee before table-only reservations can be submitted.');
  if (!referenceNumber?.trim()) throw new Error('Enter your GCash reference number for the reservation fee.');
  return { method: 'gcash', gcashNumber: CAFE_GCASH_NUMBER, referenceNumber: referenceNumber.trim(), status: 'pending-verification', type: 'reservation-fee', depositAmount: Math.round(RESERVATION_FEE * 100) / 100, remainingBalance: 0 };
};

export const requiresPaymentVerification = (order) => Boolean(order.payment?.depositRate || order.payment?.type === 'reservation-fee');
