import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ThumbsUp,
  HelpCircle,
  PhoneCall,
  Video,
  MoreVertical,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Globe,
  Radio,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SAMPLE_QUESTIONS_BY_LANG } from '../constants/languages';
import { speakText, stopSpeaking, createSpeechRecognizer } from '../utils/speech';

interface ChatMessage {
  id: string;
  sender: 'worker' | 'bot';
  text: string;
  time: string;
  audioSimulated?: boolean;
  topic?: string;
  subtopic?: string;
  queryId?: string;
  feedbackGiven?: 'helpful' | 'confused' | null;
}

interface WhatsAppSimulatorProps {
  selectedFactory: string;
  onNewWorkerQuery?: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  selectedFactory,
  onNewWorkerQuery,
}) => {
  const [selectedLang, setSelectedLang] = useState('hi');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      sender: 'bot',
      text: '🙏 नमस्ते साथी! मैं काम साथी (KaamSathi) हूँ — आपका फैक्ट्री साथी।\n\nअपनी मजदूरी (Overtime), शिफ्ट, सुरक्षा (PPE), ESI कार्ड, या गोपनीय शिकायत के बारे में अपनी भाषा में पूछें। आप बोलकर या लिखकर पूछ सकते हैं।\n\n📌 Choose your language / भाषा चुनें:\n1: हिन्दी (Hindi)\n2: বাংলা (Bengali)\n3: தமிழ் (Tamil)\n4: मराठी (Marathi)\n5: తెలుగు (Telugu)\n6: English',
      time: '09:00 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle Speech Recognition
  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Try browser Web Speech API
      const recognizer = createSpeechRecognizer(
        selectedLang,
        (transcript) => {
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
          if (transcript) {
            sendWorkerMessage(transcript, true);
          }
        },
        (_error) => {
          // If browser speech recognition fails (e.g. no microphone permission), use a realistic voice query sample
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
          const samples = SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];
          const randomSample = samples[Math.floor(Math.random() * samples.length)];
          sendWorkerMessage(randomSample, true);
        },
        () => {
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        try {
          recognizer.start();
        } catch {
          // Fallback
          setTimeout(() => {
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
            const samples = SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];
            sendWorkerMessage(samples[0], true);
          }, 2000);
        }
      } else {
        // Speech API not supported in this browser, simulate realistic speech query after 2 seconds
        setTimeout(() => {
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
          const samples = SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];
          const randomSample = samples[Math.floor(Math.random() * samples.length)];
          sendWorkerMessage(randomSample, true);
        }, 2200);
      }
    }
  };

  const sendWorkerMessage = async (text: string, isAudio: boolean = false) => {
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      sender: 'worker',
      text: text.trim(),
      time: timeStr,
      audioSimulated: isAudio,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Call backend API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          language: selectedLang,
          channel: 'whatsapp',
          factory: selectedFactory === 'all' ? 'Manesar Auto Unit 1' : selectedFactory,
          audioUsed: isAudio,
          followupCount: messages.filter((m) => m.sender === 'worker').length,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data.reply) {
        const botMsg: ChatMessage = {
          id: 'm-' + (Date.now() + 1),
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          topic: data.topic,
          subtopic: data.subtopic,
          queryId: data.queryId,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Auto-read aloud if user sent a voice query (voice accessibility)
        if (isAudio) {
          handlePlayAudio(botMsg.id, data.reply);
        }

        if (onNewWorkerQuery) {
          onNewWorkerQuery();
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'm-' + Date.now(),
          sender: 'bot',
          text: 'माफ़ कीजिये, सर्वर से संपर्क नहीं हो पा रहा है। कृपया कुछ देर बाद दोबारा प्रयास करें।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handlePlayAudio = (id: string, text: string) => {
    if (currentlySpeakingId === id) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      speakText(text, selectedLang);
      setCurrentlySpeakingId(id);
    }
  };

  const handleFeedback = async (queryId: string | undefined, messageId: string, feedback: 'helpful' | 'confused') => {
    // Update local state
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: feedback } : m))
    );

    if (queryId) {
      try {
        await fetch(`/api/queries/${queryId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback }),
        });
        if (onNewWorkerQuery) onNewWorkerQuery();
      } catch (e) {
        console.error('Feedback submit error:', e);
      }
    }
  };

  const handleResetChat = () => {
    stopSpeaking();
    setCurrentlySpeakingId(null);
    setMessages([
      {
        id: 'm-welcome-' + Date.now(),
        sender: 'bot',
        text: '🙏 नमस्ते साथी! मैं काम साथी हूँ। अपनी मजदूरी, ओवरटाइम, शिफ्ट, या सुरक्षा के बारे में पूछें।',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const activeSampleQuestions =
    SAMPLE_QUESTIONS_BY_LANG[selectedLang] || SAMPLE_QUESTIONS_BY_LANG['hi'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center max-w-6xl mx-auto py-4">
      {/* Left Column: Context & Worker Tips */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Plant Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm text-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Worker WhatsApp Bot
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live WhatsApp Line
            </span>
          </div>
          <h3 className="font-bold text-white text-base">
            +91 98765 43210
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Workers scan poster QR codes on the shop floor or notice boards to start this chat.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Factory Context:</span>
            <span className="font-medium text-slate-200">
              {selectedFactory === 'all' ? 'Manesar Auto Unit 1' : selectedFactory}
            </span>
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Select Worker Language</span>
            </div>
            <span className="text-[11px] text-slate-400">6 Dialects</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                  selectedLang === lang.code
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{lang.nativeName}</div>
                  <div className="text-[10px] opacity-75">{lang.name}</div>
                </div>
                <span>{lang.flag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Sample Questions (Workers tapping frequently asked queries) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Common Worker Doubts
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Tap to Ask
            </span>
          </div>
          <div className="space-y-1.5">
            {activeSampleQuestions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendWorkerMessage(q)}
                className="w-full text-left p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
              >
                <span className="truncate pr-2">{q}</span>
                <span className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ask →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reset / New Session */}
        <button
          onClick={handleResetChat}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Worker Conversation</span>
        </button>
      </div>

      {/* Center: Smartphone Frame with Realistic WhatsApp UI */}
      <div className="w-full max-w-[420px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 relative ring-1 ring-slate-700">
        {/* Phone Notch / Speaker */}
        <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
          <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
        </div>

        {/* Phone Screen Container */}
        <div className="h-[640px] flex flex-col rounded-[32px] overflow-hidden bg-[#0b141a] text-slate-100 relative">
          {/* WhatsApp Header */}
          <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center justify-between text-white border-b border-[#2a3942] z-10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-sm shadow">
                  👷
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1f2c34] flex items-center justify-center">
                  <CheckCheck className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm leading-tight text-white">
                    KaamSathi (काम साथी)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-medium border border-emerald-500/30">
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-[#8696a0] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>Online • Official Policy Bot</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[#aebac1]">
              <Video className="w-4 h-4 cursor-pointer hover:text-white" />
              <PhoneCall className="w-4 h-4 cursor-pointer hover:text-white" />
              <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* WhatsApp Chat Body */}
          <div
            className="flex-1 p-3.5 overflow-y-auto space-y-3 relative"
            style={{
              backgroundImage:
                'radial-gradient(circle at center, #111b21 0%, #0b141a 100%)',
            }}
          >
            {/* End-to-end encryption notification bubble */}
            <div className="bg-[#182229] border border-[#222e35] text-[#ffd279] text-[10px] px-3 py-1.5 rounded-lg text-center max-w-[85%] mx-auto shadow-sm">
              🔒 Messages are encrypted & 100% anonymous. Supervisors cannot view worker identities.
            </div>

            {/* Messages */}
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`relative max-w-[86%] rounded-2xl p-3 shadow-md text-xs leading-relaxed ${
                      isBot
                        ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]'
                        : 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    }`}
                  >
                    {/* Audio Waveform Indicator if sent via Voice */}
                    {msg.audioSimulated && (
                      <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-white/10 text-emerald-300 font-medium text-[11px]">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                        <span>Voice Note (बोला हुआ संदेश)</span>
                      </div>
                    )}

                    {/* Message Text with Line Breaks */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Bottom row: Topic tag, Audio listen button & timestamp */}
                    <div className="mt-2 pt-1.5 flex flex-wrap items-center justify-between gap-1 border-t border-white/5">
                      {isBot && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePlayAudio(msg.id, msg.text)}
                            title="Listen to this explanation in your language"
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                              currentlySpeakingId === msg.id
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-white/10 hover:bg-white/20 text-emerald-300'
                            }`}
                          >
                            {currentlySpeakingId === msg.id ? (
                              <>
                                <VolumeX className="w-3 h-3 text-slate-950" />
                                <span>Rukhiye (Stop)</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-emerald-400" />
                                <span>Suno (Listen)</span>
                              </>
                            )}
                          </button>

                          {msg.topic && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 text-slate-400">
                              {msg.topic}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 ml-auto text-[10px] text-[#8696a0]">
                        <span>{msg.time}</span>
                        {!isBot && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                      </div>
                    </div>

                    {/* Feedback Rating (Only on Bot answers with queryId) */}
                    {isBot && msg.queryId && (
                      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <span className="text-[#8696a0]">Samajh aaya? (Helpful?)</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(msg.queryId, msg.id, 'helpful')}
                            className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all ${
                              msg.feedbackGiven === 'helpful'
                                ? 'bg-emerald-500 text-white font-bold'
                                : 'bg-white/5 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            <ThumbsUp className="w-2.5 h-2.5" />
                            <span>Haan (1)</span>
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.queryId, msg.id, 'confused')}
                            className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all ${
                              msg.feedbackGiven === 'confused'
                                ? 'bg-rose-500 text-white font-bold'
                                : 'bg-white/5 hover:bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            <HelpCircle className="w-2.5 h-2.5" />
                            <span>Nahi (2)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 bg-[#202c33] border border-[#2a3942] rounded-2xl rounded-tl-none p-2.5 max-w-[120px] text-[#8696a0]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
                <span className="text-[11px]">Typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recording Banner (if active) */}
          {isRecording && (
            <div className="bg-rose-950/90 border-t border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-200 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="font-semibold">Bol rahe hain... ({recordingSeconds}s)</span>
              </div>
              <span className="text-[10px] text-rose-300">Tap mic to send</span>
            </div>
          )}

          {/* WhatsApp Message Input Bar */}
          <div className="bg-[#202c33] p-2 flex items-center gap-2 border-t border-[#2a3942]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendWorkerMessage(inputText);
              }}
              placeholder={
                selectedLang === 'hi'
                  ? 'मजदूरी, शिफ्ट, या सुरक्षा के बारे में पूछें...'
                  : selectedLang === 'bn'
                  ? 'বেতন বা ওভারটাইম নিয়ে লিখুন...'
                  : selectedLang === 'ta'
                  ? 'சம்பளம் அல்லது ஷிப்ட் பற்றி கேளுங்கள்...'
                  : 'Ask about wages, shifts, safety...'
              }
              className="flex-1 bg-[#2a3942] text-sm text-[#d1d7db] placeholder-[#8696a0] px-3.5 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />

            {inputText.trim() ? (
              <button
                onClick={() => sendWorkerMessage(inputText)}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition-transform active:scale-95 shadow"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={handleToggleVoiceRecord}
                title="Tap to speak your question"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[#00a884] hover:bg-[#008f6f] text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
