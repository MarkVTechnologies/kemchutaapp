// ─────────────────────────────────────────────────────────────────────────────
// Client Portal — Home with active subscriptions, recent docs, quick actions
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from "react";
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
import type { Subscription } from "@/types";
import { subscriptionStatusBucket } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

const formatNaira = (n?: number) =>
  "₦" + (n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

type ListResp = Subscription[] | { subscriptions: Subscription[] };
const normalize = (d: ListResp): Subscription[] =>
  Array.isArray(d) ? d : (d?.subscriptions ?? []);

export default function ClientPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useAuthStore((s) => s.clientUser);

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ["client-subscriptions"],
    queryFn: () => api.get<ListResp>(API.subscriptions.my),
  });

  const subs = useMemo(() => (data ? normalize(data) : []), [data]);
  const active = subs.filter(
    (s) => subscriptionStatusBucket(s.status) === "active",
  );
  const pending = subs.filter(
    (s) => subscriptionStatusBucket(s.status) === "pending",
  );
  const totalInvested = subs.reduce(
    (sum, s) =>
      sum +
      (subscriptionStatusBucket(s.status) === "active" ? s.totalAmount : 0),
    0,
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={240} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.greetLabel}>Welcome back,</Text>
          <Text style={styles.greetName}>
            {client?.firstName ?? "Investor"}
          </Text>

          <FadeInView delay={80}>
            <View style={styles.investedCard}>
              <Text style={styles.investedLabel}>TOTAL INVESTED</Text>
              <Text style={styles.investedValue}>
                {formatNaira(totalInvested)}
              </Text>
              <View style={styles.investedFooter}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniLabel}>Active Plots</Text>
                  <Text style={styles.miniValue}>{active.length}</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniStat}>
                  <Text style={styles.miniLabel}>Pending</Text>
                  <Text style={styles.miniValue}>{pending.length}</Text>
                </View>
              </View>
            </View>
          </FadeInView>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.brand}
          />
        }
      >
        {/* Quick actions */}
        <FadeInView delay={120}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              <ActionCard
                icon="explore"
                label="Browse Estates"
                gradient={[Colors.brand, Colors.brand700]}
                onPress={() => router.push("/(client)/explore" as any)}
              />
              <ActionCard
                icon="receipt-long"
                label="My Plots"
                gradient={[Colors.brand400, Colors.brand]}
                onPress={() => router.push("/(client)/subscriptions" as any)}
              />
              <ActionCard
                icon="folder-open"
                label="Documents"
                gradient={[Colors.brand700, Colors.brand900]}
                onPress={() => router.push("/(client)/documents" as any)}
              />
            </View>
          </View>
        </FadeInView>

        {/* Recent subscriptions */}
        <FadeInView delay={160}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Plots</Text>
              {subs.length > 0 ? (
                <Pressable
                  onPress={() => router.push("/(client)/subscriptions" as any)}
                >
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              ) : null}
            </View>

            {subs.length === 0 ? (
              <View style={[styles.emptyCard, Shadow.card]}>
                <View style={styles.emptyIcon}>
                  <MaterialIcons
                    name="landscape"
                    size={28}
                    color={Colors.brand}
                  />
                </View>
                <Text style={styles.emptyTitle}>No plots yet</Text>
                <Text style={styles.emptyBody}>
                  Browse our estates and subscribe to your first plot.
                </Text>
                <Pressable
                  onPress={() => router.push("/(client)/explore" as any)}
                  style={styles.emptyCta}
                >
                  <Text style={styles.emptyCtaText}>Browse Estates</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {subs.slice(0, 3).map((s) => (
                  <SubscriptionRow
                    key={s._id}
                    sub={s}
                    onPress={() =>
                      router.push(`/(client)/subscription/${s._id}` as any)
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  gradient,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  gradient: [string, string];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionCard, Shadow.card]}>
      <LinearGradient colors={gradient as any} style={styles.actionIcon}>
        <MaterialIcons name={icon} size={20} color="#fff" />
      </LinearGradient>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SubscriptionRow({
  sub,
  onPress,
}: {
  sub: Subscription;
  onPress: () => void;
}) {
  const bucket = subscriptionStatusBucket(sub.status);
  const statusMeta = {
    pending: { color: Colors.warning, bg: Colors.warningBg, label: "Pending" },
    active: { color: Colors.success, bg: Colors.successBg, label: "Active" },
    rejected: { color: Colors.error, bg: Colors.errorBg, label: "Rejected" },
  }[bucket];

  return (
    <Pressable onPress={onPress} style={[styles.subRow, Shadow.sm]}>
      <View style={styles.subIcon}>
        <MaterialIcons name="landscape" size={22} color={Colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.subName} numberOfLines={1}>
          {sub.estateName ?? "Plot Subscription"}
        </Text>
        <View style={styles.subMeta}>
          <Text style={styles.subMetaText}>{sub.plotSize}</Text>
          <View style={styles.subDot} />
          <Text style={styles.subMetaText}>
            {sub.numberOfPlots} plot{sub.numberOfPlots > 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.subAmount}>{formatNaira(sub.totalAmount)}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusText, { color: statusMeta.color }]}>
            {statusMeta.label.toUpperCase()}
          </Text>
        </View>
      </View>
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
  headerContent: { paddingHorizontal: 16, paddingBottom: 20 },

  greetLabel: { ...Typography.caption, color: "rgba(255,255,255,0.75)" },
  greetName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
    marginBottom: 14,
  },

  investedCard: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    padding: 16,
  },
  investedLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    color: "rgba(255,255,255,0.75)",
  },
  investedValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginTop: 4,
    marginBottom: 12,
  },
  investedFooter: { flexDirection: "row", alignItems: "center", gap: 14 },
  miniDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  miniStat: { flex: 1 },
  miniLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
    letterSpacing: 1,
  },
  miniValue: { fontSize: 16, fontWeight: "800", color: "#fff", marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
    marginBottom: 10,
  },
  seeAll: { ...Typography.caption, color: Colors.brand, fontWeight: "800" },

  actionRow: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 12,
    alignItems: "flex-start",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    ...Typography.bodySm,
    color: Colors.textPrimary,
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 22,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  emptyBody: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  emptyCta: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyCtaText: { color: "#fff", fontWeight: "800" },

  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
  },
  subIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  subName: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  subMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  subMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  subDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  subAmount: {
    fontSize: 14,
    fontWeight: "800",
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
