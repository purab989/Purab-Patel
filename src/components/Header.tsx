import React from 'react';
import {
  MessageSquare,
  BarChart3,
  Monitor,
  ShieldCheck,
  Building2,
  Code2,
  Sparkles,
} from 'lucide-react';
import { FACTORIES } from '../constants/languages';

interface HeaderProps {
  currentTab: 'whatsapp' | 'kiosk' | 'hr';
  setCurrentTab: (tab: 'whatsapp' | 'kiosk' | 'hr') => void;
  selectedFactory: string;
  setSelectedFactory: (factory: string) => void;
  onOpenWebhookModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  selectedFactory,
  setSelectedFactory,
  onOpenWebhookModal,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl tracking-wider">
            KS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100 bg-clip-text text-transparent">
                KaamSathi AI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                काम साथी
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Factory Policy Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multilingual Worker Companion & HR Confusion Meter
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
          <button
            onClick={() => setCurrentTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-300" />
            <span>Worker WhatsApp</span>
          </button>

          <button
            onClick={() => setCurrentTab('kiosk')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'kiosk'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Monitor className="w-4 h-4 text-blue-300" />
            <span>Factory Kiosk</span>
          </button>

          <button
            onClick={() => setCurrentTab('hr')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'hr'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>HR Confusion Meter</span>
          </button>
        </div>

        {/* Factory Selector & Webhook Inspector */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800 text-white">
                All Plants (Aggregate)
              </option>
              {FACTORIES.map((f) => (
                <option key={f} value={f} className="bg-slate-800 text-white">
                  {f}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenWebhookModal}
            title="Inspect WhatsApp Twilio/Meta Webhook architecture"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Webhook Specs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
