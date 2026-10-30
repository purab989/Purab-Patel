# KaamSathi AI Bot – Build Plan (Hackathon)

---

## 1. Problem Statement

Factory floors rely on supervisors and word-of-mouth to explain critical information about:

- Wages and overtime
- Shift timings and attendance
- Safety rules and incident procedures
- Benefits, holidays, and leave
- Grievance and complaint channels

For **migrant and daily-wage factory workers**, this leads to:

- Confusion due to **language barriers** (Hindi, Bangla, Tamil, etc. vs. HR policies in English/local language).
- **Inconsistent answers**: different supervisors say different things.
- **Low literacy** makes text-heavy notice boards or PDFs unusable.
- Workers **fear retaliation** or embarrassment when asking “basic” questions repeatedly.
- No systematic way to see **what’s misunderstood** or how often workers are confused.

For **HR and supervisors**:

- They spend large amounts of time **repeating the same explanations**.
- Policy changes are sent via WhatsApp/printouts, but workers **don’t see** or **don’t understand** them.
- There are **no metrics** on:
  - What workers are most confused about
  - Which languages need more support
  - Which factories/departments miscommunicate the most

Root cause:  
Worker communication has not been intentionally designed, owned, and **measured** as a critical, multilingual service. Because organizations don’t collect metrics on confusion and misinformation, they continue relying on overstretched supervisors, instead of building a **centralized, worker-centric, multilingual information system**.

---

## 2. Solution Overview

**KaamSathi** is a multilingual AI companion for factory workers, accessible via **WhatsApp** and a simple **web/app** interface.

Core idea:

- Workers **ask in their own language**, by **voice or text**, about wages, shifts, safety, benefits, and complaints.
- KaamSathi answers using **factory-approved information only**, ensuring consistency and policy compliance.
- All worker queries are **logged and analyzed across languages**.
- A **Confusion Meter Dashboard** shows HR and supervisors where workers are most confused, turning daily questions into **communication metrics** and insights.
- HR and supervisors use a **Centralized Policy Update System** so any policy update is instantly reflected in KaamSathi’s answers.

This makes worker communication:

- **Accessible** (voice, multilingual)
- **Consistent** (single source of truth)
- **Measurable** (confusion meter and query patterns)
- **Scalable** (handles thousands of repeated queries without using supervisor time)

---

## 3. Target Users

### 3.1 Primary Users – Factory Workers (Migrant & Daily-Wage)

**Profiles:**

- Age: 18–45
- Languages: e.g., Hindi, Bangla, Tamil, Telugu, Marathi, Odia, English, etc.
- Many with limited literacy; comfortable with voice notes and WhatsApp.

**Needs:**

- Ask questions **any time** without fear or shame.
- Understand **wages**, **deductions**, **overtime**, **shift rules**, **attendance penalties**.
- Know **safety rules**, PPE requirements, accident reporting process.
- Understand **leave**, **PF/ESI**, bonuses, holidays.
- Know **how to file complaints** safely (grievances, harassment, unsafe conditions).
- Use an interface they already understand (**WhatsApp**, simple voice interface).

### 3.2 Secondary Users – HR Managers & Supervisors

**Profiles:**

- HR leads, compliance officers, floor supervisors, factory managers.

**Needs:**

- A **single place** to update all policies and FAQs.
- Ensure that every worker gets **the same, correct answer**.
- Save time spent answering basic questions.
- Identify **where communication is failing** via:
  - Confusion Meter Dashboard
  - Query Pattern Logging
- Monitor worker concerns across **languages, departments, and shifts**.

---

## 4. Key Features

You MUST implement and reference **all** of these in the build:

1. **Multilingual Q&A Interface**
   - Chat interface (web + backend API) that understands and answers queries in multiple languages.
   - Covers topics: wages, shifts, safety, benefits, complaints, leave, bonuses.

2. **WhatsApp Integration**
   - Official WhatsApp entry point so workers can chat with KaamSathi from their own phones.
   - No separate app installation required.

3. **Centralized Policy Update System**
   - HR-facing web dashboard to manage:
     - Policies, FAQs, standard operating procedures
     - Language-specific versions (e.g., Hindi copy vs. English copy)
   - All updates become **the single source of truth** for KaamSathi.

4. **Confusion Meter Dashboard**
   - Analytics view for HR/supervisors showing:
     - Most frequently asked questions/topics
     - Topics with highest “confusion” scores (e.g., repeated follow-ups, contradictory questions)
     - Trends over time (before/after training or policy updates)

5. **Voice Command Support**
   - Workers can **speak** their query instead of typing.
   - System converts speech-to-text, processes, and replies via text and/or synthesized speech.

