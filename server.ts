import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Google GenAI on server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_')) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// Data Types
// -------------------------------------------------------------
export interface PolicyTranslation {
  languageCode: string;
  languageName: string;
  question: string;
  answer: string;
}

export interface Policy {
  id: string;
  category: 'wages' | 'shifts' | 'safety' | 'benefits' | 'complaints' | 'leave';
  categoryLabel: string;
  title: string;
  canonicalQuestion: string;
  canonicalAnswer: string;
  translations: Record<string, PolicyTranslation>;
  lastUpdated: string;
  updatedBy: string;
  version: number;
  changeLog: { version: number; date: string; user: string; note: string }[];
}

export interface QueryLog {
  id: string;
  workerId: string; // e.g. WRK-9481 (hashed / anonymized)
  timestamp: string;
  channel: 'whatsapp' | 'web_kiosk' | 'voice_kiosk';
  language: string; // hi, bn, ta, te, mr, en, etc.
  questionText: string;
  answerText: string;
  topic: string;
  subtopic: string;
  followupCount: number;
  feedback: 'helpful' | 'confused' | null;
  factory: string;
  shift: 'Morning' | 'Evening' | 'Night';
  audioUsed: boolean;
}

// -------------------------------------------------------------
// In-Memory Database (Seeded with realistic factory data)
// -------------------------------------------------------------
let policies: Policy[] = [
  {
    id: 'pol-1',
    category: 'wages',
    categoryLabel: 'Wages & Overtime',
    title: 'Overtime Rate & Calculation Rule',
    canonicalQuestion: 'How is overtime pay calculated in our factory?',
    canonicalAnswer: 'Overtime is strictly calculated at 2.0x (double) of your basic hourly wage. Any work performed beyond 8 hours on a regular shift or work performed on an assigned weekly off is logged as overtime. Overtime wages are credited together with your regular monthly salary on the 7th of every month directly to your bank account.',
    lastUpdated: '2026-10-24T14:30:00Z',
    updatedBy: 'Ramesh Sharma (HR Head)',
    version: 3,
    changeLog: [
      { version: 1, date: '2026-08-01', user: 'Ramesh Sharma', note: 'Initial policy draft' },
      { version: 2, date: '2026-09-15', user: 'Sunita Roy', note: 'Clarified weekly off work rule' },
      { version: 3, date: '2026-10-24', user: 'Ramesh Sharma', note: 'Updated overtime multiplier to 2.0x per updated state factory act' },
    ],
    translations: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: 'हमारे कारखाने में ओवरटाइम का पैसा कैसे मिलता है?',
        answer: 'आपका ओवरटाइम आपके मूल (Basic) प्रति घंटे वेतन का 2 गुना (Double Rate) के हिसाब से मिलता है। 8 घंटे की सामान्य शिफ्ट के बाद या रविवार/साप्ताहिक छुट्टी पर किया गया काम ओवरटाइम माना जाता है। यह पैसा हर महीने की 7 तारीख को आपकी मुख्य सैलरी के साथ सीधे बैंक खाते में जमा किया जाता है।',
      },
      bn: {
        languageCode: 'bn',
        languageName: 'Bengali (বাংলা)',
        question: 'কারখানায় ওভারটাইমের টাকা কিভাবে হিসেব হয়?',
        answer: 'আপনার ওভারটাইম মূল প্রতি ঘণ্টার বেতনের দ্বিগুণ (2x) হারে দেওয়া হয়। ৮ ঘণ্টার বেশি কাজ করলে বা সাপ্তাহিক ছুটির দিনে কাজ করলে তা ওভারটাইম হিসেবে গণ্য হবে। প্রতি মাসের ৭ তারিখে বেতনের সাথেই এই টাকা আপনার ব্যাংক অ্যাকাউন্টে জমা হবে।',
      },
      ta: {
        languageCode: 'ta',
        languageName: 'Tamil (தமிழ்)',
        question: 'தொழிற்சாலையில் ஓவர்டைம் ஊதியம் எவ்வாறு கணக்கிடப்படுகிறது?',
        answer: 'உங்கள் கூடுதல் வேலை நேரம் (ஓவர்டைம்) அடிப்படை மணிநேர ஊதியத்தில் 2 மடங்கு (2.0x) என கணக்கிடப்படுகிறது. 8 மணி நேரத்திற்கு மேல் பணிபுரிந்தால் அல்லது வார விடுமுறையில் பணிபுரிந்தால் அது ஓவர்டைம். இந்த தொகை ஒவ்வொரு மாதமும் 7 ஆம் தேதி சம்பளத்துடன் வங்கிக் கணக்கில் வரவு வைக்கப்படும்.',
      },
      mr: {
        languageCode: 'mr',
        languageName: 'Marathi (मराठी)',
        question: 'कारखान्यात ओव्हरटाइमचे पैसे कसे मोजले जातात?',
        answer: 'तुमचा ओव्हरटाइम मूळ तासाच्या वेतनाच्या 2 पट (Double Rate) दराने दिला जातो. 8 तासांपेक्षा जास्त काम किंवा वीकली ऑफच्या दिवशी केलेले काम ओव्हरटाइम मानले जाते. हे पैसे दर महिन्याच्या 7 तारखेला पगारासोबत थेट बँक खात्यात जमा केले जातात.',
      },
      te: {
        languageCode: 'te',
        languageName: 'Telugu (తెలుగు)',
        question: 'ఫ్యాక్టరీలో ఓవర్‌టైమ్ వేతనం ఎలా లెక్కిస్తారు?',
        answer: 'మీ ఓవర్‌టైమ్ సాధారణ గంట వేతనం కంటే 2 రెట్లు (2.0x) లెక్కించబడుతుంది. 8 గంటల సాధారణ షిఫ్ట్ దాటిన తర్వాత లేదా వీక్లీ ఆఫ్ రోజున పనిచేస్తే ఓవర్‌టైమ్ అవుతుంది. ప్రతి నెలా 7వ తేదీన జీతంతో పాటు నేరుగా బ్యాంకు ఖాతాలో జమ చేయబడుతుంది.',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: 'How is overtime pay calculated in our factory?',
        answer: 'Overtime is strictly calculated at 2.0x (double) of your basic hourly wage. Any work beyond 8 hours or on weekly off days counts as overtime, credited with monthly salary on the 7th.',
      },
    },
  },
  {
    id: 'pol-2',
    category: 'shifts',
    categoryLabel: 'Shifts & Attendance',
    title: 'Shift Timings, Grace Period & Night Allowance',
    canonicalQuestion: 'What are the shift timings, grace period for biometric punch, and night shift allowance?',
    canonicalAnswer: 'Factory operates three shifts: Shift A (06:00 to 14:00), Shift B (14:00 to 22:00), Shift C (22:00 to 06:00). A 10-minute grace period is allowed for punch-in (e.g. up to 06:10). Punching after grace period incurs a half-hour wage deduction after 3 late marks in a calendar month. Shift C (Night Shift) receives an additional ₹180 night allowance per night shift plus complimentary hot tea and snacks at 02:00.',
    lastUpdated: '2026-10-20T10:00:00Z',
    updatedBy: 'Sunita Roy (Floor Supervisor)',
    version: 2,
    changeLog: [
      { version: 1, date: '2026-07-10', user: 'Ramesh Sharma', note: 'Standard shift timings' },
      { version: 2, date: '2026-10-20', user: 'Sunita Roy', note: 'Added ₹180 night allowance specification' },
    ],
    translations: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: 'शिफ्ट का समय, बायोमेट्रिक पंच की छूट और नाइट शिफ्ट भत्ता क्या है?',
        answer: 'शिफ्ट समय: शिफ्ट A (सुबह 6 से दोपहर 2), शिफ्ट B (दोपहर 2 से रात 10), शिफ्ट C (रात 10 से सुबह 6)। पंच करने के लिए 10 मिनट की छूट (Grace period) है। महीने में 3 बार से ज्यादा लेट होने पर आधे घंटे का वेतन कटेगा। नाइट शिफ्ट (Shift C) करने वाले साथियों को प्रति शिफ्ट ₹180 अलग से नाइट अलाउंस और रात 2 बजे कैंटीन में गर्म चाय-नाश्ता मिलता है।',
      },
      bn: {
        languageCode: 'bn',
        languageName: 'Bengali (বাংলা)',
        question: 'শিফটের সময়, পাঞ্চ করার বাড়তি সময় এবং নাইট শিফট ভাতা কত?',
        answer: 'শিফট A (সকাল ৬টা থেকে দুপুর ২টা), শিফট B (দুপুর ২টা থেকে রাত ১০টা), শিফট C (রাত ১০টা থেকে সকাল ৬টা)। পাঞ্চ করার জন্য ১০ মিনিট ছাড় দেওয়া হয়। নাইট শিফটে প্রতি রাতে ১৮০ টাকা অতিরিক্ত নাইট এলাউন্স এবং রাত ২টায় গরম চা-নাস্তা পাওয়া যায়।',
      },
      ta: {
        languageCode: 'ta',
        languageName: 'Tamil (தமிழ்)',
        question: 'ஷிப்ட் நேரம், பஞ்ச் செய்வதற்கான சலுகை நேரம் மற்றும் இரவு ஷிப்ட் படி என்ன?',
        answer: 'ஷிப்ட் A (காலை 6-மதியம் 2), ஷிப்ட் B (மதியம் 2-இரவு 10), ஷிப்ட் C (இரவு 10-காலை 6). பயோமெட்ரிக் பஞ்ச் செய்ய 10 நிமிடங்கள் அவகாசம் உண்டு. இரவு ஷிப்ட்டில் (Shift C) பணிபுரிவோருக்கு ஒரு ஷிப்டுக்கு ₹180 இரவுப் படியும் மற்றும் அதிகாலை 2 மணிக்கு சூடான தேநீரும் சிற்றுண்டியும் வழங்கப்படும்.',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: 'What are the shift timings, biometric grace period, and night allowance?',
        answer: 'Shifts: A (6am-2pm), B (2pm-10pm), C (10pm-6am). 10-minute punch grace period. Night shift (Shift C) gets ₹180 extra allowance per night with hot refreshments at 2 AM.',
      },
    },
  },
  {
    id: 'pol-3',
    category: 'safety',
    categoryLabel: 'Safety Rules & PPE',
    title: 'Mandatory PPE & Emergency Evacuation Protocol',
    canonicalQuestion: 'What safety gear (PPE) is mandatory, and what to do if an emergency alarm sounds?',
    canonicalAnswer: 'All workers must wear steel-toe boots, fluorescent high-vis jacket, and safety goggles before stepping onto shop floor. Earplugs are mandatory in Press & Loom bays. If the siren sounds (continuous rhythmic bell), immediately hit the Red Emergency Stop (E-Stop) on your machine and calmly walk to Assembly Area 2 outside Gate 3. Never run and never use elevators.',
    lastUpdated: '2026-10-18T09:15:00Z',
    updatedBy: 'Anil Deshmukh (Safety Officer)',
    version: 1,
    changeLog: [
      { version: 1, date: '2026-10-18', user: 'Anil Deshmukh', note: 'Safety protocol update' },
    ],
    translations: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: 'कारखाने में क्या सेफ्टी सामान पहनना जरूरी है, और सायरन बजने पर क्या करें?',
        answer: 'शॉप फ्लोर पर कदम रखने से पहले स्टील-टो सेफ्टी जूते, फ्लोरोसेंट जैकेट और चश्मा पहनना अनिवार्य है। प्रेस और लूम सेक्शन में इयरप्लग लगाना जरूरी है। यदि इमरजेंसी सायरन बजे, तो अपनी मशीन का लाल रंग का इमरजेंसी स्टॉप बटन दबाएं और तुरंत बिना भागे गेट नंबर 3 के पास बने असेंबली एरिया 2 में पहुंचें।',
      },
      bn: {
        languageCode: 'bn',
        languageName: 'Bengali (বাংলা)',
        question: 'কারখানায় কি কি সুরক্ষা পোশাক পরা বাধ্যতামূলক, এবং সাইরেন বাজলে কি করব?',
        answer: 'ফ্লোরে ঢোকার আগে স্টিল-টো জুতো, উজ্জ্বল জ্যাকেট ও চশমা পরা বাধ্যতামূলক। সাইরেন বাজলে দ্রুত মেশিনের লাল জরুরি বোতাম চেপে বন্ধ করুন এবং শান্তভাবে ৩ নম্বর গেটের অ্যাসেম্বলি পয়েন্টে যান।',
      },
      ta: {
        languageCode: 'ta',
        languageName: 'Tamil (தமிழ்)',
        question: 'தொழிற்சாலையில் என்ன பாதுகாப்பு உபகரணங்கள் (PPE) அணிய வேண்டும்? அவசர எச்சரிக்கை ஒலித்தால் என்ன செய்ய வேண்டும்?',
        answer: 'பாதுகாப்பு காலணிகள் (Safety Shoes), ஒளிரும் ஜாக்கெட் மற்றும் பாதுகாப்பு கண்ணாடிகள் அணிவது கட்டாயம். அவசர சைரன் ஒலித்தால், உடனே உங்கள் இயந்திரத்தின் சிவப்பு நிற எமர்ஜென்சி பட்டனை அழுத்தி நிறுத்திவிட்டு, கேட் 3 அருகில் உள்ள அசெம்பிளி பகுதிக்குச் செல்லவும்.',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: 'What PPE is mandatory and what is the emergency evacuation plan?',
        answer: 'Steel-toe boots, high-vis jacket, and goggles are mandatory. On hearing continuous siren, hit red E-stop button and proceed to Assembly Area 2 near Gate 3.',
      },
    },
  },
  {
    id: 'pol-4',
    category: 'benefits',
    categoryLabel: 'Benefits & Medical (ESI/PF)',
    title: 'ESI Medical Card & Family Healthcare Access',
    canonicalQuestion: 'How can I and my family use the ESI medical card and claim medicines?',
    canonicalAnswer: 'Every employee with an ESI number receives an ESI Pehchan digital card. Free medical consultations and prescribed medicines are available at the Sector 8 ESI Dispensary and Tie-up Civil Hospitals. In an emergency, any family member can be admitted to an ESI-empanelled hospital by showing the digital ESI card QR code on their phone.',
    lastUpdated: '2026-10-12T16:00:00Z',
    updatedBy: 'Ramesh Sharma (HR Head)',
    version: 2,
    changeLog: [
      { version: 1, date: '2026-06-01', user: 'Ramesh Sharma', note: 'Initial ESI policy' },
      { version: 2, date: '2026-10-12', user: 'Ramesh Sharma', note: 'Added digital QR code empanelled hospital procedures' },
    ],
    translations: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: 'मैं और मेरा परिवार ESI मेडिकल कार्ड का उपयोग कैसे कर सकते हैं?',
        answer: 'हर कामगार को ESI पहचान कार्ड मिलता है। सेक्टर 8 ESI डिस्पेंसरी और सरकारी अस्पतालों में आपके और आपके पूरे परिवार के लिए मुफ्त डॉक्टर और दवाएं उपलब्ध हैं। आपातकाल में मोबाइल में ESI का QR कोड दिखाकर किसी भी लिस्टेड अस्पताल में तुरंत इलाज करा सकते हैं।',
      },
      bn: {
        languageCode: 'bn',
        languageName: 'Bengali (বাংলা)',
        question: 'আমি ও আমার পরিবার কিভাবে ESI মেডিকেল কার্ড ব্যবহার করে বিনামূল্যে চিকিৎসা পাব?',
        answer: 'প্রত্যেক কর্মীর ইএসআই পরিচয়পত্র থাকে। সেক্টর ৮ ইএসআই ডিসপেনসারিতে আপনি ও আপনার পরিবার বিনামূল্যে ডাক্তার দেখানো ও ওষুধ নিতে পারবেন। ফোনে কিউআর কোড দেখালেই তালিকাভুক্ত হাসপাতালে চিকিৎসা মিলবে।',
      },
      ta: {
        languageCode: 'ta',
        languageName: 'Tamil (தமிழ்)',
        question: 'நானும் எனது குடும்பத்தினரும் ESI மருத்துவ அட்டையை எவ்வாறு பயன்படுத்தலாம்?',
        answer: 'ஒவ்வொரு தொழிலாளிக்கும் ESI அடையாள அட்டை வழங்கப்படும். செக்டார் 8 ESI மருந்தகத்தில் உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் இலவச மருத்துவமும் மருந்துகளும் கிடைக்கும். அவசர காலத்தில் இ-அட்டையைக் காட்டி அங்கீகரிக்கப்பட்ட மருத்துவமனைகளில் சிகிச்சை பெறலாம்.',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: 'How to use ESI medical card for family healthcare?',
        answer: 'Workers get free outpatient visits and medicines at Sector 8 ESI Dispensary for self and family. Emergency hospital admissions are covered by displaying digital ESI card QR.',
      },
    },
  },
  {
    id: 'pol-5',
    category: 'complaints',
    categoryLabel: 'Grievance & Complaints',
    title: '100% Anonymous & Retaliation-Free Grievance Process',
    canonicalQuestion: 'How can I safely report harassment, wage discrepancy, or supervisor unfairness anonymously?',
    canonicalAnswer: 'Factory management enforces a strict Zero-Retaliation Policy. You can file a complaint in three confidential ways: 1) Via KaamSathi bot by saying "File a confidential complaint", 2) Dropping a written slip in the locked Yellow Box outside Locker Room 2, or 3) Calling the Internal Grievance Committee hotline at 1800-419-7022. Your phone number or worker ID is encrypted and never revealed to floor supervisors.',
    lastUpdated: '2026-10-15T11:20:00Z',
    updatedBy: 'Kavita Iyer (Ombudsperson)',
    version: 2,
    changeLog: [
      { version: 1, date: '2026-05-10', user: 'Kavita Iyer', note: 'Setup ICC policy' },
      { version: 2, date: '2026-10-15', user: 'Kavita Iyer', note: 'Integrated KaamSathi encrypted grievance channel' },
    ],
    translations: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: 'क्या मैं बिना नाम बताए सुपरवाइजर या वेतन संबंधी परेशानी की शिकायत कर सकता हूँ?',
        answer: 'हाँ, बिल्कुल। आपका नाम 100% गुप्त रखा जाता है। आप काम साथी बॉट में "गोपनीय शिकायत" लिखकर भेज सकते हैं, या लॉकर रूम के बाहर लगे पीले शिकायत पेटी (Yellow Box) में पत्र डाल सकते हैं, या टोल-फ्री नंबर 1800-419-7022 पर कॉल कर सकते हैं। सुपरवाइजर को कभी आपका नाम पता नहीं चलेगा।',
      },
      bn: {
        languageCode: 'bn',
        languageName: 'Bengali (বাংলা)',
        question: 'নিজের নাম প্রকাশ না করে কি সুপারভাইজার বা মজুরি সংক্রান্ত অভিযোগ জানানো যাবে?',
        answer: 'হ্যাঁ, ১০০% গোপন রাখা হবে। আপনি কাম সাথী বটের মাধ্যমে গোপন অভিযোগ করতে পারেন, অথবা লকার রুমের হলুদ অভিযোগ বক্সে চিঠি ফেলতে পারেন। সুপারভাইজার কখনোই আপনার নাম জানতে পারবে না।',
      },
      ta: {
        languageCode: 'ta',
        languageName: 'Tamil (தமிழ்)',
        question: 'என் பெயரை வெளியிடாமல் மேற்பார்வையாளர் அல்லது சம்பளம் குறித்து ரகசியமாக புகார் செய்ய முடியுமா?',
        answer: 'ஆம், நிச்சயம். உங்கள் விவரங்கள் 100% ரகசியமாக வைக்கப்படும். காம்சதி வாட்ஸ்அப் அல்லது லாக்கர் அறைக்கு வெளியே உள்ள மஞ்சள் புகார் பெட்டியில் கடிதம் போடலாம். உங்கள் பெயர் யாருக்கும் தெரியாது.',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: 'How to report supervisor issues or workplace grievances anonymously?',
        answer: 'Strict zero-retaliation policy. Report via KaamSathi confidential chat, the locked Yellow Drop Box near locker room, or toll-free hotline 1800-419-7022 with complete anonymity.',
      },
    },
  },
  {
    id: 'pol-6',
    category: 'leave',
    categoryLabel: 'Leave & Holidays',
    title: 'Paid Leave, Festival Holidays & Emergency Leave Application',
    canonicalQuestion: 'How many paid leaves do workers earn and how to apply for emergency sick leave?',
    canonicalAnswer: 'Workers earn 1.5 days of Paid Earned Leave (PL) for every 20 days worked (up to 18 days annually), in addition to 10 declared festival holidays. Planned leave must be requested 48 hours prior. For sudden medical illness, message KaamSathi or notify your shift coordinator before 09:00 AM on the day and provide doctor prescription upon returning.',
    lastUpdated: '2026-10-22T08:00:00Z',
    updatedBy: 'Ramesh Sharma (HR Head)',
    version: 1,
    changeLog: [
      { version: 1, date: '2026-10-22', user: 'Ramesh Sharma', note: 'Annual leave policy update' },
    ],
    translations: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi (हिन्दी)',
        question: 'महीने में कितनी छुट्टियां मिलती हैं और अचानक बीमार होने पर छुट्टी कैसे लें?',
        answer: 'हर 20 दिन काम करने पर 1.5 दिन का सवेतन अवकाश (Earned Leave) मिलता है, साथ ही साल में 10 त्योहारों की सरकारी छुट्टी होती है। अचानक बीमार पड़ने पर सुबह 9 बजे से पहले काम साथी या सुपरवाइजर को सूचित करें और आने पर डॉक्टर की पर्ची जमा करें।',
      },
      bn: {
        languageCode: 'bn',
        languageName: 'Bengali (বাংলা)',
        question: 'ছুটি কতদিন পাওয়া যায় এবং হঠাৎ অসুস্থ হলে কিভাবে ছুটি নেব?',
        answer: 'প্রতি ২০ দিন কাজের জন্য ১.৫ দিন বেতনসহ ছুটি জমা হয়। হঠাৎ অসুস্থ হলে সকাল ৯টার আগে কাম সাথীতে বা সুপারভাইজারকে জানান এবং যোগদানের সময় ডাক্তারের প্রেসক্রিপশন জমা দিন।',
      },
      ta: {
        languageCode: 'ta',
        languageName: 'Tamil (தமிழ்)',
        question: 'விடுப்பு விதிகள் என்ன மற்றும் அவசர மருத்துவ விடுப்புக்கு எவ்வாறு விண்ணப்பிப்பது?',
        answer: 'ஒவ்வொரு 20 வேலை நாட்களுக்கும் 1.5 நாட்கள் சம்பளத்துடன் கூடிய விடுப்பு உண்டு. திடீர் உடல்நலக்குறைவு ஏற்பட்டால், காலை 9 மணிக்குள் காம்சதி மூலமாகவோ மேற்பார்வையாளரிடமோ தெரிவித்துவிட்டு, பணிக்கு திரும்பும்போது மருத்துவ சான்றிதழ் சமர்ப்பிக்கவும்.',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        question: 'How many leaves do workers get and how to apply for sick leave?',
        answer: '1.5 days paid leave for every 20 workdays plus 10 festival holidays. In case of illness, notify before 9 AM and submit medical slip upon return.',
      },
    },
  },
];

