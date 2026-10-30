/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { WorkerKiosk } from './components/WorkerKiosk';
import { ConfusionMeterDashboard } from './components/ConfusionMeterDashboard';
import { PolicyManager } from './components/PolicyManager';
import { QueryLogViewer } from './components/QueryLogViewer';
import { NoticeGeneratorModal } from './components/NoticeGeneratorModal';
import { WhatsAppApiModal } from './components/WhatsAppApiModal';
import { Policy, QueryLog, ConfusionMetrics } from './types';
import {
  BarChart3,
  FileCheck2,
  ListFilter,
  Sparkles,
  ShieldCheck,
  Building,
  RefreshCw,
  Users,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'whatsapp' | 'kiosk' | 'hr'>('whatsapp');
  const [hrSubTab, setHrSubTab] = useState<'confusion' | 'policies' | 'logs'>('confusion');
  const [selectedFactory, setSelectedFactory] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [queries, setQueries] = useState<QueryLog[]>([]);
  const [metrics, setMetrics] = useState<ConfusionMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

  // Modals
  const [activeNoticeTopic, setActiveNoticeTopic] = useState<{ topic: string; reason: string } | null>(null);
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/policies');
      const data = await res.json();
      if (data.policies) {
        setPolicies(data.policies);
      }
    } catch (e) {
      console.error('Failed to load policies:', e);
    }
  };

  // Fetch queries & confusion metrics
  const fetchMetricsAndLogs = async () => {
    setIsLoadingMetrics(true);
    try {
      const [metricsRes, queriesRes] = await Promise.all([
        fetch(`/api/analytics/confusion-meter?factory=${selectedFactory}&shift=${selectedShift}`),
        fetch('/api/queries?limit=100'),
      ]);

      const metricsData = await metricsRes.json();
      const queriesData = await queriesRes.json();

      setMetrics(metricsData);
      if (queriesData.queries) {
        setQueries(queriesData.queries);
      }
    } catch (e) {
      console.error('Failed to load metrics:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchMetricsAndLogs();
  }, [selectedFactory, selectedShift]);

  // Quick action: Test policy in bot
  const handleTestPolicyInBot = (_query: string) => {
    setCurrentTab('whatsapp');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedFactory={selectedFactory}
        setSelectedFactory={setSelectedFactory}
        onOpenWebhookModal={() => setShowWebhookModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: Worker WhatsApp View */}
        {currentTab === 'whatsapp' && (
          <div className="animate-fade-in">
            <WhatsAppSimulator
              selectedFactory={selectedFactory}
              onNewWorkerQuery={() => {
                fetchMetricsAndLogs();
              }}
            />
          </div>
        )}

        {/* TAB 2: Factory Floor Kiosk View */}
        {currentTab === 'kiosk' && (
          <div className="animate-fade-in">
            <WorkerKiosk
              selectedFactory={selectedFactory}
              onNewWorkerQuery={() => {
                fetchMetricsAndLogs();
              }}
            />
          </div>
        )}

        {/* TAB 3: HR & Supervisor Portal */}
        {currentTab === 'hr' && (
          <div className="space-y-6 animate-fade-in">
            {/* HR Navigation Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHrSubTab('confusion')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    hrSubTab === 'confusion'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Confusion Meter Dashboard</span>
                </button>

                <button
                  onClick={() => setHrSubTab('policies')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    hrSubTab === 'policies'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Centralized Policy Manager ({policies.length})</span>
                </button>

                <button
                  onClick={() => setHrSubTab('logs')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    hrSubTab === 'logs'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>Query Pattern Audit Logs ({queries.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pr-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Real-Time Confusion Engine Active</span>
              </div>
            </div>

            {/* Sub-tab Views */}
            {hrSubTab === 'confusion' && (
              <ConfusionMeterDashboard
                metrics={metrics}
                selectedFactory={selectedFactory}
                setSelectedFactory={setSelectedFactory}
                selectedShift={selectedShift}
                setSelectedShift={setSelectedShift}
                onSelectTopicForNotice={(topic, reason) =>
                  setActiveNoticeTopic({ topic, reason })
                }
                onGoToPolicies={() => setHrSubTab('policies')}
                isLoading={isLoadingMetrics}
              />
            )}

            {hrSubTab === 'policies' && (
              <PolicyManager
                policies={policies}
                onRefreshPolicies={() => {
                  fetchPolicies();
                  fetchMetricsAndLogs();
                }}
                onTestPolicyInBot={handleTestPolicyInBot}
              />
            )}

            {hrSubTab === 'logs' && (
              <QueryLogViewer
                queries={queries}
                onRefresh={() => fetchMetricsAndLogs()}
              />
            )}
          </div>
        )}
      </main>

      {/* AI Factory Notice Generator Modal */}
      {activeNoticeTopic && (
        <NoticeGeneratorModal
          topic={activeNoticeTopic.topic}
          reason={activeNoticeTopic.reason}
          onClose={() => setActiveNoticeTopic(null)}
        />
      )}

      {/* WhatsApp Webhook Inspector Modal */}
      {showWebhookModal && (
        <WhatsAppApiModal onClose={() => setShowWebhookModal(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            KaamSathi AI (काम साथी) — Multilingual Worker Companion & HR Confusion Meter
          </span>
          <span className="flex items-center gap-2">
            <span>Powered by Gemini 3.8 Flash</span>
            <span>•</span>
            <span>WhatsApp Meta / Twilio Architecture</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
