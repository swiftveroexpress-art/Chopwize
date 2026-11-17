import { useEffect, useRef, useState } from 'react';
import { Bike, Send, User, X } from 'lucide-react';
import type { OrderChatMessage, OrderRecord } from '../types/chopwize';

interface RiderCustomerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  viewerRole: 'customer' | 'rider';
  messages: OrderChatMessage[];
  onSendMessage: (orderId: string, text: string, senderRole: 'customer' | 'rider') => void;
}

const CUSTOMER_QUICK_REPLIES = [
  "I'm at the estate gate now",
  'Please call security at the reception',
  'Leave package with the gateman, PIN is ready',
];

const RIDER_QUICK_REPLIES = [
  'Picked up your sealed order, on the way!',
  '5 mins away via Admiralty Way',
  'At the gate now — please share your 4-digit PIN',
];

export function RiderCustomerChatModal({
  isOpen,
  onClose,
  order,
  viewerRole,
  messages,
  onSendMessage,
}: RiderCustomerChatModalProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isOpen, messages.length]);

  if (!isOpen || !order) return null;

  const quickReplies =
    viewerRole === 'customer' ? CUSTOMER_QUICK_REPLIES : RIDER_QUICK_REPLIES;

  const counterpartyName =
    viewerRole === 'customer' ? order.rider.name : 'Customer';

  function handleSend(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || !order) return;
    onSendMessage(order.orderId, trimmed, viewerRole);
    setDraft('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#FAF8F4]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Order #${order.orderId} live chat`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl border border-[#E5E7EB] shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#E5E7EB] bg-[#FAF8F4] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-[#F4EFFF] border border-[#D0BCFC] text-[#6F42C1] flex items-center justify-center shrink-0">
              {viewerRole === 'customer' ? (
                <Bike className="w-4 h-4" aria-hidden="true" />
              ) : (
                <User className="w-4 h-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-[#111827] truncate">
                {counterpartyName} · Order #{order.orderId}
              </div>
              <div className="text-[11px] text-[#6B7280] truncate">
                {viewerRole === 'customer'
                  ? `${order.rider.vehicle} (${order.rider.plateNumber})`
                  : order.deliveryAddress}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close delivery chat"
            className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F4EFFF] text-[#111827] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Message Feed */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#FAF8F4] min-h-[220px] max-h-[340px]"
        >
          {messages.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-[#6B7280]">
              Send a message to coordinate pickup or estate gate entry for Order #{order.orderId}.
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderRole === viewerRole;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-snug ${
                      isMine
                        ? 'bg-[#A981FF] text-[#111827] font-medium rounded-br-md'
                        : 'bg-white border border-[#E5E7EB] text-[#111827] rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 px-1">
                    {isMine ? 'You' : msg.senderName} · {msg.timestampLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Reply Chips + Input Bar */}
        <div className="p-3.5 bg-white border-t border-[#E5E7EB] space-y-2.5 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSend(reply)}
                className="px-3 py-1.5 rounded-full bg-[#F4EFFF] hover:bg-[#D0BCFC] border border-[#D0BCFC] text-[#111827] text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(draft);
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="live-order-chat-input" className="sr-only">
              Type a message
            </label>
            <input
              id="live-order-chat-input"
              type="text"
              enterKeyHint="send"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${counterpartyName}...`}
              className="flex-1 h-10 px-3.5 rounded-full bg-[#FAF8F4] border border-[#E5E7EB] text-[13px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#A981FF]"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-[#A981FF] hover:bg-[#B796FE] text-[#111827] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
