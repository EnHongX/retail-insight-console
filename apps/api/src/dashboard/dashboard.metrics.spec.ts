import { describe, expect, it } from 'vitest';
import {
  buildRefundSummary,
  buildSalesTrend,
  buildSummary,
  buildTopProducts,
} from './dashboard.metrics';

const validStatuses = ['PAID', 'SHIPPED', 'COMPLETED'] as const;

const orders = [
  {
    id: 'order-1',
    orderNo: 'ORD-1',
    placedAt: new Date('2026-05-28T02:00:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '758.00',
    netAmount: '698.00',
  },
  {
    id: 'order-2',
    orderNo: 'ORD-2',
    placedAt: new Date('2026-05-28T08:30:00.000Z'),
    status: 'PAID',
    grossAmount: '558.00',
    netAmount: '538.00',
  },
  {
    id: 'order-3',
    orderNo: 'ORD-3',
    placedAt: new Date('2026-05-27T12:00:00.000Z'),
    status: 'CANCELLED',
    grossAmount: '389.00',
    netAmount: '0.00',
  },
];

const orderItems = [
  {
    productId: 'product-1',
    productName: 'Pour Over Coffee Kit',
    sku: 'RI-DRIP-001',
    category: 'Kitchen',
    orderStatus: 'COMPLETED',
    quantity: 1,
    netAmount: '279.00',
  },
  {
    productId: 'product-2',
    productName: 'Desk Lamp Pro',
    sku: 'RI-LAMP-002',
    category: 'Home Electronics',
    orderStatus: 'COMPLETED',
    quantity: 1,
    netAmount: '419.00',
  },
  {
    productId: 'product-4',
    productName: 'Yoga Training Mat',
    sku: 'RI-MAT-004',
    category: 'Sports',
    orderStatus: 'PAID',
    quantity: 2,
    netAmount: '338.00',
  },
  {
    productId: 'product-3',
    productName: 'Commuter Backpack',
    sku: 'RI-BAG-003',
    category: 'Bags',
    orderStatus: 'CANCELLED',
    quantity: 1,
    netAmount: '389.00',
  },
];

const refunds = [
  {
    status: 'COMPLETED',
    amount: '419.00',
    completedAt: new Date('2026-05-28T06:15:00.000Z'),
  },
  {
    status: 'REQUESTED',
    amount: '169.00',
    completedAt: null,
  },
];

describe('dashboard metrics', () => {
  it('summarizes valid orders and completed refunds', () => {
    expect(buildSummary({ orders, refunds, validStatuses })).toEqual({
      gmv: 1316,
      orderCount: 2,
      refundAmount: 419,
      refundRate: 0.3184,
      averageOrderValue: 618,
    });
  });

  it('builds daily sales trend from valid orders only', () => {
    expect(buildSalesTrend({ orders, validStatuses })).toEqual([
      { date: '2026-05-28', gmv: 1316, orderCount: 2, netSales: 1236 },
    ]);
  });

  it('ranks products by quantity and excludes cancelled orders', () => {
    expect(buildTopProducts({ orderItems, validStatuses, limit: 2 })).toEqual([
      {
        productId: 'product-4',
        name: 'Yoga Training Mat',
        sku: 'RI-MAT-004',
        category: 'Sports',
        quantity: 2,
        netSales: 338,
      },
      {
        productId: 'product-2',
        name: 'Desk Lamp Pro',
        sku: 'RI-LAMP-002',
        category: 'Home Electronics',
        quantity: 1,
        netSales: 419,
      },
    ]);
  });

  it('summarizes refund workflow states', () => {
    expect(buildRefundSummary({ refunds, gmv: 1316 })).toEqual({
      completedAmount: 419,
      completedCount: 1,
      pendingCount: 1,
      refundRate: 0.3184,
    });
  });
});
