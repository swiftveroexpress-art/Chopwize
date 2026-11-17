import { useMemo, useState } from 'react';
import { CheckCircle2, SlidersHorizontal, X } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { BottomTabBar } from './components/BottomTabBar';
import { CustomCakeQuoteModal } from './components/CustomCakeQuoteModal';
import { DemoControlDrawer } from './components/DemoControlDrawer';
import { ExploreMarketTab } from './components/ExploreMarketTab';
import { FoodMemoryTab } from './components/FoodMemoryTab';
import { FullScreenAiModal } from './components/FullScreenAiModal';
import { HomeAiTab } from './components/HomeAiTab';
import { OnboardingModal } from './components/OnboardingModal';
import { OrdersTab } from './components/OrdersTab';
import { ProductModal } from './components/ProductModal';
import { RiderCustomerChatModal } from './components/RiderCustomerChatModal';
import { RiderDashboardView } from './components/RiderDashboardView';
import { SellerDashboardView } from './components/SellerDashboardView';
import { SellerOnboardingModal } from './components/SellerOnboardingModal';
import { StickyTrayBar } from './components/StickyTrayBar';
import { TopBar } from './components/TopBar';
import { TrayCheckoutDrawer } from './components/TrayCheckoutDrawer';
import {
  CookingAssistantModal,
  SurpriseMeModal,
} from './components/UtilityModals';
import {
  DEMO_ACCOUNTS,
  INITIAL_ADDRESSES,
  INITIAL_AI_RULES,
  INITIAL_BUDGET_CONFIG,
  INITIAL_CUSTOM_CAKE_QUOTES,
  INITIAL_FAVORITE_VENDOR_IDS,
  INITIAL_MARKETPLACE_CATEGORIES,
  INITIAL_MEMORIES,
  INITIAL_ORDER_CHAT_MESSAGES,
  INITIAL_ORDERS,
  INITIAL_RECENTLY_VIEWED_IDS,
  INITIAL_TEMPORARY_REQUESTS,
  INITIAL_TICKETS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_USER_PROFILE,
  INITIAL_VENDOR_PROMOS,
  LAGOS_ZONES,
  MOCK_RIDER,
  VENDORS,
} from './data/mockMarketplace';
import type {
  AppRole,
  AuthUser,
  CartItem,
  CartSelection,
  CategoryId,
  CultureId,
  CustomerAiRule,
  CustomCakeQuote,
  FoodMemoryEntry,
  GroupOrderSession,
  MainTabId,
  MarketplaceCategoryConfig,
  MealTimetableSlot,
  MenuItem,
  MonthlyBudgetConfig,
  OrderChatMessage,
  OrderRecord,
  OrderStageId,
  PaymentOutcome,
  ProductVariant,
  SavedAddress,
  SubstitutionPreference,
  SupportTicket,
  SurpriseConfig,
  TemporaryAiRequest,
  UserProfile,
  Vendor,
  VendorPromoCampaign,
  VendorReview,
} from './types/chopwize';
import {
  type ComparativeAiCard,
  toggleFavoriteVendorId,
  updateRecentlyViewedIds,
} from './utils/aiRecommender';
import {
  attachAddOnToOrder,
  buildDefaultCartItem,
  calculateCheckoutBreakdown,
  calculateRiderEarnings,
  deleteVendorPack,
  duplicateVendorPack,
  formatNGN,
  getEffectiveDeliveryFee,
  getEffectiveItemPrice,
  getNextOrderStage,
} from './utils/pricing';

interface PendingTrayAddition {
  item: MenuItem;
  vendor: Vendor;
  selectedVariant?: ProductVariant;
  removedIngredients?: string[];
  quantity: number;
  selections: CartSelection[];
  unitPrice: number;
  specialNote?: string;
  replaceCartItemId?: string;
  packLabel?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabId>('home');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(LAGOS_ZONES[0].id);

  // Live Marketplace State (Supports Seller Onboarding & Seller Dashboard Mutations)
  const [vendors, setVendors] = useState<Vendor[]>(VENDORS);
  const [categories] = useState<MarketplaceCategoryConfig[]>(
    INITIAL_MARKETPLACE_CATEGORIES
  );
  const [cakeQuotes, setCakeQuotes] = useState<CustomCakeQuote[]>(
    INITIAL_CUSTOM_CAKE_QUOTES
  );

  // Demo Controls, Auth & Persona
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(DEMO_ACCOUNTS[0]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [roleLabel, setRoleLabel] = useState<AppRole>('Customer');
  const [selectedSellerVendorId, setSelectedSellerVendorId] =
    useState<string>('terra-kulture');
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [paymentOutcome, setPaymentOutcome] = useState<PaymentOutcome>('success');
  const [walletBalance, setWalletBalance] = useState<number>(15000);

  // AI Hero & Temporary Requests State
  const [aiPrompt, setAiPrompt] = useState('');
  const [temporaryRequests, setTemporaryRequests] = useState<TemporaryAiRequest[]>(
    INITIAL_TEMPORARY_REQUESTS
  );

  // Discovery Tracking (Recently Viewed & Favourites)
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(
    INITIAL_RECENTLY_VIEWED_IDS
  );
  const [favoriteVendorIds, setFavoriteVendorIds] = useState<string[]>(
    INITIAL_FAVORITE_VENDOR_IDS
  );

  // Explore & Market State
  const [exploreCategory, setExploreCategory] = useState<CategoryId>('all');
  const [exploreCulture, setExploreCulture] = useState<CultureId | null>(null);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [substitutionPref, setSubstitutionPref] =
    useState<SubstitutionPreference>('smart_replacement');

  // Tray & Checkout State (Supports Multi-Store Carts + Pack Duplication + Eco Packaging)
  const [tray, setTray] = useState<CartItem[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [trayInitialStep, setTrayInitialStep] = useState<'review' | 'checkout'>('review');
  const [activeCheckoutVendorId, setActiveCheckoutVendorId] = useState<string | null>(null);
  const [nextPackByVendor, setNextPackByVendor] = useState<Record<string, string>>({});
  const [ecoPackagingByVendor, setEcoPackagingByVendor] = useState<
    Record<string, boolean>
  >({});
  const [vendorNotesByVendor, setVendorNotesByVendor] = useState<
    Record<string, string>
  >({});
  const [riderTipByVendor, setRiderTipByVendor] = useState<Record<string, number>>(
    {}
  );

  // Live Vendor Promos & Rider-Customer Order Chat State
  const [vendorPromos, setVendorPromos] = useState<VendorPromoCampaign[]>(
    INITIAL_VENDOR_PROMOS
  );
  const [orderMessages, setOrderMessages] = useState<
    Record<string, OrderChatMessage[]>
  >(INITIAL_ORDER_CHAT_MESSAGES);
  const [chatOrderContext, setChatOrderContext] = useState<{
    orderId: string;
    viewerRole: 'customer' | 'rider';
  } | null>(null);

  // Modals
  const [modalProduct, setModalProduct] = useState<{
    item: MenuItem;
    vendor: Vendor;
    initialVariantId?: string;
    editingCartItem?: CartItem;
  } | null>(null);
  const [cookingOpen, setCookingOpen] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [customCakeVendor, setCustomCakeVendor] = useState<Vendor | null>(null);

  // Customer Onboarding, Full-Screen AI Hub, Financial Budget & Group Ordering State
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [budgetConfig, setBudgetConfig] =
    useState<MonthlyBudgetConfig>(INITIAL_BUDGET_CONFIG);
  const [customerOnboardingOpen, setCustomerOnboardingOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') !== '1';
  });
  const [fullScreenAiOpen, setFullScreenAiOpen] = useState(false);
  const [fullScreenAiVoiceMode, setFullScreenAiVoiceMode] = useState(false);
  const [ordersInitialSubTab, setOrdersInitialSubTab] = useState<
    'cart' | 'ongoing' | 'completed' | undefined
  >(undefined);
  const [groupOrder, setGroupOrder] = useState<GroupOrderSession>({
    active: false,
    code: 'CW-88',
    shareUrl: 'chopwize.ng/group/CW-88',
    vendorId: 'terra-kulture',
    vendorName: 'Terra Kulture Restaurant',
    participants: [],
  });

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);

