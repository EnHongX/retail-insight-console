import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const baseDate = new Date('2026-05-28T00:00:00.000Z');

const products = [
  {
    sku: 'RI-DRIP-001',
    name: 'Pour Over Coffee Kit',
    category: 'Kitchen',
    brand: 'North Peak',
    price: '299.00',
    cost: '142.00',
  },
  {
    sku: 'RI-LAMP-002',
    name: 'Desk Lamp Pro',
    category: 'Home Electronics',
    brand: 'Luma',
    price: '459.00',
    cost: '218.00',
  },
  {
    sku: 'RI-BAG-003',
    name: 'Commuter Backpack',
    category: 'Bags',
    brand: 'MetroLine',
    price: '389.00',
    cost: '176.00',
  },
  {
    sku: 'RI-MAT-004',
    name: 'Yoga Training Mat',
    category: 'Sports',
    brand: 'FlexWay',
    price: '169.00',
    cost: '72.00',
  },
  {
    sku: 'RI-MUG-005',
    name: 'Insulated Travel Mug',
    category: 'Kitchen',
    brand: 'North Peak',
    price: '129.00',
    cost: '48.00',
  },
  {
    sku: 'RI-CHAIR-006',
    name: 'Ergonomic Office Chair',
    category: 'Home Office',
    brand: 'WorkWell',
    price: '899.00',
    cost: '410.00',
  },
  {
    sku: 'RI-HEAD-007',
    name: 'Noise Canceling Headphones',
    category: 'Electronics',
    brand: 'Auralink',
    price: '699.00',
    cost: '332.00',
  },
  {
    sku: 'RI-SHOE-008',
    name: 'Trail Running Shoes',
    category: 'Sports',
    brand: 'FlexWay',
    price: '529.00',
    cost: '246.00',
  },
  {
    sku: 'RI-CAM-009',
    name: 'Creator Action Camera',
    category: 'Electronics',
    brand: 'Auralink',
    price: '1299.00',
    cost: '670.00',
  },
  {
    sku: 'RI-DESK-010',
    name: 'Adjustable Standing Desk',
    category: 'Home Office',
    brand: 'WorkWell',
    price: '1599.00',
    cost: '760.00',
  },
];

const productBySku = new Map(products.map((product) => [product.sku, product]));
const platforms = ['tmall', 'jd', 'douyin'];
const regions = ['Shanghai', 'Beijing', 'Guangdong', 'Zhejiang', 'Sichuan'];
const revenueStatuses = ['COMPLETED', 'PAID', 'SHIPPED'];
const orders = [];
const orderItems = [];
const refunds = [];

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function money(value) {
  return value.toFixed(2);
}

function getProduct(sku) {
  const product = productBySku.get(sku);

  if (!product) {
    throw new Error(`Missing product fixture ${sku}`);
  }

  return product;
}

function createOrder({
  dayOffset,
  sequence,
  platform,
  status,
  region,
  lines,
  discount = 0,
}) {
  const placedAt = addDays(baseDate, dayOffset);
  placedAt.setUTCHours(2 + (sequence % 14), (sequence * 7) % 60, 0, 0);

  const orderNo = `ORD-202605${String(28 + dayOffset).padStart(2, '0')}-${String(sequence).padStart(4, '0')}`;
  const grossAmount = lines.reduce((sum, line) => {
    const product = getProduct(line.sku);
    return sum + Number(product.price) * line.quantity;
  }, 0);
  const netAmount = revenueStatuses.includes(status)
    ? Math.max(grossAmount - discount, 0)
    : 0;

  orders.push({
    orderNo,
    platform,
    placedAt,
    status,
    grossAmount: money(grossAmount),
    discountAmount: money(discount),
    netAmount: money(netAmount),
    customerRegion: region,
  });

  const grossDiscountRatio = grossAmount > 0 ? discount / grossAmount : 0;

  for (const line of lines) {
    const product = getProduct(line.sku);
    const lineGrossAmount = Number(product.price) * line.quantity;
    const lineDiscountAmount = revenueStatuses.includes(status)
      ? lineGrossAmount * grossDiscountRatio
      : 0;
    const lineNetAmount = revenueStatuses.includes(status)
      ? lineGrossAmount - lineDiscountAmount
      : 0;

    orderItems.push({
      orderNo,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: product.price,
      discountAmount: money(lineDiscountAmount),
      grossAmount: money(lineGrossAmount),
      netAmount: money(lineNetAmount),
    });
  }

  return orderNo;
}

function addRefund({
  orderNo,
  sku,
  index,
  reason,
  status,
  requestedOffsetHours,
  completedOffsetHours,
  amount,
  note,
}) {
  const order = orders.find((item) => item.orderNo === orderNo);

  if (!order) {
    throw new Error(`Missing order fixture ${orderNo}`);
  }

  const requestedAt = new Date(order.placedAt);
  requestedAt.setUTCHours(requestedAt.getUTCHours() + requestedOffsetHours);

  const completedAt = completedOffsetHours == null ? null : new Date(order.placedAt);
  if (completedAt) {
    completedAt.setUTCHours(completedAt.getUTCHours() + completedOffsetHours);
  }

  refunds.push({
    refundNo: `REF-${orderNo.slice(4)}-${String(index).padStart(2, '0')}`,
    orderNo,
    sku,
    reason,
    status,
    requestedAt,
    completedAt,
    amount: money(amount),
    note,
  });
}

