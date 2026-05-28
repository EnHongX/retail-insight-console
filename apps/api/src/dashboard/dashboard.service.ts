import { Injectable } from '@nestjs/common';
import { RefundStatus } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import {
  buildRefundSummary,
  buildSalesTrend,
  buildSummary,
  buildTopProducts,
  validRevenueOrderStatuses,
} from './dashboard.metrics';

export type DashboardPeriod = 'today' | '7d' | '30d';
export type DashboardFilters = {
  period?: string;
  platform?: string;
  category?: string;
  productSearch?: string;
  refundStatus?: string;
  sort?: string;
};

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

function getPeriodEnd(now = new Date()): Date {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

function normalizePeriod(period?: string): DashboardPeriod {
  if (period === '7d' || period === '30d' || period === 'today') {
    return period;
  }

  return '7d';
}

function cleanFilter(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed !== 'all' ? trimmed : undefined;
}

function cleanRefundStatus(value?: string): RefundStatus | undefined {
  const status = cleanFilter(value);

  if (
    status === RefundStatus.REQUESTED ||
    status === RefundStatus.APPROVED ||
    status === RefundStatus.REJECTED ||
    status === RefundStatus.COMPLETED
  ) {
    return status;
  }

  return undefined;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getFilterOptions() {
    const [platforms, categories] = await Promise.all([
      this.prisma.order.findMany({
        distinct: ['platform'],
        orderBy: { platform: 'asc' },
        select: { platform: true },
      }),
      this.prisma.product.findMany({
        distinct: ['category'],
        orderBy: { category: 'asc' },
        select: { category: true },
      }),
    ]);

    return {
      platforms: platforms.map((item) => item.platform),
      categories: categories.map((item) => item.category),
      refundStatuses: ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'],
    };
  }

  async getSummary(filters: DashboardFilters = {}) {
    const period = normalizePeriod(filters.period);
    const start = getPeriodStart(period);
    const end = getPeriodEnd();
    const platform = cleanFilter(filters.platform);
    const category = cleanFilter(filters.category);
    const productSearch = cleanFilter(filters.productSearch);
    const refundStatus = cleanRefundStatus(filters.refundStatus);
    const [orders, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          placedAt: { gte: start, lt: end },
          ...(platform ? { platform } : {}),
          ...(category || productSearch
            ? {
                items: {
                  some: {
                    product: {
                      ...(category ? { category } : {}),
                      ...(productSearch
                        ? {
                            OR: [
                              { name: { contains: productSearch, mode: 'insensitive' } },
                              { sku: { contains: productSearch, mode: 'insensitive' } },
                            ],
                          }
                        : {}),
                    },
                  },
                },
              }
            : {}),
        },
        select: {
          placedAt: true,
          platform: true,
          status: true,
          grossAmount: true,
          netAmount: true,
        },
      }),
      this.prisma.refund.findMany({
        where: {
          ...(refundStatus ? { status: refundStatus } : {}),
          ...(category || productSearch
            ? {
                product: {
                  ...(category ? { category } : {}),
                  ...(productSearch
                    ? {
                        OR: [
                          { name: { contains: productSearch, mode: 'insensitive' } },
                          { sku: { contains: productSearch, mode: 'insensitive' } },
                        ],
                      }
                    : {}),
                },
              }
            : {}),
          OR: [
            { completedAt: { gte: start, lt: end } },
            { status: { in: ['REQUESTED', 'APPROVED'] }, requestedAt: { gte: start, lt: end } },
          ],
          ...(platform ? { order: { platform } } : {}),
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

  async getSalesTrend(filters: DashboardFilters = {}) {
    const period = normalizePeriod(filters.period);
    const start = getPeriodStart(period);
    const end = getPeriodEnd();
    const platform = cleanFilter(filters.platform);
    const category = cleanFilter(filters.category);
    const productSearch = cleanFilter(filters.productSearch);
    const orders = await this.prisma.order.findMany({
      where: {
        placedAt: { gte: start, lt: end },
        ...(platform ? { platform } : {}),
        ...(category || productSearch
          ? {
              items: {
                some: {
                  product: {
                    ...(category ? { category } : {}),
                    ...(productSearch
                      ? {
                          OR: [
                            { name: { contains: productSearch, mode: 'insensitive' } },
                            { sku: { contains: productSearch, mode: 'insensitive' } },
                          ],
                        }
                      : {}),
                  },
                },
              },
            }
          : {}),
      },
      orderBy: {
        placedAt: 'asc',
      },
      select: {
        placedAt: true,
        platform: true,
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
        startDate: start,
        endDate: end,
      }),
    };
  }

  async getTopProducts(filters: DashboardFilters = {}, limitInput?: string) {
    const period = normalizePeriod(filters.period);
    const start = getPeriodStart(period);
    const end = getPeriodEnd();
    const platform = cleanFilter(filters.platform);
    const category = cleanFilter(filters.category);
    const productSearch = cleanFilter(filters.productSearch);
    const sortBy = filters.sort === 'netSales' ? 'netSales' : 'quantity';
    const limit = Math.min(Math.max(Number(limitInput ?? 5) || 5, 1), 20);
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: { gte: start, lt: end },
          ...(platform ? { platform } : {}),
        },
        product: {
          ...(category ? { category } : {}),
          ...(productSearch
            ? {
                OR: [
                  { name: { contains: productSearch, mode: 'insensitive' } },
                  { sku: { contains: productSearch, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
      },
      select: {
        productId: true,
        quantity: true,
        netAmount: true,
        order: {
          select: {
            status: true,
            platform: true,
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
        sortBy,
        validStatuses: validRevenueOrderStatuses,
        orderItems: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          category: item.product.category,
          platform: item.order.platform,
          orderStatus: item.order.status,
          quantity: item.quantity,
          netAmount: item.netAmount,
        })),
      }),
    };
  }

  async getRefundSummary(filters: DashboardFilters = {}) {
    const period = normalizePeriod(filters.period);
    const start = getPeriodStart(period);
    const end = getPeriodEnd();
    const platform = cleanFilter(filters.platform);
    const category = cleanFilter(filters.category);
    const productSearch = cleanFilter(filters.productSearch);
    const refundStatus = cleanRefundStatus(filters.refundStatus);
    const [orders, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          placedAt: { gte: start, lt: end },
          ...(platform ? { platform } : {}),
          ...(category || productSearch
            ? {
                items: {
                  some: {
                    product: {
                      ...(category ? { category } : {}),
                      ...(productSearch
                        ? {
                            OR: [
                              { name: { contains: productSearch, mode: 'insensitive' } },
                              { sku: { contains: productSearch, mode: 'insensitive' } },
                            ],
                          }
                        : {}),
                    },
                  },
                },
              }
            : {}),
        },
        select: {
          placedAt: true,
          platform: true,
          status: true,
          grossAmount: true,
          netAmount: true,
        },
      }),
      this.prisma.refund.findMany({
        where: {
          ...(refundStatus ? { status: refundStatus } : {}),
          ...(category || productSearch
            ? {
                product: {
                  ...(category ? { category } : {}),
                  ...(productSearch
                    ? {
                        OR: [
                          { name: { contains: productSearch, mode: 'insensitive' } },
                          { sku: { contains: productSearch, mode: 'insensitive' } },
                        ],
                      }
                    : {}),
                },
              }
            : {}),
          OR: [
            { completedAt: { gte: start, lt: end } },
            { status: { in: ['REQUESTED', 'APPROVED', 'REJECTED'] }, requestedAt: { gte: start, lt: end } },
          ],
          ...(platform ? { order: { platform } } : {}),
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
        startDate: start,
        endDate: end,
        refundStatus,
      }),
    };
  }
}