  // Profile, Food Memory & Timetable State
  const [memories, setMemories] = useState<FoodMemoryEntry[]>(INITIAL_MEMORIES);
  const [aiRules, setAiRules] = useState<CustomerAiRule[]>(INITIAL_AI_RULES);
  const [timetableSlots, setTimetableSlots] = useState<MealTimetableSlot[]>(
    INITIAL_TIMETABLE_SLOTS
  );
  const [addresses] = useState<SavedAddress[]>(INITIAL_ADDRESSES);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [surpriseConfig, setSurpriseConfig] = useState<SurpriseConfig>({
    enabled: false,
    cadence: 'Weekly Fridays',
    maxBudget: 5500,
    spiceLevel: 'Lagos Hot',
  });

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedZone = useMemo(
    () => LAGOS_ZONES.find((z) => z.id === selectedZoneId) ?? LAGOS_ZONES[0],
    [selectedZoneId]
  );

  const excludeShellfish = useMemo(
    () =>
      aiRules.some(
        (r) =>
          r.enabled &&
          r.ruleType === 'allergy' &&
          /shellfish|crustacean/i.test(`${r.title} ${r.description}`)
      ),
    [aiRules]
  );

  const traySummary = useMemo(
    () => calculateCheckoutBreakdown(tray, selectedZone.deliveryFee, walletBalance, false),
    [tray, selectedZone.deliveryFee, walletBalance]
  );

  const activeOrdersCount = useMemo(
    () => orders.filter((o) => o.currentStage !== 'delivered').length,
    [orders]
  );

  const lunchSlot = useMemo(
    () => timetableSlots.find((s) => s.id === 'slot-lunch'),
    [timetableSlots]
  );

  function notify(msg: string) {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  }

  function handleOpenDish(
    item: MenuItem,
    vendor: Vendor,
    initialVariantId?: string
  ) {
    setRecentlyViewedIds((prev) => updateRecentlyViewedIds(prev, item.id, 6));
    setModalProduct({ item, vendor, initialVariantId });
  }

  function handleToggleFavoriteVendor(vendorId: string) {
    const wasFav = favoriteVendorIds.includes(vendorId);
    setFavoriteVendorIds((prev) => toggleFavoriteVendorId(prev, vendorId));
    const vendorName = vendors.find((v) => v.id === vendorId)?.name ?? 'Store';
    notify(
      wasFav ? `Removed ${vendorName} from favourites` : `Saved ${vendorName} to favourites`
    );
  }

  function commitAddToTray(payload: PendingTrayAddition) {
    const selectionKey = payload.selections
      .map(
        (s) =>
          `${s.groupId}:${s.choices
            .map((c) => `${c.id}x${c.quantity ?? 1}`)
            .join(',')}`
      )
      .join('|');
    const variantKey = payload.selectedVariant?.id ?? 'default';
    const assignedPack =
      payload.packLabel ?? nextPackByVendor[payload.vendor.id] ?? 'Pack 1';
    const cartItemId = `${payload.vendor.id}__${assignedPack}__${payload.item.id}__${variantKey}__${selectionKey}__${payload.specialNote ?? ''}`;

    setTray((prev) => {
      if (payload.replaceCartItemId) {
        return prev.map((c) =>
          c.cartItemId === payload.replaceCartItemId
            ? {
                ...c,
                selectedVariant: payload.selectedVariant,
                removedIngredients: payload.removedIngredients,
                quantity: payload.quantity,
                selections: payload.selections,
                unitPrice: payload.unitPrice,
                specialNote: payload.specialNote,
              }
            : c
        );
      }

      const existing = prev.find((c) => c.cartItemId === cartItemId);
      if (existing) {
        return prev.map((c) =>
          c.cartItemId === cartItemId
            ? { ...c, quantity: c.quantity + payload.quantity }
            : c
        );
      }

      return [
        ...prev,
        {
          cartItemId,
          vendorId: payload.vendor.id,
          vendorName: payload.vendor.name,
          packLabel: assignedPack,
          menuItem: payload.item,
          selectedVariant: payload.selectedVariant,
          removedIngredients: payload.removedIngredients,
          quantity: payload.quantity,
          selections: payload.selections,
          unitPrice: payload.unitPrice,
          specialNote: payload.specialNote,
          substitutionPreference:
            payload.item.marketplaceCategory === 'groceries'
              ? substitutionPref
              : undefined,
        },
      ];
    });

    setActiveCheckoutVendorId(payload.vendor.id);

    if (payload.replaceCartItemId) {
      notify(`Updated ${payload.item.name} in ${assignedPack}`);
      setTrayInitialStep('review');
      setTrayOpen(true);
    } else {
      notify(
        `Added ${payload.quantity}x ${payload.item.name}${
          payload.selectedVariant ? ` (${payload.selectedVariant.label})` : ''
        } to ${assignedPack}`
      );
    }
  }

  function handleRequestAddToTray(payload: PendingTrayAddition) {
    commitAddToTray(payload);
  }

  function handleDuplicatePack(vendorId: string, sourcePackLabel: string) {
    let createdPack = 'Pack 2';
    setTray((prev) => {
      const res = duplicateVendorPack(prev, vendorId, sourcePackLabel);
      createdPack = res.newPackLabel;
      return res.updatedItems;
    });
    notify(`Pack duplicated! (${createdPack} added)`);
  }

