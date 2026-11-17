import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgePercent,
  Bike,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CopyPlus,
  Heart,
  HelpCircle,
  KeyRound,
  Leaf,
  MessageSquare,
  Minus,
  Package,
  Phone,
  Plus,
  RotateCcw,
  ShoppingBag,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type {
  CartItem,
  GroupOrderSession,
  MenuItem,
  OrderChatMessage,
  OrderRecord,
  Vendor,
  VendorPromoCampaign,
} from '../types/chopwize';
import {
  calculateCheckoutBreakdown,
  formatNGN,
  getEffectiveDeliveryFee,
  getOrderStageIndex,
  getStartingPrice,
  groupCartByVendor,
  groupVendorItemsByPack,
  ORDER_STAGES,
} from '../utils/pricing';
import { LiveDeliveryMap } from './LiveDeliveryMap';
import { SafeImage } from './SafeImage';

type OrdersSubTab = 'cart' | 'ongoing' | 'completed';

interface OrdersTabProps {
  trayItems: CartItem[];
  vendors: Vendor[];
  orders: OrderRecord[];
  initialSubTab?: OrdersSubTab;
  selectedDeliveryFee: number;
  vendorPromos?: VendorPromoCampaign[];
  riderTipByVendor: Record<string, number>;
  onChangeRiderTip: (vendorId: string, tip: number) => void;
  orderMessages?: Record<string, OrderChatMessage[]>;
  onOpenOrderChat: (orderId: string) => void;
  ecoPackagingByVendor: Record<string, boolean>;
  onToggleEcoPackaging: (vendorId: string) => void;
  vendorNotesByVendor: Record<string, string>;
  onChangeVendorNote: (vendorId: string, note: string) => void;
  groupOrder: GroupOrderSession;
  onStartGroupOrder: () => void;
  onSimulateFriendAdd: () => void;
  onCopyGroupLink: () => void;
  onOpenGroupVendor: (vendorId: string) => void;
  onAttachPostOrderItem: (orderId: string, item: MenuItem, vendor: Vendor) => void;
  onBrowseRestaurantForAddOn: (vendorId: string) => void;
  onOpenVendorCheckout: (vendorId: string) => void;
  onClearVendorCart: (vendorId: string) => void;
  onDuplicatePack: (vendorId: string, packLabel: string) => void;
  onDeletePack: (vendorId: string, packLabel: string) => void;
  onEditCartItem: (cartItem: CartItem) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onAddAnotherPack: (vendorId: string) => void;
  onExploreStores: () => void;
  onAdvanceOrderStage: (orderId: string) => void;
  onResetOrderStage: (orderId: string) => void;
  onReorder: (order: OrderRecord) => void;
  onSubmitSupportTicket: (payload: {
    orderId: string;
    category: string;
    summary: string;
  }) => void;
}

const TIP_PRESETS = [
  { value: 0, label: 'No tip' },
  { value: 200, label: '₦200' },
  { value: 500, label: '₦500' },
  { value: 1000, label: '₦1,000' },
];

