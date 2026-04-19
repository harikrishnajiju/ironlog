# 🦾 IronLog: Tactical Fitness Protocol

![IronLog Banner](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop)

**IronLog** is not just a fitness tracker; it is a brutalist, high-performance tactical interface designed for operatives who demand discipline and results. Built with a "terminal-meets-gym" aesthetic, it combines advanced AI tracking with a stark, distraction-free environment.

---

## 🚀 Live Deployment
**Service URL:** [Deploying...] <!-- Will be updated after Cloud Run deployment -->

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) |
| **Database** | [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| **AI Integration** | [Google Gemini 1.5 Flash](https://aistudio.google.com/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Deployment** | [Google Cloud Run](https://cloud.google.com/run) |

---

## ⚡ Key Features

### 1. Command Center (Dashboard)
- **7-Day Telemetry**: Visualizes your workout volume (tonnage) using Recharts.
- **Streak Status**: Tracks your consecutive training days with high-visibility metrics.
- **Classification System**: Automatically assigns roles (Beginner to Legend) based on your level.

### 2. AI Tactical Trainer
- **Direct Link to Gemini**: A dedicated chat interface where you can get blunt, evidence-based advice.
- **Context-Aware**: The AI reads your recent workouts and profile to give specific feedback.
- **Military Style**: No fluff, no coddling. Just pure tactical directives.

### 3. Log Protocol
- **Dynamic Field Tracking**: Log exercises, sets, reps, and weight on the fly.
- **Real-time XP Calculation**: Earn experience points for every set completed.
- **Volume Metrics**: Automatically calculates total tonnage per session.

### 4. Achievement Matrix
- **Unlockable Milestones**: "First Rep", "Week Warrior", "Iron Will", and more.
- **Visual Celebration**: High-impact animations when milestones are reached.

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js 20+
- A Google Cloud Project (for Gemini & Cloud Run)
- A Firebase Project

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ironlog
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory and populate it with your credentials:

```env
# Firebase Public
NEXT_PUBLIC_FIREBASE_API_KEY="xxx"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="xxx.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ironlog24"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="xxx.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="xxx"
NEXT_PUBLIC_FIREBASE_APP_ID="xxx"

# Server Side (Secrets)
FIREBASE_ADMIN_PROJECT_ID="ironlog24"
FIREBASE_ADMIN_CLIENT_EMAIL="xxx"
FIREBASE_ADMIN_PRIVATE_KEY="xxx"
GEMINI_API_KEY="xxx"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the interface.

---

## 🐳 Containerization & Deployment

### Build Image
```bash
gcloud builds submit --tag gcr.io/ironlog24/ironlog
```

### Deploy to Cloud Run
```bash
gcloud run deploy ironlog \
  --image gcr.io/ironlog24/ironlog \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1
```

---

## 💂 System Persona
IronLog is designed with an **Aggressive, Blunt, and Tactical** voice. The AI trainer will not apologize for your lack of discipline. It is built to push you further.

---

## 📄 License
MIT License. Execute with caution.
