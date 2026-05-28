export type DashboardPeriod = 'today' | '7d' | '30d';

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
  refundRate: number;
};

export type DashboardData = {
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
  period: DashboardPeriod,
): Promise<DashboardData> {
  const params = new URLSearchParams({ period });
  const [summary, salesTrend, topProducts, refundSummary] = await Promise.all([
    getJson<SummaryResponse>(`/dashboard/summary?${params}`),
    getJson<SalesTrendResponse>(`/dashboard/sales-trend?${params}`),
    getJson<TopProductsResponse>(`/products/top-selling?${params}`),
    getJson<RefundSummaryResponse>(`/refunds/summary?${params}`),
  ]);

  return {
    summary,
    salesTrend,
    topProducts,
    refundSummary,
  };
}
