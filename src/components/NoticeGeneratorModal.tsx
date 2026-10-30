import React, { useState, useEffect } from 'react';
import { Sparkles, Printer, Copy, Check, FileText } from 'lucide-react';

interface NoticeGeneratorModalProps {
  topic: string;
  reason: string;
  onClose: () => void;
}

export const NoticeGeneratorModal: React.FC<NoticeGeneratorModalProps> = ({
  topic,
  reason,
  onClose,
}) => {
  const [noticeContent, setNoticeContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generate() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/broadcast/generate-notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, reason }),
        });
        const data = await res.json();
        setNoticeContent(data.noticeText || '');
      } catch (e) {
        console.error('Failed to generate notice:', e);
      } finally {
        setIsLoading(false);
      }
    }
    generate();
  }, [topic, reason]);

  const handleCopy = () => {
    navigator.clipboard.writeText(noticeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                AI Factory Clarification Notice Generator
              </h3>
              <p className="text-xs text-slate-400">
                Triggered for topic "{topic}" to reduce Confusion Score on shop floors
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-amber-300 font-medium">
                Drafting multilingual factory notice in Hindi, Bengali & English with simplified phrasing...
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200 leading-relaxed shadow-inner">
              {noticeContent}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-slate-400">
            Ready to post on canteen notice boards or broadcast via supervisor WhatsApp groups.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Notice'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
