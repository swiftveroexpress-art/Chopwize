import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateImprovedProductCopy,
  getAiDiscoveryResponse,
  getAiRecommendations,
  getComparativeAiRecommendations,
  getPopularItems,
  mapStateToCulture,
  parseAiPrompt,
  rollSurpriseMeal,
  toggleFavoriteVendorId,
  updateRecentlyViewedIds,
} from './aiRecommender';
import type { CustomerAiRule, TemporaryAiRequest, Vendor } from '../types/chopwize';

const baseVendorMeta = {
  verified: true,
  verificationStatus: 'verified' as const,
  isOpen: true,
  rating: 4.8,
  reviewCount: 200,
  deliveryTimeRange: '20-30 mins',
  minEtaMins: 20,
  distanceKm: 1.1,
  coverImageUrl: '/placeholder.jpg',
  accentBg: '#EDE5FF',
  address: 'Lekki Phase 1',
  operatingHours: '8:00 AM – 9:00 PM',
  prepCutOffNote: 'Same-day dispatch',
  minOrderAmount: 1500,
  supportsPickup: true,
  supportsDelivery: true,
};

const sampleVendors: Vendor[] = [
  {
    ...baseVendorMeta,
    id: 'bukka',
    name: 'Bukka Hut',
    category: 'restaurants',
    categoryLabel: 'Yoruba Kitchen',
    description: 'Amala',
    monogram: 'BH',
    menu: [
      {
        id: 'amala',
        vendorId: 'bukka',
        name: 'Hot Oyo Amala with Abula',
        description: 'Yoruba Amala',
        basePrice: 3600,
        sellingUnit: 'Plate',
        storeCategory: 'Yoruba Classics',
        marketplaceCategory: 'restaurants',
        culture: 'yoruba',
        imageUrl: '/amala.jpg',
        isPopular: true,
        isSpicy: true,
        prepMins: 15,
        optionGroups: [],
      },
      {
        id: 'jollof-rice',
        vendorId: 'bukka',
        name: 'Party Jollof Rice',
        description: 'Smoky Jollof rice',
        basePrice: 4200,
        sellingUnit: 'Plate',
        storeCategory: 'Rice',
        marketplaceCategory: 'restaurants',
        culture: 'yoruba',
        imageUrl: '/jollof.jpg',
        isPopular: true,
        isSpicy: true,
        prepMins: 15,
        optionGroups: [],
      },
      {
        id: 'okro',
        vendorId: 'bukka',
        name: 'Gourmet Seafood Okro',
        description: 'Prawns and crab',
        basePrice: 5800,
        sellingUnit: 'Bowl',
        storeCategory: 'Soups',
        marketplaceCategory: 'restaurants',
        culture: 'calabar',
        allergens: ['Shellfish'],
        imageUrl: '/okro.jpg',
        isPopular: true,
        isSpicy: true,
        prepMins: 20,
        optionGroups: [],
      },
    ],
  },
  {
    ...baseVendorMeta,
    id: 'zest-sip',
    name: 'Zest & Sip Juice Bar',
    category: 'drinks',
    categoryLabel: 'Juices & Drinks',
    description: 'Cold pressed juice',
    monogram: 'ZS',
    menu: [
      {
        id: 'orange-juice',
        vendorId: 'zest-sip',
        name: 'Fresh Orange & Pineapple Juice',
        description: 'Cold-pressed daily',
        basePrice: 1500,
        sellingUnit: 'Bottle',
        storeCategory: 'Fresh Juices',
        marketplaceCategory: 'drinks',
        imageUrl: '/juice.jpg',
        prepMins: 10,
        variants: [
          { id: '500ml', label: '500ml Bottle', price: 1500, stockCount: 20 },
          { id: 'pack-6', label: 'Pack of 6', price: 8400, stockCount: 5 },
        ],
        optionGroups: [],
      },
    ],
  },
  {
    ...baseVendorMeta,
    id: 'chez-adefe',
    name: 'Chez Adefe Small Chops',
    category: 'pastries',
    categoryLabel: 'Pastries & Bakery',
    description: 'Small chops trays',
    monogram: 'CA',
    menu: [
      {
        id: 'chops-box',
        vendorId: 'chez-adefe',
        name: 'Small Chops Box',
        description: 'Puff-puff and samosas',
        basePrice: 3950,
        sellingUnit: 'Box',
        storeCategory: 'Small Chops',
        marketplaceCategory: 'pastries',
        imageUrl: '/chops.jpg',
        prepMins: 14,
        pastryMeta: {
          prepLeadTime: '2 hrs for 30-person event tray',
          supportsPreOrder: true,
        },
        variants: [
          { id: 'solo', label: 'Solo Pack', price: 3950, stockCount: 15 },
          { id: 'event-30', label: 'Event Box (30 People)', price: 35000, stockCount: 6 },
        ],
        optionGroups: [],
      },
    ],
  },
  {
    ...baseVendorMeta,
    id: 'suya-spot-dan',
    name: 'Suya Spot & Flame Grill',
    category: 'grill',
    categoryLabel: 'Grill & BBQ',
    description: 'Grilled chicken and suya',
    monogram: 'SD',
    menu: [
      {
        id: 'flame-chicken',
        vendorId: 'suya-spot-dan',
        name: 'Flame-Grilled Chicken',
        description: 'Charcoal grilled chicken',
        basePrice: 3400,
        sellingUnit: 'Platter',
        storeCategory: 'Grilled Chicken',
        marketplaceCategory: 'grill',
        imageUrl: '/grill.jpg',
        prepMins: 22,
        variants: [
          { id: 'quarter', label: 'Quarter Chicken', price: 3400, stockCount: 10 },
          { id: 'mixed-platter', label: 'Weekend Mixed Grill Platter', price: 14500, stockCount: 4 },
        ],
        optionGroups: [],
      },
    ],
  },
  {
    ...baseVendorMeta,
    id: 'mama-nkechi-oils',
    name: 'Mama Nkechi Oil & Grains Hub',
    category: 'measured',
    categoryLabel: 'Measured Products',
    description: 'Measured litres and kg',
    monogram: 'MN',
    menu: [
      {
        id: 'palm-oil',
        vendorId: 'mama-nkechi-oils',
        name: 'Pure Unbleached Red Palm Oil',
        description: 'Edo red palm oil in measured kegs',
        basePrice: 1350,
        sellingUnit: 'Litre',
        storeCategory: 'Measured Cooking Oils',
        marketplaceCategory: 'measured',
        imageUrl: '/oil.jpg',
        prepMins: 10,
        variants: [
          { id: '1l', label: '1 Litre', price: 2500, stockCount: 20 },
          { id: '5l', label: '5 Litres Keg', price: 11500, stockCount: 9 },
        ],
        optionGroups: [],
      },
    ],
  },
];

