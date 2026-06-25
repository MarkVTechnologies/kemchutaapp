// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard — GET /api/realtors/leaderboard
// Two boards: Top Earners (net commissions) | Top Recruiters (downlines)
// Podium for ranks 1–3 · ranked list for 4–10 · pinned "Your Position" card
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface EarnerEntry {
  rank: number;
  realtorId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  referralCode: string;
  totalNet: number;
  commissionCount: number;
}

interface RecruiterEntry {
  rank: number;
  realtorId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  referralCode: string;
  downlineCount: number;
}

interface MyStats {
  earningsRank: number;
  totalNet: number;
  commissionCount: number;
  recruitRank: number;
  downlineCount: number;
}

interface LeaderboardResp {
  topEarners: EarnerEntry[];
  topRecruiters: RecruiterEntry[];
  myStats: MyStats;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNairaCompact = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
};

const initials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

// Show "John D." — first name + last initial only
const displayName = (first: string, last: string) =>
  `${first} ${last?.[0] ?? ""}.`;

// Rank-based colours (purple palette)
const RANK_COLORS = ["#700CEB", "#A35FF4", "#C68BFF"] as const;
const RANK_LABELS = ["1st", "2nd", "3rd"] as const;

type Tab = "earnings" | "recruits";

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("earnings");

  const { data, isLoading, isError, refetch, isRefetching } =
    useQuery<LeaderboardResp>({
      queryKey: ["leaderboard"],
      queryFn: () => api.get<LeaderboardResp>(API.realtors.leaderboard),
      staleTime: 1000 * 60 * 5, // treat as fresh for 5 min
    });

  const board =
    tab === "earnings" ? data?.topEarners ?? [] : data?.topRecruiters ?? [];
  const podium = board.slice(0, 3);
  const rest = board.slice(3);

  const myRank =
    tab === "earnings" ? data?.myStats.earningsRank : data?.myStats.recruitRank;
  const myValue =
    tab === "earnings"
      ? fmtNairaCompact(data?.myStats.totalNet ?? 0)
      : `${data?.myStats.downlineCount ?? 0} recruits`;
  const myMetric =
    tab === "earnings"
      ? `${data?.myStats.commissionCount ?? 0} commissions`
      : `${data?.myStats.downlineCount ?? 0} direct recruits`;

  return (
    <View style={styles.root}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={340} opacity={0.07} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
          {/* Nav row */}
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={8}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Tab switcher */}
          <FadeInView delay={60}>
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => setTab("earnings")}
                style={[styles.tabBtn, tab === "earnings" ? styles.tabBtnActive : null]}
              >
                <MaterialIcons
                  name="account-balance-wallet"
                  size={15}
                  color={tab === "earnings" ? Colors.brand : "rgba(255,255,255,0.65)"}
                />
                <Text
                  style={[
                    styles.tabText,
                    tab === "earnings" ? styles.tabTextActive : null,
                  ]}
                >
                  Top Earners
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("recruits")}
                style={[styles.tabBtn, tab === "recruits" ? styles.tabBtnActive : null]}
              >
                <MaterialIcons
                  name="groups"
                  size={15}
                  color={tab === "recruits" ? Colors.brand : "rgba(255,255,255,0.65)"}
                />
                <Text
                  style={[
                    styles.tabText,
                    tab === "recruits" ? styles.tabTextActive : null,
                  ]}
                >
                  Top Recruiters
                </Text>
              </Pressable>
            </View>
          </FadeInView>

          {/* Podium */}
          {!isLoading && !isError && podium.length > 0 && (
            <FadeInView delay={120}>
              <View style={styles.podium}>
                {/* 2nd place — left */}
                <PodiumSlot
                  entry={podium[1]}
                  tab={tab}
                  height={88}
                  rankColor={RANK_COLORS[1]}
                  rankLabel={RANK_LABELS[1]}
                />
                {/* 1st place — center, tallest */}
                <PodiumSlot
                  entry={podium[0]}
                  tab={tab}
                  height={116}
                  rankColor={RANK_COLORS[0]}
                  rankLabel={RANK_LABELS[0]}
                  crown
                />
                {/* 3rd place — right */}
                <PodiumSlot
                  entry={podium[2]}
                  tab={tab}
                  height={68}
                  rankColor={RANK_COLORS[2]}
                  rankLabel={RANK_LABELS[2]}
                />
              </View>
            </FadeInView>
          )}
        </View>
      </View>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <InlineLoader message="Loading leaderboard..." />
      ) : isError ? (
        <View style={styles.errWrap}>
          <MaterialIcons name="wifi-off" size={36} color={Colors.textMuted} />
          <Text style={styles.errText}>Couldn't load leaderboard.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 12,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 120,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.brand}
              />
            }
          >
            {rest.length === 0 && board.length <= 3 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  Only the top 3 are ranked so far. Keep going!
                </Text>
              </View>
            ) : (
              rest.map((entry) => (
                <RankRow key={entry.realtorId} entry={entry} tab={tab} />
              ))
            )}
          </ScrollView>

          {/* ── Pinned "Your Position" card ─────────────────────────────────── */}
          <View
            style={[
              styles.myPositionWrap,
              { paddingBottom: insets.bottom + 12 },
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.0)", "rgba(247,247,251,0.95)"]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <View style={[styles.myPositionCard, Shadow.card]}>
              <View style={styles.myRankBadge}>
                <Text style={styles.myRankNum}>#{myRank}</Text>
                <Text style={styles.myRankLabel}>Your Rank</Text>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.myPositionValue}>{myValue}</Text>
                <Text style={styles.myPositionMetric}>{myMetric}</Text>
              </View>
              <View style={styles.myPositionIcon}>
                <MaterialIcons
                  name={tab === "earnings" ? "account-balance-wallet" : "groups"}
                  size={20}
                  color={Colors.brand}
                />
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ── Podium slot ───────────────────────────────────────────────────────────────

