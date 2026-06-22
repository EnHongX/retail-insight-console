import { PrismaClient } from '@prisma/client';
import { buildSeedData } from './seed-data.mjs';

const prisma = new PrismaClient();
const { products, orders, orderItems, refunds } = buildSeedData();

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
