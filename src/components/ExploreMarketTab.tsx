import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BadgePercent,
  Cake,
  ChevronDown,
  Clock,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Star,
  Tag,
  Truck,
  Users,
  X,
} from 'lucide-react';
import type {
  CategoryId,
  CultureId,
  CustomerAiRule,
  GroceryMeta,
  LocationZone,
  MarketplaceCategoryConfig,
  MenuItem,
  Vendor,
  VendorPromoCampaign,
} from '../types/chopwize';
import {
  formatNGN,
  getAllergyConflict,
  getEffectiveItemPrice,
} from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface ExploreMarketTabProps {
  vendors: Vendor[];
  categories: MarketplaceCategoryConfig[];
  selectedZone: LocationZone;
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  selectedCulture: CultureId | null;
  onSelectCulture: (culture: CultureId | null) => void;
  activeVendorId: string | null;
  onSelectVendor: (vendorId: string | null) => void;
  favoriteVendorIds: string[];
  onToggleFavoriteVendor: (vendorId: string) => void;
  aiRules: CustomerAiRule[];
  vendorPromos?: VendorPromoCampaign[];
  onSelectDish: (item: MenuItem, vendor: Vendor) => void;
  onOpenCustomCakeQuote: (vendor: Vendor) => void;
  onStartGroupOrder?: (vendorId: string) => void;
  onSubmitVendorReview?: (
    vendorId: string,
    review: { rating: number; comment: string; dishTag?: string }
  ) => void;
}

const MARKET_AISLES: NonNullable<GroceryMeta['aisle']>[] = [
  'Grains & Pasta',
  'Cooking Oils & Litre Measures',
  'Beverages & Fresh Juices',
  'Canned & Seasoning',
];