// Seed realistic query logs spanning multiple dates, languages, factories, and confusion metrics
let queryLogs: QueryLog[] = [
  {
    id: 'q-101',
    workerId: 'WRK-8492',
    timestamp: '2026-10-29T19:42:10Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Mera pichhle mahine ka overtime double kyu nahi juda salary me?',
    answerText: 'ओवरटाइम आपके बेसिक घंटे का 2x जुड़ता है। अगर आपकी शिफ्ट 8 घंटे से ज्यादा की थी, तो 7 तारीख की पेस्लिप में यह "OT Hours" में दिखेगा।',
    topic: 'wages',
    subtopic: 'Overtime Rate & Calculation Rule',
    followupCount: 3,
    feedback: 'confused',
    factory: 'Manesar Auto Unit 1',
    shift: 'Evening',
    audioUsed: true,
  },
  {
    id: 'q-102',
    workerId: 'WRK-8492',
    timestamp: '2026-10-29T19:44:00Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Sunday ko maine 10 ghante kaam kiya tha, uska kitna rupya milega?',
    answerText: 'रविवार (साप्ताहिक छुट्टी) के पूरे 10 घंटे 2.0x डबल दर से मिलेंगे। 7 तारीख को आपकी सैलरी के साथ क्रेडिट होंगे।',
    topic: 'wages',
    subtopic: 'Overtime Rate & Calculation Rule',
    followupCount: 2,
    feedback: 'confused',
    factory: 'Manesar Auto Unit 1',
    shift: 'Evening',
    audioUsed: false,
  },
  {
    id: 'q-103',
    workerId: 'WRK-3190',
    timestamp: '2026-10-29T18:15:22Z',
    channel: 'web_kiosk',
    language: 'bn',
    questionText: 'Night shift C te extra koto taka allowance ache?',
    answerText: 'নাইট শিফটে (রাত ১০টা থেকে সকাল ৬টা) প্রতি শিফটে ১৮০ টাকা অতিরিক্ত নাইট এলাউন্স এবং রাত ২টায় গরম চা-নাস্তা পাওয়া যায়।',
    topic: 'shifts',
    subtopic: 'Shift Timings, Grace Period & Night Allowance',
    followupCount: 1,
    feedback: 'helpful',
    factory: 'Surat Textile Mills',
    shift: 'Night',
    audioUsed: true,
  },
  {
    id: 'q-104',
    workerId: 'WRK-9124',
    timestamp: '2026-10-29T16:04:18Z',
    channel: 'whatsapp',
    language: 'ta',
    questionText: 'Enathu kuzhanthaikku kaichal vanthal ESI aspathiriyil marunthu kidaikkuma?',
    answerText: 'ஆம், உங்கள் ESI அட்டை மூலம் உங்கள் குழந்தைகளுக்கும் செக்டார் 8 ESI மருந்தகத்தில் இலவச பரிசோதனை மற்றும் மருந்து கிடைக்கும்.',
    topic: 'benefits',
    subtopic: 'ESI Medical Card & Family Healthcare Access',
    followupCount: 0,
    feedback: 'helpful',
    factory: 'Chennai Auto Hub',
    shift: 'Morning',
    audioUsed: true,
  },
  {
    id: 'q-105',
    workerId: 'WRK-5211',
    timestamp: '2026-10-29T14:22:10Z',
    channel: 'voice_kiosk',
    language: 'hi',
    questionText: 'Agar machine se aag nikalne lage toh kya kare pehle?',
    answerText: 'तुरंत मशीन का लाल इमरजेंसी स्टॉप (E-Stop) बटन दबाएं, अलार्म खींचें और गेट 3 के पास असेंबली एरिया 2 पर सुरक्षित पहुंचे।',
    topic: 'safety',
    subtopic: 'Mandatory PPE & Emergency Evacuation Protocol',
    followupCount: 0,
    feedback: 'helpful',
    factory: 'Manesar Auto Unit 1',
    shift: 'Morning',
    audioUsed: true,
  },
  {
    id: 'q-106',
    workerId: 'WRK-7128',
    timestamp: '2026-10-29T12:05:00Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Kya supervisor ko pata chalega agar main complaint box me slip dalunga?',
    answerText: 'नहीं, आपका नाम 100% गोपनीय रहेगा। सुपरवाइजर या ठेकेदार को कभी पता नहीं चलेगा।',
    topic: 'complaints',
    subtopic: '100% Anonymous & Retaliation-Free Grievance Process',
    followupCount: 1,
    feedback: 'helpful',
    factory: 'Surat Textile Mills',
    shift: 'Morning',
    audioUsed: false,
  },
  {
    id: 'q-107',
    workerId: 'WRK-6433',
    timestamp: '2026-10-28T21:30:15Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Biometric machine me 12 minute late ho gaya to poore din ki salary kategi kya?',
    answerText: '10 मिनट की छूट (Grace period) है। 12 मिनट होने पर लेट मार्क लगेगा, लेकिन पूरे दिन की सैलरी नहीं कटेगी। महीने में 3 लेट मार्क के बाद आधा घंटा कटता है।',
    topic: 'shifts',
    subtopic: 'Shift Timings, Grace Period & Night Allowance',
    followupCount: 2,
    feedback: 'confused',
    factory: 'Manesar Auto Unit 1',
    shift: 'Morning',
    audioUsed: true,
  },
  {
    id: 'q-108',
    workerId: 'WRK-6433',
    timestamp: '2026-10-28T21:35:40Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Lekin supervisor ne bola tha 10 minute baad seedha half-day cut hoga?',
    answerText: 'नहीं, कंपनी की आधिकारिक नीति के अनुसार 10 मिनट के बाद सिर्फ लेट मार्क लगता है। तुरंत हाफ-डे नहीं कटता। महीने में 3 लेट होने पर ही 30 मिनट की कटौती होती है।',
    topic: 'shifts',
    subtopic: 'Shift Timings, Grace Period & Night Allowance',
    followupCount: 3,
    feedback: 'confused',
    factory: 'Manesar Auto Unit 1',
    shift: 'Morning',
    audioUsed: false,
  },
  {
    id: 'q-109',
    workerId: 'WRK-2091',
    timestamp: '2026-10-28T15:10:00Z',
    channel: 'whatsapp',
    language: 'bn',
    questionText: 'Ot hiseb e basic salary dhora hoy naki total gross salary?',
    answerText: 'ওভারটাইম শুধুমাত্র আপনার বেসিক (Basic per hour) বেতনের দ্বিগুণ হিসেবে হিসাব করা হয়, গ্রস বেতনের উপর নয়।',
    topic: 'wages',
    subtopic: 'Overtime Rate & Calculation Rule',
    followupCount: 2,
    feedback: 'confused',
    factory: 'Surat Textile Mills',
    shift: 'Evening',
    audioUsed: false,
  },
  {
    id: 'q-110',
    workerId: 'WRK-4482',
    timestamp: '2026-10-28T11:45:00Z',
    channel: 'web_kiosk',
    language: 'hi',
    questionText: 'Chhuti lene ke liye form kisse lena hota hai?',
    answerText: 'काम साथी या सुपरवाइजर को 48 घंटे पहले सूचित करें। अचानक छुट्टी के लिए सुबह 9 बजे से पहले सूचित करें।',
    topic: 'leave',
    subtopic: 'Paid Leave, Festival Holidays & Emergency Leave Application',
    followupCount: 1,
    feedback: 'helpful',
    factory: 'Manesar Auto Unit 1',
    shift: 'Morning',
    audioUsed: false,
  },
  {
    id: 'q-111',
    workerId: 'WRK-1844',
    timestamp: '2026-10-27T17:20:00Z',
    channel: 'whatsapp',
    language: 'mr',
    questionText: 'Diwali bonus kiti tarke paryant milnar ahe?',
    answerText: 'वार्षिक बोनस 8.33% (किमान ₹7,000) दिवाळीच्या 15 दिवस आधी सर्व पात्र कामगारांच्या खात्यात जमा होईल.',
    topic: 'wages',
    subtopic: 'Overtime Rate & Calculation Rule',
    followupCount: 0,
    feedback: 'helpful',
    factory: 'Pune Foundry',
    shift: 'Morning',
    audioUsed: true,
  },
  {
    id: 'q-112',
    workerId: 'WRK-9402',
    timestamp: '2026-10-27T14:10:00Z',
    channel: 'whatsapp',
    language: 'te',
    questionText: 'Sunday roju duty cheste overtime 1.5x aa leka 2x aa?',
    answerText: 'కంపెనీ కొత్త రూల్ ప్రకారం వీక్లీ ఆఫ్ (ఆదివారం) డ్యూటీ చేసినప్పుడు 2.0x (డబుల్) రేట్ ఇవ్వబడుతుంది.',
    topic: 'wages',
    subtopic: 'Overtime Rate & Calculation Rule',
    followupCount: 2,
    feedback: 'confused',
    factory: 'Chennai Auto Hub',
    shift: 'Morning',
    audioUsed: true,
  },
  {
    id: 'q-113',
    workerId: 'WRK-3321',
    timestamp: '2026-10-26T20:00:00Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Night shift ka ₹180 har din alag se milta hai ya mahine me?',
    answerText: 'यह ₹180 हर नाइट शिफ्ट के हिसाब से आपकी पेस्लिप में जुड़कर महीने की 7 तारीख को सैलरी के साथ आता है।',
    topic: 'shifts',
    subtopic: 'Shift Timings, Grace Period & Night Allowance',
    followupCount: 1,
    feedback: 'helpful',
    factory: 'Manesar Auto Unit 1',
    shift: 'Night',
    audioUsed: false,
  },
  {
    id: 'q-114',
    workerId: 'WRK-7811',
    timestamp: '2026-10-26T16:45:00Z',
    channel: 'voice_kiosk',
    language: 'hi',
    questionText: 'Press shop me earplug nahi pehna to fine lagta hai kya?',
    answerText: 'हाँ, प्रेस और लूम सेक्शन में सुरक्षा के लिए इयरप्लग अनिवार्य है। सुरक्षा नियमों का उल्लंघन करने पर चेतावनी और सुरक्षा प्रशिक्षण दिया जाता है।',
    topic: 'safety',
    subtopic: 'Mandatory PPE & Emergency Evacuation Protocol',
    followupCount: 0,
    feedback: 'helpful',
    factory: 'Manesar Auto Unit 1',
    shift: 'Evening',
    audioUsed: true,
  },
  {
    id: 'q-115',
    workerId: 'WRK-8901',
    timestamp: '2026-10-25T11:15:00Z',
    channel: 'whatsapp',
    language: 'hi',
    questionText: 'Contract worker aur permanent worker ka overtime rate same hai?',
    answerText: 'हाँ, फैक्ट्री एक्ट के तहत सभी कॉन्ट्रैक्ट और परमानेंट कामगारों के लिए 8 घंटे के बाद का अतिरिक्त कार्य 2.0x बेसिक दर पर अनिवार्य है।',
    topic: 'wages',
    subtopic: 'Overtime Rate & Calculation Rule',
    followupCount: 2,
    feedback: 'confused',
    factory: 'Manesar Auto Unit 1',
    shift: 'Morning',
    audioUsed: false,
  },
];

