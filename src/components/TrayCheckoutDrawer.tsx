import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  CopyPlus,
  CreditCard,
  Info,
  Leaf,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import type {
  CartItem,
  LocationZone,
  PaymentOutcome,
  SubstitutionPreference,
  VendorPromoCampaign,
} from '../types/chopwize';
import {
  calculateCheckoutBreakdown,
  formatNGN,
  getEffectiveDeliveryFee,
  groupVendorItemsByPack,
} from '../utils/pricing';
import { SafeImage } from './SafeImage';

const TIP_PRESETS = [0, 200, 500, 1000] as const;

interface TrayCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: 'review' | 'checkout';
  items: CartItem[];
  activeVendorId: string | null;
  selectedZone: LocationZone;
  walletBalance: number;
  paymentOutcome: PaymentOutcome;
  onChangePaymentOutcome: (outcome: PaymentOutcome) => void;
  substitutionPref: SubstitutionPreference;
  ecoPackagingByVendor: Record<string, boolean>;
  onToggleEcoPackaging: (vendorId: string) => void;
  vendorNotesByVendor: Record<string, string>;
  onChangeVendorNote: (vendorId: string, note: string) => void;
  vendorPromos?: VendorPromoCampaign[];
  riderTipByVendor: Record<string, number>;
  onChangeRiderTip: (vendorId: string, tip: number) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearVendorCart: (vendorId: string) => void;
  onDuplicatePack: (vendorId: string, packLabel: string) => void;
  onDeletePack: (vendorId: string, packLabel: string) => void;
  onEditCartItem: (cartItem: CartItem) => void;
  onAddAnotherPack: (vendorId: string) => void;
  onPlaceOrder: (payload: {
    vendorId: string;
    deliveryAddress: string;
    customerPhone: string;
    vendorNote?: string;
    applyWallet: boolean;
  }) => { ok: boolean; status?: 'paid' | 'pending'; errorMessage?: string };
}