6. **Query Pattern Logging**
   - All questions (text + transcription + language) are logged.
   - Pattern analysis feeds into the **Confusion Meter Dashboard**.
   - Enables insights: recurring doubts, misinterpretations, and emerging issues.

---

## 5. User Flow

### 5.1 Worker Flow via WhatsApp (Main Journey)

1. **Entry**
   - Worker sees a poster/notice with a WhatsApp number/QR: “Ask KaamSathi about your wages, shifts, and safety in your own language.”
   - Worker saves the number or scans QR → opens WhatsApp chat with KaamSathi.

2. **Onboarding / Language Selection**
   - Bot: “Welcome to KaamSathi. Choose your language: 1) Hindi 2) Bangla 3) Tamil 4) English …”
   - Worker presses a number or sends voice: “Hindi”.
   - Bot stores **preferred language** mapped to the worker’s phone number.

3. **Ask a Question (Text or Voice)**
   - Worker types: “Mera overtime kaise calculate hota hai?”  
     or sends a voice note in Hindi/Bangla/Tamil etc.
   - If voice:
     - Bot downloads voice message → runs Speech-to-Text (STT) → gets text + detected language.

4. **Processing the Query**
   - Backend pipeline:
     - Detect language (or use STT metadata).
     - Normalize/translate into a canonical internal language (e.g., English) if needed.
     - Search policy database/FAQ in the **Centralized Policy Update System** for relevant answer.
     - Use LLM or rule-based templates to **generate a concise, worker-friendly response**.
   - At the same time, log:
     - User ID (hashed phone or anonymized worker ID)
     - Original question text + language
     - Mapped topic (e.g., “wages.overtime”)
     - Confidence score
     - Number of follow-up questions

5. **Responding to Worker**
   - Text reply in the worker’s preferred language.
     - Example: “Aapka overtime aapki basic per hour rate ka 2x ke hisaab se calculate hota hai. Agar aap 8 ghante se zyada kaam karte hain, har extra ghanta overtime maana jaata hai…”
   - If voice reply enabled:
     - Generate Text-to-Speech (TTS) audio and send an audio clip back.
   - Optionally include **menu suggestions**:
     - “Type 1 to ask about salary details, 2 for leaves, 3 for safety rules, 4 for complaint process.”

6. **Follow-up Questions**
   - Worker asks a clarification: “Agar main Sunday ko kaam karu toh kya hoga?”
   - System recognizes as a follow-up in same **topic thread** (overtime/wages).
   - This repeated clarification increases the **confusion score** for that specific policy topic.

7. **Optional Feedback**
   - Bot: “Did this answer your question? Reply 1 = Yes, 2 = No.”
   - ‘No’ increases confusion score, logs examples for HR.

---

### 5.2 Worker Flow via Web/App (Backup Interface)

1. Worker opens a simple web page on a shared tablet/kiosk or personal phone.
2. Login or lightweight identification (e.g., choose factory + (optional) worker ID or anonymous).
3. Select language.
4. Ask question via:
   - Typing in a chat box.
   - Press-and-hold microphone button → speak a question.
5. See text reply + “Play audio” button for TTS answer.
6. Same logging and confusion tracking as WhatsApp.

---

### 5.3 HR / Supervisor Flow – Centralized Policy Update System

1. **Login**
   - HR goes to admin web dashboard (KaamSathi Admin).
   - Logs in via email/password or SSO.

2. **View Policy Library**
   - Sees list: “Wages & Overtime”, “Shifts & Attendance”, “Safety Rules”, “Benefits”, “Complaints & Grievance”.
   - Each policy/FAQ has:
     - Policy title
     - Canonical version (e.g., English)
     - Translated versions (Hindi, Bangla, etc.)
     - Last updated date and updated by whom.

3. **Add / Update Policy**
   - Click “Add New FAQ” → fill form:
     - Category: Wages
     - Question: “How is overtime calculated?”
     - Answer (canonical): Text.
     - Optionally paste translations, or click “Auto-translate” and then review/edit.
   - Save.
   - This becomes immediately available to the **Multilingual Q&A Interface**.

4. **Approval Flow (optional for hackathon)**
   - Draft → Reviewed → Approved statuses.
   - Only Approved content is served to workers.

5. **Version History**
   - HR can view previous versions and reasons for updates (e.g., “Overtime rule changed from 1.5x to 2x as of May 2024”).

---

### 5.4 HR / Supervisor Flow – Confusion Meter Dashboard

1. **Open Analytics Tab**
   - HR clicks on “Confusion Meter”.

