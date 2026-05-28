import { describe, expect, it } from 'vitest';
import { assertRefundTransition } from './refund-workflow';

describe('refund workflow', () => {
  it('allows requested refunds to be approved or rejected', () => {
    expect(() => assertRefundTransition('REQUESTED', 'APPROVED')).not.toThrow();
    expect(() => assertRefundTransition('REQUESTED', 'REJECTED')).not.toThrow();
  });

  it('allows approved refunds to be completed', () => {
    expect(() => assertRefundTransition('APPROVED', 'COMPLETED')).not.toThrow();
  });

  it('rejects terminal or skipped transitions', () => {
    expect(() => assertRefundTransition('REJECTED', 'COMPLETED')).toThrow(
      'Invalid refund transition',
    );
    expect(() => assertRefundTransition('REQUESTED', 'COMPLETED')).toThrow(
      'Invalid refund transition',
    );
    expect(() => assertRefundTransition('COMPLETED', 'APPROVED')).toThrow(
      'Invalid refund transition',
    );
  });
});
