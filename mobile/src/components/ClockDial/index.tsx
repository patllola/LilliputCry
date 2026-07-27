import { useMemo, useRef } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props = {
  /** Exactly 12 labels, index 0 drawn at the top, clockwise. */
  labels: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  size?: number;
};

const NUMBER_SIZE = 28;
const HAND_LENGTH = 66;
const HAND_WIDTH = 3;
const KNOB_SIZE = 20;
const CENTER_DOT = 9;

/**
 * A clock face for hour/minute entry by tap-or-drag instead of typing.
 * Rotation math: deg = atan2(dx, -dy) normalized to 0-360 puts 0deg at the
 * top and increases clockwise, matching how the 12 numbers are laid out.
 */
export function ClockDial({ labels, selectedIndex, onChange, size = 198 }: Props) {
  const center = size / 2;
  const numberRadius = size * (78 / 198);
  const faceRef = useRef<View>(null);
  const windowOrigin = useRef({ x: 0, y: 0 });

  function indexFromGesture(_evt: GestureResponderEvent, gesture: PanResponderGestureState) {
    const dx = gesture.moveX - (windowOrigin.current.x + center);
    const dy = gesture.moveY - (windowOrigin.current.y + center);
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const norm = (deg + 360) % 360;
    return Math.round(norm / 30) % 12;
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt, gesture) => onChange(indexFromGesture(evt, gesture)),
        onPanResponderMove: (evt, gesture) => onChange(indexFromGesture(evt, gesture)),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, center],
  );

  return (
    <View
      ref={faceRef}
      onLayout={() => {
        faceRef.current?.measureInWindow((x, y) => {
          windowOrigin.current = { x, y };
        });
      }}
      style={[s.face, { width: size, height: size, borderRadius: size / 2 }]}
      {...panResponder.panHandlers}
    >
      {labels.map((label, index) => {
        const angle = (index * 30 - 90) * (Math.PI / 180);
        const x = center + numberRadius * Math.cos(angle) - NUMBER_SIZE / 2;
        const y = center + numberRadius * Math.sin(angle) - NUMBER_SIZE / 2;
        const active = index === selectedIndex;
        return (
          <View
            key={index}
            pointerEvents="none"
            style={[s.number, { left: x, top: y }, active && s.numberActive]}
          >
            <Text style={[s.numberText, active && s.numberTextActive]}>{label}</Text>
          </View>
        );
      })}

      <View
        pointerEvents="none"
        style={[s.pivot, { left: center, top: center, transform: [{ rotate: `${selectedIndex * 30}deg` }] }]}
      >
        <View style={s.hand} />
        <View style={s.knob} />
      </View>
      <View
        pointerEvents="none"
        style={[s.centerDot, { left: center - CENTER_DOT / 2, top: center - CENTER_DOT / 2 }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  face: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignSelf: "center",
  },
  number: {
    position: "absolute",
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  numberActive: { backgroundColor: colors.accent },
  numberText: { fontSize: 13, color: colors.text, fontFamily: fonts.black },
  numberTextActive: { color: "#fff" },
  pivot: { position: "absolute", width: 0, height: 0 },
  hand: {
    position: "absolute",
    left: -HAND_WIDTH / 2,
    top: -HAND_LENGTH,
    width: HAND_WIDTH,
    height: HAND_LENGTH,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  knob: {
    position: "absolute",
    left: -KNOB_SIZE / 2,
    top: -HAND_LENGTH - KNOB_SIZE / 2,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.accent,
    shadowColor: "rgba(0,0,0,.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  centerDot: {
    position: "absolute",
    width: CENTER_DOT,
    height: CENTER_DOT,
    borderRadius: CENTER_DOT / 2,
    backgroundColor: colors.accent,
  },
});