test('parseAiPrompt detects Yoruba food, budget limit, volume, guest count, and hosting intent', () => {
  const budget = parseAiPrompt('Find food under ₦4,000');
  assert.equal(budget.maxBudget, 4000);

  const yoruba = parseAiPrompt('Yoruba indigenous food');
  assert.equal(yoruba.culture, 'yoruba');

  const juice = parseAiPrompt('I need someone who sells fresh juice near me');
  assert.equal(juice.targetCategory, 'drinks');

  const oil = parseAiPrompt('Who sells palm oil in 5 litres?');
  assert.equal(oil.targetCategory, 'measured');
  assert.equal(oil.requestedVolume, '5litres');

  const chops = parseAiPrompt('Where can I get small chops for 30 people?');
  assert.equal(chops.targetCategory, 'pastries');
  assert.equal(chops.guestCount, 30);

  const visitors = parseAiPrompt("I'm having visitors this weekend, what can I order?");
  assert.equal(visitors.isOccasionHosting, true);
});

test('getAiDiscoveryResponse returns storefronts, 5L palm oil variant, and weekend hosting spread', () => {
  const juiceResp = getAiDiscoveryResponse(
    sampleVendors,
    'I need someone who sells fresh juice near me'
  );
  assert.equal(juiceResp.storefronts[0]?.vendor.id, 'zest-sip');
  assert.equal(juiceResp.storefronts[0]?.startingPrice, 1500);

  const oilResp = getAiDiscoveryResponse(
    sampleVendors,
    'Who sells palm oil in 5 litres?'
  );
  assert.equal(oilResp.storefronts[0]?.vendor.id, 'mama-nkechi-oils');
  assert.equal(oilResp.storefronts[0]?.highlightedVariant?.id, '5l');
  assert.equal(oilResp.storefronts[0]?.highlightedVariant?.price, 11500);

  const spreadResp = getAiDiscoveryResponse(
    sampleVendors,
    "I'm having visitors this weekend, what can I order?"
  );
  assert.ok(spreadResp.occasionSpread);
  assert.equal(spreadResp.occasionSpread.items.length, 3);
  assert.match(spreadResp.occasionSpread.multiSellerNotice, /separate/i);
});

