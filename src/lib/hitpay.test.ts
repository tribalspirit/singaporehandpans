import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
  buildPaymentRequestBody,
  computeWebhookSignature,
  getHitPayConfig,
  verifyWebhookSignature,
} from './hitpay';

const SALT = 'test-salt-123';

/** Independent reference implementation of HitPay's v1 signature. */
function referenceSignature(
  salt: string,
  payload: Record<string, string>
): string {
  const message = Object.keys(payload)
    .filter((key) => key !== 'hmac')
    .sort()
    .map((key) => `${key}${payload[key]}`)
    .join('');
  return createHmac('sha256', salt).update(message).digest('hex');
}

const SAMPLE_PAYLOAD: Record<string, string> = {
  payment_id: 'pay_123',
  payment_request_id: 'req_456',
  phone: '',
  amount: '2400.00',
  currency: 'SGD',
  status: 'completed',
  reference_number: 'SHP-abc123',
};

describe('computeWebhookSignature', () => {
  test('matches an independent HMAC-SHA256 implementation', async () => {
    const signature = await computeWebhookSignature(SALT, SAMPLE_PAYLOAD);
    expect(signature).toBe(referenceSignature(SALT, SAMPLE_PAYLOAD));
  });

  test('excludes the hmac field from the signed message', async () => {
    const withHmac = { ...SAMPLE_PAYLOAD, hmac: 'deadbeef' };
    expect(await computeWebhookSignature(SALT, withHmac)).toBe(
      await computeWebhookSignature(SALT, SAMPLE_PAYLOAD)
    );
  });
});

describe('verifyWebhookSignature', () => {
  test('accepts a correctly signed payload', async () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      hmac: referenceSignature(SALT, SAMPLE_PAYLOAD),
    };
    expect(await verifyWebhookSignature(SALT, payload)).toBe(true);
  });

  test('accepts key order variations (signature sorts keys)', async () => {
    const reordered: Record<string, string> = {};
    for (const key of Object.keys(SAMPLE_PAYLOAD).reverse()) {
      reordered[key] = SAMPLE_PAYLOAD[key];
    }
    reordered.hmac = referenceSignature(SALT, SAMPLE_PAYLOAD);
    expect(await verifyWebhookSignature(SALT, reordered)).toBe(true);
  });

  test('rejects a tampered payload', async () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      hmac: referenceSignature(SALT, SAMPLE_PAYLOAD),
      amount: '1.00',
    };
    expect(await verifyWebhookSignature(SALT, payload)).toBe(false);
  });

  test('rejects a payload signed with the wrong salt', async () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      hmac: referenceSignature('wrong-salt', SAMPLE_PAYLOAD),
    };
    expect(await verifyWebhookSignature(SALT, payload)).toBe(false);
  });

  test('rejects a payload with no hmac field', async () => {
    expect(await verifyWebhookSignature(SALT, SAMPLE_PAYLOAD)).toBe(false);
  });
});

describe('buildPaymentRequestBody', () => {
  const params = {
    amount: 2400,
    purpose: 'MAG D Kurd 9 (mag-d-kurd-9)',
    referenceNumber: 'SHP-abc123',
    redirectUrl: 'https://singaporehandpans.com/shop/thank-you/',
    webhookUrl: 'https://singaporehandpans.com/api/shop/hitpay-webhook',
  };

  test('formats the amount with two decimals and fixed SGD currency', () => {
    const body = buildPaymentRequestBody(params);
    expect(body.amount).toBe('2400.00');
    expect(body.currency).toBe('SGD');
    expect(body.send_email).toBe(true);
    expect(body.reference_number).toBe('SHP-abc123');
    expect(body.redirect_url).toBe(params.redirectUrl);
    expect(body.webhook).toBe(params.webhookUrl);
  });

  test('omits buyer fields when absent and includes them when present', () => {
    expect(buildPaymentRequestBody(params)).not.toHaveProperty('email');
    expect(buildPaymentRequestBody(params)).not.toHaveProperty('name');

    const withBuyer = buildPaymentRequestBody({
      ...params,
      email: 'buyer@example.com',
      name: 'Buyer',
    });
    expect(withBuyer.email).toBe('buyer@example.com');
    expect(withBuyer.name).toBe('Buyer');
  });
});

describe('getHitPayConfig', () => {
  test('returns null when any variable is missing', () => {
    expect(getHitPayConfig({})).toBeNull();
    expect(
      getHitPayConfig({ HITPAY_API_KEY: 'k', HITPAY_SALT: 's' })
    ).toBeNull();
  });

  test('strips a trailing slash from the API URL', () => {
    const config = getHitPayConfig({
      HITPAY_API_KEY: 'k',
      HITPAY_SALT: 's',
      HITPAY_API_URL: 'https://api.sandbox.hit-pay.com/',
    });
    expect(config).toEqual({
      apiKey: 'k',
      salt: 's',
      apiUrl: 'https://api.sandbox.hit-pay.com',
    });
  });
});
