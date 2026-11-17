import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgePercent,
  Bike,
  Brain,
  Cake,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Gift,
  HelpCircle,
  ListChecks,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import {
  DEMO_ACCOUNTS,
  INITIAL_SHOPPING_LIST,
  INITIAL_VOUCHERS,
  LAGOS_ZONES,
  NIGERIAN_STATES,
} from '../data/mockMarketplace';
import type {
  AuthUser,
  CustomerAiRule,
  CustomCakeQuote,
  FoodMemoryEntry,
  GroupOrderSession,
  IndigenousFrequency,
  MealTimetableSlot,
  MonthlyBudgetConfig,
  SavedAddress,
  ShoppingListItem,
  SupportTicket,
  SurpriseConfig,
  TemporaryAiRequest,
  UserProfile,
} from '../types/chopwize';
import { calculateBudgetMetrics, formatNGN } from '../utils/pricing';

interface FoodMemoryTabProps {
  walletBalance: number;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  budgetConfig: MonthlyBudgetConfig;
  onUpdateMonthlyBudget: (newBudget: number) => void;
  groupOrder: GroupOrderSession;
  onStartGroupOrderFromProfile: () => void;
  onReplayOnboarding: () => void;
  memories: FoodMemoryEntry[];
  onConfirmMemory: (id: string) => void;
  onDeleteMemory: (id: string) => void;
  onAddMemory: (entry: Omit<FoodMemoryEntry, 'id'>) => void;
  aiRules: CustomerAiRule[];
  onToggleRule: (id: string) => void;
  onUpdateRule: (
    id: string,
    patch: Pick<CustomerAiRule, 'title' | 'description' | 'ruleType'>
  ) => void;
  onDeleteRule: (id: string) => void;
  onAddRule: (rule: Omit<CustomerAiRule, 'id'>) => void;
  temporaryRequests: TemporaryAiRequest[];
  onToggleTemporaryRequest: (id: string) => void;
  cakeQuotes: CustomCakeQuote[];
  timetableSlots: MealTimetableSlot[];
  onToggleTimetableSlot: (id: string) => void;
  surpriseConfig: SurpriseConfig;
  onUpdateSurpriseConfig: (cfg: SurpriseConfig) => void;
  addresses: SavedAddress[];
  selectedZoneId: string;
  onSelectAddressZone: (zoneId: string) => void;
  tickets: SupportTicket[];
  onOpenBecomeSeller: () => void;
  onOpenSellerDashboard: () => void;
  onOpenMarketVendor: (vendorId: string) => void;
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onSwitchDemoRole: (account: AuthUser) => void;
  onSignOut: () => void;
  onNotify: (msg: string) => void;
}

type ProfileDetailSection =
  | 'overview'
  | 'profile_details'
  | 'addresses'
  | 'memory_rules'
  | 'timetable'
  | 'surprise'
  | 'referrals'
  | 'vouchers'
  | 'shopping_lists'
  | 'help_support'
  | 'legal';

