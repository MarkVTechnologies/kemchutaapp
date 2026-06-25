// ─────────────────────────────────────────────────────────────────────────────
// Earnings — Commission wallet summary + filterable ledger
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { CommissionStatus } from "@/types";
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

const formatNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
const formatDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Real API shapes ────────────────────────────────────────────────────────────
// GET /api/commissions/my
interface CommissionRecord {
  _id: string;
  estateName?: string;
  saleAmount: number;
  level: 1 | 2 | 3 | 4;
  percent: number;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  status: "pending" | "approved" | "paid" | "clawedback";
  paidAt?: string | null;
  createdAt: string;
}

interface TotalEntry {
  _id: string; // "pending" | "approved" | "paid" | "clawedback"
  totalNet: number;
  totalGross: number;
  count: number;
}

interface MyCommissionsResp {
  commissions: CommissionRecord[];
  total: number;
  page: number;
  pages: number;
  totals: TotalEntry[];
}

type Filter = "all" | CommissionRecord["status"];
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
  { key: "clawedback", label: "Clawed back" },
];

const STATUS_META: Record<
  CommissionRecord["status"],
  { color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  pending:    { color: Colors.warning,   bg: Colors.warningBg,   icon: "schedule" },
  approved:   { color: Colors.info,      bg: Colors.infoBg,      icon: "thumb-up" },
  paid:       { color: Colors.success,   bg: Colors.successBg,   icon: "check-circle" },
  clawedback: { color: Colors.textMuted, bg: Colors.ink100,      icon: "undo" },
};

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["my-commissions"],
    queryFn: () => api.get<MyCommissionsResp>(API.commissions.my),
  });

  // Derive wallet totals from the aggregated `totals` array
  const totals = data?.totals ?? [];
  const totalEarned  = totals.reduce((s, t) => s + t.totalNet, 0);
  const pendingPayout  = totals.find((t) => t._id === "pending")?.totalNet ?? 0;
  const approvedPayout = totals.find((t) => t._id === "approved")?.totalNet ?? 0;
  const paidToDate     = totals.find((t) => t._id === "paid")?.totalNet ?? 0;

  const allCommissions = data?.commissions ?? [];

  const commissions = useMemo(() => {
    return filter === "all"
      ? allCommissions
      : allCommissions.filter((c) => c.status === filter);
  }, [allCommissions, filter]);

  if (isLoading) {
    return <InlineLoader message="Loading earnings..." />;
  }

  if (isError) {
    return (
      <View style={styles.errWrap}>
        <View style={styles.errCard}>
          <LinearGradient
            colors={[Colors.errorBg, "#FFF5F5"]}
            style={styles.errIconCircle}
          >
            <MaterialIcons name="account-balance-wallet" size={36} color={Colors.error} />
          </LinearGradient>
          <Text style={styles.errHeading}>Earnings unavailable</Text>
          <Text style={styles.errBody}>
            We couldn't fetch your commission data. Check your connection and
            try again.
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
      {/* ── Header with wallet card ────────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={300} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
          <FadeInView>
            <Text style={styles.headerTitle}>Earnings</Text>
            <Text style={styles.headerSub}>Your commission wallet</Text>

            <View style={styles.walletCard}>
              <View style={styles.walletTop}>
                <View>
                  <Text style={styles.walletLabel}>TOTAL EARNED (NET)</Text>
                  <Text style={styles.walletValue}>
                    {formatNaira(totalEarned)}
                  </Text>
                </View>
                <View style={styles.walletIcon}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color="rgba(255,255,255,0.55)"
                  />
                </View>
              </View>

              <View style={styles.walletDivider} />

              <View style={styles.walletStats}>
                <View style={styles.walletStat}>
                  <Text style={styles.walletStatLabel}>Pending</Text>
                  <Text style={[styles.walletStatValue, { color: "#FBBF24" }]}>
                    {formatNaira(pendingPayout)}
                  </Text>
                </View>
                <View style={styles.walletStatDivider} />
                <View style={styles.walletStat}>
                  <Text style={styles.walletStatLabel}>Approved</Text>
                  <Text style={[styles.walletStatValue, { color: Colors.accentLight }]}>
                    {formatNaira(approvedPayout)}
                  </Text>
                </View>
                <View style={styles.walletStatDivider} />
                <View style={styles.walletStat}>
                  <Text style={styles.walletStatLabel}>Paid Out</Text>
                  <Text style={[styles.walletStatValue, { color: "#34D399" }]}>
                    {formatNaira(paidToDate)}
                  </Text>
                </View>
              </View>
            </View>
          </FadeInView>
        </View>
      </View>

      {/* ── Filter chips ──────────────────────────────────────────────────── */}
      <View style={styles.filterStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : null,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Commission ledger ─────────────────────────────────────────────── */}
      {commissions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <MaterialIcons
              name="account-balance-wallet"
              size={32}
              color={Colors.brand}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === "all"
              ? "No commissions yet"
              : `No ${filter} commissions`}
          </Text>
          <Text style={styles.emptySub}>
            Commissions appear here as clients subscribe through your referral.
          </Text>
        </View>
      ) : (
        <FlashList
          data={commissions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <CommissionRow commission={item} />}
          estimatedItemSize={88}
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
                {commissions.length}{" "}
                {commissions.length === 1 ? "commission" : "commissions"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Commission row ────────────────────────────────────────────────────────────

function CommissionRow({ commission }: { commission: CommissionRecord }) {
  const meta = STATUS_META[commission.status] ?? STATUS_META.pending;
  const levelLabel = `Level ${commission.level} · ${commission.percent}%`;

  return (
    <View style={[styles.commRow, Shadow.sm]}>
      <View style={[styles.commIconWrap, { backgroundColor: meta.bg }]}>
        <MaterialIcons name={meta.icon} size={20} color={meta.color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.commEstate} numberOfLines={1}>
          {commission.estateName ?? "Commission"}
        </Text>
        <View style={styles.commFooter}>
          <View style={styles.levelTag}>
            <Text style={styles.levelTagText}>{levelLabel}</Text>
          </View>
          <Text style={styles.commDate}>
            {formatDate(commission.paidAt ?? commission.createdAt)}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.commAmount}>{formatNaira(commission.netAmount)}</Text>
        <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>
            {commission.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  errWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    padding: 24,
  },
  errCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    ...Shadow.card,
  },
  errIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  errHeading: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  errBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 22,
  },
  errRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: Radius.full,
  },
  errRetryText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 20, paddingBottom: 28 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  headerSub: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },

  walletCard: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius["2xl"],
    padding: 16,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  walletValue: { fontSize: 28, fontWeight: "900", color: "#fff" },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 14,
  },
  walletStats: { flexDirection: "row", alignItems: "center" },
  walletStat: { flex: 1 },
  walletStatDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 16,
  },
  walletStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    marginBottom: 2,
  },
  walletStatValue: { fontSize: 15, fontWeight: "900" },
  lastPaid: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
    marginTop: 10,
  },

  filterStrip: {
    backgroundColor: Colors.background,
    paddingTop: 14,
    paddingBottom: 2,
  },
  filterRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  chipText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  chipTextActive: { color: "#fff" },

  countRow: { paddingTop: 8, paddingBottom: 4 },
  countText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 6,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  emptySub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  commRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 8,
  },
  commIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  commEstate: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  commClient: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  commFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },
  levelTag: {
    backgroundColor: Colors.brand50,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelTagText: { fontSize: 10, fontWeight: "800", color: Colors.brand700 },
  commDate: { ...Typography.caption, color: Colors.textMuted },
  commAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.brand,
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});
