// ─────────────────────────────────────────────────────────────────────────────
// Realtor / Admin Profile & Settings — premium redesign
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { TERMS_URL, PRIVACY_URL, DELETE_ACCOUNT_URL } from "@/constants/links";
import { useBiometrics } from "@/hooks/useBiometrics";
import { DotPattern } from "@/components/ui/DotPattern";
import { FadeInView } from "@/components/ui/FadeInView";
import {
  Colors,
  Gradients,
  Typography,
  Spacing,
  Radius,
  Shadow,
} from "@/constants/theme";


// ── Minimal list row ─────────────────────────────────────────────────────────
// flexDirection:"row" lives on a plain View (not the Pressable) because inside
// Animated.View (FadeInView) on Android, Pressable function-styles don't apply
// flexDirection correctly — only plain Views are reliable.
function ListRow({
  icon,
  label,
  onPress,
  trailing,
  last = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && onPress && styles.rowPressed,
      ]}
    >
      <View style={styles.rowInner}>
        <MaterialIcons name={icon} size={20} color={Colors.brand} />
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        {trailing ??
          (onPress && (
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={Colors.textMuted}
            />
          ))}
      </View>
    </Pressable>
  );
}

// ── Group card — two-layer for correct Android shadow + clip ───────────────────
function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.cardOuter, Shadow.card]}>
      <View style={styles.cardInner}>{children}</View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, role, logout } = useAuthStore();
  const biometrics = useBiometrics();
  const [biometricOn, setBiometricOn] = useState(false);

  useEffect(() => {
    biometrics.checkSupport();
  }, []);
  useEffect(() => {
    setBiometricOn(biometrics.isEnabled);
  }, [biometrics.isEnabled]);

  const handleBiometricToggle = async (val: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    if (val) {
      const ok = await biometrics.enableBiometric();
      setBiometricOn(ok);
    } else {
      await biometrics.disableBiometric();
      setBiometricOn(false);
    }
  };

  const handleLogout = () =>
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace(
            role === "admin"
              ? "/(auth)/admin-login"
              : "/(auth)/realtor-login"
          );
        },
      },
    ]);

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Couldn't Open", "Unable to open the link.");
    }
  };

  const referralCode = (user as any)?.referralCode as string | undefined;

  const handleCopyReferral = () => {
    if (!referralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert("Referral Code", referralCode, [{ text: "Done" }]);
  };

  const isAdmin = role === "admin";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
      "?"
    : "?";
  const avatarUrl = user?.avatar;

  // ── Guest / unauthenticated state ────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.root, styles.guestRoot]}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.guestHero}
        >
          <View style={styles.guestAvatarWrap}>
            <MaterialIcons name="person-outline" size={52} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.guestTitle}>Not signed in</Text>
          <Text style={styles.guestSub}>Sign in to access your profile and settings</Text>
        </LinearGradient>

        <View style={styles.guestBody}>
          <Pressable
            onPress={() => router.push("/(auth)/realtor-login" as any)}
            style={styles.guestBtn}
          >
            <MaterialIcons name="verified" size={20} color="#fff" />
            <Text style={styles.guestBtnText}>Realtor Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(auth)/client-login" as any)}
            style={[styles.guestBtn, styles.guestBtnSecondary]}
          >
            <MaterialIcons name="apartment" size={20} color={Colors.brand} />
            <Text style={[styles.guestBtnText, { color: Colors.brand }]}>Client Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(auth)/admin-login" as any)}
            style={styles.guestAdminLink}
          >
            <MaterialIcons name="admin-panel-settings" size={14} color={Colors.textMuted} />
            <Text style={styles.guestAdminLinkText}>Admin Access</Text>
          </Pressable>

          <View style={styles.guestLegalRow}>
            <Pressable onPress={() => openUrl(TERMS_URL)} style={styles.guestLink}>
              <Text style={styles.guestLinkText}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.guestLinkDot}>·</Text>
            <Pressable onPress={() => openUrl(PRIVACY_URL)} style={styles.guestLink}>
              <Text style={styles.guestLinkText}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.version}>Kemchuta Homes · v1.0.0</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroPattern} pointerEvents="none">
            <DotPattern width={460} height={340} opacity={0.1} gap={26} />
          </View>

          <FadeInView
            offset={14}
            style={[styles.heroContent, { paddingTop: insets.top + 32 }]}
          >
            {/* Avatar — outer holds glow shadow, inner clips + bordered ring */}
            <View style={styles.avatarShadow}>
              <View style={styles.avatarRing}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImg}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.heroName}>
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </Text>
            {user?.email ? (
              <Text style={styles.heroEmail}>{user.email}</Text>
            ) : null}

            <View style={styles.rolePill}>
              <MaterialIcons
                name={isAdmin ? "admin-panel-settings" : "verified"}
                size={12}
                color="#fff"
              />
              <Text style={styles.roleText}>
                {isAdmin ? "ADMINISTRATOR" : "REALTOR"}
              </Text>
            </View>

            {/* Referral chip inside hero (realtors) */}
            {!isAdmin && referralCode ? (
              <Pressable
                onPress={handleCopyReferral}
                style={({ pressed }) => [
                  styles.refChip,
                  pressed && styles.refChipPressed,
                ]}
              >
                <View style={styles.refChipRow}>
                  <MaterialIcons name="qr-code-2" size={16} color="#fff" />
                  <Text style={styles.refChipCode}>{referralCode}</Text>
                  <View style={styles.refChipDivider} />
                  <MaterialIcons name="content-copy" size={13} color="#fff" />
                  <Text style={styles.refChipCopy}>Copy</Text>
                </View>
              </Pressable>
            ) : null}
          </FadeInView>
        </View>

        {/* ── Stats strip — floats over the hero bottom edge ──────────────── */}
        <FadeInView delay={80} style={styles.statsWrap}>
          <View style={[styles.statsOuter, Shadow.card]}>
            <View style={styles.statsInner}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>REFERRAL CODE</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {referralCode ?? "—"}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>ROLE</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {isAdmin ? "Admin" : "Realtor"}
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* ── Settings groups ─────────────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Account */}
          {user ? (
            <FadeInView delay={140}>
              <GroupCard>
                <ListRow
                  icon="person-outline"
                  label="Edit Profile"
                  onPress={() => router.push("/settings/edit-profile" as any)}
                />
                <ListRow
                  icon="lock-outline"
                  label="Change Password"
                  onPress={() =>
                    router.push("/settings/change-password" as any)
                  }
                  last={isAdmin}
                />
                {!isAdmin ? (
                  <ListRow
                    icon="account-balance"
                    label="Bank Details"
                    onPress={() => router.push("/settings/bank-details" as any)}
                    last
                  />
                ) : null}
              </GroupCard>
            </FadeInView>
          ) : null}

          {/* Security */}
          {user && biometrics.isAvailable ? (
            <FadeInView delay={200}>
              <GroupCard>
                <ListRow
                  icon={
                    biometrics.biometricType === "faceId"
                      ? "face"
                      : "fingerprint"
                  }
                  label={
                    biometrics.biometricType === "faceId"
                      ? "Face ID"
                      : "Fingerprint Login"
                  }
                  trailing={
                    <Switch
                      value={biometricOn}
                      onValueChange={handleBiometricToggle}
                      trackColor={{ true: Colors.brand, false: Colors.border }}
                      thumbColor={Colors.surface}
                    />
                  }
                  last
                />
              </GroupCard>
            </FadeInView>
          ) : null}

          {/* Preferences */}
          {user ? (
            <FadeInView delay={260}>
              <GroupCard>
                <ListRow
                  icon="notifications-none"
                  label="Notification Preferences"
                  onPress={() =>
                    router.push("/settings/notification-preference" as any)
                  }
                  last
                />
              </GroupCard>
            </FadeInView>
          ) : null}

          {/* Legal */}
          <FadeInView delay={320}>
            <GroupCard>
              <ListRow
                icon="description"
                label="Terms of Service"
                onPress={() => openUrl(TERMS_URL)}
              />
              <ListRow
                icon="privacy-tip"
                label="Privacy Policy"
                onPress={() => openUrl(PRIVACY_URL)}
                last={!user}
              />
              {user ? (
                <ListRow
                  icon="delete-outline"
                  label="Delete Account"
                  onPress={() => openUrl(DELETE_ACCOUNT_URL)}
                  last
                />
              ) : null}
            </GroupCard>
          </FadeInView>

          {/* Sign out — standalone outlined pill */}
          {user ? (
            <FadeInView delay={380}>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.signOut,
                  pressed && styles.signOutPressed,
                ]}
              >
                <View style={styles.signOutRow}>
                  <MaterialIcons name="logout" size={18} color={Colors.error} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </View>
              </Pressable>
            </FadeInView>
          ) : null}

          <Text style={styles.version}>Kemchuta Homes · v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero: {
    overflow: "hidden",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    backgroundColor: Colors.brandDark,
  },
  heroPattern: { position: "absolute", top: -10, right: -10 },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 44,
  },

  // elevation removed — elevated child inside overflow:hidden parent is invisible
  // on Android. The white border ring on avatarRing provides the visual effect.
  avatarShadow: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 16,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.55)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 38, fontWeight: "900", color: "#fff" },

  heroName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  heroEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
    marginBottom: 14,
    textAlign: "center",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },

  refChip: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  refChipPressed: { backgroundColor: "rgba(255,255,255,0.24)" },
  // flexDirection on a plain View — reliable on Android inside Animated.View
  refChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refChipCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.8,
  },
  refChipDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 2,
  },
  refChipCopy: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Stats strip — overlaps hero bottom
  statsWrap: {
    paddingHorizontal: Spacing.lg,
    marginTop: -22,
  },
  statsOuter: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  statsInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
    paddingVertical: 20,
  },
  statCell: { flex: 1, alignItems: "center", paddingHorizontal: 16 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 6,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.brand,
    letterSpacing: 0.3,
  },

  // Body
  body: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, gap: 16 },

  // Group card — two-layer (outer shadow, inner clip)
  cardOuter: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardInner: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 0,
  },

  // Row — padding/border on Pressable, flex layout on inner View
  row: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 17,
    minHeight: 56,
  },
  // Inner View carries flexDirection — plain Views always apply it correctly
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  rowPressed: { backgroundColor: Colors.ink50 },
  rowLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: "500",
  },

  // Sign out — border/shape on Pressable, flex on inner View
  signOut: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.full,
    paddingVertical: 16,
    marginTop: 6,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutPressed: { backgroundColor: Colors.errorBg },
  signOutText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.error,
  },

  version: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xl,
  },

  // Guest state
  guestRoot: { justifyContent: "space-between" },
  guestHero: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  guestAvatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  guestSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 20,
  },
  guestBody: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 32,
    gap: 14,
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: 16,
  },
  guestBtnSecondary: {
    backgroundColor: Colors.brand50,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  guestAdminLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  guestAdminLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  guestLegalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  guestLinkDot: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  guestLink: {
    paddingVertical: 6,
  },
  guestLinkText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
