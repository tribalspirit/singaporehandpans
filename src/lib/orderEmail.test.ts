import { describe, expect, test } from 'vitest';
import { buildOwnerNotification, getOrderEmailConfig } from './orderEmail';

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
