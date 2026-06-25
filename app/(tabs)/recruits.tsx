// ─────────────────────────────────────────────────────────────────────────────
// Recruits — GET /api/realtors/my-recruits
// Response: { recruits: [...], total: number }
// Recruit fields: _id, firstName, lastName, email, phone, avatar, referralCode, createdAt
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
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

interface RecruitRecord {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  referralCode: string;
  createdAt: string;
}

interface RecruitsResp {
  recruits: RecruitRecord[];
  total: number;
}

const formatDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function RecruitsScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["my-recruits"],
    queryFn: () => api.get<RecruitsResp>(API.realtors.myRecruits),
  });

  const recruits = useMemo(() => data?.recruits ?? [], [data]);
  const total = data?.total ?? 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Join Kemchuta Homes as a realtor and earn commission on every land sale. Contact me to get started!",
      });
    } catch {}
  };

  if (isLoading) return <InlineLoader message="Loading recruits..." />;

  if (isError) {
    return (
      <View style={styles.errWrap}>
        <View style={styles.errCard}>
          <LinearGradient
            colors={[Colors.errorBg, "#FFF5F5"]}
            style={styles.errIconCircle}
          >
            <MaterialIcons name="people-outline" size={36} color={Colors.error} />
          </LinearGradient>
          <Text style={styles.errHeading}>Recruits unavailable</Text>
          <Text style={styles.errBody}>
            We couldn't load your downline data. Check your connection and try
            again.
          </Text>
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={220} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
          <FadeInView>
            <Text style={styles.headerTitle}>My Recruits</Text>
            <Text style={styles.headerSub}>Your direct downline</Text>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <MaterialIcons name="person" size={13} color="rgba(255,255,255,0.65)" />
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Total Recruits</Text>
              </View>
              <Pressable onPress={handleShare} style={styles.shareChip}>
                <MaterialIcons name="share" size={14} color={Colors.accentLight} />
                <Text style={styles.shareText}>Invite</Text>
              </Pressable>
            </View>
          </FadeInView>
        </View>
      </View>

      {/* ── List ──────────────────────────────────────────────────────────────── */}
      {recruits.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="group-add" size={32} color={Colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No recruits yet</Text>
          <Text style={styles.emptySub}>
            Share your referral link to start building your downline and earn
            override commissions.
          </Text>
          <Pressable onPress={handleShare} style={styles.inviteBtn}>
            <MaterialIcons name="share" size={16} color="#fff" />
            <Text style={styles.inviteBtnText}>Share Referral Link</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={recruits}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RecruitCard recruit={item} />}
          estimatedItemSize={80}
          contentContainerStyle={{
            paddingTop: 8,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand}
            />
          }
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {total} direct {total === 1 ? "recruit" : "recruits"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RecruitCard({ recruit }: { recruit: RecruitRecord }) {
  const initials =
    `${recruit.firstName?.[0] ?? ""}${recruit.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <View style={[styles.recruitCard, Shadow.sm]}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.recruitName}>
          {recruit.firstName} {recruit.lastName}
        </Text>
        <Text style={styles.recruitEmail} numberOfLines={1}>
          {recruit.email}
        </Text>
        {recruit.createdAt ? (
          <View style={styles.recruitMeta}>
            <MaterialIcons name="calendar-today" size={11} color={Colors.textMuted} />
            <Text style={styles.recruitMetaText}>Joined {formatDate(recruit.createdAt)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.recruitCodeWrap}>
        <Text style={styles.recruitCode}>{recruit.referralCode}</Text>
        <Text style={styles.recruitCodeLabel}>REF CODE</Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  errWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background, padding: 24 },
  errCard: { backgroundColor: Colors.surface, borderRadius: Radius["2xl"], padding: 28, alignItems: "center", width: "100%", maxWidth: 340, ...Shadow.card },
  errIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  errHeading: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  errBody: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 22 },
  errRetryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.brand, paddingHorizontal: 26, paddingVertical: 13, borderRadius: Radius.full },
  errRetryText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  headerWrap: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  headerSub: { ...Typography.bodySm, color: "rgba(255,255,255,0.75)", marginBottom: 16 },

  statsRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statValue: { fontSize: 13, fontWeight: "900", color: "#fff" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: "700" },
  shareChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  shareText: { fontSize: 12, fontWeight: "800", color: Colors.accentLight },

  countRow: { paddingTop: 8, paddingBottom: 4 },
  countText: { ...Typography.caption, color: Colors.textMuted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 6 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.brand50, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "800" },
  emptySub: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 6 },
  inviteBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.brand, paddingHorizontal: 20, paddingVertical: 11, borderRadius: Radius.full, marginTop: 10 },
  inviteBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  recruitCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 14, marginBottom: 8 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand50, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "900", color: Colors.brand },
  recruitName: { ...Typography.label, color: Colors.textPrimary, fontWeight: "800" },
  recruitEmail: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  recruitMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  recruitMetaText: { ...Typography.caption, color: Colors.textMuted },
  recruitCodeWrap: { alignItems: "flex-end" },
  recruitCode: { fontSize: 11, fontWeight: "900", color: Colors.brand, letterSpacing: 0.5 },
  recruitCodeLabel: { fontSize: 8, fontWeight: "700", color: Colors.textMuted, letterSpacing: 1, marginTop: 2 },
});
