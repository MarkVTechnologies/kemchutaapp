// ─────────────────────────────────────────────────────────────────────────────
// Client Explore — Estate listings for logged-in clients. Mirrors the public
// explore but greets the client and keeps them inside the (client) tab group.
// Estate taps route to the global /estate/[slug], which returns here on back.
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { Estate, EstateLocation } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Colors, Gradients, Typography, Radius } from "@/constants/theme";
import { EstateCard } from "@/components/features/EstateCard";
import { EstateSkeletonList } from "@/components/features/EstateSkeleton";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";

const FILTERS: Array<"All" | EstateLocation> = [
  "All",
  "Lagos",
  "Abuja",
  "Asaba",
  "Anambra",
];

// Some backends return { estates: [...] }, others return [...] directly
type EstateListResponse = Estate[] | { estates: Estate[] };
function normalize(data: EstateListResponse): Estate[] {
  return Array.isArray(data) ? data : (data?.estates ?? []);
}

export default function ClientExploreScreen() {
  const insets = useSafeAreaInsets();
  const client = useAuthStore((s) => s.clientUser);
  const [filter, setFilter] = useState<"All" | EstateLocation>("All");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["estates"],
    queryFn: () => api.get<EstateListResponse>(API.estates.list),
  });

  const estates = useMemo(() => {
    const list = data ? normalize(data) : [];
    return filter === "All" ? list : list.filter((e) => e.location === filter);
  }, [data, filter]);

  return (
    <View style={styles.root}>
      {/* Hero header */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={400} height={220} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
          <FadeInView>
            <Text style={styles.greeting}>
              {client ? `Hello, ${client.firstName}` : "Browse Estates"}
            </Text>
            <Text style={styles.title}>Discover Estates</Text>
            <View style={styles.taglineRow}>
              <MaterialIcons
                name="location-on"
                size={14}
                color={Colors.accentLight}
              />
              <Text style={styles.tagline}>Premium land across 4 cities</Text>
            </View>
          </FadeInView>
        </View>

        {/* Filter chips */}
        <View style={styles.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : null,
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 16 }}
        >
          <EstateSkeletonList count={4} />
        </ScrollView>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialIcons name="cloud-off" size={42} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Couldn't load estates</Text>
          <Text style={styles.errorBody}>
            Check your internet connection and try again.
          </Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <MaterialIcons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : estates.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="search-off" size={42} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>No estates found</Text>
          <Text style={styles.errorBody}>
            {filter === "All"
              ? "Check back soon — new estates are coming."
              : `No estates in ${filter} yet.`}
          </Text>
        </View>
      ) : (
        <FlashList
          data={estates}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EstateCard estate={item} />}
          contentContainerStyle={{
            paddingTop: 18,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand}
              colors={[Colors.brand]}
            />
          }
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {estates.length} {estates.length === 1 ? "estate" : "estates"}
                {filter !== "All" ? ` in ${filter}` : " available"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerWrap: {
    backgroundColor: Colors.brand,
    paddingBottom: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },

  headerContent: { paddingHorizontal: 20, paddingBottom: 16 },
  greeting: {
    ...Typography.body,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 8 },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tagline: { ...Typography.bodySm, color: "rgba(255,255,255,0.85)" },

  filterWrap: { paddingTop: 4 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  chipActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.3,
  },
  chipTextActive: { color: Colors.brand },

  countRow: { paddingHorizontal: 20, marginBottom: 12 },
  countText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  errorBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