export function OrdersTab({
  trayItems,
  vendors,
  orders,
  initialSubTab,
  selectedDeliveryFee,
  vendorPromos = [],
  riderTipByVendor,
  onChangeRiderTip,
  orderMessages,
  onOpenOrderChat,
  ecoPackagingByVendor,
  onToggleEcoPackaging,
  vendorNotesByVendor,
  onChangeVendorNote,
  groupOrder,
  onStartGroupOrder,
  onSimulateFriendAdd,
  onCopyGroupLink,
  onOpenGroupVendor,
  onAttachPostOrderItem,
  onBrowseRestaurantForAddOn,
  onOpenVendorCheckout,
  onClearVendorCart,
  onDuplicatePack,
  onDeletePack,
  onEditCartItem,
  onUpdateQuantity,
  onAddAnotherPack,
  onExploreStores,
  onAdvanceOrderStage,
  onResetOrderStage,
  onReorder,
  onSubmitSupportTicket,
}: OrdersTabProps) {
  const activeOrders = orders.filter((o) => o.currentStage !== 'delivered');
  const completedOrders = orders.filter((o) => o.currentStage === 'delivered');
  const vendorCarts = groupCartByVendor(trayItems);

  const [subTab, setSubTab] = useState<OrdersSubTab>(() => {
    if (initialSubTab) return initialSubTab;
    return trayItems.length > 0 ? 'cart' : 'ongoing';
  });

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [selectedOngoingId, setSelectedOngoingId] = useState<string>(
    activeOrders[0]?.orderId ?? ''
  );
  const [expandedCompletedId, setExpandedCompletedId] = useState<string | null>(null);
  const [addOnDrawerOpen, setAddOnDrawerOpen] = useState(false);
  const [callNoteVisible, setCallNoteVisible] = useState(false);

  // Support Ticket Sheet State
  const [helpOrderId, setHelpOrderId] = useState<string | null>(null);
  const [issueCategory, setIssueCategory] = useState('Late delivery');
  const [issueDetails, setIssueDetails] = useState('');

  const inspectedOngoing =
    activeOrders.find((o) => o.orderId === selectedOngoingId) ??
    activeOrders[0] ??
    null;

  function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!helpOrderId || !issueDetails.trim()) return;
    onSubmitSupportTicket({
      orderId: helpOrderId,
      category: issueCategory,
      summary: issueDetails.trim(),
    });
    setIssueDetails('');
    setHelpOrderId(null);
  }

  return (
    <div className="space-y-4 pb-36">
      {/* Header + Segmented 3-Tab Switcher (My Cart • Ongoing • Completed) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827]">
            Orders &amp; Cart
          </h1>
          <span className="text-[12px] font-semibold text-[#6F42C1]">
            {vendorCarts.length} {vendorCarts.length === 1 ? 'cart' : 'carts'} ·{' '}
            {activeOrders.length} ongoing
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Orders views"
          className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white border border-[#E5E7EB]"
        >
          {[
            {
              id: 'cart' as const,
              label: 'My Cart',
              count: trayItems.reduce((s, i) => s + i.quantity, 0),
            },
            { id: 'ongoing' as const, label: 'Ongoing', count: activeOrders.length },
            {
              id: 'completed' as const,
              label: 'Completed',
              count: completedOrders.length,
            },
          ].map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubTab(tab.id)}
                className={`h-9 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                    : 'text-[#6B7280] hover:bg-[#FAF8F4] hover:text-[#111827]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                      active
                        ? 'bg-[#A981FF] text-[#111827]'
                        : 'bg-[#F4EFFF] text-[#6F42C1]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: MY CART (Multi-Store Cart Overview + Group Ordering + Pre-Payment Tipping) */}
      {subTab === 'cart' && (
        <section aria-label="My Cart" className="space-y-3">
          {/* Group Ordering Collaborative Session Card */}
          {groupOrder.active ? (
            <div className="bg-white rounded-2xl border border-[#D0BCFC] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-9 h-9 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="text-sm font-bold text-[#111827] whitespace-nowrap">
                        Group Order
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[10px] font-bold whitespace-nowrap">
                        {groupOrder.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {groupOrder.vendorName} · {groupOrder.participants.length}{' '}
                      {groupOrder.participants.length === 1 ? 'person' : 'people'} joined
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCopyGroupLink}
                  className="px-2.5 h-8 rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC] text-[#111827] text-[11px] font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-[#6F42C1]" aria-hidden="true" />
                  <span>Copy Link</span>
                </button>
              </div>

              <div className="px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#6F42C1] truncate">
                  {groupOrder.shareUrl}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenGroupVendor(groupOrder.vendorId)}
                  className="text-[11px] font-bold text-[#111827] hover:text-[#6F42C1] shrink-0 cursor-pointer"
                >
                  Add My Meal ➔
                </button>
              </div>

              {/* Per-Participant Breakdown */}
              <div className="space-y-2">
                {groupOrder.participants.map((person) => {
                  const personTotal = person.items.reduce(
                    (sum, item) => sum + item.unitPrice * item.quantity,
                    0
                  );
                  return (
                    <div
                      key={person.id}
                      className="rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] px-3 py-2 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#111827]">
                        <span>{person.name}</span>
                        <span className="tabular-nums">{formatNGN(personTotal)}</span>
                      </div>
                      {person.items.length === 0 ? (
                        <div className="text-[11px] text-[#6B7280]">
                          Picking a meal from {groupOrder.vendorName}...
                        </div>
                      ) : (
                        person.items.map((ci) => (
                          <div
                            key={ci.cartItemId}
                            className="flex items-center justify-between text-[11px] text-[#6B7280]"
                          >
                            <span className="truncate pr-2">
                              {ci.quantity}x {ci.menuItem.name}
                            </span>
                            <span className="tabular-nums shrink-0 font-medium text-[#111827]">
                              {formatNGN(ci.unitPrice * ci.quantity)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onSimulateFriendAdd}
                className="w-full h-9 rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC] border border-[#D0BCFC] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                <span>Demo: Simulate Friend Adding Meal</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111827]">
                    Ordering with friends or office?
                  </div>
                  <div className="text-[11px] text-[#6B7280] truncate">
                    Share one cart link &amp; split one delivery fee
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onStartGroupOrder}
                className="px-3 h-8 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[11px] font-bold shrink-0 cursor-pointer"
              >
                Start Group Order
              </button>
            </div>
          )}

          {vendorCarts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#111827]">
                  No active carts yet
                </h2>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Add meals, fresh juices, cakes, or 5L palm oil from any store. Chopwize organizes each store into its own packable cart.
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreStores}
                className="h-10 px-5 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold cursor-pointer"
              >
                Explore Stores
              </button>
            </div>
          ) : (
            vendorCarts.map((group) => {
              const vendor = vendors.find((v) => v.id === group.vendorId);
              const packs = groupVendorItemsByPack(group.items);
              const ecoPackaging = Boolean(ecoPackagingByVendor[group.vendorId]);
              const vendorNote = vendorNotesByVendor[group.vendorId] ?? '';
              const rawSubtotal = group.items.reduce(
                (sum, i) => sum + i.unitPrice * i.quantity,
                0
              );
              const deliveryPromo = getEffectiveDeliveryFee(
                selectedDeliveryFee,
                rawSubtotal,
                group.vendorId,
                vendorPromos
              );
              const riderTip = Math.max(0, riderTipByVendor[group.vendorId] ?? 0);
              const totals = calculateCheckoutBreakdown(
                group.items,
                selectedDeliveryFee,
                0,
                false,
                {
                  includePackFees: true,
                  ecoPackaging,
                  riderTip,
                  freeDelivery: deliveryPromo.isFreeDelivery,
                }
              );

              return (
                <div
                  key={group.vendorId}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5"
                >
                  {/* Vendor Cart Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {vendor?.coverImageUrl ? (
                        <SafeImage
                          src={vendor.coverImageUrl}
                          alt={group.vendorName}
                          fallbackLabel={group.vendorName}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#E5E7EB]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#F4EFFF] text-[#6F42C1] font-bold text-[12px] flex items-center justify-center shrink-0">
                          {vendor?.monogram ?? 'CW'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827] truncate">
                          {group.vendorName}
                        </h2>
                        <div className="text-[12px] text-[#6B7280] tabular-nums">
                          {group.itemCount} {group.itemCount === 1 ? 'item' : 'items'} ·{' '}
                          {packs.length} {packs.length === 1 ? 'pack' : 'packs'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onClearVendorCart(group.vendorId)}
                      className="text-[12px] font-semibold text-[#B42318] hover:underline shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Active Free Delivery Campaign Banner */}
                  {deliveryPromo.isFreeDelivery && deliveryPromo.promoLabel && (
                    <div className="px-3 py-2 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-[12px] font-semibold flex items-center gap-1.5">
                      <BadgePercent className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Promo Applied: {deliveryPromo.promoLabel} (₦0 delivery)</span>
                    </div>
                  )}

                  {/* Pack-by-Pack Sections (Pack 1, Pack 2, etc.) */}
                  <div className="space-y-2.5">
                    {packs.map((pack) => (
                      <div
                        key={pack.packLabel}
                        className="rounded-2xl border border-[#E5E7EB] bg-[#FAF8F4] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] text-[11px] font-semibold">
                              {pack.packLabel}
                            </span>
                            <span className="tabular-nums text-[14px] font-bold text-[#111827]">
                              {formatNGN(pack.packSubtotal)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onDuplicatePack(group.vendorId, pack.packLabel)
                              }
                              aria-label={`Duplicate ${pack.packLabel}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F4EFFF] border border-[#D0BCFC] text-[#111827] text-[11px] font-semibold cursor-pointer"
                            >
                              <CopyPlus className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onDeletePack(group.vendorId, pack.packLabel)
                              }
                              aria-label={`Delete ${pack.packLabel}`}
                              className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-white hover:bg-[#FEF3F2] border border-[#E5E7EB] text-[#B42318] text-[11px] font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {pack.items.map((ci) => (
                            <div
                              key={ci.cartItemId}
                              className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] flex gap-2.5"
                            >
                              <SafeImage
                                src={ci.menuItem.imageUrl}
                                alt={ci.menuItem.name}
                                fallbackLabel={ci.menuItem.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="text-[14px] font-semibold text-[#111827] leading-snug">
                                  {ci.menuItem.name}
                                </div>
                                {ci.selectedVariant && (
                                  <div className="text-[11px] font-semibold text-[#6F42C1]">
                                    {ci.selectedVariant.label}
                                  </div>
                                )}
                                {ci.selections.length > 0 && (
                                  <p className="text-[12px] text-[#6B7280] line-clamp-2">
                                    {ci.selections
                                      .map((s) =>
                                        s.choices
                                          .map((c) =>
                                            (c.quantity ?? 1) > 1
                                              ? `${c.quantity}x ${c.name}`
                                              : c.name
                                          )
                                          .join(', ')
                                      )
                                      .join(' · ')}
                                  </p>
                                )}

                                <div className="flex items-center justify-between gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => onEditCartItem(ci)}
                                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#6F42C1] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <span>Edit Selections</span>
                                    <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                  </button>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="tabular-nums text-[13px] font-bold text-[#111827]">
                                      {formatNGN(ci.unitPrice * ci.quantity)}
                                    </span>
                                    <div className="flex items-center border border-[#E5E7EB] rounded-lg bg-[#FAF8F4] h-7">
                                      <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(ci.cartItemId, -1)}
                                        aria-label={`Decrease quantity for ${ci.menuItem.name}`}
                                        className="w-6 h-full flex items-center justify-center text-[#111827] cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" aria-hidden="true" />
                                      </button>
                                      <span className="w-5 text-center tabular-nums text-[12px] font-semibold text-[#111827]">
                                        {ci.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(ci.cartItemId, 1)}
                                        aria-label={`Increase quantity for ${ci.menuItem.name}`}
                                        className="w-6 h-full flex items-center justify-center text-[#111827] cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" aria-hidden="true" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* + Add Another Pack */}
                  <button
                    type="button"
                    onClick={() => onAddAnotherPack(group.vendorId)}
                    className="w-full h-10 rounded-xl border border-dashed border-[#A981FF] bg-[#F4EFFF]/60 hover:bg-[#F4EFFF] text-[#111827] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                    <span>Add Another Pack</span>
                  </button>

                  {/* Brown / Eco Packaging Toggle */}
                  <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Leaf className="w-4 h-4 text-[#16A34A] shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#111827]">
                          Brown / Eco Packaging (+₦200)
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate">
                          Sealed eco kraft bag
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ecoPackaging}
                      onClick={() => onToggleEcoPackaging(group.vendorId)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-semibold shrink-0 cursor-pointer ${
                        ecoPackaging
                          ? 'bg-[#A981FF] text-[#111827]'
                          : 'bg-white border border-[#E5E7EB] text-[#111827]'
                      }`}
                    >
                      {ecoPackaging ? 'Added' : 'Add'}
                    </button>
                  </div>

                  {/* Pre-Payment Rider Tipping Prompt */}
                  <div className="p-3.5 rounded-2xl bg-[#F4EFFF]/70 border border-[#D0BCFC] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#111827]">
                        <Heart className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                        <span>Would you like to tip your delivery rider?</span>
                      </div>
                      {riderTip > 0 && (
                        <span className="text-[11px] font-bold text-[#6F42C1] tabular-nums shrink-0">
                          +{formatNGN(riderTip)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIP_PRESETS.map((preset) => {
                        const active = riderTip === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChangeRiderTip(group.vendorId, preset.value)}
                            className={`h-8 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors ${
                              active
                                ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                                : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#FAF8F4]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`cart-tip-${group.vendorId}`}
                        className="text-[11px] text-[#6B7280] shrink-0"
                      >
                        Custom tip (₦):
                      </label>
                      <input
                        id={`cart-tip-${group.vendorId}`}
                        type="number"
                        min={0}
                        step={50}
                        value={riderTip === 0 ? '' : riderTip}
                        onChange={(e) =>
                          onChangeRiderTip(
                            group.vendorId,
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        placeholder="e.g. 300"
                        className="flex-1 h-8 px-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] font-semibold tabular-nums text-[#111827] focus:outline-none focus:border-[#A981FF]"
                      />
                    </div>
                  </div>

                  {/* Note for the vendor */}
                  <div>
                    <label
                      htmlFor={`cart-note-${group.vendorId}`}
                      className="block text-[12px] font-medium text-[#6B7280] mb-1"
                    >
                      Note for the vendor (Optional)
                    </label>
                    <input
                      id={`cart-note-${group.vendorId}`}
                      type="text"
                      value={vendorNote}
                      onChange={(e) =>
                        onChangeVendorNote(group.vendorId, e.target.value)
                      }
                      placeholder="e.g. Pack pepper separately, extra napkins..."
                      className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
                    />
                  </div>

                  {/* Transparent Fee Summary */}
                  <div className="rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] p-3 space-y-1.5 text-[12px]">
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Items Subtotal</span>
                      <span className="tabular-nums font-medium text-[#111827]">
                        {formatNGN(totals.itemsSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6B7280]">
                      <span>
                        Takeaway Packs ({totals.takeawayPackCount} × ₦300)
                      </span>
                      <span className="tabular-nums font-medium text-[#111827]">
                        {formatNGN(totals.takeawayPackFee)}
                      </span>
                    </div>
                    {totals.ecoPackagingFee > 0 && (
                      <div className="flex justify-between text-[#16A34A]">
                        <span>Eco Packaging</span>
                        <span className="tabular-nums font-medium">
                          {formatNGN(totals.ecoPackagingFee)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Delivery Fee</span>
                      <span className="tabular-nums font-medium text-[#111827]">
                        {deliveryPromo.isFreeDelivery ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="line-through text-[#6B7280]">
                              {formatNGN(selectedDeliveryFee)}
                            </span>
                            <span className="text-[#16A34A] font-semibold">₦0</span>
                          </span>
                        ) : (
                          formatNGN(totals.deliveryFee)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Chopwize Service Charge</span>
                      <span className="tabular-nums font-medium text-[#111827]">
                        {formatNGN(totals.serviceCharge)}
                      </span>
                    </div>
                    {totals.riderTip > 0 && (
                      <div className="flex justify-between text-[#6F42C1] font-semibold">
                        <span>Rider Tip (100% to rider)</span>
                        <span className="tabular-nums">
                          {formatNGN(totals.riderTip)}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-[#E5E7EB] flex justify-between text-[14px] font-bold text-[#111827]">
                      <span>Total Payable</span>
                      <span className="tabular-nums">
                        {formatNGN(totals.totalPayable)}
                      </span>
                    </div>
                  </div>

                  {/* Primary Make Payment CTA */}
                  <button
                    type="button"
                    onClick={() => onOpenVendorCheckout(group.vendorId)}
                    className="w-full h-11 px-4 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>Make Payment</span>
                    <span className="tabular-nums font-bold inline-flex items-center gap-1">
                      {formatNGN(totals.totalPayable)}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* TAB 2: ONGOING ORDERS */}
      {subTab === 'ongoing' && (
        <section aria-label="Ongoing orders" className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
                <Package className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[#111827]">
                  No ongoing deliveries right now
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Place an order from My Cart or Explore to watch live rider tracking here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeOrders.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {activeOrders.map((ord) => {
                    const active = inspectedOngoing?.orderId === ord.orderId;
                    return (
                      <button
                        key={ord.orderId}
                        type="button"
                        onClick={() => setSelectedOngoingId(ord.orderId)}
                        className={`px-3.5 py-2 rounded-2xl border text-left shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#F4EFFF] border-[#A981FF] text-[#111827]'
                            : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-[#6F42C1]">
                          #{ord.orderId}
                        </div>
                        <div className="text-xs font-semibold truncate max-w-[160px] text-[#111827]">
                          {ord.vendorName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {inspectedOngoing && (
                <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-4 space-y-5">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#6F42C1] tabular-nums">
                          Order #{inspectedOngoing.orderId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[10px] font-bold text-[#6F42C1] uppercase">
                          {inspectedOngoing.currentStage.replace('_', ' ')}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-[#111827] mt-0.5">
                        {inspectedOngoing.vendorName}
                      </h2>
                      <p className="text-[11px] text-[#6B7280]">
                        {inspectedOngoing.createdAtLabel} · {inspectedOngoing.zoneLabel}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHelpOrderId(inspectedOngoing.orderId)}
                      className="inline-flex items-center gap-1 min-h-[34px] px-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[11px] font-bold text-[#111827] shrink-0 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                      <span>Get Help</span>
                    </button>
                  </div>

                  {/* Stylized Interactive Live Delivery Map */}
                  <LiveDeliveryMap
                    order={inspectedOngoing}
                    vendorAddress={
                      vendors.find((v) => v.id === inspectedOngoing.vendorId)
                        ?.address
                    }
                    viewerRole="customer"
                  />

                  {/* Post-Order Add-On Shortcut */}
                  {(() => {
                    const orderVendor = vendors.find(
                      (v) => v.id === inspectedOngoing.vendorId
                    );
                    if (!orderVendor) return null;
                    const quickItems = orderVendor.menu.slice(0, 4);
                    return (
                      <div className="rounded-2xl bg-[#F4EFFF] border border-[#D0BCFC] p-3.5 space-y-2.5">
                        <div className="space-y-2">
                          <div>
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6F42C1]">
                              <Zap className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>Zero Extra Delivery Fee</span>
                            </div>
                            <div className="text-xs font-bold text-[#111827] mt-0.5">
                              Forgot a drink, dodo, or extra protein?
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddOnDrawerOpen((v) => !v)}
                            className="w-full h-9 px-3 rounded-xl bg-white hover:bg-[#FAF8F4] border border-[#D0BCFC] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Add More from This Restaurant</span>
                            <Plus className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                          </button>
                        </div>

                        {addOnDrawerOpen && (
                          <div className="pt-2 border-t border-[#D0BCFC] space-y-2">
                            <div className="space-y-1.5">
                              {quickItems.map((mItem) => {
                                const price = getStartingPrice(mItem);
                                return (
                                  <div
                                    key={mItem.id}
                                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-[#E5E7EB]"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <SafeImage
                                        src={mItem.imageUrl}
                                        alt={mItem.name}
                                        fallbackLabel={mItem.name}
                                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-[#111827] truncate">
                                          {mItem.name}
                                        </div>
                                        <div className="text-[11px] font-bold text-[#6F42C1] tabular-nums">
                                          {formatNGN(price)}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onAttachPostOrderItem(
                                          inspectedOngoing.orderId,
                                          mItem,
                                          orderVendor
                                        )
                                      }
                                      className="h-8 px-2.5 rounded-lg bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" aria-hidden="true" />
                                      <span>Add</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onBrowseRestaurantForAddOn(orderVendor.id)
                              }
                              className="w-full h-8 rounded-xl bg-white hover:bg-[#FAF8F4] border border-[#D0BCFC] text-[11px] font-bold text-[#111827] cursor-pointer"
                            >
                              Browse Full {orderVendor.name} Menu ➔
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Live Vertical Fulfillment Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                        Live Tracking Timeline
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAdvanceOrderStage(inspectedOngoing.orderId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[11px] font-bold cursor-pointer"
                        >
                          <span>Demo: Advance Stage</span>
                          <ArrowRight className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetOrderStage(inspectedOngoing.orderId)}
                          aria-label="Reset order stage"
                          title="Reset demo stage"
                          className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#FAF8F4] text-[#6B7280] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <ol className="space-y-2.5" aria-label="Order fulfillment stages">
                      {ORDER_STAGES.map((stage, idx) => {
                        const activeIdx = getOrderStageIndex(inspectedOngoing.currentStage);
                        const completed = idx < activeIdx;
                        const current = idx === activeIdx;
                        const timestamp = inspectedOngoing.stageTimestamps[stage.id];

                        return (
                          <li key={stage.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  completed
                                    ? 'bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A]'
                                    : current
                                      ? 'bg-[#A981FF] text-[#111827] ring-4 ring-[#F4EFFF]'
                                      : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
                                }`}
                              >
                                {completed ? (
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                  idx + 1
                                )}
                              </span>
                              {idx < ORDER_STAGES.length - 1 && (
                                <span
                                  aria-hidden="true"
                                  className={`w-0.5 h-5 mt-0.5 ${
                                    idx < activeIdx ? 'bg-[#A981FF]' : 'bg-[#E5E7EB]'
                                  }`}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    completed || current
                                      ? 'text-[#111827]'
                                      : 'text-[#6B7280]'
                                  }`}
                                >
                                  {stage.label}
                                </span>
                                {timestamp && (
                                  <span className="text-[10px] text-[#6B7280] tabular-nums">
                                    {timestamp}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6B7280]">{stage.detail}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {/* Assigned Rider & 4-Digit Security PIN */}
                  <div className="rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] font-bold text-xs flex items-center justify-center shrink-0">
                          TA
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#6F42C1]">
                            Assigned Chopwize Rider
                          </div>
                          <div className="text-xs font-bold text-[#111827] truncate">
                            {inspectedOngoing.rider.name}
                          </div>
                          <div className="text-[11px] text-[#6B7280] inline-flex items-center gap-1">
                            <Bike className="w-3 h-3" aria-hidden="true" />
                            <span className="tabular-nums">{inspectedOngoing.rider.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-white border border-[#D0BCFC] text-center shrink-0">
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6F42C1]">
                          <KeyRound className="w-3 h-3" aria-hidden="true" />
                          <span>PIN</span>
                        </div>
                        <div className="text-base font-extrabold text-[#111827] tracking-widest tabular-nums">
                          {inspectedOngoing.deliveryPin}
                        </div>
                        <div className="text-[9px] text-[#6B7280]">Share on arrival</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCallNoteVisible((v) => !v)}
                        className="flex-1 min-h-[38px] rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F4EFFF] text-xs font-bold text-[#111827] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                        <span>Call Rider</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenOrderChat(inspectedOngoing.orderId)}
                        className="flex-1 min-h-[38px] rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-xs font-bold text-[#111827] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Chat Rider</span>
                        {(orderMessages?.[inspectedOngoing.orderId]?.length ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white text-[#6F42C1] text-[10px] font-bold tabular-nums">
                            {orderMessages?.[inspectedOngoing.orderId]?.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {callNoteVisible && (
                      <div className="p-2.5 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] text-[11px] text-[#111827]">
                        Masked Dispatch Dialer:{' '}
                        <strong className="tabular-nums">
                          {inspectedOngoing.rider.phone}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Itemized Receipt */}
                  <OrderReceiptBreakdown order={inspectedOngoing} />
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* TAB 3: COMPLETED ORDERS */}
      {subTab === 'completed' && (
        <section aria-label="Completed orders" className="space-y-3">
          {completedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 text-center text-xs text-[#6B7280]">
              Completed orders and digital receipts will appear here once delivered.
            </div>
          ) : (
            completedOrders.map((ord) => {
              const expanded = expandedCompletedId === ord.orderId;
              return (
                <div
                  key={ord.orderId}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#16A34A]">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>#{ord.orderId} · Delivered</span>
                      </div>
                      <h2 className="text-sm font-bold text-[#111827] mt-0.5 truncate">
                        {ord.vendorName}
                      </h2>
                      <p className="text-[11px] text-[#6B7280]">
                        {ord.createdAtLabel} ·{' '}
                        <strong className="tabular-nums text-[#111827]">
                          {formatNGN(ord.totalPaid)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCompletedId(expanded ? null : ord.orderId)
                      }
                      className="flex-1 h-9 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] text-xs font-bold cursor-pointer"
                    >
                      {expanded ? 'Hide Receipt' : 'View Timeline / Receipt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorder(ord)}
                      className="h-9 px-4 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Reorder
                    </button>
                  </div>

                  {expanded && (
                    <div className="pt-2 border-t border-[#E5E7EB] space-y-3">
                      <OrderReceiptBreakdown order={ord} />
                      <button
                        type="button"
                        onClick={() => setHelpOrderId(ord.orderId)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6F42C1] hover:underline cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Need help with this order?</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Order-Linked Support Ticket Sheet */}
      {helpOrderId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Order Support Ticket"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHelpOrderId(null);
          }}
        >
          <form
            onSubmit={handleSubmitTicket}
            className="w-full max-w-[480px] bg-white rounded-t-3xl border-t border-[#E5E7EB] p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111827]">
                Get Help · Order #{helpOrderId}
              </h3>
              <button
                type="button"
                onClick={() => setHelpOrderId(null)}
                aria-label="Close support sheet"
                className="p-1 text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[#6B7280]">
                Select Issue Category
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Missing item', 'Wrong item', 'Late delivery', 'Food safety'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setIssueCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      issueCategory === cat
                        ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                        : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="support-issue-notes"
                className="block text-xs font-bold text-[#6B7280] mb-1"
              >
                Describe what happened
              </label>
              <textarea
                id="support-issue-notes"
                required
                rows={3}
                value={issueDetails}
                onChange={(e) => setIssueDetails(e.target.value)}
                placeholder="Share details so Chopwize Support & Trust can resolve this right away..."
                className="w-full p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold cursor-pointer"
            >
              Submit Support Ticket
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function OrderReceiptBreakdown({ order }: { order: OrderRecord }) {
  return (
    <div className="space-y-2.5 pt-2 border-t border-[#E5E7EB]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
          Itemized Receipt
        </h3>
        {order.appliedPromoLabels && order.appliedPromoLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {order.appliedPromoLabels.map((label) => (
              <span
                key={label}
                className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-semibold"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.cartItemId} className="flex justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-bold text-[#111827]">
                {item.quantity}x {item.menuItem.name}{' '}
                <span className="font-normal text-[#6B7280]">
                  ({item.selectedVariant?.label ?? item.menuItem.sellingUnit})
                </span>
                {item.selections.length > 0 && (
                  <span className="font-normal text-[#6B7280]">
                    {' '}
                    +{' '}
                    {item.selections
                      .map((s) =>
                        s.choices
                          .map((c) =>
                            (c.quantity ?? 1) > 1 ? `${c.quantity}x ${c.name}` : c.name
                          )
                          .join(', ')
                      )
                      .join(' · ')}
                  </span>
                )}
              </div>
              {item.specialNote && (
                <div className="text-[11px] italic text-[#6F42C1] mt-0.5">
                  Note: &ldquo;{item.specialNote}&rdquo;
                </div>
              )}
            </div>
            <span className="tabular-nums font-bold text-[#111827] shrink-0">
              {formatNGN(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#E5E7EB] space-y-1 text-[12px]">
        <div className="flex justify-between text-[#6B7280]">
          <span>Items Subtotal</span>
          <span className="tabular-nums font-medium text-[#111827]">
            {formatNGN(order.itemsSubtotal)}
          </span>
        </div>
        {(order.takeawayPackFee ?? 0) > 0 && (
          <div className="flex justify-between text-[#6B7280]">
            <span>Takeaway Packs ({order.takeawayPackCount ?? 1})</span>
            <span className="tabular-nums font-medium text-[#111827]">
              {formatNGN(order.takeawayPackFee ?? 0)}
            </span>
          </div>
        )}
        {(order.ecoPackagingFee ?? 0) > 0 && (
          <div className="flex justify-between text-[#16A34A]">
            <span>Brown / Eco Packaging</span>
            <span className="tabular-nums font-medium">
              {formatNGN(order.ecoPackagingFee ?? 0)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-[#6B7280]">
          <span>Delivery Fee</span>
          <span className="tabular-nums font-medium text-[#111827]">
            {formatNGN(order.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between text-[#6B7280]">
          <span>Chopwize Service Charge</span>
          <span className="tabular-nums font-medium text-[#111827]">
            {formatNGN(order.serviceCharge)}
          </span>
        </div>
        {(order.riderTip ?? 0) > 0 && (
          <div className="flex justify-between text-[#6F42C1] font-semibold">
            <span>Rider Tip</span>
            <span className="tabular-nums">{formatNGN(order.riderTip ?? 0)}</span>
          </div>
        )}
        {order.walletApplied > 0 && (
          <div className="flex justify-between text-[#6F42C1] font-semibold">
            <span>Food Budget Wallet Applied</span>
            <span className="tabular-nums">-{formatNGN(order.walletApplied)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[14px] text-[#111827] pt-1">
          <span>Total Paid</span>
          <span className="tabular-nums">{formatNGN(order.totalPaid)}</span>
        </div>
      </div>
    </div>
  );
}
