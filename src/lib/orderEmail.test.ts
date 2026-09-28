import { describe, expect, test } from 'vitest';
import {
  buildOwnerNotification,
  buildPayNowBuyerNotification,
  buildPayNowOwnerNotification,
  getOrderEmailConfig,
} from './orderEmail';

describe('getOrderEmailConfig', () => {
  test('returns null when any variable is missing', () => {
    expect(getOrderEmailConfig({})).toBeNull();
    expect(
      getOrderEmailConfig({
        RESEND_API_KEY: 'k',
        SHOP_EMAIL_FROM: 'shop@example.com',
      })
    ).toBeNull();
  });

  test('returns the config when fully set', () => {
    expect(
      getOrderEmailConfig({
        RESEND_API_KEY: 'k',
        SHOP_EMAIL_FROM: 'shop@example.com',
        SHOP_ORDER_EMAIL: 'owner@example.com',
      })
    ).toEqual({
      apiKey: 'k',
      from: 'shop@example.com',
      ownerEmail: 'owner@example.com',
    });
  });
});

describe('buildOwnerNotification', () => {
  test('includes order essentials in subject and body', () => {
    const { subject, text } = buildOwnerNotification({
      referenceNumber: 'SHP-abc123',
      paymentId: 'pay_123',
      amount: '2400.00',
      currency: 'sgd',
      purpose: 'MAG D Kurd 9 (mag-d-kurd-9)',
      customerEmail: 'buyer@example.com',
      customerName: 'Buyer Tan',
    });

    expect(subject).toContain('SHP-abc123');
    expect(subject).toContain('MAG D Kurd 9');
    expect(text).toContain('SGD 2400.00');
    expect(text).toContain('pay_123');
    expect(text).toContain('Buyer Tan');
    expect(text).toContain('buyer@example.com');
  });

  test('omits customer lines when the buyer left no details', () => {
    const { text } = buildOwnerNotification({
      referenceNumber: 'SHP-abc123',
      paymentId: 'pay_123',
      amount: '80.00',
      currency: 'sgd',
      purpose: 'SEW soft case',
    });

    expect(text).not.toContain('Customer:');
    expect(text).not.toContain('Customer email:');
  });
});

describe('buildPayNowOwnerNotification', () => {
  const order = {
    referenceNumber: 'SHP-abc123',
    amount: '$3,800.00',
    purpose: 'MAG D Kurd 10 (handpan-d-kurd-10)',
    customerEmail: 'buyer@example.com',
    customerName: 'Buyer Tan',
  };

  test('states plainly that the money is not confirmed', () => {
    // This mail fires when a buyer presses a button, not when money moves.
    // An owner who reads it as "paid" could ship a S$3,800 instrument for free.
    const { subject, text } = buildPayNowOwnerNotification(order);
    expect(text).toContain('NOT BEEN CONFIRMED');
    expect(subject).toContain('awaiting transfer');
    expect(subject).not.toMatch(/\bpaid\b/i);
  });

  test('carries what the owner needs to reconcile against the bank', () => {
    const { text } = buildPayNowOwnerNotification(order);
    expect(text).toContain('SHP-abc123');
    expect(text).toContain('$3,800.00');
    expect(text).toContain('buyer@example.com');
    expect(text).toContain('Buyer Tan');
  });

  test('omits the name line when the buyer gave none', () => {
    const { text } = buildPayNowOwnerNotification({
      ...order,
      customerName: undefined,
    });
    expect(text).not.toContain('Customer:');
    expect(text).toContain('Customer email:');
  });
});

describe('buildPayNowBuyerNotification', () => {
  test('gives the buyer the amount and the reference to quote', () => {
    const { subject, text } = buildPayNowBuyerNotification({
      referenceNumber: 'SHP-abc123',
      amount: '$3,800.00',
      purpose: 'MAG D Kurd 10',
      customerEmail: 'buyer@example.com',
    });
    expect(subject).toContain('SHP-abc123');
    expect(text).toContain('$3,800.00');
    expect(text).toContain('SHP-abc123');
    // Without the reference in the transfer, the owner cannot match it.
    expect(text).toMatch(/reference/i);
  });
});
