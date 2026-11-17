import { ShoppingBag, SlidersHorizontal } from 'lucide-react';
import type { AppRole } from '../types/chopwize';

interface TopBarProps {
  roleLabel: AppRole;
  onOpenDemoDrawer: () => void;
  cartCount: number;
  onOpenTray: () => void;
  onGoHome: () => void;
}

export function TopBar({
  roleLabel,
  onOpenDemoDrawer,
  cartCount,
  onOpenTray,
  onGoHome,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#EBE6DF]">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Chopwize Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          aria-label="Chopwize Home"
          className="flex items-center gap-2 shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A981FF] cursor-pointer"
        >
          <img
            src="/assets/aistudio/Untitled_design_f4810031.jpeg"
            alt="Chopwize"
            className="w-7 h-7 rounded-lg object-contain bg-white border border-[#EBE6DF] p-0.5"
          />
          <span className="text-[16px] font-bold tracking-[-0.01em] text-[#111827] whitespace-nowrap">
            Chopwize
          </span>
        </button>

        {/* Right: Mobile Controls + Shopping Bag (Customer Mode Only) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDemoDrawer}
            aria-label="Open app controls"
            className="md:hidden w-9 h-9 rounded-full bg-white hover:bg-[#F4EFFF] border border-[#EBE6DF] text-[#111827] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          </button>

          {roleLabel === 'Customer' && (
            <button
              type="button"
              onClick={onOpenTray}
              aria-label={`Open tray with ${cartCount} items`}
              className="relative w-9 h-9 rounded-full bg-white hover:bg-[#F4EFFF] border border-[#EBE6DF] flex items-center justify-center text-[#111827] transition-colors cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A981FF] text-[#111827] tabular-nums text-[10px] font-bold flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
