// ─────────────────────────────────────────────────────────────────────────────
// KHLLogo — Reusable SVG brand mark. Pure purple gradient with inner accent.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Colors } from "@/constants/theme";

interface Props {
  size?: number;
  rounded?: "soft" | "pill" | "square";
  withGlow?: boolean;
}

export function KHLLogo({
  size = 80,
  rounded = "soft",
  withGlow = false,
}: Props) {
  const radius = rounded === "pill" ? 50 : rounded === "square" ? 8 : 22; // soft

  return (
    <View style={{ width: size, height: size }}>
      {withGlow ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: size,
              shadowColor: Colors.brand,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 24,
              elevation: 14,
            },
          ]}
          pointerEvents="none"
        />
      ) : null}

      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="khlGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8A2FF0" />
            <Stop offset="0.6" stopColor="#700CEB" />
            <Stop offset="1" stopColor="#3F0C91" />
          </LinearGradient>
        </Defs>

        {/* Outer gradient panel */}
        <Rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx={radius}
          fill="url(#khlGrad)"
        />

        {/* Inner highlight ring */}
        <Rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx={Math.max(0, radius - 6)}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.5"
        />

        {/* Subtle top sheen */}
        <Rect
          x="14"
          y="14"
          width="72"
          height="22"
          rx="8"
          fill="rgba(255,255,255,0.08)"
        />
      </Svg>

      {/* Letterform overlay */}
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Text style={[styles.letter, { fontSize: size * 0.28 }]}>KHL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  letter: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 2,
    includeFontPadding: false,
    textAlign: "center",
  },
});
