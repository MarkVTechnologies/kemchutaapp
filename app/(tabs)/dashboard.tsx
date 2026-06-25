// ─────────────────────────────────────────────────────────────────────────────
// Realtor Dashboard — real backend schema: flat profile + referral data
// GET /api/realtors/dashboard returns:
//   { firstName, lastName, name, avatar, downlines, recruitedBy, referralCode, referralLink }
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { InlineLoader } from "@/components/ui/AppLoader";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

// ── Real API response shape ───────────────────────────────────────────────────
interface DashboardResponse {
  firstName: string;
  lastName: string;
  name: string;
  avatar: string | null;
  downlines: number;
  recruitedBy: string;
  referralCode: string;
  referralLink: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: dash, isLoading, isError, error, refetch, isRefetching } =
    useQuery({
      queryKey: ["realtor-dashboard"],
      queryFn: () => api.get<DashboardResponse>(API.realtors.dashboard),
    });

  const handleShare = async () => {
    if (!dash) return;
    try {
      await Share.share({
        message: `Join Kemchuta Homes — premium land investment. Use my referral code: ${dash.referralCode}. ${dash.referralLink}`.trim(),
      });
    } catch {}
  };

  if (isLoading) return <InlineLoader message="Loading dashboard..." />;

  if (isError || !dash) {
    const axErr = error as any;
    const status = axErr?.response?.status;
    const serverMsg = axErr?.response?.data?.message ?? axErr?.response?.data?.error;

    let errIcon: keyof typeof MaterialIcons.glyphMap = "wifi-off";
    let errHeading = "Dashboard unavailable";
    let errDetail = "Something went wrong. Pull down to retry.";

    if (status === 401 || status === 403) {
      errIcon = "lock-outline";
      errHeading = "Session expired";
      errDetail = "Please sign out from Profile and sign back in.";
    } else if (status === 404) {
      errIcon = "cloud-off";
      errHeading = "Endpoint not found";
      errDetail = serverMsg ?? "The dashboard API returned 404.";
    } else if (status && status >= 500) {
      errIcon = "error-outline";
      errHeading = "Server error";
      errDetail = serverMsg ?? "The server returned an error. Try again later.";
    } else if (axErr?.message === "Network Error" || axErr?.code === "ECONNABORTED") {
      errIcon = "wifi-off";
      errHeading = "No connection";
      errDetail = "Check your internet and try again.";
    } else if (serverMsg) {
      errDetail = serverMsg;
    }

    return (
      <View style={styles.errWrap}>
        <View style={styles.errCard}>
          <LinearGradient colors={[Colors.errorBg, "#FFF5F5"]} style={styles.errIconCircle}>
            <MaterialIcons name={errIcon} size={36} color={Colors.error} />
          </LinearGradient>
          <Text style={styles.errHeading}>{errHeading}</Text>
          <Text style={styles.errBody}>{errDetail}</Text>
          {status ? <Text style={styles.errStatus}>HTTP {status}</Text> : null}
          <Pressable onPress={() => refetch()} style={styles.errRetryBtn}>
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.errRetryText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand} />
        }
      >
        {/* ── Hero header ──────────────────────────────────────────────── */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.patternWrap} pointerEvents="none">
            <DotPattern width={420} height={280} opacity={0.08} />
          </View>

          <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
            <FadeInView>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{dash.name}</Text>

              {dash.recruitedBy ? (
                <View style={styles.recruiterRow}>
                  <MaterialIcons name="person" size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.recruiterText}>Invited by {dash.recruitedBy}</Text>
                </View>
              ) : null}

              {/* Referral code chip */}
              <Pressable onPress={handleShare} style={styles.referralChip}>
                <MaterialIcons name="share" size={14} color={Colors.accentLight} />
                <Text style={styles.referralCode}>{dash.referralCode}</Text>
                <Text style={styles.referralTap}>Tap to share</Text>
              </Pressable>
            </FadeInView>

            {/* ── Stats row ────────────────────────────────────────────── */}
            <FadeInView delay={80}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <MaterialIcons name="groups" size={16} color="rgba(255,255,255,0.55)" />
                  <Text style={styles.statValue}>{dash.downlines}</Text>
                  <Text style={styles.statLabel}>DOWNLINE</Text>
                </View>
                <View style={[styles.statCard, styles.statCardMid]}>
                  <MaterialIcons name="verified" size={16} color="rgba(255,255,255,0.55)" />
                  <Text style={[styles.statValue, { fontSize: 14, letterSpacing: 0.5 }]}>
                    {dash.referralCode}
                  </Text>
                  <Text style={styles.statLabel}>REFERRAL CODE</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialIcons name="person" size={16} color="rgba(255,255,255,0.55)" />
                  <Text
                    style={[styles.statValue, { fontSize: 12 }]}
                    numberOfLines={1}
                  >
                    {dash.recruitedBy}
                  </Text>
                  <Text style={styles.statLabel}>INVITED BY</Text>
                </View>
              </View>
            </FadeInView>
          </View>
        </View>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <FadeInView delay={120}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <QuickAction
                icon="account-balance-wallet"
                label="Earnings"
                sub="Commissions & payouts"
                onPress={() => router.push("/(tabs)/earnings" as any)}
              />
              <QuickAction
                icon="groups"
                label="My Recruits"
                sub="Your downline network"
                onPress={() => router.push("/(tabs)/recruits" as any)}
              />
              <QuickAction
                icon="emoji-events"
                label="Leaderboard"
                sub="Top earners & recruiters"
                onPress={() => router.push("/leaderboard" as any)}
              />
              <QuickAction
                icon="share"
                label="Share Referral"
                sub={`Code: ${dash.referralCode}`}
                onPress={handleShare}
              />
            </View>
          </View>
        </FadeInView>

        {/* ── Referral link card ───────────────────────────────────────── */}
        <FadeInView delay={160}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Referral Link</Text>
            <Pressable onPress={handleShare} style={[styles.referralCard, Shadow.card]}>
              <View style={styles.referralCardIcon}>
                <MaterialIcons name="link" size={22} color={Colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralCardUrl} numberOfLines={2}>
                  {dash.referralLink}
                </Text>
                <Text style={styles.referralCardHint}>
                  Tap to share · earn commissions for every referral
                </Text>
              </View>
              <MaterialIcons name="share" size={20} color={Colors.brand} />
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionCard, Shadow.card]}>
      <View style={styles.actionIconWrap}>
        <MaterialIcons name={icon} size={22} color={Colors.brand} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSub} numberOfLines={1}>{sub}</Text>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // ── Error state ──────────────────────────────────────────────────────────────
  errWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background, padding: 24 },
  errCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    ...Shadow.card,
  },
  errIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  errHeading: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  errBody: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 22 },
  errStatus: { fontSize: 10, fontWeight: "700", color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 16, textTransform: "uppercase" },
  errRetryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.brand, paddingHorizontal: 26, paddingVertical: 13, borderRadius: Radius.full },
  errRetryText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // ── Header ───────────────────────────────────────────────────────────────────
  headerWrap: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 20, paddingBottom: 28 },

  greeting: { ...Typography.bodySm, color: "rgba(255,255,255,0.75)", marginBottom: 2 },
  name: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 8 },

  recruiterRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  recruiterText: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "600" },

  referralChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 22,
  },
  referralCode: { fontSize: 12, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  referralTap: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600" },

  // ── Stats row ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.xl,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statCardMid: { flex: 1.2 },
  statValue: { fontSize: 18, fontWeight: "900", color: "#fff", textAlign: "center" },
  statLabel: { fontSize: 8, fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: 1.2, textAlign: "center" },

  // ── Sections ──────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "800", marginBottom: 12 },

  // ── Quick actions ─────────────────────────────────────────────────────────────
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: { width: "47.5%", backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 14 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.brand50, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  actionLabel: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary, marginBottom: 2 },
  actionSub: { ...Typography.caption, color: Colors.textSecondary },

  // ── Referral link card ────────────────────────────────────────────────────────
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
  },
  referralCardIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.brand50, alignItems: "center", justifyContent: "center" },
  referralCardUrl: { ...Typography.caption, color: Colors.brand, fontWeight: "700", marginBottom: 4 },
  referralCardHint: { ...Typography.caption, color: Colors.textMuted },
});
