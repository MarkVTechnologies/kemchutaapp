// ─────────────────────────────────────────────────────────────────────────────
// Notification Inbox — full list, tap to mark read, grouped by read/unread
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { AppNotification, NotificationType } from "@/types";
import { DotPattern } from "@/components/ui/DotPattern";
import { InlineLoader } from "@/components/ui/AppLoader";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

const formatDate = (s: string) => {
  const d = new Date(s);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const TYPE_ICON: Record<NotificationType, keyof typeof MaterialIcons.glyphMap> =
  {
    commission_approved: "thumb-up",
    commission_paid: "payments",
    payment_received: "check-circle",
    payment_due: "schedule",
    inspection_confirmed: "event-available",
    subscription_approved: "verified",
    subscription_rejected: "cancel",
    document_ready: "description",
    new_recruit: "person-add",
    new_estate: "landscape",
    general: "notifications",
  };

const TYPE_COLOR: Record<NotificationType, { color: string; bg: string }> = {
  commission_approved: { color: Colors.success, bg: Colors.successBg },
  commission_paid: { color: Colors.success, bg: Colors.successBg },
  payment_received: { color: Colors.success, bg: Colors.successBg },
  payment_due: { color: Colors.warning, bg: Colors.warningBg },
  inspection_confirmed: { color: Colors.info, bg: Colors.infoBg },
  subscription_approved: { color: Colors.success, bg: Colors.successBg },
  subscription_rejected: { color: Colors.error, bg: Colors.errorBg },
  document_ready: { color: Colors.brand, bg: Colors.brand50 },
  new_recruit: { color: Colors.brand, bg: Colors.brand50 },
  new_estate: { color: Colors.brand, bg: Colors.brand50 },
  general: { color: Colors.textSecondary, bg: Colors.ink100 },
};

type InboxResp =
  | AppNotification[]
  | { notifications: AppNotification[] }
  | { data: AppNotification[] };

const normalize = (d: InboxResp): AppNotification[] => {
  if (Array.isArray(d)) return d;
  if ("notifications" in d && Array.isArray((d as any).notifications))
    return (d as any).notifications;
  if ("data" in d && Array.isArray((d as any).data)) return (d as any).data;
  return [];
};

export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<InboxResp>(API.notifications.inbox),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(API.notifications.markRead(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handlePress = useCallback(
    (n: AppNotification) => {
      if (!n.read) markRead.mutate(n._id);
      if (n.deepLinkPath) {
        try {
          router.push(n.deepLinkPath as any);
        } catch {}
      }
    },
    [markRead, router],
  );

  const notifications = data ? normalize(data) : [];
  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={180} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={8}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unread.length > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread.length}</Text>
              </View>
            ) : (
              <View style={{ width: 38 }} />
            )}
          </View>
        </View>
      </View>

      {isLoading ? (
        <InlineLoader message="Loading notifications..." />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <MaterialIcons
              name="notifications-none"
              size={36}
              color={Colors.brand}
            />
          </View>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySub}>
            You have no notifications right now. We'll alert you about
            commissions, payments, and estate updates.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
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
          {unread.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>NEW</Text>
              {unread.map((n) => (
                <NotifRow key={n._id} n={n} onPress={handlePress} />
              ))}
            </>
          ) : null}

          {read.length > 0 ? (
            <>
              <Text style={[styles.groupLabel, { marginTop: 16 }]}>
                EARLIER
              </Text>
              {read.map((n) => (
                <NotifRow key={n._id} n={n} onPress={handlePress} />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NotifRow({
  n,
  onPress,
}: {
  n: AppNotification;
  onPress: (n: AppNotification) => void;
}) {
  const type = (n.type ?? "general") as NotificationType;
  const icon = TYPE_ICON[type] ?? "notifications";
  const meta = TYPE_COLOR[type] ?? TYPE_COLOR.general;

  return (
    <Pressable
      onPress={() => onPress(n)}
      style={[
        styles.notifRow,
        Shadow.sm,
        !n.read ? styles.notifUnread : null,
      ]}
    >
      <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
        <MaterialIcons name={icon} size={20} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.notifTitle, !n.read ? styles.notifTitleBold : null]}>
          {n.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {n.body}
        </Text>
        <Text style={styles.notifTime}>{formatDate(n.createdAt)}</Text>
      </View>
      {!n.read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errWrap}>
      <View style={styles.errCard}>
        <View style={styles.errIconCircle}>
          <MaterialIcons name="wifi-off" size={32} color={Colors.error} />
        </View>
        <Text style={styles.errHeading}>Couldn't load notifications</Text>
        <Text style={styles.errBody}>
          Check your internet connection and try again.
        </Text>
        <Pressable onPress={onRetry} style={styles.errRetryBtn}>
          <MaterialIcons name="refresh" size={18} color="#fff" />
          <Text style={styles.errRetryText}>Try Again</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerWrap: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 16, paddingBottom: 18 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  unreadBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: { fontSize: 12, fontWeight: "900", color: "#fff" },

  groupLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 8,
  },
  notifUnread: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: Colors.brand50,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  notifTitleBold: { fontWeight: "800" },
  notifBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 5,
  },
  notifTime: { fontSize: 10, color: Colors.textMuted, fontWeight: "600" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
    marginTop: 4,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 6,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "800" },
  emptySub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },

  errWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
    marginBottom: 20,
  },
  errRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  errRetryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
