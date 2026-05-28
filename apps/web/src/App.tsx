import { useEffect, useMemo, useState } from 'react';
import {
  type DashboardData,
  type DashboardFilters,
  type DashboardPeriod,
  type ProductSort,
  fetchDashboardData,
} from './api';
import './App.css';
import { formatCurrency, formatRate, getTrendHeight } from './dashboard-format';
import {
  parseDashboardFilters,
  serializeDashboardFilters,
} from './dashboard-state';

const periods: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'today', label: '今日' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
];

const productSorts: Array<{ value: ProductSort; label: string }> = [
  { value: 'quantity', label: '按销量' },
  { value: 'netSales', label: '按销售额' },
];

export function App() {
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    parseDashboardFilters(window.location.search),
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = serializeDashboardFilters(filters);
    const nextUrl = `${window.location.pathname}${query}`;

    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [filters]);

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);
    setError(null);

    fetchDashboardData(filters)
      .then((nextData) => {
        if (!ignore) {
          setData(nextData);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('无法连接后端数据服务');
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filters]);

  const maxGmv = useMemo(() => {
    return Math.max(
      0,
      ...(data?.salesTrend.points.map((point) => point.gmv) ?? []),
    );
  }, [data]);
  const maxOrders = useMemo(() => {
    return Math.max(
      0,
      ...(data?.salesTrend.points.map((point) => point.orderCount) ?? []),
    );
  }, [data]);

  function updateFilters(nextFilters: Partial<DashboardFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <h1>Retail Insight Console</h1>
          <p>电商运营数据看板</p>
        </div>
        <div className="period-tabs" aria-label="选择统计周期">
          {periods.map((item) => (
            <button
              className={filters.period === item.value ? 'active' : ''}
              key={item.value}
              onClick={() => updateFilters({ period: item.value })}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="dashboard">
        <section className="filter-panel" aria-label="筛选条件">
          <label>
            平台
            <select
              onChange={(event) => updateFilters({ platform: event.target.value })}
              value={filters.platform}
            >
              <option value="all">全部平台</option>
              {(data?.filterOptions.platforms ?? []).map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>
          <label>
            分类
            <select
              onChange={(event) => updateFilters({ category: event.target.value })}
              value={filters.category}
            >
              <option value="all">全部分类</option>
              {(data?.filterOptions.categories ?? []).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            商品搜索
            <input
              onChange={(event) =>
                updateFilters({ productSearch: event.target.value })
              }
              placeholder="名称或 SKU"
              value={filters.productSearch}
            />
          </label>
          <label>
            退款状态
            <select
              onChange={(event) =>
                updateFilters({ refundStatus: event.target.value })
              }
              value={filters.refundStatus}
            >
              <option value="all">全部状态</option>
              {(data?.filterOptions.refundStatuses ?? []).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className={`status-line${error ? ' error' : ''}`}>
          {isLoading ? '正在加载运营数据' : error}
        </div>

        <section className="kpi-grid" aria-label="核心指标">
          <KpiCard
            label="GMV"
            note="按订单 placedAt 统计"
            value={formatCurrency(data?.summary.gmv ?? 0)}
          />
          <KpiCard
            label="订单数"
            note="有效订单状态过滤"
            value={`${data?.summary.orderCount ?? 0}`}
          />
          <KpiCard
            label="退款率"
            note="按退款 completedAt 统计"
            value={formatRate(data?.summary.refundRate ?? 0)}
          />
          <KpiCard
            label="客单价"
            note="净销售额 / 订单数"
            value={formatCurrency(data?.summary.averageOrderValue ?? 0)}
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>销售趋势</h2>
              <span>柱：GMV / 线：订单数</span>
            </div>
            {data && data.salesTrend.points.length > 0 ? (
              <div className="combo-chart">
                <svg className="line-chart" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline
                    fill="none"
                    points={data.salesTrend.points
                      .map((point, index, points) => {
                        const x =
                          points.length === 1
                            ? 50
                            : (index / (points.length - 1)) * 100;
                        const y =
                          maxOrders === 0 ? 100 : 100 - (point.orderCount / maxOrders) * 92;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    stroke="#b45309"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="trend-chart">
                  {data.salesTrend.points.map((point) => (
                    <div className="trend-bar-wrap" key={point.date}>
                      <div
                        aria-label={`${point.date} GMV ${point.gmv}`}
                        className="trend-bar"
                        style={{
                          height: `${getTrendHeight(point.gmv, maxGmv)}%`,
                        }}
                      />
                      <div className="trend-date">{point.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">暂无趋势数据</div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>退款概览</h2>
              <span>完成退款按 completedAt</span>
            </div>
            <div className="refund-grid">
              <div className="refund-metric">
                <span>已完成金额</span>
                <strong>
                  {formatCurrency(data?.refundSummary.completedAmount ?? 0)}
                </strong>
              </div>
              <div className="refund-metric">
                <span>已完成单数</span>
                <strong>{data?.refundSummary.completedCount ?? 0}</strong>
              </div>
              <div className="refund-metric">
                <span>待处理单数</span>
                <strong>{data?.refundSummary.pendingCount ?? 0}</strong>
              </div>
              <div className="refund-metric">
                <span>已拒绝单数</span>
                <strong>{data?.refundSummary.rejectedCount ?? 0}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>商品销售排行</h2>
            <div className="sort-tabs" aria-label="商品排行排序">
              {productSorts.map((item) => (
                <button
                  className={filters.sort === item.value ? 'active' : ''}
                  key={item.value}
                  onClick={() => updateFilters({ sort: item.value })}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {data && data.topProducts.products.length > 0 ? (
            <table className="product-table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th>分类</th>
                  <th className="numeric">销量</th>
                  <th className="numeric">销售额</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.products.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <div className="product-name">
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td className="numeric">{product.quantity}</td>
                    <td className="numeric">{formatCurrency(product.netSales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">暂无商品排行数据</div>
          )}
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </article>
  );
}
