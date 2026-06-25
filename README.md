# KHL Mobile App — Sprint 1

**Kemchuta Homes Limited** · React Native (Expo SDK 52) · TypeScript

---

## ✅ Sprint 1 Deliverables

| File | Purpose |
|------|---------|
| `app.json` | Expo config — iOS/Android permissions, deep links, splash |
| `package.json` | All Sprint 1–9 dependencies |
| `babel.config.js` | NativeWind + Reanimated Babel config |
| `metro.config.js` | NativeWind Metro bundler config |
| `tailwind.config.js` | NativeWind + KHL brand tokens |
| `src/constants/theme.ts` | Design tokens — colors, typography, spacing, shadows |
| `src/constants/api.ts` | All API endpoint constants (mirrors existing backend) |
| `src/types/index.ts` | TypeScript interfaces for all backend models |
| `src/services/storage/tokenStore.ts` | Secure Enclave token storage (NOT AsyncStorage) |
| `src/services/api/client.ts` | Axios instance + silent token refresh interceptor |
| `src/store/authStore.ts` | Zustand auth store — realtor, client, admin |
| `src/hooks/useBiometrics.ts` | Face ID / Touch ID / Android Biometric hook |
| `src/components/ui/Button.tsx` | Design system button (6 variants, 3 sizes, haptics) |
| `src/components/ui/Input.tsx` | Design system input (icons, error, hint, focus states) |
| `src/components/ui/Card.tsx` | Card container |
| `src/components/ui/Badge.tsx` | Status badge with `statusToVariant()` helper |
| `src/components/ui/ScreenHeader.tsx` | Shared screen header with back navigation |
| `app/_layout.tsx` | Root layout — QueryClient, SafeArea, RouteGuard |
| `app/(tabs)/_layout.tsx` | Bottom tab navigator (role-based tabs) |
| `app/(auth)/realtor-login.tsx` | Realtor login + biometric quick-login |
| `app/(auth)/realtor-signup.tsx` | 3-step realtor signup (personal → bank → password) |
| `app/(auth)/client-login.tsx` | Client portal login |
| `app/(auth)/admin-login.tsx` | Admin login (minimal, secure) |
| `app/(auth)/realtor-forgot-password.tsx` | Forgot password flow |
| `app/(tabs)/index.tsx` | Explore tab (Sprint 2 estate cards go here) |
| `app/(tabs)/profile.tsx` | Profile + settings + biometric toggle + logout |
| `app/(tabs)/dashboard.tsx` | Dashboard scaffold (Sprint 3) |
| `app/(tabs)/earnings.tsx` | Earnings scaffold (Sprint 3) |
| `app/(tabs)/recruits.tsx` | Recruits scaffold (Sprint 3) |
| `app/(admin)/dashboard.tsx` | Admin dashboard scaffold (Sprint 7) |
| `app/(client)/portal.tsx` | Client portal scaffold (Sprint 4) |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 20+
- Expo CLI: `npm install -g expo-cli eas-cli`
- iOS: Xcode 15+ (Mac only)
- Android: Android Studio + emulator

### 1. Install dependencies
```bash
cd khl-mobile
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local — set EXPO_PUBLIC_API_BASE_URL to your backend URL
```

### 3. Start the development server
```bash
npx expo start
```

### 4. Run on device/simulator
```bash
# iOS Simulator (Mac only)
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical device: scan QR code with Expo Go app
```

---

## 🔐 Security Notes

- **Tokens are stored in the OS Secure Enclave** via `expo-secure-store` — never in AsyncStorage
- **Biometric auth** uses `expo-local-authentication` — KHL app never sees biometric data
- **Admin accounts** cannot be created from the mobile app (route removed)
- **Token refresh** happens silently via Axios interceptor on any 401 response

---

## 📁 Project Structure

```
khl-mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root — auth guard, QueryClient
│   ├── (tabs)/             # Bottom tab screens
│   ├── (auth)/             # Login, signup, forgot password
│   ├── (client)/           # Client portal screens
│   └── (admin)/            # Admin screens
├── src/
│   ├── components/
│   │   ├── ui/             # Design system: Button, Input, Card, Badge
│   │   └── features/       # Feature components (Sprint 2+)
│   ├── constants/          # theme.ts, api.ts
│   ├── hooks/              # useBiometrics, etc.
│   ├── services/
│   │   ├── api/            # Axios client + interceptors
│   │   └── storage/        # SecureStore wrapper
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript interfaces
├── assets/                 # Icon, splash, fonts
├── app.json                # Expo config
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔗 API Connection

The mobile app calls the **same existing KHL backend** — no backend changes needed for Sprint 1.

Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to your server URL.

The API endpoints are defined in `src/constants/api.ts`.

---

## 📱 Sprint Roadmap

| Sprint | Weeks | Focus |
|--------|-------|-------|
| **S1 (this)** | 1–2 | ✅ Foundation, auth, design system |
| S2 | 3–4 | Estate listings, search, detail, inspection booking |
| S3 | 5–6 | Realtor dashboard, earnings, recruits, referral share |
| S4 | 7–8 | Client portal, payments (Paystack), documents |
| S5–6 | 9–12 | Growth features, push notifications, leaderboard |
| S7 | 13–15 | Admin mobile dashboard |
| S8–9 | 16–20 | Polish, accessibility, App Store submission |
