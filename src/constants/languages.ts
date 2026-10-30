import { SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    sampleGreeting: 'नमस्ते! मैं काम साथी हूँ। मजदूरी, शिफ्ट या सुरक्षा के बारे में पूछें।',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    sampleGreeting: 'নমস্কার! আমি কাম সাথী। বেতন, শিফট বা নিরাপত্তা নিয়ে প্রশ্ন করুন।',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    sampleGreeting: 'வணக்கம்! நான் காம்சதி. சம்பளம், ஷிப்ட் அல்லது பாதுகாப்பு குறித்து கேட்கலாம்.',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    sampleGreeting: 'नमस्कार! मी काम साथी आहे. पगार, शिफ्ट किंवा सुरक्षेबद्दल विचारा.',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    sampleGreeting: 'నమస్కారం! నేను కామ్‌సాథిని. జీతం, షిఫ్ట్ లేదా భద్రత గురించి అడగండి.',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    sampleGreeting: 'Hello! I am KaamSathi. Ask me about your wages, shifts, or safety policies.',
  },
];

export const SAMPLE_QUESTIONS_BY_LANG: Record<string, string[]> = {
  hi: [
    'Mera overtime kaise calculate hota hai?',
    'Night shift me kitna extra allowance milta hai?',
    'Section B me kaunsa safety saman pehanna zaroori hai?',
    'ESI medical card se parivar ka ilaj kaise hoga?',
    'Kya bina naam bataye complaint kar sakte hain?',
    'Agar biometric punch 12 minute late ho jaye toh kya hoga?',
  ],
  bn: [
    'Amader overtime calculation kivabe hoy?',
    'Night shift C te extra allowance koto taka?',
    'Accident hole emergency siren er somoy ki korbo?',
    'ESI card diye ki family r medicine pabo?',
    'Gopon ovijog kivabe janabo?',
  ],
  ta: [
    'Overtime sambalam eppadi kanakidappadugiradhu?',
    'Iravu shift-kku thani padi unnda?',
    'Safety shoes illaamal ulle poga koodaadhaa?',
    'ESI kaardil kudumbathirkku marundhu kidaikkuma?',
  ],
  mr: [
    'Overtime che paise kiti dharane miltat?',
    'Night shift allowance kiti ahe?',
    'Emergency siren vajlyaavar kay karave?',
    'ESI card varun family chya aushadha milte ka?',
  ],
  te: [
    'Overtime payment ela calculate chestaru?',
    'Night shift allowance entha vasthundi?',
    'Emergency siren moginappudu em cheyali?',
  ],
  en: [
    'How is overtime pay calculated?',
    'What is the night shift allowance rate?',
    'What PPE is mandatory in Section B?',
    'How do I use my ESI healthcare card?',
    'Can I file a confidential grievance safely?',
  ],
};

export const FACTORIES = [
  'Manesar Auto Unit 1',
  'Surat Textile Mills',
  'Chennai Auto Hub',
  'Pune Foundry',
];
