// ─────────────────────────────────────────────────────────────────────────────
// Edit Profile — Realtor self-service (name, phone, state)
// PUT /api/realtors/me → returns updated user; we sync it into the auth store.
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

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [state, setState] = useState((user as any)?.state ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.put<AuthUser>(API.realtors.updateMe, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        state: state.trim(),
      }),
    onSuccess: (updated) => {
      setUser(updated);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ?? "Couldn't update profile. Try again.";
      Alert.alert("Update Failed", msg);
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15)
      e.phone = "Enter a valid phone number";
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
          <View style={styles.card}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              required
              autoCapitalize="words"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              required
              autoCapitalize="words"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              keyboardType="phone-pad"
              required
            />
            <Input
              label="State"
              value={state}
              onChangeText={setState}
              autoCapitalize="words"
            />

            <View style={styles.readonlyRow}>
              <MaterialIcons name="email" size={16} color={Colors.textMuted} />
              <Text style={styles.readonlyText}>{user?.email}</Text>
              <View style={styles.lockBadge}>
                <MaterialIcons name="lock" size={11} color={Colors.textMuted} />
              </View>
            </View>
            <Text style={styles.hint}>
              Email is your login and can't be changed here.
            </Text>
          </View>

          <Button
            label="Save Changes"
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

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 4,
  },
  readonlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  readonlyText: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  lockBadge: { opacity: 0.7 },
  hint: { ...Typography.caption, color: Colors.textMuted, marginTop: 6 },
});
