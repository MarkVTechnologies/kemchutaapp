// ─────────────────────────────────────────────────────────────────────────────
// FadeInView — lightweight fade + slide-up on mount (native driver, no loops)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  delay?: number; // ms — stagger multiple elements
  duration?: number;
  offset?: number; // starting Y offset in px
  style?: ViewStyle | ViewStyle[];
}

export function FadeInView({
  children,
  delay = 0,
  duration = 450,
  offset = 18,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