for (let day = -29; day <= 0; day += 1) {
  const dayIndex = day + 29;
  const firstSku = products[dayIndex % products.length].sku;
  const secondSku = products[(dayIndex + 3) % products.length].sku;
  const thirdSku = products[(dayIndex + 6) % products.length].sku;
  const platform = platforms[dayIndex % platforms.length];
  const secondaryPlatform = platforms[(dayIndex + 1) % platforms.length];
  const status = revenueStatuses[dayIndex % revenueStatuses.length];
  const dailyDiscount = (dayIndex % 5) * 18;

  const mainOrderNo = createOrder({
    dayOffset: day,
    sequence: dayIndex + 1,
    platform,
    status,
    region: regions[dayIndex % regions.length],
    discount: dailyDiscount,
    lines: [
      { sku: firstSku, quantity: 1 + (dayIndex % 3) },
      { sku: secondSku, quantity: 1 },
    ],
  });

  if (dayIndex % 2 === 0) {
    createOrder({
      dayOffset: day,
      sequence: 100 + dayIndex,
      platform: secondaryPlatform,
      status: dayIndex % 6 === 0 ? 'CANCELLED' : revenueStatuses[(dayIndex + 1) % 3],
      region: regions[(dayIndex + 2) % regions.length],
      discount: dayIndex % 4 === 0 ? 35 : 0,
      lines: [{ sku: thirdSku, quantity: 1 + (dayIndex % 2) }],
    });
  }

  if (dayIndex % 9 === 0) {
    createOrder({
      dayOffset: day,
      sequence: 200 + dayIndex,
      platform: platforms[(dayIndex + 2) % platforms.length],
      status: 'PENDING_PAYMENT',
      region: regions[(dayIndex + 3) % regions.length],
      lines: [{ sku: secondSku, quantity: 1 }],
    });
  }

  if (dayIndex % 7 === 0) {
    addRefund({
      orderNo: mainOrderNo,
      sku: firstSku,
      index: dayIndex,
      reason: dayIndex % 14 === 0 ? 'QUALITY_ISSUE' : 'PRICE_ADJUSTMENT',
      status: 'COMPLETED',
      requestedOffsetHours: 8,
      completedOffsetHours: dayIndex % 14 === 0 ? 32 : 10,
      amount: 45 + (dayIndex % 4) * 35,
      note: 'Completed refund fixture for metric validation.',
    });
  }

  if (dayIndex % 11 === 0) {
    addRefund({
      orderNo: mainOrderNo,
      sku: secondSku,
      index: 400 + dayIndex,
      reason: 'CUSTOMER_RETURN',
      status: dayIndex % 22 === 0 ? 'APPROVED' : 'REQUESTED',
      requestedOffsetHours: 14,
      completedOffsetHours: null,
      amount: 90 + (dayIndex % 5) * 20,
      note: 'Pending refund fixture for workflow filtering.',
    });
  }

  if (dayIndex % 13 === 0) {
    addRefund({
      orderNo: mainOrderNo,
      sku: firstSku,
      index: 700 + dayIndex,
      reason: 'OTHER',
      status: 'REJECTED',
      requestedOffsetHours: 18,
      completedOffsetHours: null,
      amount: 60,
      note: 'Rejected refund fixture for status filters.',
    });
  }
}

async function main() {
  await prisma.$transaction([
    prisma.refund.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
  ]);

  const productRecords = new Map();
  const orderRecords = new Map();
  const itemRecords = new Map();

  for (const product of products) {
    const created = await prisma.product.create({ data: product });
    productRecords.set(created.sku, created);
  }

  for (const order of orders) {
    const created = await prisma.order.create({ data: order });
    orderRecords.set(created.orderNo, created);
  }

  for (const item of orderItems) {
    const order = orderRecords.get(item.orderNo);
    const product = productRecords.get(item.sku);

    if (!order || !product) {
      throw new Error(`Missing order or product for ${item.orderNo}/${item.sku}`);
    }

    const created = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        grossAmount: item.grossAmount,
        netAmount: item.netAmount,
      },
    });

    itemRecords.set(`${item.orderNo}:${item.sku}`, created);
  }

  for (const refund of refunds) {
    const order = orderRecords.get(refund.orderNo);
    const product = productRecords.get(refund.sku);
    const orderItem = itemRecords.get(`${refund.orderNo}:${refund.sku}`);

    if (!order || !product || !orderItem) {
      throw new Error(`Missing refund relation for ${refund.refundNo}`);
    }

    await prisma.refund.create({
      data: {
        refundNo: refund.refundNo,
        orderId: order.id,
        orderItemId: orderItem.id,
        productId: product.id,
        reason: refund.reason,
        status: refund.status,
        requestedAt: refund.requestedAt,
        completedAt: refund.completedAt,
        amount: refund.amount,
        note: refund.note,
      },
    });
  }

  console.log(
    `Seeded ${products.length} products, ${orders.length} orders, ${orderItems.length} order items, ${refunds.length} refunds.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
