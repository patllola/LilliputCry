import Svg, { Circle } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props = {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  trackColor?: string;
  unit?: string;
  /** Show a "%" suffix instead of a unit label (e.g. the waste gauge). */
  suffix?: string;
};

/** Ring gauge that fills as the value grows (waste %, pump volume, ...). */
export function DialGauge({
  value,
  max = 150,
  size = 96,
  color = colors.pumpIcon,
  trackColor = colors.pump,
  unit = "ml",
  suffix,
}: Props) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[s.value, { color }]}>
        {value}
        {suffix ?? ""}
      </Text>
      {!suffix && <Text style={s.unit}>{unit}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  value: { fontSize: 22, color: colors.text, fontFamily: fonts.black },
  unit: { fontSize: 10, color: colors.muted, fontFamily: fonts.bold, marginTop: -2 },
});
