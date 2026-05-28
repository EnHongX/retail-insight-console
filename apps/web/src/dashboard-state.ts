import type { DashboardFilters, DashboardPeriod, ProductSort } from './api';

const periods: DashboardPeriod[] = ['today', '7d', '30d'];
const sorts: ProductSort[] = ['quantity', 'netSales'];

function normalizePeriod(value: string | null): DashboardPeriod {
  return periods.includes(value as DashboardPeriod) ? (value as DashboardPeriod) : '7d';
}

function normalizeSort(value: string | null): ProductSort {
  return sorts.includes(value as ProductSort) ? (value as ProductSort) : 'quantity';
}

export function parseDashboardFilters(search: string): DashboardFilters {
  const params = new URLSearchParams(search);

  return {
    period: normalizePeriod(params.get('period')),
    platform: params.get('platform') || 'all',
    category: params.get('category') || 'all',
    productSearch: params.get('productSearch') || '',
    refundStatus: params.get('refundStatus') || 'all',
    sort: normalizeSort(params.get('sort')),
  };
}

export function serializeDashboardFilters(filters: DashboardFilters): string {
  const params = new URLSearchParams();

  if (filters.period !== '7d') {
    params.set('period', filters.period);
  }

  if (filters.platform && filters.platform !== 'all') {
    params.set('platform', filters.platform);
  }

  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }

  if (filters.productSearch.trim()) {
    params.set('productSearch', filters.productSearch.trim());
  }

  if (filters.refundStatus && filters.refundStatus !== 'all') {
    params.set('refundStatus', filters.refundStatus);
  }

  if (filters.sort !== 'quantity') {
    params.set('sort', filters.sort);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
