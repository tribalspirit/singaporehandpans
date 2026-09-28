import { describe, expect, test } from 'vitest';
import {
  buildOwnerNotification,
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

describe('the PayNow owner notification is the only mail sent', () => {
  test('carries the signed payment link so the owner can forward it', () => {
    const { text } = buildPayNowOwnerNotification({
      referenceNumber: 'SHP-abc123',
      amount: '$3,800.00',
      purpose: 'MAG D Kurd 10',
      customerEmail: 'buyer@example.com',
      payUrl: 'https://example.com/shop/paynow/?slug=x&reference=y&t=z',
    });
    expect(text).toContain('https://example.com/shop/paynow/');
  });

  test('says the buyer was not emailed, so the owner knows to reply', () => {
    // Nothing is sent to the address submitted with the order: an endpoint
    // that mails a buyer-supplied address can be pointed at anybody, and the
    // studio's verified domain would be sending strangers unsolicited mail.
    const { text } = buildPayNowOwnerNotification({
      referenceNumber: 'SHP-abc123',
      amount: '$3,800.00',
      purpose: 'MAG D Kurd 10',
      customerEmail: 'buyer@example.com',
    });
    expect(text).toContain('NOT emailed');
  });
});
