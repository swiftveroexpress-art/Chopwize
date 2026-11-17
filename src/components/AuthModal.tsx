import { useState } from 'react';
import {
  Bike,
  CheckCircle2,
  LogOut,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { DEMO_ACCOUNTS } from '../data/mockMarketplace';
import type { AppRole, AuthUser, Vendor } from '../types/chopwize';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  vendors: Vendor[];
  onSignIn: (user: AuthUser) => void;
  onSignOut: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  vendors,
  onSignIn,
  onSignOut,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<AppRole>('Customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+234 803 ');
  const [password, setPassword] = useState('');
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? 'terra-kulture');
  const [vehicle, setVehicle] = useState('Honda Ace 125');
  const [plateNumber, setPlateNumber] = useState('KJA-902-CW');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    if (mode === 'login') {
      const matchedDemo = DEMO_ACCOUNTS.find(
        (d) => d.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (matchedDemo) {
        onSignIn(matchedDemo);
        onClose();
        return;
      }

      const inferredName =
        email
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Chopwize User';

      onSignIn({
        id: `user-${Date.now()}`,
        name: inferredName,
        email: email.trim(),
        phone: '+234 803 555 1290',
        role: selectedRole,
        vendorId: selectedRole === 'Seller' ? vendorId : undefined,
        vehicle: selectedRole === 'Rider' ? vehicle : undefined,
        plateNumber: selectedRole === 'Rider' ? plateNumber : undefined,
        isDemo: false,
      });
      onClose();
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name or business name.');
      return;
    }

    onSignIn({
      id: `user-${Date.now()}`,
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || '+234 803 555 1290',
      role: selectedRole,
      vendorId: selectedRole === 'Seller' ? vendorId : undefined,
      vehicle: selectedRole === 'Rider' ? vehicle : undefined,
      plateNumber: selectedRole === 'Rider' ? plateNumber : undefined,
      isDemo: false,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl border border-[#EBE6DF] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EBE6DF] flex items-center justify-between gap-2 shrink-0">
          <div>
            <h2
              id="auth-modal-title"
              className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827]"
            >
              {mode === 'login' ? 'Sign In to Chopwize' : 'Create Chopwize Account'}
            </h2>
            <p className="text-[12px] font-medium text-[#6B7280] mt-0.5">
              One unified account for Customer, Vendor &amp; Rider portals
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="w-9 h-9 rounded-full bg-[#FAF8F4] hover:bg-[#F4EFFF] text-[#111827] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Session Banner */}
          {currentUser && (
            <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#EBE6DF] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16A34A]">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Active {currentUser.role === 'Seller' ? 'Vendor' : currentUser.role} Session</span>
                </div>
                <div className="text-[15px] font-semibold text-[#111827] truncate mt-0.5">
                  {currentUser.name}
                </div>
                <div className="text-[12px] text-[#6B7280] truncate">
                  {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="h-9 px-3 rounded-xl bg-white hover:bg-[#FEF3F2] border border-[#EBE6DF] text-[#B42318] text-[12px] font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* 1-Click Demo Role Accounts */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
                Instant Demo Accounts
              </h3>
              <span className="text-[11px] font-medium text-[#6B7280]">
                1-tap portal switch
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acct) => {
                const Icon =
                  acct.role === 'Seller'
                    ? Store
                    : acct.role === 'Rider'
                      ? Bike
                      : ShoppingBag;
                const active = currentUser?.id === acct.id;
                const roleDisplay =
                  acct.role === 'Seller' ? 'Vendor' : acct.role;
                return (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => {
                      onSignIn(acct);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border text-left space-y-1.5 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F4EFFF] border-[#A981FF] text-[#111827] ring-1 ring-[#A981FF]'
                        : 'bg-white hover:bg-[#F4EFFF] border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        active
                          ? 'bg-[#A981FF] text-[#111827]'
                          : 'bg-[#F4EFFF] text-[#6F42C1]'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="text-[13px] font-semibold leading-tight">
                      {roleDisplay} Demo
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        active ? 'text-[#6F42C1]' : 'text-[#6B7280]'
                      }`}
                    >
                      {acct.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Login / Sign Up Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`h-9 rounded-xl text-[13px] font-semibold cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#A981FF] text-[#111827]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`h-9 rounded-xl text-[13px] font-semibold cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#A981FF] text-[#111827]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Portal Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-[#6B7280]">
                Select Portal Role
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Customer' as const, label: 'Customer', icon: User },
                  { id: 'Seller' as const, label: 'Vendor', icon: Store },
                  { id: 'Rider' as const, label: 'Rider', icon: Bike },
                ].map((r) => {
                  const Icon = r.icon;
                  const active = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`h-10 px-2 rounded-xl border text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        active
                          ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                          : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label
                    htmlFor="auth-fullname"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    {selectedRole === 'Seller'
                      ? 'Owner / Kitchen Name'
                      : 'Full Name'}
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={
                      selectedRole === 'Seller'
                        ? 'e.g. Chef Sola Kitchen'
                        : selectedRole === 'Rider'
                          ? 'e.g. Musa Ibrahim'
                          : 'e.g. Amina Bello'
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-phone"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Nigerian Phone Number
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] text-[#111827] tabular-nums focus:outline-none focus:border-[#A981FF]"
                  />
                </div>
              </>
            )}

            {selectedRole === 'Seller' && (
              <div>
                <label
                  htmlFor="auth-vendor"
                  className="block text-[12px] font-medium text-[#6B7280] mb-1"
                >
                  Managed Storefront
                </label>
                <select
                  id="auth-vendor"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] font-medium text-[#111827] focus:outline-none focus:border-[#A981FF]"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedRole === 'Rider' && mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="auth-vehicle"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Dispatch Bike / Vehicle
                  </label>
                  <input
                    id="auth-vehicle"
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] text-[#111827]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="auth-plate"
                    className="block text-[12px] font-medium text-[#6B7280] mb-1"
                  >
                    Plate Number
                  </label>
                  <input
                    id="auth-plate"
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] text-[#111827]"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-[12px] font-medium text-[#6B7280] mb-1"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-[12px] font-medium text-[#6B7280] mb-1"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F4] border border-[#EBE6DF] text-[13px] text-[#111827] focus:outline-none focus:border-[#A981FF]"
              />
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[12px] font-medium text-[#B42318]"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold cursor-pointer transition-colors"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