// -------------------------------------------------------------
// Helper: Calculate Confusion Meter Score
// Formula: confusion_score = normalize(w1*(queries_per_worker) + w2*(avg_followups) + w3*(1 - helpful_ratio))
// -------------------------------------------------------------
function calculateMetrics(factoryFilter?: string, shiftFilter?: string) {
  let filtered = queryLogs;
  if (factoryFilter && factoryFilter !== 'all') {
    filtered = filtered.filter((q) => q.factory === factoryFilter);
  }
  if (shiftFilter && shiftFilter !== 'all') {
    filtered = filtered.filter((q) => q.shift === shiftFilter);
  }

  // Aggregate by Topic
  const topicMap: Record<
    string,
    {
      topic: string;
      label: string;
      queryCount: number;
      workerIds: Set<string>;
      totalFollowups: number;
      helpfulCount: number;
      confusedCount: number;
      totalWithFeedback: number;
      languages: Record<string, number>;
      sampleQuestions: string[];
    }
  > = {};

  // Initialize from known policy categories
  const categoryLabels: Record<string, string> = {
    wages: 'Wages & Overtime',
    shifts: 'Shifts & Attendance',
    safety: 'Safety Rules & PPE',
    benefits: 'Benefits & Medical (ESI/PF)',
    complaints: 'Grievance & Complaints',
    leave: 'Leave & Attendance',
  };

  for (const cat of Object.keys(categoryLabels)) {
    topicMap[cat] = {
      topic: cat,
      label: categoryLabels[cat],
      queryCount: 0,
      workerIds: new Set(),
      totalFollowups: 0,
      helpfulCount: 0,
      confusedCount: 0,
      totalWithFeedback: 0,
      languages: {},
      sampleQuestions: [],
    };
  }

  filtered.forEach((q) => {
    const t = q.topic || 'wages';
    if (!topicMap[t]) {
      topicMap[t] = {
        topic: t,
        label: categoryLabels[t] || t,
        queryCount: 0,
        workerIds: new Set(),
        totalFollowups: 0,
        helpfulCount: 0,
        confusedCount: 0,
        totalWithFeedback: 0,
        languages: {},
        sampleQuestions: [],
      };
    }
    const item = topicMap[t];
    item.queryCount += 1;
    item.workerIds.add(q.workerId);
    item.totalFollowups += q.followupCount || 0;
    if (q.feedback === 'helpful') {
      item.helpfulCount += 1;
      item.totalWithFeedback += 1;
    } else if (q.feedback === 'confused') {
      item.confusedCount += 1;
      item.totalWithFeedback += 1;
    }
    item.languages[q.language] = (item.languages[q.language] || 0) + 1;
    if (item.sampleQuestions.length < 5) {
      item.sampleQuestions.push(q.questionText);
    }
  });

  // Calculate Confusion Score 0 - 100 for each topic
  const topicsArray = Object.values(topicMap).map((m) => {
    const uniqueWorkers = Math.max(m.workerIds.size, 1);
    const queriesPerWorker = m.queryCount / uniqueWorkers; // e.g. 1.0 to 3.0
    const avgFollowups = m.queryCount > 0 ? m.totalFollowups / m.queryCount : 0; // 0 to 3.0
    const helpfulRatio =
      m.totalWithFeedback > 0 ? m.helpfulCount / m.totalWithFeedback : 0.7; // default 0.7 if no feedback
    const unhelpfulRatio = 1 - helpfulRatio; // 0 to 1

    // Weighted raw score: w1=25, w2=35, w3=40 (normalized to ~ 0-100 scale)
    let rawScore =
      (queriesPerWorker - 1) * 20 +
      avgFollowups * 25 +
      unhelpfulRatio * 45;

    // Minimum baseline based on query activity
    if (m.queryCount > 0) {
      rawScore = Math.min(Math.max(rawScore + 15, 10), 98);
    } else {
      rawScore = 0;
    }

    const confusionScore = Math.round(rawScore);

    let status: 'severe' | 'moderate' | 'healthy' = 'healthy';
    if (confusionScore >= 65) status = 'severe';
    else if (confusionScore >= 40) status = 'moderate';

    return {
      topic: m.topic,
      label: m.label,
      queryCount: m.queryCount,
      uniqueWorkers: m.workerIds.size,
      avgFollowups: Number(avgFollowups.toFixed(1)),
      helpfulRatio: Math.round(helpfulRatio * 100),
      confusionScore,
      status,
      languages: m.languages,
      sampleQuestions: m.sampleQuestions,
      suggestedAction:
        confusionScore >= 65
          ? 'Urgent: Issue factory floor announcement in Hindi & Bangla. Supervisors report conflicting answers.'
          : confusionScore >= 40
          ? 'Clarify policy wording in KaamSathi FAQ and post reminder flyer at canteen.'
          : 'Workers understand policy well. Routine monitoring active.',
    };
  });

  // Sort by confusion score descending
  topicsArray.sort((a, b) => b.confusionScore - a.confusionScore);

  // Language Breakdown
  const languageCounts: Record<string, number> = {};
  filtered.forEach((q) => {
    languageCounts[q.language] = (languageCounts[q.language] || 0) + 1;
  });

  // Channel Breakdown
  const channelCounts = {
    whatsapp: filtered.filter((q) => q.channel === 'whatsapp').length,
    web_kiosk: filtered.filter((q) => q.channel === 'web_kiosk').length,
    voice_kiosk: filtered.filter((q) => q.channel === 'voice_kiosk').length,
  };

  // Voice vs Text
  const voiceCount = filtered.filter((q) => q.audioUsed).length;
  const textCount = filtered.length - voiceCount;

  return {
    totalQueries: filtered.length,
    topics: topicsArray,
    languageCounts,
    channelCounts,
    voiceSharePercentage: filtered.length > 0 ? Math.round((voiceCount / filtered.length) * 100) : 0,
    mostConfusingTopic: topicsArray[0] || null,
    overallConfusionAverage:
      topicsArray.length > 0
        ? Math.round(
            topicsArray.reduce((acc, t) => acc + t.confusionScore, 0) /
              topicsArray.filter((t) => t.queryCount > 0).length || 1
          )
        : 0,
  };
}

