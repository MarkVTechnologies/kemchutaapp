// ─────────────────────────────────────────────────────────────────────────────
// Client Signup — Single-step registration for property buyers
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}
const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function ClientSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clientLogin = useAuthStore((s) => s.clientLogin);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const errs: Partial<FormState> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Valid email is required";
    if (!form.phone.trim() || form.phone.length < 10)
      errs.phone = "Valid phone number is required";
    if (form.password.length < 8) errs.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Register, then auto-login to capture token + user
      await api.post(API.clients.register, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      await clientLogin(form.email.trim().toLowerCase(), form.password);
      router.replace("/(client)/portal" as any);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : "Registration failed.");
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const pwStrength =
    form.password.length > 0
      ? Math.min(Math.floor(form.password.length / 3), 4)
      : 0;
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
        <DotPattern width={420} height={260} opacity={0.06} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
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
          <View style={styles.logoOuter}>
            <LinearGradient colors={Gradients.purple} style={styles.logoGrad}>
              <MaterialIcons name="person-add-alt" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.portalBadge}>CLIENT REGISTRATION</Text>
          <Text style={styles.heading}>Create Your Account</Text>
          <Text style={styles.subheading}>
            Track subscriptions, view documents, own your future
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={[styles.card, Shadow.lg]}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChangeText={update("firstName")}
                  placeholder="Tunde"
                  error={errors.firstName}
                  required
                  autoCapitalize="words"
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChangeText={update("lastName")}
                  placeholder="Adeyemi"
                  error={errors.lastName}
                  required
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Input
              label="Email"
              value={form.email}
              onChangeText={update("email")}
              placeholder="you@example.com"
              error={errors.email}
              required
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={Colors.textMuted}
                />
              }
            />

            <Input
              label="Phone Number"
              value={form.phone}
              onChangeText={update("phone")}
              placeholder="08012345678"
              error={errors.phone}
              required
              keyboardType="phone-pad"
              leftIcon={
                <MaterialIcons
                  name="phone"
                  size={20}
                  color={Colors.textMuted}
                />
              }
            />

            <Input
              label="Password"
              value={form.password}
              onChangeText={update("password")}
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
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>
            ) : null}

            <Input
              label="Confirm Password"
              value={form.confirmPassword}
              onChangeText={update("confirmPassword")}
              placeholder="Repeat your password"
              error={errors.confirmPassword}
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

            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                By creating an account you agree to KHL's{" "}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {" and "}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>

            <Button
              label={loading ? "Creating Account..." : "Create Account"}
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              fullWidth
              size="lg"
            />
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <Pressable
            onPress={() => router.push("/(auth)/client-login" as any)}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>Already have an account?</Text>
            <Text style={styles.loginCta}>Sign In</Text>
          </Pressable>
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
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.6)" },

  headerArea: { alignItems: "center", marginBottom: 22 },
  logoOuter: { marginBottom: 14, ...Shadow.lg },
  logoGrad: {
    width: 78,
    height: 78,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  portalBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 5,
    color: Colors.accent,
    marginBottom: 6,
  },
  heading: {
    ...Typography.h2,
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
  },
  subheading: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 22,
    marginBottom: 14,
  },
  nameRow: { flexDirection: "row" },

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

  termsBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 12,
    marginVertical: 12,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: { color: Colors.brand, fontWeight: "700" },

  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  loginText: { ...Typography.bodySm, color: "rgba(255,255,255,0.45)" },
  loginCta: { ...Typography.bodySm, color: Colors.accent, fontWeight: "800" },
});
