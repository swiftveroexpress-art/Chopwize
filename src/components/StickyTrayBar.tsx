import { ArrowRight, ShoppingBag } from 'lucide-react';
import { formatNGN } from '../utils/pricing';

interface StickyTrayBarProps {
  itemCount: number;
  itemsSubtotal: number;
  onOpenTray: () => void;
}

export function StickyTrayBar({
  itemCount,
  itemsSubtotal,
  onOpenTray,
}: StickyTrayBarProps) {
  if (itemCount <= 0) return null;

  return (
    <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[456px] z-30 pointer-events-none">
      <button
        type="button"
        onClick={onOpenTray}
        className="pointer-events-auto w-full h-12 px-4 rounded-2xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] border border-[#9668FB]/30 shadow-[0_8px_24px_rgba(169,129,255,0.28)] flex items-center justify-between gap-2 transition-transform active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-white text-[#6F42C1] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="text-[14px] font-bold truncate tabular-nums">
            View Tray ({itemCount} {itemCount === 1 ? 'item' : 'items'}) · {formatNGN(itemsSubtotal)}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#111827] bg-white/75 px-2.5 py-1 rounded-xl shrink-0">
          Checkout
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
