import { useMemo, useState } from 'react';
import {
  Bike,
  CheckCircle2,
  ClipboardList,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Wallet,
} from 'lucide-react';
import { DEMO_ACCOUNTS } from '../data/mockMarketplace';
import type {
  AuthUser,
  OrderChatMessage,
  OrderRecord,
  Vendor,
} from '../types/chopwize';
import { calculateRiderEarnings, formatNGN } from '../utils/pricing';
import { LiveDeliveryMap } from './LiveDeliveryMap';

interface RiderDashboardViewProps {
  currentUser: AuthUser | null;
  orders: OrderRecord[];
  vendors: Vendor[];
  orderMessages?: Record<string, OrderChatMessage[]>;
  onOpenOrderChat: (orderId: string) => void;
  onAcceptDelivery: (orderId: string) => void;
  onMarkPickedUp: (orderId: string) => void;
  onMarkDelivered: (orderId: string) => void;
  onOpenAuthModal: () => void;
  onSwitchDemoRole: (account: AuthUser) => void;
  onSignOut: () => void;
}

type RiderNavTab = 'requests' | 'active' | 'earnings' | 'account';

export function RiderDashboardView({
  currentUser,
  orders,
  vendors,
  orderMessages,
  onOpenOrderChat,
  onAcceptDelivery,
  onMarkPickedUp,
  onMarkDelivered,
  onOpenAuthModal,
  onSwitchDemoRole,
  onSignOut,
}: RiderDashboardViewProps) {
  const [navTab, setNavTab] = useState<RiderNavTab>('requests');
  const [isOnline, setIsOnline] = useState(true);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({});

  // Orders ready for rider pickup + kitchen orders coming soon
  const readyRequests = useMemo(
    () => orders.filter((o) => o.currentStage === 'ready'),
    [orders]
  );
  const kitchenQueue = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.currentStage === 'submitted' ||
          o.currentStage === 'accepted' ||
          o.currentStage === 'preparing'
      ),
    [orders]
  );
  const activeDeliveries = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.currentStage === 'rider_assigned' || o.currentStage === 'in_transit'
      ),
    [orders]
  );
  const completedDeliveries = useMemo(
    () => orders.filter((o) => o.currentStage === 'delivered'),
    [orders]
  );

  const totalEarnings = useMemo(
    () =>
      completedDeliveries.reduce(
        (sum, ord) =>
          sum +
          (ord.riderEarnings ??
            calculateRiderEarnings(ord.deliveryFee, ord.riderTip ?? 0)),
        0
      ),
    [completedDeliveries]
  );

  function getVendorAddress(vendorId: string): string {
    return (
      vendors.find((v) => v.id === vendorId)?.address ?? 'Victoria Island, Lagos'
    );
  }

  function handleCompleteWithPin(order: OrderRecord) {
    const typed = (pinInputs[order.orderId] ?? '').trim();
    if (typed && typed !== order.deliveryPin) {
      setPinErrors((prev) => ({
        ...prev,
        [order.orderId]: `PIN mismatch. Ask customer for 4-digit PIN (${order.deliveryPin}).`,
      }));
      return;
    }
    setPinErrors((prev) => ({ ...prev, [order.orderId]: '' }));
    onMarkDelivered(order.orderId);
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Light-Mode Rider Portal Header Card */}
      <section className="bg-gradient-to-br from-[#F4EFFF] via-white to-[#FAF8F4] border border-[#D0BCFC] text-[#111827] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#A981FF] text-[#111827] flex items-center justify-center shrink-0">
              <Bike className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#6F42C1]">
                Chopwize Dispatch Partner
              </div>
              <h1 className="text-[20px] font-bold tracking-[-0.02em] leading-[1.25] text-[#111827] truncate">
                {currentUser?.name ?? 'Tunde Adeleke'}
              </h1>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            onClick={() => setIsOnline((v) => !v)}
            className={`h-8 px-3 rounded-full text-[12px] font-semibold transition-colors cursor-pointer shrink-0 ${
              isOnline
                ? 'bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A]'
                : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#6B7280]'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-xl bg-white border border-[#E5E7EB] px-3 py-2">
            <div className="text-[11px] font-medium text-[#6B7280]">
              Ready Requests
            </div>
            <div className="text-[16px] font-bold text-[#111827] tabular-nums mt-0.5">
              {readyRequests.length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-[#E5E7EB] px-3 py-2">
            <div className="text-[11px] font-medium text-[#6B7280]">
              Active Trips
            </div>
            <div className="text-[16px] font-bold text-[#111827] tabular-nums mt-0.5">
              {activeDeliveries.length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-[#E5E7EB] px-3 py-2">
            <div className="text-[11px] font-medium text-[#6B7280]">
              Earned Today
            </div>
            <div className="text-[16px] font-bold text-[#6F42C1] tabular-nums mt-0.5">
              {formatNGN(totalEarnings)}
            </div>
          </div>
        </div>
      </section>

      {/* TAB 1: REQUESTS */}
      {navTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
              Ready for Pickup ({readyRequests.length})
            </h2>
            <span className="text-[12px] font-medium text-[#6B7280]">
              Live Dispatch Feed
            </span>
          </div>

          {!isOnline && (
            <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[13px] font-medium text-[#92400E]">
              You are currently Offline. Toggle Online above to accept new Lagos delivery requests.
            </div>
          )}

          {readyRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center space-y-2">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
                <ClipboardList className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111827]">
                No ready pickups right now
              </h3>
              <p className="text-[13px] text-[#6B7280] leading-[1.45]">
                Once a restaurant marks an order Ready for Rider, it appears here immediately for pickup.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyRequests.map((ord) => {
                const tip = ord.riderTip ?? 0;
                const payout =
                  ord.riderEarnings ??
                  calculateRiderEarnings(ord.deliveryFee, tip);
                return (
                  <article
                    key={ord.orderId}
                    className="bg-white rounded-2xl border border-[#D0BCFC] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F4EFFF] text-[#6F42C1] text-[11px] font-semibold">
                          Ready for Pickup · #{ord.orderId}
                        </span>
                        <h3 className="text-[15px] font-semibold text-[#111827] mt-1.5">
                          {ord.vendorName}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-medium text-[#6B7280]">
                          Your Payout
                        </div>
                        <div className="text-[16px] font-bold text-[#16A34A] tabular-nums">
                          {formatNGN(payout)}
                        </div>
                        {tip > 0 && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-semibold mt-1">
                            <Heart className="w-2.5 h-2.5" aria-hidden="true" />
                            <span>+{formatNGN(tip)} tip</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] p-3 space-y-2 text-[13px]">
                      <div className="flex items-start gap-2">
                        <Store
                          className="w-4 h-4 text-[#6F42C1] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-[#6B7280]">
                            Pickup Location
                          </div>
                          <div className="font-semibold text-[#111827]">
                            {ord.vendorName} · {getVendorAddress(ord.vendorId)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin
                          className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-[#6B7280]">
                            Customer Drop-off
                          </div>
                          <div className="font-semibold text-[#111827]">
                            {ord.deliveryAddress}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[12px] text-[#6B7280]">
                      {ord.items.length} item(s) ·{' '}
                      {ord.takeawayPackCount ?? 1}{' '}
                      {(ord.takeawayPackCount ?? 1) === 1 ? 'pack' : 'packs'}
                      {ord.ecoPackaging ? ' · Brown Eco Packaging' : ''}
                    </div>

                    <button
                      type="button"
                      disabled={!isOnline}
                      onClick={() => {
                        onAcceptDelivery(ord.orderId);
                        setNavTab('active');
                      }}
                      className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] disabled:opacity-50 text-[#111827] text-[14px] font-semibold cursor-pointer transition-colors"
                    >
                      Accept Delivery · Earn {formatNGN(payout)}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {/* Upcoming Kitchen Queue Preview */}
          {kitchenQueue.length > 0 && (
            <section className="space-y-2.5 pt-2">
              <h3 className="text-[14px] font-bold text-[#111827]">
                Preparing in Kitchens ({kitchenQueue.length})
              </h3>
              <div className="space-y-2">
                {kitchenQueue.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[#111827] truncate">
                        {ord.vendorName} → {ord.zoneLabel}
                      </div>
                      <div className="text-[12px] text-[#6B7280]">
                        #{ord.orderId} · Stage: {ord.currentStage.replace('_', ' ')}
                        {(ord.riderTip ?? 0) > 0 &&
                          ` · +${formatNGN(ord.riderTip ?? 0)} tip`}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF8F4] border border-[#E5E7EB] text-[11px] font-medium text-[#6B7280] shrink-0">
                      Kitchen Prep
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE DELIVERY */}
      {navTab === 'active' && (
        <div className="space-y-4">
          <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
            Active Deliveries ({activeDeliveries.length})
          </h2>

          {activeDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center space-y-2.5">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center">
                <Navigation className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111827]">
                No active trip right now
              </h3>
              <p className="text-[13px] text-[#6B7280]">
                Accept a ready request from the Requests tab to start a delivery.
              </p>
              <button
                type="button"
                onClick={() => setNavTab('requests')}
                className="h-10 px-4 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[13px] font-semibold cursor-pointer"
              >
                View Ready Requests
              </button>
            </div>
          ) : (
            activeDeliveries.map((ord) => {
              const tip = ord.riderTip ?? 0;
              const payout =
                ord.riderEarnings ??
                calculateRiderEarnings(ord.deliveryFee, tip);
              const isAssignedOnly = ord.currentStage === 'rider_assigned';
              const msgCount = orderMessages?.[ord.orderId]?.length ?? 0;

              return (
                <article
                  key={ord.orderId}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isAssignedOnly
                            ? 'bg-[#F4EFFF] text-[#6F42C1]'
                            : 'bg-[#DCFCE7] text-[#16A34A]'
                        }`}
                      >
                        {isAssignedOnly
                          ? 'Heading to Restaurant'
                          : 'Picked Up · On the Way'}
                      </span>
                      <h3 className="text-[16px] font-bold text-[#111827] mt-1">
                        Order #{ord.orderId} · {ord.vendorName}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-bold text-[#111827] tabular-nums">
                        {formatNGN(payout)}
                      </div>
                      {tip > 0 && (
                        <div className="text-[10px] font-semibold text-[#16A34A] tabular-nums">
                          +{formatNGN(tip)} tip
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stylized Interactive Live Delivery Map */}
                  <LiveDeliveryMap
                    order={ord}
                    vendorAddress={getVendorAddress(ord.vendorId)}
                    viewerRole="rider"
                  />

                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex items-start gap-2">
                      <Store
                        className="w-4 h-4 text-[#6F42C1] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <div className="text-[11px] font-medium text-[#6B7280]">
                          Pickup
                        </div>
                        <div className="font-semibold text-[#111827]">
                          {ord.vendorName} ({getVendorAddress(ord.vendorId)})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <div className="text-[11px] font-medium text-[#6B7280]">
                          Drop-off
                        </div>
                        <div className="font-semibold text-[#111827]">
                          {ord.deliveryAddress}
                        </div>
                        <div className="text-[12px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" aria-hidden="true" />
                          <span className="tabular-nums">{ord.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {ord.vendorNote && (
                    <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] text-[12px] text-[#111827]">
                      <strong>Packing Note:</strong> {ord.vendorNote}
                    </div>
                  )}

                  {/* Chat Customer Button */}
                  <button
                    type="button"
                    onClick={() => onOpenOrderChat(ord.orderId)}
                    className="w-full h-10 rounded-xl bg-[#F4EFFF] hover:bg-[#D0BCFC] border border-[#D0BCFC] text-[#111827] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
                    <span>Chat Customer</span>
                    {msgCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white text-[#6F42C1] text-[10px] font-bold tabular-nums">
                        {msgCount}
                      </span>
                    )}
                  </button>

                  {isAssignedOnly ? (
                    <button
                      type="button"
                      onClick={() => onMarkPickedUp(ord.orderId)}
                      className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[14px] font-semibold cursor-pointer"
                    >
                      Mark Picked Up &amp; On the Way
                    </button>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E5E7EB] space-y-2">
                        <label
                          htmlFor={`pin-${ord.orderId}`}
                          className="flex items-center justify-between text-[12px] font-medium text-[#111827]"
                        >
                          <span className="inline-flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-[#6F42C1]" aria-hidden="true" />
                            <span>Customer 4-Digit Delivery PIN</span>
                          </span>
                          <span className="text-[11px] text-[#6B7280] tabular-nums">
                            Demo PIN: {ord.deliveryPin}
                          </span>
                        </label>
                        <input
                          id={`pin-${ord.orderId}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={pinInputs[ord.orderId] ?? ''}
                          onChange={(e) => {
                            setPinInputs((prev) => ({
                              ...prev,
                              [ord.orderId]: e.target.value,
                            }));
                            setPinErrors((prev) => ({ ...prev, [ord.orderId]: '' }));
                          }}
                          placeholder={`Enter ${ord.deliveryPin} or tap Delivered`}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E7EB] text-[14px] font-bold text-[#111827] tabular-nums tracking-widest focus:outline-none focus:border-[#A981FF]"
                        />
                        {pinErrors[ord.orderId] && (
                          <p className="text-[12px] font-medium text-[#B42318]">
                            {pinErrors[ord.orderId]}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCompleteWithPin(ord)}
                        className="w-full h-11 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" aria-hidden="true" />
                        <span>Mark Delivered &amp; Collect {formatNGN(payout)}</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: EARNINGS */}
      {navTab === 'earnings' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#F4EFFF] via-white to-[#FAF8F4] border border-[#D0BCFC] text-[#111827] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#6F42C1]">
              <Wallet className="w-4 h-4 text-[#6F42C1]" aria-hidden="true" />
              <span>Total Completed Payouts</span>
            </div>
            <div className="text-[24px] font-bold tabular-nums text-[#111827]">
              {formatNGN(totalEarnings)}
            </div>
            <div className="text-[12px] text-[#6B7280]">
              {completedDeliveries.length}{' '}
              {completedDeliveries.length === 1 ? 'trip' : 'trips'} completed · Instant Lagos payout (includes 100% of customer tips)
            </div>
          </div>

          <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
            Completed Trip History
          </h2>

          {completedDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-[13px] text-[#6B7280] text-center">
              Completed deliveries and payouts will appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedDeliveries.map((ord) => {
                const tip = ord.riderTip ?? 0;
                const payout =
                  ord.riderEarnings ??
                  calculateRiderEarnings(ord.deliveryFee, tip);
                return (
                  <div
                    key={ord.orderId}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>#{ord.orderId} · Delivered</span>
                      </div>
                      <div className="text-[14px] font-semibold text-[#111827] truncate mt-0.5">
                        {ord.vendorName} → {ord.zoneLabel}
                      </div>
                      <div className="text-[12px] text-[#6B7280]">
                        {ord.stageTimestamps.delivered ?? ord.createdAtLabel}
                        {tip > 0 && ` · Includes ${formatNGN(tip)} customer tip`}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-[#111827] tabular-nums shrink-0">
                      +{formatNGN(payout)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCOUNT & ROLE GATEWAY */}
      {navTab === 'account' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] font-bold text-[14px] flex items-center justify-center shrink-0">
                  {(currentUser?.name ?? 'TA')
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[#111827] truncate">
                    {currentUser?.name ?? 'Tunde Adeleke'}
                  </div>
                  <div className="text-[12px] text-[#6B7280] truncate">
                    {currentUser?.vehicle ?? 'Honda Ace 125'} ·{' '}
                    {currentUser?.plateNumber ?? 'KJA-482-CW'}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[11px] font-semibold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Verified
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex-1 h-10 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] text-[13px] font-semibold cursor-pointer"
              >
                Log In / Create Account
              </button>
              {currentUser && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="h-10 px-3.5 rounded-xl bg-[#FAF8F4] hover:bg-[#FEF3F2] border border-[#E5E7EB] text-[#B42318] text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5">
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111827]">
              Switch Role (Demo)
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Jump directly to Customer or Vendor portals with live shared orders.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acct) => {
                const active = acct.role === 'Rider';
                const Icon =
                  acct.role === 'Seller'
                    ? Store
                    : acct.role === 'Rider'
                      ? Bike
                      : ShoppingBag;
                return (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => onSwitchDemoRole(acct)}
                    className={`py-2.5 px-2 rounded-xl border text-[12px] font-semibold flex flex-col items-center gap-1 cursor-pointer ${
                      active
                        ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                        : 'bg-[#FAF8F4] hover:bg-[#F4EFFF] border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{acct.role === 'Seller' ? 'Vendor' : acct.role}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Floating Bottom Navigation Bar for Rider Portal */}
      <nav
        aria-label="Rider navigation"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[456px] z-30 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-full shadow-[0_8px_28px_rgba(169,129,255,0.18)] px-1.5 py-1"
      >
        <div className="grid grid-cols-4 gap-1">
          {[
            {
              id: 'requests' as const,
              label: 'Requests',
              icon: ClipboardList,
              badge: readyRequests.length,
            },
            {
              id: 'active' as const,
              label: 'Active',
              icon: Navigation,
              badge: activeDeliveries.length,
            },
            {
              id: 'earnings' as const,
              label: 'Earnings',
              icon: Wallet,
              badge: 0,
            },
            {
              id: 'account' as const,
              label: 'Account',
              icon: User,
              badge: 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = navTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setNavTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F4EFFF] text-[#6F42C1] font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#FAF8F4] font-medium'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-[18px] h-[18px] ${
                      isActive ? 'text-[#6F42C1]' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#A981FF] text-[#111827] text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-none whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
