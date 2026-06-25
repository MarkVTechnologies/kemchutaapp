// ─────────────────────────────────────────────────────────────────────────────
// AppLoader — Full-screen branded loader + InlineLoader for in-screen use
// Animations: native-driven, gentle, no battery drain
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KHLLogo } from "@/components/ui/KHLLogo";
import { DotPattern } from "@/components/ui/DotPattern";
import { Colors, Gradients, Typography } from "@/constants/theme";

interface Props {
  message?: string;
  brandName?: string;
}

// ── Full-screen loader (use during initial app load or major transitions) ───
export function AppLoader({
  message = "Loading...",
  brandName = "Kemchuta Homes",
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // Fade in once
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Gentle logo pulse — looped
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Three-dot loader sequence
    const animateDot = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.25,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(400 - delay),
        ]),
      ).start();
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.patternWrap} pointerEvents="none">
        <DotPattern width={420} height={420} opacity={0.07} />
      </View>

      <Animated.View style={[styles.center, { opacity: fade }]}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <KHLLogo size={104} withGlow />
        </Animated.View>

        <Text style={styles.brand}>{brandName}</Text>
        <Text style={styles.tagline}>Premium Real Estate</Text>

        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </Animated.View>
    </View>
  );
}

// ── Inline loader (use inside cards, lists, or detail screens) ──────────────
export function InlineLoader({
  message,
  size = 56,
}: {
  message?: string;
  size?: number;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={inlineStyles.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <KHLLogo size={size} />
      </Animated.View>
      {message ? <Text style={inlineStyles.text}>{message}</Text> : null}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand,
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  center: { alignItems: "center" },

  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 22,
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  dotsRow: { flexDirection: "row", gap: 8, marginTop: 28 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },

  message: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.6)",
    marginTop: 18,
    fontWeight: "600",
  },
});

const inlineStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 14,
  },
  text: { ...Typography.bodySm, color: Colors.textMuted, fontWeight: "600" },
});
