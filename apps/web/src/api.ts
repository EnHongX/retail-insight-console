export type DashboardPeriod = 'today' | '7d' | '30d';
export type ProductSort = 'quantity' | 'netSales';

export type DashboardFilters = {
  period: DashboardPeriod;
  platform: string;
  category: string;
  productSearch: string;
  refundStatus: string;
  sort: ProductSort;
};

export type FilterOptionsResponse = {
  platforms: string[];
  categories: string[];
  refundStatuses: string[];
};

export type SummaryResponse = {
  period: DashboardPeriod;
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

export type SalesTrendResponse = {
  period: DashboardPeriod;
  points: SalesTrendPoint[];
};

export type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  netSales: number;
};

export type TopProductsResponse = {
  period: DashboardPeriod;
  products: TopProduct[];
};

export type RefundSummaryResponse = {
  period: DashboardPeriod;
  completedAmount: number;
  completedCount: number;
  pendingCount: number;
  rejectedCount: number;
  refundRate: number;
};

export type DashboardData = {
  filterOptions: FilterOptionsResponse;
  summary: SummaryResponse;
  salesTrend: SalesTrendResponse;
  topProducts: TopProductsResponse;
  refundSummary: RefundSummaryResponse;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7102';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchDashboardData(
  filters: DashboardFilters,
): Promise<DashboardData> {
  const params = new URLSearchParams({ period: filters.period });

  if (filters.platform !== 'all') {
    params.set('platform', filters.platform);
  }

  if (filters.category !== 'all') {
    params.set('category', filters.category);
  }

  if (filters.productSearch.trim()) {
    params.set('productSearch', filters.productSearch.trim());
  }

  if (filters.refundStatus !== 'all') {
    params.set('refundStatus', filters.refundStatus);
  }

  params.set('sort', filters.sort);

  const [filterOptions, summary, salesTrend, topProducts, refundSummary] =
    await Promise.all([
      getJson<FilterOptionsResponse>('/dashboard/filters'),
      getJson<SummaryResponse>(`/dashboard/summary?${params}`),
      getJson<SalesTrendResponse>(`/dashboard/sales-trend?${params}`),
      getJson<TopProductsResponse>(`/products/top-selling?${params}&limit=10`),
      getJson<RefundSummaryResponse>(`/refunds/summary?${params}`),
    ]);

  return {
    filterOptions,
    summary,
    salesTrend,
    topProducts,
    refundSummary,
  };
}
