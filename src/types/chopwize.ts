export type MainTabId = 'home' | 'explore' | 'orders' | 'profile';

export type AppRole = 'Customer' | 'Seller' | 'Rider';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  vendorId?: string;
  vehicle?: string;
  plateNumber?: string;
  isDemo: boolean;
}

export type CategoryId =
  | 'all'
  | 'restaurants'
  | 'pastries'
  | 'drinks'
  | 'grill'
  | 'groceries'
  | 'measured';

export type MarketplaceCategorySlug = Exclude<CategoryId, 'all'>;

export interface MarketplaceCategoryConfig {
  id: MarketplaceCategorySlug;
  label: string;
  shortLabel: string;
  description: string;
}

export type CultureId = 'yoruba' | 'igbo' | 'hausa' | 'calabar';

export type SubstitutionPreference =
  | 'smart_replacement'
  | 'contact_first'
  | 'refund';

export type PaymentOutcome = 'success' | 'pending' | 'failed';

export type OrderStageId =
  | 'submitted'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'rider_assigned'
  | 'in_transit'
  | 'delivered';

export interface LocationZone {
  id: string;
  label: string;
  shortName: string;
  deliveryFee: number;
  etaBonusMins: number;
}

export interface OptionChoice {
  id: string;
  name: string;
  priceDelta: number;
}

export interface OptionGroup {
  id: string;
  title: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  choices: OptionChoice[];
}

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  stockCount: number;
  unitNote?: string;
}

export interface GroceryMeta {
  packSize: string;
  unitPriceLabel: string;
  aisle?:
    | 'Grains & Pasta'
    | 'Cooking Oils & Litre Measures'
    | 'Beverages & Fresh Juices'
    | 'Canned & Seasoning';
}

export interface PastryMeta {
  allowsCustomCakeQuote?: boolean;
  prepLeadTime: string;
  supportsPreOrder: boolean;
}

export interface JuiceMeta {
  ingredients: string[];
  addedSugar: boolean;
  storageNote: string;
  freshnessStatus: 'Freshly pressed on order' | 'Chilled stock';
}

export interface GrillMeta {
  collectionWindow: string;
  dippingSauces?: string[];
}

export interface MeasuredMeta {
  unitType: 'Litres' | 'Kg';
  stockTracked: boolean;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  basePrice: number;
  originalPrice?: number;
  isCombo?: boolean;
  sellingUnit:
    | 'Plate'
    | 'Bowl'
    | 'Pack'
    | 'Box'
    | 'Platter'
    | 'Bag'
    | 'Bottle'
    | 'Carton'
    | 'Litre'
    | 'Kg'
    | 'Combo';
  storeCategory: string;
  marketplaceCategory: MarketplaceCategorySlug;
  culture?: CultureId;
  imageUrl: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  prepMins: number;
  stockCount?: number;
  dietaryTags?: string[];
  allergens?: string[];
  variants?: ProductVariant[];
  removableIngredients?: string[];
  groceryMeta?: GroceryMeta;
  pastryMeta?: PastryMeta;
  juiceMeta?: JuiceMeta;
  grillMeta?: GrillMeta;
  measuredMeta?: MeasuredMeta;
  optionGroups: OptionGroup[];
}

export interface Vendor {
  id: string;
  name: string;
  category: MarketplaceCategorySlug;
  categoryLabel: string;
  description: string;
  verified: boolean;
  verificationStatus: 'verified' | 'pending_verification';
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  deliveryTimeRange: string;
  minEtaMins: number;
  distanceKm: number;
  coverImageUrl: string;
  logoPreviewUrl?: string;
  monogram: string;
  accentBg: string;
  address: string;
  operatingHours: string;
  prepCutOffNote: string;
  minOrderAmount: number;
  supportsPickup: boolean;
  supportsDelivery: boolean;
  ownerContact?: string;
  isDemoStore?: boolean;
  reviews?: VendorReview[];
  menu: MenuItem[];
}

export interface SelectedOptionChoice extends OptionChoice {
  quantity?: number;
}

export interface CartSelection {
  groupId: string;
  groupTitle: string;
  choices: SelectedOptionChoice[];
}

export interface CartItem {
  cartItemId: string;
  vendorId: string;
  vendorName: string;
  packLabel?: string;
  menuItem: MenuItem;
  selectedVariant?: ProductVariant;
  removedIngredients?: string[];
  quantity: number;
  selections: CartSelection[];
  unitPrice: number;
  specialNote?: string;
  substitutionPreference?: SubstitutionPreference;
}

