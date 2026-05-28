import { useEffect, useMemo, useState } from 'react';
import {
  type DashboardData,
  type DashboardPeriod,
  fetchDashboardData,
} from './api';
import './App.css';
import { formatCurrency, formatRate, getTrendHeight } from './dashboard-format';

const periods: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'today', label: '今日' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
];

export function App() {
  const [period, setPeriod] = useState<DashboardPeriod>('7d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);
    setError(null);

    fetchDashboardData(period)
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
  }, [period]);

  const maxGmv = useMemo(() => {
    return Math.max(
      0,
      ...(data?.salesTrend.points.map((point) => point.gmv) ?? []),
    );
  }, [data]);

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
              className={period === item.value ? 'active' : ''}
              key={item.value}
              onClick={() => setPeriod(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="dashboard">
        <div className={`status-line${error ? ' error' : ''}`}>
          {isLoading ? '正在加载运营数据' : error}
        </div>

        <section className="kpi-grid" aria-label="核心指标">
          <KpiCard
            label="GMV"
            note="有效订单成交额"
            value={formatCurrency(data?.summary.gmv ?? 0)}
          />
          <KpiCard
            label="订单数"
            note="已支付/已发货/已完成"
            value={`${data?.summary.orderCount ?? 0}`}
          />
          <KpiCard
            label="退款率"
            note={`${formatCurrency(data?.summary.refundAmount ?? 0)} 已完成退款`}
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
              <span>按下单日统计</span>
            </div>
            {data && data.salesTrend.points.length > 0 ? (
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
            ) : (
              <div className="empty-state">暂无趋势数据</div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>退款概览</h2>
              <span>按申请时间统计</span>
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
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>商品销售排行</h2>
            <span>按销量排序</span>
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
