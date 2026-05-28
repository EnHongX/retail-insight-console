import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
];

const orders = [
  {
    orderNo: 'ORD-20260528-0001',
    platform: 'tmall',
    placedAt: new Date('2026-05-28T02:20:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '758.00',
    discountAmount: '60.00',
    netAmount: '698.00',
    customerRegion: 'Shanghai',
  },
  {
    orderNo: 'ORD-20260528-0002',
    platform: 'jd',
    placedAt: new Date('2026-05-28T04:05:00.000Z'),
    status: 'PAID',
    grossAmount: '558.00',
    discountAmount: '20.00',
    netAmount: '538.00',
    customerRegion: 'Beijing',
  },
  {
    orderNo: 'ORD-20260527-0003',
    platform: 'douyin',
    placedAt: new Date('2026-05-27T13:42:00.000Z'),
    status: 'SHIPPED',
    grossAmount: '338.00',
    discountAmount: '0.00',
    netAmount: '338.00',
    customerRegion: 'Guangdong',
  },
  {
    orderNo: 'ORD-20260526-0004',
    platform: 'tmall',
    placedAt: new Date('2026-05-26T09:10:00.000Z'),
    status: 'CANCELLED',
    grossAmount: '389.00',
    discountAmount: '0.00',
    netAmount: '0.00',
    customerRegion: 'Zhejiang',
  },
  {
    orderNo: 'ORD-20260526-0005',
    platform: 'jd',
    placedAt: new Date('2026-05-26T11:24:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '899.00',
    discountAmount: '120.00',
    netAmount: '779.00',
    customerRegion: 'Jiangsu',
  },
  {
    orderNo: 'ORD-20260525-0006',
    platform: 'tmall',
    placedAt: new Date('2026-05-25T03:18:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '1257.00',
    discountAmount: '88.00',
    netAmount: '1169.00',
    customerRegion: 'Sichuan',
  },
  {
    orderNo: 'ORD-20260525-0007',
    platform: 'douyin',
    placedAt: new Date('2026-05-25T14:52:00.000Z'),
    status: 'SHIPPED',
    grossAmount: '387.00',
    discountAmount: '30.00',
    netAmount: '357.00',
    customerRegion: 'Hubei',
  },
  {
    orderNo: 'ORD-20260524-0008',
    platform: 'jd',
    placedAt: new Date('2026-05-24T07:40:00.000Z'),
    status: 'PAID',
    grossAmount: '699.00',
    discountAmount: '0.00',
    netAmount: '699.00',
    customerRegion: 'Fujian',
  },
  {
    orderNo: 'ORD-20260523-0009',
    platform: 'tmall',
    placedAt: new Date('2026-05-23T05:35:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '1456.00',
    discountAmount: '156.00',
    netAmount: '1300.00',
    customerRegion: 'Shanghai',
  },
  {
    orderNo: 'ORD-20260522-0010',
    platform: 'douyin',
    placedAt: new Date('2026-05-22T10:12:00.000Z'),
    status: 'PENDING_PAYMENT',
    grossAmount: '529.00',
    discountAmount: '0.00',
    netAmount: '0.00',
    customerRegion: 'Henan',
  },
  {
    orderNo: 'ORD-20260521-0011',
    platform: 'jd',
    placedAt: new Date('2026-05-21T12:22:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '1058.00',
    discountAmount: '100.00',
    netAmount: '958.00',
    customerRegion: 'Beijing',
  },
  {
    orderNo: 'ORD-20260520-0012',
    platform: 'tmall',
    placedAt: new Date('2026-05-20T09:05:00.000Z'),
    status: 'COMPLETED',
    grossAmount: '597.00',
    discountAmount: '30.00',
    netAmount: '567.00',
    customerRegion: 'Guangdong',
  },
];

const orderItems = [
  {
    orderNo: 'ORD-20260528-0001',
    sku: 'RI-DRIP-001',
    quantity: 1,
    unitPrice: '299.00',
    discountAmount: '20.00',
    grossAmount: '299.00',
    netAmount: '279.00',
  },
  {
    orderNo: 'ORD-20260528-0001',
    sku: 'RI-LAMP-002',
    quantity: 1,
    unitPrice: '459.00',
    discountAmount: '40.00',
    grossAmount: '459.00',
    netAmount: '419.00',
  },
  {
    orderNo: 'ORD-20260528-0002',
    sku: 'RI-BAG-003',
    quantity: 1,
    unitPrice: '389.00',
    discountAmount: '20.00',
    grossAmount: '389.00',
    netAmount: '369.00',
  },
  {
    orderNo: 'ORD-20260528-0002',
    sku: 'RI-MAT-004',
    quantity: 1,
    unitPrice: '169.00',
    discountAmount: '0.00',
    grossAmount: '169.00',
    netAmount: '169.00',
  },
  {
    orderNo: 'ORD-20260527-0003',
    sku: 'RI-MAT-004',
    quantity: 2,
    unitPrice: '169.00',
    discountAmount: '0.00',
    grossAmount: '338.00',
    netAmount: '338.00',
  },
  {
    orderNo: 'ORD-20260526-0005',
    sku: 'RI-CHAIR-006',
    quantity: 1,
    unitPrice: '899.00',
    discountAmount: '120.00',
    grossAmount: '899.00',
    netAmount: '779.00',
  },
  {
    orderNo: 'ORD-20260525-0006',
    sku: 'RI-HEAD-007',
    quantity: 1,
    unitPrice: '699.00',
    discountAmount: '50.00',
    grossAmount: '699.00',
    netAmount: '649.00',
  },
  {
    orderNo: 'ORD-20260525-0006',
    sku: 'RI-SHOE-008',
    quantity: 1,
    unitPrice: '529.00',
    discountAmount: '38.00',
    grossAmount: '529.00',
    netAmount: '491.00',
  },
  {
    orderNo: 'ORD-20260525-0006',
    sku: 'RI-MUG-005',
    quantity: 1,
    unitPrice: '129.00',
    discountAmount: '0.00',
    grossAmount: '129.00',
    netAmount: '129.00',
  },
  {
    orderNo: 'ORD-20260525-0007',
    sku: 'RI-MUG-005',
    quantity: 3,
    unitPrice: '129.00',
    discountAmount: '30.00',
    grossAmount: '387.00',
    netAmount: '357.00',
  },
  {
    orderNo: 'ORD-20260524-0008',
    sku: 'RI-HEAD-007',
    quantity: 1,
    unitPrice: '699.00',
    discountAmount: '0.00',
    grossAmount: '699.00',
    netAmount: '699.00',
  },
  {
    orderNo: 'ORD-20260523-0009',
    sku: 'RI-DRIP-001',
    quantity: 2,
    unitPrice: '299.00',
    discountAmount: '58.00',
    grossAmount: '598.00',
    netAmount: '540.00',
  },
  {
    orderNo: 'ORD-20260523-0009',
    sku: 'RI-SHOE-008',
    quantity: 1,
    unitPrice: '529.00',
    discountAmount: '70.00',
    grossAmount: '529.00',
    netAmount: '459.00',
  },
  {
    orderNo: 'ORD-20260523-0009',
    sku: 'RI-MUG-005',
    quantity: 3,
    unitPrice: '129.00',
    discountAmount: '28.00',
    grossAmount: '387.00',
    netAmount: '359.00',
  },
  {
    orderNo: 'ORD-20260522-0010',
    sku: 'RI-SHOE-008',
    quantity: 1,
    unitPrice: '529.00',
    discountAmount: '0.00',
    grossAmount: '529.00',
    netAmount: '0.00',
  },
  {
    orderNo: 'ORD-20260521-0011',
    sku: 'RI-SHOE-008',
    quantity: 2,
    unitPrice: '529.00',
    discountAmount: '100.00',
    grossAmount: '1058.00',
    netAmount: '958.00',
  },
  {
    orderNo: 'ORD-20260520-0012',
    sku: 'RI-DRIP-001',
    quantity: 1,
    unitPrice: '299.00',
    discountAmount: '15.00',
    grossAmount: '299.00',
    netAmount: '284.00',
  },
  {
    orderNo: 'ORD-20260520-0012',
    sku: 'RI-MUG-005',
    quantity: 2,
    unitPrice: '129.00',
    discountAmount: '15.00',
    grossAmount: '258.00',
    netAmount: '243.00',
  },
];

const refunds = [
  {
    refundNo: 'REF-20260528-0001',
    orderNo: 'ORD-20260528-0001',
    sku: 'RI-LAMP-002',
    reason: 'QUALITY_ISSUE',
    status: 'COMPLETED',
    requestedAt: new Date('2026-05-28T05:00:00.000Z'),
    completedAt: new Date('2026-05-28T06:15:00.000Z'),
    amount: '419.00',
    note: 'Lamp shade damaged during shipping. Full refund issued.',
  },
  {
    refundNo: 'REF-20260528-0002',
    orderNo: 'ORD-20260528-0002',
    sku: 'RI-MAT-004',
    reason: 'CUSTOMER_RETURN',
    status: 'REQUESTED',
    requestedAt: new Date('2026-05-28T07:30:00.000Z'),
    completedAt: null,
    amount: '169.00',
    note: 'Customer requested a return. Pending review.',
  },
  {
    refundNo: 'REF-20260525-0003',
    orderNo: 'ORD-20260525-0006',
    sku: 'RI-HEAD-007',
    reason: 'PRICE_ADJUSTMENT',
    status: 'COMPLETED',
    requestedAt: new Date('2026-05-25T07:00:00.000Z'),
    completedAt: new Date('2026-05-25T08:20:00.000Z'),
    amount: '50.00',
    note: 'Price adjustment refund completed.',
  },
  {
    refundNo: 'REF-20260523-0004',
    orderNo: 'ORD-20260523-0009',
    sku: 'RI-DRIP-001',
    reason: 'LOGISTICS_ISSUE',
    status: 'APPROVED',
    requestedAt: new Date('2026-05-24T02:30:00.000Z'),
    completedAt: null,
    amount: '120.00',
    note: 'Delivery delay compensation approved.',
  },
  {
    refundNo: 'REF-20260521-0005',
    orderNo: 'ORD-20260521-0011',
    sku: 'RI-SHOE-008',
    reason: 'OTHER',
    status: 'REJECTED',
    requestedAt: new Date('2026-05-22T01:10:00.000Z'),
    completedAt: null,
    amount: '100.00',
    note: 'Refund request rejected after review.',
  },
];

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
