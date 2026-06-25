// ─────────────────────────────────────────────────────────────────────────────
// Change Password — Realtor self-service (authenticated)
// PUT /api/realtors/me/password { currentPassword, newPassword }
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
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DotPattern } from "@/components/ui/DotPattern";
import { Colors, Gradients, Typography, Radius } from "@/constants/theme";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.put<{ message: string }>(API.realtors.changePassword, {
        currentPassword: current,
        newPassword: next,
      }),
    onSuccess: () => {
      Alert.alert("Password Updated", "Your password has been changed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ?? "Couldn't change password. Try again.";
      Alert.alert("Failed", msg);
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = "Enter your current password";
    if (next.length < 8) e.next = "Must be at least 8 characters";
    if (next !== confirm) e.confirm = "Passwords don't match";
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
          <Text style={styles.headerTitle}>Change Password</Text>
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
              label="Current Password"
              value={current}
              onChangeText={setCurrent}
              error={errors.current}
              secureTextEntry={!show}
              required
            />
            <Input
              label="New Password"
              value={next}
              onChangeText={setNext}
              error={errors.next}
              secureTextEntry={!show}
              required
            />
            <Input
              label="Confirm New Password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              secureTextEntry={!show}
              required
            />

            <Pressable
              onPress={() => setShow((s) => !s)}
              style={styles.showRow}
              hitSlop={8}
            >
              <MaterialIcons
                name={show ? "visibility-off" : "visibility"}
                size={18}
                color={Colors.brand}
              />
              <Text style={styles.showText}>
                {show ? "Hide passwords" : "Show passwords"}
              </Text>
            </Pressable>
          </View>

          <Button
            label="Update Password"
            onPress={onSave}
            loading={mutation.isPending}
            fullWidth
            style={{ marginTop: 20 }}
          />

          <Pressable
            onPress={() =>
              router.push("/(auth)/forgot-password?role=realtor" as any)
            }
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot your current password?</Text>
          </Pressable>
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
  showRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  showText: { ...Typography.caption, color: Colors.brand, fontWeight: "700" },

  forgotLink: { alignItems: "center", marginTop: 18 },
  forgotText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
