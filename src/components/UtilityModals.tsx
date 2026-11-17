import { useState } from 'react';
import {
  AlertTriangle,
  ChefHat,
  Dices,
  RotateCcw,
  ShoppingBasket,
  X,
} from 'lucide-react';
import type { MenuItem, Vendor } from '../types/chopwize';
import { rollSurpriseMeal } from '../utils/aiRecommender';
import { formatNGN } from '../utils/pricing';
import { SafeImage } from './SafeImage';

export function CookingAssistantModal({
  isOpen,
  onClose,
  onAddMissingGroceries,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddMissingGroceries: () => void;
}) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([
    'Rice',
    'Pepper',
  ]);

  if (!isOpen) return null;

  const ingredients = ['Rice', 'Pepper', 'Yam', 'Palm Oil', 'Spaghetti', 'Onions'];

  function toggleIngredient(ing: string) {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  }

  const recipeTitle = selectedIngredients.includes('Spaghetti')
    ? 'Smoky Nigerian Jollof Spaghetti'
    : selectedIngredients.includes('Yam')
      ? 'Asaro (Yam Porridge) with Pepper Sauce'
      : 'Quick Lagos One-Pot Jollof Rice';

  const missingItems = selectedIngredients.includes('Palm Oil')
    ? ['Fresh Tatashe & Scotch Bonnet Pack']
    : ['Golden Flower Cooking Oil (1L)', 'Fresh Tatashe & Red Onion Pack'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cooking Assistant"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl border-t border-[#E5E7EB] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#6F42C1]" aria-hidden="true" />
            <h2 className="font-display text-base font-extrabold text-[#111827]">
              Chopwize Cooking Assistant
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cooking Assistant"
            className="p-1 text-[#6B7280] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-[#6B7280]">
            Tap ingredients you currently have at home:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((ing) => {
              const active = selectedIngredients.includes(ing);
              return (
                <button
                  key={ing}
                  type="button"
                  onClick={() => toggleIngredient(ing)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                    active
                      ? 'bg-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#111827]'
                  }`}
                >
                  {ing}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] p-4 space-y-2">
          <div className="text-[11px] font-bold text-[#6F42C1]">
            Suggested Recipe Match
          </div>
          <div className="font-display text-sm font-extrabold text-[#111827]">
            {recipeTitle}
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Blend fresh tatashe, scotch bonnet, and red onions, sear in oil for 10 mins, then simmer with stock until smoky and rich.
          </p>
          <div className="pt-1 text-[11px] font-semibold text-[#111827]">
            Missing Market Items: {missingItems.join(' + ')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onAddMissingGroceries();
            onClose();
          }}
          className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBasket className="w-4 h-4" aria-hidden="true" />
          <span>Shop Missing Items in Ebeano Market</span>
        </button>
      </div>
    </div>
  );
}

export function SurpriseMeModal({
  isOpen,
  onClose,
  vendors,
  excludeShellfish,
  onSelectDish,
}: {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  excludeShellfish: boolean;
  onSelectDish: (item: MenuItem, vendor: Vendor) => void;
}) {
  const [budget, setBudget] = useState(5000);
  const [spice, setSpice] = useState<'Mild' | 'Medium' | 'Lagos Hot'>('Lagos Hot');
  const [rollSeed, setRollSeed] = useState(0);

  if (!isOpen) return null;

  const pick = rollSurpriseMeal(vendors, budget, spice, excludeShellfish, rollSeed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Instant Surprise Me Meal Dice"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl border-t border-[#E5E7EB] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-[#6F42C1]" aria-hidden="true" />
            <h2 className="font-display text-base font-extrabold text-[#111827]">
              Instant Surprise Me
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Surprise Me modal"
            className="p-1 text-[#6B7280] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#111827]">
            <span>Max Dish Budget</span>
            <span className="font-mono tabular-nums">{formatNGN(budget)}</span>
          </div>
          <input
            type="range"
            min={3600}
            max={8000}
            step={200}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            aria-label="Surprise meal maximum budget"
            className="w-full accent-[#A981FF]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-bold text-[#111827]">Spice Tolerance</div>
          <div className="grid grid-cols-3 gap-2">
            {(['Mild', 'Medium', 'Lagos Hot'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSpice(level)}
                className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  spice === level
                    ? 'bg-[#A981FF] text-[#111827]'
                    : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#111827]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {pick ? (
          <div className="rounded-2xl bg-[#FAF8F4] border border-[#D0BCFC] p-3 flex items-center gap-3">
            <SafeImage
              src={pick.item.imageUrl}
              alt={pick.item.name}
              fallbackLabel={pick.item.name}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-[#6F42C1] truncate">
                {pick.reason}
              </div>
              <div className="text-xs font-extrabold text-[#111827] truncate">
                {pick.item.name}
              </div>
              <div className="text-[11px] text-[#6B7280]">
                {pick.vendor.name} · <strong className="font-mono tabular-nums text-[#111827]">{formatNGN(pick.item.basePrice)}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#FAF8F4] text-xs text-[#6B7280]">
            No safe match under {formatNGN(budget)} for {spice}. Increase budget slightly!
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRollSeed((s) => s + 1)}
            className="flex-1 h-11 rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC]/50 text-[#6F42C1] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Roll Again</span>
          </button>
          {pick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectDish(pick.item, pick.vendor);
              }}
              className="flex-1 h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold cursor-pointer"
            >
              Order This Pick
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VendorSwitchModal({
  currentVendorName,
  newVendorName,
  onCancel,
  onConfirmReplace,
}: {
  currentVendorName: string;
  newVendorName: string;
  onCancel: () => void;
  onConfirmReplace: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Single-Vendor Tray Confirmation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl border-t border-[#E5E7EB] p-5 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-base font-extrabold text-[#111827]">
              Start a new tray from {newVendorName}?
            </h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Your tray currently holds items from <strong className="text-[#111827]">{currentVendorName}</strong>. Chopwize trays are single-vendor so a single rider delivers your meal piping hot without extra stops.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-bold text-[#111827] cursor-pointer"
          >
            Keep Current Tray
          </button>
          <button
            type="button"
            onClick={onConfirmReplace}
            className="flex-1 h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold cursor-pointer"
          >
            Replace Tray
          </button>
        </div>
      </div>
    </div>
  );
}