function PodiumSlot({
  entry,
  tab,
  height,
  rankColor,
  rankLabel,
  crown = false,
}: {
  entry?: EarnerEntry | RecruiterEntry;
  tab: Tab;
  height: number;
  rankColor: string;
  rankLabel: string;
  crown?: boolean;
}) {
  if (!entry) return <View style={{ flex: 1 }} />;

  const value =
    tab === "earnings"
      ? fmtNairaCompact((entry as EarnerEntry).totalNet)
      : `${(entry as RecruiterEntry).downlineCount}`;

  return (
    <View style={styles.podiumSlot}>
      {crown && (
        <MaterialIcons
          name="emoji-events"
          size={20}
          color={Colors.accentLight}
          style={{ marginBottom: 4 }}
        />
      )}
      {/* Avatar circle */}
      <View style={[styles.podiumAvatar, { borderColor: rankColor }]}>
        <Text style={styles.podiumAvatarText}>
          {initials(entry.firstName, entry.lastName)}
        </Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {displayName(entry.firstName, entry.lastName)}
      </Text>
      <Text style={[styles.podiumValue, { color: rankColor }]}>{value}</Text>
      {/* Pillar */}
      <View style={[styles.podiumPillar, { height, backgroundColor: rankColor }]}>
        <Text style={styles.podiumRankLabel}>{rankLabel}</Text>
      </View>
    </View>
  );
}

// ── Rank row (positions 4–10) ─────────────────────────────────────────────────

function RankRow({
  entry,
  tab,
}: {
  entry: EarnerEntry | RecruiterEntry;
  tab: Tab;
}) {
  const value =
    tab === "earnings"
      ? fmtNairaCompact((entry as EarnerEntry).totalNet)
      : `${(entry as RecruiterEntry).downlineCount} recruits`;

  const sub =
    tab === "earnings"
      ? `${(entry as EarnerEntry).commissionCount} commissions`
      : `${(entry as RecruiterEntry).referralCode}`;

  return (
    <View style={[styles.rankRow, Shadow.sm]}>
      <Text style={styles.rankNum}>#{entry.rank}</Text>
      <View style={styles.rankAvatar}>
        <Text style={styles.rankAvatarText}>
          {initials(entry.firstName, entry.lastName)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rankName}>
          {displayName(entry.firstName, entry.lastName)}
        </Text>
        <Text style={styles.rankSub}>{sub}</Text>
      </View>
      <Text style={styles.rankValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // ── Header ───────────────────────────────────────────────────────────────────
  headerWrap: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 16, paddingBottom: 28 },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  // ── Tab switcher ─────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  tabBtnActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },
  tabTextActive: { color: Colors.brand },

  // ── Podium ───────────────────────────────────────────────────────────────────
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 0,
  },
  podiumSlot: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  podiumAvatarText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
  },
  podiumName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    maxWidth: 90,
  },
  podiumValue: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  podiumPillar: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  podiumRankLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
  },

  // ── Rank rows ─────────────────────────────────────────────────────────────────
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 8,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.textMuted,
    width: 28,
    textAlign: "center",
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  rankAvatarText: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.brand,
  },
  rankName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  rankSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rankValue: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.brand,
  },

  // ── Error / empty ─────────────────────────────────────────────────────────────
  errWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  errText: { ...Typography.body, color: Colors.textSecondary, textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: Radius.full,
  },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  emptyWrap: { paddingTop: 24, alignItems: "center" },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // ── My position card ──────────────────────────────────────────────────────────
  myPositionWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  myPositionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.brand50,
  },
  myRankBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  myRankNum: { fontSize: 16, fontWeight: "900", color: Colors.brand },
  myRankLabel: { fontSize: 9, fontWeight: "700", color: Colors.brand700, letterSpacing: 0.5 },
  myPositionValue: { fontSize: 17, fontWeight: "900", color: Colors.textPrimary },
  myPositionMetric: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  myPositionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
});
