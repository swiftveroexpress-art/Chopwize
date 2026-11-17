import { Compass, Home, Package, User } from 'lucide-react';
import type { MainTabId } from '../types/chopwize';

interface BottomTabBarProps {
  activeTab: MainTabId;
  onChangeTab: (tab: MainTabId) => void;
  activeOrdersCount: number;
}

export function BottomTabBar({
  activeTab,
  onChangeTab,
  activeOrdersCount,
}: BottomTabBarProps) {
  const tabs: Array<{
    id: MainTabId;
    label: string;
    icon: typeof Home;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[456px] z-30 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-full shadow-[0_8px_24px_rgba(17,24,39,0.08)] px-1.5 py-1"
    >
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer active:scale-[0.97] ${
                isActive
                  ? 'bg-[#F4EFFF] text-[#6F42C1] ring-1 ring-[#D0BCFC] font-semibold'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#FAF8F4] font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-[18px] h-[18px] ${isActive ? 'text-[#6F42C1]' : ''}`}
                  aria-hidden="true"
                />
                {tab.id === 'orders' && activeOrdersCount > 0 && (
                  <span
                    aria-label={`${activeOrdersCount} active order`}
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#A981FF] text-[#111827] border border-white text-[10px] font-bold flex items-center justify-center tabular-nums"
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight whitespace-nowrap leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
