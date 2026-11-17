import { useState } from 'react';
import {
  ArrowUp,
  BadgeCheck,
  ChefHat,
  ChevronDown,
  Clock,
  Dices,
  Heart,
  MapPin,
  Mic,
  Star,
} from 'lucide-react';
import { CATEGORY_COVER_DEFAULTS, LAGOS_ZONES } from '../data/mockMarketplace';
import type {
  CategoryId,
  CustomerAiRule,
  LocationZone,
  MealTimetableSlot,
  MenuItem,
  SavedAddress,
  TemporaryAiRequest,
  Vendor,
} from '../types/chopwize';
import { formatNGN, getAllergyConflict, getStartingPrice } from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface HomeAiTabProps {
  vendors: Vendor[];
  addresses: SavedAddress[];
  selectedZone: LocationZone;
  onSelectZone: (zoneId: string) => void;
  aiRules: CustomerAiRule[];
  temporaryRequests: TemporaryAiRequest[];
  onToggleTemporaryRequest: (id: string) => void;
  aiPrompt: string;
  onAiPromptChange: (val: string) => void;
  recentlyViewedIds: string[];
  favoriteVendorIds: string[];
  onToggleFavoriteVendor: (vendorId: string) => void;
  lunchSlot?: MealTimetableSlot;
  onSelectCategoryShortcut: (category: CategoryId) => void;
  onExploreAll: () => void;
  onOpenMarket: () => void;
  onOpenCookingAssistant: () => void;
  onOpenSurpriseDice: () => void;
  onSelectDish: (item: MenuItem, vendor: Vendor, initialVariantId?: string) => void;
  onSelectVendor: (vendorId: string) => void;
  userName?: string;
  onOpenFullScreenAi: (voiceMode?: boolean, initialPromptOverride?: string) => void;
}

const HOME_AI_CHIPS = [
  'Find food under ₦4,000',
  'Fresh juice near me',
  '5L palm oil',
  'What can I cook?',
  'Visitors this weekend',
];

