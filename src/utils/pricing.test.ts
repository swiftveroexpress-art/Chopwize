import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachAddOnToOrder,
  buildDefaultCartItem,
  calculateBudgetMetrics,
  calculateCheckoutBreakdown,
  calculateRiderEarnings,
  calculateUnitTotal,
  deleteVendorPack,
  duplicateVendorPack,
  ECO_PACKAGING_FEE,
  formatNGN,
  getAllergyConflict,
  getEffectiveStock,
  getNextOrderStage,
  getStartingPrice,
  getVendorPackCount,
  groupCartByVendor,
  groupVendorItemsByPack,
  ORDER_STAGES,
  TAKEAWAY_PACK_FEE,
  validateItemConfiguration,
} from './pricing';
import type {
  CartItem,
  CustomerAiRule,
  MenuItem,
  OrderRecord,
  ProductVariant,
  Vendor,
} from '../types/chopwize';

const sampleItem: MenuItem = {
  id: 'jollof-1',
  vendorId: 'v1',
  name: 'Signature Party Jollof with Smoked Goat Meat',
  description: 'Party Jollof',
  basePrice: 4200,
  sellingUnit: 'Bowl',
  storeCategory: 'Signature Plates',
  marketplaceCategory: 'restaurants',
  imageUrl: '/placeholder.jpg',
  prepMins: 18,
  stockCount: 12,
  optionGroups: [
    {
      id: 'protein',
      title: 'Choose Protein',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      choices: [
        { id: 'goat', name: 'Smoked Goat Meat', priceDelta: 0 },
        { id: 'turkey', name: 'Peppered Turkey', priceDelta: 1500 },
      ],
    },
    {
      id: 'sides',
      title: 'Extra Sides',
      required: false,
      minSelect: 0,
      maxSelect: 3,
      choices: [{ id: 'dodo', name: 'Sweet Fried Dodo', priceDelta: 700 }],
    },
  ],
};

test('formatNGN formats Nigerian Naira cleanly', () => {
  assert.equal(formatNGN(8850), '₦8,850');
  assert.equal(formatNGN(0), '₦0');
});

test('validateItemConfiguration blocks missing required option groups', () => {
  const missing = validateItemConfiguration(sampleItem, {});
  assert.equal(missing.isValid, false);
  assert.deepEqual(missing.missingGroupIds, ['protein']);

  const valid = validateItemConfiguration(sampleItem, {
    protein: [{ id: 'turkey', name: 'Peppered Turkey', priceDelta: 1500 }],
  });
  assert.equal(valid.isValid, true);
});

test('calculateUnitTotal sums base price or variant price and choice quantities accurately', () => {
  const unit = calculateUnitTotal(4200, {
    protein: [{ id: 'turkey', name: 'Peppered Turkey', priceDelta: 1500, quantity: 1 }],
    sides: [{ id: 'dodo', name: 'Sweet Fried Dodo', priceDelta: 700, quantity: 2 }],
  });
  assert.equal(unit, 7100);

  const fiveLitre: ProductVariant = {
    id: '5l',
    label: '5 Litres Keg',
    price: 11500,
    stockCount: 9,
  };
  assert.equal(calculateUnitTotal(1350, {}, fiveLitre), 11500);
});

test('getStartingPrice and getEffectiveStock inspect product variants accurately', () => {
  const measuredItem: MenuItem = {
    ...sampleItem,
    id: 'palm-oil',
    basePrice: 2500,
    sellingUnit: 'Litre',
    marketplaceCategory: 'measured',
    optionGroups: [],
    variants: [
      { id: '500ml', label: 'Half Litre', price: 1350, stockCount: 18 },
      { id: '5l', label: '5 Litres Keg', price: 11500, stockCount: 9 },
    ],
  };

  assert.equal(getStartingPrice(measuredItem), 1350);
  assert.equal(getEffectiveStock(measuredItem, measuredItem.variants![1]), 9);
  assert.equal(getEffectiveStock(sampleItem), 12);
});

test('calculateCheckoutBreakdown applies delivery fee, service charge, and wallet credit cleanly', () => {
  const items: CartItem[] = [
    {
      cartItemId: 'c1',
      vendorId: 'v1',
      vendorName: 'Terra Kulture Restaurant',
      menuItem: sampleItem,
      quantity: 1,
      selections: [],
      unitPrice: 7400,
    },
  ];

  const noWallet = calculateCheckoutBreakdown(items, 1200, 15000, false);
  assert.equal(noWallet.itemsSubtotal, 7400);
  assert.equal(noWallet.deliveryFee, 1200);
  assert.equal(noWallet.serviceCharge, 250);
  assert.equal(noWallet.walletApplied, 0);
  assert.equal(noWallet.totalPayable, 8850);

  const withWallet = calculateCheckoutBreakdown(items, 1200, 3000, true);
  assert.equal(withWallet.walletApplied, 3000);
  assert.equal(withWallet.totalPayable, 5850);
});

