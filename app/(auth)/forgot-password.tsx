// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password — Single screen for realtor/client/admin via ?role= param
// Usage: /(auth)/forgot-password?role=realtor (or client / admin)
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

const ROLE_META: Record<
  Role,
  { endpoint: string; label: string; loginPath: string }
> = {
  realtor: {
    endpoint: API.realtors.forgotPassword,
    label: "Realtor",
    loginPath: "/(auth)/realtor-login",
  },
  client: {
    endpoint: API.clients.forgotPassword,
    label: "Client",
    loginPath: "/(auth)/client-login",
  },
  admin: {
    endpoint: API.admin.forgotPassword,
    label: "Admin",
    loginPath: "/(auth)/admin-login",
  },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: Role }>();
  const role: Role =
    params.role && ROLE_META[params.role] ? params.role : "realtor";
  const meta = ROLE_META[role];

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await api.post(meta.endpoint, { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : "Something went wrong.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
                name={sent ? "mark-email-read" : "lock-reset"}
                size={36}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <Text style={styles.roleBadge}>
            {meta.label.toUpperCase()} ACCESS
          </Text>
          <Text style={styles.title}>
            {sent ? "Check Your Email" : "Forgot Password?"}
          </Text>
          <Text style={styles.subtitle}>
            {sent
              ? `We've sent a password reset link to ${email}. Open the link to set a new password.`
              : "Enter the email associated with your account and we'll send you a link to reset your password."}
          </Text>
        </FadeInView>

        <FadeInView delay={120}>
          {!sent ? (
            <View style={[styles.card, Shadow.lg]}>
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                required
                leftIcon={
                  <MaterialIcons
                    name="mail-outline"
                    size={20}
                    color={Colors.textMuted}
                  />
                }
              />

              <Button
                label={loading ? "Sending..." : "Send Reset Link"}
                onPress={handleSubmit}
                loading={loading}
                variant="primary"
                fullWidth
                size="lg"
              />
            </View>
          ) : (
            <View style={[styles.card, Shadow.lg, { alignItems: "center" }]}>
              <View style={styles.successDot}>
                <MaterialIcons name="check" size={28} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Email Sent</Text>
              <Text style={styles.successBody}>
                If an account exists for {email}, you'll receive an email within
                a few minutes.
              </Text>
              <Button
                label="Back to Sign In"
                onPress={() => router.replace(meta.loginPath as any)}
                variant="primary"
                fullWidth
              />
              <Pressable
                onPress={() => {
                  setSent(false);
                  setEmail("");
                }}
                style={styles.resendRow}
              >
                <Text style={styles.resendText}>Didn't get it? Try again</Text>
              </Pressable>
            </View>
          )}
        </FadeInView>

        {!sent ? (
          <FadeInView delay={220}>
            <Pressable
              onPress={() => router.replace(meta.loginPath as any)}
              style={styles.loginLink}
            >
              <MaterialIcons
                name="arrow-back"
                size={14}
                color={Colors.accent}
              />
              <Text style={styles.loginCta}>Back to Sign In</Text>
            </Pressable>
          </FadeInView>
        ) : null}

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
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 5,
    color: Colors.accent,
    marginBottom: 8,
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
    paddingHorizontal: 4,
    lineHeight: 22,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 22,
    marginBottom: 14,
  },

  successDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 6,
    fontWeight: "800",
  },
  successBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 22,
  },
  resendRow: { marginTop: 12 },
  resendText: { ...Typography.caption, color: Colors.brand, fontWeight: "700" },

  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  loginCta: { ...Typography.bodySm, color: Colors.accent, fontWeight: "800" },
});
