import { describe, expect, it } from 'vitest';
import { MetricsEngine, validRevenueOrderStatuses } from './metrics.engine';

const orders = [
  {
    id: 'order-1',
    orderNo: 'ORD-1',
    placedAt: new Date('2026-05-28T02:00:00.000Z'),
    platform: 'tmall',
    status: 'COMPLETED',
    grossAmount: '758.00',
    netAmount: '698.00',
  },
  {
    id: 'order-2',
    orderNo: 'ORD-2',
    placedAt: new Date('2026-05-28T08:30:00.000Z'),
    platform: 'jd',
    status: 'PAID',
    grossAmount: '558.00',
    netAmount: '538.00',
  },
  {
    id: 'order-3',
    orderNo: 'ORD-3',
    placedAt: new Date('2026-05-27T12:00:00.000Z'),
    platform: 'tmall',
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
    platform: 'tmall',
    orderStatus: 'COMPLETED',
    quantity: 1,
    netAmount: '279.00',
  },
  {
    productId: 'product-2',
    productName: 'Desk Lamp Pro',
    sku: 'RI-LAMP-002',
    category: 'Home Electronics',
    platform: 'tmall',
    orderStatus: 'COMPLETED',
    quantity: 1,
    netAmount: '419.00',
  },
  {
    productId: 'product-4',
    productName: 'Yoga Training Mat',
    sku: 'RI-MAT-004',
    category: 'Sports',
    platform: 'jd',
    orderStatus: 'PAID',
    quantity: 2,
    netAmount: '338.00',
  },
  {
    productId: 'product-3',
    productName: 'Commuter Backpack',
    sku: 'RI-BAG-003',
    category: 'Bags',
    platform: 'tmall',
    orderStatus: 'CANCELLED',
    quantity: 1,
    netAmount: '389.00',
  },
  {
    productId: 'product-5',
    productName: 'Pending Payment Item',
    sku: 'RI-PENDING-005',
    category: 'Bags',
    platform: 'jd',
    orderStatus: 'PENDING_PAYMENT',
    quantity: 8,
    netAmount: '888.00',
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
  {
    status: 'COMPLETED',
    amount: '50.00',
    completedAt: new Date('2026-05-27T06:15:00.000Z'),
  },
];

describe('MetricsEngine', () => {
  const engine = new MetricsEngine();

  it('calculates dashboard summary without changing metric semantics', () => {
    expect(
      engine.buildSummary({
        orders,
        refunds,
        validStatuses: validRevenueOrderStatuses,
      }),
    ).toEqual({
      gmv: 1316,
      orderCount: 2,
      refundAmount: 469,
      refundRate: 0.3564,
      averageOrderValue: 618,
    });
  });

  it('builds complete daily trend points for the requested date window', () => {
    expect(
      engine.buildSalesTrend({
        orders,
        validStatuses: validRevenueOrderStatuses,
        startDate: new Date('2026-05-26T00:00:00.000Z'),
        endDate: new Date('2026-05-29T00:00:00.000Z'),
      }),
    ).toEqual([
      { date: '2026-05-26', gmv: 0, orderCount: 0, netSales: 0 },
      { date: '2026-05-27', gmv: 0, orderCount: 0, netSales: 0 },
      { date: '2026-05-28', gmv: 1316, orderCount: 2, netSales: 1236 },
    ]);
  });

  it('builds daily sales trend from valid orders only', () => {
    expect(
      engine.buildSalesTrend({
        orders,
        validStatuses: validRevenueOrderStatuses,
      }),
    ).toEqual([{ date: '2026-05-28', gmv: 1316, orderCount: 2, netSales: 1236 }]);
  });

  it('ranks products from revenue orders only', () => {
    expect(
      engine.buildTopProducts({
        orderItems,
        validStatuses: validRevenueOrderStatuses,
        limit: 2,
      }),
    ).toEqual([
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

  it('can rank products by net sales for table sorting', () => {
    expect(
      engine.buildTopProducts({
        orderItems,
        validStatuses: validRevenueOrderStatuses,
        limit: 1,
        sortBy: 'netSales',
      }),
    ).toEqual([
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
    expect(engine.buildRefundSummary({ refunds, gmv: 1316 })).toEqual({
      completedAmount: 469,
      completedCount: 2,
      pendingCount: 1,
      refundRate: 0.3564,
      rejectedCount: 0,
    });
  });

  it('summarizes refunds using completedAt for completed refunds', () => {
    expect(
      engine.buildRefundSummary({
        refunds,
        gmv: 1316,
        startDate: new Date('2026-05-28T00:00:00.000Z'),
        endDate: new Date('2026-05-29T00:00:00.000Z'),
        refundStatus: 'COMPLETED',
      }),
    ).toEqual({
      completedAmount: 419,
      completedCount: 1,
      pendingCount: 0,
      rejectedCount: 0,
      refundRate: 0.3184,
    });
  });
});
