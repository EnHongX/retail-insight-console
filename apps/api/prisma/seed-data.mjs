const revenueStatuses = ['COMPLETED', 'PAID', 'SHIPPED'];

export const products = [
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
  {
    sku: 'RI-CREAM-011',
    name: 'Hydrating Face Cream',
    category: 'Beauty',
    brand: 'ClearSpring',
    price: '89.00',
    cost: '31.00',
  },
  {
    sku: 'RI-SERUM-012',
    name: 'Vitamin C Serum',
    category: 'Beauty',
    brand: 'ClearSpring',
    price: '219.00',
    cost: '86.00',
  },
  {
    sku: 'RI-TOY-013',
    name: 'STEM Building Blocks',
    category: 'Kids',
    brand: 'BrightBox',
    price: '159.00',
    cost: '63.00',
  },
  {
    sku: 'RI-STROLLER-014',
    name: 'Compact Travel Stroller',
    category: 'Kids',
    brand: 'BrightBox',
    price: '1899.00',
    cost: '920.00',
  },
  {
    sku: 'RI-FOOD-015',
    name: 'Freeze Dried Pet Food',
    category: 'Pet Care',
    brand: 'PawField',
    price: '239.00',
    cost: '108.00',
  },
  {
    sku: 'RI-LITTER-016',
    name: 'Smart Cat Litter Box',
    category: 'Pet Care',
    brand: 'PawField',
    price: '2199.00',
    cost: '1120.00',
  },
  {
    sku: 'RI-NOTE-017',
    name: 'Executive Notebook Set',
    category: 'Stationery',
    brand: 'PaperTrail',
    price: '79.00',
    cost: '24.00',
  },
  {
    sku: 'RI-PEN-018',
    name: 'Fountain Pen Gift Box',
    category: 'Stationery',
    brand: 'PaperTrail',
    price: '499.00',
    cost: '188.00',
  },
  {
    sku: 'RI-WATCH-019',
    name: 'Hybrid Smart Watch',
    category: 'Wearables',
    brand: 'PulseArc',
    price: '1199.00',
    cost: '570.00',
  },
  {
    sku: 'RI-RING-020',
    name: 'Sleep Tracking Ring',
    category: 'Wearables',
    brand: 'PulseArc',
    price: '1699.00',
    cost: '790.00',
  },
];

const productBySku = new Map(products.map((product) => [product.sku, product]));
const platforms = ['tmall', 'jd', 'douyin'];
const regions = [
  'Shanghai',
  'Beijing',
  'Guangdong',
  'Zhejiang',
  'Sichuan',
  'Hubei',
  'Jiangsu',
  'Fujian',
  'Chongqing',
  'Shandong',
  'Henan',
  'Shaanxi',
];
const refundReasons = [
  'CUSTOMER_RETURN',
  'QUALITY_ISSUE',
  'PRICE_ADJUSTMENT',
  'LOGISTICS_ISSUE',
  'OTHER',
];

function normalizeBaseDate(baseDate = new Date()) {
  const normalized = new Date(baseDate);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
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

export function buildSeedData({ baseDate = new Date() } = {}) {
  const normalizedBaseDate = normalizeBaseDate(baseDate);
  const orders = [];
  const orderItems = [];
  const refunds = [];

  function createOrder({
    dayOffset,
    sequence,
    platform,
    status,
    region,
    lines,
    discount = 0,
  }) {
    const placedAt = addDays(normalizedBaseDate, dayOffset);
    placedAt.setUTCHours(1 + (sequence % 18), (sequence * 11) % 60, 0, 0);

    const orderNo = `ORD-${formatDateKey(placedAt)}-${String(sequence).padStart(4, '0')}`;
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
      refundNo: `REF-${orderNo.slice(4)}-${String(index).padStart(3, '0')}`,
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

  for (let day = -59; day <= 0; day += 1) {
    const dayIndex = day + 59;
    const firstSku = products[dayIndex % products.length].sku;
    const secondSku = products[(dayIndex + 5) % products.length].sku;
    const thirdSku = products[(dayIndex + 11) % products.length].sku;
    const fourthSku = products[(dayIndex + 17) % products.length].sku;
    const primaryPlatform = platforms[dayIndex % platforms.length];
    const secondaryPlatform = platforms[(dayIndex + 1) % platforms.length];
    const tertiaryPlatform = platforms[(dayIndex + 2) % platforms.length];
    const dailyDiscount = (dayIndex % 6) * 22;

    const mainOrderNo = createOrder({
      dayOffset: day,
      sequence: dayIndex + 1,
      platform: primaryPlatform,
      status: revenueStatuses[dayIndex % revenueStatuses.length],
      region: regions[dayIndex % regions.length],
      discount: dailyDiscount,
      lines: [
        { sku: firstSku, quantity: 1 + (dayIndex % 3) },
        { sku: secondSku, quantity: 1 + (dayIndex % 2) },
      ],
    });

    createOrder({
      dayOffset: day,
      sequence: 200 + dayIndex,
      platform: secondaryPlatform,
      status: dayIndex % 5 === 0 ? 'CANCELLED' : revenueStatuses[(dayIndex + 1) % 3],
      region: regions[(dayIndex + 4) % regions.length],
      discount: dayIndex % 4 === 0 ? 48 : 0,
      lines: [{ sku: thirdSku, quantity: 1 + (dayIndex % 4) }],
    });

    if (dayIndex % 3 === 0) {
      createOrder({
        dayOffset: day,
        sequence: 400 + dayIndex,
        platform: tertiaryPlatform,
        status: 'PENDING_PAYMENT',
        region: regions[(dayIndex + 7) % regions.length],
        lines: [{ sku: fourthSku, quantity: 1 }],
      });
    }

    if (dayIndex % 4 === 0) {
      addRefund({
        orderNo: mainOrderNo,
        sku: firstSku,
        index: dayIndex,
        reason: refundReasons[dayIndex % refundReasons.length],
        status: 'COMPLETED',
        requestedOffsetHours: 8,
        completedOffsetHours: dayIndex % 8 === 0 ? 34 : 12,
        amount: 45 + (dayIndex % 5) * 40,
        note: 'Completed refund fixture for metric validation.',
      });
    }

    if (dayIndex % 6 === 0) {
      addRefund({
        orderNo: mainOrderNo,
        sku: secondSku,
        index: 300 + dayIndex,
        reason: refundReasons[(dayIndex + 1) % refundReasons.length],
        status: dayIndex % 12 === 0 ? 'APPROVED' : 'REQUESTED',
        requestedOffsetHours: 15,
        completedOffsetHours: null,
        amount: 90 + (dayIndex % 6) * 25,
        note: 'Pending refund fixture for workflow filtering.',
      });
    }

    if (dayIndex % 10 === 0) {
      addRefund({
        orderNo: mainOrderNo,
        sku: firstSku,
        index: 600 + dayIndex,
        reason: refundReasons[(dayIndex + 2) % refundReasons.length],
        status: 'REJECTED',
        requestedOffsetHours: 19,
        completedOffsetHours: null,
        amount: 60 + (dayIndex % 3) * 30,
        note: 'Rejected refund fixture for status filters.',
      });
    }
  }

  return {
    products,
    orders,
    orderItems,
    refunds,
  };
}
