# MediKiosk — React + Supabase

## Setup (5 steps)

### 1. Install Node.js
Agar pehle se nahi hai: https://nodejs.org (LTS version).

### 2. Project folder open karo
Terminal mein:
```
cd medikiosk-app
npm install
```

### 3. Supabase project banao (free)
1. https://supabase.com pe jaake naya project banao.
2. Project ke andar: **SQL Editor** → **New query** → `supabase/schema.sql` ka pura content paste karo → **Run**.
   Isse saari tables (patients, doctors, consultations, reminders, etc.) ban jaayengi.
3. **Settings → API** mein jaake `Project URL` aur `anon public` key copy karo.

### 4. Apni keys daalo
`.env.example` file ko copy karke `.env` naam se save karo, phir usme apni Supabase URL/key paste karo:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx
```
(Gemini API key optional hai — agar nahi doge to app basic template-summary use karega, crash nahi hoga.)

### 5. Run karo
```
npm run dev
```
Browser mein `http://localhost:5173` khul jayega.

## File guide (kya kaha hai)

| File | Kya karta hai |
|---|---|
| `src/pages/RoleSelect.jsx` | Landing page — "Login as Patient" / "Login as Doctor" |
| `src/pages/PatientAuth.jsx` | Patient signup/login (sirf naam + email + password) |
| `src/pages/PatientProfile.jsx` | Profile edit page — ABHA ID (post-ABDM-auth), DOB, gender, emergency contact yahan add/edit hote hain |
| `src/pages/DoctorAuth.jsx` | Doctor signup/login |
| `src/pages/PatientDashboard.jsx` | Symptom interview (voice+text), OCR upload, submit, medicine reminders |
| `src/pages/DoctorDashboard.jsx` | Live queue, accept patient, review summary, reply |
| `src/components/VoiceInput.jsx` | Mic button — browser Web Speech API |
| `src/components/OcrUpload.jsx` | Prescription/report scan — Tesseract.js |
| `src/lib/aiSummary.js` | Red-flag rule check + Gemini API summary call |
| `supabase/schema.sql` | Saari database tables — Supabase SQL Editor mein run karo |

## Deploy (free)
`npm run build` → `dist` folder ban jayega → usko Vercel ya Netlify pe drag-drop kar do (dono free hain). Vercel/Netlify ke environment variables settings mein wahi `.env` wali 2 keys daal dena.
