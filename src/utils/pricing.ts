import type {
  CartItem,
  CartSelection,
  CustomerAiRule,
  MenuItem,
  MonthlyBudgetConfig,
  OrderRecord,
  OrderStageId,
  ProductVariant,
  SelectedOptionChoice,
  Vendor,
} from '../types/chopwize';

export const CHOPWIZE_FLAT_SERVICE_CHARGE = 250;
export const TAKEAWAY_PACK_FEE = 300;
export const ECO_PACKAGING_FEE = 200;
export const RIDER_BASE_PAYOUT = 900;

export const ORDER_STAGES: Array<{
  id: OrderStageId;
  label: string;
  detail: string;
}> = [
  {
    id: 'submitted',
    label: 'Order Submitted',
    detail: 'Payment authorized & dispatched to kitchen',
  },
  {
    id: 'accepted',
    label: 'Kitchen Accepted',
    detail: 'Chef confirmed order and preparation time',
  },
  {
    id: 'preparing',
    label: 'Preparing Meal',
    detail: 'Dishes simmering fresh with native ingredients',
  },
  {
    id: 'ready',
    label: 'Ready for Pickup',
    detail: 'Sealed & bagged for rider handoff',
  },
  {
    id: 'rider_assigned',
    label: 'Rider Assigned',
    detail: 'Chopwize partner rider en route to restaurant',
  },
  {
    id: 'in_transit',
    label: 'Picked Up & In Transit',
    detail: 'Rider is on the way to your delivery address',
  },
  {
    id: 'delivered',
    label: 'Delivered / Completed',
    detail: 'Safely delivered to customer',
  },
];

