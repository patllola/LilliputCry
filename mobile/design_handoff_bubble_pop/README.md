# Handoff: LilliputCry "Bubble Pop" mobile redesign

## Overview

A full visual redesign and feature expansion of **LilliputCry**, a baby feeding tracker
(Expo / React Native, expo-router, .NET backend). The redesign replaces the purple,
list-driven UI with a warm, playful, rounded aesthetic ("Bubble Pop") and restructures
the home screen into a **feature hub**: every capability is a tappable card, and each
card opens a purpose-built data-entry screen.

New features introduced by this design (not in the current app):

1. **Multiple baby profiles** with a bottom-sheet switcher and an "Add a Baby" screen.
2. **Baby summary header** — born date, weight, height, always visible on home.
3. **Medication tracker** with per-dose reminders (local notifications).
4. **Monthiversary celebration** — flowers rain down on the home screen on the
   day-of-month matching the baby's birth date.
5. **Payment Plan** screen — Free / Plus / Family tiers, monthly vs yearly billing.
6. **Caregivers** — invite other adults (partner, grandparent, nanny, daycare) to a
   baby profile with a role. Each caregiver has their **own account**, not a shared login.
7. **Clock-dial time entry** for sleep duration and medication dose time.

## About the Design Files

The files in `prototypes/` are **design references created in HTML** — interactive
prototypes that show the intended look and behavior. They are **not production code to
copy**. They use a bespoke HTML component runtime (`support.js`) that has nothing to do
with the target app.

Your task is to **recreate these designs in the existing LilliputCry React Native app**,
using its established patterns: `expo-router` file routes under `app/`, shared components
under `src/components/<Name>/index.tsx`, tokens in `src/theme/`, API calls through
`src/api/index.ts`, and `StyleSheet.create` for styling.

`reference-rn-code/` contains a **first-pass React Native port** of the hub and the four
main data-entry screens, written against those conventions. Treat it as a strong starting
point, not gospel — it was written without running against the real API. It does **not**
yet include the Payment Plan, Caregivers/Invite, or clock-dial screens; those exist only
in the HTML prototype and must be built from this README.