// -------------------------------------------------------------
// Fallback Matching Engine (when Gemini key is not configured or offline)
// -------------------------------------------------------------
function matchPolicyLocally(userQuery: string, lang: string = 'hi') {
  const qLower = userQuery.toLowerCase();
  
  // Scoring
  let bestMatch: Policy = policies[0];
  let highestScore = 0;

  for (const pol of policies) {
    let score = 0;
    const cat = pol.category.toLowerCase();
    const title = pol.title.toLowerCase();
    const canQ = pol.canonicalQuestion.toLowerCase();
    const canA = pol.canonicalAnswer.toLowerCase();

    // Keywords
    if (qLower.includes('overtime') || qLower.includes('ot') || qLower.includes('डबल') || qLower.includes('सैलरी') || qLower.includes('वेतन') || qLower.includes('payment') || qLower.includes('salary')) {
      if (cat === 'wages') score += 10;
    }
    if (qLower.includes('shift') || qLower.includes('शिफ्ट') || qLower.includes('punch') || qLower.includes('late') || qLower.includes('night') || qLower.includes('नाइट') || qLower.includes('लेट')) {
      if (cat === 'shifts') score += 10;
    }
    if (qLower.includes('safety') || qLower.includes('सुरक्षा') || qLower.includes('जूते') || qLower.includes('alarm') || qLower.includes('सायरन') || qLower.includes('आग') || qLower.includes('ppe')) {
      if (cat === 'safety') score += 10;
    }
    if (qLower.includes('esi') || qLower.includes('doctor') || qLower.includes('अस्पताल') || qLower.includes('दवा') || qLower.includes('medical') || qLower.includes('इलाज')) {
      if (cat === 'benefits') score += 10;
    }
    if (qLower.includes('complaint') || qLower.includes('शिकायत') || qLower.includes('supervisor') || qLower.includes('सुपरवाइजर') || qLower.includes('गुप्त') || qLower.includes('anonymous')) {
      if (cat === 'complaints') score += 10;
    }
    if (qLower.includes('leave') || qLower.includes('छुट्टी') || qLower.includes('chhutti') || qLower.includes('sick') || qLower.includes('बीमार')) {
      if (cat === 'leave') score += 10;
    }

    // Term checks
    const terms = qLower.split(/\s+/);
    for (const term of terms) {
      if (term.length > 2) {
        if (title.includes(term)) score += 3;
        if (canQ.includes(term)) score += 2;
        if (canA.includes(term)) score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = pol;
    }
  }

  // Answer in the selected language if available
  const translation = bestMatch.translations[lang] || bestMatch.translations['hi'] || bestMatch.translations['en'];
  return {
    policy: bestMatch,
    answer: translation.answer,
    confidence: highestScore > 0 ? 0.92 : 0.75,
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Worker Chat & WhatsApp Handler
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      language = 'hi',
      channel = 'whatsapp',
      workerId = 'WRK-' + Math.floor(1000 + Math.random() * 9000),
      factory = 'Manesar Auto Unit 1',
      shift = 'Morning',
      audioUsed = false,
      followupCount = 0,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    // Build context from current approved factory policies
    const policiesContext = policies
      .map(
        (p, idx) =>
          `[Policy ${idx + 1} | Category: ${p.category} | Title: ${p.title}]\n` +
          `Canonical Question: ${p.canonicalQuestion}\n` +
          `Approved Answer: ${p.canonicalAnswer}\n` +
          (p.translations[language] ? `Local translation (${language}): ${p.translations[language].answer}\n` : '')
      )
      .join('\n---\n');

    let replyText = '';
    let detectedTopic = 'wages';
    let matchedSubtopic = 'Overtime Rate & Calculation Rule';

    if (ai) {
      try {
        const prompt = `You are KaamSathi (काम साथी), an empathetic, crystal-clear, multilingual AI assistant for factory floor workers (migrant and daily-wage workers in India).
Your primary mission: Explain company policies simply and reassuringly in the worker's chosen language (${language} or detected language).
Worker's query: "${message}"

CRITICAL RULES:
1. Ground your response 100% in the following FACTORY-APPROVED POLICIES. Do NOT invent policies or make up numbers.
2. Tone: Respectful, brotherly/sisterly, simple, reassuring. Use simple everyday words (avoid hard legal jargon).
3. If speaking Hindi/Hinglish/Bengali/Tamil, use colloquial respectful terms (e.g. "नमस्ते साथी", "चिंता मत कीजिए", "আপনার চিন্তা নেই").
4. Keep the explanation concise (2-4 sentences max) because workers listen or read on mobile phones on the factory floor.
5. Also output a strict JSON classification at the bottom on its own line:
TOPIC_JSON:{"topic":"wages|shifts|safety|benefits|complaints|leave","subtopic":"string title"}

FACTORY POLICIES:
${policiesContext}
`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 5000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          }),
          timeoutPromise,
        ]);

        const raw = response.text || '';
        // Extract TOPIC_JSON if present
        const jsonMatch = raw.match(/TOPIC_JSON:({.*})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            detectedTopic = parsed.topic || detectedTopic;
            matchedSubtopic = parsed.subtopic || matchedSubtopic;
          } catch {
            // ignore
          }
          replyText = raw.replace(/TOPIC_JSON:({.*})/, '').trim();
        } else {
          replyText = raw.trim();
        }
      } catch (err) {
        console.warn('Gemini API call error, using local policy matcher:', err);
        const match = matchPolicyLocally(message, language);
        replyText = match.answer;
        detectedTopic = match.policy.category;
        matchedSubtopic = match.policy.title;
      }
    } else {
      const match = matchPolicyLocally(message, language);
      replyText = match.answer;
      detectedTopic = match.policy.category;
      matchedSubtopic = match.policy.title;
    }

    // Log Query into Analytics Store
    const newLog: QueryLog = {
      id: 'q-' + Date.now(),
      workerId,
      timestamp: new Date().toISOString(),
      channel: channel as any,
      language,
      questionText: message,
      answerText: replyText,
      topic: detectedTopic,
      subtopic: matchedSubtopic,
      followupCount: followupCount || (message.length < 20 ? 1 : 0),
      feedback: null,
      factory,
      shift: shift as any,
      audioUsed: Boolean(audioUsed),
    };
    queryLogs.unshift(newLog);

    // Keep log buffer bounded
    if (queryLogs.length > 500) {
      queryLogs = queryLogs.slice(0, 500);
    }

    res.json({
      queryId: newLog.id,
      reply: replyText,
      language,
      topic: detectedTopic,
      subtopic: matchedSubtopic,
      workerId,
      timestamp: newLog.timestamp,
    });
  } catch (error) {
    console.error('Error handling /api/chat:', error);
    res.status(500).json({ error: 'Failed to process worker message' });
  }
});

