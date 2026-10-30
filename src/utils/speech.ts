// Audio & Speech Utilities for low-literacy factory workers

export function speakText(text: string, langCode: string = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text from Markdown or asterisks
  const clean = text.replace(/[*_#`]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(clean);

  // Map language codes to BCP 47 language tags
  const langMap: Record<string, string> = {
    hi: 'hi-IN',
    bn: 'bn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    mr: 'mr-IN',
    en: 'en-IN',
  };

  utterance.lang = langMap[langCode] || 'hi-IN';
  utterance.rate = 0.95; // slightly slower for better clarity for workers
  utterance.pitch = 1.0;

  // Try to find matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(langCode));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Web Speech Recognition wrapper
export interface SpeechRecognitionResultWrapper {
  transcript: string;
}

export function createSpeechRecognizer(
  langCode: string,
  onResult: (transcript: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  const langMap: Record<string, string> = {
    hi: 'hi-IN',
    bn: 'bn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    mr: 'mr-IN',
    en: 'en-IN',
  };

  recognition.lang = langMap[langCode] || 'hi-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onerror = (event: any) => {
    onError(event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}
