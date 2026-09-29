// ─────────────────────────────────────────────────────────────────────────────
// Client Profile — wired settings, biometric quick-login, notifications, logout
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { TERMS_URL, PRIVACY_URL, DELETE_ACCOUNT_URL } from "@/constants/links";
import { useBiometrics } from "@/hooks/useBiometrics";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

// Swap for your real published URLs.

export default function ClientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useAuthStore((s) => s.clientUser);
  const clientLogout = useAuthStore((s) => s.clientLogout);
  const biometrics = useBiometrics();
  const [biometricToggle, setBiometricToggle] = useState(false);

  useEffect(() => {
    biometrics.checkSupport();
  }, []);

  useEffect(() => {
    setBiometricToggle(biometrics.isEnabled);
  }, [biometrics.isEnabled]);

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      const ok = await biometrics.enableBiometric();
      setBiometricToggle(ok);
    } else {
      await biometrics.disableBiometric();
      setBiometricToggle(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clientLogout();
          router.replace("/(auth)/client-login" as any);
        },
      },
    ]);
  };

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Couldn't Open", "Unable to open the link right now.");
    }
  };

  const initials =
    `${client?.firstName?.[0] ?? ""}${client?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.patternWrap} pointerEvents="none">
            <DotPattern width={420} height={220} opacity={0.08} />
          </View>

          <View style={[styles.headerContent, { paddingTop: insets.top + 22 }]}>
            <LinearGradient
              colors={[Colors.brand400, Colors.brand700]}
              style={styles.avatar}
            >
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
            <Text style={styles.name}>
              {client?.firstName} {client?.lastName}
            </Text>
            <Text style={styles.email}>{client?.email}</Text>
            <View style={styles.rolePill}>
              <MaterialIcons name="apartment" size={12} color="#fff" />
              <Text style={styles.roleText}>CLIENT</Text>
            </View>
          </View>
        </View>

        <FadeInView delay={80}>
          <SectionTitle>Account</SectionTitle>
          <View style={styles.group}>
            <Row
              icon="person-outline"
              label="Edit Profile"
              onPress={() =>
                router.push("/settings/client-edit-profile" as any)
              }
            />
            <Row icon="phone" label="Phone" value={client?.phone ?? "—"} />
            <Row
              icon="notifications-none"
              label="Notifications"
              onPress={() => router.push("/notification" as any)}
              last
            />
          </View>
        </FadeInView>

        <FadeInView delay={120}>
          <SectionTitle>Activity</SectionTitle>
          <View style={styles.group}>
            <Row
              icon="landscape"
              label="My Plots"
              onPress={() => router.push("/(client)/subscriptions" as any)}
            />
            <Row
              icon="folder-open"
              label="Documents"
              onPress={() => router.push("/(client)/documents" as any)}
              last
            />
          </View>
        </FadeInView>

        <FadeInView delay={160}>
          <SectionTitle>Security</SectionTitle>
          <View style={styles.group}>
            {biometrics.isAvailable ? (
              <Row
                icon={
                  biometrics.biometricType === "faceId" ? "face" : "fingerprint"
                }
                label={
                  biometrics.biometricType === "faceId"
                    ? "Face ID Login"
                    : "Fingerprint Login"
                }
                rightElement={
                  <Switch
                    value={biometricToggle}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ true: Colors.brand, false: Colors.border }}
                    thumbColor={Colors.surface}
                  />
                }
              />
            ) : null}
            <Row
              icon="lock-outline"
              label="Change Password"
              onPress={() =>
                router.push("/settings/client-change-password" as any)
              }
              last
            />
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <SectionTitle>Legal</SectionTitle>
          <View style={styles.group}>
            <Row
              icon="article"
              label="Terms of Service"
              onPress={() => openUrl(TERMS_URL)}
            />
            <Row
              icon="privacy-tip"
              label="Privacy Policy"
              onPress={() => openUrl(PRIVACY_URL)}
            />
            <Row
              icon="delete-outline"
              label="Delete Account"
              onPress={() => openUrl(DELETE_ACCOUNT_URL)}
              last
            />
          </View>
        </FadeInView>

        <FadeInView delay={240}>
          <Pressable onPress={handleLogout} style={styles.signOutBtn}>
            <MaterialIcons name="logout" size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
          <Text style={styles.version}>
            Kemchuta Homes v{Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.sectionTitle}>{String(children).toUpperCase()}</Text>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  rightElement,
  last,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, !last ? styles.rowBorder : null]}
    >
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={20} color={Colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowSub}>{value}</Text> : null}
      </View>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={Colors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    ...Shadow.lg,
  },
  initials: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 32,
    letterSpacing: 1,
  },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 14 },
  email: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 2,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  group: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    ...Shadow.card,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  rowSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.xl,
  },
  signOutText: {
    color: Colors.error,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  version: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
  },
});