export interface RiderInfo {
  name: string;
  rating: number;
  tripsCompleted: number;
  vehicle: string;
  plateNumber: string;
  phone: string;
}

export interface OrderRecord {
  orderId: string;
  createdAtLabel: string;
  vendorId: string;
  vendorName: string;
  deliveryAddress: string;
  zoneLabel: string;
  customerPhone: string;
  paymentStatus: 'paid' | 'pending_verification';
  items: CartItem[];
  itemsSubtotal: number;
  takeawayPackCount?: number;
  takeawayPackFee?: number;
  ecoPackaging?: boolean;
  ecoPackagingFee?: number;
  vendorNote?: string;
  deliveryFee: number;
  serviceCharge: number;
  riderTip?: number;
  appliedPromoLabels?: string[];
  walletApplied: number;
  totalPaid: number;
  currentStage: OrderStageId;
  stageTimestamps: Partial<Record<OrderStageId, string>>;
  deliveryPin: string;
  rider: RiderInfo;
  riderEarnings?: number;
}

export interface CultureGuide {
  id: CultureId;
  eyebrow: string;
  title: string;
  dishesPreview: string;
  kitchenName: string;
}

export interface FoodMemoryEntry {
  id: string;
  title: string;
  status: 'confirmed' | 'inferred';
  detail: string;
  category: 'dish' | 'vendor' | 'allergy' | 'habit' | 'grocery';
}

export interface CustomerAiRule {
  id: string;
  title: string;
  ruleType: 'allergy' | 'budget' | 'spice' | 'delivery' | 'culture';
  description: string;
  enabled: boolean;
}

export interface TemporaryAiRequest {
  id: string;
  label: string;
  excludeKeywords: string[];
  active: boolean;
}

export interface CustomCakeQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  size: string;
  flavour: string;
  icing: string;
  inscription: string;
  deliveryDate: string;
  inspirationPreviewUrl?: string;
  budgetHint?: string;
  status: 'Pending Quote' | 'Quoted' | 'Accepted';
  quotedPrice?: number;
  sellerNote?: string;
  createdAtLabel: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  zoneId: string;
  landmark: string;
}

export interface SupportTicket {
  id: string;
  orderId: string;
  category: string;
  summary: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
}

export interface SurpriseConfig {
  enabled: boolean;
  cadence: 'Weekly Fridays' | 'Bi-weekly Thursdays' | 'Monthly Payday';
  maxBudget: number;
  spiceLevel: 'Mild' | 'Medium' | 'Lagos Hot';
}

export interface MealTimetableSlot {
  id: string;
  slotLabel: string;
  timeLabel: string;
  plannedDish: string;
  vendorName: string;
  budgetCap: number;
  reminderEnabled: boolean;
}

export interface VoiceTranscriptSample {
  id: string;
  label: string;
  transcript: string;
}

export interface VoucherPromo {
  id: string;
  code: string;
  title: string;
  discountAmount: number;
  minOrder: number;
  expiryLabel: string;
}

export interface ShoppingListItem {
  id: string;
  label: string;
  checked: boolean;
  suggestedVendorId: string;
}

export type IndigenousFrequency = 'Occasionally' | 'Weekly' | 'Only when I ask';

export interface UserProfile {
  name: string;
  contact: string;
  stateOfOrigin: string;
  indigenousFrequency: IndigenousFrequency;
}

export interface MonthlyBudgetConfig {
  monthlyBudget: number;
  spentThisMonth: number;
  daysRemainingInMonth: number;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  authorName: string;
  rating: number;
  comment: string;
  dishTag?: string;
  createdAtLabel: string;
  verifiedBuyer: boolean;
}

export interface GroupParticipant {
  id: string;
  name: string;
  items: CartItem[];
}

export interface GroupOrderSession {
  active: boolean;
  code: string;
  shareUrl: string;
  vendorId: string;
  vendorName: string;
  participants: GroupParticipant[];
}

export type VendorPromoType =
  | 'percentage_discount'
  | 'free_delivery'
  | 'combo_deal';

export interface VendorPromoCampaign {
  id: string;
  vendorId: string;
  type: VendorPromoType;
  title: string;
  description: string;
  discountPercent?: number;
  minOrderAmount?: number;
  targetItemId?: string;
  targetStoreCategory?: string;
  active: boolean;
  createdAtLabel: string;
}

export interface OrderChatMessage {
  id: string;
  orderId: string;
  senderRole: 'customer' | 'rider';
  senderName: string;
  text: string;
  timestampLabel: string;
}