  function handleAddAnotherPack(vendorId: string) {
    const vendorItems = tray.filter((i) => i.vendorId === vendorId);
    let maxPack = 1;
    for (const vi of vendorItems) {
      const match = (vi.packLabel || 'Pack 1').match(/Pack\s+(\d+)/i);
      if (match) {
        maxPack = Math.max(maxPack, parseInt(match[1], 10));
      }
    }
    const nextPack = `Pack ${maxPack + 1}`;
    setNextPackByVendor((prev) => ({ ...prev, [vendorId]: nextPack }));
    setActiveVendorId(vendorId);
    setActiveTab('explore');
    notify(`Select items to add into ${nextPack}`);
  }

  function handleEditCartItem(cartItem: CartItem) {
    const vendor = vendors.find((v) => v.id === cartItem.vendorId);
    if (!vendor) return;
    setTrayOpen(false);
    setModalProduct({
      item: cartItem.menuItem,
      vendor,
      initialVariantId: cartItem.selectedVariant?.id,
      editingCartItem: cartItem,
    });
  }

  function handleDeletePack(vendorId: string, packLabel: string) {
    setTray((prev) => deleteVendorPack(prev, vendorId, packLabel));
    notify(`Removed ${packLabel} from cart`);
  }

  function handleUpdateCartQuantity(cartItemId: string, delta: number) {
    setTray((prev) =>
      prev
        .map((c) =>
          c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function handleSignIn(user: AuthUser) {
    setAuthUser(user);
    setRoleLabel(user.role);
    if (user.role === 'Seller' && user.vendorId) {
      setSelectedSellerVendorId(user.vendorId);
    }
    if (user.role === 'Customer') {
      setUserProfile((prev) => ({
        ...prev,
        name: user.name,
        contact: user.phone || user.email,
      }));
    }
    notify(
      `Signed in as ${user.name} (${
        user.role === 'Seller' ? 'Vendor' : user.role
      } Portal)`
    );
  }

  function handleSignOut() {
    setAuthUser(null);
    setRoleLabel('Customer');
    setActiveTab('profile');
    notify('Logged out cleanly');
  }

  function handlePlaceOrder(payload: {
    vendorId: string;
    deliveryAddress: string;
    customerPhone: string;
    vendorNote?: string;
    applyWallet: boolean;
  }): { ok: boolean; status?: 'paid' | 'pending'; errorMessage?: string } {
    if (paymentOutcome === 'failed') {
      return {
        ok: false,
        errorMessage:
          'Paystack Demo Failure: Transaction declined. Switch Demo Payment Outcome to Instant Success to complete checkout.',
      };
    }

    const vendorItems = tray.filter((i) => i.vendorId === payload.vendorId);
    if (vendorItems.length === 0) {
      return { ok: false, errorMessage: 'No items selected for this vendor.' };
    }

    const ecoPackaging = Boolean(ecoPackagingByVendor[payload.vendorId]);
    const resolvedVendorNote =
      payload.vendorNote?.trim() ||
      vendorNotesByVendor[payload.vendorId]?.trim() ||
      undefined;
    const rawSubtotal = vendorItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const deliveryPromo = getEffectiveDeliveryFee(
      selectedZone.deliveryFee,
      rawSubtotal,
      payload.vendorId,
      vendorPromos
    );
    const riderTip = Math.max(0, riderTipByVendor[payload.vendorId] ?? 0);

    const breakdown = calculateCheckoutBreakdown(
      vendorItems,
      selectedZone.deliveryFee,
      walletBalance,
      payload.applyWallet,
      {
        includePackFees: true,
        ecoPackaging,
        riderTip,
        freeDelivery: deliveryPromo.isFreeDelivery,
      }
    );

    const promoLabels: string[] = [];
    if (deliveryPromo.isFreeDelivery && deliveryPromo.promoLabel) {
      promoLabels.push(deliveryPromo.promoLabel);
    }
    for (const vi of vendorItems) {
      const priceInfo = getEffectiveItemPrice(vi.menuItem, vendorPromos);
      if (
        priceInfo.promoLabel &&
        !promoLabels.includes(priceInfo.promoLabel)
      ) {
        promoLabels.push(priceInfo.promoLabel);
      }
    }

    if (breakdown.walletApplied > 0) {
      setWalletBalance((b) => Math.max(0, b - breakdown.walletApplied));
    }

    const newOrderNum = `CW-${Math.floor(8500 + Math.random() * 1400)}`;
    const newPin = String(Math.floor(1000 + Math.random() * 8999));
    const nowTime = new Date().toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const newOrder: OrderRecord = {
      orderId: newOrderNum,
      createdAtLabel: `Today · ${nowTime}`,
      vendorId: vendorItems[0].vendorId,
      vendorName: vendorItems[0].vendorName,
      deliveryAddress: payload.deliveryAddress,
      zoneLabel: selectedZone.label,
      customerPhone: payload.customerPhone,
      paymentStatus:
        paymentOutcome === 'pending' ? 'pending_verification' : 'paid',
      items: vendorItems.map((vi) =>
        resolvedVendorNote && !vi.specialNote
          ? { ...vi, specialNote: resolvedVendorNote }
          : vi
      ),
      itemsSubtotal: breakdown.itemsSubtotal,
      takeawayPackCount: breakdown.takeawayPackCount,
      takeawayPackFee: breakdown.takeawayPackFee,
      ecoPackaging,
      ecoPackagingFee: breakdown.ecoPackagingFee,
      vendorNote: resolvedVendorNote,
      deliveryFee: breakdown.deliveryFee,
      serviceCharge: breakdown.serviceCharge,
      riderTip: breakdown.riderTip > 0 ? breakdown.riderTip : undefined,
      appliedPromoLabels: promoLabels.length > 0 ? promoLabels : undefined,
      walletApplied: breakdown.walletApplied,
      totalPaid: breakdown.totalPayable,
      riderEarnings: calculateRiderEarnings(
        breakdown.deliveryFee,
        breakdown.riderTip
      ),
      currentStage: 'submitted',
      stageTimestamps: { submitted: nowTime },
      deliveryPin: newPin,
      rider: MOCK_RIDER,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setTray((prev) => prev.filter((i) => i.vendorId !== payload.vendorId));
    setRiderTipByVendor((prev) => ({ ...prev, [payload.vendorId]: 0 }));
    setActiveCheckoutVendorId(null);
    setBudgetConfig((prev) => ({
      ...prev,
      spentThisMonth:
        prev.spentThisMonth +
        breakdown.itemsSubtotal +
        breakdown.takeawayPackFee +
        breakdown.ecoPackagingFee +
        breakdown.deliveryFee +
        breakdown.serviceCharge +
        breakdown.riderTip,
    }));

    if (groupOrder.active && groupOrder.vendorId === payload.vendorId) {
      setGroupOrder((prev) => ({ ...prev, active: false, participants: [] }));
    }

    if (paymentOutcome === 'pending') {
      setOrdersInitialSubTab('ongoing');
      setActiveTab('orders');
      return { ok: true, status: 'pending' };
    }

    setTrayOpen(false);
    setOrdersInitialSubTab('ongoing');
    setActiveTab('orders');
    notify(`Order #${newOrderNum} placed · PIN ${newPin}`);
    return { ok: true, status: 'paid' };
  }

  function handleAddBundleAndPay(card: ComparativeAiCard) {
    const newItem = buildDefaultCartItem(
      card.item,
      card.vendor,
      card.matchedVariant,
      'Pack 1'
    );
    const priceInfo = getEffectiveItemPrice(
      card.item,
      vendorPromos,
      card.matchedVariant?.price
    );
    const basePrice = card.matchedVariant?.price ?? card.item.basePrice;
    const syncedItem: CartItem = {
      ...newItem,
      unitPrice: priceInfo.finalPrice + (newItem.unitPrice - basePrice),
    };
    setTray((prev) => [
      ...prev.filter((c) => c.vendorId !== card.vendor.id),
      syncedItem,
    ]);
    setActiveCheckoutVendorId(card.vendor.id);
    setTrayInitialStep('review');
    setTrayOpen(true);
    notify(
      `Ready to checkout: ${card.item.name} from ${card.vendor.name}`
    );
  }

  function handleSubmitVendorReview(
    vendorId: string,
    payload: { rating: number; comment: string; dishTag?: string }
  ) {
    const newReview: VendorReview = {
      id: `rev-${Date.now()}`,
      vendorId,
      authorName: userProfile.name,
      rating: payload.rating,
      comment: payload.comment,
      dishTag: payload.dishTag,
      createdAtLabel: 'Just now',
      verifiedBuyer: true,
    };

    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== vendorId) return v;
        const nextCount = v.reviewCount + 1;
        const nextRating =
          Math.round(((v.rating * v.reviewCount + payload.rating) / nextCount) * 10) /
          10;
        return {
          ...v,
          rating: nextRating,
          reviewCount: nextCount,
          reviews: [newReview, ...(v.reviews ?? [])],
        };
      })
    );
    notify('Verified review posted to store wall!');
  }

