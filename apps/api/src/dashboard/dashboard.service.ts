import { Inject, Injectable } from '@nestjs/common';
import { RefundStatus } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import {
  MetricsEngine,
  validRevenueOrderStatuses,
} from '../metrics/metrics.engine';
import {
  assertRefundTransition,
  normalizeRefundStatus,
} from './refund-workflow';

export type DashboardPeriod = 'today' | '7d' | '30d';
export type DashboardFilters = {
  period?: string;
  platform?: string;
  category?: string;
  productSearch?: string;
  refundStatus?: string;
  sort?: string;
  date?: string;
  page?: string;
  pageSize?: string;
};

type DateWindow = {
  start: Date;
  end: Date;
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

function getDateWindow(filters: DashboardFilters): DateWindow {
  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
  }

  const period = normalizePeriod(filters.period);
  return {
    start: getPeriodStart(period),
    end: getPeriodEnd(),
  };
}

function getPagination(filters: DashboardFilters) {
  const page = Math.max(Number(filters.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize ?? 10) || 10, 1), 50);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

function productFilter(category?: string, productSearch?: string) {
  if (!category && !productSearch) {
    return {};
  }

  return {
    product: {
      ...(category ? { category } : {}),
      ...(productSearch
        ? {
            OR: [
              { name: { contains: productSearch, mode: 'insensitive' as const } },
              { sku: { contains: productSearch, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
  };
}

function orderWhere(filters: DashboardFilters, window: DateWindow) {
  const platform = cleanFilter(filters.platform);
  const category = cleanFilter(filters.category);
  const productSearch = cleanFilter(filters.productSearch);

  return {
    placedAt: { gte: window.start, lt: window.end },
    ...(platform ? { platform } : {}),
    ...(category || productSearch
      ? {
          items: {
            some: productFilter(category, productSearch),
          },
        }
      : {}),
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(MetricsEngine)
    private readonly metricsEngine: MetricsEngine,
  ) {}

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

  async getOrders(filters: DashboardFilters = {}) {
    const window = getDateWindow(filters);
    const pagination = getPagination(filters);
    const where = orderWhere(filters, window);
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: {
          id: true,
          orderNo: true,
          platform: true,
          placedAt: true,
          status: true,
          grossAmount: true,
          discountAmount: true,
          netAmount: true,
          customerRegion: true,
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              discountAmount: true,
              grossAmount: true,
              netAmount: true,
              product: {
                select: {
                  sku: true,
                  name: true,
                  category: true,
                },
              },
              refunds: {
                select: {
                  refundNo: true,
                  status: true,
                  amount: true,
                },
              },
            },
          },
          refunds: {
            select: {
              id: true,
              refundNo: true,
              status: true,
              amount: true,
              requestedAt: true,
              completedAt: true,
              reason: true,
            },
          },
        },
      }),
    ]);

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      orders,
    };
  }

  async getRefunds(filters: DashboardFilters = {}) {
    const window = getDateWindow(filters);
    const pagination = getPagination(filters);
    const platform = cleanFilter(filters.platform);
    const category = cleanFilter(filters.category);
    const productSearch = cleanFilter(filters.productSearch);
    const refundStatus = cleanRefundStatus(filters.refundStatus);
    const where = {
      ...(refundStatus ? { status: refundStatus } : {}),
      ...(category || productSearch
        ? { product: productFilter(category, productSearch).product }
        : {}),
      OR: [
        { completedAt: { gte: window.start, lt: window.end } },
        {
          status: { in: ['REQUESTED', 'APPROVED', 'REJECTED'] as RefundStatus[] },
          requestedAt: { gte: window.start, lt: window.end },
        },
      ],
      ...(platform ? { order: { platform } } : {}),
    };
    const [total, refunds] = await Promise.all([
      this.prisma.refund.count({ where }),
      this.prisma.refund.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: {
          id: true,
          refundNo: true,
          reason: true,
          status: true,
          amount: true,
          requestedAt: true,
          completedAt: true,
          note: true,
          order: {
            select: {
              orderNo: true,
              platform: true,
              placedAt: true,
            },
          },
          product: {
            select: {
              sku: true,
              name: true,
              category: true,
            },
          },
        },
      }),
    ]);

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      refunds,
    };
  }

  async updateRefundStatus(refundId: string, nextStatusInput: string) {
    const nextStatus = normalizeRefundStatus(nextStatusInput);
    const refund = await this.prisma.refund.findUniqueOrThrow({
      where: { id: refundId },
      select: {
        id: true,
        status: true,
      },
    });

    assertRefundTransition(refund.status, nextStatus);

    return this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: nextStatus,
        completedAt: nextStatus === RefundStatus.COMPLETED ? new Date() : null,
      },
      select: {
        id: true,
        refundNo: true,
        status: true,
        completedAt: true,
      },
    });
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
      ...this.metricsEngine.buildSummary({
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
      points: this.metricsEngine.buildSalesTrend({
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
      products: this.metricsEngine.buildTopProducts({
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
    const summary = this.metricsEngine.buildSummary({
      orders,
      refunds,
      validStatuses: validRevenueOrderStatuses,
    });

    return {
      period,
      ...this.metricsEngine.buildRefundSummary({
        refunds,
        gmv: summary.gmv,
        startDate: start,
        endDate: end,
        refundStatus,
      }),
    };
  }
}
