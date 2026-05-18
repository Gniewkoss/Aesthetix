---
name: project-physiquemax
description: PhysiqueMax AI — React Native Expo app for AI physique analysis. Current production readiness status and completed phases.
metadata:
  type: project
---

# PhysiqueMax AI — Project State

**Stack:** Expo SDK 54, React Native 0.81, TypeScript, Zustand, React Navigation  
**Workspace:** `/Users/gniewko/Documents/Projects/body-scan`

## Faza 1 — UKOŃCZONA (2026-05-17)

### Co zrobiono

**Nowe pliki:**
- `src/store/storage.ts` — AsyncStorage helpers (loadItem/saveItem/removeItem) z kluczami `@physiquemax/{user,onboarding,history,progress}`

**Zmienione pliki:**
- `src/store/useAuthStore.ts` — hydrate(), completeOnboarding(), persist przy każdej zmianie stanu, daily reset scansToday (porównuje lastScanDate z dzisiaj), getLevelForXP → 500 XP/level (wcześniej 250), upgradeToPremium bez maxScansPerDay:999
- `src/store/useAnalysisStore.ts` — hydrate(), persist history po każdym sanie (max 50), loadHistory() = no-op, usunięty import MOCK_HISTORY
- `src/store/useProgressStore.ts` — hydrate(), persist entries po addEntry(), loadMockProgress() = no-op
- `App.tsx` — bootstrap: Promise.all([hydrateAuth, hydrateAnalysis, hydrateProgress]) przed pokazaniem navigacji; SplashScreen trzyma się do zakończenia bootstrap
- `src/navigation/RootNavigator.tsx` — routing uwzględnia `onboardingCompleted`; jeśli onboarding zaliczony → od razu Auth screen
- `src/screens/Onboarding/OnboardingScreen.tsx` — completeOnboarding() przy "Get Started" i "Skip"
- `src/screens/Analysis/AnalysisLoadingScreen.tsx` — addEntry() po udanym skanie z realnymi metrykami
- `src/screens/Dashboard/HomeScreen.tsx` — latestAnalysis = history[0] (newest-first), usunięto mock loadHistory guard
- `src/screens/History/HistoryScreen.tsx` — usunięto mock loadHistory guard
- `src/screens/Profile/ProfileScreen.tsx` — scans z history.length, score gain z realnych danych, XP bar spójny z 500/level
- `src/screens/Progress/ProgressScreen.tsx` — empty state gdy brak danych, usunięto mock loadMockProgress

**Nowe zależności:**
- `@react-native-async-storage/async-storage@2.2.0`

### Stan po Fazie 1

**Działające:**
- Dane persystują między restartami (user, history, progress)
- Onboarding pokazuje się tylko raz
- Zalogowany user po restarcie → od razu MainTabs
- scansToday resetuje się o północy automatycznie
- addEntry() wołane po każdym sanie → Progress wykres z realnych danych
- Historia i progress bez fallback na mock
- Profil: prawdziwa liczba skanów i score gain

## Faza 2 — Custom AI Backend — UKOŃCZONA (2026-05-18)

**Nowe pliki (Python — `ai-backend/`):**
- `pipeline/preprocessor.py` — CLAHE lighting normalization, base64 decode
- `pipeline/pose_estimator.py` — MediaPipe Pose, 26 geometric features (widths, angles, symmetry)
- `pipeline/segmenter.py` — YOLOv8n-seg, 23 silhouette features (V-taper, arm/thigh widths, edge density)
- `pipeline/feature_extractor.py` — 50-feature vector assembly + multi-image aggregation
- `models/measurement_model.py` — XGBoostMeasurementModel (V1) + PyTorch MLPMeasurementModel (V2), 24 targets
- `models/registry.py` — model versioning with hot-reload
- `training/dataset.py` — JSONL loader, bootstrap from GPT-4o labels, 3× weight for trainer labels
- `training/augment.py` — horizontal flip with correct L/R label swap, lighting jitter, rotation
- `training/evaluate.py` — MAE, Within-±1, Pearson r with trainer score
- `training/train.py` — Optuna HPO (XGBoost) + early-stopping MLP, registry integration
- `app/main.py` — FastAPI, MediaPipe + YOLO warmup on startup
- `app/schema.py` — Pydantic RawMeasurementResponse (mirrors TypeScript exactly)
- `app/api/analyze.py` — POST /analyze-body
- `app/api/train.py` — POST /train-model, GET /train-model/versions
- `app/api/predict.py` — POST /predict-score
- `data/schema.json` — training dataset JSON schema with example
- `Dockerfile` + `docker-compose.yml`

**Nowe pliki (TypeScript):**
- `src/api/customAI.ts` — callCustomAIAnalyze(), isCustomAIConfigured

**Zmienione pliki (TypeScript):**
- `src/api/openai.ts` — analyzeViaBackend() routes Stage 1 to custom AI if EXPO_PUBLIC_AI_BACKEND_URL set; falls back to GPT-4o Supabase Edge
- `.env.example` — EXPO_PUBLIC_AI_BACKEND_URL, EXPO_PUBLIC_AI_BACKEND_KEY

**Architektura:**
- Odpowiedź /analyze-body = identyczny JSON jak Supabase 'analyze' Edge Function → zero zmian w parseMeasurements() i scoring engine
- Heuristic fallback gdy brak wytrenowanego modelu (cold start)
- Bootstrap labels: GPT-4o → JSONL → train XGBoost (50 Optuna trials) → register → activate

**Nadal do zrobienia (P0):**
- Faza 3: Backend (OpenAI przeniesione na serwer), prawdziwa autentykacja
- Faza 3: Sync z cloud (historia, progress per userId)
- Faza 4: RevenueCat + paywall gating
- Faza 5: Share raportu + AI chat
- Faza 6: Profile settings + legal links
- Faza 7: Testy scoringu + E2E
- Faza 8: EAS + store checklist

**Why:**  
Persystencja lokalna jako fundament — bez tego wszystkie kolejne fazy byłyby niestabilne.

**How to apply:**  
Przy każdej nowej funkcji sprawdź, czy nowe dane są hydratowane w `hydrate()` odpowiedniego store'a i persystowane w `saveItem()`.
