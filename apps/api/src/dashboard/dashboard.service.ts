import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import {
  buildRefundSummary,
  buildSalesTrend,
  buildSummary,
  buildTopProducts,
  validRevenueOrderStatuses,
} from './dashboard.metrics';

export type DashboardPeriod = 'today' | '7d' | '30d';

function getPeriodStart(period: DashboardPeriod, now = new Date()): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);

  if (period === '7d') {
    start.setUTCDate(start.getUTCDate() - 6);
  }

  if (period === '30d') {
    start.setUTCDate(start.getUTCDate() - 29);
  }

  return start;
}

function normalizePeriod(period?: string): DashboardPeriod {
  if (period === '7d' || period === '30d' || period === 'today') {
    return period;
  }

  return '7d';
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(periodInput?: string) {
    const period = normalizePeriod(periodInput);
    const start = getPeriodStart(period);
    const [orders, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          placedAt: {
            gte: start,
          },
        },
        select: {
          placedAt: true,
          status: true,
          grossAmount: true,
          netAmount: true,
        },
      }),
      this.prisma.refund.findMany({
        where: {
          requestedAt: {
            gte: start,
          },
        },
        select: {
          status: true,
          amount: true,
          completedAt: true,
        },
      }),
    ]);

    return {
      period,
      ...buildSummary({
        orders,
        refunds,
        validStatuses: validRevenueOrderStatuses,
      }),
    };
  }

  async getSalesTrend(periodInput?: string) {
    const period = normalizePeriod(periodInput);
    const start = getPeriodStart(period);
    const orders = await this.prisma.order.findMany({
      where: {
        placedAt: {
          gte: start,
        },
      },
      orderBy: {
        placedAt: 'asc',
      },
      select: {
        placedAt: true,
        status: true,
        grossAmount: true,
        netAmount: true,
      },
    });

    return {
      period,
      points: buildSalesTrend({
        orders,
        validStatuses: validRevenueOrderStatuses,
      }),
    };
  }

  async getTopProducts(periodInput?: string, limitInput?: string) {
    const period = normalizePeriod(periodInput);
    const start = getPeriodStart(period);
    const limit = Math.min(Math.max(Number(limitInput ?? 5) || 5, 1), 20);
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: {
            gte: start,
          },
        },
      },
      select: {
        productId: true,
        quantity: true,
        netAmount: true,
        order: {
          select: {
            status: true,
          },
        },
        product: {
          select: {
            name: true,
            sku: true,
            category: true,
          },
        },
      },
    });

    return {
      period,
      products: buildTopProducts({
        limit,
        validStatuses: validRevenueOrderStatuses,
        orderItems: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          category: item.product.category,
          orderStatus: item.order.status,
          quantity: item.quantity,
          netAmount: item.netAmount,
        })),
      }),
    };
  }

  async getRefundSummary(periodInput?: string) {
    const period = normalizePeriod(periodInput);
    const start = getPeriodStart(period);
    const [orders, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          placedAt: {
            gte: start,
          },
        },
        select: {
          placedAt: true,
          status: true,
          grossAmount: true,
          netAmount: true,
        },
      }),
      this.prisma.refund.findMany({
        where: {
          requestedAt: {
            gte: start,
          },
        },
        select: {
          status: true,
          amount: true,
          completedAt: true,
        },
      }),
    ]);
    const summary = buildSummary({
      orders,
      refunds,
      validStatuses: validRevenueOrderStatuses,
    });

    return {
      period,
      ...buildRefundSummary({
        refunds,
        gmv: summary.gmv,
      }),
    };
  }
}
