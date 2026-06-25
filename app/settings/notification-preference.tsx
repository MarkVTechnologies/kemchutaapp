// ─────────────────────────────────────────────────────────────────────────────
// Notification Preferences — Realtor self-service
// GET  /api/realtors/me/preferences → { pushEnabled, emailEnabled }
// PUT  /api/realtors/me/preferences → updated prefs
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { DotPattern } from "@/components/ui/DotPattern";
import { InlineLoader } from "@/components/ui/AppLoader";
import { Colors, Gradients, Typography, Radius } from "@/constants/theme";

interface Prefs {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["realtor-preferences"],
    queryFn: () => api.get<Prefs>(API.realtors.preferences),
  });

  useEffect(() => {
    if (data) {
      setPush(data.pushEnabled ?? true);
      setEmail(data.emailEnabled ?? true);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (next: Prefs) => api.put<Prefs>(API.realtors.preferences, next),
    onError: (err: any, _vars, ctx: any) => {
      // Roll back the optimistic toggle on failure
      if (ctx) {
        setPush(ctx.prevPush);
        setEmail(ctx.prevEmail);
      }
      const msg =
        err?.response?.data?.message ?? "Couldn't save your preference.";
      Alert.alert("Update Failed", msg);
    },
    onMutate: (next: Prefs) => {
      const prev = { prevPush: push, prevEmail: email };
      setPush(next.pushEnabled);
      setEmail(next.emailEnabled);
      return prev;
    },
  });

  const toggle = (key: keyof Prefs, value: boolean) => {
    const next: Prefs = {
      pushEnabled: key === "pushEnabled" ? value : push,
      emailEnabled: key === "emailEnabled" ? value : email,
    };
    mutation.mutate(next);
  };

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
          <DotPattern width={420} height={160} opacity={0.08} />
        </View>
        <View style={[styles.headerContent, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {isLoading ? (
        <InlineLoader message="Loading preferences..." />
      ) : isError ? (
        <View style={styles.center}>
          <MaterialIcons name="cloud-off" size={40} color={Colors.textMuted} />
          <Text style={styles.errText}>Couldn't load preferences</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <PrefRow
              icon="notifications-active"
              title="Push Notifications"
              subtitle="Commission updates, payouts, new recruits"
              value={push}
              onValueChange={(v) => toggle("pushEnabled", v)}
            />
            <View style={styles.divider} />
            <PrefRow
              icon="email"
              title="Email Notifications"
              subtitle="Summaries and important account emails"
              value={email}
              onValueChange={(v) => toggle("emailEnabled", v)}
            />
          </View>
          <Text style={styles.footnote}>
            You'll always receive critical account and security messages.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function PrefRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={20} color={Colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: Colors.brand, false: Colors.border }}
        thumbColor={Colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerWrap: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  rowSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },
  footnote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  errText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  retryText: { color: "#fff", fontWeight: "800" },
});