export function ExploreMarketTab({
  vendors,
  categories,
  selectedZone,
  selectedCategory,
  onSelectCategory,
  selectedCulture,
  onSelectCulture,
  activeVendorId,
  onSelectVendor,
  favoriteVendorIds,
  onToggleFavoriteVendor,
  aiRules,
  vendorPromos = [],
  onSelectDish,
  onOpenCustomCakeQuote,
  onStartGroupOrder,
  onSubmitVendorReview,
}: ExploreMarketTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSearchOpen, setStoreSearchOpen] = useState(false);
  const [storeInfoOpen, setStoreInfoOpen] = useState(false);
  const [activeStoreCategoryTab, setActiveStoreCategoryTab] = useState<string>('All');
  const [storeViewTab, setStoreViewTab] = useState<'menu' | 'reviews'>('menu');
  const [selectedAisleFilter, setSelectedAisleFilter] = useState<string>('All');
  const [collapsedAisles, setCollapsedAisles] = useState<Record<string, boolean>>({});

  // Review form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDishTag, setReviewDishTag] = useState('');

  const activeVendor = useMemo(
    () => vendors.find((v) => v.id === activeVendorId) ?? null,
    [vendors, activeVendorId]
  );

  // Detailed Seller Storefront Profile View
  if (activeVendor) {
    const isFav = favoriteVendorIds.includes(activeVendor.id);
    const storeTabs = [
      'All',
      ...Array.from(new Set(activeVendor.menu.map((m) => m.storeCategory))),
    ];
    const effectiveTab = storeTabs.includes(activeStoreCategoryTab)
      ? activeStoreCategoryTab
      : 'All';

    const storeMenu = activeVendor.menu.filter((item) => {
      if (effectiveTab !== 'All' && item.storeCategory !== effectiveTab) {
        return false;
      }
      const q = storeSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.storeCategory.toLowerCase().includes(q)
      );
    });

    const deliveryFrom = Math.max(700, selectedZone.deliveryFee - 500);
    const activePromosForStore = vendorPromos.filter(
      (p) => p.active && p.vendorId === activeVendor.id
    );

    return (
      <div className="space-y-4 pb-36 -mt-4">
        {/* Full-Bleed Cover Image with Overlapping Circular Store Logo */}
        <section className="-mx-4 bg-white border-b border-[#E5E7EB]">
          <div className="relative h-44 w-full bg-[#F4EFFF]">
            <SafeImage
              src={activeVendor.coverImageUrl}
              alt={activeVendor.name}
              fallbackLabel={activeVendor.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F4]/70 via-transparent to-white/30" />

            {/* Top Floating Controls */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStoreSearch('');
                  setStoreSearchOpen(false);
                  setStoreInfoOpen(false);
                  setStoreViewTab('menu');
                  setActiveStoreCategoryTab('All');
                  onSelectVendor(null);
                }}
                aria-label="Back to Explore"
                className="h-10 px-3.5 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-[#111827] text-xs font-bold inline-flex items-center gap-1.5 shadow-[0_6px_18px_rgba(17,24,39,0.08)] border border-[#E5E7EB] cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/95 backdrop-blur-md shadow-[0_6px_18px_rgba(17,24,39,0.08)] border border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setStoreSearchOpen((v) => !v)}
                  aria-label="Search inside store"
                  className="w-8 h-8 rounded-full hover:bg-[#F4EFFF] text-[#111827] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavoriteVendor(activeVendor.id)}
                  aria-label={
                    isFav
                      ? `Remove ${activeVendor.name} from favourites`
                      : `Add ${activeVendor.name} to favourites`
                  }
                  className="w-8 h-8 rounded-full hover:bg-[#F4EFFF] text-[#111827] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${isFav ? 'fill-[#A981FF] text-[#6F42C1]' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {/* Circular Store Logo overlapping bottom-left edge */}
            <div className="absolute -bottom-7 left-4">
              {activeVendor.logoPreviewUrl ? (
                <img
                  src={activeVendor.logoPreviewUrl}
                  alt={`${activeVendor.name} logo`}
                  className="w-16 h-16 rounded-full border-4 border-white object-cover bg-white shadow-sm"
                />
              ) : (
                <div
                  style={{ backgroundColor: activeVendor.accentBg }}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center font-display text-base font-extrabold text-[#111827] shadow-sm"
                >
                  {activeVendor.monogram}
                </div>
              )}
            </div>
          </div>

          {/* Store Header Info */}
          <div className="px-4 pt-9 pb-3.5 space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827]">
                      {activeVendor.name}
                    </h1>
                    {activeVendor.verified ? (
                      <BadgeCheck
                        className="w-4 h-4 text-[#16A34A] shrink-0"
                        aria-label="Verified Chopwize Seller"
                      />
                    ) : (
                      <ShieldAlert
                        className="w-4 h-4 text-[#D97706] shrink-0"
                        aria-label="Pending Verification"
                      />
                    )}
                  </div>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    {activeVendor.categoryLabel}
                  </p>
                </div>

                <button
                  type="button"
                  aria-expanded={storeInfoOpen}
                  onClick={() => setStoreInfoOpen((v) => !v)}
                  className="px-2.5 py-1.5 rounded-full bg-[#F4EFFF] hover:bg-[#D0BCFC] text-[#111827] text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                  <span>Info</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      storeInfoOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {onStartGroupOrder && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStartGroupOrder(activeVendor.id)}
                    className="px-3 py-1.5 rounded-full bg-[#F4EFFF] hover:bg-[#D0BCFC] border border-[#D0BCFC] text-[#6F42C1] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                    <span>Start Group Order</span>
                  </button>
                  <span className="text-[11px] text-[#6B7280]">
                    Share cart &amp; split 1 delivery fee
                  </span>
                </div>
              )}
            </div>

            {/* Clean 3-Column Metadata Strip */}
            <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] py-2.5 text-center">
              <div className="px-2">
                <div className="text-[10px] font-semibold text-[#6B7280]">
                  Delivery Fee
                </div>
                <div className="tabular-nums text-xs font-extrabold text-[#111827] mt-0.5">
                  From {formatNGN(deliveryFrom)}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] font-semibold text-[#6B7280]">
                  Prep Time
                </div>
                <div className="text-xs font-extrabold text-[#111827] mt-0.5">
                  {activeVendor.deliveryTimeRange}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[10px] font-semibold text-[#6B7280]">
                  Ratings
                </div>
                <div className="text-xs font-extrabold text-[#111827] mt-0.5 inline-flex items-center justify-center gap-0.5">
                  <Star className="w-3 h-3 fill-[#A981FF] text-[#6F42C1]" aria-hidden="true" />
                  <span>{activeVendor.rating.toFixed(1)}</span>
                  <span className="font-normal text-[#6B7280]">
                    ({activeVendor.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Active Vendor Campaigns Banner */}
            {activePromosForStore.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pt-0.5">
                {activePromosForStore.map((promo) => (
                  <div
                    key={promo.id}
                    className="shrink-0 max-w-[260px] rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] px-3 py-2 flex items-start gap-2"
                  >
                    <BadgePercent
                      className="w-4 h-4 text-[#6F42C1] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[#6F42C1] truncate">
                        {promo.title}
                      </div>
                      <div className="text-[10px] text-[#6B7280] line-clamp-1">
                        {promo.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Expandable Store Info Drawer */}
            {storeInfoOpen && (
              <div className="rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] p-3.5 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {activeVendor.verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
                      <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                      Verified Chopwize Seller
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold">
                      <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                      Pending Admin Verification
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[10px] font-semibold text-[#111827]">
                    <Truck className="w-3 h-3 text-[#6F42C1]" aria-hidden="true" />
                    {activeVendor.supportsDelivery && activeVendor.supportsPickup
                      ? 'Delivery & Pickup'
                      : activeVendor.supportsPickup
                        ? 'Store Pickup Only'
                        : 'Rider Delivery'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[10px] tabular-nums font-bold text-[#111827]">
                    Min Order {formatNGN(activeVendor.minOrderAmount)}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6F42C1] shrink-0" aria-hidden="true" />
                    <span>{activeVendor.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#6F42C1] shrink-0" aria-hidden="true" />
                    <span>
                      {activeVendor.operatingHours} · {activeVendor.prepCutOffNote}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E7EB] space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Recent Verified Review
                  </div>
                  <p className="text-[11px] italic text-[#111827]">
                    &ldquo;Neat tamper-proof packaging, generous portions, and exact heat level every time in Lekki.&rdquo; — Tolu O. (★ 5.0)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Storefront Switcher & Category Bar */}
          <div className="px-3 pb-3 pt-1 sticky top-[60px] z-20">
            <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E7EB] shadow-[0_8px_24px_rgba(17,24,39,0.06)] p-2 space-y-2">
              <div
                role="tablist"
                aria-label="Storefront sections"
                className="grid grid-cols-2 gap-1.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={storeViewTab === 'menu'}
                  onClick={() => setStoreViewTab('menu')}
                  className={`h-9 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    storeViewTab === 'menu'
                      ? 'bg-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] text-[#6B7280] hover:bg-[#F4EFFF] hover:text-[#111827]'
                  }`}
                >
                  Menu ({activeVendor.menu.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={storeViewTab === 'reviews'}
                  onClick={() => setStoreViewTab('reviews')}
                  className={`h-9 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    storeViewTab === 'reviews'
                      ? 'bg-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] text-[#6B7280] hover:bg-[#F4EFFF] hover:text-[#111827]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reviews &amp; Wall ({(activeVendor.reviews ?? []).length})</span>
                </button>
              </div>

              {storeViewTab === 'menu' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  {storeTabs.map((tabName) => {
                    const active = effectiveTab === tabName;
                    return (
                      <button
                        key={tabName}
                        type="button"
                        onClick={() => setActiveStoreCategoryTab(tabName)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#F4EFFF] text-[#6F42C1] border border-[#A981FF]'
                            : 'bg-[#FAF8F4] hover:bg-[#F4EFFF] text-[#6B7280] border border-[#E5E7EB]'
                        }`}
                      >
                        {tabName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {storeViewTab === 'reviews' ? (
          <section aria-label="Store Reviews and Community Wall" className="space-y-4">
            {/* Rating Summary */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-[#6F42C1]">
                  Verified Community Rating
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-display text-2xl font-extrabold text-[#111827]">
                    {activeVendor.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    out of 5.0 · {activeVendor.reviewCount} ratings
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(activeVendor.rating)
                        ? 'fill-[#A981FF] text-[#6F42C1]'
                        : 'text-[#E5E7EB]'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>

            {/* Write a Review Form */}
            {onSubmitVendorReview && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reviewComment.trim()) return;
                  onSubmitVendorReview(activeVendor.id, {
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                    dishTag: reviewDishTag.trim() || undefined,
                  });
                  setReviewComment('');
                  setReviewDishTag('');
                }}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3"
              >
                <div className="text-xs font-extrabold text-[#111827]">
                  Post on {activeVendor.name}&rsquo;s Community Wall
                </div>

                <div className="flex items-center gap-1.5" role="group" aria-label="Choose star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      aria-pressed={reviewRating === star}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                        star <= reviewRating
                          ? 'bg-[#F4EFFF] border-[#A981FF]'
                          : 'bg-[#FAF8F4] border-[#E5E7EB]'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= reviewRating
                            ? 'fill-[#A981FF] text-[#6F42C1]'
                            : 'text-[#9CA3AF]'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-[#6F42C1]">
                    {reviewRating}.0 / 5
                  </span>
                </div>

                <select
                  aria-label="Dish ordered"
                  value={reviewDishTag}
                  onChange={(e) => setReviewDishTag(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A981FF]"
                >
                  <option value="">Tag a dish (optional)</option>
                  {activeVendor.menu.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <div>
                  <label htmlFor="vendor-wall-comment" className="sr-only">
                    Share your review
                  </label>
                  <textarea
                    id="vendor-wall-comment"
                    required
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how the food, spice, or packaging arrived..."
                    className="w-full p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Post Review to Wall</span>
                </button>
              </form>
            )}

            {/* Existing Community Wall Reviews */}
            <div className="space-y-2.5">
              {(activeVendor.reviews ?? []).length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-center text-xs text-[#6B7280]">
                  No wall comments yet. Be the first verified Lekki customer to leave a review!
                </div>
              ) : (
                (activeVendor.reviews ?? []).map((rev) => (
                  <article
                    key={rev.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#111827]">
                          {rev.authorName}
                        </span>
                        {rev.verifiedBuyer && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#16A34A]">
                            <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B7280]">
                        {rev.createdAtLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="tabular-nums font-bold text-[#6F42C1]">
                        ★ {rev.rating.toFixed(1)}
                      </span>
                      {rev.dishTag && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#6B7280] truncate">
                            {rev.dishTag}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-[#111827] leading-relaxed">
                      {rev.comment}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Custom Birthday Cake CTA on Pastry & Bakery Storefronts */}
            {activeVendor.category === 'pastries' && (
              <div className="bg-[#F4EFFF] border border-[#D0BCFC] rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-white text-[#6F42C1] flex items-center justify-center shrink-0">
                    <Cake className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#111827]">
                      Custom Birthday Cakes
                    </div>
                    <div className="text-[11px] text-[#6B7280] truncate">
                      Request size, flavour &amp; custom inscription
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCustomCakeQuote(activeVendor)}
                  className="px-3 py-2 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  Request Quote
                </button>
              </div>
            )}

            {/* Expandable In-Store Search Bar */}
            {(storeSearchOpen || storeSearch.length > 0) && (
              <div className="relative">
                <label htmlFor="store-inner-search" className="sr-only">
                  Search inside {activeVendor.name}
                </label>
                <Search
                  className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="store-inner-search"
                  type="search"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder={`Search dishes or packs in ${activeVendor.name}...`}
                  className="w-full h-10 pl-10 pr-8 rounded-xl bg-white border border-[#E5E7EB] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#A981FF]"
                />
                {storeSearch && (
                  <button
                    type="button"
                    onClick={() => setStoreSearch('')}
                    aria-label="Clear store search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Scannable Store Menu Item Rows (Right-Side 96x96 Photo + Floating Add + Pill) */}
            <div className="space-y-3">
              {storeMenu.map((item) => {
                const conflict = getAllergyConflict(item, aiRules);
                const priceInfo = getEffectiveItemPrice(item, vendorPromos);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDish(item, activeVendor)}
                      className="min-w-0 flex-1 text-left space-y-1 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#6F42C1]">
                        {priceInfo.discountPercent > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold">
                            -{priceInfo.discountPercent}% OFF
                          </span>
                        )}
                        {item.isCombo && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] font-semibold">
                            Combo Deal
                          </span>
                        )}
                        <span>
                          {item.storeCategory} ·{' '}
                          {item.variants
                            ? `${item.variants.length} sizes/packs`
                            : `Per ${item.sellingUnit}`}
                        </span>
                      </div>
                      <h2 className="text-[15px] font-semibold leading-[1.35] text-[#111827]">
                        {item.name}
                      </h2>
                      <p className="text-[13px] font-normal leading-[1.45] text-[#6B7280] line-clamp-2">
                        {item.description}
                      </p>
                      {conflict && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B42318]">
                          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Shellfish warning</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="tabular-nums text-[14px] font-bold text-[#111827]">
                          {item.variants
                            ? `From ${formatNGN(priceInfo.finalPrice)}`
                            : formatNGN(priceInfo.finalPrice)}
                        </span>
                        {priceInfo.originalPrice &&
                          priceInfo.originalPrice > priceInfo.finalPrice && (
                            <span className="tabular-nums text-[13px] font-normal text-[#9CA3AF] line-through">
                              {formatNGN(priceInfo.originalPrice)}
                            </span>
                          )}
                        {item.groceryMeta && (
                          <span className="text-[11px] font-medium text-[#6B7280]">
                            ({item.groceryMeta.unitPriceLabel})
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Right-side 96x96 thumbnail with floating Add + pill */}
                    <div className="relative w-24 h-24 shrink-0">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.name}
                        fallbackLabel={item.name}
                        className="w-24 h-24 rounded-2xl object-cover border border-[#E5E7EB]"
                      />
                      <button
                        type="button"
                        onClick={() => onSelectDish(item, activeVendor)}
                        aria-label={`Add ${item.name}`}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 px-3 rounded-full bg-white hover:bg-[#A981FF] text-[#111827] border border-[#E5E7EB] shadow-sm text-[11px] font-extrabold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <span>Add</span>
                        <Plus className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Filtered Marketplace & Groceries Directory Feed
  const isMarketView = selectedCategory === 'groceries';

  const matchingVendors = vendors.filter((v) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      v.category === selectedCategory ||
      v.menu.some((m) => m.marketplaceCategory === selectedCategory);
    const matchesCulture =
      !selectedCulture || v.menu.some((m) => m.culture === selectedCulture);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.categoryLabel.toLowerCase().includes(q) ||
      v.menu.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    return matchesCategory && matchesCulture && matchesSearch;
  });

  const matchingItems: Array<{ item: MenuItem; vendor: Vendor }> = [];
  for (const v of matchingVendors) {
    for (const item of v.menu) {
      if (selectedCulture && item.culture !== selectedCulture) continue;
      if (
        selectedCategory !== 'all' &&
        item.marketplaceCategory !== selectedCategory
      ) {
        continue;
      }
      const q = searchQuery.trim().toLowerCase();
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !v.name.toLowerCase().includes(q)
      ) {
        continue;
      }
      matchingItems.push({ item, vendor: v });
    }
  }

  return (
    <div className="space-y-4 pb-36">
      {/* Unified Search Bar */}
      <div className="relative">
        <label htmlFor="explore-search-input" className="sr-only">
          Search dishes, restaurants, juices, or measured bulk items
        </label>
        <Search
          className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="explore-search-input"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search restaurants, juices, cakes, palm oil..."
          className="w-full h-11 pl-10 pr-9 rounded-2xl bg-white border border-[#E5E7EB] text-xs sm:text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#A981FF]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear explore search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dynamic Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all' as CategoryId, label: 'All' },
          ...categories.map((c) => ({ id: c.id as CategoryId, label: c.label })),
        ].map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectCategory(cat.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#A981FF] text-[#111827]'
                  : 'bg-white hover:bg-[#F4EFFF] text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Active Culture Filter Notice (only shown when pre-selected) */}
      {selectedCulture && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F4EFFF] text-xs font-semibold text-[#111827]">
          <span className="capitalize">Showing {selectedCulture} cuisine</span>
          <button
            type="button"
            onClick={() => onSelectCulture(null)}
            className="text-xs font-bold text-[#6F42C1] hover:underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Vendors Directory */}
      {!isMarketView && matchingVendors.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold text-[#111827]">
              Kitchens &amp; Sellers ({selectedZone.shortName})
            </h2>
            <span className="text-[11px] text-[#6B7280]">Tap store to browse</span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {matchingVendors.map((vendor) => {
              const isFav = favoriteVendorIds.includes(vendor.id);
              const storePromo = vendorPromos.find(
                (p) => p.active && p.vendorId === vendor.id
              );
              return (
                <div
                  key={vendor.id}
                  className="w-[225px] shrink-0 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#B796FE] overflow-hidden relative transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectVendor(vendor.id)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="h-24 w-full bg-[#F4EFFF] relative">
                      <SafeImage
                        src={vendor.coverImageUrl}
                        alt={vendor.name}
                        fallbackLabel={vendor.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E7EB] text-[#111827] text-[10px] font-semibold">
                        {vendor.deliveryTimeRange}
                      </div>
                      {!vendor.verified ? (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[9px] font-bold">
                          Pending Review
                        </div>
                      ) : (
                        storePromo && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 border border-[#D0BCFC] text-[#6F42C1] text-[9px] font-bold inline-flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                            <span>
                              {storePromo.type === 'free_delivery'
                                ? 'Free Delivery'
                                : storePromo.type === 'percentage_discount'
                                  ? `${storePromo.discountPercent ?? 10}% OFF`
                                  : 'Combo Deal'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center gap-1 pr-5">
                        <span className="font-display text-xs font-extrabold text-[#111827] truncate">
                          {vendor.name}
                        </span>
                        {vendor.verified && (
                          <BadgeCheck
                            className="w-3.5 h-3.5 text-[#16A34A] shrink-0"
                            aria-label="Verified"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#6B7280] truncate">
                        <Star className="w-3 h-3 fill-[#A981FF] text-[#6F42C1] shrink-0" aria-hidden="true" />
                        <span>{vendor.rating.toFixed(1)} ({vendor.reviewCount})</span>
                        <span aria-hidden="true">·</span>
                        <span className={vendor.isOpen ? 'text-[#16A34A] font-bold' : 'text-[#D97706]'}>
                          {vendor.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteVendor(vendor.id)}
                    aria-label={isFav ? `Unfavourite ${vendor.name}` : `Favourite ${vendor.name}`}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-[#111827] border border-[#E5E7EB] flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isFav ? 'fill-[#A981FF] text-[#6F42C1]' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Dish, Beverage, Pastry & Measured Item Cards OR Grouped Chopwize Market Aisles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold text-[#111827]">
            {isMarketView ? 'Chopwize Market Aisles' : 'Menu & Items'}
          </h2>
          <span className="text-[11px] text-[#6B7280] tabular-nums">
            {matchingItems.length} items
          </span>
        </div>

        {isMarketView && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', ...MARKET_AISLES].map((aisleName) => {
              const active = selectedAisleFilter === aisleName;
              return (
                <button
                  key={aisleName}
                  type="button"
                  onClick={() => setSelectedAisleFilter(aisleName)}
                  className={`min-h-[34px] px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#A981FF] text-[#111827]'
                      : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F4EFFF] hover:text-[#111827]'
                  }`}
                >
                  {aisleName}
                </button>
              );
            })}
          </div>
        )}

        {matchingItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center space-y-2">
            <p className="font-display text-sm font-bold text-[#111827]">
              No matching listings found
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('all');
                onSelectCulture(null);
              }}
              className="px-4 py-2 rounded-xl bg-[#A981FF] text-xs font-bold text-[#111827] cursor-pointer"
            >
              Reset Explore Filters
            </button>
          </div>
        ) : isMarketView ? (
          <div className="space-y-3">
            {MARKET_AISLES.filter(
              (aisle) => selectedAisleFilter === 'All' || selectedAisleFilter === aisle
            ).map((aisleName) => {
              const aisleItems = matchingItems.filter(
                ({ item }) =>
                  (item.groceryMeta?.aisle ?? 'Grains & Pasta') === aisleName
              );
              if (aisleItems.length === 0) return null;
              const isCollapsed = Boolean(collapsedAisles[aisleName]);
              return (
                <div
                  key={aisleName}
                  className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsedAisles((prev) => ({
                        ...prev,
                        [aisleName]: !prev[aisleName],
                      }))
                    }
                    className="w-full px-4 py-3 flex items-center justify-between gap-2 bg-[#FAF8F4] hover:bg-[#F4EFFF] border-b border-[#E5E7EB] text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-display text-xs font-extrabold text-[#111827]">
                        {aisleName}
                      </div>
                      <div className="text-[10px] text-[#6F42C1] font-semibold">
                        {aisleItems.length}{' '}
                        {aisleItems.length === 1 ? 'staple' : 'staples'}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-[#E5E7EB]">
                      {aisleItems.map(({ item, vendor }) => {
                        const priceInfo = getEffectiveItemPrice(item, vendorPromos);
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <button
                                type="button"
                                onClick={() => onSelectDish(item, vendor)}
                                className="text-left block w-full cursor-pointer"
                              >
                                <h3 className="font-display text-sm font-extrabold text-[#111827] leading-snug line-clamp-1">
                                  {item.name}
                                </h3>
                              </button>
                              <p className="text-[11px] text-[#6B7280] line-clamp-2">
                                {item.groceryMeta
                                  ? `${item.groceryMeta.packSize} · ${item.groceryMeta.unitPriceLabel}`
                                  : item.description}
                              </p>
                              <div className="flex items-baseline gap-2 pt-0.5">
                                <span className="tabular-nums text-sm font-extrabold text-[#111827]">
                                  {item.variants
                                    ? `From ${formatNGN(priceInfo.finalPrice)}`
                                    : formatNGN(priceInfo.finalPrice)}
                                </span>
                                {priceInfo.originalPrice &&
                                  priceInfo.originalPrice > priceInfo.finalPrice && (
                                    <span className="tabular-nums text-xs text-[#9CA3AF] line-through">
                                      {formatNGN(priceInfo.originalPrice)}
                                    </span>
                                  )}
                              </div>
                            </div>

                            <div className="relative w-20 h-20 shrink-0">
                              <SafeImage
                                src={item.imageUrl}
                                alt={item.name}
                                fallbackLabel={item.name}
                                className="w-20 h-20 rounded-xl object-cover border border-[#E5E7EB]"
                              />
                              <button
                                type="button"
                                onClick={() => onSelectDish(item, vendor)}
                                aria-label={`Add ${item.name}`}
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 px-2.5 rounded-full bg-white hover:bg-[#A981FF] text-[#111827] border border-[#E5E7EB] shadow-sm text-[11px] font-extrabold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors"
                              >
                                <span>Add</span>
                                <Plus className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {matchingItems.map(({ item, vendor }) => {
              const conflict = getAllergyConflict(item, aiRules);
              const priceInfo = getEffectiveItemPrice(item, vendorPromos);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    {priceInfo.discountPercent > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
                        -{priceInfo.discountPercent}% OFF
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectDish(item, vendor)}
                      className="text-left block w-full cursor-pointer"
                    >
                      <h3 className="text-[15px] font-semibold leading-[1.35] text-[#111827] line-clamp-1">
                        {item.name}
                      </h3>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectVendor(vendor.id)}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6F42C1] hover:underline cursor-pointer"
                    >
                      <span className="truncate">{vendor.name}</span>
                      {vendor.verified ? (
                        <BadgeCheck
                          className="w-3.5 h-3.5 text-[#16A34A] shrink-0"
                          aria-label="Verified"
                        />
                      ) : (
                        <span className="text-[11px] text-[#D97706] font-medium">
                          · Pending
                        </span>
                      )}
                    </button>

                    <p className="text-[13px] font-normal leading-[1.45] text-[#6B7280] line-clamp-2">
                      {item.groceryMeta
                        ? `${item.groceryMeta.packSize} · ${item.groceryMeta.unitPriceLabel}`
                        : item.description}
                    </p>

                    {conflict && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B42318]">
                        <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>Shellfish warning</span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="tabular-nums text-[14px] font-bold text-[#111827]">
                        {item.variants
                          ? `From ${formatNGN(priceInfo.finalPrice)}`
                          : formatNGN(priceInfo.finalPrice)}
                      </span>
                      {priceInfo.originalPrice &&
                        priceInfo.originalPrice > priceInfo.finalPrice && (
                          <span className="tabular-nums text-[13px] font-normal text-[#9CA3AF] line-through">
                            {formatNGN(priceInfo.originalPrice)}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="relative w-24 h-24 shrink-0">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackLabel={item.name}
                      className="w-24 h-24 rounded-xl object-cover border border-[#E5E7EB]"
                    />
                    <button
                      type="button"
                      onClick={() => onSelectDish(item, vendor)}
                      aria-label={`Add ${item.name}`}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 px-3 rounded-full bg-white hover:bg-[#A981FF] text-[#111827] border border-[#E5E7EB] shadow-sm text-[11px] font-extrabold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <span>Add</span>
                      <Plus className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
