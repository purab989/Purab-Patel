import React, { useState } from 'react';
import { Code2, Send, CheckCircle2, Copy, Check } from 'lucide-react';

interface WhatsAppApiModalProps {
  onClose: () => void;
}

export const WhatsAppApiModal: React.FC<WhatsAppApiModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        From: '+919876543210',
        Body: 'Sunday ko maine 10 ghante kaam kiya tha, uska overtime rate kya hai?',
        ProfileName: 'Ramesh Yadav',
      },
      null,
      2
    )
  );
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  const handleTestWebhook = async () => {
    setIsSending(true);
    try {
      const parsed = JSON.parse(testPayload);
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setWebhookResponse(data);
    } catch (e) {
      alert('Invalid JSON or server error: ' + e);
    } finally {
      setIsSending(false);
    }
  };

  const sampleCurl = `curl -X POST https://${window.location.host}/api/whatsapp/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "From": "+919876543210",
    "Body": "Mera overtime kitna milega?"
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                WhatsApp Webhook Architecture (Meta & Twilio Compatible)
              </h3>
              <p className="text-xs text-slate-400">
                Live backend endpoint: <code className="text-emerald-400">/api/whatsapp/webhook</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-300 mb-1">
              Production Webhook Architecture Flow:
            </h4>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-mono text-[11px]">
              Worker WhatsApp Chat → Meta / Twilio Webhook → /api/whatsapp/webhook → Factory Policy Grounding (Gemini 3.8 Flash) → Anonymized Query Pattern Logger → KaamSathi WhatsApp Reply
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-300">Test Webhook Payload (JSON):</span>
              <button
                onClick={handleTestWebhook}
                disabled={isSending}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{isSending ? 'Sending...' : 'Send Test Webhook'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {webhookResponse && (
            <div>
              <span className="font-bold text-slate-300 block mb-1">
                Webhook Response Body (Sent back to WhatsApp API):
              </span>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto text-[11px]">
                {JSON.stringify(webhookResponse, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-300">Direct cURL Command:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sampleCurl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400 font-mono text-[11px] overflow-x-auto">
              {sampleCurl}
            </pre>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
