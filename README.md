# PhysiqueMax AI ⚡

> Elite AI-powered physique analysis app. UMAX / Potential AI style, built with React Native + Expo + GPT-4o Vision.

---

## Stack

- **React Native** + **Expo SDK 51**
- **TypeScript** (strict)
- **React Navigation** (stack + bottom tabs)
- **Zustand** (state management)
- **NativeWind** (Tailwind for RN)
- **React Native Reanimated** (animations)
- **React Native SVG** (radar chart, circular progress)
- **Expo Camera / Image Picker** (photo capture)
- **OpenAI SDK** (GPT-4o Vision API)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env

# 3. Run with mock data (no API key needed)
npx expo start

# 4. Press 'i' for iOS simulator, 'a' for Android emulator, scan QR for device
```

> **Mock mode** is on by default (`EXPO_PUBLIC_USE_MOCK_API=true`). The app works fully without an OpenAI key.

---

## Using Real OpenAI API

1. Get your API key at https://platform.openai.com/api-keys
2. Edit `.env`:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxx
   EXPO_PUBLIC_USE_MOCK_API=false
   ```
3. Restart the Expo dev server

> **Cost note:** Each analysis uses GPT-4o with `detail: "high"` images (~$0.02–0.05 per scan depending on image count).

---

## Project Structure

```
src/
├── api/
│   ├── openai.ts       — GPT-4o Vision integration + prompt
│   └── mock.ts         — Full mock analysis data
├── components/
│   ├── ui/             — GlassCard, CircularProgress, RadarChart, ScoreBar, etc.
│   ├── analysis/       — MuscleGroupCard, IssueCard, RecommendationCard
│   └── common/         — ScreenHeader
├── constants/          — Muscle meta, rank config, XP, premium plans, AI prompt
├── navigation/         — RootNavigator, TabNavigator, route types
├── screens/
│   ├── Onboarding/     — 4-slide onboarding
│   ├── Auth/           — Login + Register
│   ├── Upload/         — Camera/gallery photo upload (1–3 photos)
│   ├── Analysis/       — AI loading screen with animated progress
│   ├── Dashboard/      — Home feed + full report screen
│   ├── MuscleDetail/   — Per-muscle deep dive
│   ├── History/        — Scan history with progress delta
│   ├── Progress/       — Line charts, progress table
│   ├── Recommendations/— Improvement plan + nutrition + AI chat
│   ├── Profile/        — User stats, XP, rank, settings
│   └── Premium/        — Paywall with 3 subscription tiers
├── store/
│   ├── useAuthStore.ts     — User, XP, rank, streak, scan limits
│   ├── useAnalysisStore.ts — Analysis state, progress simulation
│   └── useProgressStore.ts — Historical progress data
├── theme/              — Colors, gradients, fonts, spacing, helpers
└── types/              — All TypeScript interfaces
```

---

## Features

### AI Analysis
- **11 muscle groups** scored 0–100 with strengths/weaknesses/recommendations
- **8 physique scores**: overall, symmetry, V-taper, posture, aesthetics, proportions, athleticism, body fat %
- **Issues detection**: dysproportions, asymmetry, skinny-fat, posture problems
- **Improvement plan**: prioritized, with timeframes and expected results
- **Glow-up prediction**: AI-generated transformation prediction
- **Dietary recommendations**: protein, calories, carb cycling, supplementation

### UX / Gamification
- **Streak system** — daily scan streaks with XP bonus
- **XP + Level system** — gain XP per scan, level up
- **Rank system** — Beginner → Bronze → Silver → Gold → Platinum → Diamond → Elite → Legendary
- **Scan limits** — Free: 1/day, Premium: unlimited
- **Premium paywall** — 3 plans (weekly/monthly/yearly) with trial

### Design System
- **Dark mode only** — pure black `#000000` base
- **Glassmorphism** — `rgba(255,255,255,0.04)` cards with neon borders
- **Neon accents** — Cyan `#00F5FF`, Purple `#7B2FBE`, Pink `#FF006E`, Green `#06FFA5`
- **Animated score circles** — Reanimated `CircularProgress` with gradient arcs
- **Radar chart** — Custom SVG physique radar
- **Line charts** — Custom SVG progress charts
- **Gradient buttons** — Pill-shaped with haptic feedback

---

## Adding Backend (Node.js)

The app is pre-structured for backend integration:

1. Replace `analyzePhysique()` in `src/api/openai.ts` to call your backend endpoint instead of OpenAI directly
2. Add auth token management in `useAuthStore`
3. Replace mock data in stores with real API calls
4. Add `EXPO_PUBLIC_BACKEND_URL` in `.env`

---

## Monetization Ready

- **RevenueCat** integration ready (replace `upgradeToPremium()` with RC SDK)
- **3 subscription tiers** pre-configured
- **Paywall screen** fully designed
- **Scan limits enforced** per user tier

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_OPENAI_API_KEY` | OpenAI API key | — |
| `EXPO_PUBLIC_USE_MOCK_API` | Use mock data instead of real API | `true` |
| `EXPO_PUBLIC_APP_ENV` | Environment | `development` |
| `EXPO_PUBLIC_BACKEND_URL` | Future backend URL | — |

---

## Known Limitations

- Camera integration uses `expo-image-picker` (for Expo Go compatibility). For native camera UI, replace with `expo-camera`
- No persistence layer — state resets on app restart (add AsyncStorage/MMKV for production)
- OpenAI calls happen client-side (move to backend for production to protect API key)
