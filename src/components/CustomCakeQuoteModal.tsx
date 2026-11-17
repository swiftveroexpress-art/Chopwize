import { useEffect, useState } from 'react';
import { Cake, ImagePlus, Send, X } from 'lucide-react';
import pastriesImg from '../assets/images/dish_pastries_cake_1794526076709.jpg';
import type { CustomCakeQuote, Vendor } from '../types/chopwize';

interface CustomCakeQuoteModalProps {
  isOpen: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSubmitQuote: (
    quote: Omit<CustomCakeQuote, 'id' | 'status' | 'createdAtLabel'>
  ) => void;
}

const CAKE_SIZES = [
  '6-inch Bento (Serves 6–8)',
  '8-inch Two-Layer (Serves 14–18)',
  '10-inch Celebration (Serves 25–30)',
  '2-Tier Party Cake (Serves 45+)',
];

const CAKE_FLAVOURS = [
  'Red Velvet & Cream Cheese',
  'Rich Belgian Chocolate Fudge',
  'Vanilla Bean & Strawberry',
  'Coconut & Pineapple Sponge',
];

const ICING_STYLES = [
  'Silky Vanilla Buttercream',
  'Whipped Cream Minimalist',
  'Smooth Fondant Finish',
  'Floral Lilac & Cream Swirls',
];

export function CustomCakeQuoteModal({
  isOpen,
  vendor,
  onClose,
  onSubmitQuote,
}: CustomCakeQuoteModalProps) {
  const [size, setSize] = useState(CAKE_SIZES[1]);
  const [flavour, setFlavour] = useState(CAKE_FLAVOURS[0]);
  const [icing, setIcing] = useState(ICING_STYLES[0]);
  const [inscription, setInscription] = useState('Happy Birthday!');
  const [deliveryDate, setDeliveryDate] = useState('This Saturday · 2:00 PM');
  const [budgetHint, setBudgetHint] = useState('₦25,000 – ₦35,000');
  const [inspirationPreviewUrl, setInspirationPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !vendor) return null;

  function handleInspirationUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInspirationPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    onSubmitQuote({
      vendorId: vendor.id,
      vendorName: vendor.name,
      customerName: 'Amina Bello',
      size,
      flavour,
      icing,
      inscription: inscription.trim() || 'Happy Celebration!',
      deliveryDate: deliveryDate.trim() || 'Next Available Date',
      budgetHint: budgetHint.trim() || undefined,
      inspirationPreviewUrl: inspirationPreviewUrl || pastriesImg,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cake-quote-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] max-h-[90vh] bg-white rounded-t-3xl border-t border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
              <Cake className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="cake-quote-title"
                className="font-display text-sm font-extrabold text-[#111827]"
              >
                Request Custom Birthday Cake
              </h2>
              <p className="text-[11px] text-[#6B7280] truncate">
                {vendor.name} · Custom Order Request
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom cake quote modal"
            className="w-8 h-8 rounded-full hover:bg-[#FAF8F4] flex items-center justify-center text-[#111827] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label
              htmlFor="cake-size-select"
              className="block text-xs font-bold text-[#111827] mb-1.5"
            >
              Cake Size &amp; Servings
            </label>
            <select
              id="cake-size-select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-medium text-[#111827] focus:outline-none focus:border-[#A981FF]"
            >
              {CAKE_SIZES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cake-flavour-select"
                className="block text-xs font-bold text-[#111827] mb-1.5"
              >
                Sponge Flavour
              </label>
              <select
                id="cake-flavour-select"
                value={flavour}
                onChange={(e) => setFlavour(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-medium text-[#111827] focus:outline-none focus:border-[#A981FF]"
              >
                {CAKE_FLAVOURS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="cake-icing-select"
                className="block text-xs font-bold text-[#111827] mb-1.5"
              >
                Icing Style
              </label>
              <select
                id="cake-icing-select"
                value={icing}
                onChange={(e) => setIcing(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs font-medium text-[#111827] focus:outline-none focus:border-[#A981FF]"
              >
                {ICING_STYLES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="cake-inscription-input"
              className="block text-xs font-bold text-[#111827] mb-1.5"
            >
              Cake Inscription Message
            </label>
            <input
              id="cake-inscription-input"
              type="text"
              required
              value={inscription}
              onChange={(e) => setInscription(e.target.value)}
              placeholder="e.g. Happy 30th Birthday Chidi!"
              className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cake-delivery-date"
                className="block text-xs font-bold text-[#111827] mb-1.5"
              >
                Delivery / Pickup Date
              </label>
              <input
                id="cake-delivery-date"
                type="text"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>

            <div>
              <label
                htmlFor="cake-budget-hint"
                className="block text-xs font-bold text-[#111827] mb-1.5"
              >
                Target Budget (Optional)
              </label>
              <input
                id="cake-budget-hint"
                type="text"
                value={budgetHint}
                onChange={(e) => setBudgetHint(e.target.value)}
                placeholder="e.g. ₦25,000"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>
          </div>

          {/* Inspiration Photo Upload Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827]">
                Inspiration Photo (Optional)
              </span>
              <button
                type="button"
                onClick={() => setInspirationPreviewUrl(pastriesImg)}
                className="text-[11px] font-bold text-[#6F42C1] hover:underline cursor-pointer"
              >
                Use Sample Design
              </button>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-[#D0BCFC] bg-[#FAF8F4] hover:bg-[#F4EFFF] cursor-pointer">
              <ImagePlus className="w-5 h-5 text-[#6F42C1] shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#111827]">
                  {inspirationPreviewUrl ? 'Change inspiration image' : 'Upload cake inspiration image'}
                </div>
                <div className="text-[10px] text-[#6B7280]">
                  PNG or JPG preview stored locally for demo quote
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleInspirationUpload}
                className="sr-only"
              />
            </label>
            {inspirationPreviewUrl && (
              <img
                src={inspirationPreviewUrl}
                alt="Cake inspiration preview"
                className="w-full h-28 object-cover rounded-2xl border border-[#E5E7EB]"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>Submit Custom Quote Request</span>
          </button>
        </form>
      </div>
    </div>
  );
}
