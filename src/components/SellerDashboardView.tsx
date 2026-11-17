import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Bike,
  Cake,
  CheckCircle2,
  ClipboardList,
  Clock,
  Heart,
  LayoutGrid,
  LogOut,
  Megaphone,
  Minus,
  Package,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  User,
  Wand2,
} from 'lucide-react';
import { CATEGORY_COVER_DEFAULTS, DEMO_ACCOUNTS } from '../data/mockMarketplace';
import type {
  AuthUser,
  CustomCakeQuote,
  MarketplaceCategoryConfig,
  MenuItem,
  OptionGroup,
  OrderRecord,
  OrderStageId,
  Vendor,
  VendorPromoCampaign,
  VendorPromoType,
} from '../types/chopwize';
import { generateImprovedProductCopy } from '../utils/aiRecommender';
import { formatNGN, getStartingPrice } from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface SellerDashboardViewProps {
  vendors: Vendor[];
  selectedVendorId: string;
  onSelectVendorId: (id: string) => void;
  categories: MarketplaceCategoryConfig[];
  orders: OrderRecord[];
  cakeQuotes: CustomCakeQuote[];
  vendorPromos: VendorPromoCampaign[];
  currentUser: AuthUser | null;
  onAddProduct: (vendorId: string, newItem: MenuItem) => void;
  onUpdateStock: (
    vendorId: string,
    itemId: string,
    delta: number,
    variantId?: string
  ) => void;
  onCreateVendorPromo: (
    promo: Omit<VendorPromoCampaign, 'id' | 'createdAtLabel'>
  ) => void;
  onToggleVendorPromo: (promoId: string) => void;
  onDeleteVendorPromo: (promoId: string) => void;
  onUpdateVendorSettings: (
    vendorId: string,
    patch: Partial<
      Pick<
        Vendor,
        | 'name'
        | 'description'
        | 'isOpen'
        | 'operatingHours'
        | 'prepCutOffNote'
        | 'minOrderAmount'
        | 'supportsPickup'
        | 'supportsDelivery'
      >
    >
  ) => void;
  onRespondCakeQuote: (
    quoteId: string,
    quotedPrice: number,
    sellerNote: string
  ) => void;
  onAdvanceVendorOrder: (orderId: string, targetStage: OrderStageId) => void;
  onSwitchToCustomerPreview: (vendorId: string) => void;
  onOpenAuthModal: () => void;
  onSwitchDemoRole: (account: AuthUser) => void;
  onSignOut: () => void;
  onOpenBecomeSeller: () => void;
}

type SellerNavTab = 'overview' | 'orders' | 'catalog' | 'account';
type CatalogSubView = 'builder' | 'promos' | 'inventory';
type AccountSubView = 'settings' | 'storefront';

