import React from 'react';

export default function DepositSummary({ payment }) {
  if (!payment?.depositRate && payment?.type !== 'reservation-fee') return null;
  return <div className="reservation-food-summary">
    <p><strong>{payment.type === 'reservation-fee' ? 'Reservation fee' : '50% deposit'}: P{Number(payment.depositAmount).toFixed(2)}</strong></p>
    <p>{payment.status === 'verified' ? 'Payment verified' : 'Payment awaiting staff verification'}</p>
    <p>Remaining balance after deposit: P{Number(payment.remainingBalance).toFixed(2)}</p>
  </div>;
}
