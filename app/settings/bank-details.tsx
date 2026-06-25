// ─────────────────────────────────────────────────────────────────────────────
// Bank Details — Realtor self-service (bank, account name, account number)
// PUT /api/realtors/me/bank → returns updated user; synced into the auth store.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { AuthUser } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DotPattern } from "@/components/ui/DotPattern";
import { Colors, Gradients, Typography, Radius } from "@/constants/theme";

export default function BankDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [bank, setBank] = useState((user as any)?.bank ?? "");
  const [accountName, setAccountName] = useState(
    (user as any)?.accountName ?? "",
  );
  const [accountNumber, setAccountNumber] = useState(
    (user as any)?.accountNumber ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.put<AuthUser>(API.realtors.updateBank, {
        bank: bank.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      }),
    onSuccess: (updated) => {
      setUser(updated);
      Alert.alert("Saved", "Your bank details have been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        "Couldn't update bank details. Try again.";
      Alert.alert("Update Failed", msg);
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bank.trim()) e.bank = "Bank is required";
    if (!accountName.trim()) e.accountName = "Account name is required";
    const digits = accountNumber.replace(/\D/g, "");
    if (digits.length !== 10)
      e.accountNumber = "Must be a 10-digit account number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={160} opacity={0.08} />
        </View>
        <View style={[styles.headerContent, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Bank Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={16} color={Colors.brand} />
            <Text style={styles.infoText}>
              Payouts are sent to this account. Make sure the details are exact.
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Bank Name"
              value={bank}
              onChangeText={setBank}
              error={errors.bank}
              required
              autoCapitalize="words"
            />
            <Input
              label="Account Name"
              value={accountName}
              onChangeText={setAccountName}
              error={errors.accountName}
              required
              autoCapitalize="words"
            />
            <Input
              label="Account Number"
              value={accountNumber}
              onChangeText={(t) =>
                setAccountNumber(t.replace(/\D/g, "").slice(0, 10))
              }
              error={errors.accountNumber}
              keyboardType="number-pad"
              maxLength={10}
              required
            />
          </View>

          <Button
            label="Save Bank Details"
            onPress={onSave}
            loading={mutation.isPending}
            fullWidth
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerWrap: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand50,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 14,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.brand,
    flex: 1,
    fontWeight: "600",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 4,
  },
});
