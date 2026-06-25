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
import { useRouter } from "expo-router";
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

export default function AdminLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adminLogin, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const shakeX = useRef(new Animated.Value(0)).current;

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
    if (!email.trim() || !password) {
      setError("Both fields are required");
      shake();
      return;
    }
    try {
      await adminLogin(email.trim().toLowerCase(), password);
      router.replace("/(admin)/dashboard" as any);
    } catch (err: unknown) {
      shake();
      setError(err instanceof Error ? err.message : "Invalid credentials");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={Gradients.midnight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.patternWrap} pointerEvents="none">
        <DotPattern width={400} height={300} opacity={0.07} />
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

        <FadeInView style={styles.brandArea}>
          <View style={styles.logoOuter}>
            <LinearGradient colors={Gradients.purple} style={styles.logoGrad}>
              <MaterialIcons
                name="admin-panel-settings"
                size={34}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <Text style={styles.adminBadge}>ADMIN ACCESS</Text>
          <Text style={styles.heading}>Operations Portal</Text>
          <Text style={styles.subheading}>Kemchuta Homes Ltd</Text>
        </FadeInView>

        <FadeInView delay={120}>
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeX }] }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.secureDot} />
              <Text style={styles.cardHeaderText}>SECURE LOGIN</Text>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <MaterialIcons
                  name="error-outline"
                  size={18}
                  color={Colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Admin Email"
              placeholder="admin@kemchutahomesltd.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
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
              placeholder="Enter admin password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError("");
              }}
              secureTextEntry={!showPass}
              textContentType="password"
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
                router.push("/(auth)/forgot-password?role=admin" as any)
              }
              style={styles.forgotRow}
              hitSlop={6}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Button
              label={isLoading ? "Verifying..." : "Sign In to Admin Panel"}
              onPress={handleSubmit}
              loading={isLoading}
              variant="primary"
              fullWidth
              size="lg"
            />
          </Animated.View>
        </FadeInView>

        <FadeInView delay={220} style={styles.noticeRow}>
          <MaterialIcons
            name="shield"
            size={14}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={styles.noticeText}>
            Unauthorised access attempts are logged and monitored
          </Text>
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

  brandArea: { alignItems: "center", marginBottom: 28 },
  logoOuter: { marginBottom: 14, ...Shadow.lg },
  logoGrad: {
    width: 82,
    height: 82,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
  },
  adminBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 5,
    color: Colors.accent,
    marginBottom: 6,
  },
  heading: { ...Typography.h2, color: "#fff", marginBottom: 4 },
  subheading: { ...Typography.caption, color: "rgba(255,255,255,0.35)" },

  card: {
    backgroundColor: "#fff",
    borderRadius: Radius["2xl"],
    padding: 24,
    ...Shadow.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  secureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  cardHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    color: Colors.textMuted,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { ...Typography.bodySm, color: Colors.error, flex: 1 },

  forgotRow: { alignSelf: "flex-end", marginBottom: 16, marginTop: -4 },
  forgotText: { ...Typography.caption, color: Colors.brand, fontWeight: "700" },

  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  noticeText: { ...Typography.caption, color: "rgba(255,255,255,0.3)" },
});
