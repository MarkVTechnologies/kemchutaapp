import React from "react";
import { View, Text, Pressable, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface ScreenHeaderProps {
  title:       string;
  subtitle?:   string;
  showBack?:   boolean;
  onBack?:     () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack    = false,
  onBack,
  rightAction,
  transparent = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + Spacing.sm },
      transparent && styles.transparent,
    ]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand} />

      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>

        <View style={styles.right}>
          {rightAction ?? <View style={styles.backBtn} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.brand,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  transparent: { backgroundColor: "transparent" },
  row: {
    flexDirection: "row",
    alignItems:    "center",
    justifyContent:"space-between",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backArrow: { fontSize: 32, color: Colors.textInverse, lineHeight: 36 },
  titleBlock: { flex: 1, alignItems: "center" },
  title:    { ...Typography.h2, color: Colors.textInverse },
  subtitle: { ...Typography.caption, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  right:    { width: 40, alignItems: "flex-end" },
});
