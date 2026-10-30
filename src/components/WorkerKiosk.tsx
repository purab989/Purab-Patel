import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  Coins,
  HeartPulse,
  UserCheck,
  CalendarDays,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SAMPLE_QUESTIONS_BY_LANG } from '../constants/languages';
import { speakText, stopSpeaking, createSpeechRecognizer } from '../utils/speech';

interface WorkerKioskProps {
  selectedFactory: string;
  onNewWorkerQuery?: () => void;
}

export const WorkerKiosk: React.FC<WorkerKioskProps> = ({
  selectedFactory,
  onNewWorkerQuery,
}) => {
  const [selectedLang, setSelectedLang] = useState('hi');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<{
    queryText: string;
    answerText: string;
    topic: string;
    queryId?: string;
    feedback?: 'helpful' | 'confused';
  } | null>({
    queryText: 'काम साथी कियोस्क में आपका स्वागत है।',
    answerText:
      'नमस्ते साथी! यह फ़ैक्टरी कियोस्क आपकी सहायता के लिए है। नीचे दिए गए किसी भी विषय पर बटन दबाएं या माइक दबाकर अपनी भाषा में पूछें।',
    topic: 'wages',
  });

  const recognizerRef = useRef<any>(null);

  const askKioskQuery = async (queryText: string, isAudio: boolean = false) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          language: selectedLang,
          channel: isAudio ? 'voice_kiosk' : 'web_kiosk',
          factory: selectedFactory === 'all' ? 'Manesar Auto Unit 1' : selectedFactory,
          audioUsed: isAudio,
        }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (data.reply) {
        setCurrentResponse({
          queryText,
          answerText: data.reply,
          topic: data.topic,
          queryId: data.queryId,
        });

        // Always auto-speak answer on Kiosk for illiterate workers
        speakText(data.reply, selectedLang);
        setIsSpeaking(true);

        if (onNewWorkerQuery) onNewWorkerQuery();
      }
    } catch (e) {
      console.error('Kiosk query error:', e);
      setIsLoading(false);
    }
  };

  const handleToggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognizerRef.current) recognizerRef.current.stop();
    } else {
      setIsRecording(true);
      const recognizer = createSpeechRecognizer(
        selectedLang,
        (transcript) => {
          setIsRecording(false);
          setInputText(transcript);
          askKioskQuery(transcript, true);
        },
        () => {
          setIsRecording(false);
          const samples = SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];
          const sample = samples[Math.floor(Math.random() * samples.length)];
          setInputText(sample);
          askKioskQuery(sample, true);
        },
        () => {
          setIsRecording(false);
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        try {
          recognizer.start();
        } catch {
          setTimeout(() => {
            setIsRecording(false);
            const samples = SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];
            askKioskQuery(samples[0], true);
          }, 2000);
        }
      } else {
        setTimeout(() => {
          setIsRecording(false);
          const samples = SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];
          askKioskQuery(samples[0], true);
        }, 2200);
      }
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (currentResponse?.answerText) {
      speakText(currentResponse.answerText, selectedLang);
      setIsSpeaking(true);
    }
  };

  const handleFeedback = async (feedback: 'helpful' | 'confused') => {
    if (!currentResponse?.queryId) return;
    try {
      await fetch(`/api/queries/${currentResponse.queryId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      setCurrentResponse((prev) => (prev ? { ...prev, feedback } : null));
      if (onNewWorkerQuery) onNewWorkerQuery();
    } catch (e) {
      console.error('Kiosk feedback error:', e);
    }
  };

  const categoryPresets = [
    {
      label: 'ओवरटाइम गणना (Overtime)',
      icon: Coins,
      color: 'from-amber-500 to-amber-700',
      query: 'Mera overtime double kaise milta hai?',
    },
    {
      label: 'नाइट शिफ्ट भत्ता (Night Shift)',
      icon: Clock,
      color: 'from-blue-500 to-indigo-700',
      query: 'Night shift me kitna rupya allowance milta hai?',
    },
    {
      label: 'सुरक्षा नियम व पीपीई (Safety PPE)',
      icon: ShieldAlert,
      color: 'from-rose-500 to-red-700',
      query: 'Section B me kaunsa safety saman pehanna zaroori hai?',
    },
    {
      label: 'ईएसआई अस्पताल (ESI Hospital)',
      icon: HeartPulse,
      color: 'from-emerald-500 to-teal-700',
      query: 'ESI medical card se parivar ka free ilaj kaise hoga?',
    },
    {
      label: 'गोपनीय शिकायत (Safe Grievance)',
      icon: UserCheck,
      color: 'from-purple-500 to-indigo-800',
      query: 'Bina naam bataye complaint kaise kar sakte hain?',
    },
    {
      label: 'छुट्टी व त्योहार (Paid Leave)',
      icon: CalendarDays,
      color: 'from-cyan-500 to-blue-700',
      query: 'Paid leave kitni milti hai aur kaise apply kare?',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Kiosk Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
              Factory Floor Kiosk
            </span>
            <span className="text-xs text-slate-400">
              Canteen & Gate 1 Station • {selectedFactory === 'all' ? 'Manesar Plant' : selectedFactory}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            काम साथी सहायता केंद्र (KaamSathi Help Desk)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            बिना किसी झिझक के अपनी भाषा में पूछें। माइक दबाकर बोलें या विषय चुनें।
          </p>
        </div>

        {/* Language Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedLang === lang.code
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300 font-bold scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Touch Screen Output Board */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {currentResponse?.queryText ? `सवाल: "${currentResponse.queryText}"` : 'तैयार है'}
            </span>
          </div>

          {currentResponse?.answerText && (
            <button
              onClick={handleToggleSpeak}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-md ${
                isSpeaking
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>बोलना रोकें (Stop)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>आवाज़ में सुनें (Listen Audio)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Response Body */}
        <div className="min-h-[140px] flex items-center">
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center py-8 space-y-3">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-amber-300">
                काम साथी फैक्ट्री नियमों की जांच कर रहा है...
              </p>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
                {currentResponse?.answerText}
              </p>

              {currentResponse?.queryId && (
                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
                  <span className="text-xs text-slate-400">
                    क्या आपको यह जवाब समझ आया? (Feedback)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback('helpful')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        currentResponse.feedback === 'helpful'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>हाँ, समझ आया (Helpful)</span>
                    </button>
                    <button
                      onClick={() => handleFeedback('confused')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        currentResponse.feedback === 'confused'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>समझ नहीं आया (Confused)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Voice Mic Station (Touchscreen Hero) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">
          Touchscreen Big Voice Control (आवाज़ में पूछें)
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-4">
          <button
            onClick={handleToggleMic}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all transform active:scale-95 ${
              isRecording
                ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 animate-pulse'
                : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-orange-500/30'
            }`}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10 font-bold" />}
            <span className="text-[11px] font-black uppercase tracking-wider">
              {isRecording ? 'बोल रहे हैं' : 'माइक दबाएं'}
            </span>
          </button>

          <div className="w-full max-w-md text-left">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    askKioskQuery(inputText);
                    setInputText('');
                  }
                }}
                placeholder="या यहाँ लिखकर पूछें (Type question here)..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => {
                  askKioskQuery(inputText);
                  setInputText('');
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              💡 सुझाव: "माइक दबाएं" और बोलें, कियोस्क तुरंत जवाब बोलेगा।
            </p>
          </div>
        </div>
      </div>

      {/* Preset Factory Topics (Large Touch Buttons) */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          त्वरित विषय (Touch Any Topic to Inquire)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categoryPresets.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setInputText(cat.query);
                  askKioskQuery(cat.query);
                }}
                className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all hover:scale-[1.02] shadow-sm flex items-start gap-3 group"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shrink-0 shadow`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    {cat.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    "{cat.query}"
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
