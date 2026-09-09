// ─────────────────────────────────────────────────────────────────────────────
// KHLLogo — Reusable SVG brand mark, using the real KHL logo artwork.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";
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
  const radius =
    rounded === "pill" ? 540 : rounded === "square" ? 86 : 238; // soft

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

      <Svg width={size} height={size} viewBox="0 0 1080 1080">
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
          width="1080"
          height="1080"
          rx={radius}
          fill="url(#khlGrad)"
        />

        {/* Inner highlight ring */}
        <Rect
          x="86"
          y="86"
          width="908"
          height="908"
          rx={Math.max(0, radius - 65)}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="16"
        />

        {/* Subtle top sheen */}
        <Rect
          x="151"
          y="151"
          width="778"
          height="238"
          rx="86"
          fill="rgba(255,255,255,0.08)"
        />

        {/* Brand mark */}
        <Path fill="#fff" d="M288.75,441.16V638.84H436.49Z" />
        <Path
          fill="#fff"
          d="M462.45,444.78l-73.71,88L463.16,635l70.77-.8L456.2,531.15l72.28-86.46Z"
        />
        <Path
          fill="#fff"
          d="M543.81,444.83l.22,194H597.1l-.19-80H639V635h49.49V444.69H638.18s-.52,72.33,0,72.33H593.3v-71.8S543.81,445.22,543.81,444.83Z"
        />
        <Path
          fill="#fff"
          d="M703.69,444.69V635h87.56V593.15H753.18V444.69Z"
        />
      </Svg>
    </View>
  );
}
