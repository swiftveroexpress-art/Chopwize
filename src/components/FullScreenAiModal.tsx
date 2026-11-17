import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BadgeCheck,
  Clock,
  Mic,
  Star,
  Store,
  X,
} from 'lucide-react';
import { DEMO_VOICE_TRANSCRIPTS } from '../data/mockMarketplace';
import type {
  CustomerAiRule,
  MenuItem,
  MonthlyBudgetConfig,
  ProductVariant,
  TemporaryAiRequest,
  UserProfile,
  Vendor,
} from '../types/chopwize';
import {
  type ComparativeAiCard,
  getComparativeAiRecommendations,
} from '../utils/aiRecommender';
import { calculateBudgetMetrics, formatNGN } from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface FullScreenAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  budgetConfig: MonthlyBudgetConfig;
  vendors: Vendor[];
  aiRules: CustomerAiRule[];
  temporaryRequests: TemporaryAiRequest[];
  onToggleTemporaryRequest: (id: string) => void;
  initialPrompt: string;
  startInVoiceMode?: boolean;
  onPromptChange: (val: string) => void;
  onSelectDish: (item: MenuItem, vendor: Vendor, variantId?: string) => void;
  onSelectVendor: (vendorId: string) => void;
  onAddBundleAndPay: (card: ComparativeAiCard) => void;
}

const QUICK_SUGGESTIONS = [
  'Smoky party jollof with grilled turkey under ₦5,000',
  'Amala or Jollof under ₦4,000',
  'Wood-fired suya pizza or grill tonight',
  'Fresh cold-pressed juice near me',
];

