import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { useAuthStore } from "@/store/authStore";
import { useBiometrics } from "@/hooks/useBiometrics";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

export default function RealtorLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const { realtorLogin, isLoading } = useAuthStore();
  const biometrics = useBiometrics();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    biometrics.checkSupport();
  }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const shake = () =>
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: 10,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -10,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 6,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoginError(null);
    try {
      await realtorLogin(email.trim().toLowerCase(), password);

      const destination = (params.redirect ?? "/(tabs)/dashboard") as any;

      // Post-login: prompt to enable biometric if device supports it and user hasn't opted in yet
      if (biometrics.isAvailable && !biometrics.isEnabled) {
        const typeLabel =
          biometrics.biometricType === "faceId" ? "Face ID" : "Fingerprint";
        Alert.alert(
          `Enable ${typeLabel}?`,
          `Sign in faster next time using ${typeLabel}.`,
          [
            {
              text: "Not now",
              style: "cancel",
              onPress: () => router.replace(destination),
            },
            {
              text: "Enable",
              onPress: async () => {
                await biometrics.enableBiometric();
                router.replace(destination);
              },
            },
          ],
        );
      } else {
        router.replace(destination);
      }
    } catch (err: unknown) {
      shake();
      const axErr = err as any;
      const msg =
        axErr?.response?.data?.message ??
        axErr?.response?.data?.error ??
        (axErr?.code === "ECONNABORTED"
          ? "Request timed out. Check your connection."
          : axErr?.message === "Network Error"
            ? "No internet connection. Check your network and try again."
            : "Sign in failed. Please check your credentials and try again.");
      setLoginError(msg);
    }
  };

  const handleBiometric = async () => {
    const ok = await biometrics.authenticate("Sign in to Kemchuta Homes");
    if (ok) router.replace("/(tabs)/dashboard" as any);
    else Alert.alert("Failed", "Please sign in with your password.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.patternWrap} pointerEvents="none">
        <DotPattern width={420} height={300} opacity={0.08} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView style={styles.brandBlock}>
          <View style={styles.logoRing}>
            <LinearGradient colors={Gradients.purple} style={styles.logoGrad}>
              <MaterialIcons name="real-estate-agent" size={34} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Kemchuta Homes</Text>
          <View style={styles.tagRow}>
            <View style={styles.tagDot} />
            <Text style={styles.tagline}>Real Estate</Text>
            <View style={styles.tagDot} />
            <Text style={styles.tagline}>Earn Commissions</Text>
          </View>
        </FadeInView>

        <FadeInView delay={120}>
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeX }] }]}
          >
            <Text style={styles.cardTitle}>Realtor Sign In</Text>
            <Text style={styles.cardSub}>
              Access your dashboard and earnings
            </Text>

            {loginError ? (
              <View style={styles.errBanner}>
                <View style={styles.errBannerIcon}>
                  <MaterialIcons
                    name="error-outline"
                    size={20}
                    color={Colors.error}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.errBannerTitle}>Sign in failed</Text>
                  <Text style={styles.errBannerMsg}>{loginError}</Text>
                </View>
                <Pressable
                  onPress={() => setLoginError(null)}
                  hitSlop={10}
                >
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={Colors.error}
                  />
                </Pressable>
              </View>
            ) : null}

            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              error={errors.email}
              required
              leftIcon={
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={Colors.textMuted}
                />
              }
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry={!showPass}
              textContentType="password"
              error={errors.password}
              required
              leftIcon={
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={Colors.textMuted}
                />
              }
              rightIcon={
                <MaterialIcons
                  name={showPass ? "visibility-off" : "visibility"}
                  size={20}
                  color={Colors.textMuted}
                />
              }
              onRightIconPress={() => setShowPass((v) => !v)}
            />

            <Pressable
              onPress={() =>
                router.push("/(auth)/forgot-password?role=realtor" as any)
              }
              style={styles.forgotRow}
              hitSlop={6}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Button
              label={isLoading ? "Signing in..." : "Sign In"}
              onPress={handleSubmit}
              loading={isLoading}
              variant="primary"
              fullWidth
              size="lg"
            />

            {biometrics.isAvailable && biometrics.isEnabled ? (
              <Pressable onPress={handleBiometric} style={styles.bioRow}>
                <MaterialIcons
                  name={
                    biometrics.biometricType === "faceId"
                      ? "face"
                      : "fingerprint"
                  }
                  size={20}
                  color={Colors.brand}
                />
                <Text style={styles.bioLabel}>
                  {biometrics.biometricType === "faceId"
                    ? "Use Face ID"
                    : "Use Fingerprint"}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </FadeInView>

        <FadeInView delay={220}>
          <Pressable
            onPress={() => router.push("/(auth)/realtor-signup" as any)}
            style={styles.registerCard}
          >
            <View style={styles.registerIconWrap}>
              <MaterialIcons name="person-add-alt" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.registerLabel}>New to KHL?</Text>
              <Text style={styles.registerSub}>
                Register as a Realtor and start earning
              </Text>
            </View>
            <MaterialIcons name="arrow-forward" size={22} color="#fff" />
          </Pressable>

          <View style={styles.altRow}>
            <Pressable
              onPress={() => router.push("/(auth)/client-login" as any)}
              style={styles.altChip}
            >
              <MaterialIcons
                name="apartment"
                size={15}
                color="rgba(255,255,255,0.65)"
              />
              <Text style={styles.altLink}>Client Portal</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/admin-login" as any)}
              style={styles.altChip}
            >
              <MaterialIcons
                name="admin-panel-settings"
                size={15}
                color="rgba(255,255,255,0.65)"
              />
              <Text style={styles.altLink}>Admin</Text>
            </Pressable>
          </View>
        </FadeInView>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.brand },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  patternWrap: { position: "absolute", top: 0, right: 0 },

  brandBlock: { alignItems: "center", marginBottom: 22 },
  logoRing: { marginBottom: 12, ...Shadow.lg },
  logoGrad: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
  },
  appName: {
    ...Typography.h2,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 8,
  },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accentLight,
  },
  tagline: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: Radius["2xl"],
    padding: 24,
    ...Shadow.lg,
  },
  cardTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 4 },
  cardSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  errBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.errorBg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errBannerIcon: { marginTop: 1 },
  errBannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.error,
    marginBottom: 2,
  },
  errBannerMsg: {
    fontSize: 12,
    color: Colors.error,
    lineHeight: 16,
    opacity: 0.85,
  },

  forgotRow: { alignSelf: "flex-end", marginBottom: 16, marginTop: -4 },
  forgotText: { ...Typography.caption, color: Colors.brand, fontWeight: "700" },

  bioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  bioLabel: { ...Typography.caption, color: Colors.brand, fontWeight: "700" },

  registerCard: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  registerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  registerLabel: {
    ...Typography.label,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 2,
  },
  registerSub: { ...Typography.caption, color: "rgba(255,255,255,0.7)" },

  altRow: { flexDirection: "row", justifyContent: "center", gap: 10 },
  altChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  altLink: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "700",
  },
});
