import { describe, expect, it } from 'vitest';
import {
  dashboardViews,
  getViewAfterTrendSelection,
  isDashboardView,
} from './dashboard-view';

describe('dashboard view navigation', () => {
  it('defines overview, orders, and refunds as the only navigation views', () => {
    expect(dashboardViews.map((view) => view.value)).toEqual([
      'overview',
      'orders',
      'refunds',
    ]);
  });

  it('guards unknown view values', () => {
    expect(isDashboardView('orders')).toBe(true);
    expect(isDashboardView('detail')).toBe(false);
  });

  it('moves users to the orders view when a trend date is selected', () => {
    expect(getViewAfterTrendSelection('overview', '2026-05-28')).toBe('orders');
    expect(getViewAfterTrendSelection('refunds', null)).toBe('refunds');
  });
});
