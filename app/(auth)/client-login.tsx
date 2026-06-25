import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
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
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

export default function ClientLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ redirect?: string; email?: string }>();
  const { clientLogin, isClientLoading } = useAuthStore();

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const shakeX = useRef(new Animated.Value(0)).current;

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      errs.email = "Enter a valid email";
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
    try {
      await clientLogin(email.trim().toLowerCase(), password);
      router.replace((params.redirect ?? "/(client)/portal") as any);
    } catch (err: unknown) {
      shake();
      setErrors({
        password: err instanceof Error ? err.message : "Login failed.",
      });
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
        <DotPattern width={400} height={280} opacity={0.06} />
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
            color="rgba(255,255,255,0.55)"
          />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <FadeInView style={styles.headerArea}>
          <View style={styles.logoOuter}>
            <LinearGradient colors={Gradients.purple} style={styles.logoGrad}>
              <MaterialIcons name="apartment" size={34} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.portalBadge}>CLIENT PORTAL</Text>
          <Text style={styles.heading}>Property Investments</Text>
          <Text style={styles.subheading}>
            Track your land. Own your future.
          </Text>
        </FadeInView>

        <FadeInView delay={120}>
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeX }] }]}
          >
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>
              Sign in to view your subscriptions
            </Text>

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
              placeholder="Your password"
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
                router.push("/(auth)/forgot-password?role=client" as any)
              }
              style={styles.forgotRow}
              hitSlop={6}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Button
              label={isClientLoading ? "Signing in..." : "Sign In"}
              onPress={handleSubmit}
              loading={isClientLoading}
              variant="primary"
              fullWidth
              size="lg"
            />

            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divLabel}>New client?</Text>
              <View style={styles.divLine} />
            </View>

            <Button
              label="Create Client Account"
              onPress={() => router.push("/(auth)/client-signup" as any)}
              variant="outline"
              fullWidth
            />
          </Animated.View>
        </FadeInView>

        <FadeInView delay={220}>
          <Pressable
            onPress={() => router.push("/(auth)/realtor-login" as any)}
            style={styles.realtorLink}
          >
            <MaterialIcons
              name="real-estate-agent"
              size={16}
              color={Colors.accent}
            />
            <Text style={styles.realtorText}>Are you a Realtor?</Text>
            <Text style={styles.realtorCta}>Sign In</Text>
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
  backText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },

  headerArea: { alignItems: "center", marginBottom: 24 },
  logoOuter: { marginBottom: 14, ...Shadow.lg },
  logoGrad: {
    width: 82,
    height: 82,
    borderRadius: 22,
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
    fontWeight: "800",
    marginBottom: 4,
  },
  subheading: { ...Typography.caption, color: "rgba(255,255,255,0.35)" },

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

  forgotRow: { alignSelf: "flex-end", marginBottom: 16, marginTop: -4 },
  forgotText: { ...Typography.caption, color: Colors.brand, fontWeight: "700" },

  divRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divLabel: { ...Typography.caption, color: Colors.textMuted },

  realtorLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  realtorText: { ...Typography.bodySm, color: "rgba(255,255,255,0.4)" },
  realtorCta: { ...Typography.bodySm, color: Colors.accent, fontWeight: "800" },
});