// 2. WhatsApp Webhook Simulator & Receiver (Twilio / Meta compatible)
app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    const { From, Body, MediaUrl0 } = req.body;
    const workerPhone = From || '+919876543210';
    const anonymizedWorkerId = 'WRK-' + workerPhone.slice(-4);
    const text = Body || (MediaUrl0 ? 'Voice message received from worker' : 'Namaste');

    // Forward to chat processor
    const match = matchPolicyLocally(text, 'hi');
    const newLog: QueryLog = {
      id: 'q-' + Date.now(),
      workerId: anonymizedWorkerId,
      timestamp: new Date().toISOString(),
      channel: 'whatsapp',
      language: 'hi',
      questionText: text,
      answerText: match.answer,
      topic: match.policy.category,
      subtopic: match.policy.title,
      followupCount: 0,
      feedback: null,
      factory: 'Manesar Auto Unit 1',
      shift: 'Morning',
      audioUsed: Boolean(MediaUrl0),
    };
    queryLogs.unshift(newLog);

    // Respond in Twilio TwiML / Meta response format
    res.json({
      status: 'success',
      replyMessage: match.answer,
      optionsMenu: [
        '1: Salary & Overtime details',
        '2: Shift & Attendance rules',
        '3: Emergency & Safety help',
        '4: Anonymous Complaint box',
      ],
      queryId: newLog.id,
    });
  } catch (error) {
    console.error('Error in /api/whatsapp/webhook:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// 3. Feedback endpoint (worker taps "1: Helpful" or "2: Confused / Not helpful")
app.post('/api/queries/:id/feedback', (req: Request, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body; // 'helpful' | 'confused'
  const log = queryLogs.find((q) => q.id === id);
  if (!log) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }
  log.feedback = feedback === 'helpful' ? 'helpful' : 'confused';
  res.json({ success: true, updatedFeedback: log.feedback });
});

// 4. Centralized Policy Management Endpoints
app.get('/api/policies', (_req: Request, res: Response) => {
  res.json({ policies });
});

app.post('/api/policies', (req: Request, res: Response) => {
  const { category, categoryLabel, title, canonicalQuestion, canonicalAnswer, translations, user } = req.body;
  if (!title || !canonicalQuestion || !canonicalAnswer) {
    res.status(400).json({ error: 'Title, question, and answer are required' });
    return;
  }

  const newPolicy: Policy = {
    id: 'pol-' + Date.now(),
    category: category || 'wages',
    categoryLabel: categoryLabel || 'General Policy',
    title,
    canonicalQuestion,
    canonicalAnswer,
    translations: translations || {
      en: { languageCode: 'en', languageName: 'English', question: canonicalQuestion, answer: canonicalAnswer },
    },
    lastUpdated: new Date().toISOString(),
    updatedBy: user || 'HR Administrator',
    version: 1,
    changeLog: [
      {
        version: 1,
        date: new Date().toISOString().split('T')[0],
        user: user || 'HR Administrator',
        note: 'Policy created',
      },
    ],
  };

  policies.unshift(newPolicy);
  res.json({ success: true, policy: newPolicy });
});

app.put('/api/policies/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { category, categoryLabel, title, canonicalQuestion, canonicalAnswer, translations, user, note } = req.body;
  const pol = policies.find((p) => p.id === id);
  if (!pol) {
    res.status(404).json({ error: 'Policy not found' });
    return;
  }

  if (category) pol.category = category;
  if (categoryLabel) pol.categoryLabel = categoryLabel;
  if (title) pol.title = title;
  if (canonicalQuestion) pol.canonicalQuestion = canonicalQuestion;
  if (canonicalAnswer) pol.canonicalAnswer = canonicalAnswer;
  if (translations) pol.translations = translations;

  pol.version += 1;
  pol.lastUpdated = new Date().toISOString();
  pol.updatedBy = user || 'HR Administrator';
  pol.changeLog.unshift({
    version: pol.version,
    date: new Date().toISOString().split('T')[0],
    user: user || 'HR Administrator',
    note: note || `Updated policy v${pol.version}`,
  });

  res.json({ success: true, policy: pol });
});

