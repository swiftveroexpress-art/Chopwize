import { useEffect, useState } from 'react';
import { ArrowUp, Mic, MicOff, X } from 'lucide-react';
import { DEMO_VOICE_TRANSCRIPTS } from '../data/mockMarketplace';

interface VoiceMicModalProps {
  isOpen: boolean;
  demoMode: boolean;
  initialText?: string;
  onClose: () => void;
  onSubmitTranscript: (transcript: string) => void;
}

export function VoiceMicModal({
  isOpen,
  demoMode,
  initialText = '',
  onClose,
  onSubmitTranscript,
}: VoiceMicModalProps) {
  const [listening, setListening] = useState(true);
  const [transcript, setTranscript] = useState(
    initialText || DEMO_VOICE_TRANSCRIPTS[0].transcript
  );

  useEffect(() => {
    if (!isOpen) return;
    setListening(true);
    if (initialText.trim()) {
      setTranscript(initialText);
    }
  }, [isOpen, initialText]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#FAF8F4]/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-mic-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#F4EFFF] via-[#FAF8F4] to-white border-b border-[#E5E7EB] text-[#111827] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#A981FF] text-[#111827] flex items-center justify-center">
              <Mic className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="voice-mic-heading" className="font-display text-sm font-extrabold text-[#111827]">
                Chopwize Voice-to-Text
              </h2>
              <p className="text-[11px] font-medium text-[#6F42C1]">
                {demoMode
                  ? 'Tap a sample or edit transcript'
                  : 'Speak naturally or refine your transcript'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice popup"
            className="w-8 h-8 rounded-full bg-white hover:bg-[#F4EFFF] border border-[#E5E7EB] flex items-center justify-center text-[#111827] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Interactive Mic Toggle */}
          <div className="flex flex-col items-center text-center space-y-2 py-2">
            <button
              type="button"
              onClick={() => setListening((l) => !l)}
              aria-pressed={listening}
              aria-label={listening ? 'Pause voice capture' : 'Resume voice capture'}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                listening
                  ? 'bg-[#A981FF] text-[#111827] ring-4 ring-[#D0BCFC]/70'
                  : 'bg-[#FAF8F4] border border-[#E5E7EB] text-[#111827]'
              }`}
            >
              {listening ? (
                <Mic className="w-7 h-7" aria-hidden="true" />
              ) : (
                <MicOff className="w-7 h-7" aria-hidden="true" />
              )}
            </button>
            <div className="text-xs font-bold text-[#111827]">
              {listening
                ? 'Listening for Nigerian dishes, drinks, or bulk litres...'
                : 'Capture paused — edit text below or tap mic'}
            </div>
          </div>

          {/* Sample Voice Clips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[#6B7280]">
              Quick Voice Samples (Tap to load)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_VOICE_TRANSCRIPTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setTranscript(sample.transcript);
                    setListening(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                    transcript === sample.transcript
                      ? 'bg-[#A981FF] text-[#111827] font-bold'
                      : 'bg-[#FAF8F4] hover:bg-[#F4EFFF] border border-[#E5E7EB] text-[#111827]'
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Transcript */}
          <div className="space-y-1.5">
            <label
              htmlFor="voice-transcript-textarea"
              className="block text-xs font-bold text-[#111827]"
            >
              Live Transcript (Editable)
            </label>
            <textarea
              id="voice-transcript-textarea"
              rows={3}
              enterKeyHint="send"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && transcript.trim()) {
                  e.preventDefault();
                  onSubmitTranscript(transcript.trim());
                  onClose();
                }
              }}
              placeholder="Speak or type what you want to eat, drink, or order..."
              className="w-full p-3 rounded-2xl bg-[#FAF8F4] border border-[#E5E7EB] text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#A981FF]"
            />
          </div>

          <button
            type="button"
            disabled={!transcript.trim()}
            onClick={() => {
              onSubmitTranscript(transcript.trim());
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-[#A981FF] hover:bg-[#B796FE] disabled:opacity-50 text-[#111827] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
            <span>Ask Chopwize</span>
          </button>
        </div>
      </div>
    </div>
  );
}
