# PROJECT: "IronLog" — AI-Powered Gamified Fitness Tracker

## MISSION
Build a production-quality fitness tracker web app that helps users stay consistent with fitness goals through tracking, AI motivation, adaptive suggestions, and community. Deliver in tiered priority — Tier 1 must be fully functional before touching Tier 2, etc.

## TECH STACK (NON-NEGOTIABLE — use these exact versions)
- **Framework:** Next.js 14.2.x (App Router, TypeScript, `src/` directory)
- **Styling:** Tailwind CSS 3.4.x + shadcn/ui components
- **Fonts:** Inter (body) + JetBrains Mono (numbers/stats) via `next/font`
- **Icons:** lucide-react
- **Auth:** Firebase Auth 10.x (Google provider + email/password)
- **Database:** Firestore (via firebase-admin on server, firebase client SDK on client)
- **AI:** `@google/generative-ai` — use model `gemini-2.0-flash` (NOT pro — we need speed and free-tier-friendly)
- **Maps:** Leaflet 1.9.x + react-leaflet 4.x + OpenStreetMap tiles (NO Google Maps)
- **Charts:** Recharts
- **State:** React Server Components where possible, Zustand for client-side state
- **Forms:** react-hook-form + zod
- **Deployment:** Single Dockerfile to Google Cloud Run
- **Node:** 20 LTS