  function handleStartGroupOrder(preferredVendorId?: string) {
    const targetVendor =
      vendors.find((v) => v.id === preferredVendorId) ??
      vendors.find((v) => v.id === activeVendorId) ??
      vendors[0];

    const hostName = `${userProfile.name.split(' ')[0] || 'Amina'} (Host)`;
    const existingHostItems = tray.filter((t) => t.vendorId === targetVendor.id);
    const initialHostItems =
      existingHostItems.length > 0
        ? existingHostItems
        : [
            buildDefaultCartItem(
              targetVendor.menu[0],
              targetVendor,
              undefined,
              'Pack 1'
            ),
          ];

    if (existingHostItems.length === 0) {
      setTray((prev) => [...prev, ...initialHostItems]);
    }

    setGroupOrder({
      active: true,
      code: 'CW-88',
      shareUrl: 'chopwize.ng/group/CW-88',
      vendorId: targetVendor.id,
      vendorName: targetVendor.name,
      participants: [
        {
          id: 'host-amina',
          name: hostName,
          items: initialHostItems,
        },
      ],
    });

    setRoleLabel('Customer');
    setOrdersInitialSubTab('cart');
    setActiveTab('orders');
    notify(`Group Order link ready: chopwize.ng/group/CW-88`);
  }

  function handleSimulateFriendAdd() {
    const targetVendor =
      vendors.find((v) => v.id === groupOrder.vendorId) ?? vendors[0];
    const demoFriends = ['Chinedu Okafor', 'Tolu Adeyemi', 'Zainab Musa'];
    const nextIdx = Math.max(0, groupOrder.participants.length - 1);
    const friendName = demoFriends[nextIdx % demoFriends.length];
    const menuPool = targetVendor.menu;
    const pickedDish = menuPool[(nextIdx + 1) % menuPool.length];
    const friendPack = `Pack ${groupOrder.participants.length + 1}`;
    const friendItem = buildDefaultCartItem(
      pickedDish,
      targetVendor,
      undefined,
      friendPack
    );

    if (!groupOrder.active) {
      const hostName = `${userProfile.name.split(' ')[0] || 'Amina'} (Host)`;
      const hostItem = buildDefaultCartItem(menuPool[0], targetVendor, undefined, 'Pack 1');
      setTray((prev) => [...prev.filter((i) => i.vendorId !== targetVendor.id), hostItem, friendItem]);
      setGroupOrder({
        active: true,
        code: 'CW-88',
        shareUrl: 'chopwize.ng/group/CW-88',
        vendorId: targetVendor.id,
        vendorName: targetVendor.name,
        participants: [
          { id: 'host-amina', name: hostName, items: [hostItem] },
          { id: `friend-${Date.now()}`, name: friendName, items: [friendItem] },
        ],
      });
    } else {
      setTray((prev) => [...prev, friendItem]);
      setGroupOrder((prev) => ({
        ...prev,
        participants: [
          ...prev.participants,
          {
            id: `friend-${Date.now()}`,
            name: friendName,
            items: [friendItem],
          },
        ],
      }));
    }

    setRoleLabel('Customer');
    setOrdersInitialSubTab('cart');
    setActiveTab('orders');
    notify(`${friendName} added ${pickedDish.name} to your Group Order!`);
  }

  function handleAttachPostOrderItem(
    orderId: string,
    item: MenuItem,
    vendor: Vendor
  ) {
    const addOn = buildDefaultCartItem(item, vendor, undefined, 'Add-on');
    setOrders((prev) =>
      prev.map((ord) =>
        ord.orderId === orderId ? attachAddOnToOrder(ord, addOn) : ord
      )
    );
    setBudgetConfig((prev) => ({
      ...prev,
      spentThisMonth: prev.spentThisMonth + addOn.unitPrice * addOn.quantity,
    }));
    notify(
      `Added ${item.name} (${formatNGN(addOn.unitPrice)}) to Order #${orderId} with ₦0 extra delivery fee`
    );
  }