export function TrayCheckoutDrawer({
  isOpen,
  onClose,
  initialStep = 'review',
  items,
  activeVendorId,
  selectedZone,
  walletBalance,
  paymentOutcome,
  onChangePaymentOutcome,
  substitutionPref,
  ecoPackagingByVendor,
  onToggleEcoPackaging,
  vendorNotesByVendor,
  onChangeVendorNote,
  vendorPromos = [],
  riderTipByVendor,
  onChangeRiderTip,
  onUpdateQuantity,
  onRemoveItem,
  onClearVendorCart,
  onDuplicatePack,
  onDeletePack,
  onEditCartItem,
  onAddAnotherPack,
  onPlaceOrder,
}: TrayCheckoutDrawerProps) {
  const [step, setStep] = useState<'review' | 'checkout' | 'pending'>(initialStep);
  const [streetAddress, setStreetAddress] = useState('25 Gbenga Lawal St');
  const [phone, setPhone] = useState('+234 803 555 1290');
  const [applyWallet, setApplyWallet] = useState(false);
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setErrorMsg(null);
      setShowFeeInfo(false);
    } else {
      setStep('review');
      setErrorMsg(null);
      setShowFeeInfo(false);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const targetVendorId = activeVendorId ?? items[0]?.vendorId ?? null;
  const vendorItems = targetVendorId
    ? items.filter((i) => i.vendorId === targetVendorId)
    : [];
  const vendorName = vendorItems[0]?.vendorName ?? 'Store Cart';
  const packs = groupVendorItemsByPack(vendorItems);
  const ecoPackaging = targetVendorId
    ? Boolean(ecoPackagingByVendor[targetVendorId])
    : false;
  const vendorNote = targetVendorId ? vendorNotesByVendor[targetVendorId] ?? '' : '';
  const riderTip = targetVendorId ? Math.max(0, riderTipByVendor[targetVendorId] ?? 0) : 0;
  const rawSubtotal = vendorItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const deliveryPromo = targetVendorId
    ? getEffectiveDeliveryFee(
        selectedZone.deliveryFee,
        rawSubtotal,
        targetVendorId,
        vendorPromos
      )
    : { deliveryFee: selectedZone.deliveryFee, isFreeDelivery: false };

  const totals = calculateCheckoutBreakdown(
    vendorItems,
    selectedZone.deliveryFee,
    walletBalance,
    applyWallet,
    {
      includePackFees: true,
      ecoPackaging,
      riderTip,
      freeDelivery: deliveryPromo.isFreeDelivery,
    }
  );

  const isGroceryTray = vendorItems.some(
    (i) => i.menuItem.marketplaceCategory === 'groceries'
  );

  function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!targetVendorId) return;

    if (!streetAddress.trim() || streetAddress.trim().length < 5) {
      setErrorMsg('Please enter a valid Lagos street address.');
      return;
    }

    const res = onPlaceOrder({
      vendorId: targetVendorId,
      deliveryAddress: `${streetAddress.trim()}, ${selectedZone.label}`,
      customerPhone: phone.trim(),
      vendorNote: vendorNote.trim() || undefined,
      applyWallet,
    });

    if (!res.ok) {
      setErrorMsg(res.errorMessage ?? 'Paystack could not process this payment.');
      return;
    }

    if (res.status === 'pending') {
      setStep('pending');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={step === 'review' ? 'Review & Pack Editor' : 'Checkout'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] max-h-[90vh] bg-white rounded-t-3xl border-t border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setStep('review');
                  setErrorMsg(null);
                }}
                aria-label="Back to pack review"
                className="p-1.5 rounded-xl hover:bg-[#FAF8F4] text-[#111827] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold tracking-[-0.015em] text-[#111827] truncate">
                {step === 'review'
                  ? `Review & Packs (${totals.itemCount})`
                  : step === 'pending'
                    ? 'Paystack Verification'
                    : 'Transparent Checkout'}
              </h2>
              {vendorItems.length > 0 && (
                <p className="text-[12px] font-medium text-[#6F42C1] truncate">
                  {vendorName}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout drawer"
            className="w-9 h-9 rounded-full hover:bg-[#FAF8F4] flex items-center justify-center text-[#111827] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Empty State */}
        {vendorItems.length === 0 && step !== 'pending' ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-[16px] font-bold text-[#111827]">
              Your pack cart is empty
            </h3>
            <p className="text-[13px] text-[#6B7280]">
              Tap Add + on any dish, fresh juice, cake, or litre bottle to build your order pack.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-5 rounded-xl bg-[#A981FF] text-[14px] font-semibold text-[#111827] cursor-pointer"
            >
              Discover Food
            </button>
          </div>
        ) : step === 'pending' ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Clock className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-[#111827]">
                Awaiting Paystack Bank Confirmation
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-[1.45]">
                Simulated Pending Verification state active. Your order has been queued in{' '}
                <strong className="text-[#111827]">Orders ➔ Ongoing</strong> while Paystack confirms your transfer.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold cursor-pointer"
            >
              View Order in Ongoing Tab
            </button>
          </div>
        ) : step === 'review' ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              <div className="flex items-center justify-between text-[12px] font-medium text-[#6B7280]">
                <span>
                  {packs.length} {packs.length === 1 ? 'Pack' : 'Packs'} · Single rider dispatch
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (targetVendorId) onClearVendorCart(targetVendorId);
                  }}
                  className="text-[12px] font-semibold text-[#B42318] hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>

              {isGroceryTray && (
                <div className="px-3 py-2 rounded-xl bg-[#F4EFFF] text-[12px] text-[#111827]">
                  Grocery substitution:{' '}
                  <strong className="capitalize">
                    {substitutionPref.replace('_', ' ')}
                  </strong>
                </div>
              )}

              {/* Packs List (Pack 1, Pack 2, etc.) with Duplicate, Delete Pack & Edit Selections */}
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
                        onClick={() => {
                          if (targetVendorId) {
                            onDuplicatePack(targetVendorId, pack.packLabel);
                          }
                        }}
                        aria-label={`Duplicate ${pack.packLabel}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F4EFFF] border border-[#D0BCFC] text-[#111827] text-[11px] font-semibold cursor-pointer"
                      >
                        <CopyPlus className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (targetVendorId) {
                            onDeletePack(targetVendorId, pack.packLabel);
                          }
                        }}
                        aria-label={`Delete ${pack.packLabel}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-[#FEF3F2] border border-[#E5E7EB] text-[#B42318] text-[11px] font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pack.items.map((cartItem) => (
                      <div
                        key={cartItem.cartItemId}
                        className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] flex gap-2.5"
                      >
                        <SafeImage
                          src={cartItem.menuItem.imageUrl}
                          alt={cartItem.menuItem.name}
                          fallbackLabel={cartItem.menuItem.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[14px] font-semibold text-[#111827] leading-snug">
                              {cartItem.menuItem.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(cartItem.cartItemId)}
                              aria-label={`Remove ${cartItem.menuItem.name}`}
                              className="text-[#6B7280] hover:text-[#B42318] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>

                          {cartItem.selectedVariant && (
                            <div className="text-[12px] font-medium text-[#6F42C1]">
                              {cartItem.selectedVariant.label}
                            </div>
                          )}

                          {cartItem.selections.length > 0 && (
                            <p className="text-[12px] text-[#6B7280]">
                              {cartItem.selections
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

                          {cartItem.specialNote && (
                            <p className="text-[11px] italic text-[#6F42C1]">
                              &ldquo;{cartItem.specialNote}&rdquo;
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => onEditCartItem(cartItem)}
                              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#6F42C1] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span>Edit Selections</span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="tabular-nums text-[13px] font-bold text-[#111827]">
                                {formatNGN(cartItem.unitPrice * cartItem.quantity)}
                              </span>
                              <div className="flex items-center border border-[#E5E7EB] rounded-lg bg-[#FAF8F4] h-7">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(cartItem.cartItemId, -1)}
                                  aria-label="Decrease quantity"
                                  className="w-6 h-full flex items-center justify-center cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" aria-hidden="true" />
                                </button>
                                <span className="w-5 text-center tabular-nums text-[12px] font-semibold">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(cartItem.cartItemId, 1)}
                                  aria-label="Increase quantity"
                                  className="w-6 h-full flex items-center justify-center cursor-pointer"
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

              {/* + Add Another Pack CTA */}
              {targetVendorId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddAnotherPack(targetVendorId);
                  }}
                  className="w-full h-10 rounded-xl border border-dashed border-[#A981FF] bg-[#F4EFFF]/60 hover:bg-[#F4EFFF] text-[#111827] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                  <span>Add Another Pack</span>
                </button>
              )}

              {/* Brown / Eco Packaging Toggle */}
              {targetVendorId && (
                <div className="p-3 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                      <Leaf className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#111827]">
                        Brown / Eco Packaging
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        Biodegradable kraft bag &amp; sealed lid (+₦200)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ecoPackaging}
                    onClick={() => onToggleEcoPackaging(targetVendorId)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold shrink-0 cursor-pointer ${
                      ecoPackaging
                        ? 'bg-[#A981FF] text-[#111827]'
                        : 'bg-white border border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    {ecoPackaging ? 'Added' : 'Add +₦200'}
                  </button>
                </div>
              )}

              {/* Pre-Payment Rider Tip Selector */}
              {targetVendorId && (
                <div className="p-3 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#111827]">
                      Would you like to tip your delivery rider?
                    </span>
                    {riderTip > 0 && (
                      <span className="text-[12px] font-bold text-[#6F42C1] tabular-nums">
                        +{formatNGN(riderTip)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIP_PRESETS.map((amount) => {
                      const active = riderTip === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => onChangeRiderTip(targetVendorId, amount)}
                          className={`h-9 rounded-xl text-[12px] font-semibold border tabular-nums cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                              : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F4EFFF]'
                          }`}
                        >
                          {amount === 0 ? 'No tip' : formatNGN(amount)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="drawer-custom-tip-review"
                      className="text-[11px] font-medium text-[#6B7280] shrink-0"
                    >
                      Custom tip (₦):
                    </label>
                    <input
                      id="drawer-custom-tip-review"
                      type="number"
                      min={0}
                      step={50}
                      value={riderTip === 0 ? '' : riderTip}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        onChangeRiderTip(targetVendorId, val);
                      }}
                      placeholder="Enter custom ₦ amount"
                      className="flex-1 h-9 px-3 rounded-xl bg-white border border-[#E5E7EB] text-[12px] text-[#111827] tabular-nums focus:outline-none focus:border-[#A981FF]"
                    />
                  </div>
                </div>
              )}

              {/* Note for the vendor */}
              {targetVendorId && (
                <div>
                  <label
                    htmlFor="vendor-order-note"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Note for the vendor (Optional)
                  </label>
                  <input
                    id="vendor-order-note"
                    type="text"
                    value={vendorNote}
                    onChange={(e) => onChangeVendorNote(targetVendorId, e.target.value)}
                    placeholder="e.g. Pack utensils separately, call at estate gate..."
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>
              )}

              {/* Transparent Fee Breakdown */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3.5 space-y-2 text-[13px]">
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
                    <span>Brown / Eco Packaging</span>
                    <span className="tabular-nums font-medium">
                      {formatNGN(totals.ecoPackagingFee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>
                    Delivery Fee ({selectedZone.shortName} Zone)
                    {deliveryPromo.isFreeDelivery && (
                      <span className="ml-1.5 text-[10px] font-bold text-[#16A34A]">
                        · Free Delivery Promo
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums font-medium text-[#111827] flex items-center gap-1.5">
                    {deliveryPromo.isFreeDelivery && (
                      <span className="line-through text-[#9CA3AF]">
                        {formatNGN(selectedZone.deliveryFee)}
                      </span>
                    )}
                    <span className={deliveryPromo.isFreeDelivery ? 'text-[#16A34A] font-bold' : ''}>
                      {formatNGN(totals.deliveryFee)}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#6B7280]">
                  <button
                    type="button"
                    onClick={() => setShowFeeInfo((v) => !v)}
                    className="inline-flex items-center gap-1 hover:text-[#111827] cursor-pointer"
                  >
                    <span>Chopwize Service Charge</span>
                    <Info className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                  </button>
                  <span className="tabular-nums font-medium text-[#111827]">
                    {formatNGN(totals.serviceCharge)}
                  </span>
                </div>
                {totals.riderTip > 0 && (
                  <div className="flex justify-between text-[#6F42C1] font-semibold">
                    <span>Rider Tip (100% to rider)</span>
                    <span className="tabular-nums">{formatNGN(totals.riderTip)}</span>
                  </div>
                )}
                {showFeeInfo && (
                  <p className="text-[12px] bg-[#FAF8F4] p-2.5 rounded-xl text-[#6B7280]">
                    Supports Chopwize kitchen quality audits, rider insurance, and 24/7 order protection.
                  </p>
                )}
                <div className="pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-[15px] text-[#111827]">
                  <span>Total Payable</span>
                  <span className="tabular-nums">{formatNGN(totals.totalPayable)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full h-11 px-4 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] font-semibold text-[14px] flex items-center justify-between cursor-pointer"
              >
                <span>Make Payment</span>
                <span className="tabular-nums font-bold">
                  {formatNGN(totals.totalPayable)}
                </span>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2.5">
                <div>
                  <label
                    htmlFor="tray-street-address"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Delivery Street ({selectedZone.label})
                  </label>
                  <input
                    id="tray-street-address"
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="tray-phone"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Contact Phone
                  </label>
                  <input
                    id="tray-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] tabular-nums text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>
              </div>

              {/* Pre-Payment Rider Tip Selector on Checkout */}
              {targetVendorId && (
                <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#111827]">
                      Would you like to tip your delivery rider?
                    </span>
                    {riderTip > 0 && (
                      <span className="text-[12px] font-bold text-[#6F42C1] tabular-nums">
                        +{formatNGN(riderTip)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIP_PRESETS.map((amount) => {
                      const active = riderTip === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => onChangeRiderTip(targetVendorId, amount)}
                          className={`h-9 rounded-xl text-[12px] font-semibold border tabular-nums cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                              : 'bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F4EFFF]'
                          }`}
                        >
                          {amount === 0 ? 'No tip' : formatNGN(amount)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Food Budget Wallet Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#F4EFFF] border border-[#D0BCFC] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-[#6F42C1] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#111827]">
                      Apply Food Budget Wallet
                    </div>
                    <div className="text-[12px] text-[#6B7280] tabular-nums">
                      Available: {formatNGN(walletBalance)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={applyWallet}
                  onClick={() => setApplyWallet((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer ${
                    applyWallet
                      ? 'bg-[#A981FF] text-[#111827]'
                      : 'bg-white border border-[#D0BCFC] text-[#111827]'
                  }`}
                >
                  {applyWallet ? 'Applied' : 'Use'}
                </button>
              </div>

              {/* Demo Payment Outcome Selector */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#111827]">
                  <CreditCard className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                  <span>Demo Paystack Payment Outcome</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'success' as const, label: 'Instant Success' },
                    { id: 'pending' as const, label: 'Pending Verify' },
                    { id: 'failed' as const, label: 'Failed Payment' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChangePaymentOutcome(opt.id);
                        setErrorMsg(null);
                      }}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-semibold cursor-pointer ${
                        paymentOutcome === opt.id
                          ? opt.id === 'failed'
                            ? 'bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318]'
                            : 'bg-[#F4EFFF] border border-[#A981FF] text-[#6F42C1]'
                          : 'bg-white border border-[#E5E7EB] text-[#111827]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown Recap */}
              <div className="space-y-1 text-[13px] px-1">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Items, Packs, Delivery &amp; Service</span>
                  <span className="tabular-nums font-medium text-[#111827]">
                    {formatNGN(
                      totals.itemsSubtotal +
                        totals.takeawayPackFee +
                        totals.ecoPackagingFee +
                        totals.deliveryFee +
                        totals.serviceCharge
                    )}
                  </span>
                </div>
                {totals.riderTip > 0 && (
                  <div className="flex justify-between text-[#6F42C1] font-semibold">
                    <span>Rider Tip</span>
                    <span className="tabular-nums">{formatNGN(totals.riderTip)}</span>
                  </div>
                )}
                {totals.walletApplied > 0 && (
                  <div className="flex justify-between text-[#6F42C1] font-semibold">
                    <span>Food Budget Wallet</span>
                    <span className="tabular-nums">-{formatNGN(totals.walletApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[15px] text-[#111827] pt-1">
                  <span>Total Payable</span>
                  <span className="tabular-nums">{formatNGN(totals.totalPayable)}</span>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[12px] font-medium text-[#B42318] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] font-semibold text-[14px] cursor-pointer"
              >
                Pay via Paystack · {formatNGN(totals.totalPayable)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