2. **Key Widgets**
   - **Top Confusing Topics**:
     - Bar chart: Topic vs Confusion Score (0–100).
       - Score computed from:
         - Volume of queries per worker per month
         - Number of follow-ups per query
         - % of “Not helpful” feedback
   - **Most Asked Questions**:
     - List of FAQs sorted by query count.
     - Example: “Overtime calculation (Hindi) – 345 queries this month.”
   - **Language Breakdown**:
     - Pie chart: % of queries by language.
   - **Time Trends**:
     - Line chart: confusion score per topic over last 3 months.
     - Example: safety confusion dropped after new training video.

3. **Drill-down**
   - Click on “Wages → Overtime”:
     - See sample anonymized questions:
       - “Kya Sunday ko overtime milega?”
       - “Mujhe double overtime kyu nahi mil raha?”
     - See which factory/department/language these are coming from.

4. **Action**
   - HR uses insights to:
     - Update policy explanations in simpler language.
     - Schedule targeted training for specific locations/shifts.
   - After action, they can revisit the Confusion Meter to see if the confusion score declines.

---

### 5.5 System Flow – Query Pattern Logging

- For every query (WhatsApp or web):
  - Capture:
    - Timestamp
    - Worker ID (hashed phone or anonymous token)
    - Language (detected or chosen)
    - Original text (and audio URL if voice)
    - Topic classification (e.g., wages, safety, benefits)
    - Sub-topic tags (e.g., “overtime”, “night shift”)
    - Whether follow-up chain exists
    - Feedback score (if given)
  - Store in a **Query Log database**.
  - A daily/periodic job aggregates:
    - Query counts by topic, language, factory, department
    - Confusion scores per topic
  - These aggregates power the **Confusion Meter Dashboard**.

---

## 6. Technical Approach

Aim: Choose technologies that are **easy to prototype in a hackathon** yet realistic.

### 6.1 High-Level Architecture

- **Frontend**
  - Worker web/app (simple chat UI + voice controls).
  - HR Admin Dashboard (policy management + confusion meter).
- **Backend API**
  - Node.js/Express or Python/FastAPI server.
  - Handles:
    - WhatsApp webhook
    - Chat logic
    - Policy retrieval & search
    - Query logging
- **AI/NLP Layer**
  - Language detection
  - Speech-to-Text (STT)
  - Text-to-Speech (TTS)
  - LLM-based Q&A generation using factory-approved content.
- **Databases**
  - Policy & FAQ store (structured).
  - Query logs & analytics store.
  - User preferences (phone → language, factory, etc.).

---

### 6.2 Suggested Tech Stack

**Backend:**

- Language/Framework:
  - Option A: **Node.js + Express** (good for Twilio/WhatsApp integration).
  - Option B: **Python + FastAPI** (easy integration with ML libraries).
- Database:
  - **PostgreSQL** or **MySQL** for structured data (policies, users).
  - Optionally **SQLite** for hackathon demo.
- Authentication:
  - Simple JWT-based auth for HR dashboard.

**WhatsApp Integration:**

- Use:
  - **Twilio WhatsApp API**, or
  - **Meta Cloud API for WhatsApp**.
- Setup:
  - Webhook endpoint `/whatsapp/webhook`:
    - Receives incoming worker messages (text or audio).
    - Sends automatic replies via WhatsApp API.

**AI/NLP Layer:**

- **LLM**:
  - Use OpenAI GPT-4o or similar via API.
  - Prompt engineering to restrict answers to policy database content.
- **Retrieval (RAG-style)**:
  - Store policy documents in:
    - Simple text fields in DB + keyword search, or
    - Embedding-based vector DB (e.g., **Pinecone**, **Supabase Vector**, or **pgvector** extension).
  - Pipeline:
    - Map worker query → embedding → retrieve top-k relevant policy entries → feed to LLM with strict “answer using only this context” instructions.

- **Language Detection**:
  - Use fastText / langdetect, or rely on:
    - STT service’s detected language (for voice).
    - LLM classification for text if needed.

- **Speech-to-Text (STT)**:
  - Use APIs like:
    - OpenAI Whisper API
    - Google Cloud Speech-to-Text
  - Input: worker voice note from WhatsApp → audio URL → STT → text.

- **Text-to-Speech (TTS)**:
  - Use APIs like:
    - Amazon Polly
    - Google Cloud Text-to-Speech
    - OpenAI TTS where available.
  - Generate audio in worker’s selected language.

**Frontends:**

- **Worker Web Interface:**
  - Simple responsive page using:
    - React, Vue, or plain HTML/JS for hackathon speed.
  - Features:
    - Chat messages display.
    - Input box + mic button for voice capture (WebRTC / MediaRecorder).
    - Play button to listen to TTS response.

