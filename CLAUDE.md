# RECRUILY — Claude Code Master Context

## 🎯 Was ist RECRUILY?

RECRUILY ist eine AI-gestützte B2B SaaS Recruiting-Plattform 
für den DACH-Mittelstand (Unternehmen mit 50-250 Mitarbeitern).

**Kernversprechen:** "Lade Job und CVs hoch – finde in Minuten 
die wirklich besten Kandidaten."

**Einzigartiger USP:** Einziges Tool am Markt das CV UND 
Anschreiben gemeinsam analysiert, mit erklärbarer AI, 
DSGVO-konform auf EU-Servern, AI Act compliant.

**Zielmarkt:** DACH-Mittelstand, branchenunabhängig
**Rechtsform:** E.U. (Österreich), später GmbH
**Server:** Deutschland (DSGVO-konform)

---

## 💰 Pricing & Business Model

**Abrechnungslogik:** Pro Match (1 Match = 1 CV gegen 1 Job analysiert)

| Plan | Preis | Matches | Features |
|------|-------|---------|----------|
| Free | €0 | 10 | Kein CC, nach 10 Matches → Stripe |
| Starter | €49/Mo | 50 | 1 User, Email Support |
| Growth | €149/Mo | 200 | 5 Users, Analytics (Most Popular) |
| Pro | €299/Mo | 500 | Unlimited Users, API Access |

**Jahresplan:** 2 Monate gratis (≈17% Rabatt)
**Marge:** ~97-98% Bruttomarge
**Break-Even:** Ab 1 zahlenden Kunden

---

## 🏗️ Tech Stack

### Frontend
- Next.js 14.2 (App Router, TypeScript strict mode)
- Tailwind CSS + Radix UI + shadcn/ui (102 Komponenten)
- Sprachen: DE + EN (language-context.tsx)

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Netlify (Hosting + Serverless Functions)
- Node.js 20.18.0

### AI Pipeline
- CV Parsing: Gemini 1.5 Pro (via Google AI API)
- Job Matching: Claude Sonnet via Vertex AI Frankfurt
- Model für Matching: claude-sonnet-4-20250514

### Payments (geplant Phase 4)
- Stripe (Checkout, Webhooks, Subscriptions)

### Zukünftig (V1.5)
- Retell AI für AI Screening Calls

---

## 🗄️ Datenbank Schema (Supabase)

### Tabellen
```sql
organisations
  id UUID PRIMARY KEY
  name TEXT NOT NULL
  owner_id UUID REFERENCES auth.users(id)
  domain TEXT
  created_at TIMESTAMPTZ

jobs
  id UUID PRIMARY KEY  
  title TEXT NOT NULL
  company TEXT
  description TEXT
  requirements TEXT
  location TEXT
  employment_type TEXT  -- 'full-time', 'part-time', etc.
  salary_min INTEGER
  salary_max INTEGER
  skills TEXT[]
  status TEXT CHECK (status IN ('draft','open','closed','paused'))
  organisation_id UUID REFERENCES organisations(id)
  created_by UUID REFERENCES auth.users(id)
  created_at TIMESTAMPTZ

candidates
  id UUID PRIMARY KEY
  name TEXT NOT NULL          -- SINGLE field, NO first_name/last_name!
  email TEXT UNIQUE NOT NULL
  phone TEXT
  location TEXT
  skills TEXT[]
  experience_years INTEGER
  education TEXT
  languages TEXT[]
  certifications TEXT[]
  summary TEXT
  organisation_id UUID REFERENCES organisations(id)
  created_by UUID REFERENCES auth.users(id)
  created_at TIMESTAMPTZ

matches
  id UUID PRIMARY KEY
  job_id UUID REFERENCES jobs(id)
  candidate_id UUID REFERENCES candidates(id)
  score INTEGER               -- 0-100
  strengths TEXT[]
  weaknesses TEXT[]
  skill_matches JSONB
  experience_match INTEGER
  status TEXT                 -- 'pending','shortlisted','rejected','hired'
  ai_analysis JSONB
  created_at TIMESTAMPTZ

resumes
  id UUID PRIMARY KEY
  candidate_id UUID REFERENCES candidates(id)
  file_path TEXT
  parsed_content JSONB
  parsing_status TEXT
  created_at TIMESTAMPTZ

user_profiles
  id UUID REFERENCES auth.users(id)
  organisation_id UUID REFERENCES organisations(id)
  role TEXT                   -- 'admin','manager','recruiter','viewer'
  created_at TIMESTAMPTZ
```

