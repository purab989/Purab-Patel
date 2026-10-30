import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  Users,
  MessageCircle,
  Mic,
  ArrowRight,
  Sparkles,
  Info,
  Building2,
  Clock,
  FileText,
  Volume2,
} from 'lucide-react';
import { ConfusionMetrics, TopicMetric } from '../types';

interface ConfusionMeterDashboardProps {
  metrics: ConfusionMetrics | null;
  selectedFactory: string;
  setSelectedFactory: (factory: string) => void;
  selectedShift: string;
  setSelectedShift: (shift: string) => void;
  onSelectTopicForNotice: (topic: string, reason: string) => void;
  onGoToPolicies: () => void;
  isLoading: boolean;
}

export const ConfusionMeterDashboard: React.FC<ConfusionMeterDashboardProps> = ({
  metrics,
  selectedFactory,
  setSelectedFactory,
  selectedShift,
  setSelectedShift,
  onSelectTopicForNotice,
  onGoToPolicies,
  isLoading,
}) => {
  const [selectedTopicDrilldown, setSelectedTopicDrilldown] = useState<TopicMetric | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  if (isLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Calculating Confusion Meter metrics across factory floors...</p>
      </div>
    );
  }

  const {
    topics,
    totalQueries,
    languageCounts,
    channelCounts,
    voiceSharePercentage,
    overallConfusionAverage,
    mostConfusingTopic,
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Top Controls & Formula Explainer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Confusion Meter Dashboard
            </h2>
            <button
              onClick={() => setShowFormulaModal(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3" />
              <span>How Confusion Score is Calculated</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time quantification of worker misunderstandings derived from repeated questions, follow-up chains, and feedback ratings.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800 text-white">All Factories</option>
              <option value="Manesar Auto Unit 1" className="bg-slate-800 text-white">Manesar Auto Unit 1</option>
              <option value="Surat Textile Mills" className="bg-slate-800 text-white">Surat Textile Mills</option>
              <option value="Chennai Auto Hub" className="bg-slate-800 text-white">Chennai Auto Hub</option>
              <option value="Pune Foundry" className="bg-slate-800 text-white">Pune Foundry</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800 text-white">All Shifts</option>
              <option value="Morning" className="bg-slate-800 text-white">Morning Shift (06:00 - 14:00)</option>
              <option value="Evening" className="bg-slate-800 text-white">Evening Shift (14:00 - 22:00)</option>
              <option value="Night" className="bg-slate-800 text-white">Night Shift C (22:00 - 06:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Confusion Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Confusion Index</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overallConfusionAverage}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1 font-medium">
            <span>Critical Topic: {mostConfusingTopic?.label || 'None'}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overallConfusionAverage > 60
                  ? 'bg-rose-500'
                  : overallConfusionAverage > 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${overallConfusionAverage}%` }}
            ></div>
          </div>
        </div>

        {/* Total Logged Queries */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Queries Logged</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalQueries}</span>
            <span className="text-xs text-emerald-400">+18% this week</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Across WhatsApp, Gate Kiosks & Voice
          </p>
        </div>

        {/* Voice Query Share */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Voice Command Share</span>
            <Mic className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{voiceSharePercentage}%</span>
            <span className="text-xs text-indigo-300">Voice-first</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Crucial metric for low-literacy workers
          </p>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Primary Channels</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xs space-y-1 mt-1">
            <div className="flex justify-between text-slate-300">
              <span>WhatsApp:</span>
              <span className="font-bold text-emerald-400">{channelCounts.whatsapp}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Gate Kiosk:</span>
              <span className="font-bold text-blue-400">{channelCounts.web_kiosk}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Voice Kiosk:</span>
              <span className="font-bold text-indigo-400">{channelCounts.voice_kiosk}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Confusion Rankings Table & Drilldown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ranked Confusing Topics */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">
                Topic Confusion Rankings
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by highest confusion score. Click any topic to inspect worker doubts.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
              {topics.length} Monitored Topics
            </span>
          </div>

          <div className="space-y-3">
            {topics.map((t) => {
              const isSelected = selectedTopicDrilldown?.topic === t.topic;
              return (
                <div
                  key={t.topic}
                  onClick={() => setSelectedTopicDrilldown(t)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          t.status === 'severe'
                            ? 'bg-rose-500'
                            : t.status === 'moderate'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      ></span>
                      <h4 className="font-bold text-sm text-white">{t.label}</h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'severe'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : t.status === 'moderate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {t.status === 'severe' ? 'Severe Confusion' : t.status === 'moderate' ? 'Moderate' : 'Clear / Low'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        Score:{' '}
                        <span className="font-black text-white text-base">
                          {t.confusionScore}
                        </span>
                        /100
                      </span>
                    </div>
                  </div>

                  {/* Meter Progress Bar */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.status === 'severe'
                          ? 'bg-rose-500'
                          : t.status === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${t.confusionScore}%` }}
                    ></div>
                  </div>

                  {/* Metric Sub-factors */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-2 border-t border-slate-700/40">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Queries</span>
                      <span className="font-semibold text-slate-200">
                        {t.queryCount} queries ({t.uniqueWorkers} workers)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Follow-up Depth</span>
                      <span className="font-semibold text-slate-200">
                        {t.avgFollowups} avg follow-ups
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Helpful Ratio</span>
                      <span
                        className={`font-semibold ${
                          t.helpfulRatio < 60 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {t.helpfulRatio}% satisfaction
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Drilldown Detail & Actionable Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">
              {selectedTopicDrilldown ? `Topic Drilldown: ${selectedTopicDrilldown.label}` : 'Select a Topic to Drill Down'}
            </h3>
            {selectedTopicDrilldown && (
              <span className="text-xs font-bold text-amber-400">
                Score: {selectedTopicDrilldown.confusionScore}
              </span>
            )}
          </div>

          {selectedTopicDrilldown ? (
            <div className="space-y-4 text-xs">
              {/* Recommended Action Card */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>HR Supervisor Action Recommendation:</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {selectedTopicDrilldown.suggestedAction}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() =>
                      onSelectTopicForNotice(
                        selectedTopicDrilldown.topic,
                        `Confusion score is ${selectedTopicDrilldown.confusionScore} due to ${selectedTopicDrilldown.avgFollowups} average follow-ups per worker query.`
                      )
                    }
                    className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate Factory Floor Notice</span>
                  </button>

                  <button
                    onClick={onGoToPolicies}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <span>Edit / Clarify Policy in System →</span>
                  </button>
                </div>
              </div>

              {/* Sample Worker Questions Verbatim */}
              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-2">
                  Verbatim Worker Questions (Anonymized)
                </h4>
                <div className="space-y-2">
                  {selectedTopicDrilldown.sampleQuestions.length > 0 ? (
                    selectedTopicDrilldown.sampleQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 text-xs italic"
                      >
                        "{q}"
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs">No sample queries logged yet.</p>
                  )}
                </div>
              </div>

              {/* Languages for this topic */}
              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                  Language Distribution for Topic
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedTopicDrilldown.languages).map(([lang, count]) => (
                    <span
                      key={lang}
                      className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px]"
                    >
                      {lang.toUpperCase()}: <span className="font-bold text-white">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">
                Select any topic on the left to review worker questions, root causes, and launch factory communications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Language Breakdown & Query Volume Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-3">
          Workforce Language Distribution & Diversity
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Shows how migrant worker queries are distributed across linguistic backgrounds.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(languageCounts).map(([lang, count]) => {
            const percent = totalQueries > 0 ? Math.round((count / totalQueries) * 100) : 0;
            const langNames: Record<string, string> = {
              hi: 'Hindi (हिन्दी)',
              bn: 'Bengali (বাংলা)',
              ta: 'Tamil (தமிழ்)',
              mr: 'Marathi (मराठी)',
              te: 'Telugu (తెలుగు)',
              en: 'English',
            };
            return (
              <div
                key={lang}
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 text-center"
              >
                <span className="text-xs font-semibold text-slate-300 block truncate">
                  {langNames[lang] || lang.toUpperCase()}
                </span>
                <span className="text-xl font-black text-white mt-1 block">{count}</span>
                <span className="text-[10px] text-emerald-400 font-medium">{percent}% of queries</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formula Explainer Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <span>Confusion Meter Formula (Section 6.4)</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300">
                confusion_score = normalize(
                <br />
                &nbsp;&nbsp;w1 * (queries_per_worker) +
                <br />
                &nbsp;&nbsp;w2 * (avg_followups_per_query) +
                <br />
                &nbsp;&nbsp;w3 * (1 - helpful_feedback_ratio)
                <br />
                )
              </div>

              <p>
                <strong>1. queries_per_worker:</strong> When multiple workers in the same factory repeatedly ask about the same topic, it signals systemic communication breakdown rather than an isolated doubt.
              </p>
              <p>
                <strong>2. avg_followups_per_query:</strong> If a worker asks 2 to 4 follow-up clarifications (e.g. "What if it was Sunday?", "Why didn't my supervisor tell me this?"), the initial explanation was confusing.
              </p>
              <p>
                <strong>3. (1 - helpful_feedback_ratio):</strong> % of workers answering "Nahi / Confused" when asked if the answer resolved their doubt.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
