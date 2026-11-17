import { useState } from 'react';
import { Bike, Clock, LocateFixed, MapPin, Navigation, Store } from 'lucide-react';
import type { OrderRecord } from '../types/chopwize';

interface LiveDeliveryMapProps {
  order: OrderRecord;
  vendorAddress?: string;
  viewerRole?: 'customer' | 'rider';
}

interface StopPoint {
  id: 'vendor' | 'rider' | 'customer';
  label: string;
  sublabel: string;
  x: number;
  y: number;
}

function getStageProgress(stage: OrderRecord['currentStage']): {
  ratio: number;
  etaMins: number;
  distanceLabel: string;
  statusHeadline: string;
} {
  switch (stage) {
    case 'submitted':
      return {
        ratio: 0.08,
        etaMins: 28,
        distanceLabel: '2.4 km away',
        statusHeadline: 'Order queued at kitchen',
      };
    case 'accepted':
      return {
        ratio: 0.12,
        etaMins: 24,
        distanceLabel: '2.4 km away',
        statusHeadline: 'Kitchen preparing order',
      };
    case 'preparing':
      return {
        ratio: 0.16,
        etaMins: 19,
        distanceLabel: '2.4 km away',
        statusHeadline: 'Cooking fresh · Rider on standby',
      };
    case 'ready':
      return {
        ratio: 0.22,
        etaMins: 15,
        distanceLabel: '2.1 km away',
        statusHeadline: 'Ready for pickup at counter',
      };
    case 'rider_assigned':
      return {
        ratio: 0.42,
        etaMins: 12,
        distanceLabel: '1.5 km to drop-off',
        statusHeadline: 'Rider approaching restaurant',
      };
    case 'in_transit':
      return {
        ratio: 0.72,
        etaMins: 6,
        distanceLabel: '0.7 km away',
        statusHeadline: 'En route via Admiralty Way',
      };
    case 'delivered':
      return {
        ratio: 1,
        etaMins: 0,
        distanceLabel: 'Arrived',
        statusHeadline: 'Delivered to destination',
      };
  }
}

function getPointOnRoute(t: number): { x: number; y: number } {
  // Smooth multi-segment route from Vendor (58, 128) -> Junction (168, 76) -> Bridge (258, 92) -> Customer (332, 46)
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= 0.38) {
    const k = clamped / 0.38;
    return {
      x: 58 + (168 - 58) * k,
      y: 128 + (76 - 128) * k,
    };
  }
  if (clamped <= 0.72) {
    const k = (clamped - 0.38) / 0.34;
    return {
      x: 168 + (258 - 168) * k,
      y: 76 + (92 - 76) * k,
    };
  }
  const k = (clamped - 0.72) / 0.28;
  return {
    x: 258 + (332 - 258) * k,
    y: 92 + (46 - 92) * k,
  };
}