test('ORDER_STAGES advances through all 7 fulfillment stages monotonically', () => {
  assert.equal(ORDER_STAGES.length, 7);
  assert.equal(getNextOrderStage('submitted'), 'accepted');
  assert.equal(getNextOrderStage('accepted'), 'preparing');
  assert.equal(getNextOrderStage('preparing'), 'ready');
  assert.equal(getNextOrderStage('ready'), 'rider_assigned');
  assert.equal(getNextOrderStage('rider_assigned'), 'in_transit');
  assert.equal(getNextOrderStage('in_transit'), 'delivered');
  assert.equal(getNextOrderStage('delivered'), 'delivered');
});

test('getAllergyConflict flags shellfish dishes when shellfish rule is enabled', () => {
  const rules: CustomerAiRule[] = [
    {
      id: 'r1',
      title: 'Crustaceans & Shellfish Allergy Block',
      ruleType: 'allergy',
      description: 'Block prawns and periwinkles',
      enabled: true,
    },
  ];

  const seafoodItem: MenuItem = {
    ...sampleItem,
    id: 'seafood-1',
    name: 'Gourmet Seafood Okro',
    allergens: ['Shellfish'],
  };

  assert.ok(getAllergyConflict(seafoodItem, rules));
  assert.equal(getAllergyConflict(sampleItem, rules), null);
});

test('groupCartByVendor and duplicateVendorPack manage multi-store carts and Pack 2 cloning', () => {
  const cart: CartItem[] = [
    {
      cartItemId: 'c1',
      vendorId: 'v1',
      vendorName: 'Terra Kulture Restaurant',
      packLabel: 'Pack 1',
      menuItem: sampleItem,
      quantity: 1,
      selections: [],
      unitPrice: 4200,
    },
    {
      cartItemId: 'c2',
      vendorId: 'v2',
      vendorName: 'Zest & Sip Juice Bar',
      packLabel: 'Pack 1',
      menuItem: { ...sampleItem, id: 'juice-1', vendorId: 'v2', name: 'Orange Juice' },
      quantity: 2,
      selections: [],
      unitPrice: 1500,
    },
  ];

  const grouped = groupCartByVendor(cart);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].subtotal, 4200);
  assert.equal(grouped[1].subtotal, 3000);

  const dup = duplicateVendorPack(cart, 'v1', 'Pack 1');
  assert.equal(dup.newPackLabel, 'Pack 2');
  const v1Packs = groupVendorItemsByPack(dup.updatedItems.filter((i) => i.vendorId === 'v1'));
  assert.equal(v1Packs.length, 2);
  assert.equal(v1Packs[1].packLabel, 'Pack 2');
  assert.equal(v1Packs[1].packSubtotal, 4200);
});

test('calculateBudgetMetrics computes remaining balance, safe daily spend, and usage percentage', () => {
  const metrics = calculateBudgetMetrics({
    monthlyBudget: 50000,
    spentThisMonth: 15500,
    daysRemainingInMonth: 21,
  });
  assert.equal(metrics.remaining, 34500);
  assert.equal(metrics.safeDailySpend, 1643);
  assert.equal(metrics.percentUsed, 31);
  assert.equal(metrics.isOverBudget, false);
});

test('buildDefaultCartItem satisfies required option groups and attachAddOnToOrder updates active order totals', () => {
  const sampleVendor: Vendor = {
    id: 'v1',
    name: 'Terra Kulture Restaurant',
    category: 'restaurants',
    categoryLabel: 'Restaurants',
    description: 'Kitchen',
    verified: true,
    verificationStatus: 'verified',
    isOpen: true,
    rating: 4.9,
    reviewCount: 200,
    deliveryTimeRange: '25-35 mins',
    minEtaMins: 25,
    distanceKm: 1.5,
    coverImageUrl: '/placeholder.jpg',
    monogram: 'TK',
    accentBg: '#F3EEFF',
    address: 'Victoria Island',
    operatingHours: '9am-10pm',
    prepCutOffNote: '9:30pm',
    minOrderAmount: 2000,
    supportsPickup: true,
    supportsDelivery: true,
    menu: [sampleItem],
  };

  const defaultCart = buildDefaultCartItem(sampleItem, sampleVendor);
  assert.equal(defaultCart.selections.length, 1);
  assert.equal(defaultCart.selections[0].choices[0].id, 'goat');
  assert.equal(defaultCart.unitPrice, 4200);

  const seedOrder: OrderRecord = {
    orderId: 'CW-8492',
    createdAtLabel: 'Today',
    vendorId: 'v1',
    vendorName: 'Terra Kulture Restaurant',
    deliveryAddress: 'Lekki Phase 1',
    zoneLabel: 'Lekki Phase 1',
    customerPhone: '+2348035551290',
    paymentStatus: 'paid',
    items: [defaultCart],
    itemsSubtotal: 4200,
    deliveryFee: 1200,
    serviceCharge: 250,
    walletApplied: 0,
    totalPaid: 5650,
    currentStage: 'preparing',
    stageTimestamps: { submitted: '1:00 PM' },
    deliveryPin: '8492',
    rider: {
      name: 'Tunde',
      rating: 4.9,
      tripsCompleted: 100,
      vehicle: 'Bike',
      plateNumber: 'KJA-1',
      phone: '080',
    },
  };

  const drinkAddOn: CartItem = {
    ...defaultCart,
    cartItemId: 'addon-1',
    menuItem: { ...sampleItem, id: 'zobo', name: 'Zobo', basePrice: 1200, optionGroups: [] },
    selections: [],
    unitPrice: 1200,
  };

  const updated = attachAddOnToOrder(seedOrder, drinkAddOn);
  assert.equal(updated.items.length, 2);
  assert.equal(updated.itemsSubtotal, 5400);
  assert.equal(updated.totalPaid, 6850);
});

