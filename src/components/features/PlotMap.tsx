// ─────────────────────────────────────────────────────────────────────────────
// PlotMap — Mirrors the web app: embeds estate.sytemap as a map/layout iframe.
// Renders nothing when the estate has no sytemap, exactly like web.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { Estate } from "@/types";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface Props {
  estate: Estate;
}

export function PlotMap({ estate }: Props) {
  if (!estate.sytemap) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        <WebView
          source={{ uri: estate.sytemap }}
          style={StyleSheet.absoluteFillObject}
          allowsFullscreenVideo
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20 },
  frame: {
    height: 260,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: Colors.ink100,
    ...Shadow.card,
  },
});
