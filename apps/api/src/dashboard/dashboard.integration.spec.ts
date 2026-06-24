import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

function assertTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for dashboard integration tests');
  }

  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (!databaseName.includes('test')) {
    throw new Error(
      `Refusing to run integration tests against non-test database "${databaseName}"`,
    );
  }
}

function todayAt(hour: number) {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function resetDatabase(prisma: PrismaService) {
  await prisma.$transaction([
    prisma.refund.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
  ]);
}

async function seedDashboardScenario(prisma: PrismaService) {
  const [coffee, lamp, backpack] = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'INT-COFFEE',
        name: 'Integration Coffee Kit',
        category: 'Kitchen',
        brand: 'Test Brand',
        price: '100.00',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'INT-LAMP',
        name: 'Integration Desk Lamp',
        category: 'Electronics',
        brand: 'Test Brand',
        price: '200.00',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'INT-BACKPACK',
        name: 'Integration Backpack',
        category: 'Bags',
        brand: 'Test Brand',
        price: '80.00',
      },
    }),
  ]);

  const createOrder = async ({
    orderNo,
    platform,
    status,
    placedAt,
    productId,
    quantity,
    unitPrice,
    grossAmount,
    netAmount,
  }: {
    orderNo: string;
    platform: string;
    status: 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
    placedAt: Date;
    productId: string;
    quantity: number;
    unitPrice: string;
    grossAmount: string;
    netAmount: string;
  }) =>
    prisma.order.create({
      data: {
        orderNo,
        platform,
        placedAt,
        status,
        grossAmount,
        discountAmount: '0.00',
        netAmount,
        customerRegion: 'Shanghai',
        items: {
          create: {
            productId,
            quantity,
            unitPrice,
            discountAmount: '0.00',
            grossAmount,
            netAmount,
          },
        },
      },
      include: {
        items: true,
      },
    });

  const paidCoffee = await createOrder({
    orderNo: 'INT-ORDER-001',
    platform: 'tmall',
    status: 'PAID',
    placedAt: todayAt(1),
    productId: coffee.id,
    quantity: 2,
    unitPrice: '100.00',
    grossAmount: '200.00',
    netAmount: '200.00',
  });
  const completedLamp = await createOrder({
    orderNo: 'INT-ORDER-002',
    platform: 'jd',
    status: 'COMPLETED',
    placedAt: todayAt(2),
    productId: lamp.id,
    quantity: 1,
    unitPrice: '200.00',
    grossAmount: '200.00',
    netAmount: '180.00',
  });
  await createOrder({
    orderNo: 'INT-ORDER-003',
    platform: 'tmall',
    status: 'CANCELLED',
    placedAt: todayAt(3),
    productId: backpack.id,
    quantity: 99,
    unitPrice: '80.00',
    grossAmount: '7920.00',
    netAmount: '0.00',
  });
  await createOrder({
    orderNo: 'INT-ORDER-004',
    platform: 'tmall',
    status: 'PENDING_PAYMENT',
    placedAt: todayAt(4),
    productId: backpack.id,
    quantity: 77,
    unitPrice: '80.00',
    grossAmount: '6160.00',
    netAmount: '0.00',
  });

  const completedToday = await prisma.refund.create({
    data: {
      refundNo: 'INT-REFUND-001',
      orderId: paidCoffee.id,
      orderItemId: paidCoffee.items[0].id,
      productId: coffee.id,
      reason: 'CUSTOMER_RETURN',
      status: 'COMPLETED',
      requestedAt: addDays(todayAt(5), -3),
      completedAt: todayAt(6),
      amount: '50.00',
      note: 'completed today',
    },
  });
  await prisma.refund.create({
    data: {
      refundNo: 'INT-REFUND-002',
      orderId: completedLamp.id,
      orderItemId: completedLamp.items[0].id,
      productId: lamp.id,
      reason: 'QUALITY_ISSUE',
      status: 'COMPLETED',
      requestedAt: todayAt(7),
      completedAt: addDays(todayAt(7), -2),
      amount: '30.00',
      note: 'completed before today',
    },
  });
  const requestedRefund = await prisma.refund.create({
    data: {
      refundNo: 'INT-REFUND-003',
      orderId: completedLamp.id,
      orderItemId: completedLamp.items[0].id,
      productId: lamp.id,
      reason: 'OTHER',
      status: 'REQUESTED',
      requestedAt: todayAt(8),
      amount: '20.00',
      note: 'pending today',
    },
  });

  return {
    completedToday,
    requestedRefund,
  };
}

describe('dashboard API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scenario: Awaited<ReturnType<typeof seedDashboardScenario>>;

  beforeAll(async () => {
    assertTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    scenario = await seedDashboardScenario(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await resetDatabase(prisma);
    }

    if (app) {
      await app.close();
    }
  });

  it('returns dashboard summary and trend using only revenue orders and completed refunds by completion date', async () => {
    const summary = await request(app.getHttpServer())
      .get('/dashboard/summary')
      .query({ period: 'today' })
      .expect(200);

    expect(summary.body).toMatchObject({
      period: 'today',
      gmv: 400,
      orderCount: 2,
      refundAmount: 50,
      refundRate: 0.125,
      averageOrderValue: 190,
    });

    const trend = await request(app.getHttpServer())
      .get('/dashboard/sales-trend')
      .query({ period: 'today' })
      .expect(200);

    expect(trend.body.points).toHaveLength(1);
    expect(trend.body.points[0]).toMatchObject({
      gmv: 400,
      orderCount: 2,
      netSales: 380,
    });
  });

  it('excludes cancelled and pending-payment orders from product ranking', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/top-selling')
      .query({ period: 'today', limit: '10' })
      .expect(200);

    expect(response.body.products).toHaveLength(2);
    expect(response.body.products.map((product: { sku: string }) => product.sku)).toEqual([
      'INT-COFFEE',
      'INT-LAMP',
    ]);
    expect(
      response.body.products.some((product: { sku: string }) => product.sku === 'INT-BACKPACK'),
    ).toBe(false);
  });

  it('returns refund summary by completedAt and keeps pending refunds in pending count', async () => {
    const response = await request(app.getHttpServer())
      .get('/refunds/summary')
      .query({ period: 'today' })
      .expect(200);

    expect(response.body).toMatchObject({
      completedAmount: 50,
      completedCount: 1,
      pendingCount: 1,
      rejectedCount: 0,
      refundRate: 0.125,
    });
  });

  it('keeps order pagination and filters stable', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders')
      .query({ period: 'today', platform: 'tmall', page: '2', pageSize: '1' })
      .expect(200);

    expect(response.body).toMatchObject({
      page: 2,
      pageSize: 1,
      total: 3,
    });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0].orderNo).toBe('INT-ORDER-003');
  });

  it('returns refund list pagination with status and product filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/refunds')
      .query({
        period: 'today',
        refundStatus: 'COMPLETED',
        productSearch: 'coffee',
        page: '1',
        pageSize: '5',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 5,
      total: 1,
    });
    expect(response.body.refunds[0]).toMatchObject({
      refundNo: 'INT-REFUND-001',
      status: 'COMPLETED',
      amount: '50',
    });
  });

  it('does not write illegal refund status transitions', async () => {
    await request(app.getHttpServer())
      .patch(`/refunds/${scenario.requestedRefund.id}/status`)
      .send({ status: 'COMPLETED' })
      .expect(400);

    const persisted = await prisma.refund.findUniqueOrThrow({
      where: { id: scenario.requestedRefund.id },
    });

    expect(persisted.status).toBe('REQUESTED');
    expect(persisted.completedAt).toBeNull();
  });
});
