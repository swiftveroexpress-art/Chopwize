import { useEffect, useState } from 'react';
import { ImagePlus, ShieldAlert, Store, X } from 'lucide-react';
import { CATEGORY_COVER_DEFAULTS } from '../data/mockMarketplace';
import type {
  MarketplaceCategoryConfig,
  MarketplaceCategorySlug,
  Vendor,
} from '../types/chopwize';

interface SellerOnboardingModalProps {
  isOpen: boolean;
  categories: MarketplaceCategoryConfig[];
  onClose: () => void;
  onCreateStore: (vendor: Vendor, openStoreImmediately: boolean) => void;
}

export function SellerOnboardingModal({
  isOpen,
  categories,
  onClose,
  onCreateStore,
}: SellerOnboardingModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [ownerContact, setOwnerContact] = useState('+234 809 441 8820');
  const [address, setAddress] = useState('14 Admiralty Way, Lekki Phase 1, Lagos');
  const [category, setCategory] = useState<MarketplaceCategorySlug>('drinks');
  const [operatingHours, setOperatingHours] = useState('8:30 AM – 8:30 PM');
  const [minOrderAmount, setMinOrderAmount] = useState(1500);
  const [supportsPickup, setSupportsPickup] = useState(true);
  const [supportsDelivery, setSupportsDelivery] = useState(true);
  const [description, setDescription] = useState('');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [previewStoreAfterCreate, setPreviewStoreAfterCreate] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleFilePreview(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setter(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = businessName.trim();
    if (!cleanName) return;

    const selectedCat = categories.find((c) => c.id === category);
    const words = cleanName.split(/\s+/).filter(Boolean);
    const monogram =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : cleanName.slice(0, 2).toUpperCase();

    const vendorId = `demo-store-${Date.now()}`;
    const coverImg = coverPreviewUrl || CATEGORY_COVER_DEFAULTS[category];

    const starterItemName =
      category === 'drinks'
        ? 'Fresh Cold-Pressed Citrus Blend'
        : category === 'pastries'
          ? 'Warm Butter Meat Pie Pack'
          : category === 'measured'
            ? 'Pure Measured Palm Oil Keg'
            : category === 'grill'
              ? 'Flame-Grilled Pepper Chicken'
              : category === 'groceries'
                ? 'Lagos Pantry Essentials Bundle'
                : 'House Signature Jollof Plate';

    const newVendor: Vendor = {
      id: vendorId,
      name: cleanName,
      category,
      categoryLabel: `${selectedCat?.label ?? 'Marketplace'} · New Storefront`,
      description:
        description.trim() ||
        `${cleanName} — freshly onboarded Nigerian storefront on Chopwize.`,
      verified: false,
      verificationStatus: 'pending_verification',
      isOpen: true,
      rating: 5.0,
      reviewCount: 1,
      deliveryTimeRange: '20-35 mins',
      minEtaMins: 20,
      distanceKm: 1.4,
      coverImageUrl: coverImg,
      logoPreviewUrl: logoPreviewUrl || undefined,
      monogram,
      accentBg: '#F3EEFF',
      address: address.trim() || 'Lekki Phase 1, Lagos',
      operatingHours: operatingHours.trim() || '9:00 AM – 8:00 PM',
      prepCutOffNote: 'Pending Admin Verification · Storefront Preview',
      minOrderAmount: Math.max(500, minOrderAmount),
      supportsPickup,
      supportsDelivery,
      ownerContact: ownerContact.trim(),
      isDemoStore: true,
      menu: [
        {
          id: `${vendorId}-item-1`,
          vendorId,
          name: starterItemName,
          description: `Opening launch special from ${cleanName}. Customize sizes or add to tray.`,
          basePrice: category === 'measured' ? 2500 : 2800,
          sellingUnit:
            category === 'drinks'
              ? 'Bottle'
              : category === 'measured'
                ? 'Litre'
                : 'Pack',
          storeCategory: selectedCat?.shortLabel ?? 'Featured',
          marketplaceCategory: category,
          imageUrl: coverImg,
          isPopular: false,
          prepMins: 15,
          stockCount: 15,
          variants:
            category === 'drinks'
              ? [
                  { id: '500ml', label: '500ml Bottle', price: 1500, stockCount: 20 },
                  { id: '1l', label: '1 Litre Bottle', price: 2800, stockCount: 12 },
                ]
              : category === 'measured'
                ? [
                    { id: '1l', label: '1 Litre', price: 2500, stockCount: 15 },
                    { id: '5l', label: '5 Litres Keg', price: 11500, stockCount: 6 },
                  ]
                : undefined,
          juiceMeta:
            category === 'drinks'
              ? {
                  ingredients: ['Fresh Pineapple', 'Valencia Orange', 'Ginger'],
                  addedSugar: false,
                  storageNote: 'Keep chilled at 2–4°C.',
                  freshnessStatus: 'Freshly pressed on order',
                }
              : undefined,
          measuredMeta:
            category === 'measured'
              ? { unitType: 'Litres', stockTracked: true }
              : undefined,
          optionGroups: [],
        },
      ],
    };

    onCreateStore(newVendor, previewStoreAfterCreate);
    setBusinessName('');
    setDescription('');
    setLogoPreviewUrl('');
    setCoverPreviewUrl('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-onboarding-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] max-h-[92vh] bg-white rounded-t-3xl border-t border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] flex items-center justify-center">
              <Store className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="seller-onboarding-title"
                className="font-display text-sm font-extrabold text-[#111827]"
              >
                Open Your Store on Chopwize
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Restaurants, Bakers, Juice Bars, Grills &amp; Measured Sellers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close seller onboarding modal"
            className="w-8 h-8 rounded-full hover:bg-[#FAF8F4] flex items-center justify-center text-[#111827] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-[#F4EFFF] border border-[#D0BCFC] flex items-start gap-2 text-[11px] text-[#111827]">
            <ShieldAlert className="w-4 h-4 text-[#6F42C1] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              New stores launch with <strong>Pending Admin Verification</strong> status. You can immediately preview your storefront and manage it in <strong>Vendor Portal</strong>.
            </span>
          </div>

          <div>
            <label
              htmlFor="onboard-business-name"
              className="block text-xs font-bold text-[#111827] mb-1"
            >
              Business / Store Name
            </label>
            <input
              id="onboard-business-name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Eko Fresh Cold-Pressed Juices"
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="onboard-category"
                className="block text-xs font-bold text-[#111827] mb-1"
              >
                Marketplace Category
              </label>
              <select
                id="onboard-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketplaceCategorySlug)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#A981FF]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="onboard-contact"
                className="block text-xs font-bold text-[#111827] mb-1"
              >
                Owner Phone / Contact
              </label>
              <input
                id="onboard-contact"
                type="text"
                required
                value={ownerContact}
                onChange={(e) => setOwnerContact(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="onboard-address"
              className="block text-xs font-bold text-[#111827] mb-1"
            >
              Store Address &amp; Lagos Zone
            </label>
            <input
              id="onboard-address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="onboard-hours"
                className="block text-xs font-bold text-[#111827] mb-1"
              >
                Operating Hours
              </label>
              <input
                id="onboard-hours"
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>
            <div>
              <label
                htmlFor="onboard-min-order"
                className="block text-xs font-bold text-[#111827] mb-1"
              >
                Minimum Order (₦)
              </label>
              <input
                id="onboard-min-order"
                type="number"
                min={500}
                step={500}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-mono tabular-nums text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="onboard-description"
              className="block text-xs font-bold text-[#111827] mb-1"
            >
              Short Store Bio
            </label>
            <textarea
              id="onboard-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your kitchen, freshly pressed juices, bakes, or measured products..."
              className="w-full p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          {/* Fulfilment Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={supportsDelivery}
              onClick={() => setSupportsDelivery((d) => !d)}
              className={`h-10 rounded-xl text-xs font-bold border cursor-pointer ${
                supportsDelivery
                  ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                  : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              {supportsDelivery ? '✓ Rider Delivery On' : 'Rider Delivery Off'}
            </button>
            <button
              type="button"
              aria-pressed={supportsPickup}
              onClick={() => setSupportsPickup((p) => !p)}
              className={`h-10 rounded-xl text-xs font-bold border cursor-pointer ${
                supportsPickup
                  ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                  : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              {supportsPickup ? '✓ Store Pickup On' : 'Store Pickup Off'}
            </button>
          </div>

          {/* Logo & Cover Image Previews */}
          <div className="grid grid-cols-2 gap-2.5">
            <label className="p-3 rounded-2xl border border-dashed border-[#D0BCFC] bg-[#FAF8F4] hover:bg-[#F4EFFF] flex flex-col items-center text-center gap-1.5 cursor-pointer">
              <ImagePlus className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
              <span className="text-[11px] font-bold text-[#111827]">
                {logoPreviewUrl ? 'Logo Uploaded ✓' : 'Upload Store Logo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFilePreview(e, setLogoPreviewUrl)}
                className="sr-only"
              />
            </label>

            <label className="p-3 rounded-2xl border border-dashed border-[#D0BCFC] bg-[#FAF8F4] hover:bg-[#F4EFFF] flex flex-col items-center text-center gap-1.5 cursor-pointer">
              <ImagePlus className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
              <span className="text-[11px] font-bold text-[#111827]">
                {coverPreviewUrl ? 'Cover Uploaded ✓' : 'Upload Cover Photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFilePreview(e, setCoverPreviewUrl)}
                className="sr-only"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#111827] cursor-pointer">
            <input
              type="checkbox"
              checked={previewStoreAfterCreate}
              onChange={(e) => setPreviewStoreAfterCreate(e.target.checked)}
              className="accent-[#A981FF] w-4 h-4"
            />
            <span>Preview new storefront immediately after creating</span>
          </label>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] font-extrabold text-xs sm:text-sm cursor-pointer"
          >
            Create Storefront (Pending Verification)
          </button>
        </form>
      </div>
    </div>
  );
}