test('getAiRecommendations enforces temporary requests and permanent AI rules', () => {
  const tempNoRice: TemporaryAiRequest[] = [
    {
      id: 'tmp-1',
      label: 'No rice today',
      excludeKeywords: ['rice', 'jollof'],
      active: true,
    },
  ];

  const rules: CustomerAiRule[] = [
    {
      id: 'r-budget',
      title: 'Never recommend food above ₦4,000',
      ruleType: 'budget',
      description: 'Cap recommendations at ₦4,000',
      enabled: true,
    },
    {
      id: 'r-shellfish',
      title: 'Crustaceans & Shellfish Block',
      ruleType: 'allergy',
      description: 'Block shellfish',
      enabled: true,
    },
  ];

  const recs = getAiRecommendations(
    sampleVendors,
    'Yoruba food',
    true,
    5,
    rules,
    tempNoRice
  );
  assert.equal(recs.some((r) => r.item.id === 'jollof-rice'), false);
  assert.equal(recs.some((r) => r.item.id === 'okro'), false);
  assert.equal(recs[0]?.item.id, 'amala');
});

test('generateImprovedProductCopy polishes seller copy cleanly', () => {
  const copy = generateImprovedProductCopy({
    name: 'Pineapple Ginger Cooler',
    category: 'drinks',
    rawNotes: 'fresh pineapple, no sugar',
  });
  assert.match(copy, /Pineapple Ginger Cooler/);
  assert.match(copy, /2–4°C/);
});

test('recently viewed, favorite vendors, surprise roll, and popular meals preserve integrity', () => {
  const viewed = updateRecentlyViewedIds(['amala', 'suya', 'jollof'], 'suya', 3);
  assert.deepEqual(viewed, ['suya', 'amala', 'jollof']);

  const addedFav = toggleFavoriteVendorId(['bukka'], 'terra-kulture');
  assert.deepEqual(addedFav, ['terra-kulture', 'bukka']);

  const safeRoll = rollSurpriseMeal(sampleVendors, 6000, 'Lagos Hot', true, 0);
  assert.ok(safeRoll);
  assert.notEqual(safeRoll.item.id, 'okro');

  const safePopular = getPopularItems(sampleVendors, true);
  assert.equal(safePopular.some((p) => p.item.id === 'okro'), false);
});

test('getComparativeAiRecommendations returns up to 3 verified stores and maps stateOfOrigin gently', () => {
  assert.equal(mapStateToCulture('Oyo State'), 'yoruba');
  assert.equal(mapStateToCulture('Anambra'), 'igbo');
  assert.equal(mapStateToCulture('Kano'), 'hausa');
  assert.equal(mapStateToCulture('Cross River'), 'calabar');

  const cards = getComparativeAiRecommendations({
    vendors: sampleVendors,
    prompt: 'lunch under ₦5,000',
    rules: [],
    temporaryRequests: [],
    safeDailySpend: 3800,
    stateOfOrigin: 'Oyo State',
    indigenousFrequency: 'Weekly',
  });

  assert.equal(cards.length, 3);
  const vendorIds = new Set(cards.map((c) => c.vendor.id));
  assert.equal(vendorIds.size, 3);
  assert.equal(cards[0].vendor.verified, true);
});