export function formatNGN(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₦${safe.toLocaleString('en-NG')}`;
}

export function getStartingPrice(item: MenuItem): number {
  if (item.variants && item.variants.length > 0) {
    return Math.min(...item.variants.map((v) => v.price));
  }
  return item.basePrice;
}

export function getEffectiveItemPrice(
  item: MenuItem,
  vendorPromos: import('../types/chopwize').VendorPromoCampaign[] = [],
  baseAmount?: number
): {
  finalPrice: number;
  originalPrice?: number;
  discountPercent: number;
  promoLabel?: string;
} {
  const rawPrice = baseAmount ?? getStartingPrice(item);
  const activeDiscounts = vendorPromos.filter(
    (p) =>
      p.active &&
      p.vendorId === item.vendorId &&
      p.type === 'percentage_discount' &&
      (p.discountPercent ?? 0) > 0 &&
      (!p.targetItemId || p.targetItemId === item.id) &&
      (!p.targetStoreCategory || p.targetStoreCategory === item.storeCategory)
  );

  const bestDiscount = activeDiscounts.reduce<{
    percent: number;
    label?: string;
  }>(
    (best, promo) => {
      const pct = Math.min(80, Math.max(0, promo.discountPercent ?? 0));
      return pct > best.percent ? { percent: pct, label: promo.title } : best;
    },
    { percent: 0, label: undefined }
  );

  if (bestDiscount.percent > 0) {
    const discounted = Math.max(
      100,
      Math.round((rawPrice * (100 - bestDiscount.percent)) / 100)
    );
    return {
      finalPrice: discounted,
      originalPrice: rawPrice,
      discountPercent: bestDiscount.percent,
      promoLabel: bestDiscount.label,
    };
  }

  return {
    finalPrice: rawPrice,
    originalPrice:
      item.originalPrice && item.originalPrice > rawPrice
        ? item.originalPrice
        : undefined,
    discountPercent: 0,
  };
}

export function getEffectiveDeliveryFee(
  baseDeliveryFee: number,
  itemsSubtotal: number,
  vendorId: string,
  vendorPromos: import('../types/chopwize').VendorPromoCampaign[] = []
): {
  deliveryFee: number;
  isFreeDelivery: boolean;
  promoLabel?: string;
} {
  const freePromo = vendorPromos.find(
    (p) =>
      p.active &&
      p.vendorId === vendorId &&
      p.type === 'free_delivery' &&
      itemsSubtotal >= (p.minOrderAmount ?? 0)
  );

  if (freePromo && itemsSubtotal > 0) {
    return {
      deliveryFee: 0,
      isFreeDelivery: true,
      promoLabel: freePromo.title,
    };
  }

  return {
    deliveryFee: Math.max(0, baseDeliveryFee),
    isFreeDelivery: false,
  };
}

export function getEffectiveStock(
  item: MenuItem,
  selectedVariant?: ProductVariant
): number | null {
  if (selectedVariant) {
    return selectedVariant.stockCount;
  }
  return typeof item.stockCount === 'number' ? item.stockCount : null;
}

export function calculateUnitTotal(
  basePrice: number,
  selectedByGroup: Record<string, SelectedOptionChoice[]>,
  selectedVariant?: ProductVariant
): number {
  const effectiveBase = selectedVariant ? selectedVariant.price : basePrice;
  const optionsSum = Object.values(selectedByGroup).reduce((sum, choices) => {
    return (
      sum +
      choices.reduce(
        (cSum, choice) => cSum + choice.priceDelta * Math.max(1, choice.quantity ?? 1),
        0
      )
    );
  }, 0);
  return Math.max(0, effectiveBase + optionsSum);
}

export function validateItemConfiguration(
  item: MenuItem,
  selectedByGroup: Record<string, SelectedOptionChoice[]>
): {
  isValid: boolean;
  missingGroupIds: string[];
  missingGroupTitles: string[];
} {
  const missingGroupIds: string[] = [];
  const missingGroupTitles: string[] = [];

  for (const group of item.optionGroups) {
    const selected = selectedByGroup[group.id] ?? [];
    const totalCount = selected.reduce(
      (sum, choice) => sum + Math.max(1, choice.quantity ?? 1),
      0
    );
    const requiredMin = group.required ? Math.max(1, group.minSelect) : group.minSelect;
    if (totalCount < requiredMin) {
      missingGroupIds.push(group.id);
      missingGroupTitles.push(group.title);
    }
  }

  return {
    isValid: missingGroupIds.length === 0,
    missingGroupIds,
    missingGroupTitles,
  };
}

export function buildCartSelections(
  item: MenuItem,
  selectedByGroup: Record<string, SelectedOptionChoice[]>
): CartSelection[] {
  return item.optionGroups
    .map((group) => ({
      groupId: group.id,
      groupTitle: group.title,
      choices: selectedByGroup[group.id] ?? [],
    }))
    .filter((entry) => entry.choices.length > 0);
}

export function getVendorPackCount(items: CartItem[]): number {
  if (items.length === 0) return 0;
  return new Set(items.map((i) => i.packLabel || 'Pack 1')).size;
}

export function calculateRiderEarnings(
  deliveryFee: number,
  riderTip = 0
): number {
  const basePayout = Math.max(
    RIDER_BASE_PAYOUT,
    Math.round(Math.max(0, deliveryFee) * 0.85)
  );
  return basePayout + Math.max(0, Math.round(riderTip));
}

export function calculateCheckoutBreakdown(
  items: CartItem[],
  zoneDeliveryFee: number,
  walletBalance = 0,
  applyWallet = false,
  options?: {
    includePackFees?: boolean;
    ecoPackaging?: boolean;
    riderTip?: number;
    freeDelivery?: boolean;
  }
): {
  itemCount: number;
  itemsSubtotal: number;
  takeawayPackCount: number;
  takeawayPackFee: number;
  ecoPackagingFee: number;
  deliveryFee: number;
  serviceCharge: number;
  riderTip: number;
  walletApplied: number;
  totalPayable: number;
} {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const takeawayPackCount = getVendorPackCount(items);

  if (itemCount === 0) {
    return {
      itemCount: 0,
      itemsSubtotal: 0,
      takeawayPackCount: 0,
      takeawayPackFee: 0,
      ecoPackagingFee: 0,
      deliveryFee: 0,
      serviceCharge: 0,
      riderTip: 0,
      walletApplied: 0,
      totalPayable: 0,
    };
  }

  const takeawayPackFee = options?.includePackFees
    ? takeawayPackCount * TAKEAWAY_PACK_FEE
    : 0;
  const ecoPackagingFee =
    options?.includePackFees && options?.ecoPackaging ? ECO_PACKAGING_FEE : 0;
  const deliveryFee = options?.freeDelivery ? 0 : Math.max(0, zoneDeliveryFee);
  const serviceCharge = CHOPWIZE_FLAT_SERVICE_CHARGE;
  const riderTip = Math.max(0, Math.round(options?.riderTip ?? 0));
  const grossTotal =
    itemsSubtotal +
    takeawayPackFee +
    ecoPackagingFee +
    deliveryFee +
    serviceCharge +
    riderTip;
  const walletApplied = applyWallet
    ? Math.min(Math.max(0, walletBalance), grossTotal)
    : 0;
  const totalPayable = Math.max(0, grossTotal - walletApplied);

  return {
    itemCount,
    itemsSubtotal,
    takeawayPackCount,
    takeawayPackFee,
    ecoPackagingFee,
    deliveryFee,
    serviceCharge,
    riderTip,
    walletApplied,
    totalPayable,
  };
}

export function getNextOrderStage(current: OrderStageId): OrderStageId {
  const index = ORDER_STAGES.findIndex((s) => s.id === current);
  if (index === -1 || index >= ORDER_STAGES.length - 1) {
    return 'delivered';
  }
  return ORDER_STAGES[index + 1].id;
}

export function getOrderStageIndex(stage: OrderStageId): number {
  const index = ORDER_STAGES.findIndex((s) => s.id === stage);
  return index === -1 ? 0 : index;
}

export function getAllergyConflict(
  item: MenuItem,
  rules: CustomerAiRule[]
): string | null {
  const activeShellfishRule = rules.find(
    (r) =>
      r.enabled &&
      r.ruleType === 'allergy' &&
      /shellfish|crustacean|prawn|shrimp|crab/i.test(`${r.title} ${r.description}`)
  );

  if (!activeShellfishRule) return null;

  const itemText = `${item.name} ${item.description} ${(item.allergens ?? []).join(' ')}`;
  if (/shellfish|prawn|shrimp|crab|periwinkle|seafood/i.test(itemText)) {
    return `Food Memory Safeguard: Contains shellfish/seafood (${activeShellfishRule.title})`;
  }
  return null;
}

export interface VendorCartGroup {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export function groupCartByVendor(items: CartItem[]): VendorCartGroup[] {
  const map = new Map<string, VendorCartGroup>();
  for (const item of items) {
    const existing = map.get(item.vendorId);
    if (existing) {
      existing.items.push(item);
      existing.itemCount += item.quantity;
      existing.subtotal += item.unitPrice * item.quantity;
    } else {
      map.set(item.vendorId, {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        items: [item],
        itemCount: item.quantity,
        subtotal: item.unitPrice * item.quantity,
      });
    }
  }
  return Array.from(map.values());
}

export interface VendorPackGroup {
  packLabel: string;
  items: CartItem[];
  packSubtotal: number;
}

export function groupVendorItemsByPack(vendorItems: CartItem[]): VendorPackGroup[] {
  const map = new Map<string, VendorPackGroup>();
  for (const item of vendorItems) {
    const label = item.packLabel || 'Pack 1';
    const existing = map.get(label);
    if (existing) {
      existing.items.push(item);
      existing.packSubtotal += item.unitPrice * item.quantity;
    } else {
      map.set(label, {
        packLabel: label,
        items: [item],
        packSubtotal: item.unitPrice * item.quantity,
      });
    }
  }
  return Array.from(map.values());
}

export function duplicateVendorPack(
  items: CartItem[],
  vendorId: string,
  sourcePackLabel: string
): { updatedItems: CartItem[]; newPackLabel: string } {
  const vendorItems = items.filter((i) => i.vendorId === vendorId);
  let maxPackNum = 1;
  for (const vi of vendorItems) {
    const match = (vi.packLabel || 'Pack 1').match(/Pack\s+(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxPackNum) maxPackNum = n;
    }
  }
  const newPackLabel = `Pack ${maxPackNum + 1}`;
  const sourceItems = vendorItems.filter(
    (i) => (i.packLabel || 'Pack 1') === sourcePackLabel
  );
  if (sourceItems.length === 0) {
    return { updatedItems: items, newPackLabel };
  }
  const cloned = sourceItems.map((src, idx) => ({
    ...src,
    cartItemId: `${src.cartItemId}__${newPackLabel.replace(/\s+/g, '')}__${idx}_${Date.now()}`,
    packLabel: newPackLabel,
  }));
  return {
    updatedItems: [...items, ...cloned],
    newPackLabel,
  };
}

export function deleteVendorPack(
  items: CartItem[],
  vendorId: string,
  targetPackLabel: string
): CartItem[] {
  return items.filter(
    (item) =>
      !(
        item.vendorId === vendorId &&
        (item.packLabel || 'Pack 1') === targetPackLabel
      )
  );
}

export interface BudgetMetrics {
  monthlyBudget: number;
  spentThisMonth: number;
  remaining: number;
  safeDailySpend: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export function calculateBudgetMetrics(config: MonthlyBudgetConfig): BudgetMetrics {
  const monthlyBudget = Math.max(0, config.monthlyBudget);
  const spentThisMonth = Math.max(0, config.spentThisMonth);
  const days = Math.max(1, config.daysRemainingInMonth);
  const remaining = Math.max(0, monthlyBudget - spentThisMonth);
  const safeDailySpend = Math.round(remaining / days);
  const percentUsed =
    monthlyBudget > 0 ? Math.min(100, Math.round((spentThisMonth / monthlyBudget) * 100)) : 0;

  return {
    monthlyBudget,
    spentThisMonth,
    remaining,
    safeDailySpend,
    percentUsed,
    isOverBudget: spentThisMonth > monthlyBudget,
  };
}

export function buildDefaultCartItem(
  item: MenuItem,
  vendor: Vendor,
  preferredVariant?: ProductVariant,
  packLabel = 'Pack 1'
): CartItem {
  const variant =
    preferredVariant ??
    (item.variants && item.variants.length > 0
      ? item.variants.find((v) => v.stockCount > 0) ?? item.variants[0]
      : undefined);

  const selectedByGroup: Record<string, SelectedOptionChoice[]> = {};
  for (const group of item.optionGroups) {
    if (group.required && group.choices.length > 0) {
      selectedByGroup[group.id] = [{ ...group.choices[0], quantity: 1 }];
    }
  }

  const unitPrice = calculateUnitTotal(item.basePrice, selectedByGroup, variant);
  const selections = buildCartSelections(item, selectedByGroup);

  return {
    cartItemId: `ai-${item.id}-${variant?.id ?? 'base'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    vendorId: vendor.id,
    vendorName: vendor.name,
    packLabel,
    menuItem: item,
    selectedVariant: variant,
    quantity: 1,
    selections,
    unitPrice,
  };
}

export function attachAddOnToOrder(
  order: OrderRecord,
  addOnItem: CartItem
): OrderRecord {
  const addOnCost = addOnItem.unitPrice * addOnItem.quantity;
  return {
    ...order,
    items: [...order.items, addOnItem],
    itemsSubtotal: order.itemsSubtotal + addOnCost,
    totalPaid: order.totalPaid + addOnCost,
  };
}
