# IronLog: The Brutalist Fitness Tracker

IronLog is a premium, unapologetic, military-style fitness tracker built with Next.js, Firebase, and the Gemini AI API. It eschews modern overly-friendly interfaces in favor of a stark, brutalist, terminal-inspired design.

## Features (Phase 1 Completed)

*   **Authentication Protocol**: Secure email/password and Google Sign-in flows using Firebase Auth.
*   **Initial Calibration**: A comprehensive onboarding flow to establish your biometric baseline (Age, Weight, Height, Goal).
*   **Tactical Dashboard**: A command center displaying your 7-day volume telemetry (via Recharts), your current streak, and your level classification.
*   **AI Directives**: Daily motivational quotes and tailored workout suggestions powered by Google's Gemini 1.5 Flash AI, cached securely via Firestore.
*   **Mission Logging**: A dynamic interface to log your sets, reps, and weights.
*   **Progression System**: Every logged workout earns you XP, levels you up, and automatically updates your streaks.
*   **Achievement Matrix**: Unlock badges like "First Rep", "Week Warrior", and "Iron Will" as you train, complete with `framer-motion` celebrations.
*   **Tactical AI Trainer**: A dedicated chat interface to get evidence-based, blunt, no-nonsense advice from your personal AI operative.

## Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS + Shadcn UI + Framer Motion
*   **Database & Auth**: Firebase (Client + Admin SDK)
*   **State Management**: Zustand + React Hook Form + Zod
*   **AI**: `@google/generative-ai` (Gemini)
*   **Charts**: Recharts

## Environment Setup

To run IronLog locally, you must create a `.env.local` file in the root directory and populate it with the following keys:

```env
# Public Firebase configuration (from Project Settings > Web App)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin configuration (from Project Settings > Service Accounts)
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="your-admin-email"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"

# Gemini API Key (from Google AI Studio)
GEMINI_API_KEY="your-gemini-key"
```

> **Note**: For the AI features to work, the `GEMINI_API_KEY` is securely accessed via Next.js Server Actions. If you update your `.env.local` file, remember to restart the Next.js development server.

## Getting Started

1.  Clone the repository and run `npm install`.
2.  Set up your `.env.local` file.
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) (or whichever port Next.js assigns) to view the application.

## Next Phases

*   **Phase 2**: Diet Planning (TDEE calculators, macro tracking) & Routine Libraries.
*   **Phase 3**: Social Integration (Friends, Forums, Feed).
*   **Phase 4**: Event Planning & Group Tracking.

---
*Stay disciplined. Execute the protocol.*
