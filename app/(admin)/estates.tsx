import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { Colors, Gradients, Typography, Spacing, Radius, Shadow } from "@/constants/theme";

interface Estate {
  _id: string;
  title: string;
  slug?: string;
  location?: string;
  state?: string;
  pricePerPlot?: number;
  totalPlots?: number;
  availablePlots?: number;
  isActive: boolean;
  createdAt: string;
}

interface EstatesResp {
  estates: Estate[];
  total: number;
  pages?: number;
}

const N = (v?: number) =>
  v != null ? v.toLocaleString("en-NG") : "—";

export default function EstatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (search) params.search = search;
  if (activeFilter === "active") params.active = "true";
  if (activeFilter === "inactive") params.active = "false";

  const { data, isLoading, isFetching, refetch } = useQuery<EstatesResp>({
    queryKey: ["admin-estates", page, search, activeFilter],
    queryFn: () => api.get<EstatesResp>(API.estates.list, params),
    staleTime: 1000 * 60 * 2,
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.patch(API.estates.toggle(id), {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-estates"] }),
    onError: () => Alert.alert("Error", "Could not toggle estate status."),
  });

  const onSearchCommit = useCallback(() => { setPage(1); refetch(); }, [refetch]);

  const estates = data?.estates ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={Gradients.midnight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manage Estates</Text>
          <Text style={styles.headerSub}>{total} total listings</Text>
        </View>
        {isFetching && !isLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search estates..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchCommit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => { setSearch(""); setPage(1); }} hitSlop={8}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        <View style={styles.chips}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => { setActiveFilter(f); setPage(1); }}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : estates.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="location-city" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No estates found</Text>
        </View>
      ) : (
        <FlatList
          data={estates}
          keyExtractor={(e) => e._id}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: item.isActive ? Colors.success : Colors.textMuted }]} />
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleMut.mutate(item._id)}
                  trackColor={{ false: Colors.border, true: Colors.brand }}
                  thumbColor="#fff"
                  disabled={toggleMut.isPending}
                />
              </View>
              {(item.location || item.state) && (
                <View style={styles.cardMeta}>
                  <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{[item.location, item.state].filter(Boolean).join(", ")}</Text>
                </View>
              )}
              <View style={styles.statsRow}>
                <StatPill label="Price/Plot" value={item.pricePerPlot != null ? `₦${N(item.pricePerPlot)}` : "—"} />
                <StatPill label="Total Plots" value={N(item.totalPlots)} />
                <StatPill label="Available" value={N(item.availablePlots)} />
              </View>
            </View>
          )}
        />
      )}

      {pages > 1 && (
        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => setPage((p) => p - 1)} style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>
            <MaterialIcons name="chevron-left" size={20} color={page === 1 ? Colors.textMuted : Colors.brand} />
            <Text style={[styles.pageBtnText, page === 1 && { color: Colors.textMuted }]}>Prev</Text>
          </Pressable>
          <Text style={styles.pageInfo}>Page {page} of {pages}</Text>
          <Pressable disabled={page === pages} onPress={() => setPage((p) => p + 1)} style={[styles.pageBtn, page === pages && styles.pageBtnDisabled]}>
            <Text style={[styles.pageBtnText, page === pages && { color: Colors.textMuted }]}>Next</Text>
            <MaterialIcons name="chevron-right" size={20} color={page === pages ? Colors.textMuted : Colors.brand} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  filterRow: { padding: 16, gap: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  chipText: { ...Typography.labelSm, color: Colors.textSecondary },
  chipTextActive: { color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 16, ...Shadow.sm, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { ...Typography.label, color: Colors.textPrimary, flex: 1 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  statsRow: { flexDirection: "row", gap: 8 },
  statPill: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md, padding: 10, alignItems: "center" },
  statValue: { ...Typography.labelSm, color: Colors.textPrimary },
  statLabel: { ...Typography.micro, color: Colors.textMuted, marginTop: 2 },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pageBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { ...Typography.label, color: Colors.brand },
  pageInfo: { ...Typography.bodySm, color: Colors.textSecondary },
});