> Route-group folders in `reference-rn-code/app/` are named `-app-` and `-tabs-` because
> the export could not write parentheses. Rename them to `(app)` and `(tabs)`.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, radii, and interactions are all
decided. Recreate the UI faithfully using React Native primitives. Exact values are in
[Design Tokens](#design-tokens); every screen section below lists its own sizes.

Design frame: the prototype is drawn at **300 × 640 px** inside an iPhone bezel. Treat
those as logical points on a ~390pt-wide device — layouts are fluid, so use flex and the
stated paddings rather than fixed widths.

---

## Screens / Views

### 1. Home (feature hub) — `app/(app)/(tabs)/dashboard.tsx`

**Purpose:** at-a-glance baby summary, then one tap into any feature.

**Layout:** `SafeAreaView` (bg `#fdeff6`) → `ScrollView`, `padding: 18`, `paddingBottom: 32`.
Children in order: summary header, section title, card grid. Tab bar is pinned at the bottom
outside the scroll view.

**Components:**

**Baby summary header** (gradient hero)
- Container: `borderRadius: 28`, `padding: 18`, `marginBottom: 20`, `overflow: hidden`.
- Gradient: `expo-linear-gradient`, `#ff85b3` → `#b7a4ff`, start `{x:0,y:0}` end `{x:1,y:1}`.
- Decorative circle: 120 × 120, `borderRadius: 60`, `rgba(255,255,255,.14)`, positioned
  top `-24` right `-24` (optional; skip if it complicates the gradient).
- Top row: `flexDirection: row`, `alignItems: center`, `justifyContent: space-between`.
  - Identity (pressable, opens switcher): avatar 50 × 50, `borderRadius: 17`,
    `rgba(255,255,255,.28)`, initial at 21px weight 800 white. Name 20px/800 white with a
    small chevron-down after it; age 12px/700 `rgba(255,255,255,.9)`.
  - Monthiversary badge (only when `isMonthiversary`): `rgba(255,255,255,.24)`,
    `borderRadius: 16`, padding `8` × `11`, two lines centered — 🌸 then e.g. "3-month day!"
    at 11.5px/800 white. Pressing it replays the flower animation.
- Stats row: `flexDirection: row`, `gap: 10`, `marginTop: 16`. Three equal cells
  (`flex: 1`), each `rgba(255,255,255,.16)`, `borderRadius: 15`, padding `10` × `12`.
  Label 10.5px/700 `rgba(255,255,255,.85)`; value 13.5px/800 white, `marginTop: 1`.
  Labels: **Born**, **Weight**, **Height**. Sample values: `Apr 21, 2025`, `6.2 kg`, `61 cm`.

**Section title** — "Track & explore", 14px/800 `#4a2f42`, `marginBottom: 12`.

**Card grid** — `flexDirection: row`, `flexWrap: wrap`, `gap: 12`; each card
`flexBasis: "47%"`, `flexGrow: 1`.
- Card: `borderRadius: 24`, `padding: 15`, `gap: 9`, soft shadow
  (`shadowOpacity .08`, `offset {0,6}`, `radius 12`, `elevation 2`).
- Icon chip: 42 × 42, `borderRadius: 15`, white background, icon 21px in the accent color.
- Title 15px/800 `#4a2f42`; subtitle 11.5px/700 `rgba(74,47,66,.5)`, `marginTop: 1`.

| Card | Tint | Icon color | Subtitle (live data) | Opens |
| --- | --- | --- | --- | --- |
| Feeding | `#ffe1ec` | `#ff6fa5` | "6 logged today" | Log a Feed |
| Sleep | `#e7ddff` | `#8b6fe0` | "5h 20m today" | Log Sleep |
| Milk Pump | `#d9f0ff` | `#4aa8e0` | "140ml pumped" | Pump Session |
| Medication | `#d7f5e8` | `#2fae8a` | "2 due today" | Medication |
| Payment Plan | `#efe3ff` | `#7d5cd6` | "Free · upgrade" | Payment Plan |
| Milestones | `#fff2cf` | `#e0a92e` | "12 memories" | Milestones |
| Refer | `#ffe0d3` | `#f07a4a` | "Earn rewards" | Refer a Friend |

Icons are line icons, 2px stroke, round caps/joins (bottle, moon, droplet, pill/capsule,
credit card, star, gift). The reference RN code uses emoji placeholders — swap for a real
icon set.

**Bottom tab bar** — white, `borderTopWidth: 1` `#f7dfec`, padding `12` × `26` with
`paddingBottom: 24`. Three slots: Home (accent, filled house icon + 10px/800 label),
a raised center FAB, Profile (muted). FAB: 56 × 56, `borderRadius: 20`, `#ff6fa5`,
`marginTop: -26`, white plus icon, shadow `0 12 22 -6` in the accent color. FAB opens
Log a Feed.

---

### 2. Baby switcher (bottom sheet)

**Purpose:** switch the active baby or add a new one.

**Layout:** `Modal` `transparent` `animationType="slide"`. Backdrop `rgba(30,10,25,.4)`,
content pinned to bottom. Sheet: white, `borderTopLeftRadius / RightRadius: 28`,
`padding: 20`, `paddingBottom: 34`.

**Components:**
- Grabber: 40 × 4, `borderRadius: 3`, `#f7dfec`, centered, `marginBottom: 14`.
- Heading "Your babies", 16px/800, `marginBottom: 14`.
- Rows (`gap: 10`): `borderWidth: 1.5`, `borderRadius: 18`, `padding: 11`,
  `flexDirection: row`, `alignItems: center`, `gap: 12`.
  - Inactive: border `#f7dfec`, transparent background.
  - Active: border `#ff6fa5`, background `#fdeff6`.
  - Avatar 44 × 44, `borderRadius: 14`, the baby's own color, initial 18px/800 white.
  - Name 15px/800 `#4a2f42`; age 11.5px/700 `#c39bb2`.
  - Check circle 26 × 26: active → filled `#ff6fa5` with a white ✓; inactive → 1.5px
    `#f7dfec` border, empty.
- "＋ Add another baby": full width, `marginTop: 14`, dashed 1.5px `#ff6fa5` border,
  background `#fdeff6`, `borderRadius: 18`, `paddingVertical: 14`, label 15px/800 `#ff6fa5`.

**Behavior:** tapping a row sets the active baby and closes the sheet; if that baby's
`bornDay` equals today's day-of-month, replay the flower animation. Tapping the backdrop
closes. "Add another baby" closes the sheet and navigates to Add a Baby.

---

### 3. Add a Baby — `app/(app)/add-baby.tsx` (to build)

Standard screen shell (see [Screen shell](#screen-shell)), title "Add a Baby", one card:
- "Baby's name" — text input.
- "Avatar color" — row of six 38 × 38 swatches, `borderRadius: 13`, `gap: 10`.
  Colors: `#ff6fa5`, `#8b6fe0`, `#4aa8e0`, `#2fae8a`, `#e0a92e`, `#f07a4a`.
  Selected swatch gets a double ring: 3px white then 2px in its own color
  (in RN: `borderWidth: 3, borderColor: '#fff'` inside a wrapper with the color, or use
  `shadowColor` — simplest is a 2px outer `borderColor` wrapper with 3px white padding).
- "Date of birth" — date picker (prototype shows a text field; use the platform picker).
- "Weight" and "Height" — two inputs side by side, `flex: 1`, `gap: 12`.
- Primary button "Add Baby".

On save: create the baby, make it active, return home, and play the flower animation.

---

### 4. Log a Feed — `app/(app)/(tabs)/log.tsx`

**Purpose:** record milk prepared vs milk actually fed, with waste computed for you.
The design's core idea: **no keyboard for numbers.**

One card containing, in order:
1. Label "Milk prepared" → **Stepper**, step 10, max 400, unit "ml".
2. **Chip row** of presets: 60ml, 90ml, 120ml, 150ml. `marginTop: 10`.
3. Label "Milk fed" (`marginTop: 18`) → **Stepper**, step 10, max = prepared.
4. **Waste panel**: `flexDirection: row`, `alignItems: center`, `gap: 16`,
   background `#fdeff6`, `borderRadius: 20`, `padding: 14`, `marginTop: 18`.
   - Ring gauge 74 × 74 showing waste **percent**, accent fill `#ff6fa5` on `#f7dfec`
     track, 12px stroke, percentage centered at 17px/800 accent.
   - Right: "Waste this feed" 13px/800; "{waste}ml left in bottle" 12px/700 `#c39bb2`.
5. Label "Notes (optional)" → text input, placeholder "Any observations…".
6. Primary button "Log Feeding".

**Rules:** `fed` can never exceed `prepared`; lowering `prepared` clamps `fed` down with it.
`waste = max(0, prepared - fed)`; `wastePct = round(waste / prepared * 100)`, 0 when
`prepared` is 0.

---

### 5. Log Sleep — `app/(app)/sleep.tsx`

**Purpose:** record a night sleep or a nap, using a **clock dial** rather than typing.

1. **Segmented toggle**: "🌙 Night" / "🛏 Nap". Track `#fdeff6`, `borderRadius: 16`,
   `padding: 4`, `gap: 4`; each segment `flex: 1`, `paddingVertical: 10`,
   `borderRadius: 12`; active `#ff6fa5` + white 13px/800 text, inactive `#c39bb2`.
2. Centered caption "Duration", 12.5px/800 `#c39bb2`.
3. **Dial mode tabs** — two pills, centered, `gap: 8`, `marginBottom: 14`: one shows the
   current hours (e.g. "1h"), the other the current minutes ("30m"). The selected tab is
   `#ff6fa5` with white text; the other is `#fdeff6` with a `#f7dfec` border and `#c39bb2`
   text. Tab style: `padding: 8 16`, `borderRadius: 14`, 13px/800.
4. **Clock face** — 198 × 198, centered, `borderRadius: 99`, background `#fdeff6`,
   1.5px `#f7dfec` border.
   - Twelve numbers on a circle of radius **78** from the center, positioned at
     `angle = index * 30° - 90°` (index 0 at top, clockwise). Each number sits in a
     28 × 28 circle, 13px/800; the number matching the current value is filled `#ff6fa5`
     with white text, the rest transparent with `#4a2f42` text.
   - **Hours mode** labels: `0 1 2 … 11`. **Minutes mode** labels: `0 5 10 … 55`.
   - Hand: 3 × 66, `#ff6fa5`, `borderRadius: 2`, anchored at the center and rotated
     `value / max * 360°` (hours: `h * 30°`; minutes: `(m / 5) * 30°`). A 20 × 20 accent
     knob sits at the far end; a 9 × 9 accent dot marks the center.
   - **Dragging:** on press and on move, take the pointer position relative to the face
     center, compute `deg = atan2(dx, -dy)` normalized to 0–360, then
     `index = round(deg / 30) % 12`. In hours mode set hours to `index`; in minutes mode
     set minutes to `index * 5`. In React Native use a `PanResponder` and the view's
     measured center; `touch-action: none` in the prototype corresponds to capturing the
     responder.
5. Readout under the dial, 26px/800, formatted `"1h 30m"` (`"45m"` when hours is 0,
   `"2h"` when minutes is 0).
6. Label "Notes (optional)" → input, placeholder "e.g. slept through, woke once…".
7. Primary button "Log Sleep". Submit `hours * 60 + minutes` as total minutes.

---

### 6. Pump Session — `app/(app)/milk-pump.tsx`

**Purpose:** log left and right volumes; total is computed.

One card with a two-column row (`gap: 14`, each `flex: 1`, centered):
- Column label "LEFT" / "RIGHT", 12px/800 `#c39bb2`, `marginBottom: 8`.
- **Ring gauge** 96 × 96, 12px stroke, fill `#4aa8e0` on `#d9f0ff` track, value out of
  **150 ml**. Center shows the number at 22px/800 and "ml" at 10px/700 `#c39bb2`.
- Below: two 40 × 40 buttons, `borderRadius: 14`, `gap: 8` — minus is white with a
  1.5px `#f7dfec` border and `#4a2f42` glyph; plus is `#ff6fa5` with a white glyph.
  Step **5 ml**, clamped 0–300.

Then the total row: `#d9f0ff`, `borderRadius: 16`, padding `13` × `16`, `marginTop: 18`,
`justifyContent: space-between`. Label "Total pumped" 13px/800 `#3a7ba0`; value
"{left + right} ml" 19px/800 `#4aa8e0`.

Primary button "Save Session".

---

### 7. Medication — `app/(app)/medication.tsx`

**Purpose:** see today's doses, check them off, and add a medication with a reminder.

**Reminder banner** — `#d7f5e8`, `borderRadius: 16`, padding `11` × `14`,
`marginBottom: 16`. Bell icon + "Reminders on — we'll alert you at each dose time.",
12.5px/800 `#1f8f70`.

**"Today's schedule"** (14px/800, `marginBottom: 10`) → rows, `gap: 10`:
- Row: white, 1.5px `#f7dfec` border, `borderRadius: 20`, `padding: 12`,
  `flexDirection: row`, `alignItems: center`, `gap: 12`.
- Check button 30 × 30 circle: unchecked → 1.5px `#f7dfec` border, empty; checked →
  filled `#2fae8a` with a white ✓.
- Name 14px/800; when done, `textDecorationLine: line-through` and `opacity: .5`.
  Meta line "{dose} · {time}" 11.5px/700 `#c39bb2`.
- Reminder bell button 38 × 38, `borderRadius: 13`: on → `#d7f5e8` background,
  `#2fae8a` icon; off → `#fdeff6` background, `#c39bb2` icon. Toggling schedules or
  cancels the notification.

Seed rows for reference: "Vitamin D drops · 400 IU · 9:00 AM" (done),
"Iron supplement · 1 ml · 6:00 PM", "Probiotic · 5 drops · After feed" (reminder off).

**"Add medication"** card:
1. "Medicine name" input, placeholder "e.g. Vitamin D drops".
2. "Dose" → **Stepper**; step is **100 when the unit is IU, otherwise 1**; max 5000;
   the unit string renders inline after the number.
3. **Unit chip row**: IU, ml, drops, mg.
4. "Dose time" → the same **clock dial** as Sleep, with three pills above it: hours,
   minutes, and an **AM/PM** toggle (the AM/PM pill always uses the active/accent style).
   Hours labels run `12 1 2 … 11` with 12 at the top (index 0 ⇒ 12). Readout below the
   dial is `"9:00 AM"` at 24px/800.
5. Two switch rows (`marginTop: 16` / `12`, `justifyContent: space-between`):
   "Repeat daily" and "Remind me 🔔", labels 13.5px/800. Switch track `#ff6fa5` on,
   `#f7dfec` off, white thumb.
6. Primary button "Add Medication" — appends the med and, if "Remind me" is on, schedules
   a local notification at the chosen time (repeating daily when "Repeat daily" is on).

---

### 8. Milestones — `app/(app)/milestone.tsx`

1. **Photo area** 150 tall, `borderRadius: 18`. Empty state: 2px dashed `#f0b8d3` border,
   background `#fff2f8`, centered camera icon + "Tap to add a photo" 13px/800 `#e178a8`.
   Tapping opens `expo-image-picker` (already a dependency in the app).
2. "What happened?" input, prefilled/placeholder "e.g. First smile".
3. **Chip row** of common firsts: First smile, First laugh, Rolled over, First steps,
   First tooth. Tapping a chip fills the input.
4. Date row: `#fdeff6`, `borderRadius: 16`, padding `13` × `16`, `marginTop: 16` —
   "Date" 13px/800 `#c39bb2` on the left, "Today · Jul 21" 14px/800 on the right.
   Defaults to today; tapping opens a date picker.
5. Primary button "Save Milestone 🎉".

**Gallery** (below the form, as in the earlier prototype): two-column grid, `gap: 10`,
cards `borderRadius: 18` with a 110-tall image and a 9px-padded caption — title 12.5px/800,
date 10.5px/700 `#c39bb2`.

---

### 9. Payment Plan — `app/(app)/payment-plan.tsx` (to build)

**Purpose:** compare tiers and pick one.

1. **Billing segmented toggle** (same style as Night/Nap): "Monthly" / "Yearly · save 20%",
   `marginBottom: 16`.
2. **Plan cards**, `gap: 12`:
   - Card: white, **2px** border, `borderRadius: 24`, `padding: 16`.
     Unselected border `#f7dfec`; selected border `#ff6fa5` plus shadow
     `0 10 22 -12` in the accent color.
   - Header row (`justifyContent: space-between`, `gap: 10`): name 16px/800, optional
     badge pill (`padding: 3 8`, `borderRadius: 9`, `#e6dcff` background, `#6b4fa8`
     text, 10px/800), tagline 11.5px/700 `#c39bb2` underneath.
   - Radio 24 × 24 circle on the right: selected → filled `#ff6fa5` + white ✓;
     unselected → 1.5px `#f7dfec` border.
   - Price row `marginTop: 10`, `alignItems: baseline`, `gap: 4`: amount 27px/800,
     period 12px/700 `#c39bb2`.
   - Feature list `marginTop: 12`, `gap: 6`: each item a `#2fae8a` check icon (14px,
     3.2 stroke) + 12.5px/700 `#4a2f42` text.

| Plan | Badge | Tagline | Monthly | Yearly | Period label | Features |
| --- | --- | --- | --- | --- | --- | --- |
| Free | — | The basics, one baby | $0 | $0 | "forever" | Feeding & sleep logs · 1 baby profile · 7 days of history |
| Plus | Popular | For growing families | $4.99 | $47.90 | /month, /year | Everything in Free · Up to 3 babies · Medication reminders · Unlimited history |
| Family | Best value | Share with caregivers | $8.99 | $86.30 | /month, /year | Everything in Plus · Unlimited babies · Invite 4 caregivers · Export & printable reports |

Default selection: **Plus**.

3. Primary button: label is "Stay on Free" when Free is selected, otherwise
   "Continue to Payment".
4. Footnote centered, 11px/700 `#c39bb2`, `marginTop: 10`:
   "Cancel anytime · secure payment".

---

### 10. Profile + Caregivers — `app/(app)/(tabs)/profile.tsx`

Existing profile fields keep their current behavior; restyle to the new tokens.
Avatar 72 × 72, `borderRadius: 26`, gradient hero fill, initial 30px/800 white; name
18px/800; email 12.5px/700 `#c39bb2`. Card with "Full name" and "Phone number" inputs
and a "Save Profile" button, then a "Log Out" button — white background, 1.5px `#f5b9b9`
border, `borderRadius: 18`, `paddingVertical: 14`, label 15px/800 `#dc2626`.

**New: Caregivers section**, `marginTop: 22`:
- Header row: "Caregivers" 14px/800 on the left; an accent "＋ Invite" text button on the
  right (12.5px/800 `#ff6fa5`), which navigates to Invite Caregiver.
- Explainer 11.5px/700 `#c39bb2`, `lineHeight: 1.5`:
  "People who can track {baby name} with you. Each uses their own login."
- Rows (`gap: 10`), same shell as the medication rows: avatar 38 × 38 `borderRadius: 13`
  in that person's color with their initial (16px/800 white); name 14px/800; email
  11px/700 `#c39bb2`; role pill on the right — `padding: 5 9`, `borderRadius: 10`,
  10px/800. Owner pill: `#e6dcff` background, `#6b4fa8` text, no border. Other roles:
  `#fdeff6` background, `#c39bb2` text, 1.5px `#f7dfec` border.

Seed rows: "Maya Chen (you) · Owner", "Daniel Chen · Full access",
"Grandma Rose · Log only".

---

### 11. Invite Caregiver — `app/(app)/invite-caregiver.tsx` (to build)

**Purpose:** invite another adult to a baby profile with a specific permission level.

**Auth model (important):** caregivers do **not** share the parent's login. Each one
creates their own account and is linked to the baby profile through an invite. This gives
you an audit trail (who logged which feed), per-person revocation, and a read-only role
for daycare.

Card contents:
1. "Their email" input, placeholder "grandma@example.com".
2. Helper text 11.5px/700 `#c39bb2`, `marginTop: 8`:
   "They'll create their own password, then see {baby name}'s profile."
3. "What can they do?" label, then three **role option cards** (`gap: 10`):
   - Card: `flexDirection: row`, `alignItems: flex-start`, `gap: 11`, `padding: 13`,
     `borderRadius: 18`, **2px** border. Selected → border `#ff6fa5`, background
     `#fdeff6`; unselected → border `#f7dfec`, transparent.
   - Radio 22 × 22 circle, `marginTop: 1`: selected → filled `#ff6fa5` + white ✓.
   - Name 14px/800; description 11.5px/700 `#c39bb2`, `lineHeight: 1.45`.

| Role | id | Description |
| --- | --- | --- |
| Full access | `full` | Log everything, edit the baby profile, and invite others. |
| Log only | `log` | Add feeds, sleep, pumping and meds. Can't change settings. |
| Read only | `read` | See the history and reminders, but can't add or edit. |

Default selection: **Log only**.

4. Primary button "Send Invite" — no-op when the email is empty; otherwise creates a
   pending invite and clears the field.

**Pending invites** (only when at least one exists), `marginTop: 22`:
- "Pending invites" 14px/800, `marginBottom: 10`.
- Rows (`gap: 10`): background `#fdeff6`, **1.5px dashed** `#f7dfec` border,
  `borderRadius: 20`, `padding: 11`. Envelope icon in a 38 × 38 white chip
  (`borderRadius: 13`, 1.5px `#f7dfec` border, `#c39bb2` icon); email 13.5px/800;
  "Invited {when} · {role}" 11px/700 `#c39bb2`; a "Cancel" text button on the right
  (11.5px/800 `#c39bb2`) that removes the invite.

---

### 12. Refer a Friend — `app/(app)/refer.tsx`

Currently a `ComingSoon` placeholder; the design gives it real content. Centered column,
`padding: 30 10`: 96 × 96 `borderRadius: 34` `#ffe0d3` chip with a 46px gift icon in
`#f07a4a`; "Invite other parents" 20px/800; body 13.5px/600 `#c39bb2`, `maxWidth: 220`,
`lineHeight: 1.5`; a dashed accent code box (`MAYA-2025` 14px/800 accent, letter-spacing 1,
with a "Copy" affordance); primary button "Share Invite".

---

### Screen shell

Every detail screen shares one shell (`src/components/ScreenShell`):
`SafeAreaView` bg `#fdeff6` → `KeyboardAvoidingView` → `ScrollView`
(`padding: 18`, `paddingBottom: 40`). Header row: `gap: 12`, `marginBottom: 14` —
a 40 × 40 back button (`borderRadius: 14`, white, 1.5px `#f7dfec` border, chevron-left
`#4a2f42`) then the title at 20px/800.

Standard **card**: white, 1.5px `#f7dfec` border, `borderRadius: 24`, `padding: 18`.
Standard **field label**: 12.5px/800 `#4a2f42`, `marginBottom: 8`.
Standard **input**: 1.5px `#f7dfec` border, `borderRadius: 16`, padding `12` × `14`,
15px/600 `#4a2f42`, background `#fdeff6`, placeholder `#c39bb2`.
Standard **primary button**: `marginTop: 18`, `#ff6fa5`, `borderRadius: 18`,
`paddingVertical: 15`, centered 16px/800 white label, shadow `0 8 14` accent at 40%.
Pressed state: `opacity: .85`. Disabled: `opacity: .5`.

---

## Interactions & Behavior

**Navigation** — home cards and the tab-bar FAB `router.push` to their routes; every
detail screen's back button calls `router.back()`. Invite Caregiver returns to Profile.

**Baby switcher** — opens as a slide-up modal from the header identity button; closes on
backdrop press or row selection.

**Monthiversary flowers** — shown only when `new Date().getDate() === baby.bornDay`.
14 emoji petals (🌸 🌼 🌷 💮 🏵️), sizes 16–27px, spread across the width at roughly
even horizontal offsets with a little jitter. Each falls from `-50` to `screenHeight + 40`
while rotating `0° → 340°`; opacity ramps `0 → 1` over the first 12% then settles at `.85`.
Duration 3000–4400 ms, delay 0–1300 ms, linear easing, `useNativeDriver: true`. The layer
is `pointerEvents="none"` and absolutely fills the screen. It replays when the badge is
tapped, when switching to a baby whose monthiversary is today, and after adding a baby.
Respect `AccessibilityInfo.isReduceMotionEnabled()` — skip the animation if enabled.

**Steppers** clamp to their min/max; **chip rows** set the value directly and highlight
the matching chip. **Clock dials** respond to both a tap and a continuous drag.

**Medication check-off** is optimistic; toggling the bell schedules or cancels the
notification immediately.

**Form validation** — "Send Invite" requires a non-empty email (validate the format too).
"Add Medication" falls back to the name "New medication" when the field is blank; prefer
disabling the button instead. Feeding requires `prepared > 0`.

**Loading / error states** are not drawn in the prototype. Follow the app's existing
conventions: the `Button` component already supports a loading spinner, and errors surface
through the existing `Banner` component — keep both.

---

## State Management

Local screen state (mirrors the prototype):

- **Home**: `babies[]`, `activeId`, `switcherOpen`, `flowerPlayKey`.
- **Feeding**: `prepared` (120), `fed` (108), `notes`.
- **Sleep**: `mode` ("night"), `sleepH` (1), `sleepM` (30), `dialMode` ("h"), `notes`.
- **Pump**: `left` (70), `right` (70).
- **Medication**: `meds[]`, `name`, `amount` (400), `unit` ("IU"), `medH` (9), `medM` (0),
  `medPm` (false), `dialMode` ("h"), `repeatDaily` (true), `remindMe` (true).
- **Milestones**: `photoUri`, `note`, `date`.
- **Payment Plan**: `billing` ("monthly"), `planId` ("plus").
- **Caregivers**: `caregivers[]`, `pending[]`, `inviteEmail`, `inviteRole` ("log").

Shared state that should live above the screens (context or your store of choice):
the baby list and `activeId` — the header, every log screen, and the caregiver list all
need the active baby. Everything else is fine as local state.

**Data fetching** — the prototype uses seed arrays; replace each with a call through
`src/api/index.ts`. Existing endpoints cover feeding, sleep, pumping, and milestones.
**New backend work required:**
- `medication` — CRUD plus a per-dose reminder flag.
- `babies` — the current app assumes one baby; this needs a real collection per account.
- `caregiver_invites` — links a user to a baby with a role (`full` / `log` / `read`),
  with pending/accepted states and an email invite link.
- `subscription` — the selected plan and billing period.

Types for `Baby` and `Medication` are in `reference-rn-code/src/types/baby.ts`.

---

## Design Tokens

**Colors**

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#fdeff6` | Screen background, input fill, inset panels |
| `surface` | `#ffffff` | Cards, rows, tab bar |
| `accent` | `#ff6fa5` | Primary actions, selection, active states |
| `accentSoft` | `#e6dcff` | Badge pills, secondary avatar fill |
| `text` | `#4a2f42` | Primary text |
| `muted` | `#c39bb2` | Secondary text, inactive icons |
| `line` | `#f7dfec` | Borders, dividers, gauge tracks |
| `heroFrom` | `#ff85b3` | Gradient start |
| `heroTo` | `#b7a4ff` | Gradient end |
| `danger` | `#dc2626` | Log out text |
| `dangerLine` | `#f5b9b9` | Log out border |

Feature tints (card background / icon color): feeding `#ffe1ec` / `#ff6fa5`,
sleep `#e7ddff` / `#8b6fe0`, pump `#d9f0ff` / `#4aa8e0`, medication `#d7f5e8` / `#2fae8a`,
plan `#efe3ff` / `#7d5cd6`, milestone `#fff2cf` / `#e0a92e`, refer `#ffe0d3` / `#f07a4a`.
Supporting: `#3a7ba0` (pump total label), `#1f8f70` (reminder banner text),
`#6b4fa8` (badge text), `#e178a8` / `#f0b8d3` / `#fff2f8` (photo empty state).
Translucent-on-gradient: `rgba(255,255,255,.28)` avatar, `.24` badge, `.16` stat cell,
`.14` decorative circle, `.9` / `.85` text.

**Typography** — Baloo 2 throughout (`@expo-google-fonts/baloo-2`). Weights used: 600
(input text and body), 700 (meta and secondary), 800 (everything emphatic — this design
leans hard on 800).

Sizes: 27 (plan price) · 26 (dial readout) · 24 (med readout) · 22 (gauge value) ·
21 (header avatar) · 20 (screen title, header name) · 19 (pump total) · 18 (profile name) ·
16 (primary button, sheet heading, plan name) · 15 (card title, row name) ·
14 (section title, row name, small value) · 13.5 (stat value, switch label) ·
13 (chip, segment, small title) · 12.5 (field label, banner, helper) ·
12 (column label, meta) · 11.5 (subtitle, description) · 11 (email, footnote) ·
10.5 (stat label) · 10 (role pill, tab label).

**Spacing** — 4 · 6 · 8 · 9 · 10 · 11 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 32 · 40.
Screen padding 18. Card padding 18 (16 for plan and 12–13 for rows). Grid gap 12.

**Radii** — 9 (small pill) · 10 (role pill) · 12 (segment) · 13 (small avatar chip) ·
14 (back button, small button) · 15 (icon chip, stat cell) · 16 (input, banner, stepper
button) · 17 (header avatar) · 18 (button, role card, sheet row) · 20 (row, stepper track) ·
24 (card, feature card) · 26 (profile avatar) · 28 (hero, sheet top) · 34 (refer chip) ·
50% (circles).

**Shadows** — feature card: `rgba(0,0,0,.08)`, offset `{0,6}`, radius 12, elevation 2.
Primary button: accent at 40%, offset `{0,8}`, radius 14, elevation 4.
FAB: accent, offset `{0,12}`, radius 22. Selected plan: accent, offset `{0,10}`, radius 22.
Dial knob: `rgba(0,0,0,.2)`, offset `{0,2}`, radius 6.

---

## Assets

No image assets. Everything is either a line icon (2px stroke, round caps and joins,
21px on cards / 17–20px in rows) or an emoji.

- **Icons** — drawn inline as SVG in the prototype. In the app, use one icon library
  consistently; `@expo/vector-icons` ships with Expo. Needed: bottle, moon, droplet,
  pill/capsule, credit card, star, gift, bell, camera, envelope, check, plus, minus,
  chevron-left, chevron-down, house, person. The reference RN code uses emoji placeholders —
  replace them.
- **Emoji used deliberately** (keep these): 🌙 🛏 in the sleep toggle, 🔔 on reminders,
  🎉 on the milestone button, 🌸 🌼 🌷 💮 🏵️ for the flower celebration, 🌸 on the
  monthiversary badge, 📷 in the photo placeholder.
- **Font** — Baloo 2 from Google Fonts via `@expo-google-fonts/baloo-2`.
- **Photo slot** in the prototype is a drag-and-drop placeholder (`image-slot.js`); in the
  app it's `expo-image-picker`, already used by the current milestone screen.

---

## Files

**`prototypes/`** — the design references (open the `.dc.html` files in a browser):
- `Feature Hub.dc.html` — **the main prototype.** Home hub, baby switcher, add-baby,
  all data-entry screens, medication, payment plan, profile with caregivers, invite flow,
  flower celebration. Everything is interactive.
- `Data Entry.dc.html` — the five data-entry screens side by side, for comparing input
  patterns in isolation.
- `Design Directions.dc.html` — the three visual directions explored before "Bubble Pop"
  was chosen (light and dark). Historical context only.
- `support.js`, `image-slot.js` — runtime for the prototypes. Not for the app.

**`reference-rn-code/`** — first-pass React Native port (see the caveat above):
- `README.md` — install commands and file map.
- `src/theme/colors.ts`, `src/theme/fonts.ts` — tokens and font loader.
- `src/types/baby.ts` — `Baby` and `Medication` types.
- `src/components/` — `Stepper`, `ChipRow`, `SegmentedToggle`, `DialGauge`, `FeatureCard`,
  `BabySummaryHeader`, `BabySwitcherSheet`, `FlowerDrop`, `ScreenShell`, `PrimaryButton`.
- `app/-app-/(tabs)/dashboard.tsx`, `log.tsx`, `app/-app-/sleep.tsx`, `milk-pump.tsx`,
  `medication.tsx` — screens. **Rename `-app-` → `(app)` and `-tabs-` → `(tabs)`.**
- `src/lib/reminders.ts` — medication local notifications.

**New dependencies:**

```bash
npx expo install @expo-google-fonts/baloo-2 expo-font expo-linear-gradient \
  react-native-svg expo-notifications react-native-safe-area-context
```

Load the font once in `app/_layout.tsx` via `useAppFonts()` and render `null` until ready.

---

## Suggested order of work

1. Tokens and font (`src/theme/`), then the shared primitives — `ScreenShell`,
   `PrimaryButton`, `Stepper`, `ChipRow`, `SegmentedToggle`, `DialGauge`.
2. Restyle the existing screens (dashboard, log, sleep, milk-pump, profile, milestone)
   to the new tokens — no new backend needed.
3. Multi-baby: the `Baby` collection, switcher sheet, summary header, add-baby screen.
4. Medication: backend endpoint, screen, and reminders.
5. The clock dial, then swap it into Sleep and Medication.
6. Payment Plan, then Caregivers and the invite flow (both need backend work).
7. Flower celebration last — it's pure polish.
