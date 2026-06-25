import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { Gradients, Colors, Typography, Radius } from "@/constants/theme";

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={Gradients.midnight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Reports</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          <MaterialIcons name="bar-chart" size={48} color={Colors.brand} />
          <Text style={styles.cardTitle}>Reports Coming Soon</Text>
          <Text style={styles.cardSub}>
            Advanced analytics and exportable reports will be available in a future update.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  cardTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "700", marginTop: 16, marginBottom: 8, textAlign: "center" },
  cardSub: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
});
