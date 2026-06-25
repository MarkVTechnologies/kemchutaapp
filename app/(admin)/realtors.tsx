import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { Colors, Gradients, Typography, Spacing, Radius, Shadow } from "@/constants/theme";

interface Realtor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  referralCode: string;
  downlines?: number;
  createdAt: string;
  isActive?: boolean;
}

interface RealtorListResp {
  docs: Realtor[];
  total: number;
  pages: number;
}

const PAGE_SIZE = 20;

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RealtorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Realtor | null>(null);

  const { data, isFetching, isLoading, refetch } = useQuery<RealtorListResp>({
    queryKey: ["admin-realtors", page, search],
    queryFn: () =>
      api.get<RealtorListResp>(API.realtors.list, {
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
      }),
    staleTime: 1000 * 60 * 2,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(API.realtors.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-realtors"] });
      setSelected(null);
    },
    onError: () => Alert.alert("Error", "Could not delete realtor."),
  });

  const handleDelete = (r: Realtor) => {
    Alert.alert(
      "Delete Realtor",
      `Remove ${r.firstName} ${r.lastName} from the system? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMut.mutate(r._id),
        },
      ]
    );
  };

  const onSearchCommit = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const docs = data?.docs ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Header */}
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
          <Text style={styles.headerTitle}>Manage Realtors</Text>
          <Text style={styles.headerSub}>{total} total realtors</Text>
        </View>
        {isFetching && !isLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
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
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : docs.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No realtors found</Text>
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(r) => r._id}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelected(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.firstName[0]}{item.lastName[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                <Text style={styles.meta}>
                  {item.referralCode} · Joined {fmt(item.createdAt)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        />
      )}

      {/* Pagination */}
      {pages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            disabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
          >
            <MaterialIcons name="chevron-left" size={20} color={page === 1 ? Colors.textMuted : Colors.brand} />
            <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
          </Pressable>
          <Text style={styles.pageInfo}>Page {page} of {pages}</Text>
          <Pressable
            disabled={page === pages}
            onPress={() => setPage((p) => p + 1)}
            style={[styles.pageBtn, page === pages && styles.pageBtnDisabled]}
          >
            <Text style={[styles.pageBtnText, page === pages && styles.pageBtnTextDisabled]}>Next</Text>
            <MaterialIcons name="chevron-right" size={20} color={page === pages ? Colors.textMuted : Colors.brand} />
          </Pressable>
        </View>
      )}

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected.firstName} {selected.lastName}</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Phone" value={selected.phone ?? "—"} />
              <InfoRow label="Referral Code" value={selected.referralCode} />
              <InfoRow label="Downlines" value={String(selected.downlines ?? 0)} />
              <InfoRow label="Joined" value={fmt(selected.createdAt)} />

              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(selected)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="delete-outline" size={18} color="#fff" />
                    <Text style={styles.deleteBtnText}>Delete Realtor</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    gap: 12,
    ...Shadow.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  name: { ...Typography.label, color: Colors.textPrimary },
  email: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
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
  pageBtnTextDisabled: { color: Colors.textMuted },
  pageInfo: { ...Typography.bodySm, color: Colors.textSecondary },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginTop: 12 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.h3, color: Colors.textPrimary },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { ...Typography.bodySm, color: Colors.textSecondary },
  infoValue: { ...Typography.bodySm, color: Colors.textPrimary, fontWeight: "600", flex: 1, textAlign: "right" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.error,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginTop: 24,
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
