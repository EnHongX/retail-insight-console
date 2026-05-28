export function formatCurrency(value: number): string {
  const hasFraction = !Number.isInteger(value);

  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRate(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getTrendHeight(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  return Math.max(8, Math.round((value / maxValue) * 100));
}
