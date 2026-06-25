import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Colors, Typography, Spacing } from "@/constants/theme";
export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.body}>This screen doesn't exist in the KHL app.</Text>
      <Button label="Go Home" onPress={() => router.replace("/(tabs)")} style={styles.btn} />
    </View>
  );
}
const styles = StyleSheet.create({
  root:  { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background, padding: Spacing.xl },
  code:  { fontSize: 72, fontWeight: "900", color: Colors.brand, marginBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  body:  { ...Typography.body, color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xl },
  btn:   { minWidth: 160 },
});
