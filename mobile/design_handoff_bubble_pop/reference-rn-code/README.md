# Bubble Pop — LilliputCry mobile redesign

Approved design, ported to React Native / Expo. Drop these into your repo, keeping the same paths.

## Install the new dependencies

```bash
npx expo install @expo-google-fonts/baloo-2 expo-font expo-linear-gradient react-native-svg expo-notifications react-native-safe-area-context
```

## Load the font once

In `app/_layout.tsx`:

```tsx
import { useAppFonts } from "@/theme/fonts";

export default function RootLayout() {
  const [ready] = useAppFonts();
  if (!ready) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

## ⚠ Rename the route folders first

Expo Router route groups use parentheses, which this export couldn't write. Rename on the way in:

```
app/-app-/        ->  app/(app)/
app/-app-/-tabs-/ ->  app/(app)/(tabs)/
```

## File map

| Path | What it is |
| --- | --- |
| `src/theme/colors.ts` | Bubble Pop palette (replaces the purple tokens) |
| `src/theme/fonts.ts` | Baloo 2 loader + family names |
| `src/types/baby.ts` | `Baby` and `Medication` types |
| `src/components/Stepper` | Big +/- number entry |
| `src/components/ChipRow` | One-tap preset chips |
| `src/components/SegmentedToggle` | Night/Nap style segmented control |
| `src/components/DialGauge` | SVG ring gauge (waste %, pump volume) |
| `src/components/FeatureCard` | Hub tile |
| `src/components/BabySummaryHeader` | Gradient hero: switcher + born/weight/height |
| `src/components/BabySwitcherSheet` | Bottom sheet to switch or add a baby |
| `src/components/FlowerDrop` | Monthiversary flower rain |
| `src/components/ScreenShell` | Back header + scroll body for detail screens |
| `src/components/PrimaryButton` | Accent CTA |
| `src/lib/reminders.ts` | Medication local notifications |
| `app/(app)/(tabs)/dashboard.tsx` | The feature hub |
| `app/(app)/(tabs)/log.tsx` | Feeding entry |
| `app/(app)/sleep.tsx` | Sleep entry |
| `app/(app)/milk-pump.tsx` | Pump entry |
| `app/(app)/medication.tsx` | Medication schedule + add form |

## Still to wire up

- Swap `SEED_BABIES` / `SEED` medication arrays for your API calls.
- Add a `medication` table/endpoint on the backend (the other features already have one).
- `app/(app)/add-baby.tsx` — the switcher pushes to it; build it from the same `ScreenShell` + `PrimaryButton` parts.
- Replace the emoji icons in `dashboard.tsx` with your icon set if you have one.