### ⚠️ KRITISCH - Was NICHT in der DB existiert
- ❌ KEIN `demo_mode` Feld in candidates
- ❌ KEINE `job_candidate_matches` Tabelle → heißt `matches`
- ❌ KEIN `first_name`/`last_name` → nur `name`
- ❌ KEIN `status: 'active'` in jobs → nur 'draft','open','closed','paused'
- ❌ KEIN `technical_skills` Feld in jobs
- ❌ KEIN `match_score` Feld → heißt `score`

---

## 🔐 Auth & Security Architektur

### Supabase Auth
- Email + Password Login
- Email Bestätigung via Supabase (echte Emails)
- Session via Cookies (nicht localStorage!)
- Geplant: Google & Apple Sign-In (V2)

### API Auth Pattern
```typescript
// IMMER so in API Routes:
const adminClient = createAdminClient() // Service Role - bypasses RLS
const { data: { user } } = await adminClient.auth.getUser(token)

// Bearer Token vom Client:
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
})
```

### Supabase Clients (lib/supabase.ts - SINGLE SOURCE OF TRUTH)
```typescript
import { supabase } from '@/lib/supabase'           // Browser Client (Anon)
import { createAdminClient } from '@/lib/supabase'   // Service Role (Server only!)
import { createServerSupabaseClient } from '@/lib/supabase' // SSR Client
```

### RLS Policies
- Alle Tabellen haben RLS enabled
- Policies filtern by organisation_id
- Service Role bypasses RLS (nur server-seitig!)

---

## 🚀 Feature Roadmap

### ✅ Phase 1 (Done) - Foundation
- Security fixes, TypeScript, sauberer Build
- Netlify deployed

### 🔄 Phase 2 (90% done) - Core Backend
- Supabase Auth (echte User) ✅
- Organisation Erstellung ✅
- Job Creation mit UUID ✅
- CV Upload Pipeline (fast stabil)
- Kandidat Persistenz nach F5 (in Arbeit)

### 🔜 Phase 3 - IMLRS (Intelligent Multi-Layer Recruiting System)
**Das Herzstück von RECRUILY - God Mode Matching Algo**

6 Analyse-Ebenen:
1. **Fakten-Check** - Hard Skills, Erfahrung, Ausbildung
2. **Kontext & Intelligenz** - Kultur-Fit, Job-Hopping Bewertung, Branchen-Transfer
3. **Anschreiben-Psychologie** - Engagement, Spezifität, Kommunikationsstärke
4. **Branchen-Intelligence** - Claude's Wissen aus allen Branchen
5. **Soft Skill Inferenz** - Aus CV-Sprache und Anschreiben abgeleitet
6. **Predictive Scoring** - Longevity, Potential, Culture Fit Prediction

**Matching Gewichtungen:**
- Hard Skills: 25%
- Berufserfahrung: 20%
- Soft Skills: 15% (CV + Anschreiben)
- Motivation & Kultur-Fit: 10% (Anschreiben)
- Sprachen: 8%
- Ausbildung: 8%
- Standort & Verfügbarkeit: 8%
- Gehalt: 3%
- CV Qualität: 3%

**K.O. Kriterien** (konfigurierbar per Job):
- Pflichtsprache fehlt
- Mindest-Berufserfahrung unterschritten
- Pflicht-Zertifikat fehlt
- Arbeitserlaubnis fehlt

**Output Format:**
Match Score: 87%
Executive Summary: [2-3 Sätze narrative Begründung]
✅ Stärken: [konkrete Belege aus CV/Anschreiben]
⚠️ Risiken: [spezifische Bedenken]
❌ K.O. Kriterien: [falls vorhanden]
💬 Empfehlung: [Handlungsempfehlung]

### 🔜 Phase 4 - Stripe Billing
- Stripe Checkout + Webhooks
- Match Quota System (Supabase tracking)
- Free Plan → Auto-Redirect nach 10 Matches
- Feature Gating by Plan

### 🔜 Phase 5 - SEO & AIEO
- Meta Tags, Structured Data, Sitemap
- Schema.org SoftwareApplication
- AI Engine Optimization

### 🔜 Phase 6 - Legal
- AGB Unterseite
- Impressum Unterseite
- DSGVO Dokumentation + DPA Template
- Kandidaten-Löschfunktion

### 🔜 Phase 7 - Auth Erweiterung
- Google Sign-In
- Apple Sign-In
- Branded Bestätigungsemails

### 🔜 V1.5
- AI Screening Calls via Retell AI

---

## 🔄 Kritische Workflows

