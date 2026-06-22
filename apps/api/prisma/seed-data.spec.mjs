import { describe, expect, it } from 'vitest';
import { buildSeedData } from './seed-data.mjs';

describe('seed data fixture coverage', () => {
  it('covers the dashboard dimensions needed for local demos and regression checks', () => {
    const baseDate = new Date('2026-06-22T00:00:00.000Z');
    const { products, orders, refunds } = buildSeedData({ baseDate });

    const unique = (items) => new Set(items);
    const revenueStatuses = ['PAID', 'SHIPPED', 'COMPLETED'];
    const startOfToday = new Date(baseDate);
    const sevenDayStart = new Date(baseDate);
    sevenDayStart.setUTCDate(sevenDayStart.getUTCDate() - 6);
    const sixtyDayStart = new Date(baseDate);
    sixtyDayStart.setUTCDate(sixtyDayStart.getUTCDate() - 59);

    expect(products.length).toBeGreaterThanOrEqual(18);
    expect(unique(products.map((product) => product.category)).size).toBeGreaterThanOrEqual(8);
    expect(unique(products.map((product) => product.brand)).size).toBeGreaterThanOrEqual(8);
    expect(products.some((product) => Number(product.price) < 100)).toBe(true);
    expect(products.some((product) => Number(product.price) > 1500)).toBe(true);

    expect(orders.length).toBeGreaterThanOrEqual(120);
    expect(unique(orders.map((order) => order.platform))).toEqual(
      new Set(['tmall', 'jd', 'douyin']),
    );
    expect(unique(orders.map((order) => order.status))).toEqual(
      new Set(['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
    );
    expect(unique(orders.map((order) => order.customerRegion)).size).toBeGreaterThanOrEqual(10);
    expect(orders.some((order) => order.placedAt >= startOfToday)).toBe(true);
    expect(
      orders.some(
        (order) =>
          order.placedAt >= sevenDayStart &&
          revenueStatuses.includes(order.status) &&
          Number(order.netAmount) > 0,
      ),
    ).toBe(true);
    expect(orders.every((order) => order.placedAt >= sixtyDayStart)).toBe(true);

    expect(refunds.length).toBeGreaterThanOrEqual(24);
    expect(unique(refunds.map((refund) => refund.status))).toEqual(
      new Set(['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED']),
    );
    expect(unique(refunds.map((refund) => refund.reason)).size).toBeGreaterThanOrEqual(5);
    expect(
      refunds.some(
        (refund) =>
          refund.status === 'COMPLETED' &&
          refund.completedAt &&
          refund.completedAt.toISOString().slice(0, 10) !==
            refund.requestedAt.toISOString().slice(0, 10),
      ),
    ).toBe(true);
  });
});