export function FullScreenAiModal({
  isOpen,
  onClose,
  userProfile,
  budgetConfig,
  vendors,
  aiRules,
  temporaryRequests,
  onToggleTemporaryRequest,
  initialPrompt,
  startInVoiceMode = false,
  onPromptChange,
  onSelectDish,
  onSelectVendor,
  onAddBundleAndPay,
}: FullScreenAiModalProps) {
  const [query, setQuery] = useState(initialPrompt || '');
  const [submittedQuery, setSubmittedQuery] = useState(initialPrompt || '');
  const [listening, setListening] = useState(startInVoiceMode);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialPrompt);
    setSubmittedQuery(initialPrompt);
    setListening(startInVoiceMode);
    if (!startInVoiceMode) {
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [isOpen, initialPrompt, startInVoiceMode]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const budgetMetrics = useMemo(
    () => calculateBudgetMetrics(budgetConfig),
    [budgetConfig]
  );

  const comparativeCards = useMemo(
    () =>
      getComparativeAiRecommendations({
        vendors,
        prompt: query.trim() || 'popular Nigerian meal',
        rules: aiRules,
        temporaryRequests,
        safeDailySpend: budgetMetrics.safeDailySpend,
        stateOfOrigin: userProfile.stateOfOrigin,
        indigenousFrequency: userProfile.indigenousFrequency,
      }),
    [
      vendors,
      query,
      aiRules,
      temporaryRequests,
      budgetMetrics.safeDailySpend,
      userProfile.stateOfOrigin,
      userProfile.indigenousFrequency,
    ]
  );

  if (!isOpen) return null;

  const firstName = userProfile.name.trim().split(/\s+/)[0] || 'Amina';

  function handleApplyPrompt(nextQuery: string) {
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery.trim());
    onPromptChange(nextQuery);
    setListening(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF8F4]/95 md:bg-[#FAF8F4]/80 md:backdrop-blur-sm flex justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-ai-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] h-[100dvh] md:h-[calc(100dvh-2rem)] md:my-4 md:rounded-[28px] md:border md:border-[#E5E7EB] bg-[#FAF8F4] text-[#111827] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar (Strict Light Mode, Wallet Line Removed) */}
        <div className="px-4 pt-4 pb-3 bg-white flex items-center justify-between gap-2 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/aistudio/Untitled_design_f4810031.jpeg"
              alt=""
              className="w-8 h-8 rounded-xl object-contain bg-white border border-[#E5E7EB] p-0.5 shrink-0"
            />
            <div className="text-[15px] font-bold text-[#111827] truncate">
              Chopwize Assistant
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Chopwize Assistant"
            className="w-10 h-10 rounded-full bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Mobile-First Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4">
          {/* Personalized Greeting */}
          <div className="space-y-1">
            <h2
              id="fullscreen-ai-title"
              className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827] text-balance"
            >
              Good morning, {firstName}! How are you feeling today?
            </h2>
            <p className="text-xs text-[#6B7280]">
              Type or speak a craving, budget, or area in Lagos — press Enter to send.
            </p>
          </div>

          {/* Search & Voice Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyPrompt(query);
            }}
            className="bg-white rounded-2xl border border-[#D0BCFC] p-2.5 space-y-2 text-[#111827] shadow-xs"
          >
            <div className="flex items-start gap-2">
              <label htmlFor="fullscreen-ai-input" className="sr-only">
                Ask Chopwize what you want to eat
              </label>
              <textarea
                ref={inputRef}
                id="fullscreen-ai-input"
                rows={2}
                enterKeyHint="send"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onPromptChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleApplyPrompt(query);
                  }
                }}
                placeholder="e.g. Smoky jollof with grilled turkey under ₦5,000"
                className="flex-1 min-w-0 px-1.5 py-1 text-xs sm:text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] bg-transparent focus:outline-none resize-none"
              />
              <button
                type="button"
                onClick={() => setListening((v) => !v)}
                aria-pressed={listening}
                aria-label="Toggle voice input"
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  listening
                    ? 'bg-[#A981FF] text-[#111827]'
                    : 'bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827]'
                }`}
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {listening && (
              <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-2">
                <div className="text-[11px] font-bold text-[#111827]">
                  Listening — tap a phrase or speak:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_VOICE_TRANSCRIPTS.slice(0, 3).map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleApplyPrompt(sample.transcript)}
                      className="px-2.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#A981FF] text-[11px] font-semibold text-[#111827] cursor-pointer"
                    >
                      &ldquo;{sample.label}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E5E7EB]">
              <div className="min-w-0">
                {submittedQuery ? (
                  <span className="text-[11px] font-medium text-[#6F42C1] truncate block">
                    Showing picks for &ldquo;{submittedQuery}&rdquo;
                  </span>
                ) : (
                  <span className="text-[11px] text-[#9CA3AF]">
                    Press Enter to ask Chopwize
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => handleApplyPrompt('')}
                    className="h-9 px-3 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#111827] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Ask</span>
                  <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Suggestions & Today Only Toggles */}
          <div className="space-y-2.5">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {QUICK_SUGGESTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleApplyPrompt(chip)}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[11px] font-semibold text-[#111827] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {chip.length > 38 ? `${chip.slice(0, 36)}...` : chip}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#6F42C1]">
                Today only:
              </span>
              {temporaryRequests.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  aria-pressed={req.active}
                  onClick={() => onToggleTemporaryRequest(req.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                    req.active
                      ? 'bg-[#A981FF] text-[#111827] font-bold'
                      : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F4EFFF]'
                  }`}
                >
                  {req.active ? `✓ ${req.label}` : req.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparative Nearby Store Cards */}
          <section aria-label="Nearby store options" className="space-y-2.5 pb-4">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-display font-extrabold text-[#111827]">
                Nearby options
              </h3>
              <span className="text-[11px] font-medium text-[#6F42C1]">
                {comparativeCards.length} verified stores
              </span>
            </div>

            {comparativeCards.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E5E7EB] text-[#111827] p-5 text-center space-y-2.5">
                <p className="text-xs font-bold">
                  No open stores matched that budget or filter.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplyPrompt('Amala or Jollof under ₦5,000')}
                  className="px-4 py-2 rounded-xl bg-[#A981FF] text-xs font-extrabold text-[#111827] cursor-pointer"
                >
                  Show picks under ₦5,000
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {comparativeCards.map((card) => (
                  <ComparativeStoreCard
                    key={card.id}
                    card={card}
                    onCustomize={(variant) => {
                      onClose();
                      onSelectDish(card.item, card.vendor, variant?.id);
                    }}
                    onVisitStore={() => {
                      onClose();
                      onSelectVendor(card.vendor.id);
                    }}
                    onAddBundleAndPay={() => {
                      onClose();
                      onAddBundleAndPay(card);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ComparativeStoreCard({
  card,
  onCustomize,
  onVisitStore,
  onAddBundleAndPay,
}: {
  card: ComparativeAiCard;
  onCustomize: (variant?: ProductVariant) => void;
  onVisitStore: () => void;
  onAddBundleAndPay: () => void;
}) {
  return (
    <article className="bg-white text-[#111827] rounded-2xl p-3.5 space-y-3 border border-[#E5E7EB]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F42C1]">
            <span>{card.highlightBadge}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#6B7280]">
              {card.withinDailySafeSpend ? 'Within daily budget' : 'Above daily budget'}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <h4 className="font-display text-sm font-extrabold text-[#111827] truncate">
              {card.vendor.name}
            </h4>
            {card.vendor.verified && (
              <BadgeCheck
                className="w-3.5 h-3.5 text-[#16A34A] shrink-0"
                aria-label="Verified Seller"
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
            <span className="inline-flex items-center gap-0.5 font-bold text-[#111827]">
              <Star className="w-3 h-3 fill-[#A981FF] text-[#6F42C1]" aria-hidden="true" />
              {card.rating.toFixed(1)} ({card.reviewCount})
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#6F42C1]" aria-hidden="true" />
              {card.deliveryRange}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="tabular-nums text-[14px] font-bold text-[#111827]">
            {formatNGN(card.displayPrice)}
          </div>
          <div className="text-[11px] font-medium text-[#6B7280]">
            {card.matchedVariant ? card.matchedVariant.label : card.item.sellingUnit}
          </div>
        </div>
      </div>

      {/* Dish Row */}
      <button
        type="button"
        onClick={() => onCustomize(card.matchedVariant)}
        className="w-full p-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] flex items-center gap-2.5 text-left transition-colors cursor-pointer"
      >
        <SafeImage
          src={card.item.imageUrl}
          alt={card.item.name}
          fallbackLabel={card.item.name}
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-extrabold text-[#111827] line-clamp-1">
            {card.item.name}
          </div>
          <div className="text-[11px] text-[#6B7280] line-clamp-1">
            {card.reason}
          </div>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddBundleAndPay}
          className="flex-1 h-10 px-3 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
        >
          Add Bundle &amp; Pay
        </button>
        <button
          type="button"
          onClick={() => onCustomize(card.matchedVariant)}
          className="h-10 px-3 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          Customize
        </button>
        <button
          type="button"
          onClick={onVisitStore}
          aria-label={`Visit ${card.vendor.name}`}
          className="h-10 w-10 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <Store className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
