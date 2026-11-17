import {
  ArrowRight,
  Mic,
  RotateCcw,
  SlidersHorizontal,
  Store,
  UserPlus,
  X,
} from 'lucide-react';
import { DEMO_VOICE_TRANSCRIPTS } from '../data/mockMarketplace';
import type { AppRole, OrderStageId, PaymentOutcome } from '../types/chopwize';
import { formatNGN, ORDER_STAGES } from '../utils/pricing';

interface DemoControlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  roleLabel: AppRole;
  onChangeRole: (role: AppRole) => void;
  onOpenBecomeSeller: () => void;
  onReplayOnboarding: () => void;
  onSimulateFriendJoiningGroup?: () => void;
  paymentOutcome: PaymentOutcome;
  onChangePaymentOutcome: (outcome: PaymentOutcome) => void;
  walletBalance: number;
  onResetWallet: () => void;
  activeOrderStage: OrderStageId | null;
  onSetOrderStage: (stage: OrderStageId) => void;
  onSimulateVoicePrompt: (transcript: string) => void;
  onResetAllDemo: () => void;
}

export function DemoControlDrawer({
  isOpen,
  onClose,
  demoMode,
  onToggleDemoMode,
  roleLabel,
  onChangeRole,
  onOpenBecomeSeller,
  onReplayOnboarding,
  onSimulateFriendJoiningGroup,
  paymentOutcome,
  onChangePaymentOutcome,
  walletBalance,
  onResetWallet,
  activeOrderStage,
  onSetOrderStage,
  onSimulateVoicePrompt,
  onResetAllDemo,
}: DemoControlDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#FAF8F4]/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Chopwize Demo Control Drawer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white h-full flex flex-col border-l border-[#E5E7EB] shadow-xl">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
            <h2 className="font-display text-base font-extrabold text-[#111827]">
              DEMO Mode &amp; Controls
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Demo Control Drawer"
            className="w-9 h-9 rounded-xl hover:bg-[#FAF8F4] flex items-center justify-center text-[#111827] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* DEMO Mode Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#F4EFFF] border border-[#D0BCFC] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#111827]">Interactive DEMO Mode</div>
              <div className="text-[11px] text-[#6B7280]">
                Simulates Vendor Dashboard, voice queries &amp; Paystack outcomes
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={demoMode}
              onClick={onToggleDemoMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                demoMode
                  ? 'bg-[#A981FF] text-[#111827]'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              {demoMode ? 'Active' : 'Off'}
            </button>
          </div>

          {/* Role Switcher */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#6B7280]">Active Persona View</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Customer' as const, label: 'Customer' },
                { id: 'Seller' as const, label: 'Vendor' },
                { id: 'Rider' as const, label: 'Rider' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onChangeRole(r.id);
                    if (r.id !== 'Customer') onClose();
                  }}
                  className={`min-h-[40px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    roleLabel === r.id
                      ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBecomeSeller();
              }}
              className="w-full min-h-[38px] rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC]/50 border border-[#D0BCFC] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
              <span>Test &ldquo;Open Your Store&rdquo; Onboarding</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReplayOnboarding();
              }}
              className="w-full min-h-[38px] rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
              <span>Replay Customer Onboarding</span>
            </button>
            {onSimulateFriendJoiningGroup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSimulateFriendJoiningGroup();
                }}
                className="w-full min-h-[38px] rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                <span>Simulate Friend Joining Group Order</span>
              </button>
            )}
          </div>

          {/* Simulated Voice Transcripts */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280]">
              <Mic className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
              <span>Test Simulated Voice Queries</span>
            </div>
            <div className="space-y-1.5">
              {DEMO_VOICE_TRANSCRIPTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    onSimulateVoicePrompt(sample.transcript);
                    onClose();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-left flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111827]">{sample.label}</div>
                    <div className="text-[11px] text-[#6B7280] truncate">
                      &ldquo;{sample.transcript}&rdquo;
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6F42C1] shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Paystack Outcome Simulator */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#6B7280]">
              Simulated Paystack Outcome
            </div>
            <div className="space-y-2">
              {[
                { id: 'success' as const, label: 'Instant Success' },
                { id: 'pending' as const, label: 'Pending Verification' },
                { id: 'failed' as const, label: 'Simulate Failed Payment' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangePaymentOutcome(opt.id)}
                  className={`w-full min-h-[40px] px-3.5 rounded-xl text-left text-xs font-semibold border transition-colors cursor-pointer ${
                    paymentOutcome === opt.id
                      ? 'bg-[#F4EFFF] border-[#A981FF] text-[#111827]'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAF8F4]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food Budget Wallet */}
          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#6B7280]">Food Budget Wallet</div>
              <div className="font-mono tabular-nums text-base font-extrabold text-[#111827]">
                {formatNGN(walletBalance)}
              </div>
            </div>
            <button
              type="button"
              onClick={onResetWallet}
              className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F4EFFF] text-xs font-bold text-[#111827] cursor-pointer"
            >
              Top up ₦15,000
            </button>
          </div>

          {/* Live Order Stage Jumper */}
          {activeOrderStage && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#6B7280]">
                Jump Active Order Stage
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {ORDER_STAGES.map((stage, idx) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => onSetOrderStage(stage.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-left text-xs font-medium flex items-center justify-between border transition-colors cursor-pointer ${
                      activeOrderStage === stage.id
                        ? 'bg-[#A981FF] border-[#A981FF] text-[#111827] font-bold'
                        : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    <span>
                      {idx + 1}. {stage.label}
                    </span>
                    {activeOrderStage === stage.id && <span>Active</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => {
              onResetAllDemo();
              onClose();
            }}
            className="w-full min-h-[44px] rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC]/60 border border-[#D0BCFC] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
            Reset All Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
