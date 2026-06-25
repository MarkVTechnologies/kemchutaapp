// ─────────────────────────────────────────────────────────────────────────────
// Button — NativeWind-safe (color on inner View) + subtle press-scale
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing, MIN_TOUCH_TARGET } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

const BG: Record<Variant, string> = {
  primary: Colors.brand,
  secondary: Colors.ink800,
  outline: "#FFFFFF",
  ghost: "transparent",
  danger: Colors.error,
};
const BG_PRESSED: Record<Variant, string> = {
  primary: Colors.brand900,
  secondary: Colors.ink900,
  outline: Colors.brand50,
  ghost: Colors.brand50,
  danger: "#B91C1C",
};
const TEXT_COLOR: Record<Variant, string> = {
  primary: "#FFFFFF",
  secondary: "#FFFFFF",
  outline: Colors.brand,
  ghost: Colors.brand,
  danger: "#FFFFFF",
};
const SIZE_PAD: Record<Size, { paddingVertical: number; minHeight: number }> = {
  sm: { paddingVertical: Spacing.sm, minHeight: 38 },
  md: { paddingVertical: Spacing.md, minHeight: MIN_TOUCH_TARGET },
  lg: { paddingVertical: 17, minHeight: MIN_TOUCH_TARGET + 6 },
};
const SIZE_FONT: Record<Size, number> = { sm: 14, md: 16, lg: 17 };

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const pillStyle: ViewStyle = {
    backgroundColor: pressed && !isDisabled ? BG_PRESSED[variant] : BG[variant],
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingVertical: SIZE_PAD[size].paddingVertical,
    minHeight: SIZE_PAD[size].minHeight,
    width: fullWidth ? "100%" : undefined,
    opacity: isDisabled ? 0.45 : 1,
    transform: [{ scale: pressed && !isDisabled ? 0.975 : 1 }],
    ...(variant === "outline"
      ? { borderWidth: 1.5, borderColor: Colors.brand }
      : null),
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      <View style={[pillStyle, style]}>
        {loading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost"
                ? Colors.brand
                : "#FFFFFF"
            }
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.label,
              { color: TEXT_COLOR[variant], fontSize: SIZE_FONT[size] },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: "100%" },
  label: { fontWeight: "700", textAlign: "center", letterSpacing: 0.3 },
});
