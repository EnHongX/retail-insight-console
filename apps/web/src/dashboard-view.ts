export type DashboardView = 'overview' | 'orders' | 'refunds';

export const dashboardViews: Array<{ value: DashboardView; label: string }> = [
  { value: 'overview', label: '运营概览' },
  { value: 'orders', label: '订单明细' },
  { value: 'refunds', label: '退款工作台' },
];

export function isDashboardView(value: string): value is DashboardView {
  return dashboardViews.some((view) => view.value === value);
}

export function getViewAfterTrendSelection(
  currentView: DashboardView,
  selectedDate: string | null,
): DashboardView {
  return selectedDate ? 'orders' : currentView;
}
