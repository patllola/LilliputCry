// Baloo 2 gives the playful, rounded feel. Loaded once in the root layout.
import {
  useFonts,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from "@expo-google-fonts/baloo-2";

export const fonts = {
  medium: "Baloo2_500Medium",
  semi: "Baloo2_600SemiBold",
  bold: "Baloo2_700Bold",
  black: "Baloo2_800ExtraBold",
} as const;

export function useAppFonts() {
  return useFonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });
}
