// ─────────────────────────────────────────────────────────────────────────────
// Subscriptions — Full list with filter chips
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { Subscription, SubscriptionBucket } from "@/types";
import { subscriptionStatusBucket } from "@/types";
import { Button } from "@/components/ui/Button";
import { DotPattern } from "@/components/ui/DotPattern";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

type Filter = "all" | SubscriptionBucket;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const BUCKET_META: Record<
  SubscriptionBucket,
  {
    color: string;
    bg: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
  }
> = {
  pending: {
    color: Colors.warning,
    bg: Colors.warningBg,
    icon: "schedule",
    label: "Pending Review",
  },
  active: {
    color: Colors.success,
    bg: Colors.successBg,
    icon: "verified",
    label: "Active",
  },
  rejected: {
    color: Colors.error,
    bg: Colors.errorBg,
    icon: "cancel",
    label: "Rejected",
  },
};

const formatNaira = (n?: number) =>
  "₦" + (n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const formatDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

type ListResp = Subscription[] | { subscriptions: Subscription[] };
const normalize = (d: ListResp): Subscription[] =>
  Array.isArray(d) ? d : (d?.subscriptions ?? []);

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["client-subscriptions"],
    queryFn: () => api.get<ListResp>(API.subscriptions.my),
  });

  const subs = useMemo(() => {
    const list = data ? normalize(data) : [];
    return filter === "all"
      ? list
      : list.filter((s) => subscriptionStatusBucket(s.status) === filter);
  }, [data, filter]);

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
          <DotPattern width={420} height={200} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.title}>My Plots</Text>
          <Text style={styles.subtitle}>
            All your land subscriptions in one place
          </Text>
        </View>
      </View>

      {/* Filter chips */}
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

      {isLoading ? (
        <View style={styles.center}>
          <MaterialIcons
            name="hourglass-empty"
            size={32}
            color={Colors.textMuted}
          />
          <Text style={styles.centerText}>Loading subscriptions...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialIcons name="cloud-off" size={42} color={Colors.textMuted} />
          <Text style={styles.centerText}>Couldn't load subscriptions</Text>
          <Button label="Retry" onPress={() => refetch()} variant="primary" />
        </View>
      ) : subs.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="landscape" size={36} color={Colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === "all" ? "No plots yet" : `No ${filter} plots`}
          </Text>
          <Text style={styles.emptySub}>
            Browse our estates and subscribe to your first plot.
          </Text>
          <Button
            label="Browse Estates"
            onPress={() => router.push("/(tabs)" as any)}
            variant="primary"
          />
        </View>
      ) : (
        <FlashList
          data={subs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <SubCard
              sub={item}
              onPress={() =>
                router.push(`/(client)/subscription/${item._id}` as any)
              }
            />
          )}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand}
            />
          }
        />
      )}
    </View>
  );
}

function SubCard({ sub, onPress }: { sub: Subscription; onPress: () => void }) {
  const meta = BUCKET_META[subscriptionStatusBucket(sub.status)];
  return (
    <Pressable onPress={onPress} style={[styles.card, Shadow.card]}>
      <View style={styles.cardTop}>
        <View style={[styles.statusIconWrap, { backgroundColor: meta.bg }]}>
          <MaterialIcons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {sub.estateName ?? "Plot Subscription"}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>{sub.plotSize}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.cardMetaText}>
              {sub.numberOfPlots} plot{sub.numberOfPlots > 1 ? "s" : ""}
            </Text>
            <View style={styles.metaDot} />
            <Text style={styles.cardMetaText}>{sub.paymentPlan}</Text>
          </View>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={Colors.textMuted}
        />
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.cardLabel}>Subscribed</Text>
          <Text style={styles.cardDate}>{formatDate(sub.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.cardAmount}>{formatNaira(sub.totalAmount)}</Text>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>
              {meta.label.toUpperCase()}
            </Text>
          </View>
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
  title: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitle: { ...Typography.bodySm, color: "rgba(255,255,255,0.75)" },

  filterStrip: {
    backgroundColor: Colors.background,
    paddingTop: 16,
    paddingBottom: 4,
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

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  cardMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  cardDate: {
    ...Typography.bodySm,
    color: Colors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 16,
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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  centerText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
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
    marginBottom: 14,
  },
});
