import { describe, expect, it } from 'vitest';
import { formatCurrency, formatRate, getTrendHeight } from './dashboard-format';

describe('dashboard formatters', () => {
  it('formats currency without fractional noise', () => {
    expect(formatCurrency(1316)).toBe('¥1,316');
    expect(formatCurrency(618.5)).toBe('¥618.50');
  });

  it('formats rates as percentages', () => {
    expect(formatRate(0.3184)).toBe('31.84%');
  });

  it('keeps trend bars visible when values are non-zero', () => {
    expect(getTrendHeight(200, 1000)).toBe(20);
    expect(getTrendHeight(0, 1000)).toBe(0);
  });
});
