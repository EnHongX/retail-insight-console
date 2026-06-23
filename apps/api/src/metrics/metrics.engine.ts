import { Injectable } from '@nestjs/common';

export const validRevenueOrderStatuses = ['PAID', 'SHIPPED', 'COMPLETED'] as const;

type RevenueOrderStatus = (typeof validRevenueOrderStatuses)[number];

type StatusInput = string | RevenueOrderStatus;

type AmountInput = string | number | { toString(): string };

export type MetricOrder = {
  id?: string;
  orderNo?: string;
  placedAt: Date;
  status: StatusInput;
  grossAmount: AmountInput;
  netAmount: AmountInput;
};

export type MetricOrderItem = {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  orderStatus: StatusInput;
  quantity: number;
  netAmount: AmountInput;
};

export type MetricRefund = {
  status: string;
  amount: AmountInput;
  completedAt: Date | null;
};

export type SummaryMetric = {
  gmv: number;
  orderCount: number;
  refundAmount: number;
  refundRate: number;
  averageOrderValue: number;
};

export type SalesTrendPoint = {
  date: string;
  gmv: number;
  orderCount: number;
  netSales: number;
};

export type TopProductMetric = {
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  netSales: number;
};

export type RefundSummaryMetric = {
  completedAmount: number;
  completedCount: number;
  pendingCount: number;
  rejectedCount: number;
  refundRate: number;
};

function amountToNumber(value: AmountInput): number {
  return Number(value.toString());
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function isValidOrderStatus(status: StatusInput, validStatuses: readonly string[]): boolean {
  return validStatuses.includes(status);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function isInDateRange(
  date: Date | null,
  startDate?: Date,
  endDate?: Date,
): boolean {
  if (!date) {
    return false;
  }

  if (startDate && date < startDate) {
    return false;
  }

  if (endDate && date >= endDate) {
    return false;
  }

  return true;
}

@Injectable()
export class MetricsEngine {
  buildSummary({
    orders,
    refunds,
    validStatuses,
  }: {
    orders: MetricOrder[];
    refunds: MetricRefund[];
    validStatuses: readonly string[];
  }): SummaryMetric {
    const validOrders = orders.filter((order) =>
      isValidOrderStatus(order.status, validStatuses),
    );
    const gmv = validOrders.reduce(
      (sum, order) => sum + amountToNumber(order.grossAmount),
      0,
    );
    const netSales = validOrders.reduce(
      (sum, order) => sum + amountToNumber(order.netAmount),
      0,
    );
    const refundAmount = refunds
      .filter((refund) => refund.status === 'COMPLETED')
      .reduce((sum, refund) => sum + amountToNumber(refund.amount), 0);

    return {
      gmv: roundCurrency(gmv),
      orderCount: validOrders.length,
      refundAmount: roundCurrency(refundAmount),
      refundRate: gmv === 0 ? 0 : roundRate(refundAmount / gmv),
      averageOrderValue:
        validOrders.length === 0 ? 0 : roundCurrency(netSales / validOrders.length),
    };
  }

  buildSalesTrend({
    orders,
    validStatuses,
    startDate,
    endDate,
  }: {
    orders: MetricOrder[];
    validStatuses: readonly string[];
    startDate?: Date;
    endDate?: Date;
  }): SalesTrendPoint[] {
    const points = new Map<string, SalesTrendPoint>();

    if (startDate && endDate) {
      for (let date = new Date(startDate); date < endDate; date = addDays(date, 1)) {
        points.set(toDateKey(date), {
          date: toDateKey(date),
          gmv: 0,
          orderCount: 0,
          netSales: 0,
        });
      }
    }

    for (const order of orders) {
      if (!isValidOrderStatus(order.status, validStatuses)) {
        continue;
      }

      if (startDate && endDate && !isInDateRange(order.placedAt, startDate, endDate)) {
        continue;
      }

      const date = toDateKey(order.placedAt);
      const point = points.get(date) ?? {
        date,
        gmv: 0,
        orderCount: 0,
        netSales: 0,
      };

      point.gmv = roundCurrency(point.gmv + amountToNumber(order.grossAmount));
      point.netSales = roundCurrency(point.netSales + amountToNumber(order.netAmount));
      point.orderCount += 1;
      points.set(date, point);
    }

    return [...points.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  buildTopProducts({
    orderItems,
    validStatuses,
    limit,
    sortBy = 'quantity',
  }: {
    orderItems: MetricOrderItem[];
    validStatuses: readonly string[];
    limit: number;
    sortBy?: 'quantity' | 'netSales';
  }): TopProductMetric[] {
    const products = new Map<string, TopProductMetric>();

    for (const item of orderItems) {
      if (!isValidOrderStatus(item.orderStatus, validStatuses)) {
        continue;
      }

      const product = products.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        category: item.category,
        quantity: 0,
        netSales: 0,
      };

      product.quantity += item.quantity;
      product.netSales = roundCurrency(product.netSales + amountToNumber(item.netAmount));
      products.set(item.productId, product);
    }

    return [...products.values()]
      .sort((left, right) => {
        if (sortBy === 'netSales') {
          if (right.netSales !== left.netSales) {
            return right.netSales - left.netSales;
          }

          return right.quantity - left.quantity;
        }

        if (right.quantity !== left.quantity) {
          return right.quantity - left.quantity;
        }

        return right.netSales - left.netSales;
      })
      .slice(0, limit);
  }

  buildRefundSummary({
    refunds,
    gmv,
    startDate,
    endDate,
    refundStatus,
  }: {
    refunds: MetricRefund[];
    gmv: number;
    startDate?: Date;
    endDate?: Date;
    refundStatus?: string;
  }): RefundSummaryMetric {
    const filteredRefunds = refunds.filter((refund) => {
      if (refundStatus && refund.status !== refundStatus) {
        return false;
      }

      if (startDate || endDate) {
        if (refund.status === 'COMPLETED') {
          return isInDateRange(refund.completedAt, startDate, endDate);
        }

        return true;
      }

      return true;
    });
    const completedRefunds = filteredRefunds.filter(
      (refund) => refund.status === 'COMPLETED',
    );
    const pendingRefunds = filteredRefunds.filter((refund) =>
      ['REQUESTED', 'APPROVED'].includes(refund.status),
    );
    const rejectedRefunds = filteredRefunds.filter(
      (refund) => refund.status === 'REJECTED',
    );
    const completedAmount = completedRefunds.reduce(
      (sum, refund) => sum + amountToNumber(refund.amount),
      0,
    );

    return {
      completedAmount: roundCurrency(completedAmount),
      completedCount: completedRefunds.length,
      pendingCount: pendingRefunds.length,
      rejectedCount: rejectedRefunds.length,
      refundRate: gmv === 0 ? 0 : roundRate(completedAmount / gmv),
    };
  }
}