- **HR Admin Dashboard:**
  - Built using React/Vue with:
    - Components:
      - Login page
      - Policy list and edit pages (CRUD)
      - Confusion Meter dashboard (charts)
  - Charts:
    - Use **Chart.js**, **Recharts**, or **ECharts**.

---

### 6.3 Data Model (Simplified)

**Tables:**

1. `users` (HR/admin only)
   - id
   - name
   - email
   - password_hash
   - role

2. `factories`
   - id
   - name
   - location

3. `worker_profiles` (optional / anonymized)
   - id
   - phone_hash
   - preferred_language
   - factory_id (optional)

4. `policies`
   - id
   - factory_id (nullable for global)
   - category (wages, safety, etc.)
   - question_key (internal slug)
   - canonical_question
   - canonical_answer
   - last_updated_by
   - last_updated_at

5. `policy_translations`
   - id
   - policy_id
   - language_code (hi, bn, ta, en, etc.)
   - question_text
   - answer_text

6. `queries`
   - id
   - worker_profile_id (nullable)
   - factory_id (nullable)
   - language_code
   - original_text
   - audio_url (nullable)
   - detected_topic
   - detected_subtopic
   - response_id (if you store responses)
   - feedback (1=helpful, 0=not)
   - created_at

7. `topic_metrics` (aggregated daily/weekly)
   - id
   - date
   - factory_id (nullable)
   - topic
   - language_code
   - query_count
   - avg_followups
   - confusion_score

---

### 6.4 Confusion Meter Logic

**Confusion Score (per topic per period)** – illustrative formula:

```text
confusion_score = normalize(
    w1 * (queries_per_worker) +
    w2 * (avg_followups_per_query) +
    w3 * (1 - helpful_feedback_ratio)
)
```

- `queries_per_worker` = total_queries_for_topic / unique_workers_for_topic
- `avg_followups_per_query` = total_followups / total_queries
- `helpful_feedback_ratio` = (#helpful_responses / total_responses_with_feedback)
- `w1, w2, w3` = adjustable weights; for hackathon, set all to 1.

Implementation:

- A cron job (or scheduled function) runs daily:
  - Reads raw `queries` table.
  - Computes metrics per topic, language, factory.
  - Writes to `topic_metrics`.
- Dashboard reads from `topic_metrics` and visualizes.

---

### 6.5 Security & Privacy (Hackathon-Level)

- Store **hashed phone numbers** instead of raw phone numbers to protect identity.
- For demo, allow opting out: “Type ‘STOP’ to delete your previous questions.”
- Access control:
  - Only HR/supervisors with valid login can access policy editor and analytics.
- Clearly mark that this is a **prototype**; real deployment would require additional compliance.

---

## 7. Success Metrics

Define both **worker-side** and **management-side** metrics.

### 7.1 Worker-Centric Metrics

- **Adoption & Usage**
  - # of unique worker phone numbers interacting with KaamSathi.
  - # of queries per worker per week.
  - % of queries via WhatsApp vs web/app.

- **Accessibility**
  - % of voice-based queries vs text-based (higher voice share → better for low literacy).
  - # of languages actively used.

- **Satisfaction (Proxy)**
  - % of responses marked “helpful” (feedback 1 vs 0).
  - Reduction in repeated questions for the same worker on same topic over time.

### 7.2 Management-Centric Metrics

- **Efficiency**
  - Estimated hours of supervisor/HR time saved (e.g., measured via reduction in repetitive questions reported by supervisors).
  - # of FAQs/policies maintained centrally vs scattered PDFs/WhatsApp.

- **Confusion & Clarity**
  - Confusion scores for key topics (e.g., wages, safety) should **decrease** over a few weeks after targeted interventions.
  - # of topics with high confusion score → trending down after HR updates or trainings.

- **Coverage**
  - # of factories/departments connected to KaamSathi.
  - % of policies that have translations in at least X languages.

### 7.3 Hackathon Demo Criteria

For the hackathon, consider it successful if:

1. A worker can:
   - Message on WhatsApp (or demo web chat) in at least 2 languages.
   - Ask about wages/safety.
   - Get a consistent answer based on a policy defined in the admin dashboard.
   - Send a voice question and receive a useful response.

2. HR can:
   - Log into the admin dashboard.
   - Create/edit a policy (e.g., overtime rule).
   - Immediately see that the bot’s answers change for new queries.
   - See a basic Confusion Meter view with:
     - Most asked topics.
     - A mock/real confusion score for at least 2 topics.

3. The system:
   - Logs all queries.
   - Shows query counts and simple visualizations of confusion.

---

**End of Build Plan**