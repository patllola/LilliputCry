# Mobile App (Expo / React Native)

React Native app for LilliputCry — a baby feeding tracker. Built with **Expo SDK 55**, **React Native 0.83.6**, **expo-router v55**, targeting iOS and Android.

## Key Versions

| Package | Version |
|---|---|
| expo | ~55.0.0 |
| react-native | 0.83.6 |
| expo-router | ^55.0.13 |
| react | 19.2.0 |
| typescript | ~5.9.2 |

New Architecture is enabled (`"newArchEnabled": true` in `app.json`). iOS uses the prebuilt React Native xcframework (`React-Core-prebuilt`).

## Development Commands

```bash
cd mobile
npm install            # Install dependencies (runs patch-package automatically)
npx expo start         # Metro bundler
npx expo run:ios       # Build & run on iOS simulator
npx expo run:android   # Build & run on Android
```

After changing native dependencies, regenerate iOS native files:
```bash
npx expo prebuild --platform ios --no-install
cd ios && pod install
```

## Project Structure

```
mobile/
├── app/                        # expo-router file-based routes
│   ├── _layout.tsx             # Root layout (auth gate redirect)
│   ├── index.tsx               # Entry redirect
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/
│       ├── dashboard.tsx
│       ├── log.tsx
│       └── profile.tsx
│
├── src/
│   ├── api/index.ts            # All backend API calls (mirrors frontend/src/api/index.ts)
│   ├── lib/auth.ts             # SecureStore helpers: getStoredUser, storeUser, clearUser
│   └── types/
│       ├── feeding.ts          # FeedingLog, CreateFeedingLogPayload, UpdateFeedingLogPayload
│       └── user.ts             # UserProfile, AuthResponse, LoginPayload, etc.
│
├── ios/                        # Generated native iOS project (expo prebuild)
│   └── LilliputCry/
│       └── AppDelegate.swift   # Main app delegate — see Known Issues below
│
├── patches/
│   └── expo-image+55.0.9.patch # patch-package fix applied on npm install
│
├── app.json                    # Expo config (slug: lilliputcry, bundle: com.lilliputcry.app)
└── tsconfig.json               # Path alias: @/* → ./src/*
```

## Environment

Create `mobile/.env.local` (or set via Expo config):
```
EXPO_PUBLIC_API_URL=http://localhost:7000
```

The API base URL should point to the running ASP.NET Core backend.

## Known Issues & Fixes

### iOS Build: `incorrect argument label in call` in AppDelegate.swift

**Symptom:**
```
AppDelegate.swift:25:29: error: incorrect argument label in call
(have 'withModuleName:inWindow:launchOptions:', expected 'withModuleName:in:launchOptions:')
```

**Root cause:** The Expo pod compiles with Swift 6, which applies the "omit needless words" renaming rule. It strips `Window` from the `inWindow:` parameter label (since the type is already `UIWindow`), so the label becomes `in:`. The generated AppDelegate uses `inWindow:` which Swift 6 no longer recognises.

**Fix** — in `ios/LilliputCry/AppDelegate.swift` line 25–28:
```swift
// Wrong (generated default):
factory.startReactNative(
  withModuleName: "main",
  inWindow: window,
  launchOptions: launchOptions)

// Correct:
factory.startReactNative(
  withModuleName: "main",
  in: window,
  launchOptions: launchOptions)
```

This fix must be re-applied after `npx expo prebuild --platform ios --clean` since prebuild regenerates AppDelegate.swift with the old label.

### SDWebImage deployment target warning

```
Pods/SDWebImage-SDWebImage: iOS@9.0 deployment version mismatch, expected >= 2.0 <= 26.4.99
```

This is a harmless warning from the SDWebImage pod having an old minimum deployment target. The build succeeds despite it.

## Architecture Notes

- **Auth:** Stored in `expo-secure-store` (not AsyncStorage) for security. See `src/lib/auth.ts`.
- **API:** All requests go directly to the backend — no Next.js proxy layer like the web frontend.
- **Navigation:** expo-router file-based routing. Auth state determines redirect in root `_layout.tsx`.
- **New Architecture:** Fabric + TurboModules enabled. The prebuilt React Native framework (`React-Core-prebuilt`) is used instead of compiling RN from source.
