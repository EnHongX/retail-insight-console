import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd, exit } from 'node:process';

const root = cwd();

const checks = [
  {
    file: 'docs/product/metrics.md',
    snippets: ['GMV', '退款率', '客单价', '商品销售排行', '时间口径'],
  },
  {
    file: 'apps/api/prisma/schema.prisma',
    snippets: [
      'model Product',
      'model Order',
      'model OrderItem',
      'model Refund',
      'enum OrderStatus',
      'enum RefundStatus',
      'placedAt',
      'netAmount',
    ],
  },
  {
    file: 'apps/api/prisma/seed.mjs',
    snippets: ['PrismaClient', 'products', 'orders', 'orderItems', 'refunds'],
  },
];

const failures = [];

for (const check of checks) {
  let content = '';

  try {
    content = readFileSync(join(root, check.file), 'utf8');
  } catch {
    failures.push(`${check.file}: file is missing`);
    continue;
  }

  for (const snippet of check.snippets) {
    if (!content.includes(snippet)) {
      failures.push(`${check.file}: missing "${snippet}"`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  exit(1);
}

console.log('Retail domain baseline is defined.');