### Job Creation Flow
User gibt URL ein
→ /api/scrape-url (4s timeout, kein Gemini)
→ Formular füllt sich
→ User klickt "Add to Pipeline"
→ POST /api/jobs (Bearer Token, createAdminClient)
→ UUID generiert, in Supabase gespeichert
→ router.push('/dashboard/jobs')

### CV Upload Flow
User lädt CV hoch (PDF/DOCX)
→ POST /api/parse-cv (Bearer Token + orgId in FormData)
→ Gemini 1.5 Pro parsed CV → strukturiertes JSON
→ INSERT into candidates (upsert on email conflict)
→ POST /api/jobs/[id]/add-candidate
→ INSERT into matches (score, strengths, weaknesses)
→ Kandidat erscheint im Job Container
→ Nach F5: noch da (Supabase, nicht localStorage)

### Auth Flow
Signup → Supabase Auth → Organisation erstellt → Email Bestätigung
Login → Supabase Session → Bearer Token → org_id aus organisations Tabelle

---

## 🚫 Goldene Regeln (NIEMALS brechen)

### Code Regeln
1. **NIEMALS UI/UX ändern** ohne explizite Genehmigung
2. **NIEMALS localStorage** für persistente Daten verwenden
3. **NIEMALS hardcoded** 'demo-org-123' oder andere Fake-IDs
4. **NIEMALS demo_mode** Flag setzen
5. **NIEMALS job_candidate_matches** - immer 'matches'
6. **IMMER createAdminClient()** für Supabase DB Operationen
7. **IMMER UUID** für Job IDs (nie job_TIMESTAMP_format)
8. **IMMER Bearer Token** Pattern für Client→API Auth
9. **NIEMALS Gemini Key** client-seitig verwenden
10. **NIEMALS alte Imports** (@/lib/supabaseClient etc.)

### Architektur Regeln
- Service Role Key: NUR server-seitig in API Routes
- Anon Client: NUR für Auth (Login/Signup) client-seitig
- Alle DB Reads/Writes: Durch API Routes mit Service Role
- Session: Cookies (Supabase managed), Bearer Token für API Calls

---

## 🐛 Bekannte Bugs & Status

### Aktuelle Priorität
1. CV Upload → Kandidat nach F5 noch da (kritisch)
2. "Add to Pipeline" → Redirect zu Jobs funktioniert
3. Gemini Parsing → echter Name statt Dateiname

### Gelöste Bugs (nicht wieder einbauen!)
- ✅ hardcoded demo-org-123 → echte org_id
- ✅ job_postings → jobs (Tabellenname)
- ✅ localStorage → Supabase
- ✅ TypeScript Build Errors
- ✅ Vercel Config entfernt

---

## 📁 Wichtige Dateien
lib/supabase.ts          ← SINGLE SOURCE OF TRUTH für alle Supabase Clients
contexts/auth-context.tsx ← Auth State Management
hooks/use-jobs.ts         ← Job CRUD (via /api/jobs)
hooks/use-candidates.ts   ← Candidates (via /api/candidates)
app/api/jobs/route.ts     ← Job API (GET/POST/PUT/DELETE)
app/api/candidates/route.ts ← Candidates API
app/api/parse-cv/route.ts   ← CV Parsing mit Gemini
app/api/jobs/[id]/add-candidate/route.ts ← Match Creation
app/api/organisations/route.ts ← Org Management
lib/gemini-ai.ts          ← Gemini AI Client

---

## 🌍 Compliance & Legal

### DSGVO
- EU Server (Supabase Frankfurt, Vertex AI Frankfurt)
- Kein Training auf Kundendaten (Anthropic Commercial Terms)
- Geplant: DPA Template, Löschfunktion, Datenschutzerklärung

### EU AI Act
- Recruiting AI = High Risk → volle Compliance nötig
- Erklärbarer AI Score (jede Entscheidung begründet) ✅
- Human Oversight (Recruiter trifft finale Entscheidung) ✅
- Geplant: Technische Dokumentation, Bias-Prüfung

---

## 💡 Produkt Vision

RECRUILY soll das intelligenteste, transparenteste und 
DSGVO-konformste AI-Recruiting-Tool in Europa werden.

Nicht Keyword-Matching. Nicht Black-Box AI.
Sondern ein digitaler Senior Recruiter mit 20 Jahren 
Erfahrung in jeder Branche – der CV und Anschreiben 
gemeinsam analysiert und jeden Entscheid erklärt.

**Marktposition:** Einziges Tool das CV + Anschreiben 
kombiniert analysiert, für den DACH-Mittelstand, 
DSGVO + AI Act konform, auf EU-Servern.
