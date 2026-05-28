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

export type OrderListItem = {
  id: string;
  orderNo: string;
  platform: string;
  placedAt: string;
  status: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  customerRegion: string | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    grossAmount: number;
    netAmount: number;
    product: {
      sku: string;
      name: string;
      category: string;
    };
    refunds: Array<{
      refundNo: string;
      status: string;
      amount: number;
    }>;
  }>;
  refunds: Array<{
    id: string;
    refundNo: string;
    status: string;
    amount: number;
    requestedAt: string;
    completedAt: string | null;
    reason: string;
  }>;
};

export type OrdersResponse = {
  page: number;
  pageSize: number;
  total: number;
  orders: OrderListItem[];
};

export type RefundListItem = {
  id: string;
  refundNo: string;
  reason: string;
  status: string;
  amount: number;
  requestedAt: string;
  completedAt: string | null;
  note: string | null;
  order: {
    orderNo: string;
    platform: string;
    placedAt: string;
  };
  product: {
    sku: string;
    name: string;
    category: string;
  } | null;
};

export type RefundsResponse = {
  page: number;
  pageSize: number;
  total: number;
  refunds: RefundListItem[];
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

function buildFilterParams(filters: DashboardFilters): URLSearchParams {
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

  return params;
}

export async function fetchOrders(
  filters: DashboardFilters,
  options: { date?: string; page: number; pageSize: number },
): Promise<OrdersResponse> {
  const params = buildFilterParams(filters);
  params.set('page', String(options.page));
  params.set('pageSize', String(options.pageSize));

  if (options.date) {
    params.set('date', options.date);
  }

  return getJson<OrdersResponse>(`/orders?${params}`);
}

export async function fetchRefunds(
  filters: DashboardFilters,
  options: { page: number; pageSize: number },
): Promise<RefundsResponse> {
  const params = buildFilterParams(filters);
  params.set('page', String(options.page));
  params.set('pageSize', String(options.pageSize));

  return getJson<RefundsResponse>(`/refunds?${params}`);
}

export async function updateRefundStatus(
  refundId: string,
  status: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/refunds/${refundId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}
