// ─────────────────────────────────────────────────────────────────────────────
// Reset Password — Token + new password. Handles realtor/client/admin via ?role=
// Usage: /(auth)/reset-password?role=realtor&token=ABC123
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

type Role = "realtor" | "client" | "admin";

const ROLE_META: Record<Role, { endpoint: string; loginPath: string }> = {
  realtor: {
    endpoint: API.realtors.resetPassword,
    loginPath: "/(auth)/realtor-login",
  },
  client: {
    endpoint: API.clients.resetPassword,
    loginPath: "/(auth)/client-login",
  },
  admin: {
    endpoint: API.admin.resetPassword,
    loginPath: "/(auth)/admin-login",
  },
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: Role; token?: string }>();
  const role: Role =
    params.role && ROLE_META[params.role] ? params.role : "realtor";
  const meta = ROLE_META[role];
  const token = (params.token ?? "").toString();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirm?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (password.length < 8) errs.password = "Minimum 8 characters";
    if (password !== confirmPassword) errs.confirm = "Passwords do not match";
    if (!token)
      errs.general = "Missing reset token. Open the link from your email.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post(meta.endpoint, { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : "Could not reset password.");
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const pwStrength =
    password.length > 0 ? Math.min(Math.floor(password.length / 3), 4) : 0;
  const strengthColor =
    ["#DC2626", "#A35FF4", "#8A2FF0", "#700CEB"][pwStrength - 1] ??
    Colors.border;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={Gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.patternWrap} pointerEvents="none">
        <DotPattern width={400} height={240} opacity={0.06} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color="rgba(255,255,255,0.6)"
          />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <FadeInView style={styles.headerArea}>
          <View style={styles.iconCircle}>
            <LinearGradient colors={Gradients.purple} style={styles.iconGrad}>
              <MaterialIcons
                name={success ? "verified-user" : "shield"}
                size={34}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <Text style={styles.title}>
            {success ? "Password Updated" : "Set New Password"}
          </Text>
          <Text style={styles.subtitle}>
            {success
              ? "Your password has been changed. You can now sign in with your new password."
              : "Choose a strong password — at least 8 characters with a mix of letters and numbers."}
          </Text>
        </FadeInView>

        <FadeInView delay={120}>
          {success ? (
            <View style={[styles.card, Shadow.lg, { alignItems: "center" }]}>
              <View style={styles.successDot}>
                <MaterialIcons name="check" size={28} color={Colors.success} />
              </View>
              <Button
                label="Sign In"
                onPress={() => router.replace(meta.loginPath as any)}
                variant="primary"
                fullWidth
                size="lg"
              />
            </View>
          ) : (
            <View style={[styles.card, Shadow.lg]}>
              {errors.general ? (
                <View style={styles.errorBanner}>
                  <MaterialIcons
                    name="error-outline"
                    size={18}
                    color={Colors.error}
                  />
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              ) : null}

              <Input
                label="New Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrors((e) => ({
                    ...e,
                    password: undefined,
                    general: undefined,
                  }));
                }}
                placeholder="Minimum 8 characters"
                error={errors.password}
                required
                secureTextEntry={!showPw}
                textContentType="newPassword"
                leftIcon={
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={Colors.textMuted}
                  />
                }
                rightIcon={
                  <MaterialIcons
                    name={showPw ? "visibility-off" : "visibility"}
                    size={20}
                    color={Colors.textMuted}
                  />
                }
                onRightIconPress={() => setShowPw((v) => !v)}
              />

              {pwStrength > 0 ? (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBar}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSeg,
                          i < pwStrength
                            ? { backgroundColor: strengthColor }
                            : null,
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.strengthLabel, { color: strengthColor }]}
                  >
                    {strengthLabel}
                  </Text>
                </View>
              ) : null}

              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setErrors((e) => ({ ...e, confirm: undefined }));
                }}
                placeholder="Repeat your new password"
                error={errors.confirm}
                required
                secureTextEntry
                textContentType="newPassword"
                leftIcon={
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={Colors.textMuted}
                  />
                }
              />

              <Button
                label={loading ? "Updating..." : "Update Password"}
                onPress={handleSubmit}
                loading={loading}
                variant="primary"
                fullWidth
                size="lg"
              />
            </View>
          )}
        </FadeInView>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  patternWrap: { position: "absolute", top: 0, right: 0 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.6)" },

  headerArea: { alignItems: "center", marginBottom: 24 },
  iconCircle: { marginBottom: 16, ...Shadow.lg },
  iconGrad: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    ...Typography.h2,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 22,
    marginBottom: 14,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { ...Typography.bodySm, color: Colors.error, flex: 1 },

  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: -8,
  },
  strengthBar: { flex: 1, flexDirection: "row", gap: 3 },
  strengthSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  strengthLabel: {
    ...Typography.caption,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },

  successDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
});
