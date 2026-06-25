// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard
// Data sources (same endpoints the web app uses):
//   GET /api/admin/analytics       → KPI cards
//   GET /api/subscriptions?status=pending&limit=8  → pending subs
//   GET /api/commissions?status=approved&limit=8   → commissions to pay
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { InlineLoader } from "@/components/ui/AppLoader";
import { useToast } from "@/components/ui/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

// ── API response types ────────────────────────────────────────────────────────

interface AnalyticsResp {
  realtors: {
    total: number;
    newThisMonth: number;
    newLastMonth: number;
    monthOverMonth: number;
    totalRecruits: number;
  };
  subscriptions: {
    total: number;
    byStatus: { pending: number; reviewed: number; approved: number; rejected: number };
    approvedRevenue: number;
    approvedCount: number;
    avgDealSize: number;
    approvalRate: number;
  };
  inspections: {
    total: number;
    byStatus: { pending: number; confirmed: number; cancelled: number; completed: number };
    upcoming7Days: number;
    inspToSubRate: number;
  };
  estates: { total: number; active: number };
}

interface PendingSub {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  estateName?: string;
  plotType?: string;
  totalAmount: number;
  paymentPlan?: string;
  numberOfPlots?: number;
  createdAt: string;
  referenceNumber?: string;
}

interface SubsListResp {
  subscriptions: PendingSub[];
  total: number;
}

interface CommissionItem {
  _id: string;
  realtorName: string;
  realtorEmail: string;
  estateName?: string;
  netAmount: number;
  level: number;
  percent: number;
  createdAt: string;
  referenceNumber?: string;
}

interface CommissionsListResp {
  commissions: CommissionItem[];
  total: number;
  summary: {
    approvedAmount: number;
  };
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtNaira = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

const fmtCompact = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return fmtNaira(n);
};

const fmtDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Management tiles config ───────────────────────────────────────────────────
const MGMT_TILES: Array<{
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  bg: string;
  color: string;
}> = [
  { label: "Realtors",       icon: "groups",                 route: "/(admin)/realtors",       bg: "#EEE8FF", color: Colors.brand },
  { label: "Estates",        icon: "location-city",          route: "/(admin)/estates",        bg: "#E8F5E9", color: Colors.success },
  { label: "Inspections",    icon: "calendar-today",         route: "/(admin)/inspections",    bg: "#E3F2FD", color: Colors.info },
  { label: "Subscriptions",  icon: "receipt-long",           route: "/(admin)/subscriptions",  bg: "#FFF8E1", color: Colors.warning },
  { label: "Buy2Sell",       icon: "trending-up",            route: "/(admin)/buy2sell",       bg: "#F3E5F5", color: "#9C27B0" },
  { label: "Contact Info",   icon: "location-on",            route: "/(admin)/contact",        bg: "#FCE4EC", color: "#E91E63" },
  { label: "Bank Accounts",  icon: "account-balance",        route: "/(admin)/bank-accounts",  bg: "#E0F7FA", color: "#00ACC1" },
  { label: "Knowledge Base", icon: "psychology",             route: "/(admin)/knowledge-base", bg: "#FBE9E7", color: "#FF5722" },
  { label: "Reports",        icon: "bar-chart",              route: "/(admin)/reports",        bg: "#F1F8E9", color: "#689F38" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const haptics = useHaptics();

  // ── Three separate queries, matching the web app's data sources ──────────
  const {
    data: analytics,
    isLoading: kpiLoading,
    isError: kpiError,
    refetch: refetchKpi,
    isRefetching: kpiRefetching,
  } = useQuery<AnalyticsResp>({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get<AnalyticsResp>(API.admin.analytics),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: subsData,
    isLoading: subsLoading,
    isError: subsError,
    refetch: refetchSubs,
  } = useQuery<SubsListResp>({
    queryKey: ["admin-pending-subs"],
    queryFn: () =>
      api.get<SubsListResp>(API.subscriptions.list, { status: "pending", limit: 8 }),
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: commissionsData,
    isLoading: comLoading,
    isError: comError,
    refetch: refetchCom,
  } = useQuery<CommissionsListResp>({
    queryKey: ["admin-commissions-pending"],
    queryFn: () =>
      api.get<CommissionsListResp>(API.commissions.list, { status: "approved", limit: 8 }),
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = kpiLoading || subsLoading || comLoading;
  const isRefetching = kpiRefetching;

  const refetchAll = () => {
    refetchKpi();
    refetchSubs();
    refetchCom();
  };

  // ── Mutations ────────────────────────────────────────────────────────────
  const updateSubStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(API.subscriptions.updateStatus(id), { status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-subs"] });
      haptics.success();
      showToast({ message: `Subscription ${status}`, type: "success" });
    },
    onError: () => {
      haptics.error();
      Alert.alert("Error", "Action failed. Please try again.");
    },
  });

  const payCom = useMutation({
    mutationFn: (id: string) => api.patch(API.commissions.pay(id), {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-commissions-pending"] });
      haptics.success();
      showToast({ message: "Commission marked as paid", type: "success" });
    },
    onError: () => {
      haptics.error();
      Alert.alert("Error", "Action failed. Please try again.");
    },
  });

  const handleConfirmSub = (sub: PendingSub) => {
    Alert.alert(
      "Confirm Subscription",
      `Confirm ${sub.firstName} ${sub.lastName}'s subscription for ${sub.estateName ?? "this estate"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateSubStatus.mutate({ id: sub._id, status: "confirmed" }),
        },
      ],
    );
  };

  const handleRejectSub = (sub: PendingSub) => {
    Alert.alert(
      "Reject Subscription",
      `Reject ${sub.firstName} ${sub.lastName}'s subscription? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () =>
            updateSubStatus.mutate({ id: sub._id, status: "rejected" }),
        },
      ],
    );
  };

  const handlePayCommission = (c: CommissionItem) => {
    Alert.alert(
      "Mark Commission Paid",
      `Pay ${fmtNaira(c.netAmount)} to ${c.realtorName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Paid",
          onPress: () => payCom.mutate(c._id),
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Sign out of the admin portal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/admin-login");
        },
      },
    ]);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) return <InlineLoader message="Loading admin dashboard..." />;

  // ── Critical error: analytics failed (KPIs unavailable) ──────────────────
  if (kpiError) {
    return (
      <View style={styles.errWrap}>
        <LinearGradient colors={Gradients.midnight} style={styles.errHeader} />
        <View style={styles.errBody}>
          <View style={styles.errIconCircle}>
            <MaterialIcons name="error-outline" size={36} color={Colors.error} />
          </View>
          <Text style={styles.errTitle}>Dashboard unavailable</Text>
          <Text style={styles.errSub}>
            Could not load admin data. Check your connection and try again.
          </Text>
          <Pressable onPress={refetchAll} style={styles.retryBtn}>
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const a = analytics!;
  const pendingSubs = subsData?.subscriptions ?? [];
  const commissions = commissionsData?.commissions ?? [];
  const pendingSubsCount = a.subscriptions.byStatus.pending;
  const approvedComCount = commissionsData?.total ?? 0;
  const approvedComAmount = commissionsData?.summary?.approvedAmount ?? 0;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchAll}
            tintColor={Colors.brand}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={Gradients.midnight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.patternWrap} pointerEvents="none">
            <DotPattern width={420} height={280} opacity={0.06} />
          </View>

          <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
            <FadeInView>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.headerEyebrow}>KHL Operations</Text>
                  <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
                <Pressable
                  onPress={handleLogout}
                  style={styles.logoutBtn}
                  hitSlop={8}
                >
                  <MaterialIcons
                    name="logout"
                    size={20}
                    color="rgba(255,255,255,0.7)"
                  />
                </Pressable>
              </View>
            </FadeInView>

            {/* ── Row 1: Network ────────────────────────────────────────── */}
            <FadeInView delay={60}>
              <Text style={styles.kpiRowLabel}>Network & Properties</Text>
              <View style={styles.kpiGrid}>
                <KpiTile
                  icon="groups"
                  label="Realtors"
                  value={String(a.realtors.total)}
                  sub={`+${a.realtors.newThisMonth} this month`}
                />
                <KpiTile
                  icon="build"
                  label="Active Estates"
                  value={String(a.estates.active)}
                  sub={`${a.estates.total} total`}
                />
              </View>
            </FadeInView>

            {/* ── Row 2: Revenue ────────────────────────────────────────── */}
            <FadeInView delay={100}>
              <Text style={styles.kpiRowLabel}>Revenue & Pipeline</Text>
              <View style={styles.kpiGrid}>
                <KpiTile
                  icon="trending-up"
                  label="Approved Revenue"
                  value={fmtCompact(a.subscriptions.approvedRevenue)}
                  sub={`${a.subscriptions.approvedCount} deals`}
                />
                <KpiTile
                  icon="pending-actions"
                  label="Pending Subs"
                  value={String(pendingSubsCount)}
                  sub={`${a.subscriptions.approvalRate}% approval rate`}
                  accent={pendingSubsCount > 0}
                />
              </View>
            </FadeInView>

            {/* ── Row 3: Inspections ────────────────────────────────────── */}
            <FadeInView delay={140}>
              <Text style={styles.kpiRowLabel}>Inspections</Text>
              <View style={styles.kpiGrid}>
                <KpiTile
                  icon="event-available"
                  label="Confirmed"
                  value={String(a.inspections.byStatus.confirmed)}
                  sub={`${a.inspections.total} total`}
                />
                <KpiTile
                  icon="calendar-today"
                  label="Next 7 Days"
                  value={String(a.inspections.upcoming7Days)}
                  sub={`${a.inspections.inspToSubRate}% → subscription`}
                  accent={a.inspections.upcoming7Days > 0}
                />
              </View>
            </FadeInView>

            {/* ── Commissions chip ──────────────────────────────────────── */}
            {approvedComCount > 0 && (
              <FadeInView delay={170}>
                <View style={styles.comChip}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={13}
                    color={Colors.accentLight}
                  />
                  <Text style={styles.comChipText}>
                    {approvedComCount} commission
                    {approvedComCount === 1 ? "" : "s"} awaiting payout ·{" "}
                    {fmtCompact(approvedComAmount)}
                  </Text>
                </View>
              </FadeInView>
            )}
          </View>
        </View>

        {/* ── Pending subscriptions ────────────────────────────────────── */}
        <FadeInView delay={200}>
          <View style={styles.section}>
            <SectionHeader
              icon="pending-actions"
              title="Pending Subscriptions"
              count={pendingSubsCount}
              accent={pendingSubsCount > 0}
            />

            {subsError ? (
              <ErrorCard onRetry={refetchSubs} />
            ) : pendingSubs.length === 0 ? (
              <EmptyCard
                icon="check-circle"
                text="No pending subscriptions — all caught up!"
                color={Colors.success}
                bg={Colors.successBg}
              />
            ) : (
              pendingSubs.map((sub) => (
                <PendingSubCard
                  key={sub._id}
                  sub={sub}
                  onConfirm={() => handleConfirmSub(sub)}
                  onReject={() => handleRejectSub(sub)}
                  busy={updateSubStatus.isPending}
                />
              ))
            )}
          </View>
        </FadeInView>

        {/* ── Commissions awaiting payout ──────────────────────────────── */}
        <FadeInView delay={260}>
          <View style={styles.section}>
            <SectionHeader
              icon="account-balance-wallet"
              title="Commissions to Pay"
              count={approvedComCount}
              sub={approvedComCount > 0 ? fmtCompact(approvedComAmount) : undefined}
              accent={approvedComCount > 0}
            />

            {comError ? (
              <ErrorCard onRetry={refetchCom} />
            ) : commissions.length === 0 ? (
              <EmptyCard
                icon="check-circle"
                text="No approved commissions awaiting payout."
                color={Colors.success}
                bg={Colors.successBg}
              />
            ) : (
              commissions.map((c) => (
                <CommissionCard
                  key={c._id}
                  commission={c}
                  onPay={() => handlePayCommission(c)}
                  busy={payCom.isPending}
                />
              ))
            )}
          </View>
        </FadeInView>

        {/* ── Management navigation grid ────────────────────────────────── */}
        <FadeInView delay={310}>
          <View style={styles.section}>
            <SectionHeader icon="dashboard" title="Management" />
            <View style={styles.mgmtGrid}>
              {MGMT_TILES.map((tile) => (
                <Pressable
                  key={tile.route}
                  style={styles.mgmtTile}
                  onPress={() => router.push(tile.route as any)}
                >
                  <View style={[styles.mgmtIconWrap, { backgroundColor: tile.bg }]}>
                    <MaterialIcons name={tile.icon} size={22} color={tile.color} />
                  </View>
                  <Text style={styles.mgmtLabel}>{tile.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiTile({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.kpiTile, accent ? styles.kpiTileAccent : null]}>
      <MaterialIcons
        name={icon}
        size={16}
        color={accent ? Colors.accentLight : "rgba(255,255,255,0.5)"}
        style={{ marginBottom: 6 }}
      />
      <Text style={[styles.kpiValue, accent ? styles.kpiValueAccent : null]}>
        {value}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  sub,
  accent = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  count?: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View
          style={[
            styles.sectionIconWrap,
            accent ? styles.sectionIconAccent : null,
          ]}
        >
          <MaterialIcons
            name={icon}
            size={16}
            color={accent ? Colors.brand : Colors.textSecondary}
          />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionHeaderRight}>
        {count !== undefined && count > 0 && (
          <View
            style={[
              styles.countBadge,
              accent ? styles.countBadgeAccent : null,
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                accent ? styles.countBadgeTextAccent : null,
              ]}
            >
              {count}
            </Text>
          </View>
        )}
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function EmptyCard({
  icon,
  text,
  color,
  bg,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: bg }]}>
      <MaterialIcons name={icon} size={22} color={color} />
      <Text style={[styles.emptyCardText, { color }]}>{text}</Text>
    </View>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: Colors.errorBg }]}>
      <MaterialIcons name="wifi-off" size={22} color={Colors.error} />
      <Text style={[styles.emptyCardText, { color: Colors.error, flex: 1 }]}>
        Failed to load
      </Text>
      <Pressable onPress={onRetry}>
        <MaterialIcons name="refresh" size={20} color={Colors.error} />
      </Pressable>
    </View>
  );
}

function PendingSubCard({
  sub,
  onConfirm,
  onReject,
  busy,
}: {
  sub: PendingSub;
  onConfirm: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const ref =
    sub.referenceNumber ?? sub._id.slice(-8).toUpperCase();
  return (
    <View style={[styles.card, Shadow.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatarWrap}>
          <Text style={styles.cardAvatarText}>
            {(sub.firstName?.[0] ?? "") + (sub.lastName?.[0] ?? "")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>
            {sub.firstName} {sub.lastName}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {sub.email}
          </Text>
        </View>
        <View style={styles.refWrap}>
          <Text style={styles.refText}>{ref}</Text>
          <Text style={styles.refLabel}>REF</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        {sub.estateName ? (
          <MetaChip icon="landscape" text={sub.estateName} />
        ) : null}
        {sub.plotType ? (
          <MetaChip icon="category" text={sub.plotType} />
        ) : null}
        {sub.paymentPlan ? (
          <MetaChip icon="payments" text={sub.paymentPlan} />
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.cardAmount}>{fmtNaira(sub.totalAmount)}</Text>
          <Text style={styles.cardDate}>{fmtDate(sub.createdAt)}</Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={onReject}
            disabled={busy}
            style={[styles.actionBtn, styles.rejectBtn]}
          >
            <MaterialIcons name="close" size={15} color={Colors.error} />
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>
              Reject
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={busy}
            style={[styles.actionBtn, styles.confirmBtn]}
          >
            <MaterialIcons name="check" size={15} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>
              Confirm
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CommissionCard({
  commission,
  onPay,
  busy,
}: {
  commission: CommissionItem;
  onPay: () => void;
  busy: boolean;
}) {
  return (
    <View style={[styles.card, Shadow.card]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.cardAvatarWrap,
            { backgroundColor: Colors.successBg },
          ]}
        >
          <MaterialIcons name="person" size={18} color={Colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{commission.realtorName}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {commission.realtorEmail}
          </Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>L{commission.level}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        {commission.estateName ? (
          <MetaChip icon="landscape" text={commission.estateName} />
        ) : null}
        <MetaChip
          icon="percent"
          text={`${commission.percent}% commission`}
        />
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.cardAmount}>
            {fmtNaira(commission.netAmount)}
          </Text>
          <Text style={styles.cardDate}>{fmtDate(commission.createdAt)}</Text>
        </View>
        <Pressable
          onPress={onPay}
          disabled={busy}
          style={[styles.actionBtn, styles.payBtn]}
        >
          <MaterialIcons name="payments" size={15} color="#fff" />
          <Text style={[styles.actionBtnText, { color: "#fff" }]}>
            Mark Paid
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetaChip({
  icon,
  text,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaChip}>
      <MaterialIcons name={icon} size={11} color={Colors.textMuted} />
      <Text style={styles.metaChipText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Error state
  errWrap: { flex: 1, backgroundColor: Colors.background },
  errHeader: { height: 120 },
  errBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: -40,
  },
  errIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
    marginBottom: 8,
  },
  errSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Header
  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 20, paddingBottom: 24 },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // KPI grid
  kpiRowLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 14,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 10,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.xl,
    padding: 14,
  },
  kpiTileAccent: {
    backgroundColor: "rgba(239,194,255,0.12)",
    borderColor: "rgba(239,194,255,0.25)",
  },
  kpiValue: { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 2 },
  kpiValueAccent: { color: Colors.accentLight },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  kpiSub: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  // Commission chip
  comChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },
  comChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accentLight,
  },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 24 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.ink100,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconAccent: { backgroundColor: Colors.brand50 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.textPrimary },
  sectionSub: { fontSize: 12, fontWeight: "700", color: Colors.brand },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.ink100,
  },
  countBadgeAccent: { backgroundColor: Colors.brand50 },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.textSecondary,
  },
  countBadgeTextAccent: { color: Colors.brand },

  // Empty / error cards
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Radius.xl,
    padding: 16,
  },
  emptyCardText: { fontSize: 13, fontWeight: "600" },

  // Subscription / Commission cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  cardAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.brand,
    textTransform: "uppercase",
  },
  cardName: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary },
  cardSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  refWrap: { alignItems: "flex-end" },
  refText: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.brand,
    letterSpacing: 0.5,
  },
  refLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 1,
  },

  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand50,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.brand,
  },

  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    maxWidth: 120,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  cardAmount: { fontSize: 16, fontWeight: "900", color: Colors.brand },
  cardDate: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  actionBtnText: { fontSize: 12, fontWeight: "800" },
  confirmBtn: { backgroundColor: Colors.success },
  rejectBtn: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  payBtn: { backgroundColor: Colors.brand },

  // Management grid
  mgmtGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mgmtTile: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    alignItems: "center",
    gap: 8,
    ...Shadow.sm,
  },
  mgmtIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mgmtLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