app.delete('/api/policies/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  policies = policies.filter((p) => p.id !== id);
  res.json({ success: true });
});

// 5. One-Click AI Translation & Simplification for Factory Workers
app.post('/api/policies/translate', async (req: Request, res: Response) => {
  try {
    const { question, answer, targetLanguages = ['hi', 'bn', 'ta', 'mr', 'te'] } = req.body;
    if (!answer) {
      res.status(400).json({ error: 'Answer text is required' });
      return;
    }

    if (ai) {
      const prompt = `You are a professional factory communication translator specializing in simplifying HR policies for factory floor frontline and migrant workers in India.
Translate the following HR policy question and answer into the following target language codes: ${targetLanguages.join(
        ', '
      )}.
Rule:
1. Phrasing must be simple, spoken/conversational colloquial language suitable for audio reading to low-literacy workers.
2. Maintain precise numbers (e.g. 2.0x, ₹180, 8 hours, 7th of month).
3. Return valid JSON only with keys matching the language codes.

Source English Question: "${question}"
Source English Answer: "${answer}"

Format:
{
  "hi": { "languageCode": "hi", "languageName": "Hindi (हिन्दी)", "question": "...", "answer": "..." },
  "bn": { "languageCode": "bn", "languageName": "Bengali (বাংলা)", "question": "...", "answer": "..." },
  "ta": { "languageCode": "ta", "languageName": "Tamil (தமிழ்)", "question": "...", "answer": "..." },
  "mr": { "languageCode": "mr", "languageName": "Marathi (मराठी)", "question": "...", "answer": "..." },
  "te": { "languageCode": "te", "languageName": "Telugu (తెలుగు)", "question": "...", "answer": "..." }
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonStr = (response.text || '{}').trim();
      const parsed = JSON.parse(jsonStr);
      res.json({ success: true, translations: parsed });
    } else {
      // Offline fallback translations
      res.json({
        success: true,
        translations: {
          hi: {
            languageCode: 'hi',
            languageName: 'Hindi (हिन्दी)',
            question: question,
            answer: `[हिन्दी अनुवाद]: ${answer}`,
          },
          bn: {
            languageCode: 'bn',
            languageName: 'Bengali (বাংলা)',
            question: question,
            answer: `[বাংলা অনুবাদ]: ${answer}`,
          },
          ta: {
            languageCode: 'ta',
            languageName: 'Tamil (தமிழ்)',
            question: question,
            answer: `[தமிழ் மொழிபெயர்ப்பு]: ${answer}`,
          },
        },
      });
    }
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Failed to translate policy' });
  }
});

// 6. Confusion Meter Analytics Engine
app.get('/api/analytics/confusion-meter', (req: Request, res: Response) => {
  const { factory, shift } = req.query;
  const metrics = calculateMetrics(factory as string, shift as string);
  res.json(metrics);
});

// 7. Query Logs & Audit Trail
app.get('/api/queries', (req: Request, res: Response) => {
  const { topic, language, search, channel, limit = 50 } = req.query;
  let results = [...queryLogs];

  if (topic && topic !== 'all') {
    results = results.filter((q) => q.topic === topic);
  }
  if (language && language !== 'all') {
    results = results.filter((q) => q.language === language);
  }
  if (channel && channel !== 'all') {
    results = results.filter((q) => q.channel === channel);
  }
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    results = results.filter(
      (q) =>
        q.questionText.toLowerCase().includes(s) ||
        q.answerText.toLowerCase().includes(s) ||
        q.workerId.toLowerCase().includes(s)
    );
  }

  res.json({
    total: results.length,
    queries: results.slice(0, Number(limit)),
  });
});

// 8. Generate Multilingual Factory Floor Notice (for notice boards or WhatsApp broadcast)
app.post('/api/broadcast/generate-notice', async (req: Request, res: Response) => {
  try {
    const { topic, reason } = req.body;
    const policy = policies.find((p) => p.category === topic) || policies[0];

    if (ai) {
      const prompt = `You are a factory communication expert. The HR Confusion Meter detected high confusion among workers about topic: "${policy.title}".
Reason: "${reason || 'Repeated questions and contradictory supervisor advice'}".
Official Policy: "${policy.canonicalAnswer}".

Generate a 1-page high-impact, easy-to-read Factory Notice Board Announcement.
It must include:
1. Catchy headline in Hindi & English
2. 3 bullet points with bold numbers & clear rules in Hindi, Bengali, and English
3. Reassurance that workers will not lose wages if they follow procedures
4. Support contact / WhatsApp QR mention

Keep it very readable for frontline factory workers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({ noticeText: response.text });
    } else {
      res.json({
        noticeText: `📢 महत्वपूर्ण सूचना / FACTORY NOTICE\nविषय: ${policy.title}\n\nसभी कामगार साथियों को सूचित किया जाता है कि:\n1. ${policy.canonicalAnswer}\n2. किसी भी अफवाह पर ध्यान न दें। किसी भी सवाल के लिए काम साथी (KaamSathi) से तुरंत पूछें।\n3. एचआर विभाग, फोन: 1800-419-7022`,
      });
    }
  } catch (err) {
    console.error('Notice generation error:', err);
    res.status(500).json({ error: 'Failed to generate factory notice' });
  }
});

// -------------------------------------------------------------
// Start Express + Vite Dev Middlewares
// -------------------------------------------------------------
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KaamSathi AI running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