export function SellerDashboardView({
  vendors,
  selectedVendorId,
  onSelectVendorId,
  categories,
  orders,
  cakeQuotes,
  vendorPromos,
  currentUser,
  onAddProduct,
  onUpdateStock,
  onCreateVendorPromo,
  onToggleVendorPromo,
  onDeleteVendorPromo,
  onUpdateVendorSettings,
  onRespondCakeQuote,
  onAdvanceVendorOrder,
  onSwitchToCustomerPreview,
  onOpenAuthModal,
  onSwitchDemoRole,
  onSignOut,
  onOpenBecomeSeller,
}: SellerDashboardViewProps) {
  const [navTab, setNavTab] = useState<SellerNavTab>('overview');
  const [catalogView, setCatalogView] = useState<CatalogSubView>('builder');
  const [accountView, setAccountView] = useState<AccountSubView>('settings');
  const [showAllStoreOrders, setShowAllStoreOrders] = useState(false);

  const activeVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) ?? vendors[0],
    [vendors, selectedVendorId]
  );

  // Adaptive Add Product & Combo Deal Builder State
  const [prodName, setProdName] = useState('');
  const [prodRawNotes, setProdRawNotes] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [aiDraftPreview, setAiDraftPreview] = useState<string | null>(null);
  const [prodPrice, setProdPrice] = useState(3500);
  const [isComboDeal, setIsComboDeal] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(4800);
  const [storeCategoryInput, setStoreCategoryInput] = useState('');
  const [prodStock, setProdStock] = useState(15);
  const [variantLabel, setVariantLabel] = useState('1 Litre');
  const [variantPrice, setVariantPrice] = useState(4500);
  const [juiceIngredients, setJuiceIngredients] = useState(
    'Fresh Pineapple, Ginger, Mint'
  );
  const [juiceAddedSugar, setJuiceAddedSugar] = useState(false);
  const [pastryLeadTime, setPastryLeadTime] = useState('2 hours advance pre-order');
  const [grillWindow, setGrillWindow] = useState('Ready in 25 mins · Foil packed');

  // Promo & Campaign Builder State
  const [promoType, setPromoType] = useState<VendorPromoType>('percentage_discount');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(15);
  const [promoMinSpend, setPromoMinSpend] = useState(4500);
  const [promoTargetScope, setPromoTargetScope] = useState<'all' | 'category' | 'item'>('all');
  const [promoTargetValue, setPromoTargetValue] = useState('');

  // Custom Required / Optional Option Group Builder
  const [draftGroups, setDraftGroups] = useState<OptionGroup[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupRequired, setGroupRequired] = useState(true);
  const [choiceOneLabel, setChoiceOneLabel] = useState('');
  const [choiceOneDelta, setChoiceOneDelta] = useState(0);
  const [choiceTwoLabel, setChoiceTwoLabel] = useState('');
  const [choiceTwoDelta, setChoiceTwoDelta] = useState(600);

  // Quote Response Draft
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({});

  // Store Edit Draft
  const [storeHoursDraft, setStoreHoursDraft] = useState(activeVendor.operatingHours);
  const [storeCutOffDraft, setStoreCutOffDraft] = useState(activeVendor.prepCutOffNote);
  const [storeMinOrderDraft, setStoreMinOrderDraft] = useState(
    activeVendor.minOrderAmount
  );

  const vendorOrders = useMemo(
    () =>
      showAllStoreOrders
        ? orders
        : orders.filter((o) => o.vendorId === activeVendor.id),
    [orders, activeVendor.id, showAllStoreOrders]
  );

  const pendingKitchenCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.vendorId === activeVendor.id &&
          (o.currentStage === 'submitted' ||
            o.currentStage === 'accepted' ||
            o.currentStage === 'preparing')
      ).length,
    [orders, activeVendor.id]
  );

  const totalLiveOrderSales = useMemo(
    () =>
      orders
        .filter((o) => o.vendorId === activeVendor.id)
        .reduce((sum, ord) => sum + ord.itemsSubtotal, 0),
    [orders, activeVendor.id]
  );

  const currentVendorPromos = useMemo(
    () => vendorPromos.filter((p) => p.vendorId === activeVendor.id),
    [vendorPromos, activeVendor.id]
  );

  const activeVendorPromoCount = useMemo(
    () => currentVendorPromos.filter((p) => p.active).length,
    [currentVendorPromos]
  );

  const storeCategories = useMemo(
    () =>
      Array.from(
        new Set(activeVendor.menu.map((m) => m.storeCategory || 'Signature'))
      ),
    [activeVendor.menu]
  );

  const vendorQuotes = cakeQuotes.filter((q) => q.vendorId === activeVendor.id);
  const lowStockCount = activeVendor.menu.reduce((count, item) => {
    if (item.variants && item.variants.length > 0) {
      return count + item.variants.filter((v) => v.stockCount <= 8).length;
    }
    return count + ((item.stockCount ?? 20) <= 8 ? 1 : 0);
  }, 0);

  function handleImproveCopyWithAi() {
    const draft = generateImprovedProductCopy({
      name: prodName || 'Fresh Signature Product',
      category: activeVendor.category,
      rawNotes: prodRawNotes || prodDesc,
    });
    setAiDraftPreview(draft);
  }

  function handleAddOptionGroup() {
    if (!groupTitle.trim()) return;
    const choices = [
      choiceOneLabel.trim()
        ? {
            id: `opt-${Date.now()}-1`,
            name: choiceOneLabel.trim(),
            priceDelta: Math.max(0, choiceOneDelta),
          }
        : null,
      choiceTwoLabel.trim()
        ? {
            id: `opt-${Date.now()}-2`,
            name: choiceTwoLabel.trim(),
            priceDelta: Math.max(0, choiceTwoDelta),
          }
        : null,
    ].filter((c): c is { id: string; name: string; priceDelta: number } => c !== null);

    if (choices.length === 0) return;

    const newGroup: OptionGroup = {
      id: `grp-${Date.now()}`,
      title: groupTitle.trim(),
      required: groupRequired,
      minSelect: groupRequired ? 1 : 0,
      maxSelect: groupRequired ? 1 : choices.length,
      choices,
    };

    setDraftGroups((prev) => [...prev, newGroup]);
    setGroupTitle('');
    setChoiceOneLabel('');
    setChoiceOneDelta(0);
    setChoiceTwoLabel('');
    setChoiceTwoDelta(600);
  }

  function handleAddPresetShawarmaGroup() {
    setDraftGroups((prev) => [
      ...prev,
      {
        id: `grp-shawarma-${Date.now()}`,
        title: 'Shawarma Sausage',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        choices: [
          { id: `s0-${Date.now()}`, name: 'No Sausage', priceDelta: 0 },
          { id: `s1-${Date.now()}`, name: '1 Sausage', priceDelta: 600 },
          { id: `s2-${Date.now()}`, name: '2 Sausages', priceDelta: 1200 },
        ],
      },
    ]);
  }

  function handleSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!prodName.trim()) return;

    const id = `prod-${Date.now()}`;
    const coverImg = CATEGORY_COVER_DEFAULTS[activeVendor.category];
    const resolvedCategory =
      storeCategoryInput.trim() ||
      (isComboDeal
        ? 'Combo Deals'
        : categories.find((c) => c.id === activeVendor.category)?.shortLabel ?? 'Menu');

    const newItem: MenuItem = {
      id,
      vendorId: activeVendor.id,
      name: prodName.trim(),
      description:
        prodDesc.trim() ||
        prodRawNotes.trim() ||
        `Freshly listed by ${activeVendor.name}.`,
      basePrice: Math.max(200, prodPrice),
      originalPrice:
        isComboDeal && originalPrice > prodPrice ? originalPrice : undefined,
      isCombo: isComboDeal,
      sellingUnit: isComboDeal
        ? 'Combo'
        : activeVendor.category === 'drinks'
          ? 'Bottle'
          : activeVendor.category === 'measured'
            ? 'Litre'
            : activeVendor.category === 'pastries'
              ? 'Pack'
              : activeVendor.category === 'grill'
                ? 'Platter'
                : 'Plate',
      storeCategory: resolvedCategory,
      marketplaceCategory: activeVendor.category,
      imageUrl: coverImg,
      prepMins: 18,
      stockCount: Math.max(1, prodStock),
      variants:
        !isComboDeal &&
        (activeVendor.category === 'drinks' ||
          activeVendor.category === 'measured' ||
          activeVendor.category === 'pastries' ||
          activeVendor.category === 'grill')
          ? [
              {
                id: 'base-var',
                label:
                  activeVendor.category === 'drinks'
                    ? '500ml Standard'
                    : activeVendor.category === 'measured'
                      ? '500ml Starter'
                      : activeVendor.category === 'pastries'
                        ? 'Single Pack'
                        : 'Half Portion',
                price: Math.max(200, prodPrice),
                stockCount: Math.max(1, prodStock),
              },
              {
                id: 'bulk-var',
                label: variantLabel.trim() || 'Family / Bulk Size',
                price: Math.max(200, variantPrice),
                stockCount: Math.max(1, Math.floor(prodStock / 2)),
              },
            ]
          : undefined,
      juiceMeta:
        activeVendor.category === 'drinks'
          ? {
              ingredients: juiceIngredients
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              addedSugar: juiceAddedSugar,
              storageNote: 'Keep chilled at 2–4°C. Consume within 72 hours.',
              freshnessStatus: 'Freshly pressed on order',
            }
          : undefined,
      pastryMeta:
        activeVendor.category === 'pastries'
          ? {
              allowsCustomCakeQuote: true,
              prepLeadTime: pastryLeadTime,
              supportsPreOrder: true,
            }
          : undefined,
      grillMeta:
        activeVendor.category === 'grill'
          ? { collectionWindow: grillWindow }
          : undefined,
      measuredMeta:
        activeVendor.category === 'measured'
          ? { unitType: 'Litres', stockTracked: true }
          : undefined,
      optionGroups: draftGroups,
    };

    onAddProduct(activeVendor.id, newItem);
    setProdName('');
    setProdRawNotes('');
    setProdDesc('');
    setAiDraftPreview(null);
    setIsComboDeal(false);
    setStoreCategoryInput('');
    setDraftGroups([]);
  }

  function handleCreatePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const defaultTitle =
      promoType === 'free_delivery'
        ? `Free Delivery on orders from ${formatNGN(promoMinSpend)}`
        : promoType === 'percentage_discount'
          ? `${promoDiscountPercent}% Off Selected Specials`
          : `${activeVendor.name} Combo Feast`;

    const resolvedTitle = promoTitle.trim() || defaultTitle;
    const resolvedDescription =
      promoDescription.trim() ||
      (promoType === 'free_delivery'
        ? `₦0 delivery automatically applied on carts above ${formatNGN(promoMinSpend)}.`
        : promoType === 'percentage_discount'
          ? `Instant ${promoDiscountPercent}% storewide or item discount live on storefront & checkout.`
          : 'Bundled meal value synced directly to your storefront menu.');

    onCreateVendorPromo({
      vendorId: activeVendor.id,
      type: promoType,
      title: resolvedTitle,
      description: resolvedDescription,
      discountPercent:
        promoType === 'percentage_discount'
          ? Math.min(70, Math.max(5, promoDiscountPercent))
          : undefined,
      minOrderAmount:
        promoType === 'free_delivery' ? Math.max(0, promoMinSpend) : undefined,
      targetItemId:
        promoType === 'percentage_discount' && promoTargetScope === 'item'
          ? promoTargetValue || activeVendor.menu[0]?.id
          : undefined,
      targetStoreCategory:
        promoType === 'percentage_discount' && promoTargetScope === 'category'
          ? promoTargetValue || storeCategories[0]
          : undefined,
      active: true,
    });

    setPromoTitle('');
    setPromoDescription('');
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Light-Mode Store Header Card */}
      <section className="bg-gradient-to-br from-[#F4EFFF] via-white to-[#FAF8F4] border border-[#D0BCFC] text-[#111827] rounded-[20px] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#A981FF] text-[#111827] flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#6F42C1]">
                Vendor Portal
              </div>
              <div className="text-[15px] font-bold text-[#111827] truncate">
                {activeVendor.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSwitchToCustomerPreview(activeVendor.id)}
            className="px-3 h-8 rounded-full bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[12px] font-semibold shrink-0 cursor-pointer"
          >
            Preview Store
          </button>
        </div>

        <div>
          <label
            htmlFor="seller-vendor-switcher"
            className="block text-[11px] font-semibold text-[#6B7280] mb-1"
          >
            Active Storefront
          </label>
          <select
            id="seller-vendor-switcher"
            value={activeVendor.id}
            onChange={(e) => {
              const next = vendors.find((v) => v.id === e.target.value);
              onSelectVendorId(e.target.value);
              if (next) {
                setStoreHoursDraft(next.operatingHours);
                setStoreCutOffDraft(next.prepCutOffNote);
                setStoreMinOrderDraft(next.minOrderAmount);
              }
            }}
            className="w-full h-10 px-3 rounded-xl bg-white border border-[#D0BCFC] text-[13px] font-semibold text-[#111827] focus:outline-none focus:border-[#A981FF]"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id} className="text-[#111827]">
                {v.name} ({v.verified ? 'Verified' : 'Pending Verification'})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* TAB 1: OVERVIEW */}
      {navTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-1">
              <div className="text-[11px] font-medium text-[#6B7280] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                <span>Store Sales</span>
              </div>
              <div className="tabular-nums text-[20px] font-bold tracking-[-0.02em] text-[#111827]">
                {formatNGN(148500 + totalLiveOrderSales)}
              </div>
              <div className="text-[11px] font-medium text-[#16A34A]">
                Live orders synced
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-1">
              <div className="text-[11px] font-medium text-[#6B7280] flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                <span>Menu &amp; Stock</span>
              </div>
              <div className="tabular-nums text-[20px] font-bold tracking-[-0.02em] text-[#111827]">
                {activeVendor.menu.length} items
              </div>
              <div className="text-[11px] font-medium text-[#6B7280]">
                {lowStockCount} variant(s) ≤ 8 left
              </div>
            </div>
          </div>

          {/* Pending Orders Quick Action */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold text-[#111827]">
                Kitchen Order Queue
              </div>
              <p className="text-[13px] text-[#6B7280]">
                {pendingKitchenCount} pending kitchen order(s) for {activeVendor.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNavTab('orders')}
              className="h-9 px-3.5 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[13px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Promo & Campaign Builder Quick Shortcut */}
          <div className="bg-white rounded-2xl border border-[#D0BCFC] p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#111827]">
                <Megaphone className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                <span>Promo &amp; Campaign Builder</span>
              </div>
              <p className="text-[13px] text-[#6B7280] mt-0.5">
                {activeVendorPromoCount} active campaign(s) · Combo Deals, Free Delivery &amp; % Discounts
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCatalogView('promos');
                setNavTab('catalog');
              }}
              className="h-9 px-3.5 rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC] border border-[#D0BCFC] text-[#6F42C1] text-[13px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Build Promo</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#111827]">
                Storefront Status
              </div>
              {activeVendor.verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[11px] font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Verified Vendor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#6B7280] leading-[1.45]">
              Accepting orders, setting dishes Ready for Rider, or launching store promos updates the live Customer &amp; Rider portals immediately.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & LIVE DISPATCH */}
      {navTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
              Incoming Orders ({vendorOrders.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowAllStoreOrders((v) => !v)}
              className={`px-3 h-8 rounded-full text-[11px] font-semibold border cursor-pointer ${
                showAllStoreOrders
                  ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                  : 'bg-white border-[#E5E7EB] text-[#111827]'
              }`}
            >
              {showAllStoreOrders ? 'All Stores Active' : 'Current Store Only'}
            </button>
          </div>

          {vendorOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center space-y-2">
              <div className="text-[15px] font-semibold text-[#111827]">
                No orders yet for {activeVendor.name}
              </div>
              <p className="text-[13px] text-[#6B7280]">
                Switch to All Stores or place a customer order to process live kitchen tickets and dispatch riders.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorOrders.map((ord) => {
                const nextAction =
                  ord.currentStage === 'submitted'
                    ? {
                        label: 'Accept Order',
                        nextStage: 'accepted' as OrderStageId,
                      }
                    : ord.currentStage === 'accepted'
                      ? {
                          label: 'Start Preparing',
                          nextStage: 'preparing' as OrderStageId,
                        }
                      : ord.currentStage === 'preparing'
                        ? {
                            label: 'Mark Ready for Rider',
                            nextStage: 'ready' as OrderStageId,
                          }
                        : null;

                return (
                  <div
                    key={ord.orderId}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold tabular-nums text-[#111827]">
                            #{ord.orderId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[11px] font-semibold uppercase">
                            {ord.currentStage.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[12px] text-[#6B7280] mt-0.5">
                          {ord.vendorName} · {ord.createdAtLabel}
                        </div>
                      </div>
                      <span className="text-[14px] font-bold tabular-nums text-[#111827]">
                        {formatNGN(ord.itemsSubtotal)}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] p-3 space-y-1.5">
                      {ord.items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="text-[13px] text-[#111827] flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-[#6F42C1]">
                              {item.packLabel || 'Pack 1'}:
                            </span>{' '}
                            <span className="font-medium">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.selectedVariant && (
                              <span className="text-[#6B7280]">
                                {' '}
                                ({item.selectedVariant.label})
                              </span>
                            )}
                            {item.selections.length > 0 && (
                              <div className="text-[11px] text-[#6B7280]">
                                {item.selections
                                  .map((s) =>
                                    s.choices.map((c) => c.name).join(', ')
                                  )
                                  .join(' · ')}
                              </div>
                            )}
                          </div>
                          <span className="tabular-nums text-[12px] font-semibold text-[#111827] shrink-0">
                            {formatNGN(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {(ord.vendorNote || ord.ecoPackaging || (ord.riderTip ?? 0) > 0) && (
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {ord.ecoPackaging && (
                          <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] font-semibold">
                            Brown / Eco Packaging
                          </span>
                        )}
                        {(ord.riderTip ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4EFFF] text-[#6F42C1] font-semibold">
                            <Heart className="w-3 h-3" aria-hidden="true" />
                            <span>Includes {formatNGN(ord.riderTip ?? 0)} rider tip</span>
                          </span>
                        )}
                        {ord.vendorNote && (
                          <span className="px-2.5 py-1 rounded-xl bg-[#FEF3C7] text-[#92400E] font-medium">
                            Note: {ord.vendorNote}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-[12px] text-[#6B7280]">
                      Deliver to: <strong className="text-[#111827]">{ord.deliveryAddress}</strong>
                    </div>

                    {nextAction ? (
                      <button
                        type="button"
                        onClick={() =>
                          onAdvanceVendorOrder(ord.orderId, nextAction.nextStage)
                        }
                        className="w-full h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold cursor-pointer transition-colors"
                      >
                        {nextAction.label}
                      </button>
                    ) : (
                      <div className="h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[12px] font-semibold text-[#16A34A] inline-flex items-center gap-1.5 w-full justify-center">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {ord.currentStage === 'ready'
                            ? 'Ready · Broadcasted to Chopwize Riders'
                            : ord.currentStage === 'delivered'
                              ? 'Delivered to Customer'
                              : `Rider Dispatched (${ord.rider.name})`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Cake Quotes Section */}
          {vendorQuotes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#111827]">
                <Cake className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                <span>Custom Cake Quote Requests ({vendorQuotes.length})</span>
              </div>
              {vendorQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-white rounded-2xl border border-[#D0BCFC] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="tabular-nums text-[12px] font-bold text-[#6F42C1]">
                      {quote.id} · {quote.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[11px] font-semibold">
                      {quote.status}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#111827] space-y-0.5">
                    <div className="font-semibold">
                      {quote.size} · {quote.flavour} · {quote.icing}
                    </div>
                    <div className="text-[#6B7280]">
                      Inscription: &ldquo;{quote.inscription}&rdquo; · Due:{' '}
                      {quote.deliveryDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={String(quote.quotedPrice ?? 28000)}
                      value={quotePrices[quote.id] ?? ''}
                      onChange={(e) =>
                        setQuotePrices((prev) => ({
                          ...prev,
                          [quote.id]: e.target.value,
                        }))
                      }
                      aria-label={`Quote price for ${quote.id}`}
                      className="w-28 h-9 px-2.5 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] tabular-nums"
                    />
                    <input
                      type="text"
                      placeholder="Baker note..."
                      value={quoteNotes[quote.id] ?? ''}
                      onChange={(e) =>
                        setQuoteNotes((prev) => ({
                          ...prev,
                          [quote.id]: e.target.value,
                        }))
                      }
                      aria-label={`Baker note for ${quote.id}`}
                      className="flex-1 h-9 px-2.5 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onRespondCakeQuote(
                          quote.id,
                          Number(
                            quotePrices[quote.id] || quote.quotedPrice || 28000
                          ),
                          quoteNotes[quote.id] ||
                            'Confirmed availability for requested date.'
                        )
                      }
                      className="px-3 h-9 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[12px] font-semibold shrink-0 cursor-pointer"
                    >
                      Send Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATALOG (ADD ITEM / COMBO + PROMO CAMPAIGNS + STOCK) */}
      {navTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setCatalogView('builder')}
              className={`h-9 rounded-xl text-[12px] font-semibold cursor-pointer ${
                catalogView === 'builder'
                  ? 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={() => setCatalogView('promos')}
              className={`h-9 rounded-xl text-[12px] font-semibold cursor-pointer inline-flex items-center justify-center gap-1 ${
                catalogView === 'promos'
                  ? 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>Promos</span>
              {activeVendorPromoCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#A981FF] text-[#111827] text-[10px] font-bold">
                  {activeVendorPromoCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCatalogView('inventory')}
              className={`h-9 rounded-xl text-[12px] font-semibold cursor-pointer ${
                catalogView === 'inventory'
                  ? 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Stock ({activeVendor.menu.length})
            </button>
          </div>

          {catalogView === 'promos' && (
            <div className="space-y-4">
              <form
                onSubmit={handleCreatePromoSubmit}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
                      Promo &amp; Campaign Builder
                    </h2>
                    <p className="text-[11px] text-[#6B7280]">
                      Updates {activeVendor.name} storefront &amp; customer checkout live
                    </p>
                  </div>
                </div>

                {/* Campaign Type Selector */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'percentage_discount' as const,
                      label: '% Discount',
                      icon: BadgePercent,
                    },
                    {
                      id: 'free_delivery' as const,
                      label: 'Free Delivery',
                      icon: Truck,
                    },
                    {
                      id: 'combo_deal' as const,
                      label: 'Combo Deal',
                      icon: Sparkles,
                    },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = promoType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPromoType(opt.id)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer ${
                          active
                            ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                            : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label
                    htmlFor="promo-title"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Campaign Headline
                  </label>
                  <input
                    id="promo-title"
                    type="text"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder={
                      promoType === 'free_delivery'
                        ? 'e.g. Free Island Delivery on orders ₦4,500+'
                        : promoType === 'percentage_discount'
                          ? 'e.g. Weekend Party Jollof 15% Off'
                          : 'e.g. Lunch Box + Drink Value Bundle'
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>

                {promoType === 'percentage_discount' && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB]">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="promo-pct"
                          className="block text-[11px] font-medium text-[#6B7280] mb-1"
                        >
                          Discount (% off)
                        </label>
                        <input
                          id="promo-pct"
                          type="number"
                          min={5}
                          max={70}
                          step={5}
                          value={promoDiscountPercent}
                          onChange={(e) =>
                            setPromoDiscountPercent(Number(e.target.value))
                          }
                          className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[13px] tabular-nums text-[#111827]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="promo-scope"
                          className="block text-[11px] font-medium text-[#6B7280] mb-1"
                        >
                          Applies To
                        </label>
                        <select
                          id="promo-scope"
                          value={promoTargetScope}
                          onChange={(e) => {
                            const next = e.target.value as 'all' | 'category' | 'item';
                            setPromoTargetScope(next);
                            if (next === 'category') {
                              setPromoTargetValue(storeCategories[0] ?? '');
                            } else if (next === 'item') {
                              setPromoTargetValue(activeVendor.menu[0]?.id ?? '');
                            } else {
                              setPromoTargetValue('');
                            }
                          }}
                          className="w-full h-9 px-2 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                        >
                          <option value="all">All Store Items</option>
                          <option value="category">Specific Category</option>
                          <option value="item">Specific Menu Item</option>
                        </select>
                      </div>
                    </div>

                    {promoTargetScope === 'category' && (
                      <div>
                        <label
                          htmlFor="promo-cat-target"
                          className="block text-[11px] font-medium text-[#6B7280] mb-1"
                        >
                          Select Category
                        </label>
                        <select
                          id="promo-cat-target"
                          value={promoTargetValue}
                          onChange={(e) => setPromoTargetValue(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                        >
                          {storeCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {promoTargetScope === 'item' && (
                      <div>
                        <label
                          htmlFor="promo-item-target"
                          className="block text-[11px] font-medium text-[#6B7280] mb-1"
                        >
                          Select Menu Item
                        </label>
                        <select
                          id="promo-item-target"
                          value={promoTargetValue}
                          onChange={(e) => setPromoTargetValue(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                        >
                          {activeVendor.menu.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({formatNGN(getStartingPrice(item))})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {promoType === 'free_delivery' && (
                  <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB]">
                    <label
                      htmlFor="promo-min-spend"
                      className="block text-[11px] font-medium text-[#6B7280] mb-1"
                    >
                      Minimum Cart Spend for Free Delivery (₦)
                    </label>
                    <input
                      id="promo-min-spend"
                      type="number"
                      min={0}
                      step={500}
                      value={promoMinSpend}
                      onChange={(e) => setPromoMinSpend(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[13px] tabular-nums text-[#111827]"
                    />
                  </div>
                )}

                {promoType === 'combo_deal' && (
                  <div className="p-3 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-[#111827]">
                      Want to list a priced bundle item on your menu too?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsComboDeal(true);
                        setCatalogView('builder');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#D0BCFC] text-[#6F42C1] font-semibold shrink-0 cursor-pointer"
                    >
                      Open Item Builder
                    </button>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="promo-desc"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Short Promo Copy
                  </label>
                  <input
                    id="promo-desc"
                    type="text"
                    value={promoDescription}
                    onChange={(e) => setPromoDescription(e.target.value)}
                    placeholder="e.g. Auto-applies on verified Chopwize orders today"
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold cursor-pointer"
                >
                  Launch Campaign Live
                </button>
              </form>

              <div className="space-y-2.5">
                <h3 className="text-[15px] font-semibold text-[#111827] px-1">
                  Active &amp; Paused Campaigns ({currentVendorPromos.length})
                </h3>
                {currentVendorPromos.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-center text-[13px] text-[#6B7280]">
                    No campaigns created for {activeVendor.name} yet. Launch one above to boost orders.
                  </div>
                ) : (
                  currentVendorPromos.map((promo) => (
                    <div
                      key={promo.id}
                      className={`bg-white rounded-2xl border p-3.5 space-y-2 ${
                        promo.active ? 'border-[#D0BCFC]' : 'border-[#E5E7EB] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[10px] font-bold uppercase">
                            <Tag className="w-3 h-3" aria-hidden="true" />
                            <span>{promo.type.replace('_', ' ')}</span>
                          </div>
                          <div className="text-[14px] font-bold text-[#111827] mt-1">
                            {promo.title}
                          </div>
                          <p className="text-[12px] text-[#6B7280] mt-0.5">
                            {promo.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={promo.active}
                            onClick={() => onToggleVendorPromo(promo.id)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold cursor-pointer ${
                              promo.active
                                ? 'bg-[#DCFCE7] text-[#16A34A]'
                                : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
                            }`}
                          >
                            {promo.active ? 'Active' : 'Paused'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVendorPromo(promo.id)}
                            aria-label={`Delete campaign ${promo.title}`}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#B42318] hover:bg-[#FEF3F2] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {promo.createdAtLabel}
                        {promo.discountPercent
                          ? ` · ${promo.discountPercent}% off`
                          : ''}
                        {typeof promo.minOrderAmount === 'number'
                          ? ` · Min spend ${formatNGN(promo.minOrderAmount)}`
                          : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {catalogView === 'builder' && (
            <>
              <form
                onSubmit={handleSubmitProduct}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
                    Catalog &amp; Combo Builder
                  </h2>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isComboDeal}
                    onClick={() => setIsComboDeal((v) => !v)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                      isComboDeal
                        ? 'bg-[#A981FF] text-[#111827]'
                        : 'bg-[#F4EFFF] text-[#6F42C1]'
                    }`}
                  >
                    {isComboDeal ? 'Combo Deal ON' : 'Mark as Combo Deal'}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="seller-prod-name"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Product or Combo Name
                  </label>
                  <input
                    id="seller-prod-name"
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder={
                      isComboDeal
                        ? 'e.g. Big Whizz Shawarma & Zobo Combo'
                        : activeVendor.category === 'drinks'
                          ? 'e.g. Watermelon Mint Cooler'
                          : 'e.g. Jumbo Suya Shawarma'
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="seller-prod-price"
                      className="block text-[12px] font-medium text-[#6B7280] mb-1"
                    >
                      Selling Price (₦)
                    </label>
                    <input
                      id="seller-prod-price"
                      type="number"
                      min={200}
                      step={100}
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] tabular-nums text-[#111827]"
                    />
                  </div>
                  {isComboDeal ? (
                    <div>
                      <label
                        htmlFor="seller-orig-price"
                        className="block text-[12px] font-medium text-[#6B7280] mb-1"
                      >
                        Original Price (Strikethrough ₦)
                      </label>
                      <input
                        id="seller-orig-price"
                        type="number"
                        min={200}
                        step={100}
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] tabular-nums text-[#111827]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="seller-prod-stock"
                        className="block text-[12px] font-medium text-[#6B7280] mb-1"
                      >
                        Initial Stock Qty
                      </label>
                      <input
                        id="seller-prod-stock"
                        type="number"
                        min={1}
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] tabular-nums text-[#111827]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="seller-store-cat"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Menu Category Tab
                  </label>
                  <input
                    id="seller-store-cat"
                    type="text"
                    value={storeCategoryInput}
                    onChange={(e) => setStoreCategoryInput(e.target.value)}
                    placeholder={
                      isComboDeal
                        ? 'Combo Deals'
                        : 'e.g. Shawarma & Grills, Main Plates, Drinks'
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seller-prod-notes"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Ingredients / Quick Notes
                  </label>
                  <input
                    id="seller-prod-notes"
                    type="text"
                    value={prodRawNotes}
                    onChange={(e) => setProdRawNotes(e.target.value)}
                    placeholder="e.g. charcoal grilled chicken, garlic cream, hot pepper"
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="seller-prod-desc"
                      className="text-[12px] font-medium text-[#6B7280]"
                    >
                      Customer Description
                    </label>
                    <button
                      type="button"
                      onClick={handleImproveCopyWithAi}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4EFFF] hover:bg-[#D0BCFC] text-[#111827] text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3 text-[#6F42C1]" aria-hidden="true" />
                      <span>Refine copy</span>
                    </button>
                  </div>

                  {aiDraftPreview && (
                    <div className="p-3 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] space-y-2">
                      <p className="text-[13px] text-[#111827] leading-[1.45]">
                        {aiDraftPreview}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProdDesc(aiDraftPreview);
                            setAiDraftPreview(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#A981FF] text-[#111827] text-[11px] font-semibold cursor-pointer"
                        >
                          Use Description
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiDraftPreview(null)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium cursor-pointer"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    id="seller-prod-desc"
                    rows={2}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Write description or click Refine copy..."
                    className="w-full p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                  />
                </div>

                {/* Custom Option Groups Builder (Required / Optional Choices) */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#111827]">
                      Custom Option Groups ({draftGroups.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPresetShawarmaGroup}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#D0BCFC] text-[#6F42C1] text-[11px] font-semibold cursor-pointer"
                    >
                      + Shawarma Sausage Preset
                    </button>
                  </div>

                  {draftGroups.length > 0 && (
                    <div className="space-y-1.5">
                      {draftGroups.map((grp) => (
                        <div
                          key={grp.id}
                          className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-[#111827]">
                              {grp.title}{' '}
                              <span className="text-[#6F42C1]">
                                ({grp.required ? 'Required' : 'Optional'})
                              </span>
                            </div>
                            <div className="text-[11px] text-[#6B7280] truncate">
                              {grp.choices
                                .map((c) => `${c.name} (+${formatNGN(c.priceDelta)})`)
                                .join(' · ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftGroups((prev) =>
                                prev.filter((g) => g.id !== grp.id)
                              )
                            }
                            aria-label={`Remove option group ${grp.title}`}
                            className="p-1 text-[#6B7280] hover:text-[#B42318] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 pt-1 border-t border-[#E5E7EB]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={groupTitle}
                        onChange={(e) => setGroupTitle(e.target.value)}
                        placeholder="Group title (e.g. Protein Choice)"
                        aria-label="Option group title"
                        className="flex-1 h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                      />
                      <button
                        type="button"
                        onClick={() => setGroupRequired((v) => !v)}
                        className={`px-2.5 h-9 rounded-xl text-[11px] font-semibold border cursor-pointer shrink-0 ${
                          groupRequired
                            ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                            : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                        }`}
                      >
                        {groupRequired ? 'Required' : 'Optional'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={choiceOneLabel}
                        onChange={(e) => setChoiceOneLabel(e.target.value)}
                        placeholder="Choice 1 (e.g. Regular)"
                        aria-label="Option choice 1 label"
                        className="h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                      />
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={choiceOneDelta}
                        onChange={(e) => setChoiceOneDelta(Number(e.target.value))}
                        placeholder="+₦0"
                        aria-label="Option choice 1 extra price"
                        className="h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827] tabular-nums"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={choiceTwoLabel}
                        onChange={(e) => setChoiceTwoLabel(e.target.value)}
                        placeholder="Choice 2 (e.g. Extra Meat)"
                        aria-label="Option choice 2 label"
                        className="h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                      />
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={choiceTwoDelta}
                        onChange={(e) => setChoiceTwoDelta(Number(e.target.value))}
                        placeholder="+₦600"
                        aria-label="Option choice 2 extra price"
                        className="h-9 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827] tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddOptionGroup}
                      className="w-full h-9 rounded-xl bg-white hover:bg-[#F4EFFF] border border-[#D0BCFC] text-[#111827] text-[12px] font-semibold cursor-pointer"
                    >
                      + Add Option Group to Item
                    </button>
                  </div>
                </div>

                {/* Category-Adaptive Metadata */}
                {activeVendor.category === 'drinks' && (
                  <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-2">
                    <div className="text-[11px] font-semibold text-[#6F42C1]">
                      Juice &amp; Beverage Metadata
                    </div>
                    <input
                      type="text"
                      value={juiceIngredients}
                      onChange={(e) => setJuiceIngredients(e.target.value)}
                      aria-label="Juice ingredients"
                      className="w-full h-9 px-3 rounded-lg bg-white border border-[#E5E7EB] text-[12px] text-[#111827]"
                    />
                    <label className="flex items-center gap-2 text-[12px] text-[#111827]">
                      <input
                        type="checkbox"
                        checked={!juiceAddedSugar}
                        onChange={(e) => setJuiceAddedSugar(!e.target.checked)}
                        className="accent-[#A981FF]"
                      />
                      <span>No Added Sugar (100% Natural)</span>
                    </label>
                  </div>
                )}

                {!isComboDeal &&
                  (activeVendor.category === 'drinks' ||
                    activeVendor.category === 'measured' ||
                    activeVendor.category === 'pastries' ||
                    activeVendor.category === 'grill') && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="seller-var-label"
                          className="block text-[11px] font-medium text-[#6B7280] mb-1"
                        >
                          2nd Size / Pack Variant
                        </label>
                        <input
                          id="seller-var-label"
                          type="text"
                          value={variantLabel}
                          onChange={(e) => setVariantLabel(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[12px] text-[#111827]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="seller-var-price"
                          className="block text-[11px] font-medium text-[#6B7280] mb-1"
                        >
                          Variant Price (₦)
                        </label>
                        <input
                          id="seller-var-price"
                          type="number"
                          min={200}
                          step={100}
                          value={variantPrice}
                          onChange={(e) => setVariantPrice(Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[12px] text-[#111827] tabular-nums"
                        />
                      </div>
                    </div>
                  )}

                {activeVendor.category === 'pastries' && (
                  <div>
                    <label
                      htmlFor="seller-pastry-lead"
                      className="block text-[11px] font-medium text-[#6B7280] mb-1"
                    >
                      Pastry Pre-Order Lead Time
                    </label>
                    <input
                      id="seller-pastry-lead"
                      type="text"
                      value={pastryLeadTime}
                      onChange={(e) => setPastryLeadTime(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[12px] text-[#111827]"
                    />
                  </div>
                )}

                {activeVendor.category === 'grill' && (
                  <div>
                    <label
                      htmlFor="seller-grill-window"
                      className="block text-[11px] font-medium text-[#6B7280] mb-1"
                    >
                      Grill Prep / Collection Window
                    </label>
                    <input
                      id="seller-grill-window"
                      type="text"
                      value={grillWindow}
                      onChange={(e) => setGrillWindow(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[12px] text-[#111827]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold cursor-pointer"
                >
                  Publish to {activeVendor.name}
                </button>
              </form>

              <div className="space-y-2">
                <h3 className="text-[15px] font-semibold text-[#111827] px-1">
                  Live Storefront Items ({activeVendor.menu.length})
                </h3>
                {activeVendor.menu.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[#111827] truncate">
                        {item.name}
                      </div>
                      <div className="text-[12px] text-[#6B7280] tabular-nums">
                        {formatNGN(getStartingPrice(item))}
                        {item.originalPrice ? ` (was ${formatNGN(item.originalPrice)})` : ''}{' '}
                        · {item.optionGroups.length} option group(s)
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[11px] font-semibold shrink-0">
                      Live
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {catalogView === 'inventory' && (
            <div className="space-y-2.5">
              {activeVendor.menu.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2.5"
                >
                  <div className="text-[14px] font-semibold text-[#111827]">
                    {item.name}
                  </div>
                  {item.variants && item.variants.length > 0 ? (
                    <div className="space-y-2">
                      {item.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB]"
                        >
                          <div>
                            <div className="text-[13px] font-semibold text-[#111827]">
                              {variant.label}
                            </div>
                            <div className="text-[12px] tabular-nums text-[#6B7280]">
                              {formatNGN(variant.price)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateStock(activeVendor.id, item.id, -1, variant.id)
                              }
                              aria-label={`Decrease stock for ${variant.label}`}
                              className="w-7 h-7 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <span className="tabular-nums text-[13px] font-bold w-8 text-center">
                              {variant.stockCount}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateStock(activeVendor.id, item.id, 1, variant.id)
                              }
                              aria-label={`Increase stock for ${variant.label}`}
                              className="w-7 h-7 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB]">
                      <span className="text-[13px] text-[#6B7280]">Available Units</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateStock(activeVendor.id, item.id, -1)}
                          aria-label={`Decrease stock for ${item.name}`}
                          className="w-7 h-7 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <span className="tabular-nums text-[13px] font-bold w-8 text-center">
                          {item.stockCount ?? 20}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateStock(activeVendor.id, item.id, 1)}
                          aria-label={`Increase stock for ${item.name}`}
                          className="w-7 h-7 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCOUNT (STORE SETTINGS + PORTAL / AUTH SWITCHER) */}
      {navTab === 'account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setAccountView('settings')}
              className={`h-9 rounded-xl text-[13px] font-semibold cursor-pointer ${
                accountView === 'settings'
                  ? 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Hours &amp; Fulfilment
            </button>
            <button
              type="button"
              onClick={() => setAccountView('storefront')}
              className={`h-9 rounded-xl text-[13px] font-semibold cursor-pointer ${
                accountView === 'storefront'
                  ? 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Store Profile
            </button>
          </div>

          {accountView === 'settings' ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                  <span className="text-[14px] font-semibold text-[#111827]">
                    Store Open Status
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activeVendor.isOpen}
                  onClick={() =>
                    onUpdateVendorSettings(activeVendor.id, {
                      isOpen: !activeVendor.isOpen,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer ${
                    activeVendor.isOpen
                      ? 'bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A]'
                      : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
                  }`}
                >
                  {activeVendor.isOpen ? 'Open for Orders' : 'Closed'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={activeVendor.supportsDelivery}
                  onClick={() =>
                    onUpdateVendorSettings(activeVendor.id, {
                      supportsDelivery: !activeVendor.supportsDelivery,
                    })
                  }
                  className={`h-10 rounded-xl text-[13px] font-semibold border cursor-pointer ${
                    activeVendor.supportsDelivery
                      ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#6B7280]'
                  }`}
                >
                  {activeVendor.supportsDelivery ? '✓ Delivery Active' : 'Delivery Off'}
                </button>
                <button
                  type="button"
                  aria-pressed={activeVendor.supportsPickup}
                  onClick={() =>
                    onUpdateVendorSettings(activeVendor.id, {
                      supportsPickup: !activeVendor.supportsPickup,
                    })
                  }
                  className={`h-10 rounded-xl text-[13px] font-semibold border cursor-pointer ${
                    activeVendor.supportsPickup
                      ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#6B7280]'
                  }`}
                >
                  {activeVendor.supportsPickup ? '✓ Pickup Active' : 'Pickup Off'}
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label
                    htmlFor="settings-hours"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Operating Hours
                  </label>
                  <input
                    id="settings-hours"
                    type="text"
                    value={storeHoursDraft}
                    onChange={(e) => setStoreHoursDraft(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-cutoff"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Prep &amp; Cut-Off Notice
                  </label>
                  <input
                    id="settings-cutoff"
                    type="text"
                    value={storeCutOffDraft}
                    onChange={(e) => setStoreCutOffDraft(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-min-order"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Minimum Order Rule (₦)
                  </label>
                  <input
                    id="settings-min-order"
                    type="number"
                    min={500}
                    step={500}
                    value={storeMinOrderDraft}
                    onChange={(e) => setStoreMinOrderDraft(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] tabular-nums"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVendorSettings(activeVendor.id, {
                      operatingHours: storeHoursDraft,
                      prepCutOffNote: storeCutOffDraft,
                      minOrderAmount: storeMinOrderDraft,
                    })
                  }
                  className="w-full h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[13px] font-semibold cursor-pointer"
                >
                  Save Fulfilment Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <SafeImage
                src={activeVendor.coverImageUrl}
                alt={activeVendor.name}
                fallbackLabel={activeVendor.name}
                className="w-full h-36 object-cover"
              />
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-bold text-[#111827]">
                      {activeVendor.name}
                    </h2>
                    <p className="text-[12px] text-[#6F42C1] font-medium">
                      {activeVendor.categoryLabel}
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-[#F4EFFF] text-[#6F42C1] text-[12px] font-bold flex items-center justify-center">
                    {activeVendor.monogram}
                  </span>
                </div>
                <p className="text-[13px] text-[#6B7280] leading-[1.45]">
                  {activeVendor.description}
                </p>
                <div className="text-[12px] text-[#6B7280] pt-2 border-t border-[#E5E7EB] space-y-1">
                  <div>Address: {activeVendor.address}</div>
                  <div>
                    Hours: {activeVendor.operatingHours} · Min:{' '}
                    <strong className="tabular-nums text-[#111827]">
                      {formatNGN(activeVendor.minOrderAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Switch Portal / Account Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#6B7280]">
                  Signed in as
                </div>
                <div className="text-[15px] font-semibold text-[#111827] truncate">
                  {currentUser?.name ?? activeVendor.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenBecomeSeller}
                className="px-3 h-8 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[12px] font-semibold shrink-0 cursor-pointer"
              >
                + New Store
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[12px] font-medium text-[#6B7280]">
                Switch Role (Demo)
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_ACCOUNTS.map((acct) => {
                  const Icon =
                    acct.role === 'Seller'
                      ? Store
                      : acct.role === 'Rider'
                        ? Bike
                        : ShoppingBag;
                  const active = acct.role === 'Seller';
                  return (
                    <button
                      key={acct.id}
                      type="button"
                      onClick={() => onSwitchDemoRole(acct)}
                      className={`h-10 px-2 rounded-xl border text-[12px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${
                        active
                          ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                          : 'bg-[#FAF8F4] hover:bg-[#F4EFFF] border-[#E5E7EB] text-[#111827]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{acct.role === 'Seller' ? 'Vendor' : acct.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex-1 h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[13px] font-semibold cursor-pointer"
              >
                Log In / Create Account
              </button>
              {currentUser && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="h-10 px-3.5 rounded-xl bg-[#FAF8F4] hover:bg-[#FEF3F2] border border-[#E5E7EB] text-[#B42318] text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Floating Rounded Bottom Navigation Bar */}
      <nav
        aria-label="Vendor portal navigation"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[456px] z-30 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-full shadow-[0_8px_28px_rgba(169,129,255,0.18)] px-2 py-1.5"
      >
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
            {
              id: 'orders' as const,
              label: 'Orders',
              icon: ClipboardList,
              badge: pendingKitchenCount,
            },
            { id: 'catalog' as const, label: 'Catalog', icon: Package },
            { id: 'account' as const, label: 'Account', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = navTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setNavTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-current={active ? 'page' : undefined}
                className={`relative min-h-[44px] py-1.5 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#F4EFFF] text-[#6F42C1] font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#FAF8F4]'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-[18px] h-[18px] ${
                      active ? 'text-[#6F42C1]' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#A981FF] text-[#111827] text-[9px] font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
