import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  History,
  CheckCircle,
  Globe,
  RefreshCw,
  Search,
  Filter,
  Save,
  X,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { Policy, PolicyTranslation } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface PolicyManagerProps {
  policies: Policy[];
  onRefreshPolicies: () => void;
  onTestPolicyInBot: (testQuery: string) => void;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({
  policies,
  onRefreshPolicies,
  onTestPolicyInBot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [viewHistoryPolicy, setViewHistoryPolicy] = useState<Policy | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<'wages' | 'shifts' | 'safety' | 'benefits' | 'complaints' | 'leave'>('wages');
  const [formCategoryLabel, setFormCategoryLabel] = useState('Wages & Overtime');
  const [formTitle, setFormTitle] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formTranslations, setFormTranslations] = useState<Record<string, PolicyTranslation>>({});
  const [formChangeNote, setFormChangeNote] = useState('');

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingPolicy(null);
    setFormCategory('wages');
    setFormCategoryLabel('Wages & Overtime');
    setFormTitle('');
    setFormQuestion('');
    setFormAnswer('');
    setFormTranslations({
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: '',
        answer: '',
      },
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: '',
        answer: '',
      },
    });
    setFormChangeNote('Initial policy creation');
    setActiveLangTab('en');
  };

  const openEditModal = (p: Policy) => {
    setIsCreatingNew(false);
    setEditingPolicy(p);
    setFormCategory(p.category);
    setFormCategoryLabel(p.categoryLabel);
    setFormTitle(p.title);
    setFormQuestion(p.canonicalQuestion);
    setFormAnswer(p.canonicalAnswer);
    setFormTranslations({ ...p.translations });
    setFormChangeNote('');
    setActiveLangTab('en');
  };

  const handleAutoTranslate = async () => {
    if (!formAnswer.trim()) {
      alert('Please fill the Canonical English Answer first to auto-translate.');
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch('/api/policies/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formQuestion || formTitle,
          answer: formAnswer,
          targetLanguages: ['hi', 'bn', 'ta', 'mr', 'te'],
        }),
      });
      const data = await res.json();
      if (data.translations) {
        setFormTranslations((prev) => ({
          ...prev,
          en: {
            languageCode: 'en',
            languageName: 'English',
            question: formQuestion,
            answer: formAnswer,
          },
          ...data.translations,
        }));
        setStatusMessage('AI Auto-translated into Hindi, Bangla, Tamil, Marathi & Telugu!');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (e) {
      console.error('Translation error:', e);
      alert('Failed to auto-translate. Please check network.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!formTitle || !formAnswer) {
      alert('Please provide a policy title and answer.');
      return;
    }

    // Ensure English is updated
    const updatedTranslations = {
      ...formTranslations,
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: formQuestion || formTitle,
        answer: formAnswer,
      },
    };

    try {
      if (isCreatingNew) {
        await fetch('/api/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formCategory,
            categoryLabel: formCategoryLabel,
            title: formTitle,
            canonicalQuestion: formQuestion || formTitle,
            canonicalAnswer: formAnswer,
            translations: updatedTranslations,
            user: 'Ramesh Sharma (HR Head)',
          }),
        });
        setStatusMessage('New policy created and synced to KaamSathi bot!');
      } else if (editingPolicy) {
        await fetch(`/api/policies/${editingPolicy.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formCategory,
            categoryLabel: formCategoryLabel,
            title: formTitle,
            canonicalQuestion: formQuestion,
            canonicalAnswer: formAnswer,
            translations: updatedTranslations,
            user: 'Ramesh Sharma (HR Head)',
            note: formChangeNote || 'Policy clarification update',
          }),
        });
        setStatusMessage(`Policy updated to v${editingPolicy.version + 1}! Live answers updated.`);
      }

      setEditingPolicy(null);
      setIsCreatingNew(false);
      onRefreshPolicies();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error('Save error:', e);
      alert('Error saving policy');
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this factory policy?')) return;
    try {
      await fetch(`/api/policies/${id}`, { method: 'DELETE' });
      onRefreshPolicies();
      setStatusMessage('Policy deleted successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.canonicalAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.canonicalQuestion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Centralized Policy Update System
            </h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Single Source of Truth</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            All updates instantly update KaamSathi’s answers across WhatsApp and factory floor kiosks in all languages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Policy / FAQ</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {statusMessage && (
        <div className="bg-emerald-950/80 border border-emerald-700/80 p-3.5 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5 shadow-md animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies & rules..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'wages', label: 'Wages & OT' },
            { id: 'shifts', label: 'Shifts & Attendance' },
            { id: 'safety', label: 'Safety & PPE' },
            { id: 'benefits', label: 'Benefits & ESI' },
            { id: 'complaints', label: 'Grievance & Complaints' },
            { id: 'leave', label: 'Leave & Holidays' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPolicies.map((pol) => {
          const transCount = Object.keys(pol.translations || {}).length;
          return (
            <div
              key={pol.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {pol.categoryLabel}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                      v{pol.version}
                    </span>
                    <span>{new Date(pol.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm leading-snug">
                  {pol.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  {pol.canonicalAnswer}
                </p>

                {/* Available Translations Badges */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800 text-xs">
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400">Available in:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(pol.translations || {}).map((lang) => (
                      <span
                        key={lang}
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => onTestPolicyInBot(pol.canonicalQuestion)}
                  className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test in Bot →</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewHistoryPolicy(pol)}
                    title="View Version History & Audit Log"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(pol)}
                    title="Edit Policy & Translations"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(pol.id)}
                    title="Delete Policy"
                    className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg border border-slate-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Policy Modal */}
      {(isCreatingNew || editingPolicy) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-lg">
                  {isCreatingNew ? 'Add New Factory Policy / FAQ' : `Edit Policy: ${formTitle}`}
                </h3>
                <p className="text-xs text-slate-400">
                  This content acts as the strict source of truth for KaamSathi AI.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setIsCreatingNew(false);
                }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFormCategory(val);
                      const labels: Record<string, string> = {
                        wages: 'Wages & Overtime',
                        shifts: 'Shifts & Attendance',
                        safety: 'Safety Rules & PPE',
                        benefits: 'Benefits & Medical (ESI/PF)',
                        complaints: 'Grievance & Complaints',
                        leave: 'Leave & Attendance',
                      };
                      setFormCategoryLabel(labels[val] || val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="wages">Wages & Overtime</option>
                    <option value="shifts">Shifts & Attendance</option>
                    <option value="safety">Safety Rules & PPE</option>
                    <option value="benefits">Benefits & Medical (ESI/PF)</option>
                    <option value="complaints">Grievance & Complaints</option>
                    <option value="leave">Leave & Holidays</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Policy Title (Internal Name)
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Overtime Calculation & Weekly Off Rules"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Canonical English Question (What workers ask)
                </label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. How is overtime calculated in our plant?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Approved Policy Answer (English Baseline)
                  </label>
                  <button
                    onClick={handleAutoTranslate}
                    disabled={isTranslating}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isTranslating ? 'Translating with Gemini...' : '1-Click Auto-Translate (7 Languages)'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Enter precise, factory-approved wording. e.g. Overtime is calculated at 2.0x basic hourly wage..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Language Specific Tabs */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Multi-Language Localized Copy</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Workers hear these exact phrases in their dialect
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setActiveLangTab(lang.code)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        activeLangTab === lang.code
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </button>
                  ))}
                </div>

                {/* Active Language Editor */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Worker-Friendly Answer in {SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.nativeName || activeLangTab}:
                  </label>
                  <textarea
                    rows={3}
                    value={
                      formTranslations[activeLangTab]?.answer ||
                      (activeLangTab === 'en' ? formAnswer : '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormTranslations((prev) => ({
                        ...prev,
                        [activeLangTab]: {
                          languageCode: activeLangTab,
                          languageName:
                            SUPPORTED_LANGUAGES.find((l) => l.code === activeLangTab)?.name ||
                            activeLangTab,
                          question: formQuestion,
                          answer: val,
                        },
                      }));
                    }}
                    placeholder={`Write simple colloquial explanation in ${activeLangTab}...`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {!isCreatingNew && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Audit Note / Reason for Update
                  </label>
                  <input
                    type="text"
                    value={formChangeNote}
                    onChange={(e) => setFormChangeNote(e.target.value)}
                    placeholder="e.g. Overtime multiplier changed from 1.5x to 2.0x per new state notification"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setIsCreatingNew(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save & Publish to KaamSathi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {viewHistoryPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Audit Log: {viewHistoryPolicy.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Full version tracking of policy revisions.
                </p>
              </div>
              <button
                onClick={() => setViewHistoryPolicy(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              {viewHistoryPolicy.changeLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">v{log.version}</span>
                    <span className="text-[10px] text-slate-400">{log.date}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{log.note}</p>
                  <span className="text-[10px] text-slate-500 block">By: {log.user}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewHistoryPolicy(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