## DESIGN SYSTEM (enforce strictly)
- **Palette:** Pure black (#000) background, pure white (#FFF) text, neutral grays (#0A0A0A cards, #1A1A1A borders, #737373 muted text)
- **Accents (use sparingly, only for state/CTA):**
  - Electric lime `#D4FF00` — streaks, achievements, primary CTA
  - Signal red `#FF3B3B` — warnings, "rest day missed"
  - Ice blue `#7DD3FC` — info, AI chat bubbles
- **Cards:** `#0A0A0A` bg, 1px border `#1A1A1A`, 16px radius, subtle inner shadow
- **Typography:** Large, confident. Stat numbers in JetBrains Mono at 48px+. Headers tight tracking.
- **Motion:** Framer Motion ONLY for page transitions and achievement unlocks. Use plain CSS keyframes for workout animations.
- **Layout:** Generous whitespace. Max content width 1280px. Mobile-first.
- **Vibe:** Think "terminal meets premium gym app." No gradients. No emojis in UI chrome. Confident, minimalist, slightly brutalist.

---

## TIER 1 — CORE (build FIRST, do not proceed until complete)

### 1.1 Auth & Profile
- Firebase Auth: Google sign-in + email/password
- On first login, force onboarding flow:
  - Display name, age, sex, height (cm), weight (kg), goal (cut/maintain/bulk), experience (beginner/intermediate/advanced), primary modality (gym/home/both)
- Profile page: editable fields, avatar upload to Firebase Storage, stats summary
- Firestore `users/{uid}` document schema:
```ts
  {
    uid, email, displayName, photoURL,
    age, sex, heightCm, weightKg, goal, experience, modality,
    level: number (default 1), xp: number (default 0),
    currentStreak: number, longestStreak: number,
    lastWorkoutDate: Timestamp | null,
    achievements: string[], // achievement IDs
    createdAt, updatedAt
  }
```

### 1.2 Workout Logging
- Route `/log` — log a workout: date, type (strength/cardio/mobility), duration, exercises[] (name, sets, reps, weight)
- Pre-populated exercise library (~30 common lifts + bodyweight moves) as a static JSON constant
- On submit: write to `users/{uid}/workouts/{workoutId}`, update streak, award XP (10 XP/workout + 5 XP/exercise)

### 1.3 Streak + Level System
- Streak logic: consecutive days with ≥1 logged workout. Missing a day resets to 0 unless user has a "rest day token" (award 1 token per 7-day streak).
- Levels: level = floor(sqrt(xp / 50)) + 1. Roles by level:
  - 1–4: "Rookie"
  - 5–9: "Grinder"
  - 10–19: "Athlete"
  - 20–34: "Beast"
  - 35+: "Legend"
- Show level/role prominently on profile and dashboard.

### 1.4 Dashboard (`/dashboard`)
- Top row: current streak (huge number, lime if active), level + role badge, this week's volume (tonnage)
- Motivational quote of the day (Gemini-generated, cached per user per day in Firestore)
- "Today's Suggestion" card (Gemini-generated based on recent workouts + goal)
- Last 7 days workout chart (Recharts bar chart, white bars on black)
- AI Trainer chat widget (collapsible sidebar, see 1.5)
- Recent achievements row

### 1.5 AI Trainer Chat
- Floating chat panel on dashboard + dedicated `/trainer` page
- Server action `askTrainer(message, userId)` — fetches last 10 workouts + profile, builds context, streams Gemini 2.0 Flash response
- System prompt: "You are a blunt, encouraging, evidence-based personal trainer. Give specific, actionable advice based on the user's recent data. No fluff. No medical advice — always recommend consulting a professional for injuries."
- Store conversation history in `users/{uid}/trainerChats/{chatId}`

### 1.6 Achievements (pick 6 to start)
- "First Rep" — log first workout
- "Week Warrior" — 7-day streak
- "Month Monster" — 30-day streak
- "Century Club" — 100 total workouts
- "Iron Will" — 10,000 kg total volume
- "Early Bird" — 5 workouts logged before 8am
- Toast notification + modal celebration on unlock (Framer Motion scale/opacity)

---

## TIER 2 — AI & PLANS (only after Tier 1 is solid)

### 2.1 Diet Planner (`/diet`)
- Calculate TDEE from user profile (Mifflin-St Jeor) + activity multiplier
- Target macros based on goal (cut: -20% cal, 2.2g protein/kg; bulk: +15% cal, 1.8g/kg; etc.)
- Display daily targets: kcal, protein, carbs, fat
- "Generate Meal Plan" button → Gemini prompt returns 3 meal options hitting macros (prompt for strict JSON response, parse and render as cards)
- Log meals: user picks from generated plan or enters custom; track daily macros vs target with progress bars

### 2.2 Workout Plan Library (`/plans`)
- Three gym programs (PPL, Upper/Lower, Full Body 3x) + three home programs (Bodyweight Beginner, HIIT 20min, Mobility Flow)
- Each plan: hardcoded JSON (name, days, exercises, sets/reps, rest)
- Plan detail page: per exercise, a small CSS/JS animated figure (use pure SVG + CSS keyframes — e.g., a squatting stick figure). Keep animations simple: 4–6 keyframes, `animation: 2s infinite`.
- "Start this plan" → sets `users/{uid}.activePlanId`, dashboard now shows "Today's session: Day X"

### 2.3 Adaptive Suggestions
- Weekly cron-like check (run on dashboard load if >7 days since last analysis): Gemini analyzes last 14 days of workouts, returns a suggestion ("Increase squat weight by 2.5kg", "Add a rest day — you've trained 6 days straight", "Your volume dropped 20% — are you okay?"). Store in `users/{uid}/suggestions`.

---

## TIER 3 — SOCIAL (only after Tier 2)

### 3.1 Forum (`/forum`)
- Categories: General, Gains, Form Check, Nutrition, Journeys
- Post: title, body (markdown), category, images (Firebase Storage)
- Firestore: `posts/{postId}` with `upvotes: number, downvotes: number, voters: { [uid]: 1 | -1 }`
- Atomic vote transaction (increment/decrement based on previous vote state)
- Sort options: Hot (score / age^1.5), New, Top
- Comments: nested one level deep. Same upvote/downvote mechanic.
- Show vote count Reddit-style (net score, with arrow highlighting user's current vote)

### 3.2 Friends & Feed
- Search users by display name, send friend request (`friendRequests/{id}`)
- On accept: bidirectional entry in `users/{uid}/friends/{friendUid}`
- `/feed` page: chronological list of friends' workouts + achievement unlocks + forum posts
- Profile page shows friend's recent stats + "Send encouragement" button (writes a notification)

---

## TIER 4 — STRETCH (skip if behind schedule)

### 4.1 Groups
- Create group (name, description, privacy), join/leave, group-scoped forum posts

### 4.2 Events
- Create event: title, description, datetime, location (Leaflet map picker — click to drop pin, reverse geocode via Nominatim free API)
- RSVP: going / interested / not going
- Event detail page: Leaflet map showing location, attendee list, group chat

---

## PROJECT STRUCTURE
```
src/
  app/
    (auth)/login, signup, onboarding
    (app)/dashboard, log, plans, diet, trainer, forum, feed, profile, events
    api/ (route handlers for Gemini calls, server-side vote transactions)
  components/
    ui/ (shadcn components)
    dashboard/, workout/, forum/, charts/
  lib/
    firebase/ (client.ts, admin.ts)
    gemini.ts (wrapper for chat + structured output)
    xp.ts (level/xp calc)
    streaks.ts
    macros.ts (TDEE, macro math)
  types/ (shared TS types)
  constants/ (exercises.json, plans.json, achievements.json)
```

## ENV VARS
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
GEMINI_API_KEY=
```

## FIRESTORE SECURITY RULES
- Users can read/write only their own `users/{uid}/**` subcollections
- Posts/comments: read public, write only authenticated, vote field updated only via server-side transaction
- Ship rules file in repo root: `firestore.rules`

## ENGINEERING REQUIREMENTS
- All Gemini calls go through a server-side API route — never expose API key to client
- Use Firestore transactions for votes and streak updates (race conditions)
- Rate-limit AI trainer chat: max 20 messages/user/hour (track in Firestore)
- All forms validated with zod
- Loading skeletons on every async UI
- Error boundaries around major routes
- Optimistic UI for votes and workout logging
- No `any` types in TypeScript (strict mode on)

## DELIVERABLES
1. Fully working Tier 1, ideally Tier 2
2. `Dockerfile` (Node 20 alpine multi-stage build)
3. `.dockerignore`
4. `firestore.rules` and `firestore.indexes.json`
5. `README.md` with setup + deploy steps
6. Seed script `scripts/seed.ts` to populate exercises/plans/achievements constants

## CRITICAL RULES
- Do NOT install deprecated or pre-release packages. Verify each package's latest stable version before adding.
- Do NOT use Next.js 15 (use 14.2.x for stability).
- Do NOT use Tailwind v4 alpha (use 3.4.x).
- Do NOT pull in full Google Maps — Leaflet only.
- If any tier feels unclear, ASK before building. Do not guess scope.
- After each tier, stop and show me what was built before starting the next.

Begin with Tier 1.1 (Auth & Profile). Scaffold the Next.js project, install dependencies with pinned versions, set up Firebase, and build the auth flow end-to-end before moving on.