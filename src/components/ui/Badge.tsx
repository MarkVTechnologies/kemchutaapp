import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Radius, Spacing } from "@/constants/theme";

type BadgeVariant = "brand" | "success" | "warning" | "error" | "info" | "neutral" | "gold";

interface BadgeProps {
  label:    string;
  variant?: BadgeVariant;
  style?:   ViewStyle;
  dot?:     boolean;
}

const CONFIG: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  brand:   { bg: Colors.brandLight,    text: Colors.brand,   dot: Colors.brand },
  success: { bg: Colors.successBg,     text: Colors.success, dot: Colors.success },
  warning: { bg: Colors.warningBg,     text: Colors.warning, dot: Colors.warning },
  error:   { bg: Colors.errorBg,       text: Colors.error,   dot: Colors.error },
  info:    { bg: Colors.infoBg,        text: Colors.info,    dot: Colors.info },
  neutral: { bg: Colors.borderLight,   text: Colors.textSecondary, dot: Colors.textSecondary },
  gold:    { bg: Colors.goldBg,        text: Colors.gold,    dot: Colors.gold },
};

/** Maps a subscription/commission/inspection status string to a badge variant */
export function statusToVariant(
  status: string,
): BadgeVariant {
  const s = status.toLowerCase();
  if (["approved", "completed", "paid", "success", "active"].includes(s)) return "success";
  if (["pending", "reviewing", "confirmed"].includes(s))                   return "warning";
  if (["rejected", "cancelled", "failed", "overdue"].includes(s))         return "error";
  if (["reviewed"].includes(s))                                             return "info";
  return "neutral";
}

export function Badge({ label, variant = "neutral", style, dot = false }: BadgeProps) {
  const cfg = CONFIG[variant];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: cfg.dot }]} />}
      <Text style={[styles.label, { color: cfg.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical:   3,
    borderRadius:   Radius.full,
    alignSelf:      "flex-start",
  },
  dot: {
    width: 6, height: 6,
    borderRadius: Radius.full,
    marginRight: Spacing.xs,
  },
  label: { ...Typography.micro, fontWeight: "600", textTransform: "capitalize" },
});
