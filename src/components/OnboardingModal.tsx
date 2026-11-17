import { useState } from 'react';
import { UtensilsCrossed, X } from 'lucide-react';
import { NIGERIAN_STATES } from '../data/mockMarketplace';
import type { IndigenousFrequency, UserProfile } from '../types/chopwize';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onSkip: () => void;
}

const FREQUENCY_OPTIONS: Array<{
  value: IndigenousFrequency;
  label: string;
  hint: string;
}> = [
  {
    value: 'Occasionally',
    label: 'Occasionally',
    hint: 'Balanced Nigerian heritage picks alongside daily favourites',
  },
  {
    value: 'Weekly',
    label: 'Weekly',
    hint: 'Boost authentic home-state dishes in weekly suggestions',
  },
  {
    value: 'Only when I ask',
    label: 'Only when I ask',
    hint: 'Show indigenous matches only when explicitly requested',
  },
];

export function OnboardingModal({
  isOpen,
  initialProfile,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const [name, setName] = useState(initialProfile.name);
  const [contact, setContact] = useState(initialProfile.contact);
  const [stateOfOrigin, setStateOfOrigin] = useState(initialProfile.stateOfOrigin);
  const [indigenousFrequency, setIndigenousFrequency] = useState<IndigenousFrequency>(
    initialProfile.indigenousFrequency
  );

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onComplete({
      name: name.trim() || 'Amina Bello',
      contact: contact.trim() || '+234 803 555 1290',
      stateOfOrigin: stateOfOrigin.trim(),
      indigenousFrequency,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F4]/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-heading"
    >
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#F4EFFF] via-[#FAF8F4] to-white border-b border-[#E5E7EB] text-[#111827] px-5 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#A981FF] text-[#111827] flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="onboarding-heading"
                className="font-display text-base font-extrabold text-[#111827]"
              >
                Welcome to Chopwize
              </h2>
              <p className="text-[11px] font-medium text-[#6F42C1]">
                Personalize your intelligent Nigerian food companion
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSkip}
            aria-label="Skip onboarding"
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] text-xs font-bold text-[#111827] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="onboard-name"
              className="block text-xs font-bold text-[#111827]"
            >
              Your Name
            </label>
            <input
              id="onboard-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amina Bello"
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="onboard-contact"
              className="block text-xs font-bold text-[#111827]"
            >
              Phone Number or Email
            </label>
            <input
              id="onboard-contact"
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+234 803 555 1290 or amina@lagosmail.ng"
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="onboard-state"
              className="block text-xs font-bold text-[#111827]"
            >
              State of Origin{' '}
              <span className="font-normal text-[#6B7280]">(Optional)</span>
            </label>
            <select
              id="onboard-state"
              value={stateOfOrigin}
              onChange={(e) => setStateOfOrigin(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A981FF]"
            >
              <option value="">Prefer not to say</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#111827]">
              How often should Chopwize suggest indigenous meals?
            </div>
            <div className="space-y-1.5" role="radiogroup" aria-label="Indigenous suggestion frequency">
              {FREQUENCY_OPTIONS.map((opt) => {
                const active = indigenousFrequency === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setIndigenousFrequency(opt.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F4EFFF] border-[#A981FF] text-[#111827]'
                        : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827] hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{opt.label}</div>
                    <div className="text-[10px] text-[#6B7280]">{opt.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onSkip}
              className="h-11 px-4 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-xs font-bold text-[#111827] cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-xs font-extrabold text-[#111827] cursor-pointer"
            >
              Save &amp; Start Chopping
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