  function handleAdvanceOrderStage(orderId: string) {
    const nowTime = new Date().toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
    });

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const next = getNextOrderStage(ord.currentStage);
        return {
          ...ord,
          currentStage: next,
          stageTimestamps: {
            ...ord.stageTimestamps,
            [next]: ord.stageTimestamps[next] ?? nowTime,
          },
        };
      })
    );
  }

  function handleSetActiveOrderStage(stage: OrderStageId) {
    const firstActive = orders[0];
    if (!firstActive) return;
    setOrders((prev) =>
      prev.map((ord, idx) =>
        idx === 0 ? { ...ord, currentStage: stage } : ord
      )
    );
    setRoleLabel('Customer');
    setActiveTab('orders');
    notify(`Order #${firstActive.orderId} set to ${stage.replace('_', ' ')}`);
  }

  function handleAdvanceOrderToStage(
    orderId: string,
    targetStage: OrderStageId,
    riderNameOverride?: string
  ) {
    const nowTime = new Date().toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
    });

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        return {
          ...ord,
          currentStage: targetStage,
          rider:
            riderNameOverride && targetStage === 'rider_assigned'
              ? { ...ord.rider, name: riderNameOverride }
              : ord.rider,
          stageTimestamps: {
            ...ord.stageTimestamps,
            [targetStage]: ord.stageTimestamps[targetStage] ?? nowTime,
          },
        };
      })
    );

    notify(`Order #${orderId} updated to ${targetStage.replace('_', ' ')}`);
  }

  function handleResetOrderStage(orderId: string) {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.orderId === orderId
          ? {
              ...ord,
              currentStage: 'submitted',
              stageTimestamps: { submitted: ord.stageTimestamps.submitted ?? '1:04 PM' },
            }
          : ord
      )
    );
  }

  function handleReorder(order: OrderRecord) {
    setTray((prev) => [
      ...prev.filter((i) => i.vendorId !== order.vendorId),
      ...order.items.map((item) => ({ ...item, packLabel: item.packLabel || 'Pack 1' })),
    ]);
    setActiveCheckoutVendorId(order.vendorId);
    setTrayInitialStep('review');
    setTrayOpen(true);
    notify(`Loaded items from #${order.orderId} into My Cart`);
  }

  // Seller Onboarding & Seller Dashboard Mutations
  function handleCreateStore(newVendor: Vendor, previewImmediately: boolean) {
    setVendors((prev) => [newVendor, ...prev]);
    setSelectedSellerVendorId(newVendor.id);
    if (previewImmediately) {
      setRoleLabel('Customer');
      setExploreCategory(newVendor.category);
      setActiveVendorId(newVendor.id);
      setActiveTab('explore');
    }
    notify(`${newVendor.name} created (Pending Admin Verification)`);
  }

  function handleAddSellerProduct(vendorId: string, newItem: MenuItem) {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId ? { ...v, menu: [newItem, ...v.menu] } : v
      )
    );
    notify(`Published "${newItem.name}" to storefront`);
  }

  function handleUpdateSellerStock(
    vendorId: string,
    itemId: string,
    delta: number,
    variantId?: string
  ) {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== vendorId) return v;
        return {
          ...v,
          menu: v.menu.map((item) => {
            if (item.id !== itemId) return item;
            if (variantId && item.variants) {
              return {
                ...item,
                variants: item.variants.map((variant) =>
                  variant.id === variantId
                    ? { ...variant, stockCount: Math.max(0, variant.stockCount + delta) }
                    : variant
                ),
              };
            }
            return {
              ...item,
              stockCount: Math.max(0, (item.stockCount ?? 20) + delta),
            };
          }),
        };
      })
    );
  }

  function handleUpdateVendorSettings(
    vendorId: string,
    patch: Partial<Vendor>
  ) {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, ...patch } : v))
    );
    notify('Storefront settings updated live');
  }

  function handleRespondCakeQuote(
    quoteId: string,
    quotedPrice: number,
    sellerNote: string
  ) {
    setCakeQuotes((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? { ...q, status: 'Quoted', quotedPrice, sellerNote }
          : q
      )
    );
    notify(`Sent quote ${formatNGN(quotedPrice)} for ${quoteId}`);
  }

  function handleCreateVendorPromo(
    promo: Omit<VendorPromoCampaign, 'id' | 'createdAtLabel'>
  ) {
    const created: VendorPromoCampaign = {
      ...promo,
      id: `promo-${Date.now()}`,
      createdAtLabel: 'Just now',
    };
    setVendorPromos((prev) => [created, ...prev]);
    notify(`Launched campaign "${created.title}" live!`);
  }

  function handleToggleVendorPromo(promoId: string) {
    setVendorPromos((prev) =>
      prev.map((p) => (p.id === promoId ? { ...p, active: !p.active } : p))
    );
  }

  function handleDeleteVendorPromo(promoId: string) {
    setVendorPromos((prev) => prev.filter((p) => p.id !== promoId));
    notify('Campaign removed');
  }

  function handleSendOrderChatMessage(
    orderId: string,
    text: string,
    senderRole: 'customer' | 'rider'
  ) {
    const nowTime = new Date().toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const senderName =
      senderRole === 'customer'
        ? userProfile.name.split(' ')[0] || 'Amina'
        : authUser?.role === 'Rider'
          ? authUser.name
          : MOCK_RIDER.name;
    const newMsg: OrderChatMessage = {
      id: `msg-${Date.now()}`,
      orderId,
      senderRole,
      senderName,
      text,
      timestampLabel: nowTime,
    };
    setOrderMessages((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] ?? []), newMsg],
    }));
  }

  function handleResetAllDemo() {
    setVendors(VENDORS);
    setVendorPromos(INITIAL_VENDOR_PROMOS);
    setCakeQuotes(INITIAL_CUSTOM_CAKE_QUOTES);
    setOrders(INITIAL_ORDERS);
    setOrderMessages(INITIAL_ORDER_CHAT_MESSAGES);
    setChatOrderContext(null);
    setRiderTipByVendor({});
    setMemories(INITIAL_MEMORIES);
    setAiRules(INITIAL_AI_RULES);
    setTemporaryRequests(INITIAL_TEMPORARY_REQUESTS);
    setTimetableSlots(INITIAL_TIMETABLE_SLOTS);
    setRecentlyViewedIds(INITIAL_RECENTLY_VIEWED_IDS);
    setFavoriteVendorIds(INITIAL_FAVORITE_VENDOR_IDS);
    setTickets(INITIAL_TICKETS);
    setUserProfile(INITIAL_USER_PROFILE);
    setBudgetConfig(INITIAL_BUDGET_CONFIG);
    setGroupOrder({
      active: false,
      code: 'CW-88',
      shareUrl: 'chopwize.ng/group/CW-88',
      vendorId: 'terra-kulture',
      vendorName: 'Terra Kulture Restaurant',
      participants: [],
    });
    setTray([]);
    setActiveCheckoutVendorId(null);
    setSurpriseConfig((prev) => ({ ...prev, enabled: false }));
    setWalletBalance(15000);
    setPaymentOutcome('success');
    setDemoMode(true);
    setRoleLabel('Customer');
    setAiPrompt('');
    setFullScreenAiOpen(false);
    setOrdersInitialSubTab(undefined);
    setActiveVendorId(null);
    setActiveTab('home');
    notify('Simulation state reset cleanly');
  }

  const activeChatOrder = chatOrderContext
    ? orders.find((o) => o.orderId === chatOrderContext.orderId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-[#F2EFE9] text-[#111827] md:py-4 md:px-4 relative">
      {/* Desktop Side Demo Drawer Shortcut */}
      <div className="hidden md:flex fixed top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setDemoDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] text-xs font-bold text-[#111827] shadow-xs cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
          <span>Demo Control Drawer</span>
        </button>
      </div>

      {/* Centered Mobile-First App Shell (max-w-[480px]) */}
      <div className="mx-auto w-full max-w-[480px] min-h-screen md:min-h-[calc(100vh-2rem)] bg-[#FAF8F4] md:rounded-[28px] md:border md:border-[#E5E7EB] overflow-x-hidden relative">
        <TopBar
          roleLabel={roleLabel}
          onOpenDemoDrawer={() => setDemoDrawerOpen(true)}
          cartCount={traySummary.itemCount}
          onOpenTray={() => {
            setTrayInitialStep('review');
            setTrayOpen(true);
          }}
          onGoHome={() => {
            setRoleLabel('Customer');
            setActiveTab('home');
            setActiveVendorId(null);
          }}
        />

        <main className="px-4 pt-4">
          {roleLabel === 'Seller' ? (
            <SellerDashboardView
              vendors={vendors}
              selectedVendorId={selectedSellerVendorId}
              onSelectVendorId={setSelectedSellerVendorId}
              categories={categories}
              orders={orders}
              cakeQuotes={cakeQuotes}
              vendorPromos={vendorPromos}
              currentUser={authUser}
              onAddProduct={handleAddSellerProduct}
              onUpdateStock={handleUpdateSellerStock}
              onCreateVendorPromo={handleCreateVendorPromo}
              onToggleVendorPromo={handleToggleVendorPromo}
              onDeleteVendorPromo={handleDeleteVendorPromo}
              onUpdateVendorSettings={handleUpdateVendorSettings}
              onRespondCakeQuote={handleRespondCakeQuote}
              onAdvanceVendorOrder={(orderId, stage) =>
                handleAdvanceOrderToStage(orderId, stage)
              }
              onSwitchToCustomerPreview={(vendorId) => {
                setRoleLabel('Customer');
                setActiveVendorId(vendorId);
                setActiveTab('explore');
              }}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onSwitchDemoRole={handleSignIn}
              onSignOut={handleSignOut}
              onOpenBecomeSeller={() => setOnboardingOpen(true)}
            />
          ) : roleLabel === 'Rider' ? (
            <RiderDashboardView
              currentUser={authUser}
              orders={orders}
              vendors={vendors}
              orderMessages={orderMessages}
              onOpenOrderChat={(orderId) =>
                setChatOrderContext({ orderId, viewerRole: 'rider' })
              }
              onAcceptDelivery={(orderId) =>
                handleAdvanceOrderToStage(
                  orderId,
                  'rider_assigned',
                  authUser?.role === 'Rider' ? authUser.name : undefined
                )
              }
              onMarkPickedUp={(orderId) =>
                handleAdvanceOrderToStage(orderId, 'in_transit')
              }
              onMarkDelivered={(orderId) =>
                handleAdvanceOrderToStage(orderId, 'delivered')
              }
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onSwitchDemoRole={handleSignIn}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeAiTab
                  vendors={vendors}
                  addresses={addresses}
                  selectedZone={selectedZone}
                  onSelectZone={(zoneId) => {
                    setSelectedZoneId(zoneId);
                    notify('Updated Lagos delivery zone');
                  }}
                  aiRules={aiRules}
                  temporaryRequests={temporaryRequests}
                  onToggleTemporaryRequest={(id) =>
                    setTemporaryRequests((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
                    )
                  }
                  aiPrompt={aiPrompt}
                  onAiPromptChange={setAiPrompt}
                  recentlyViewedIds={recentlyViewedIds}
                  favoriteVendorIds={favoriteVendorIds}
                  onToggleFavoriteVendor={handleToggleFavoriteVendor}
                  lunchSlot={lunchSlot}
                  onSelectCategoryShortcut={(cat) => {
                    setExploreCategory(cat);
                    setExploreCulture(null);
                    setActiveVendorId(null);
                    setActiveTab('explore');
                  }}
                  onExploreAll={() => {
                    setExploreCategory('all');
                    setExploreCulture(null);
                    setActiveVendorId(null);
                    setActiveTab('explore');
                  }}
                  onOpenMarket={() => {
                    setExploreCategory('groceries');
                    setExploreCulture(null);
                    setActiveVendorId('ebeano-market');
                    setActiveTab('explore');
                  }}
                  onOpenCookingAssistant={() => setCookingOpen(true)}
                  onOpenSurpriseDice={() => setSurpriseOpen(true)}
                  onSelectDish={handleOpenDish}
                  onSelectVendor={(vendorId) => {
                    setActiveVendorId(vendorId);
                    setActiveTab('explore');
                  }}
                  userName={userProfile.name}
                  onOpenFullScreenAi={(voiceMode = false, promptOverride?: string) => {
                    if (promptOverride !== undefined) {
                      setAiPrompt(promptOverride);
                    }
                    setFullScreenAiVoiceMode(voiceMode);
                    setFullScreenAiOpen(true);
                  }}
                />
              )}

              {activeTab === 'explore' && (
                <ExploreMarketTab
                  vendors={vendors}
                  categories={categories}
                  selectedZone={selectedZone}
                  selectedCategory={exploreCategory}
                  onSelectCategory={(cat) => {
                    setExploreCategory(cat);
                    setActiveVendorId(null);
                  }}
                  selectedCulture={exploreCulture}
                  onSelectCulture={setExploreCulture}
                  activeVendorId={activeVendorId}
                  onSelectVendor={setActiveVendorId}
                  favoriteVendorIds={favoriteVendorIds}
                  onToggleFavoriteVendor={handleToggleFavoriteVendor}
                  aiRules={aiRules}
                  vendorPromos={vendorPromos}
                  onSelectDish={handleOpenDish}
                  onOpenCustomCakeQuote={(vendor) => setCustomCakeVendor(vendor)}
                  onStartGroupOrder={(vendorId) => handleStartGroupOrder(vendorId)}
                  onSubmitVendorReview={handleSubmitVendorReview}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersTab
                  trayItems={tray}
                  vendors={vendors}
                  orders={orders}
                  initialSubTab={ordersInitialSubTab}
                  selectedDeliveryFee={selectedZone.deliveryFee}
                  vendorPromos={vendorPromos}
                  riderTipByVendor={riderTipByVendor}
                  onChangeRiderTip={(vendorId, tip) =>
                    setRiderTipByVendor((prev) => ({
                      ...prev,
                      [vendorId]: tip,
                    }))
                  }
                  orderMessages={orderMessages}
                  onOpenOrderChat={(orderId) =>
                    setChatOrderContext({ orderId, viewerRole: 'customer' })
                  }
                  ecoPackagingByVendor={ecoPackagingByVendor}
                  onToggleEcoPackaging={(vendorId) =>
                    setEcoPackagingByVendor((prev) => ({
                      ...prev,
                      [vendorId]: !prev[vendorId],
                    }))
                  }
                  vendorNotesByVendor={vendorNotesByVendor}
                  onChangeVendorNote={(vendorId, note) =>
                    setVendorNotesByVendor((prev) => ({
                      ...prev,
                      [vendorId]: note,
                    }))
                  }
                  groupOrder={groupOrder}
                  onStartGroupOrder={() => handleStartGroupOrder()}
                  onSimulateFriendAdd={handleSimulateFriendAdd}
                  onCopyGroupLink={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(groupOrder.shareUrl).catch(() => undefined);
                    }
                    notify(`Copied group link: ${groupOrder.shareUrl}`);
                  }}
                  onOpenGroupVendor={(vendorId) => {
                    setActiveVendorId(vendorId);
                    setActiveTab('explore');
                  }}
                  onAttachPostOrderItem={handleAttachPostOrderItem}
                  onBrowseRestaurantForAddOn={(vendorId) => {
                    setActiveVendorId(vendorId);
                    setActiveTab('explore');
                  }}
                  onOpenVendorCheckout={(vendorId) => {
                    setActiveCheckoutVendorId(vendorId);
                    setTrayInitialStep('checkout');
                    setTrayOpen(true);
                  }}
                  onClearVendorCart={(vendorId) => {
                    const name =
                      vendors.find((v) => v.id === vendorId)?.name ?? 'Store';
                    setTray((prev) => prev.filter((i) => i.vendorId !== vendorId));
                    notify(`Cleared cart from ${name}`);
                  }}
                  onDuplicatePack={handleDuplicatePack}
                  onDeletePack={handleDeletePack}
                  onEditCartItem={handleEditCartItem}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onAddAnotherPack={handleAddAnotherPack}
                  onExploreStores={() => {
                    setActiveVendorId(null);
                    setActiveTab('explore');
                  }}
                  onAdvanceOrderStage={handleAdvanceOrderStage}
                  onResetOrderStage={handleResetOrderStage}
                  onReorder={handleReorder}
                  onSubmitSupportTicket={({ orderId, category, summary }) => {
                    const ticket: SupportTicket = {
                      id: `TKT-${Math.floor(400 + Math.random() * 500)}`,
                      orderId,
                      category,
                      summary,
                      status: 'Open',
                      createdAt: 'Just now',
                    };
                    setTickets((prev) => [ticket, ...prev]);
                    notify(`Support ticket ${ticket.id} created in Profile`);
                  }}
                />
              )}

              {activeTab === 'profile' && (
                <FoodMemoryTab
                  walletBalance={walletBalance}
                  userProfile={userProfile}
                  onUpdateUserProfile={setUserProfile}
                  budgetConfig={budgetConfig}
                  onUpdateMonthlyBudget={(newBudget) => {
                    setBudgetConfig((prev) => ({
                      ...prev,
                      monthlyBudget: newBudget,
                    }));
                    notify(`Monthly Food Budget updated to ${formatNGN(newBudget)}`);
                  }}
                  groupOrder={groupOrder}
                  onStartGroupOrderFromProfile={() => handleStartGroupOrder()}
                  onReplayOnboarding={() => setCustomerOnboardingOpen(true)}
                  memories={memories}
                  onConfirmMemory={(id) => {
                    setMemories((prev) =>
                      prev.map((m) => (m.id === id ? { ...m, status: 'confirmed' } : m))
                    );
                    notify('Memory confirmed by Amina');
                  }}
                  onDeleteMemory={(id) => {
                    setMemories((prev) => prev.filter((m) => m.id !== id));
                    notify('Memory removed');
                  }}
                  onAddMemory={(entry) =>
                    setMemories((prev) => [
                      { ...entry, id: `mem-${Date.now()}` },
                      ...prev,
                    ])
                  }
                  aiRules={aiRules}
                  onToggleRule={(id) =>
                    setAiRules((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
                    )
                  }
                  onUpdateRule={(id, patch) => {
                    setAiRules((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
                    );
                    notify('AI rule updated');
                  }}
                  onDeleteRule={(id) =>
                    setAiRules((prev) => prev.filter((r) => r.id !== id))
                  }
                  onAddRule={(rule) => {
                    setAiRules((prev) => [
                      { ...rule, id: `rule-${Date.now()}` },
                      ...prev,
                    ]);
                    notify(`Rule "${rule.title}" saved`);
                  }}
                  temporaryRequests={temporaryRequests}
                  onToggleTemporaryRequest={(id) =>
                    setTemporaryRequests((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
                    )
                  }
                  cakeQuotes={cakeQuotes}
                  timetableSlots={timetableSlots}
                  onToggleTimetableSlot={(slotId) =>
                    setTimetableSlots((prev) =>
                      prev.map((s) =>
                        s.id === slotId
                          ? { ...s, reminderEnabled: !s.reminderEnabled }
                          : s
                      )
                    )
                  }
                  surpriseConfig={surpriseConfig}
                  onUpdateSurpriseConfig={setSurpriseConfig}
                  addresses={addresses}
                  selectedZoneId={selectedZoneId}
                  onSelectAddressZone={(zoneId) => {
                    setSelectedZoneId(zoneId);
                    notify('Active Lagos delivery address updated');
                  }}
                  tickets={tickets}
                  onOpenBecomeSeller={() => setOnboardingOpen(true)}
                  onOpenSellerDashboard={() => {
                    setRoleLabel('Seller');
                    notify('Switched to Vendor Portal');
                  }}
                  onOpenMarketVendor={(vendorId) => {
                    setActiveVendorId(vendorId);
                    setActiveTab('explore');
                  }}
                  currentUser={authUser}
                  onOpenAuthModal={() => setAuthModalOpen(true)}
                  onSwitchDemoRole={handleSignIn}
                  onSignOut={handleSignOut}
                  onNotify={notify}
                />
              )}
            </>
          )}
        </main>

        {/* Persistent Sticky Tray Bar & Bottom Navigation (Customer View) */}
        {roleLabel === 'Customer' && !trayOpen && activeTab !== 'orders' && (
          <StickyTrayBar
            itemCount={traySummary.itemCount}
            itemsSubtotal={traySummary.itemsSubtotal}
            onOpenTray={() => {
              setTrayInitialStep('review');
              setTrayOpen(true);
            }}
          />
        )}

        {roleLabel === 'Customer' && (
          <BottomTabBar
            activeTab={activeTab}
            onChangeTab={(tab) => {
              if (tab === 'orders') {
                setOrdersInitialSubTab(undefined);
              }
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            activeOrdersCount={activeOrdersCount}
          />
        )}

        {/* Light-Mode Toast Feedback */}
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[440px] bg-white border border-[#D0BCFC] text-[#111827] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#6F42C1] shrink-0" aria-hidden="true" />
            <span className="flex-1">{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              aria-label="Dismiss notification"
              className="text-[#6B7280] hover:text-[#111827] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Modals & Drawers */}
        {modalProduct && (
          <ProductModal
            item={modalProduct.item}
            vendor={modalProduct.vendor}
            initialVariantId={modalProduct.initialVariantId}
            editingCartItem={modalProduct.editingCartItem}
            aiRules={aiRules}
            vendorPromos={vendorPromos}
            onClose={() => setModalProduct(null)}
            onOpenCustomCakeQuote={(v) => setCustomCakeVendor(v)}
            onAddToTray={handleRequestAddToTray}
          />
        )}

        <TrayCheckoutDrawer
          isOpen={trayOpen}
          initialStep={trayInitialStep}
          onClose={() => {
            setTrayOpen(false);
            setTrayInitialStep('review');
          }}
          items={tray}
          activeVendorId={activeCheckoutVendorId}
          selectedZone={selectedZone}
          walletBalance={walletBalance}
          paymentOutcome={paymentOutcome}
          onChangePaymentOutcome={setPaymentOutcome}
          substitutionPref={substitutionPref}
          vendorPromos={vendorPromos}
          riderTipByVendor={riderTipByVendor}
          onChangeRiderTip={(vendorId, tip) =>
            setRiderTipByVendor((prev) => ({
              ...prev,
              [vendorId]: tip,
            }))
          }
          ecoPackagingByVendor={ecoPackagingByVendor}
          onToggleEcoPackaging={(vendorId) =>
            setEcoPackagingByVendor((prev) => ({
              ...prev,
              [vendorId]: !prev[vendorId],
            }))
          }
          vendorNotesByVendor={vendorNotesByVendor}
          onChangeVendorNote={(vendorId, note) =>
            setVendorNotesByVendor((prev) => ({
              ...prev,
              [vendorId]: note,
            }))
          }
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={(cartItemId) =>
            setTray((prev) => prev.filter((c) => c.cartItemId !== cartItemId))
          }
          onClearVendorCart={(vendorId) => {
            setTray((prev) => prev.filter((c) => c.vendorId !== vendorId));
            notify('Cart cleared');
          }}
          onDuplicatePack={handleDuplicatePack}
          onDeletePack={handleDeletePack}
          onEditCartItem={handleEditCartItem}
          onAddAnotherPack={handleAddAnotherPack}
          onPlaceOrder={handlePlaceOrder}
        />

        <RiderCustomerChatModal
          isOpen={Boolean(chatOrderContext && activeChatOrder)}
          onClose={() => setChatOrderContext(null)}
          order={activeChatOrder}
          viewerRole={chatOrderContext?.viewerRole ?? 'customer'}
          messages={
            activeChatOrder ? orderMessages[activeChatOrder.orderId] ?? [] : []
          }
          onSendMessage={handleSendOrderChatMessage}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          currentUser={authUser}
          vendors={vendors}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />

        <DemoControlDrawer
          isOpen={demoDrawerOpen}
          onClose={() => setDemoDrawerOpen(false)}
          demoMode={demoMode}
          onToggleDemoMode={() => setDemoMode((d) => !d)}
          roleLabel={roleLabel}
          onChangeRole={setRoleLabel}
          onOpenBecomeSeller={() => setOnboardingOpen(true)}
          onReplayOnboarding={() => setCustomerOnboardingOpen(true)}
          onSimulateFriendJoiningGroup={handleSimulateFriendAdd}
          paymentOutcome={paymentOutcome}
          onChangePaymentOutcome={setPaymentOutcome}
          walletBalance={walletBalance}
          onResetWallet={() => {
            setWalletBalance(15000);
            notify('Food Budget Wallet topped up to ₦15,000');
          }}
          activeOrderStage={orders[0]?.currentStage ?? null}
          onSetOrderStage={handleSetActiveOrderStage}
          onSimulateVoicePrompt={(transcript) => {
            setRoleLabel('Customer');
            setAiPrompt(transcript);
            setFullScreenAiVoiceMode(false);
            setFullScreenAiOpen(true);
          }}
          onResetAllDemo={handleResetAllDemo}
        />

        <FullScreenAiModal
          isOpen={fullScreenAiOpen}
          onClose={() => setFullScreenAiOpen(false)}
          userProfile={userProfile}
          budgetConfig={budgetConfig}
          vendors={vendors}
          aiRules={aiRules}
          temporaryRequests={temporaryRequests}
          onToggleTemporaryRequest={(id) =>
            setTemporaryRequests((prev) =>
              prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
            )
          }
          initialPrompt={aiPrompt}
          startInVoiceMode={fullScreenAiVoiceMode}
          onPromptChange={setAiPrompt}
          onSelectDish={handleOpenDish}
          onSelectVendor={(vendorId) => {
            setActiveVendorId(vendorId);
            setActiveTab('explore');
          }}
          onAddBundleAndPay={handleAddBundleAndPay}
        />

        <OnboardingModal
          isOpen={customerOnboardingOpen}
          initialProfile={userProfile}
          onComplete={(profile) => {
            setUserProfile(profile);
            setCustomerOnboardingOpen(false);
            notify(
              `Welcome ${profile.name.split(' ')[0]}! Chopwize personalized for you.`
            );
          }}
          onSkip={() => {
            setCustomerOnboardingOpen(false);
            notify('Onboarding skipped — edit anytime in Profile Details');
          }}
        />

        <SellerOnboardingModal
          isOpen={onboardingOpen}
          categories={categories}
          onClose={() => setOnboardingOpen(false)}
          onCreateStore={handleCreateStore}
        />

        <CustomCakeQuoteModal
          isOpen={customCakeVendor !== null}
          vendor={customCakeVendor}
          onClose={() => setCustomCakeVendor(null)}
          onSubmitQuote={(quote) => {
            const created: CustomCakeQuote = {
              ...quote,
              id: `CQ-${Math.floor(300 + Math.random() * 600)}`,
              status: 'Pending Quote',
              createdAtLabel: 'Just now',
            };
            setCakeQuotes((prev) => [created, ...prev]);
            notify(`Custom cake quote ${created.id} submitted to ${quote.vendorName}`);
          }}
        />

        <CookingAssistantModal
          isOpen={cookingOpen}
          onClose={() => setCookingOpen(false)}
          onAddMissingGroceries={() => {
            setExploreCategory('groceries');
            setActiveVendorId('ebeano-market');
            setActiveTab('explore');
          }}
        />

        <SurpriseMeModal
          isOpen={surpriseOpen}
          onClose={() => setSurpriseOpen(false)}
          vendors={vendors}
          excludeShellfish={excludeShellfish}
          onSelectDish={handleOpenDish}
        />
      </div>
    </div>
  );
}