export function HomeAiTab({
  vendors,
  addresses,
  selectedZone,
  onSelectZone,
  aiRules,
  temporaryRequests,
  onToggleTemporaryRequest,
  aiPrompt,
  onAiPromptChange,
  recentlyViewedIds,
  favoriteVendorIds,
  onToggleFavoriteVendor,
  lunchSlot,
  onSelectCategoryShortcut,
  onExploreAll,
  onOpenMarket,
  onOpenCookingAssistant,
  onOpenSurpriseDice,
  onSelectDish,
  onSelectVendor,
  userName = 'Amina Bello',
  onOpenFullScreenAi,
}: HomeAiTabProps) {
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

  const activeAddress =
    addresses.find((a) => a.zoneId === selectedZone.id) ?? addresses[0];

  const recentlyViewedItems: Array<{ item: MenuItem; vendor: Vendor }> = [];
  for (const id of recentlyViewedIds) {
    for (const v of vendors) {
      const found = v.menu.find((m) => m.id === id);
      if (found) {
        recentlyViewedItems.push({ item: found, vendor: v });
        break;
      }
    }
  }

  const amalaVendor = vendors.find((v) => v.id === 'bukka-hut');
  const amalaItem = amalaVendor?.menu.find((m) => m.id === 'bh-amala-abula');
  const firstName = userName.trim().split(/\s+/)[0] || 'Amina';

  const categoryPhotoTiles: Array<{
    id: Exclude<CategoryId, 'all'>;
    label: string;
    imageUrl: string;
    onClick: () => void;
  }> = [
    {
      id: 'restaurants',
      label: 'Restaurants',
      imageUrl: CATEGORY_COVER_DEFAULTS.restaurants,
      onClick: () => onSelectCategoryShortcut('restaurants'),
    },
    {
      id: 'groceries',
      label: 'Chopwize Market',
      imageUrl: CATEGORY_COVER_DEFAULTS.groceries,
      onClick: onOpenMarket,
    },
    {
      id: 'pastries',
      label: 'Pastries & Cakes',
      imageUrl: CATEGORY_COVER_DEFAULTS.pastries,
      onClick: () => onSelectCategoryShortcut('pastries'),
    },
    {
      id: 'drinks',
      label: 'Fresh Juices',
      imageUrl: CATEGORY_COVER_DEFAULTS.drinks,
      onClick: () => onSelectCategoryShortcut('drinks'),
    },
    {
      id: 'grill',
      label: 'Grill & Suya',
      imageUrl: CATEGORY_COVER_DEFAULTS.grill,
      onClick: () => onSelectCategoryShortcut('grill'),
    },
    {
      id: 'measured',
      label: 'Litre & Measured',
      imageUrl: CATEGORY_COVER_DEFAULTS.measured,
      onClick: () => onSelectCategoryShortcut('measured'),
    },
  ];

  return (
    <div className="space-y-6 pb-36">
      {/* 1. Clean Delivery Address Selector (Notification Bell Removed) */}
      <section aria-label="Delivery address" className="relative">
        <button
          type="button"
          onClick={() => setAddressMenuOpen((o) => !o)}
          aria-expanded={addressMenuOpen}
          aria-label="Select delivery address"
          className="w-full flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded-xl hover:bg-white transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold text-[#111827] truncate">
              {activeAddress?.street ?? '25 Gbenga Lawal St, Lekki Phase 1'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" aria-hidden="true" />
        </button>

        {/* Inline Lagos Delivery Address / Zone Selector */}
        {addressMenuOpen && (
          <div className="mt-2 bg-white rounded-xl border border-[#E5E7EB] p-2 space-y-1 z-20">
            <div className="px-2.5 pt-1 text-[11px] font-semibold text-[#6B7280]">
              Delivering in Lagos
            </div>
            {addresses.map((addr) => {
              const zone = LAGOS_ZONES.find((z) => z.id === addr.zoneId);
              const selected = selectedZone.id === addr.zoneId;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => {
                    onSelectZone(addr.zoneId);
                    setAddressMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#F4EFFF] font-bold text-[#111827]'
                      : 'hover:bg-[#FAF8F4] text-[#111827]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{addr.street}</div>
                    <div className="text-[11px] text-[#6B7280]">
                      {addr.label} · {zone?.label}
                    </div>
                  </div>
                  {zone && (
                    <span className="font-mono tabular-nums text-[11px] font-bold text-[#6F42C1] shrink-0">
                      {formatNGN(zone.deliveryFee)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Chopwize AI Hero Card (Strict Light Mode, Wallet Line Removed) */}
      <section
        aria-labelledby="ai-hero-heading"
        onClick={() => onOpenFullScreenAi(false)}
        className="bg-gradient-to-br from-[#F4EFFF] via-white to-[#FAF8F4] text-[#111827] rounded-2xl p-4 sm:p-5 space-y-4 border border-[#D0BCFC] shadow-[0_6px_20px_rgba(169,129,255,0.12)] cursor-pointer transition-colors hover:border-[#A981FF]"
      >
        <div className="inline-flex items-center gap-2 min-w-0">
          <img
            src="/assets/aistudio/Untitled_design_f4810031.jpeg"
            alt=""
            className="w-6 h-6 rounded-lg object-contain bg-white border border-[#E5E7EB] p-0.5 shrink-0"
          />
          <span className="text-[13px] font-bold tracking-tight text-[#6F42C1] whitespace-nowrap">
            Chopwize AI
          </span>
        </div>

        <h1
          id="ai-hero-heading"
          className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827] text-balance"
        >
          Good morning, {firstName}! How are you feeling today?
        </h1>

        {/* Input Trigger Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenFullScreenAi(false, aiPrompt.trim() || undefined);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] focus-within:border-[#A981FF] rounded-full p-1.5 pl-4 shadow-2xs"
        >
          <label htmlFor="chopwize-ai-input" className="sr-only">
            Ask Chopwize what you want to eat
          </label>
          <input
            id="chopwize-ai-input"
            type="text"
            enterKeyHint="send"
            value={aiPrompt}
            onFocus={() => onOpenFullScreenAi(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onOpenFullScreenAi(false, aiPrompt.trim() || undefined);
              }
            }}
            onChange={(e) => {
              onAiPromptChange(e.target.value);
              onOpenFullScreenAi(false, e.target.value);
            }}
            placeholder="Ask for a dish, budget, or craving..."
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFullScreenAi(true);
            }}
            aria-label="Speak your craving"
            className="w-9 h-9 rounded-full bg-[#F4EFFF] hover:bg-[#D0BCFC] flex items-center justify-center text-[#6F42C1] shrink-0 transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFullScreenAi(false, aiPrompt.trim() || undefined);
            }}
            className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-extrabold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <span>Ask</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>

        {/* Quick Tap Prompt Chips */}
        <div
          className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
          role="group"
          aria-label="Quick meal prompts"
        >
          {HOME_AI_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (chip === 'What can I cook?') {
                  onOpenCookingAssistant();
                } else {
                  onAiPromptChange(chip);
                  onOpenFullScreenAi(false, chip);
                }
              }}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[11px] font-semibold text-[#111827] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Today Only Session Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-semibold text-[#6F42C1] mr-0.5">
            Today only:
          </span>
          {temporaryRequests.map((req) => (
            <button
              key={req.id}
              type="button"
              aria-pressed={req.active}
              onClick={(e) => {
                e.stopPropagation();
                onToggleTemporaryRequest(req.id);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                req.active
                  ? 'bg-[#A981FF] text-[#111827] font-bold'
                  : 'bg-white hover:bg-[#F4EFFF] text-[#6B7280] border border-[#E5E7EB]'
              }`}
            >
              {req.active ? `✓ ${req.label}` : req.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Meal Timetable Reminder Card */}
      {(!lunchSlot || lunchSlot.reminderEnabled) && (
        <section
          aria-label="Lunch reminder"
          className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <div className="inline-flex items-center gap-1.5 font-semibold text-[#6F42C1]">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{lunchSlot?.timeLabel ?? '1:00 PM'} Lunch Plan</span>
            </div>
            <span className="text-[12px] font-medium text-[#6B7280] tabular-nums">
              {formatNGN(lunchSlot?.budgetCap ?? 4500)} cap
            </span>
          </div>

          {snoozed ? (
            <div className="flex items-center justify-between gap-3 py-0.5">
              <p className="text-xs text-[#6B7280]">
                Snoozed for 15 mins · Next reminder at 1:15 PM.
              </p>
              <button
                type="button"
                onClick={() => setSnoozed(false)}
                className="text-xs font-bold text-[#6F42C1] hover:underline shrink-0 cursor-pointer"
              >
                Undo
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[#111827] truncate">
                  {lunchSlot?.plannedDish ?? 'Hot Oyo Amala with Abula'}
                </div>
                <div className="text-[11px] text-[#6B7280] truncate">
                  {lunchSlot?.vendorName ?? 'Bukka Hut (Lekki Phase 1)'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (amalaItem && amalaVendor) {
                      onSelectDish(amalaItem, amalaVendor);
                    }
                  }}
                  className="h-9 px-3 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Order
                </button>
                <button
                  type="button"
                  onClick={() => setSnoozed(true)}
                  className="h-9 px-3 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Snooze
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. Explore Marketplace (Real Food & Grocery Photography Grid with Light Frosted Labels) */}
      <section aria-labelledby="visual-categories-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="visual-categories-heading"
            className="text-[16px] font-bold tracking-[-0.01em] leading-[1.3] text-[#111827]"
          >
            Explore Marketplace
          </h2>
          <button
            type="button"
            onClick={onExploreAll}
            className="text-[13px] font-semibold text-[#6F42C1] hover:underline cursor-pointer"
          >
            See all
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {categoryPhotoTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={tile.onClick}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-[#E5E7EB] hover:border-[#A981FF] bg-[#F4EFFF] text-left cursor-pointer transition-all active:scale-[0.98]"
            >
              <SafeImage
                src={tile.imageUrl}
                alt={tile.label}
                fallbackLabel={tile.label}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="absolute inset-x-1.5 bottom-1.5 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-xs border border-[#E5E7EB]/80 text-[10px] font-bold text-[#111827] leading-tight truncate">
                {tile.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Featured Kitchens & Stores */}
      <section aria-labelledby="featured-stores-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="featured-stores-heading"
            className="text-[16px] font-bold tracking-[-0.01em] leading-[1.3] text-[#111827]"
          >
            Featured nearby
          </h2>
          <span className="text-[12px] font-medium text-[#6B7280] tabular-nums">
            {selectedZone.shortName}
          </span>
        </div>

        <div className="space-y-3">
          {vendors.slice(0, 6).map((vendor) => {
            const isFav = favoriteVendorIds.includes(vendor.id);
            const startingDelivery = Math.max(700, selectedZone.deliveryFee - 500);
            return (
              <article
                key={vendor.id}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden relative transition-colors hover:border-[#D0BCFC]"
              >
                <button
                  type="button"
                  onClick={() => onSelectVendor(vendor.id)}
                  className="w-full text-left cursor-pointer block"
                >
                  <div className="aspect-[16/9] w-full bg-[#F4EFFF] relative overflow-hidden">
                    <SafeImage
                      src={vendor.coverImageUrl}
                      alt={vendor.name}
                      fallbackLabel={vendor.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E7EB] text-[#111827] text-[11px] font-bold shadow-2xs">
                      {vendor.deliveryTimeRange}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-[15px] font-semibold leading-[1.35] text-[#111827] truncate">
                          {vendor.name}
                        </h3>
                        {vendor.verified ? (
                          <BadgeCheck
                            className="w-4 h-4 text-[#16A34A] shrink-0"
                            aria-label="Verified Seller"
                          />
                        ) : (
                          <span className="text-[11px] font-medium text-[#D97706] shrink-0">
                            · Pending review
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] font-semibold text-[#6F42C1] shrink-0">
                        Menu
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] truncate">
                      <span className="tabular-nums">From {formatNGN(startingDelivery)}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          vendor.isOpen ? 'text-[#16A34A]' : 'text-[#D97706]'
                        }`}
                      >
                        {vendor.isOpen ? 'Open' : 'Closed'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#111827] tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#A981FF] text-[#6F42C1]" aria-hidden="true" />
                        {vendor.rating.toFixed(1)}
                      </span>
                      <span className="text-[#9CA3AF] tabular-nums">
                        ({vendor.reviewCount.toLocaleString('en-NG')})
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFavoriteVendor(vendor.id)}
                  aria-label={
                    isFav
                      ? `Remove ${vendor.name} from favourites`
                      : `Save ${vendor.name} to favourites`
                  }
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-[#111827] border border-[#E5E7EB]/70 flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${isFav ? 'fill-[#A981FF] text-[#6F42C1]' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* 6. Recently Viewed Strip */}
      {recentlyViewedItems.length > 0 && (
        <section aria-labelledby="recently-viewed-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              id="recently-viewed-heading"
              className="text-[16px] font-bold tracking-[-0.01em] leading-[1.3] text-[#111827]"
            >
              Recently viewed
            </h2>
            <span className="text-[12px] font-medium text-[#6B7280]">Tap to order</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {recentlyViewedItems.map(({ item, vendor }) => {
              const conflict = getAllergyConflict(item, aiRules);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectDish(item, vendor)}
                  className="w-[172px] shrink-0 bg-white hover:border-[#B796FE] rounded-xl border border-[#E5E7EB] p-2.5 text-left space-y-2 transition-colors cursor-pointer"
                >
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    fallbackLabel={item.name}
                    className="w-full h-24 rounded-lg object-cover"
                  />
                  <div className="space-y-0.5">
                    <div className="text-[15px] font-semibold leading-[1.35] text-[#111827] line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-[12px] font-medium text-[#6B7280] truncate">
                      {vendor.name}
                    </div>
                    {conflict && (
                      <div className="text-[11px] font-semibold text-[#B42318]">
                        Shellfish alert
                      </div>
                    )}
                    <div className="tabular-nums text-[14px] font-bold text-[#111827] pt-0.5">
                      {item.variants
                        ? `From ${formatNGN(getStartingPrice(item))}`
                        : formatNGN(item.basePrice)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Cooking & Surprise Tools */}
      <section aria-label="Quick food tools" className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenCookingAssistant}
          className="bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] rounded-xl p-3.5 text-left space-y-2 cursor-pointer transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
            <ChefHat className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <div className="font-display text-xs font-extrabold text-[#111827]">
              What can I cook?
            </div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">
              Match pantry items to Lagos recipes
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSurpriseDice}
          className="bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] rounded-xl p-3.5 text-left space-y-2 cursor-pointer transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
            <Dices className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <div className="font-display text-xs font-extrabold text-[#111827]">
              Surprise me
            </div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">
              Pick a dish by spice and budget
            </div>
          </div>
        </button>
      </section>
    </div>
  );
}
