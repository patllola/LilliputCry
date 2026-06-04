# LilliputCry — Deployment Plan

End-to-end roadmap to take the mobile app from local dev to the App Store / Play Store. Steps are ordered so each unblocks the next. Update the **Status** column as we complete each one.

Legend: `⬜ Not started` · `🟡 In progress` · `✅ Done` · `⏭️ Skipped`

---

## Phase 1 — Backend hosting (unblocks everything else)

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1.1 | Pick a backend host (Railway, Render, Fly.io, or Azure) | ⬜ | Recommend Railway — easiest for .NET, free tier, GitHub auto-deploy |
| 1.2 | Move Neon connection string + `AllowedOrigin` into the host's env vars (do NOT commit secrets) | ⬜ | Currently in `appsettings.Development.json` |
| 1.3 | Add a `Dockerfile` (or use host's native .NET 8 builder) for `backend/LilliputCry.Api` | ⬜ | Railway/Render can build .NET projects natively without a Dockerfile |
| 1.4 | Deploy backend, verify `GET /health` returns 200 from the public URL | ⬜ | Should be something like `https://lilliputcry-api.up.railway.app/health` |
| 1.5 | Confirm EF Core migrations applied automatically on first boot | ⬜ | `Program.cs` already auto-runs migrations on startup |
| 1.6 | Update `AllowedOrigin` env var to allow the frontend's prod domain (later) | ⬜ | Can come back to this in Phase 4 |

---

## Phase 2 — Wire mobile app to deployed backend

| # | Step | Status | Notes |
|---|------|--------|-------|
| 2.1 | Update `mobile/.env.local` → `EXPO_PUBLIC_API_URL=https://<your-prod-api>` | ⬜ | |
| 2.2 | Run `npx expo run:ios` locally and confirm login/feeding-log flow works against the prod backend | ⬜ | Use a real test account |
| 2.3 | Commit the env change (without secrets) and push | ⬜ | |

---

## Phase 3 — Pre-submission code hardening

These are the *Known Issues* from `CLAUDE.md` that will block real users.

| # | Step | Status | Notes |
|---|------|--------|-------|
| 3.1 | Implement real JWT auth in backend (replace hard-coded GUID in `UserController`) | ⬜ | Issue token on login/register, validate via JWT middleware |
| 3.2 | Add `UserId` FK to `feeding_logs` + migration | ⬜ | Scope every CRUD operation to the authenticated user |
| 3.3 | Update mobile API client to send `Authorization: Bearer <token>` on every request | ⬜ | Store token in `expo-secure-store` |
| 3.4 | Test multi-user isolation: user A cannot see user B's logs | ⬜ | |
| 3.5 | Decide: implement Sleep feature now, or hide it for v1? | ⬜ | Recommend hide for v1, ship feeding-only |

---

## Phase 4 — App Store / Play Store prerequisites

| # | Step | Status | Notes |
|---|------|--------|-------|
| 4.1 | Enroll in **Apple Developer Program** ($99/yr) — activation takes 24-48h, start early | ⬜ | https://developer.apple.com/programs/ |
| 4.2 | Create **Google Play Console** account ($25 one-time) | ⬜ | Only if launching Android too |
| 4.3 | Sign up for **Expo** account (free) | ⬜ | https://expo.dev |
| 4.4 | Write a Privacy Policy (required by Apple). Host it on a public URL | ⬜ | Free options: GitHub Pages, Notion public page |
| 4.5 | Prepare app icon (1024x1024 PNG, no alpha, no rounded corners) | ⬜ | Already have a pixel-art crying-emoji icon per recent commits |
| 4.6 | Capture screenshots for required device sizes (iPhone 6.7", 6.5", 5.5") | ⬜ | At least 3 per size, max 10 |
| 4.7 | Write App Store listing: name, subtitle, description, keywords, category | ⬜ | Category: Health & Fitness or Lifestyle |

---

## Phase 5 — Mobile build & TestFlight beta

| # | Step | Status | Notes |
|---|------|--------|-------|
| 5.1 | Install EAS CLI: `npm install -g eas-cli` | ⬜ | |
| 5.2 | `cd mobile && eas login` | ⬜ | |
| 5.3 | `eas build:configure` — generates `eas.json` | ⬜ | |
| 5.4 | Set bundle identifier in `app.json` (e.g. `com.lilliputcry.app`) | ⬜ | Verify it's unique on App Store Connect |
| 5.5 | `eas build --platform ios --profile production` | ⬜ | First build takes ~20 min |
| 5.6 | `eas submit --platform ios` → uploads to App Store Connect | ⬜ | |
| 5.7 | Set up TestFlight: invite yourself + 5-10 beta testers | ⬜ | Internal testing requires no review |
| 5.8 | Test on real devices for 1-2 weeks, collect feedback, fix bugs | ⬜ | |

---

## Phase 6 — Public release

| # | Step | Status | Notes |
|---|------|--------|-------|
| 6.1 | Submit to App Store review (from App Store Connect) | ⬜ | Review usually takes 1-3 days |
| 6.2 | Fix any rejection issues and resubmit | ⬜ | Common rejections: privacy policy, demo account credentials, crash on launch |
| 6.3 | (Android) `eas build --platform android --profile production` + submit to Play Console | ⬜ | |
| 6.4 | Hit "Release" in App Store Connect once approved | ⬜ | 🎉 |

---

## Phase 7 — Post-launch (optional but recommended)

| # | Step | Status | Notes |
|---|------|--------|-------|
| 7.1 | Add crash reporting (Sentry has a free tier + Expo plugin) | ⬜ | |
| 7.2 | Add analytics (PostHog free tier, or Expo's built-in) | ⬜ | |
| 7.3 | Set up over-the-air (OTA) updates via `eas update` for non-native fixes | ⬜ | Bug-fix releases without going through review |
| 7.4 | Backend monitoring + uptime alerts | ⬜ | UptimeRobot free, or Railway's built-in metrics |

---

## Current focus

> **Next step: 1.1 — pick a backend host.**

When ready, ping me and we'll start Phase 1.
