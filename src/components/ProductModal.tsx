import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Cake,
  Check,
  Clock,
  Droplets,
  Flame,
  Minus,
  Plus,
  Scale,
  X,
} from 'lucide-react';
import type {
  CartItem,
  CartSelection,
  CustomerAiRule,
  MenuItem,
  OptionChoice,
  OptionGroup,
  ProductVariant,
  SelectedOptionChoice,
  Vendor,
  VendorPromoCampaign,
} from '../types/chopwize';
import {
  buildCartSelections,
  calculateUnitTotal,
  formatNGN,
  getAllergyConflict,
  getEffectiveItemPrice,
  getEffectiveStock,
  validateItemConfiguration,
} from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface ProductModalProps {
  item: MenuItem;
  vendor: Vendor;
  initialVariantId?: string;
  editingCartItem?: CartItem;
  aiRules: CustomerAiRule[];
  vendorPromos?: VendorPromoCampaign[];
  onClose: () => void;
  onOpenCustomCakeQuote?: (vendor: Vendor) => void;
  onAddToTray: (params: {
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
  }) => void;
}

export function ProductModal({
  item,
  vendor,
  initialVariantId,
  editingCartItem,
  aiRules,
  vendorPromos = [],
  onClose,
  onOpenCustomCakeQuote,
  onAddToTray,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(() => editingCartItem?.quantity ?? 1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    () => {
      if (editingCartItem?.selectedVariant) {
        return editingCartItem.selectedVariant.id;
      }
      if (initialVariantId && item.variants?.some((v) => v.id === initialVariantId)) {
        return initialVariantId;
      }
      return item.variants?.[0]?.id;
    }
  );
  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<string, SelectedOptionChoice[]>
  >(() => {
    if (!editingCartItem) return {};
    const init: Record<string, SelectedOptionChoice[]> = {};
    for (const sel of editingCartItem.selections) {
      init[sel.groupId] = sel.choices.map((c) => ({
        ...c,
        quantity: c.quantity ?? 1,
      }));
    }
    return init;
  });
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(
    () => editingCartItem?.removedIngredients ?? []
  );
  const [specialNote, setSpecialNote] = useState(
    () => editingCartItem?.specialNote ?? ''
  );
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedVariant = item.variants?.find((v) => v.id === selectedVariantId);
  const effectiveStock = getEffectiveStock(item, selectedVariant);
  const isOutOfStock = effectiveStock !== null && effectiveStock <= 0;

  const rawUnitBase = selectedVariant ? selectedVariant.price : item.basePrice;
  const effectivePricing = getEffectiveItemPrice(item, vendorPromos, rawUnitBase);

  const unitTotal = calculateUnitTotal(
    effectivePricing.finalPrice,
    selectedByGroup,
    undefined
  );
  const grandLineTotal = unitTotal * quantity;
  const validation = validateItemConfiguration(item, selectedByGroup);
  const allergyConflict = getAllergyConflict(item, aiRules);

  function toggleChoice(group: OptionGroup, choice: OptionChoice) {
    setShowValidationError(false);
    setSelectedByGroup((prev) => {
      const current = prev[group.id] ?? [];
      const existing = current.find((c) => c.id === choice.id);

      if (group.maxSelect === 1) {
        return {
          ...prev,
          [group.id]: [{ ...choice, quantity: 1 }],
        };
      }

      if (existing) {
        return {
          ...prev,
          [group.id]: current.filter((c) => c.id !== choice.id),
        };
      }

      const currentTotalCount = current.reduce(
        (sum, c) => sum + Math.max(1, c.quantity ?? 1),
        0
      );
      if (currentTotalCount >= group.maxSelect) {
        return {
          ...prev,
          [group.id]: [...current.slice(1), { ...choice, quantity: 1 }],
        };
      }

      return {
        ...prev,
        [group.id]: [...current, { ...choice, quantity: 1 }],
      };
    });
  }

  function stepChoiceQuantity(
    group: OptionGroup,
    choice: OptionChoice,
    delta: number
  ) {
    setShowValidationError(false);
    setSelectedByGroup((prev) => {
      const current = prev[group.id] ?? [];
      const existing = current.find((c) => c.id === choice.id);
      const currentQty = existing?.quantity ?? 0;
      const nextQty = currentQty + delta;

      if (nextQty <= 0) {
        return {
          ...prev,
          [group.id]: current.filter((c) => c.id !== choice.id),
        };
      }

      const otherCount = current
        .filter((c) => c.id !== choice.id)
        .reduce((sum, c) => sum + Math.max(1, c.quantity ?? 1), 0);

      if (otherCount + nextQty > group.maxSelect) {
        return prev;
      }

      if (existing) {
        return {
          ...prev,
          [group.id]: current.map((c) =>
            c.id === choice.id ? { ...c, quantity: nextQty } : c
          ),
        };
      }

      return {
        ...prev,
        [group.id]: [...current, { ...choice, quantity: nextQty }],
      };
    });
  }

  function toggleRemovableIngredient(tag: string) {
    setRemovedIngredients((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSmartAdd() {
    if (isOutOfStock) return;
    if (!validation.isValid) {
      setShowValidationError(true);
      return;
    }

    const combinedNoteParts: string[] = [];
    if (removedIngredients.length > 0 && !editingCartItem) {
      combinedNoteParts.push(removedIngredients.join(', '));
    }
    if (specialNote.trim()) {
      combinedNoteParts.push(specialNote.trim());
    }

    onAddToTray({
      item,
      vendor,
      selectedVariant,
      removedIngredients:
        removedIngredients.length > 0 ? removedIngredients : undefined,
      quantity,
      selections: buildCartSelections(item, selectedByGroup),
      unitPrice: unitTotal,
      specialNote: combinedNoteParts.join(' · ') || undefined,
      replaceCartItemId: editingCartItem?.cartItemId,
      packLabel: editingCartItem?.packLabel,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] max-h-[90vh] bg-white rounded-t-3xl border-t border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Image */}
        <div className="relative h-44 w-full bg-[#F4EFFF] shrink-0">
          <SafeImage
            src={item.imageUrl}
            alt={item.name}
            fallbackLabel={item.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dish configurator"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-[#E5E7EB] text-[#111827] flex items-center justify-center shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          {editingCartItem && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] text-[11px] font-semibold">
              Editing {editingCartItem.packLabel ?? 'Pack 1'}
            </span>
          )}
          {effectivePricing.discountPercent > 0 && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-[#A981FF] text-[#111827] text-[11px] font-bold shadow-xs">
              {effectivePricing.discountPercent}% OFF · {effectivePricing.promoLabel}
            </span>
          )}
        </div>

        {/* Scrollable Adaptive Details & Configuration Groups */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="text-[12px] font-medium text-[#6F42C1]">
              {vendor.name} ·{' '}
              {selectedVariant
                ? selectedVariant.label
                : `Per ${item.sellingUnit}`}
              {item.groceryMeta ? ` (${item.groceryMeta.packSize})` : ''}
            </div>
            <div className="flex items-start justify-between gap-3">
              <h2
                id="product-modal-title"
                className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827]"
              >
                {item.name}
              </h2>
              <div className="text-right shrink-0">
                <div className="tabular-nums text-[16px] font-bold text-[#111827]">
                  {formatNGN(effectivePricing.finalPrice)}
                </div>
                {effectivePricing.originalPrice &&
                  effectivePricing.originalPrice > effectivePricing.finalPrice && (
                    <div className="tabular-nums text-[13px] font-normal text-[#9CA3AF] line-through">
                      {formatNGN(effectivePricing.originalPrice)}
                    </div>
                  )}
              </div>
            </div>
            <p className="text-[13px] font-normal leading-[1.45] text-[#6B7280]">
              {item.description}
            </p>
            {item.dietaryTags && item.dietaryTags.length > 0 && (
              <div className="text-[12px] font-medium text-[#6B7280] pt-0.5">
                {item.dietaryTags.join(' · ')}
              </div>
            )}
          </div>

          {allergyConflict && (
            <div
              role="note"
              className="p-3 rounded-2xl bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318] flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {allergyConflict}. Confirm before ordering or ask kitchen to omit shellfish.
              </span>
            </div>
          )}

          {/* Adaptive Category Metadata Panels */}
          {item.juiceMeta && (
            <div className="rounded-2xl bg-[#F4EFFF] border border-[#D0BCFC] p-3.5 space-y-2 text-xs text-[#111827]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#6F42C1]">
                  <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{item.juiceMeta.freshnessStatus}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#111827]">
                  {item.juiceMeta.addedSugar ? 'Lightly Sweetened' : 'No Added Sugar'}
                </span>
              </div>
              <div className="text-[11px]">
                <strong>Ingredients:</strong> {item.juiceMeta.ingredients.join(', ')}
              </div>
              <div className="text-[11px] text-[#6B7280]">
                <strong>Storage:</strong> {item.juiceMeta.storageNote}
              </div>
            </div>
          )}

          {item.pastryMeta && (
            <div className="rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] p-3.5 space-y-2 text-xs text-[#111827]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#6F42C1]">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{item.pastryMeta.prepLeadTime}</span>
                </span>
                {item.pastryMeta.supportsPreOrder && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D0BCFC] text-[#111827] text-[10px] font-bold">
                    Pre-order Ready
                  </span>
                )}
              </div>
              {item.pastryMeta.allowsCustomCakeQuote && onOpenCustomCakeQuote && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomCakeQuote(vendor);
                  }}
                  className="w-full h-9 rounded-xl bg-white hover:bg-[#F4EFFF] border border-[#D0BCFC] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cake className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                  <span>Request Custom Birthday Cake Quote</span>
                </button>
              )}
            </div>
          )}

          {item.grillMeta && (
            <div className="rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] p-3 flex items-center gap-2 text-xs text-[#111827]">
              <Flame className="w-4 h-4 text-[#6F42C1] shrink-0" aria-hidden="true" />
              <span>{item.grillMeta.collectionWindow}</span>
            </div>
          )}

          {item.measuredMeta && (
            <div className="rounded-2xl bg-[#F4EFFF] border border-[#D0BCFC] p-3 flex items-center justify-between gap-2 text-xs text-[#111827]">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <Scale className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                <span>Measured by {item.measuredMeta.unitType}</span>
              </span>
              {effectiveStock !== null && (
                <span className="font-mono tabular-nums text-[11px] font-bold text-[#16A34A]">
                  {effectiveStock} in stock
                </span>
              )}
            </div>
          )}

          {/* Adaptive Variants / Sizes / Packs / Litres Selector */}
          {item.variants && item.variants.length > 0 && (
            <fieldset className="rounded-2xl border border-[#E5E7EB] bg-[#FAF8F4] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <legend className="font-display text-xs font-extrabold text-[#111827]">
                  {item.measuredMeta
                    ? 'Select Measured Size'
                    : item.marketplaceCategory === 'drinks'
                      ? 'Select Volume / Pack Size'
                      : item.marketplaceCategory === 'grill'
                        ? 'Select Portion / Platter'
                        : 'Select Pack / Quantity Option'}
                </legend>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-extrabold uppercase">
                  Required
                </span>
              </div>

              <div className="space-y-1.5">
                {item.variants.map((variant) => {
                  const checked = selectedVariant?.id === variant.id;
                  const out = variant.stockCount <= 0;
                  const variantPromo = getEffectiveItemPrice(
                    item,
                    vendorPromos,
                    variant.price
                  );
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={out}
                      role="radio"
                      aria-checked={checked}
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        if (quantity > variant.stockCount) {
                          setQuantity(Math.max(1, variant.stockCount));
                        }
                      }}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl border text-left text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        checked
                          ? 'bg-white border-[#A981FF] text-[#111827] font-bold ring-1 ring-[#A981FF]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#D0BCFC] text-[#111827]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate">{variant.label}</div>
                        <div className="text-[10px] text-[#6B7280] font-medium">
                          {variant.unitNote ? `${variant.unitNote} · ` : ''}
                          {out ? 'Out of stock' : `${variant.stockCount} available`}
                        </div>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <span className="font-mono tabular-nums text-xs font-extrabold text-[#111827]">
                          {formatNGN(variantPromo.finalPrice)}
                        </span>
                        {variantPromo.discountPercent > 0 && (
                          <span className="block font-mono tabular-nums text-[10px] text-[#9CA3AF] line-through">
                            {formatNGN(variant.price)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Option / Modifier Groups with Inline - 1 + Steppers on Multi-Select Extras */}
          {item.optionGroups.map((group) => {
            const selected = selectedByGroup[group.id] ?? [];
            const selectedTotalCount = selected.reduce(
              (sum, c) => sum + Math.max(1, c.quantity ?? 1),
              0
            );
            const isSatisfied =
              !group.required || selectedTotalCount >= Math.max(1, group.minSelect);
            const hasError = showValidationError && !isSatisfied;
            const supportsStepper = !group.required && group.maxSelect > 1;

            return (
              <fieldset
                key={group.id}
                className={`rounded-2xl border p-3.5 space-y-2.5 ${
                  hasError
                    ? 'border-[#B42318] bg-[#FEF3F2]'
                    : 'border-[#E5E7EB] bg-[#FAF8F4]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <legend className="font-display text-xs font-extrabold text-[#111827]">
                    {group.title}
                  </legend>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tabular-nums inline-flex items-center gap-1 ${
                      isSatisfied && group.required
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : hasError
                          ? 'bg-[#FEE4E2] text-[#B42318]'
                          : 'bg-[#F4EFFF] text-[#6F42C1]'
                    }`}
                  >
                    {isSatisfied && group.required && (
                      <Check className="w-3 h-3" aria-hidden="true" />
                    )}
                    {group.required
                      ? `REQUIRED • ${selectedTotalCount}/${Math.max(1, group.minSelect)}`
                      : `SELECT UP TO ${group.maxSelect}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.choices.map((choice) => {
                    const matched = selected.find((c) => c.id === choice.id);
                    const choiceQty = matched?.quantity ?? 0;
                    const checked = choiceQty > 0;

                    if (supportsStepper) {
                      return (
                        <div
                          key={choice.id}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-colors ${
                            checked
                              ? 'bg-white border-[#A981FF] text-[#111827] font-bold ring-1 ring-[#A981FF]'
                              : 'bg-white border-[#E5E7EB] text-[#111827]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              checked
                                ? stepChoiceQuantity(group, choice, -choiceQty)
                                : stepChoiceQuantity(group, choice, 1)
                            }
                            className="min-w-0 flex-1 text-left flex items-center justify-between gap-2 pr-2 cursor-pointer"
                          >
                            <span className="truncate">{choice.name}</span>
                            <span className="font-mono tabular-nums text-[11px] font-bold text-[#6B7280] shrink-0">
                              {choice.priceDelta > 0
                                ? `+${formatNGN(choice.priceDelta)}`
                                : '+₦0'}
                            </span>
                          </button>

                          {checked ? (
                            <div className="flex items-center border border-[#D0BCFC] rounded-lg bg-[#F4EFFF] h-7 shrink-0">
                              <button
                                type="button"
                                onClick={() => stepChoiceQuantity(group, choice, -1)}
                                aria-label={`Decrease ${choice.name}`}
                                className="w-7 h-full flex items-center justify-center text-[#111827] cursor-pointer"
                              >
                                <Minus className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <span className="w-5 text-center font-mono tabular-nums text-xs font-extrabold text-[#111827]">
                                {choiceQty}
                              </span>
                              <button
                                type="button"
                                disabled={selectedTotalCount >= group.maxSelect}
                                onClick={() => stepChoiceQuantity(group, choice, 1)}
                                aria-label={`Increase ${choice.name}`}
                                className="w-7 h-full flex items-center justify-center text-[#111827] disabled:opacity-35 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={selectedTotalCount >= group.maxSelect}
                              onClick={() => stepChoiceQuantity(group, choice, 1)}
                              aria-label={`Add ${choice.name}`}
                              className="w-7 h-7 rounded-lg bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] flex items-center justify-center text-[#111827] disabled:opacity-35 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        role={group.maxSelect === 1 ? 'radio' : 'checkbox'}
                        aria-checked={checked}
                        onClick={() => toggleChoice(group, choice)}
                        className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                          checked
                            ? 'bg-white border-[#A981FF] text-[#111827] font-bold ring-1 ring-[#A981FF]'
                            : 'bg-white border-[#E5E7EB] hover:border-[#D0BCFC] text-[#111827]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4 h-4 shrink-0 flex items-center justify-center border ${
                              group.maxSelect === 1 ? 'rounded-full' : 'rounded-md'
                            } ${
                              checked
                                ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                                : 'border-[#D1D5DB] bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" aria-hidden="true" />}
                          </span>
                          <span className="truncate">{choice.name}</span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] font-semibold text-[#6B7280] ml-2 shrink-0">
                          {choice.priceDelta > 0
                            ? `+${formatNGN(choice.priceDelta)}`
                            : '+₦0'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {/* Remove Ingredients Toggles */}
          {item.removableIngredients && item.removableIngredients.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#111827]">
                Remove Ingredients (Optional)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.removableIngredients.map((tag) => {
                  const active = removedIngredients.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleRemovableIngredient(tag)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#A981FF] text-[#111827] font-bold'
                          : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#111827] hover:bg-[#F4EFFF]'
                      }`}
                    >
                      {active ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Kitchen Note */}
          <div>
            <label
              htmlFor="kitchen-special-note"
              className="block text-xs font-bold text-[#111827] mb-1"
            >
              Special Kitchen / Packing Note (Optional)
            </label>
            <input
              id="kitchen-special-note"
              type="text"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder="e.g. Extra pepper sauce on the side please"
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          {showValidationError && !validation.isValid && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Please complete required group:{' '}
                <strong>{validation.missingGroupTitles.join(', ')}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center border border-[#E5E7EB] rounded-xl bg-[#FAF8F4] h-11">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="w-10 h-full flex items-center justify-center text-[#111827] hover:bg-[#F4EFFF] rounded-l-xl cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="w-8 text-center font-mono tabular-nums text-xs font-extrabold text-[#111827]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) =>
                  effectiveStock !== null ? Math.min(effectiveStock, q + 1) : q + 1
                )
              }
              aria-label="Increase quantity"
              className="w-10 h-full flex items-center justify-center text-[#111827] hover:bg-[#F4EFFF] rounded-r-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleSmartAdd}
            className="flex-1 h-11 px-4 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] disabled:opacity-50 text-[#111827] font-semibold text-[14px] transition-colors flex items-center justify-between cursor-pointer"
          >
            <span>
              {isOutOfStock
                ? 'Out of Stock'
                : editingCartItem
                  ? 'Save Changes'
                  : 'Add'}
            </span>
            <span className="tabular-nums font-bold">{formatNGN(grandLineTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
