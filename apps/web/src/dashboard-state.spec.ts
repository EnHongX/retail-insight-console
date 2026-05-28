import { describe, expect, it } from 'vitest';
import { parseDashboardFilters, serializeDashboardFilters } from './dashboard-state';

describe('dashboard filter query state', () => {
  it('parses supported filters from query params', () => {
    expect(
      parseDashboardFilters(
        '?period=30d&platform=tmall&category=Kitchen&productSearch=mug&refundStatus=COMPLETED&sort=netSales',
      ),
    ).toEqual({
      period: '30d',
      platform: 'tmall',
      category: 'Kitchen',
      productSearch: 'mug',
      refundStatus: 'COMPLETED',
      sort: 'netSales',
    });
  });

  it('drops default and empty filter values when serializing', () => {
    expect(
      serializeDashboardFilters({
        period: '7d',
        platform: 'all',
        category: 'Kitchen',
        productSearch: '',
        refundStatus: 'all',
        sort: 'quantity',
      }),
    ).toBe('?category=Kitchen');
  });
});
