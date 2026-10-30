import React, { useState } from 'react';
import {
  Search,
  Filter,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  HelpCircle,
  Clock,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { QueryLog } from '../types';

interface QueryLogViewerProps {
  queries: QueryLog[];
  onRefresh: () => void;
}

export const QueryLogViewer: React.FC<QueryLogViewerProps> = ({
  queries,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState('all');

  const filtered = queries.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answerText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.workerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic;
    const matchesChannel = selectedChannel === 'all' || q.channel === selectedChannel;
    const matchesFeedback =
      selectedFeedback === 'all' ||
      (selectedFeedback === 'helpful' && q.feedback === 'helpful') ||
      (selectedFeedback === 'confused' && q.feedback === 'confused') ||
      (selectedFeedback === 'none' && !q.feedback);

    return matchesSearch && matchesTopic && matchesChannel && matchesFeedback;
  });

  return (
    <div className="space-y-4">
      {/* Title & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base">
              Real-Time Query Pattern & Audit Logs
            </h3>
            <p className="text-xs text-slate-400">
              Live feed of worker inquiries across WhatsApp lines and factory floor kiosks. Worker IDs are hashed to protect privacy.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stream</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search query, worker ID..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Topics</option>
            <option value="wages">Wages & Overtime</option>
            <option value="shifts">Shifts & Attendance</option>
            <option value="safety">Safety Rules & PPE</option>
            <option value="benefits">Benefits & ESI</option>
            <option value="complaints">Grievances</option>
            <option value="leave">Leaves & Holidays</option>
          </select>

          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="whatsapp">WhatsApp Official</option>
            <option value="web_kiosk">Gate Web Kiosk</option>
            <option value="voice_kiosk">Voice Station</option>
          </select>

          <select
            value={selectedFeedback}
            onChange={(e) => setSelectedFeedback(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Feedback Ratings</option>
            <option value="confused">Confused / Not Helpful</option>
            <option value="helpful">Helpful / Understood</option>
            <option value="none">No Rating Given</option>
          </select>
        </div>
      </div>

      {/* Query List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            No matching queries found.
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-sm transition-all text-xs space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {q.workerId}
                  </span>
                  <span className="text-slate-400">{q.factory}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    {q.shift} Shift
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {q.audioUsed && (
                    <span className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      <Volume2 className="w-3 h-3" />
                      <span>Voice Command</span>
                    </span>
                  )}
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {q.channel}
                  </span>
                  <span>{new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Question & Answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Worker Asked ({q.language.toUpperCase()}):
                  </span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    "{q.questionText}"
                  </p>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                    KaamSathi Grounded Answer:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {q.answerText}
                  </p>
                </div>
              </div>

              {/* Footer row: Topic + Followup count + feedback */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    {q.topic}
                  </span>
                  {q.followupCount > 0 && (
                    <span className="text-amber-400">
                      ⚠️ {q.followupCount} follow-up clarifications asked
                    </span>
                  )}
                </div>

                <div>
                  {q.feedback === 'helpful' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful (1)</span>
                    </span>
                  ) : q.feedback === 'confused' ? (
                    <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <ThumbsDown className="w-3 h-3" />
                      <span>Worker Confused (2)</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">No feedback clicked</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