test('pack-by-pack breakdown computes takeaway pack fees, eco packaging, deleteVendorPack, and rider earnings', () => {
  const twoPackCart: CartItem[] = [
    {
      cartItemId: 'p1',
      vendorId: 'v1',
      vendorName: 'Terra Kulture Restaurant',
      packLabel: 'Pack 1',
      menuItem: sampleItem,
      quantity: 1,
      selections: [],
      unitPrice: 4200,
    },
    {
      cartItemId: 'p2',
      vendorId: 'v1',
      vendorName: 'Terra Kulture Restaurant',
      packLabel: 'Pack 2',
      menuItem: sampleItem,
      quantity: 1,
      selections: [],
      unitPrice: 4200,
    },
  ];

  assert.equal(getVendorPackCount(twoPackCart), 2);

  const breakdown = calculateCheckoutBreakdown(twoPackCart, 1200, 0, false, {
    includePackFees: true,
    ecoPackaging: true,
  });
  assert.equal(breakdown.takeawayPackCount, 2);
  assert.equal(breakdown.takeawayPackFee, 2 * TAKEAWAY_PACK_FEE);
  assert.equal(breakdown.ecoPackagingFee, ECO_PACKAGING_FEE);
  assert.equal(
    breakdown.totalPayable,
    8400 + 2 * TAKEAWAY_PACK_FEE + ECO_PACKAGING_FEE + 1200 + 250
  );

  const afterDelete = deleteVendorPack(twoPackCart, 'v1', 'Pack 1');
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].packLabel, 'Pack 2');
  assert.equal(calculateRiderEarnings(1200), 1020);
  assert.equal(calculateRiderEarnings(800), 900);
  assert.equal(calculateRiderEarnings(1200, 500), 1520);
  assert.equal(calculateRiderEarnings(0, 500), 1400);
});

test('pre-payment rider tipping and free delivery promo update checkout breakdown accurately', async () => {
  const { getEffectiveDeliveryFee, getEffectiveItemPrice } = await import('./pricing');
  const twoItemCart: CartItem[] = [
    {
      cartItemId: 'tip-1',
      vendorId: 'v1',
      vendorName: 'Terra Kulture Restaurant',
      packLabel: 'Pack 1',
      menuItem: sampleItem,
      quantity: 1,
      selections: [],
      unitPrice: 4200,
    },
  ];

  const promos = [
    {
      id: 'promo-1',
      vendorId: 'v1',
      type: 'percentage_discount' as const,
      title: '20% Off Jollof',
      description: 'Weekday lunch flash promo',
      discountPercent: 20,
      targetItemId: 'jollof-1',
      active: true,
      createdAtLabel: 'Today',
    },
    {
      id: 'promo-2',
      vendorId: 'v1',
      type: 'free_delivery' as const,
      title: 'Free Delivery over ₦4,000',
      description: 'Waived Lagos delivery fee',
      minOrderAmount: 4000,
      active: true,
      createdAtLabel: 'Today',
    },
  ];

  const itemPricing = getEffectiveItemPrice(sampleItem, promos);
  assert.equal(itemPricing.discountPercent, 20);
  assert.equal(itemPricing.finalPrice, 3360);
  assert.equal(itemPricing.originalPrice, 4200);

  const deliveryPromo = getEffectiveDeliveryFee(1200, 4200, 'v1', promos);
  assert.equal(deliveryPromo.isFreeDelivery, true);
  assert.equal(deliveryPromo.deliveryFee, 0);

  const withTipAndFreeDelivery = calculateCheckoutBreakdown(twoItemCart, 1200, 0, false, {
    includePackFees: true,
    ecoPackaging: false,
    riderTip: 500,
    freeDelivery: deliveryPromo.isFreeDelivery,
  });
  assert.equal(withTipAndFreeDelivery.deliveryFee, 0);
  assert.equal(withTipAndFreeDelivery.riderTip, 500);
  assert.equal(
    withTipAndFreeDelivery.totalPayable,
    4200 + TAKEAWAY_PACK_FEE + 0 + 250 + 500
  );
});


