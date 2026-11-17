import type {
  CultureId,
  CustomerAiRule,
  IndigenousFrequency,
  MarketplaceCategorySlug,
  MenuItem,
  ProductVariant,
  TemporaryAiRequest,
  Vendor,
} from '../types/chopwize';
import { formatNGN, getStartingPrice } from './pricing';

export interface AiRecommendationResult {
  item: MenuItem;
  vendor: Vendor;
  matchedVariant?: ProductVariant;
  score: number;
  reason: string;
}

export interface AiStorefrontRecommendation {
  vendor: Vendor;
  startingPrice: number;
  badgeText: string;
  reason: string;
  highlightedItem?: MenuItem;
  highlightedVariant?: ProductVariant;
}

export interface AiOccasionSpreadItem {
  roleLabel: string;
  vendor: Vendor;
  item: MenuItem;
  selectedVariant?: ProductVariant;
  displayPrice: number;
}

export interface AiOccasionSpread {
  title: string;
  summary: string;
  multiSellerNotice: string;
  items: AiOccasionSpreadItem[];
}

export interface AiDiscoveryResponse {
  headline: string;
  storefronts: AiStorefrontRecommendation[];
  dishes: AiRecommendationResult[];
  occasionSpread: AiOccasionSpread | null;
}

export interface ParsedAiIntent {
  maxBudget: number | null;
  wantsSpicy: boolean;
  wantsQuick: boolean;
  culture: CultureId | null;
  targetCategory: MarketplaceCategorySlug | null;
  requestedVolume: string | null;
  guestCount: number | null;
  isCookingQuery: boolean;
  isMealPlanQuery: boolean;
  isGroceryQuery: boolean;
  isOccasionHosting: boolean;
  wantsStorefrontView: boolean;
  keywords: string[];
}

