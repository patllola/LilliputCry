import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";

const FLOWERS = ["🌸", "🌼", "🌷", "💮", "🏵️"];
const COUNT = 14;

type Props = {
  /** Bump this number to replay the celebration. */
  playKey: number;
};

/** Monthiversary flower rain. Purely decorative — never blocks touches. */
export function FlowerDrop({ playKey }: Props) {
  const { height } = Dimensions.get("window");
  const petals = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      progress: new Animated.Value(0),
      left: `${(i / COUNT) * 92 + Math.random() * 6}%`,
      size: 16 + Math.round(Math.random() * 11),
      glyph: FLOWERS[i % FLOWERS.length],
      duration: 3000 + Math.round(Math.random() * 1400),
      delay: Math.round(Math.random() * 1300),
    })),
  ).current;

  useEffect(() => {
    const animations = petals.map((p) => {
      p.progress.setValue(0);
      return Animated.timing(p.progress, {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });
    Animated.parallel(animations).start();
  }, [playKey, petals]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {petals.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: p.left as any,
            transform: [
              { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 40] }) },
              { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "340deg"] }) },
            ],
            opacity: p.progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 0.85] }),
          }}
        >
          <Text style={{ fontSize: p.size }}>{p.glyph}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
