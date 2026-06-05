# LilliputCry — Deployment Plan

End-to-end roadmap to take the mobile app from local dev to the App Store / Play Store. Steps are ordered so each unblocks the next. Update the **Status** column as we complete each one.

Legend: `⬜ Not started` · `🟡 In progress` · `✅ Done` · `⏭️ Skipped`

---

## Phase 1 — Backend hosting (unblocks everything else)

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1.1 | Pick a backend host (Railway, Render, Fly.io, or Azure) | ✅ | **Railway** chosen |
| 1.1a | Fix `Program.cs` to bind `0.0.0.0:$PORT` instead of hard-coded `localhost:7000` | ✅ | Required for any PaaS to route traffic |
| 1.1b | Commit + push the Program.cs fix to `main` | ✅ | Commit `d5e2e4f` |
| 1.2 | Collect env vars for Railway: `ConnectionStrings__Neon`, `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, `Google__ClientId` | ✅ | |
| 1.3 | Sign up at railway.app with GitHub, create new project from `LilliputCry` repo | ✅ | |
| 1.3a | Set **Root Directory** = `backend/LilliputCry.Api` in Railway service settings | ✅ | |
| 1.3b | Paste all env vars from step 1.2 into Railway → Variables | ✅ | |
| 1.3c | Generate public domain (Settings → Networking → Generate Domain) | ✅ | **URL: `https://lilliputcry-production.up.railway.app`** |
| 1.4 | Deploy backend, verify `GET /health` returns 200 from the public URL | ✅ | Verified — Swagger, JWT middleware, all endpoints respond correctly |
| 1.5 | Confirm EF Core migrations applied automatically on first boot | ✅ | DB reachable via 401 on protected endpoint |
| 1.6 | Update `AllowedOrigin` env var to allow the frontend's prod domain (later) | ⬜ | Comes back in Phase 4 |

---

## Phase 2 — Wire mobile app to deployed backend

| # | Step | Status | Notes |
|---|------|--------|-------|
| 2.1 | Update `mobile/.env.local` → `EXPO_PUBLIC_API_URL=https://lilliputcry-production.up.railway.app` | ✅ | |
| 2.2 | Run `npx expo run:ios` locally and confirm login/feeding-log flow works against the prod backend | 🟡 | In progress — testing now |
| 2.3 | Commit the env change (without secrets) and push | ⏭️ | Skipped — `mobile/.env.local` is gitignored. Will handle prod env in Phase 5 via EAS secrets |

---

## Phase 3 — Pre-submission feature gaps & code hardening

These are the gaps that will block real users or a clean App Store submission.

### Feature gaps (discovered during Phase 2 testing)
| # | Step | Status | Notes |
|---|------|--------|-------|
| 3.0a | Mobile edit feeding log — tap log card → edit screen with prefilled form | ✅ | New route `edit-log/[id].tsx`, hidden from tab bar |
| 3.0b | Mobile delete feeding log — swipe left on log card → red Delete with confirm | ✅ | Uses `react-native-gesture-handler` Swipeable |
| 3.0c | Test edit/delete in simulator against Railway backend | ✅ | Verified end-to-end |

### Auth & multi-user isolation
| # | Step | Status | Notes |
|---|------|--------|-------|
| 3.1 | Implement real JWT auth in backend | ✅ | `AuthService.GenerateToken()` issues JWTs on register/login |
| 3.2 | Add `UserId` FK to `feeding_logs` + migration | ✅ | Migration `AddUserIdToFeedingLogs` already shipped (commit `bd5dcf0`) |
| 3.3 | Mobile API client sends `Authorization: Bearer <token>` | ✅ | Confirmed working (mobile can't reach protected endpoints otherwise) |
| 3.4 | Test multi-user isolation: user A cannot see user B's logs | ✅ | Verified manually in simulator |
| 3.5 | Decide: implement Sleep feature now, or hide it for v1? | ✅ | **Decision: defer Sleep to v1.1.** Ship feeding-only. |

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

> **Next step: Phase 4 — App Store / Play Store prerequisites (Apple Developer account is the long pole).**
> Public API URL: `https://lilliputcry-production.up.railway.app`

When ready, ping me and we'll start Phase 1.