export function parseAiPrompt(prompt: string): ParsedAiIntent {
  const normalized = prompt.toLowerCase().trim();

  let maxBudget: number | null = null;
  const kMatch = normalized.match(
    /(?:under|below|max|<=|within)\s*₦?\s*(\d+(?:\.\d+)?)\s*k\b/
  );
  const fullMatch = normalized.match(
    /(?:under|below|max|<=|within)\s*₦?\s*(\d[\d,]*)/
  );
  const bareNairaMatch = normalized.match(/₦\s*(\d[\d,]*)/);

  if (kMatch) {
    maxBudget = Math.round(parseFloat(kMatch[1]) * 1000);
  } else if (fullMatch) {
    maxBudget = parseInt(fullMatch[1].replace(/,/g, ''), 10);
  } else if (bareNairaMatch) {
    maxBudget = parseInt(bareNairaMatch[1].replace(/,/g, ''), 10);
  }

  let culture: CultureId | null = null;
  if (/\b(yoruba|amala|abula|ewedu|gbegiri|ofada|ayamase)\b/.test(normalized)) {
    culture = 'yoruba';
  } else if (/\b(igbo|eastern|oha|pounded yam|nsala|ofe)\b/.test(normalized)) {
    culture = 'igbo';
  } else if (/\b(hausa|northern|tuwo|miyan|kuka)\b/.test(normalized)) {
    culture = 'hausa';
  } else if (/\b(calabar|efik|ibibio|afang|edikang|periwinkle)\b/.test(normalized)) {
    culture = 'calabar';
  }

  let targetCategory: MarketplaceCategorySlug | null = null;
  if (/\b(juice|smoothie|zobo|kunu|chapman|drink|beverage)\b/.test(normalized)) {
    targetCategory = 'drinks';
  } else if (
    /\b(small chops|puff|samosa|cake|birthday|pastry|pastries|bakery|meat pie|doughnut)\b/.test(
      normalized
    )
  ) {
    targetCategory = 'pastries';
  } else if (/\b(palm oil|red oil|litre|litres|5l|10l|2l|500ml|measured|beans|kg)\b/.test(normalized)) {
    targetCategory = 'measured';
  } else if (/\b(grill|bbq|suya|grilled chicken|croaker|turkey)\b/.test(normalized)) {
    targetCategory = 'grill';
  } else if (/\b(groceries|grocery|market|spaghetti|noodles|rice bag)\b/.test(normalized)) {
    targetCategory = 'groceries';
  }

  const volumeMatch = normalized.match(/\b(\d+\s*(?:litres?|l|ml|kg))\b/i);
  const requestedVolume = volumeMatch ? volumeMatch[1].toLowerCase().replace(/\s+/g, '') : null;

  const guestMatch = normalized.match(/\b(\d+)\s*(?:people|guests|persons)\b/i);
  const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : null;

  const wantsSpicy = /\b(spicy|pepper|hot|suya|yaji|lunch)\b/.test(normalized);
  const wantsQuick = /\b(quick|fast|express|lunch|now|instant)\b/.test(normalized);
  const isCookingQuery = /\b(cook|recipe|ingredients|at home)\b/.test(normalized);
  const isMealPlanQuery = /\b(plan|week meals|schedule)\b/.test(normalized);
  const isGroceryQuery = /\b(groceries|grocery|market|spaghetti|noodles|rice bag)\b/.test(
    normalized
  );
  const isOccasionHosting =
    /\b(visitors|guests|weekend|hosting|party|friends coming|get-together)\b/.test(
      normalized
    );
  const wantsStorefrontView =
    /\b(who sells|someone who sells|where can i get|near me|store|vendor|shop)\b/.test(
      normalized
    ) || targetCategory !== null;

  const stopWords = new Set([
    'under',
    'below',
    'with',
    'for',
    'and',
    'the',
    'something',
    'want',
    'food',
    'meal',
    'find',
    'shop',
    'indigenous',
    'someone',
    'who',
    'sells',
    'near',
    'need',
    'where',
    'can',
    'get',
    'people',
    'having',
    'this',
    'what',
    'order',
  ]);

  const keywords = normalized
    .replace(/₦[\d,]+/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  return {
    maxBudget,
    wantsSpicy,
    wantsQuick,
    culture,
    targetCategory,
    requestedVolume,
    guestCount,
    isCookingQuery,
    isMealPlanQuery,
    isGroceryQuery,
    isOccasionHosting,
    wantsStorefrontView,
    keywords,
  };
}

function getEffectiveRulesContext(rules: CustomerAiRule[]): {
  excludeShellfish: boolean;
  ruleBudgetCap: number | null;
  prioritizedCulture: CultureId | null;
} {
  const excludeShellfish = rules.some(
    (r) =>
      r.enabled &&
      r.ruleType === 'allergy' &&
      /shellfish|crustacean/i.test(`${r.title} ${r.description}`)
  );

  let ruleBudgetCap: number | null = null;
  for (const r of rules) {
    if (!r.enabled || r.ruleType !== 'budget') continue;
    const match = `${r.title} ${r.description}`.match(/₦\s*(\d[\d,]*)/);
    if (match) {
      const val = parseInt(match[1].replace(/,/g, ''), 10);
      if (!ruleBudgetCap || val < ruleBudgetCap) {
        ruleBudgetCap = val;
      }
    }
  }

  let prioritizedCulture: CultureId | null = null;
  for (const r of rules) {
    if (!r.enabled) continue;
    const text = `${r.title} ${r.description}`.toLowerCase();
    if (text.includes('yoruba')) prioritizedCulture = 'yoruba';
    else if (text.includes('igbo')) prioritizedCulture = 'igbo';
    else if (text.includes('hausa')) prioritizedCulture = 'hausa';
    else if (text.includes('calabar') || text.includes('efik')) prioritizedCulture = 'calabar';
  }

  return { excludeShellfish, ruleBudgetCap, prioritizedCulture };
}

function matchesTemporaryExclusion(
  item: MenuItem,
  temporaryRequests: TemporaryAiRequest[]
): boolean {
  const active = temporaryRequests.filter((t) => t.active);
  if (active.length === 0) return false;
  const hay = `${item.name} ${item.description} ${item.storeCategory}`.toLowerCase();
  return active.some((req) =>
    req.excludeKeywords.some((kw) => hay.includes(kw.toLowerCase()))
  );
}

function findMatchingVariant(
  item: MenuItem,
  intent: ParsedAiIntent
): ProductVariant | undefined {
  if (!item.variants || item.variants.length === 0) return undefined;

  if (intent.requestedVolume) {
    const normalizedVol = intent.requestedVolume.replace(/litres?/i, 'l');
    const found = item.variants.find((v) => {
      const lbl = v.label.toLowerCase().replace(/\s+/g, '');
      return (
        lbl.includes(intent.requestedVolume!) ||
        lbl.includes(normalizedVol) ||
        (normalizedVol === '5l' && lbl.includes('5litre'))
      );
    });
    if (found) return found;
  }

  if (intent.guestCount && intent.guestCount >= 20) {
    const largeTray = item.variants.find((v) =>
      /30|event|party|20|large/i.test(v.label)
    );
    if (largeTray) return largeTray;
  }

  return undefined;
}

export function getAiRecommendations(
  vendors: Vendor[],
  prompt: string,
  excludeShellfish = false,
  limit = 4,
  rules: CustomerAiRule[] = [],
  temporaryRequests: TemporaryAiRequest[] = []
): AiRecommendationResult[] {
  const intent = parseAiPrompt(prompt);
  const rulesCtx = getEffectiveRulesContext(rules);
  const blockShellfish = excludeShellfish || rulesCtx.excludeShellfish;
  const activeBudgetCap = intent.maxBudget ?? rulesCtx.ruleBudgetCap;
  const candidates: AiRecommendationResult[] = [];

  for (const vendor of vendors) {
    if (!vendor.isOpen) continue;
    for (const item of vendor.menu) {
      if (matchesTemporaryExclusion(item, temporaryRequests)) continue;

      if (
        blockShellfish &&
        (item.allergens ?? []).some((a) => /shellfish|crustacean/i.test(a))
      ) {
        continue;
      }

      const matchedVariant = findMatchingVariant(item, intent);
      const effectivePrice = matchedVariant ? matchedVariant.price : getStartingPrice(item);

      if (matchedVariant && matchedVariant.stockCount <= 0) continue;

      if (activeBudgetCap !== null && effectivePrice > activeBudgetCap) {
        continue;
      }

      let score = vendor.verified ? 14 : 4;
      const reasons: string[] = [];

      if (intent.targetCategory && item.marketplaceCategory === intent.targetCategory) {
        score += 40;
        reasons.push(
          intent.targetCategory === 'drinks'
            ? 'Fresh juice & cold drinks'
            : intent.targetCategory === 'measured'
              ? 'Measured litre/kg seller'
              : intent.targetCategory === 'pastries'
                ? 'Pastries & event trays'
                : 'Category match'
        );
      }

      if (matchedVariant) {
        score += 34;
        reasons.push(`${matchedVariant.label} in stock (${matchedVariant.stockCount})`);
      }

      if (intent.culture && item.culture === intent.culture) {
        score += 35;
        reasons.push(
          `${intent.culture.charAt(0).toUpperCase() + intent.culture.slice(1)} heritage match`
        );
      } else if (!intent.culture && rulesCtx.prioritizedCulture && item.culture === rulesCtx.prioritizedCulture) {
        score += 18;
        const cultureLabel =
          rulesCtx.prioritizedCulture.charAt(0).toUpperCase() +
          rulesCtx.prioritizedCulture.slice(1);
        reasons.push(`Matches your ${cultureLabel} preference`);
      }

      if (intent.isGroceryQuery && item.marketplaceCategory === 'groceries') {
        score += 32;
        reasons.push('Shelf-stable Market pick');
      } else if (
        !intent.isGroceryQuery &&
        !intent.targetCategory &&
        item.marketplaceCategory === 'groceries'
      ) {
        score -= 10;
      }

      if (intent.wantsSpicy && item.isSpicy) {
        score += 22;
        reasons.push('Spiced Nigerian favourite');
      }

      if (intent.wantsQuick && (item.prepMins <= 20 || vendor.minEtaMins <= 25)) {
        score += 14;
        reasons.push(`Ready in ~${item.prepMins}m`);
      }

      if (activeBudgetCap !== null) {
        reasons.push(`Under ${formatNGN(activeBudgetCap)}`);
      }

      const searchable = `${item.name} ${item.description} ${vendor.name} ${item.storeCategory} ${(item.variants ?? []).map((v) => v.label).join(' ')}`.toLowerCase();
      for (const kw of intent.keywords) {
        if (searchable.includes(kw)) {
          score += 16;
          if (reasons.length < 2) reasons.push(`Matches "${kw}"`);
        }
      }

      if (item.isPopular) score += 5;

      if (reasons.length === 0) {
        reasons.push(
          vendor.verified ? `Verified ${vendor.name}` : `Pending review · ${vendor.name}`
        );
      }

      candidates.push({
        item,
        vendor,
        matchedVariant,
        score,
        reason: reasons.slice(0, 2).join(' · '),
      });
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.basePrice - b.item.basePrice;
  });

  return candidates.slice(0, limit);
}

export function getAiDiscoveryResponse(
  vendors: Vendor[],
  prompt: string,
  rules: CustomerAiRule[] = [],
  temporaryRequests: TemporaryAiRequest[] = []
): AiDiscoveryResponse {
  const intent = parseAiPrompt(prompt);
  const rulesCtx = getEffectiveRulesContext(rules);
  const dishPicks = getAiRecommendations(
    vendors,
    prompt,
    rulesCtx.excludeShellfish,
    4,
    rules,
    temporaryRequests
  );

  // 1. Multi-category Occasion Hosting Spread ("visitors this weekend")
  if (intent.isOccasionHosting) {
    const smallChopsVendor = vendors.find((v) => v.id === 'chez-adefe');
    const smallChopsItem = smallChopsVendor?.menu[0];
    const smallChopsVariant =
      smallChopsItem?.variants?.find((v) => v.id === 'tray-15') ??
      smallChopsItem?.variants?.[0];

    const juiceVendor = vendors.find((v) => v.id === 'zest-sip');
    const juiceItem = juiceVendor?.menu[0];
    const juiceVariant =
      juiceItem?.variants?.find((v) => v.id === 'pack-6') ?? juiceItem?.variants?.[0];

    const grillVendor = vendors.find((v) => v.id === 'suya-spot-dan');
    const grillItem = grillVendor?.menu[0];
    const grillVariant =
      grillItem?.variants?.find((v) => v.id === 'mixed-platter') ??
      grillItem?.variants?.[0];

    const spreadItems: AiOccasionSpreadItem[] = [];
    if (smallChopsVendor && smallChopsItem) {
      spreadItems.push({
        roleLabel: 'Starter Tray · Pastries & Small Chops',
        vendor: smallChopsVendor,
        item: smallChopsItem,
        selectedVariant: smallChopsVariant,
        displayPrice: smallChopsVariant?.price ?? smallChopsItem.basePrice,
      });
    }
    if (juiceVendor && juiceItem) {
      spreadItems.push({
        roleLabel: 'Chilled Refreshment · Juices & Drinks',
        vendor: juiceVendor,
        item: juiceItem,
        selectedVariant: juiceVariant,
        displayPrice: juiceVariant?.price ?? juiceItem.basePrice,
      });
    }
    if (grillVendor && grillItem) {
      spreadItems.push({
        roleLabel: 'Centrepiece Grill · Grill & BBQ',
        vendor: grillVendor,
        item: grillItem,
        selectedVariant: grillVariant,
        displayPrice: grillVariant?.price ?? grillItem.basePrice,
      });
    }

    return {
      headline:
        'Weekend Hosting Spread curated across 3 verified Lagos sellers:',
      storefronts: spreadItems.map((entry) => ({
        vendor: entry.vendor,
        startingPrice: entry.displayPrice,
        badgeText: entry.vendor.verified ? 'Verified Seller' : 'Pending Review',
        reason: `${entry.roleLabel} · ${entry.vendor.deliveryTimeRange}`,
        highlightedItem: entry.item,
        highlightedVariant: entry.selectedVariant,
      })),
      dishes: dishPicks,
      occasionSpread: {
        title: 'Weekend Visitor Hosting Menu',
        summary:
          'Balanced crowd-pleasers combining golden small chops, cold-pressed juice packs, and smoky grilled platters.',
        multiSellerNotice:
          'Multi-Seller Transparency: Each item below comes from a separate independent Chopwize storefront. Ordering from multiple sellers uses separate store trays & dispatch/pickup windows.',
        items: spreadItems,
      },
    };
  }

  // 2. Storefront recommendations when user asks who sells X / category discovery
  const storefronts: AiStorefrontRecommendation[] = [];
  if (intent.wantsStorefrontView || intent.targetCategory) {
    const matchedVendors = vendors.filter((v) => {
      if (!v.isOpen) return false;
      if (intent.targetCategory) {
        return (
          v.category === intent.targetCategory ||
          v.menu.some((m) => m.marketplaceCategory === intent.targetCategory)
        );
      }
      return dishPicks.some((d) => d.vendor.id === v.id);
    });

    matchedVendors.sort((a, b) => Number(b.verified) - Number(a.verified) || a.distanceKm - b.distanceKm);

    for (const v of matchedVendors.slice(0, 3)) {
      const relevantItem =
        v.menu.find((m) =>
          intent.targetCategory ? m.marketplaceCategory === intent.targetCategory : true
        ) ?? v.menu[0];

      const variant = relevantItem ? findMatchingVariant(relevantItem, intent) : undefined;
      const minPrice = relevantItem
        ? variant
          ? variant.price
          : getStartingPrice(relevantItem)
        : v.minOrderAmount;

      let reason = `${v.categoryLabel} · ${v.deliveryTimeRange}`;
      if (intent.guestCount && relevantItem?.pastryMeta?.prepLeadTime) {
        reason = `${relevantItem.pastryMeta.prepLeadTime} · Event trays ready`;
      } else if (variant) {
        reason = `${variant.label} in stock (${variant.stockCount} left) · ${v.address.split(',')[0]}`;
      } else if (v.category === 'drinks') {
        reason = `Cold-pressed & chilled sizes (500ml–2L) · ${v.distanceKm} km away`;
      }

      storefronts.push({
        vendor: v,
        startingPrice: minPrice,
        badgeText: v.verified ? 'Verified Store' : 'Pending Admin Verification',
        reason,
        highlightedItem: relevantItem,
        highlightedVariant: variant,
      });
    }
  }

  let headline = `Top picks matching "${prompt}"`;
  if (intent.targetCategory === 'drinks') {
    headline = 'Fresh juice and cold drinks nearby';
  } else if (intent.targetCategory === 'pastries' && intent.guestCount) {
    headline = `Small chops & pastry trays for ${intent.guestCount} guests`;
  } else if (intent.targetCategory === 'measured') {
    headline = 'Measured litre & kg sellers nearby';
  } else if (intent.maxBudget) {
    headline = `Picks under ${formatNGN(intent.maxBudget)}`;
  }

  return {
    headline,
    storefronts,
    dishes: dishPicks,
    occasionSpread: null,
  };
}

export function generateImprovedProductCopy(params: {
  name: string;
  category: MarketplaceCategorySlug;
  rawNotes: string;
}): string {
  const cleanName = params.name.trim() || 'Signature House Item';
  const notes = params.rawNotes.trim();

  if (params.category === 'drinks') {
    return `${cleanName} — freshly crafted in small hygienic batches${notes ? ` with ${notes}` : ''}. Served ice-cold in sealed bottles; refrigerate at 2–4°C upon delivery for crisp natural flavour.`;
  }
  if (params.category === 'pastries') {
    return `${cleanName} — golden, flaky, and freshly baked to order${notes ? ` featuring ${notes}` : ''}. Ideal for solo treats, office sharing, or weekend event pre-orders.`;
  }
  if (params.category === 'grill') {
    return `${cleanName} — marinated in toasted Nigerian spices and flame-grilled over open charcoal${notes ? ` (${notes})` : ''}. Packed hot in foil to lock in smoky juices.`;
  }
  if (params.category === 'measured') {
    return `${cleanName} — cleanly measured and tamper-sealed in food-grade packaging${notes ? ` (${notes})` : ''}. Exact litre/kg weights verified before rider pickup.`;
  }
  if (params.category === 'groceries') {
    return `${cleanName} — authentic pantry staple packed cleanly for single-store Chopwize Market consolidation${notes ? `. ${notes}` : '.'}`;
  }
  return `${cleanName} — freshly prepared with authentic Nigerian herbs and spice${notes ? `, highlighted by ${notes}` : ''}. Dispatched piping hot from our kitchen.`;
}

export function rollSurpriseMeal(
  vendors: Vendor[],
  maxBudget: number,
  spicePref: 'Mild' | 'Medium' | 'Lagos Hot',
  excludeShellfish: boolean,
  seedOffset = 0
): AiRecommendationResult | null {
  const pool: AiRecommendationResult[] = [];

  for (const vendor of vendors) {
    if (!vendor.isOpen || !vendor.verified) continue;
    for (const item of vendor.menu) {
      if (
        item.marketplaceCategory === 'groceries' ||
        item.marketplaceCategory === 'measured'
      ) {
        continue;
      }
      if (item.basePrice > maxBudget) continue;
      if (
        excludeShellfish &&
        (item.allergens ?? []).some((a) => /shellfish|crustacean/i.test(a))
      ) {
        continue;
      }
      if (spicePref === 'Mild' && item.isSpicy) continue;

      const reason =
        spicePref === 'Lagos Hot' && item.isSpicy
          ? `Lagos Hot spice match · ${vendor.deliveryTimeRange}`
          : `Verified ${vendor.name} · ${vendor.deliveryTimeRange}`;

      pool.push({
        item,
        vendor,
        score: item.isSpicy && spicePref === 'Lagos Hot' ? 20 : 10,
        reason,
      });
    }
  }

  if (pool.length === 0) return null;
  pool.sort((a, b) => b.score - a.score);
  return pool[seedOffset % pool.length];
}

export function updateRecentlyViewedIds(
  currentIds: string[],
  itemId: string,
  maxCount = 6
): string[] {
  const deduped = currentIds.filter((id) => id !== itemId);
  return [itemId, ...deduped].slice(0, maxCount);
}

export function toggleFavoriteVendorId(
  currentIds: string[],
  vendorId: string
): string[] {
  if (currentIds.includes(vendorId)) {
    return currentIds.filter((id) => id !== vendorId);
  }
  return [vendorId, ...currentIds];
}

export function getPopularItems(
  vendors: Vendor[],
  excludeShellfish = false
): Array<{ item: MenuItem; vendor: Vendor }> {
  const results: Array<{ item: MenuItem; vendor: Vendor }> = [];
  for (const vendor of vendors) {
    for (const item of vendor.menu) {
      if (!item.isPopular) continue;
      if (
        excludeShellfish &&
        (item.allergens ?? []).some((a) => /shellfish|crustacean/i.test(a))
      ) {
        continue;
      }
      results.push({ item, vendor });
    }
  }
  return results;
}

export interface ComparativeAiCard {
  id: string;
  vendor: Vendor;
  item: MenuItem;
  matchedVariant?: ProductVariant;
  displayPrice: number;
  prepMins: number;
  deliveryRange: string;
  rating: number;
  reviewCount: number;
  highlightBadge: string;
  reason: string;
  withinDailySafeSpend: boolean;
}

export function mapStateToCulture(stateOfOrigin?: string): CultureId | null {
  if (!stateOfOrigin) return null;
  const s = stateOfOrigin.toLowerCase();
  if (/oyo|ogun|osun|ondo|ekiti|lagos/.test(s)) return 'yoruba';
  if (/anambra|enugu|imo|abia|ebonyi/.test(s)) return 'igbo';
  if (/kano|kaduna|katsina|sokoto|bauchi|abuja/.test(s)) return 'hausa';
  if (/cross river|akwa ibom|calabar|rivers/.test(s)) return 'calabar';
  return null;
}

export function getComparativeAiRecommendations(params: {
  vendors: Vendor[];
  prompt: string;
  rules: CustomerAiRule[];
  temporaryRequests: TemporaryAiRequest[];
  safeDailySpend?: number;
  stateOfOrigin?: string;
  indigenousFrequency?: IndigenousFrequency;
}): ComparativeAiCard[] {
  const {
    vendors,
    prompt,
    rules,
    temporaryRequests,
    safeDailySpend,
    stateOfOrigin,
    indigenousFrequency = 'Occasionally',
  } = params;

  const ranked = getAiRecommendations(
    vendors,
    prompt || 'popular Nigerian meal',
    false,
    12,
    rules,
    temporaryRequests
  );

  const heritageHint =
    indigenousFrequency !== 'Only when I ask'
      ? mapStateToCulture(stateOfOrigin)
      : null;

  const picked: ComparativeAiCard[] = [];
  const usedVendors = new Set<string>();

  // Prefer 3 distinct verified nearby stores first, then backfill if fewer than 3
  const verifiedFirst = [...ranked].sort((a, b) => {
    const aV = a.vendor.verified ? 1 : 0;
    const bV = b.vendor.verified ? 1 : 0;
    if (bV !== aV) return bV - aV;
    const aCultureBoost = heritageHint && a.item.culture === heritageHint ? 1 : 0;
    const bCultureBoost = heritageHint && b.item.culture === heritageHint ? 1 : 0;
    if (bCultureBoost !== aCultureBoost && indigenousFrequency === 'Weekly') {
      return bCultureBoost - aCultureBoost;
    }
    return b.score - a.score;
  });

  for (const entry of verifiedFirst) {
    if (picked.length >= 3) break;
    if (usedVendors.has(entry.vendor.id)) continue;
    usedVendors.add(entry.vendor.id);

    const price = entry.matchedVariant
      ? entry.matchedVariant.price
      : getStartingPrice(entry.item);

    const badge =
      picked.length === 0
        ? 'Closest match'
        : entry.vendor.minEtaMins <= 20
          ? 'Fastest delivery'
          : 'Great price';

    picked.push({
      id: `${entry.vendor.id}-${entry.item.id}`,
      vendor: entry.vendor,
      item: entry.item,
      matchedVariant: entry.matchedVariant,
      displayPrice: price,
      prepMins: entry.item.prepMins,
      deliveryRange: entry.vendor.deliveryTimeRange,
      rating: entry.vendor.rating,
      reviewCount: entry.vendor.reviewCount,
      highlightBadge: badge,
      reason: entry.reason,
      withinDailySafeSpend:
        typeof safeDailySpend === 'number' ? price <= safeDailySpend : true,
    });
  }

  for (const entry of verifiedFirst) {
    if (picked.length >= 3) break;
    if (picked.some((p) => p.item.id === entry.item.id)) continue;
    const price = entry.matchedVariant
      ? entry.matchedVariant.price
      : getStartingPrice(entry.item);
    picked.push({
      id: `${entry.vendor.id}-${entry.item.id}`,
      vendor: entry.vendor,
      item: entry.item,
      matchedVariant: entry.matchedVariant,
      displayPrice: price,
      prepMins: entry.item.prepMins,
      deliveryRange: entry.vendor.deliveryTimeRange,
      rating: entry.vendor.rating,
      reviewCount: entry.vendor.reviewCount,
      highlightBadge: 'Verified store',
      reason: entry.reason,
      withinDailySafeSpend:
        typeof safeDailySpend === 'number' ? price <= safeDailySpend : true,
    });
  }

  return picked;
}