export function LiveDeliveryMap({
  order,
  vendorAddress = 'Victoria Island, Lagos',
  viewerRole = 'customer',
}: LiveDeliveryMapProps) {
  const [focusRider, setFocusRider] = useState(false);
  const [selectedPin, setSelectedPin] = useState<'vendor' | 'rider' | 'customer'>(
    'rider'
  );

  const stageMeta = getStageProgress(order.currentStage);
  const riderPoint = getPointOnRoute(stageMeta.ratio);

  const stops: StopPoint[] = [
    {
      id: 'vendor',
      label: order.vendorName,
      sublabel: `Pickup · ${vendorAddress}`,
      x: 58,
      y: 128,
    },
    {
      id: 'rider',
      label: `${order.rider.name} · ${order.rider.vehicle}`,
      sublabel: stageMeta.statusHeadline,
      x: riderPoint.x,
      y: riderPoint.y,
    },
    {
      id: 'customer',
      label: viewerRole === 'rider' ? 'Customer Drop-off' : 'Your Delivery Pin',
      sublabel: order.deliveryAddress,
      x: 332,
      y: 46,
    },
  ];

  const activeStop = stops.find((s) => s.id === selectedPin) ?? stops[1];

  const completedPathD =
    stageMeta.ratio <= 0.38
      ? `M 58 128 L ${riderPoint.x.toFixed(1)} ${riderPoint.y.toFixed(1)}`
      : stageMeta.ratio <= 0.72
        ? `M 58 128 L 168 76 L ${riderPoint.x.toFixed(1)} ${riderPoint.y.toFixed(1)}`
        : `M 58 128 L 168 76 L 258 92 L ${riderPoint.x.toFixed(1)} ${riderPoint.y.toFixed(1)}`;

  const viewBox = focusRider
    ? `${Math.max(0, riderPoint.x - 115).toFixed(0)} ${Math.max(0, riderPoint.y - 52).toFixed(0)} 230 105`
    : '0 0 380 172';

  return (
    <div
      aria-label="Interactive delivery route map"
      className="rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] overflow-hidden"
    >
      {/* Top Map Status Strip */}
      <div className="px-3.5 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center shrink-0">
            <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-[#111827] truncate">
              {stageMeta.statusHeadline}
            </div>
            <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 tabular-nums">
              <span className="inline-flex items-center gap-0.5 text-[#6F42C1] font-semibold">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {stageMeta.etaMins > 0 ? `${stageMeta.etaMins} mins ETA` : 'Arrived'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{stageMeta.distanceLabel}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFocusRider((v) => !v)}
          aria-pressed={focusRider}
          className={`h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border transition-colors shrink-0 cursor-pointer ${
            focusRider
              ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
              : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#111827] hover:bg-[#F4EFFF]'
          }`}
        >
          <LocateFixed className="w-3 h-3" aria-hidden="true" />
          <span>{focusRider ? 'Full Route' : 'Focus Rider'}</span>
        </button>
      </div>

      {/* Stylized Airy Lagos Map Canvas */}
      <div className="relative bg-[#FAF8F4]">
        <svg
          viewBox={viewBox}
          className="w-full h-40 block select-none transition-all duration-300"
          role="img"
          aria-label={`Route from ${order.vendorName} to ${order.deliveryAddress}`}
        >
          {/* Base Map Canvas */}
          <rect x="0" y="0" width="380" height="172" fill="#FAF8F4" />

          {/* Lagos Lagoon Accent Strip */}
          <path
            d="M 185 0 C 202 52, 224 104, 214 172 L 244 172 C 254 104, 232 52, 214 0 Z"
            fill="#EDE9FE"
            opacity="0.7"
          />

          {/* City Blocks (Crisp White Cards) */}
          <rect x="18" y="18" width="70" height="44" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="104" y="16" width="66" height="40" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="26" y="88" width="68" height="58" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="116" y="96" width="68" height="54" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="256" y="18" width="102" height="52" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="262" y="106" width="94" height="48" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />

          {/* Road Network */}
          <path
            d="M 0 74 L 188 74 L 258 92 L 380 92"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 0 74 L 188 74 L 258 92 L 380 92"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 96 0 L 96 172 M 168 0 L 168 172 M 292 0 L 292 172"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1.2"
          />

          {/* Street Labels */}
          <text x="112" y="69" fontSize="7.5" fill="#6B7280" fontWeight="600">
            Admiralty Way
          </text>
          <text x="206" y="86" fontSize="7" fill="#6F42C1" fontWeight="600">
            Link Bridge
          </text>
          <text x="296" y="34" fontSize="7.5" fill="#6B7280" fontWeight="600">
            {order.zoneLabel.split(',')[0]}
          </text>

          {/* Planned Remaining Route Line */}
          <path
            d="M 58 128 L 168 76 L 258 92 L 332 46"
            fill="none"
            stroke="#D0BCFC"
            strokeWidth="4"
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Completed Active Route Progress */}
          <path
            d={completedPathD}
            fill="none"
            stroke="#A981FF"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vendor Pickup Pin */}
          <g
            onClick={() => setSelectedPin('vendor')}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`Inspect pickup point ${order.vendorName}`}
          >
            <circle
              cx="58"
              cy="128"
              r={selectedPin === 'vendor' ? 14 : 11}
              fill="#FFFFFF"
              stroke="#6F42C1"
              strokeWidth="2.5"
            />
            <circle cx="58" cy="128" r="4.5" fill="#6F42C1" />
          </g>

          {/* Customer Drop-off Pin */}
          <g
            onClick={() => setSelectedPin('customer')}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`Inspect destination ${order.deliveryAddress}`}
          >
            <circle
              cx="332"
              cy="46"
              r={selectedPin === 'customer' ? 14 : 11}
              fill="#FFFFFF"
              stroke="#16A34A"
              strokeWidth="2.5"
            />
            <circle cx="332" cy="46" r="4.5" fill="#16A34A" />
          </g>

          {/* Animated Moving Rider Pin */}
          <g
            onClick={() => setSelectedPin('rider')}
            className="cursor-pointer transition-all duration-500"
            role="button"
            tabIndex={0}
            aria-label={`Inspect live rider ${order.rider.name}`}
          >
            <circle
              cx={riderPoint.x}
              cy={riderPoint.y}
              r="18"
              fill="#D0BCFC"
              opacity="0.45"
            >
              <animate
                attributeName="r"
                values="13;20;13"
                dur="2.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.55;0.15;0.55"
                dur="2.2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={riderPoint.x}
              cy={riderPoint.y}
              r="12.5"
              fill="#A981FF"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <circle cx={riderPoint.x} cy={riderPoint.y} r="4" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Floating Quick Pin Selector Chips */}
        <div className="px-3 py-2 bg-white border-t border-[#E5E7EB] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-[#F4EFFF] text-[#6F42C1] flex items-center justify-center shrink-0">
              {activeStop.id === 'vendor' ? (
                <Store className="w-3.5 h-3.5" aria-hidden="true" />
              ) : activeStop.id === 'customer' ? (
                <MapPin className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
              ) : (
                <Bike className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[#111827] truncate">
                {activeStop.label}
              </div>
              <div className="text-[11px] text-[#6B7280] truncate">
                {activeStop.sublabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                { id: 'vendor', label: 'Pickup' },
                { id: 'rider', label: 'Rider' },
                { id: 'customer', label: 'Drop' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedPin(btn.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                  selectedPin === btn.id
                    ? 'bg-[#F4EFFF] border-[#A981FF] text-[#6F42C1]'
                    : 'bg-[#FAF8F4] border-[#E5E7EB] text-[#6B7280]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