export function FoodMemoryTab({
  walletBalance,
  userProfile,
  onUpdateUserProfile,
  budgetConfig,
  onUpdateMonthlyBudget,
  groupOrder,
  onStartGroupOrderFromProfile,
  onReplayOnboarding,
  memories,
  onConfirmMemory,
  onDeleteMemory,
  onAddMemory,
  aiRules,
  onToggleRule,
  onUpdateRule,
  onDeleteRule,
  onAddRule,
  temporaryRequests,
  onToggleTemporaryRequest,
  cakeQuotes,
  timetableSlots,
  onToggleTimetableSlot,
  surpriseConfig,
  onUpdateSurpriseConfig,
  addresses,
  selectedZoneId,
  onSelectAddressZone,
  tickets,
  onOpenBecomeSeller,
  onOpenSellerDashboard,
  onOpenMarketVendor,
  currentUser,
  onOpenAuthModal,
  onSwitchDemoRole,
  onSignOut,
  onNotify,
}: FoodMemoryTabProps) {
  const [section, setSection] = useState<ProfileDetailSection>('overview');
  const [walletExpanded, setWalletExpanded] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(
    String(budgetConfig.monthlyBudget)
  );

  // Editable Profile Form State
  const [draftName, setDraftName] = useState(userProfile.name);
  const [draftContact, setDraftContact] = useState(userProfile.contact);
  const [draftState, setDraftState] = useState(userProfile.stateOfOrigin);
  const [draftFreq, setDraftFreq] = useState<IndigenousFrequency>(
    userProfile.indigenousFrequency
  );

  useEffect(() => {
    setDraftName(userProfile.name);
    setDraftContact(userProfile.contact);
    setDraftState(userProfile.stateOfOrigin);
    setDraftFreq(userProfile.indigenousFrequency);
  }, [userProfile]);

  useEffect(() => {
    setBudgetInput(String(budgetConfig.monthlyBudget));
  }, [budgetConfig.monthlyBudget]);

  const budgetMetrics = useMemo(
    () => calculateBudgetMetrics(budgetConfig),
    [budgetConfig]
  );

  const initials = useMemo(() => {
    const parts = userProfile.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CW';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [userProfile.name]);

  const firstName = userProfile.name.trim().split(/\s+/)[0] || 'Amina';

  // Food Memory & Rules Form State
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleType, setNewRuleType] = useState<CustomerAiRule['ruleType']>('budget');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<CustomerAiRule['ruleType']>('budget');

  // Interactive Shopping Lists & Vouchers State
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(
    INITIAL_SHOPPING_LIST
  );
  const [newShoppingText, setNewShoppingText] = useState('');
  const [claimedVoucherCodes, setClaimedVoucherCodes] = useState<string[]>(['CHOP500']);

  function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;
    const desc =
      newRuleDesc.trim() ||
      'Enforced automatically across Chopwize AI picks and storefront checkouts.';

    onAddRule({
      title: newRuleTitle.trim(),
      ruleType: newRuleType,
      description: desc,
      enabled: true,
    });
    onAddMemory({
      title: newRuleTitle.trim(),
      status: 'confirmed',
      detail: desc,
      category: newRuleType === 'allergy' ? 'allergy' : 'habit',
    });

    setNewRuleTitle('');
    setNewRuleDesc('');
  }

  function handleCopyText(text: string, feedback: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => undefined);
    }
    onNotify(feedback);
  }

  if (section !== 'overview') {
    const sectionTitles: Record<Exclude<ProfileDetailSection, 'overview'>, string> = {
      profile_details: 'Profile Details',
      addresses: 'Saved Addresses',
      memory_rules: 'Food Memory & AI Rules',
      timetable: 'Meal Timetable & Cake Quotes',
      surprise: 'Surprise Delivery Programme',
      referrals: 'Referrals',
      vouchers: 'Vouchers & Promos',
      shopping_lists: 'Shopping Lists',
      help_support: 'Help Center & Order Support',
      legal: 'FAQs & Legal',
    };

    return (
      <div className="space-y-4 pb-36">
        <button
          type="button"
          onClick={() => setSection('overview')}
          className="inline-flex items-center gap-1.5 min-h-[38px] px-2 -ml-1 rounded-xl text-xs font-bold text-[#111827] hover:bg-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
          <span>Back to Profile</span>
        </button>

        <h1 className="text-lg font-bold text-[#111827]">
          {sectionTitles[section]}
        </h1>

        {section === 'profile_details' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateUserProfile({
                name: draftName.trim() || 'Amina Bello',
                contact: draftContact.trim() || '+234 803 555 1290',
                stateOfOrigin: draftState,
                indigenousFrequency: draftFreq,
              });
              onNotify('Profile preferences saved cleanly');
            }}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5 text-xs"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
              <div className="w-12 h-12 rounded-full bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#111827] truncate">
                  {userProfile.name}
                </div>
                <div className="text-[#6B7280] truncate">{userProfile.contact}</div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="prof-name" className="block font-semibold text-[#111827]">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="prof-contact" className="block font-semibold text-[#111827]">
                Phone Number or Email
              </label>
              <input
                id="prof-contact"
                type="text"
                required
                value={draftContact}
                onChange={(e) => setDraftContact(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="prof-state" className="block font-semibold text-[#111827]">
                State of Origin (for Indigenous Meal Matching)
              </label>
              <select
                id="prof-state"
                value={draftState}
                onChange={(e) => setDraftState(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827]"
              >
                <option value="">Prefer not to say</option>
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-[#111827]">
                Indigenous Meal Suggestion Frequency
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Occasionally', 'Weekly', 'Only when I ask'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setDraftFreq(freq)}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                      draftFreq === freq
                        ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                        : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold cursor-pointer"
              >
                Save Profile Changes
              </button>
              <button
                type="button"
                onClick={onReplayOnboarding}
                className="h-10 px-3.5 rounded-xl bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-xs font-semibold text-[#111827] inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                <span>Replay Onboarding</span>
              </button>
            </div>
          </form>
        )}

        {section === 'addresses' && (
          <div className="space-y-2.5">
            {addresses.map((addr) => {
              const zone = LAGOS_ZONES.find((z) => z.id === addr.zoneId);
              const active = selectedZoneId === addr.zoneId;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => onSelectAddressZone(addr.zoneId)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 cursor-pointer ${
                    active
                      ? 'bg-[#F4EFFF] border-[#A981FF]'
                      : 'bg-white border-[#E5E7EB] hover:bg-[#FAF8F4]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#6F42C1] mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">{addr.label}</div>
                      <div className="text-xs text-[#6B7280]">{addr.street}</div>
                      <div className="text-[11px] text-[#6B7280]">
                        {addr.landmark} · {zone?.label}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#111827] tabular-nums shrink-0">
                    {zone ? formatNGN(zone.deliveryFee) : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {section === 'memory_rules' && (
          <div className="space-y-3.5">
            {/* Temporary Session-Only Requests */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">
                  Temporary Requests (Today Only)
                </span>
                <span className="text-[10px] font-semibold text-[#6F42C1]">
                  Does NOT overwrite Food Memory
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {temporaryRequests.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    aria-pressed={req.active}
                    onClick={() => onToggleTemporaryRequest(req.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                      req.active
                        ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                        : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827] hover:bg-[#F4EFFF]'
                    }`}
                  >
                    {req.active ? `✓ ${req.label}` : req.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Customer AI Rules */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#111827]">
                Active Customer AI Rules ({aiRules.length})
              </div>
              {aiRules.map((rule) => {
                const isEditing = editingRuleId === rule.id;
                return (
                  <div
                    key={rule.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2.5"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1">
                          {(['allergy', 'budget', 'culture', 'spice'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEditType(t)}
                              className={`py-1 rounded-lg text-[10px] font-bold capitalize border cursor-pointer ${
                                editType === t
                                  ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                                  : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          aria-label="Edit rule title"
                          className="w-full h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-bold text-[#111827]"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          aria-label="Edit rule description"
                          className="w-full h-9 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!editTitle.trim()) return;
                              onUpdateRule(rule.id, {
                                title: editTitle.trim(),
                                description: editDesc.trim() || rule.description,
                                ruleType: editType,
                              });
                              setEditingRuleId(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#A981FF] text-[#111827] text-[11px] font-bold cursor-pointer"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRuleId(null)}
                            className="px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#E5E7EB] text-[#111827] text-[11px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase text-[#6F42C1]">
                            {rule.ruleType} Rule
                          </div>
                          <div className="text-sm font-bold text-[#111827]">
                            {rule.title}
                          </div>
                          <p className="text-xs text-[#6B7280]">{rule.description}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={rule.enabled}
                            onClick={() => onToggleRule(rule.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              rule.enabled
                                ? 'bg-[#A981FF] text-[#111827]'
                                : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
                            }`}
                          >
                            {rule.enabled ? 'Active' : 'Paused'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRuleId(rule.id);
                              setEditTitle(rule.title);
                              setEditDesc(rule.description);
                              setEditType(rule.ruleType);
                            }}
                            aria-label={`Edit rule ${rule.title}`}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRule(rule.id)}
                            aria-label={`Delete rule ${rule.title}`}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#B42318] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirmed & Inferred Food Memory */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#111827]">
                Confirmed &amp; Inferred Food Memories ({memories.length})
              </div>
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wide ${
                          mem.status === 'confirmed'
                            ? 'text-[#16A34A]'
                            : 'text-[#D97706]'
                        }`}
                      >
                        {mem.status === 'confirmed'
                          ? 'CONFIRMED PREFERENCE'
                          : 'INFERRED PATTERN'}
                      </span>
                      <h2 className="text-sm font-bold text-[#111827]">
                        {mem.title}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteMemory(mem.id)}
                      aria-label={`Delete memory ${mem.title}`}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#B42318] hover:bg-[#FEF3F2] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="text-xs text-[#6B7280] leading-relaxed">{mem.detail}</p>

                  {mem.status === 'inferred' && (
                    <button
                      type="button"
                      onClick={() => onConfirmMemory(mem.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Confirm Memory</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <AddRuleForm
              title={newRuleTitle}
              onTitleChange={setNewRuleTitle}
              ruleType={newRuleType}
              onTypeChange={setNewRuleType}
              desc={newRuleDesc}
              onDescChange={setNewRuleDesc}
              onSubmit={handleCreateRule}
            />
          </div>
        )}

        {section === 'timetable' && (
          <div className="space-y-3.5">
            {timetableSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#6F42C1]">
                    {slot.slotLabel} · {slot.timeLabel} · Cap {formatNGN(slot.budgetCap)}
                  </div>
                  <div className="text-sm font-bold text-[#111827] truncate">
                    {slot.plannedDish}
                  </div>
                  <div className="text-xs text-[#6B7280]">{slot.vendorName}</div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={slot.reminderEnabled}
                  aria-label={`Toggle ${slot.slotLabel} reminder`}
                  onClick={() => onToggleTimetableSlot(slot.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer ${
                    slot.reminderEnabled
                      ? 'bg-[#A981FF] text-[#111827]'
                      : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
                  }`}
                >
                  {slot.reminderEnabled ? 'Reminder On' : 'Off'}
                </button>
              </div>
            ))}

            {/* Custom Cake Quotes inside Timetable & Quotes */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
                <Cake className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                <span>Custom Birthday Cake Quotes ({cakeQuotes.length})</span>
              </div>
              {cakeQuotes.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#6F42C1] tabular-nums">
                      {q.id} · {q.vendorName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'Quoted'
                          ? 'bg-[#D0BCFC] text-[#111827]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#111827]">
                    {q.size} · {q.flavour}
                  </div>
                  {q.quotedPrice && (
                    <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs space-y-0.5">
                      <div className="font-bold text-[#111827] tabular-nums">
                        Baker Quote: {formatNGN(q.quotedPrice)}
                      </div>
                      {q.sellerNote && (
                        <div className="text-[11px] text-[#6B7280]">{q.sellerNote}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'surprise' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">
                    Opt-In Surprise Delivery
                  </h2>
                  <p className="text-[11px] text-[#6B7280]">
                    Default OFF. Requires your explicit activation &amp; payment approval before any dispatch.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={surpriseConfig.enabled}
                onClick={() => {
                  const next = !surpriseConfig.enabled;
                  onUpdateSurpriseConfig({
                    ...surpriseConfig,
                    enabled: next,
                  });
                  onNotify(
                    next
                      ? 'Surprise Delivery enabled — payment approval prompt required before each drop'
                      : 'Surprise Delivery turned OFF'
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  surpriseConfig.enabled
                    ? 'bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A]'
                    : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#111827]'
                }`}
              >
                {surpriseConfig.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] flex items-start gap-2 text-[11px] text-[#111827]">
              <ShieldCheck className="w-4 h-4 text-[#6F42C1] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Payment Approval Protection:</strong> Chopwize never debits your Food Budget Wallet or Paystack card without your 1-tap approval notification beforehand, and strictly honours your shellfish allergy ban.
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[#111827]">Delivery Cadence</div>
              <div className="flex flex-wrap gap-1.5">
                {(['Weekly Fridays', 'Bi-weekly Thursdays', 'Monthly Payday'] as const).map(
                  (cadence) => (
                    <button
                      key={cadence}
                      type="button"
                      onClick={() =>
                        onUpdateSurpriseConfig({ ...surpriseConfig, cadence })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        surpriseConfig.cadence === cadence
                          ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                          : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                      }`}
                    >
                      {cadence}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#111827]">
                <span>Surprise Budget Cap</span>
                <span className="tabular-nums">{formatNGN(surpriseConfig.maxBudget)}</span>
              </div>
              <input
                type="range"
                min={3500}
                max={10000}
                step={500}
                value={surpriseConfig.maxBudget}
                onChange={(e) =>
                  onUpdateSurpriseConfig({
                    ...surpriseConfig,
                    maxBudget: Number(e.target.value),
                  })
                }
                aria-label="Surprise budget cap"
                className="w-full accent-[#A981FF]"
              />
            </div>
          </div>
        )}

        {section === 'referrals' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5">
            <div className="text-xs text-[#6B7280] leading-relaxed">
              Invite Lagos friends to Chopwize. When they complete their first verified meal or grocery order, you both earn{' '}
              <strong className="text-[#111827]">₦500 Food Budget Wallet credit</strong>.
            </div>
            <div className="p-3 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#6F42C1]">
                  Your Referral Code
                </div>
                <div className="text-base font-extrabold text-[#111827]">
                  CHOP-AMINA25
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyText('CHOP-AMINA25', 'Referral code CHOP-AMINA25 copied!')
                }
                className="h-9 px-3.5 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy Code</span>
              </button>
            </div>
          </div>
        )}

        {section === 'vouchers' && (
          <div className="space-y-2.5">
            {INITIAL_VOUCHERS.map((v) => {
              const claimed = claimedVoucherCodes.includes(v.code);
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-extrabold text-[#6F42C1] tabular-nums">
                      {v.code} · Save {formatNGN(v.discountAmount)}
                    </div>
                    <div className="text-xs font-bold text-[#111827]">{v.title}</div>
                    <div className="text-[11px] text-[#6B7280] tabular-nums">
                      Min order {formatNGN(v.minOrder)} · {v.expiryLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!claimed) {
                        setClaimedVoucherCodes((prev) => [...prev, v.code]);
                      }
                      onNotify(`Voucher ${v.code} ready for checkout`);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                      claimed
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : 'bg-[#A981FF] text-[#111827]'
                    }`}
                  >
                    {claimed ? 'Ready ✓' : 'Claim'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {section === 'shopping_lists' && (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newShoppingText.trim()) return;
                setShoppingList((prev) => [
                  {
                    id: `sl-${Date.now()}`,
                    label: newShoppingText.trim(),
                    checked: false,
                    suggestedVendorId: 'ebeano-market',
                  },
                  ...prev,
                ]);
                setNewShoppingText('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newShoppingText}
                onChange={(e) => setNewShoppingText(e.target.value)}
                placeholder="Add pantry item (e.g. 2kg Honey Beans)..."
                aria-label="New shopping list item"
                className="flex-1 h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
              <button
                type="submit"
                className="h-10 px-3.5 rounded-xl bg-[#A981FF] text-[#111827] text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
              {shoppingList.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShoppingList((prev) =>
                        prev.map((i) =>
                          i.id === entry.id ? { ...i, checked: !i.checked } : i
                        )
                      )
                    }
                    className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        entry.checked
                          ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                          : 'border-[#D1D5DB] bg-white'
                      }`}
                    >
                      {entry.checked && <Check className="w-3 h-3" aria-hidden="true" />}
                    </span>
                    <span
                      className={`text-xs font-semibold truncate ${
                        entry.checked ? 'line-through text-[#6B7280]' : 'text-[#111827]'
                      }`}
                    >
                      {entry.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenMarketVendor(entry.suggestedVendorId)}
                    className="text-[11px] font-bold text-[#6F42C1] hover:underline shrink-0 cursor-pointer"
                  >
                    Shop ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'help_support' && (
          <div className="space-y-2.5">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#6F42C1] tabular-nums">
                    {t.id} · Order #{t.orderId}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#16A34A]">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#111827]">{t.category}</div>
                <p className="text-xs text-[#6B7280]">{t.summary}</p>
              </div>
            ))}
          </div>
        )}

        {section === 'legal' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3 text-xs text-[#6B7280] leading-relaxed">
            <div>
              <h2 className="font-bold text-[#111827]">
                Verified Sellers &amp; Allergy Protection
              </h2>
              <p className="mt-1">
                Chopwize clearly distinguishes admin-verified restaurants and grocery hubs from newly onboarded pending sellers. Active dietary allergy blocks automatically filter Chopwize AI results.
              </p>
            </div>
            <div>
              <h2 className="font-bold text-[#111827]">
                Single-Store Consolidation &amp; Service Fees
              </h2>
              <p className="mt-1">
                Food Subtotal, Delivery Fee, and Chopwize Service Charge (₦250) are separated transparently prior to Paystack or Food Budget Wallet confirmation.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-36">
      {/* 1. Profile Header with Rating Badge & Light-Mode Food Budget + Salary Wallet */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] font-extrabold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#111827] truncate">
                  {userProfile.name}
                </h1>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[10px] font-bold shrink-0">
                  <Star className="w-3 h-3 fill-[#A981FF] text-[#6F42C1]" aria-hidden="true" />
                  <span>4.9</span>
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] truncate">
                {userProfile.contact}
                {userProfile.stateOfOrigin ? ` · ${userProfile.stateOfOrigin} roots` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Light-Mode Monthly Food Budget & Salary Wallet Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#F4EFFF] via-white to-[#FAF8F4] border border-[#D0BCFC] text-[#111827] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[#A981FF] text-[#111827] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-[#6F42C1]">
                  Food Budget Wallet &amp; Salary Cap
                </div>
                <div className="text-base font-extrabold text-[#111827] tabular-nums whitespace-nowrap">
                  {formatNGN(walletBalance)}{' '}
                  <span className="text-[11px] font-semibold text-[#6B7280]">
                    Wallet
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWalletExpanded((v) => !v)}
              aria-expanded={walletExpanded}
              className="px-2.5 h-8 rounded-xl bg-white hover:bg-[#FAF8F4] border border-[#D0BCFC] text-[#111827] text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Fund Account</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#6F42C1] transition-transform ${
                  walletExpanded ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Monthly Salary Food Budget Tracker */}
          <div className="pt-2.5 border-t border-[#D0BCFC]/70 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div>
                <div className="text-[10px] font-semibold text-[#6B7280]">
                  Monthly Food Budget
                </div>
                <div className="text-sm font-extrabold text-[#111827] tabular-nums">
                  {formatNGN(budgetMetrics.monthlyBudget)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-semibold text-[#6B7280]">
                  Safe Daily Spend ({budgetConfig.daysRemainingInMonth}d left)
                </div>
                <div className="text-sm font-extrabold text-[#6F42C1] tabular-nums">
                  {formatNGN(budgetMetrics.safeDailySpend)}/day
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden"
              role="progressbar"
              aria-valuenow={budgetMetrics.percentUsed}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Monthly food budget used"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  budgetMetrics.isOverBudget ? 'bg-[#EF4444]' : 'bg-[#A981FF]'
                }`}
                style={{ width: `${budgetMetrics.percentUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[#6B7280] tabular-nums">
                {formatNGN(budgetMetrics.spentThisMonth)} spent ·{' '}
                {formatNGN(budgetMetrics.remaining)} remaining
              </span>
              <button
                type="button"
                onClick={() => setEditingBudget((v) => !v)}
                className="text-[#6F42C1] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>{editingBudget ? 'Close' : 'Adjust'}</span>
              </button>
            </div>

            {editingBudget && (
              <div className="pt-2 space-y-2">
                <div className="flex gap-1.5">
                  {[30000, 50000, 80000, 120000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        onUpdateMonthlyBudget(preset);
                        setBudgetInput(String(preset));
                        setEditingBudget(false);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        budgetMetrics.monthlyBudget === preset
                          ? 'bg-[#A981FF] border-[#A981FF] text-[#111827]'
                          : 'bg-white hover:bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
                      }`}
                    >
                      ₦{(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10);
                    if (Number.isFinite(parsed) && parsed >= 5000) {
                      onUpdateMonthlyBudget(parsed);
                      setEditingBudget(false);
                    }
                  }}
                  className="flex gap-1.5"
                >
                  <label htmlFor="monthly-budget-input" className="sr-only">
                    Custom monthly food budget in Naira
                  </label>
                  <input
                    id="monthly-budget-input"
                    type="number"
                    min={5000}
                    step={1000}
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-xs font-bold tabular-nums"
                  />
                  <button
                    type="submit"
                    className="px-3 h-8 rounded-lg bg-[#A981FF] text-[#111827] text-[11px] font-bold cursor-pointer"
                  >
                    Save Cap
                  </button>
                </form>
              </div>
            )}
          </div>

          {walletExpanded && (
            <div className="pt-2.5 border-t border-[#D0BCFC]/70 flex items-center justify-between gap-2 text-xs">
              <div>
                <div className="text-[10px] text-[#6B7280]">
                  Dedicated Virtual Account (Wema Bank)
                </div>
                <div className="font-bold text-[#111827] mt-0.5 tabular-nums">
                  8840192834 · Chopwize / {firstName}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyText('8840192834', 'Virtual account 8840192834 copied!')
                }
                className="px-2.5 py-1.5 rounded-lg bg-[#A981FF] text-[#111827] text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>Copy</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Account & 3-Portal Access Gateway */}
      <section aria-labelledby="account-portal-heading" className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2
              id="account-portal-heading"
              className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]"
            >
              Account &amp; Portal Access
            </h2>
            <p className="text-[12px] text-[#6B7280] truncate">
              {currentUser
                ? `Signed in as ${currentUser.name} · ${currentUser.role === 'Seller' ? 'Vendor' : currentUser.role}`
                : 'Guest Mode · Sign in for Customer, Vendor, or Rider portal'}
            </p>
          </div>
          {currentUser && (
            <button
              type="button"
              onClick={onSignOut}
              className="h-8 px-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#FEF3F2] border border-[#E5E7EB] text-[#B42318] text-[12px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Switch Role (Demo)
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {DEMO_ACCOUNTS.map((acct) => {
              const Icon =
                acct.role === 'Seller'
                  ? Store
                  : acct.role === 'Rider'
                    ? Bike
                    : ShoppingBag;
              const active = currentUser?.role === acct.role;
              return (
                <button
                  key={acct.id}
                  type="button"
                  onClick={() => onSwitchDemoRole(acct)}
                  className={`h-10 px-2 rounded-xl border text-[12px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                      : 'bg-[#FAF8F4] hover:bg-[#F4EFFF] border-[#E5E7EB] text-[#111827]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{acct.role === 'Seller' ? 'Vendor' : acct.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAuthModal}
          className="w-full h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          <span>Log In / Create Account</span>
        </button>
      </section>

      {/* 2. Grouped List Architecture (NO Gift Cards Anywhere) */}

      {/* Group 1 — Personal & Intelligence */}
      <section aria-labelledby="group-personal-heading" className="space-y-2">
        <h2
          id="group-personal-heading"
          className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]"
        >
          Personal &amp; Intelligence
        </h2>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden">
          <ProfileRow
            icon={User}
            title="Profile Details"
            subtitle={`${userProfile.name} · ${userProfile.stateOfOrigin || 'Nigeria'} · ${userProfile.indigenousFrequency}`}
            onClick={() => setSection('profile_details')}
          />
          <ProfileRow
            icon={MapPin}
            title={`Saved Addresses (${addresses.length})`}
            subtitle={
              addresses.find((a) => a.zoneId === selectedZoneId)?.street ??
              '25 Gbenga Lawal St, Lekki Phase 1'
            }
            onClick={() => setSection('addresses')}
          />
          <ProfileRow
            icon={Brain}
            title="Food Memory & AI Rules"
            subtitle={`${memories.length} memories · ${aiRules.filter((r) => r.enabled).length} active rules`}
            onClick={() => setSection('memory_rules')}
          />
          <ProfileRow
            icon={CalendarClock}
            title="Meal Timetable & Smart Reminders"
            subtitle={`${timetableSlots.filter((s) => s.reminderEnabled).length} active daily meal reminders · ${cakeQuotes.length} cake quote`}
            onClick={() => setSection('timetable')}
          />
          <ProfileRow
            icon={Gift}
            title="Surprise Delivery Programme"
            subtitle={
              surpriseConfig.enabled
                ? `ON · ${surpriseConfig.cadence} (${formatNGN(surpriseConfig.maxBudget)} cap)`
                : 'OFF · Optional treat drops with approval guard'
            }
            badge={surpriseConfig.enabled ? 'ON' : 'OFF'}
            badgeTone={surpriseConfig.enabled ? 'green' : 'muted'}
            onClick={() => setSection('surprise')}
          />
        </div>
      </section>

      {/* Group 2 — Marketplace & Services (NO Gift Cards!) */}
      <section aria-labelledby="group-marketplace-heading" className="space-y-2">
        <h2
          id="group-marketplace-heading"
          className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]"
        >
          Marketplace &amp; Services
        </h2>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden">
          <ProfileRow
            icon={Users}
            title="Group Ordering Hub"
            subtitle={
              groupOrder.active
                ? `Active (${groupOrder.shareUrl}) · ${groupOrder.participants.length} joined`
                : 'Start a shared office or friends cart link'
            }
            badge={groupOrder.active ? 'LIVE' : undefined}
            badgeTone="green"
            onClick={onStartGroupOrderFromProfile}
          />
          <ProfileRow
            icon={Store}
            title="Open Your Store"
            subtitle="Seller Portal & verified storefront launch"
            onClick={onOpenBecomeSeller}
            secondaryActionLabel="Seller Portal"
            onSecondaryAction={onOpenSellerDashboard}
          />
          <ProfileRow
            icon={Users}
            title="Referrals"
            subtitle="Share CHOP-AMINA25 & earn ₦500 wallet credit"
            onClick={() => setSection('referrals')}
          />
          <ProfileRow
            icon={BadgePercent}
            title="Vouchers & Promos"
            subtitle={`${INITIAL_VOUCHERS.length} Lagos promo codes ready`}
            onClick={() => setSection('vouchers')}
          />
          <ProfileRow
            icon={ListChecks}
            title="Shopping Lists"
            subtitle={`${shoppingList.filter((i) => !i.checked).length} pantry staples remaining`}
            onClick={() => setSection('shopping_lists')}
          />
        </div>
      </section>

      {/* Group 3 — Support & Preferences */}
      <section aria-labelledby="group-support-heading" className="space-y-2">
        <h2
          id="group-support-heading"
          className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]"
        >
          Support &amp; Preferences
        </h2>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden">
          <ProfileRow
            icon={HelpCircle}
            title="Help Center & Order Support"
            subtitle={`${tickets.length} support tickets logged`}
            onClick={() => setSection('help_support')}
          />
          <ProfileRow
            icon={ShieldAlert}
            title="Preferences & Dietary Allergies"
            subtitle="Shellfish safety block & spice tolerance"
            onClick={() => setSection('memory_rules')}
          />
          <ProfileRow
            icon={FileText}
            title="FAQs & Legal"
            subtitle="Verification standards, fees & privacy"
            onClick={() => setSection('legal')}
          />
        </div>
      </section>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeTone,
  onClick,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: 'green' | 'muted' | 'purple';
  onClick: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-3 hover:bg-[#FAF8F4] transition-colors">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
      >
        <span className="w-9 h-9 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#111827] truncate">
              {title}
            </span>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                  badgeTone === 'green'
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : badgeTone === 'purple'
                      ? 'bg-[#F4EFFF] text-[#6F42C1]'
                      : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#6B7280] truncate mt-0.5">
            {subtitle}
          </div>
        </div>
      </button>

      {secondaryActionLabel && onSecondaryAction ? (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="px-2.5 py-1.5 rounded-lg bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] text-[10px] font-bold shrink-0 cursor-pointer"
        >
          {secondaryActionLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Open ${title}`}
          className="p-1 text-[#6B7280] cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function AddRuleForm({
  title,
  onTitleChange,
  ruleType,
  onTypeChange,
  desc,
  onDescChange,
  onSubmit,
}: {
  title: string;
  onTitleChange: (val: string) => void;
  ruleType: CustomerAiRule['ruleType'];
  onTypeChange: (val: CustomerAiRule['ruleType']) => void;
  desc: string;
  onDescChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3"
    >
      <div className="text-xs font-bold text-[#111827]">
        Add Custom AI Rule / Food Preference
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {(['allergy', 'budget', 'culture', 'spice'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`py-1.5 rounded-xl text-[11px] font-bold capitalize border cursor-pointer ${
              ruleType === t
                ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <label htmlFor="new-food-rule-title" className="sr-only">
        Food rule title
      </label>
      <input
        id="new-food-rule-title"
        type="text"
        required
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="e.g. Never recommend food above ₦5,000"
        className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
      />
      <label htmlFor="new-food-rule-desc" className="sr-only">
        Food rule details
      </label>
      <input
        id="new-food-rule-desc"
        type="text"
        value={desc}
        onChange={(e) => onDescChange(e.target.value)}
        placeholder="Optional note for kitchens & Chopwize AI"
        className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
      />
      <button
        type="submit"
        className="w-full h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Save Rule to Food Memory</span>
      </button>
    </form>
  );
}
