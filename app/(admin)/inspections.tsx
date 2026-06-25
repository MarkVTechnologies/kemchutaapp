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
import { Colors, Gradients, Typography, Radius, Shadow } from "@/constants/theme";

type InspStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Inspection {
  _id: string;
  clientName?: string;
  clientEmail?: string;
  phone?: string;
  estateName?: string;
  date?: string;
  status: InspStatus;
  notes?: string;
  createdAt: string;
}

interface InspListResp {
  inspections: Inspection[];
  total: number;
  pages?: number;
}

const STATUS_COLORS: Record<InspStatus, string> = {
  pending: Colors.warning,
  confirmed: Colors.success,
  cancelled: Colors.error,
  completed: Colors.info,
};
const STATUS_BG: Record<InspStatus, string> = {
  pending: Colors.warningBg,
  confirmed: Colors.successBg,
  cancelled: Colors.errorBg,
  completed: Colors.infoBg,
};
const ALL_STATUSES: InspStatus[] = ["pending", "confirmed", "cancelled", "completed"];

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InspectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InspStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [notesEdit, setNotesEdit] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;

  const { data, isLoading, isFetching, refetch } = useQuery<InspListResp>({
    queryKey: ["admin-inspections", page, search, statusFilter],
    queryFn: () => api.get<InspListResp>(API.inspections.list, params),
    staleTime: 1000 * 60 * 2,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InspStatus }) =>
      api.patch(API.inspections.updateStatus(id), { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-inspections"] });
      if (selected?._id === vars.id) setSelected((s) => s ? { ...s, status: vars.status } : s);
    },
    onError: () => Alert.alert("Error", "Could not update status."),
  });

  const notesMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(API.inspections.updateNotes(id), { notes }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-inspections"] });
      setSelected((s) => s ? { ...s, notes: vars.notes } : s);
      setEditingNotes(false);
    },
    onError: () => Alert.alert("Error", "Could not save notes."),
  });

  const onSearchCommit = useCallback(() => { setPage(1); refetch(); }, [refetch]);

  const inspections = data?.inspections ?? [];
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
          <Text style={styles.headerTitle}>Manage Inspections</Text>
          <Text style={styles.headerSub}>{total} total inspections</Text>
        </View>
        {isFetching && !isLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search client or estate..."
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(["all", ...ALL_STATUSES] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => { setStatusFilter(f as any); setPage(1); }}
              style={[styles.chip, statusFilter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, statusFilter === f && styles.chipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : inspections.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="calendar-today" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No inspections found</Text>
        </View>
      ) : (
        <FlatList
          data={inspections}
          keyExtractor={(i) => i._id}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelected(item)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardName}>{item.clientName ?? item.clientEmail ?? "Unknown"}</Text>
                  {item.estateName && <Text style={styles.cardEstate}>{item.estateName}</Text>}
                  <Text style={styles.cardDate}>
                    {item.date ? `Visit: ${fmt(item.date)}` : `Booked: ${fmt(item.createdAt)}`}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[item.status] }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </Pressable>
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

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selected.clientName ?? selected.clientEmail ?? "Inspection"}
              </Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
              <InfoRow label="Email" value={selected.clientEmail ?? "—"} />
              <InfoRow label="Phone" value={selected.phone ?? "—"} />
              <InfoRow label="Estate" value={selected.estateName ?? "—"} />
              <InfoRow label="Visit Date" value={fmt(selected.date)} />
              <InfoRow label="Booked" value={fmt(selected.createdAt)} />

              {/* Status updater */}
              <Text style={styles.sectionLabel}>Update Status</Text>
              <View style={styles.statusGrid}>
                {ALL_STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => statusMut.mutate({ id: selected._id, status: s })}
                    disabled={statusMut.isPending}
                    style={[
                      styles.statusOption,
                      selected.status === s && { backgroundColor: STATUS_BG[s], borderColor: STATUS_COLORS[s] },
                    ]}
                  >
                    {statusMut.isPending && selected.status !== s ? null : (
                      <Text style={[styles.statusOptionText, selected.status === s && { color: STATUS_COLORS[s], fontWeight: "700" }]}>
                        {s}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.sectionLabel}>Notes</Text>
              {editingNotes ? (
                <View style={styles.notesEditBox}>
                  <TextInput
                    style={styles.notesInput}
                    value={notesEdit}
                    onChangeText={setNotesEdit}
                    multiline
                    numberOfLines={4}
                    placeholder="Add internal notes..."
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                  />
                  <View style={styles.notesBtns}>
                    <Pressable onPress={() => setEditingNotes(false)} style={styles.notesCancelBtn}>
                      <Text style={styles.notesCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => notesMut.mutate({ id: selected._id, notes: notesEdit })}
                      disabled={notesMut.isPending}
                      style={styles.notesSaveBtn}
                    >
                      {notesMut.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.notesSaveText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => { setNotesEdit(selected.notes ?? ""); setEditingNotes(true); }}
                  style={styles.notesDisplay}
                >
                  <Text style={styles.notesText}>{selected.notes || "Tap to add notes..."}</Text>
                  <MaterialIcons name="edit" size={16} color={Colors.brand} />
                </Pressable>
              )}
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
  chips: { flexDirection: "row", gap: 8, paddingBottom: 4 },
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
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 14, ...Shadow.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardName: { ...Typography.label, color: Colors.textPrimary },
  cardEstate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  cardDate: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { ...Typography.micro, fontWeight: "700", textTransform: "capitalize" },
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
  modalTitle: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { ...Typography.bodySm, color: Colors.textSecondary },
  infoValue: { ...Typography.bodySm, color: Colors.textPrimary, fontWeight: "600", flex: 1, textAlign: "right" },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginTop: 8 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  statusOptionText: { ...Typography.bodySm, color: Colors.textSecondary, textTransform: "capitalize" },
  notesDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  notesEditBox: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.brand, overflow: "hidden" },
  notesInput: { padding: 12, minHeight: 100, fontSize: 14, color: Colors.textPrimary, textAlignVertical: "top" },
  notesBtns: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border },
  notesCancelBtn: { flex: 1, padding: 12, alignItems: "center" },
  notesCancelText: { ...Typography.label, color: Colors.textSecondary },
  notesSaveBtn: { flex: 1, padding: 12, alignItems: "center", backgroundColor: Colors.brand },
  notesSaveText: { ...Typography.label, color: "#fff" },
});
