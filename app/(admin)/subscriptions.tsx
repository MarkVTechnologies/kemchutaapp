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

type SubStatus =
  | "pending"
  | "confirmed"
  | "partial_paid"
  | "outright_paid"
  | "inst_1_paid"
  | "inst_2_paid"
  | "inst_3_paid"
  | "inst_4_paid"
  | "inst_5_paid"
  | "inst_6_paid"
  | "completed"
  | "allocated"
  | "rejected";

interface Subscription {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  estateName?: string;
  plotType?: string;
  totalAmount?: number;
  paymentPlan?: string;
  numberOfPlots?: number;
  referenceNumber?: string;
  status: SubStatus;
  createdAt: string;
}

interface SubsListResp {
  subscriptions: Subscription[];
  total: number;
  pages?: number;
}

const ALL_STATUSES: SubStatus[] = [
  "pending", "confirmed", "partial_paid", "outright_paid",
  "inst_1_paid", "inst_2_paid", "inst_3_paid", "inst_4_paid", "inst_5_paid", "inst_6_paid",
  "completed", "allocated", "rejected",
];

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:       { bg: Colors.warningBg,  text: Colors.warning },
  confirmed:     { bg: Colors.successBg,  text: Colors.success },
  completed:     { bg: Colors.successBg,  text: Colors.success },
  allocated:     { bg: Colors.infoBg,     text: Colors.info },
  rejected:      { bg: Colors.errorBg,    text: Colors.error },
  partial_paid:  { bg: Colors.infoBg,     text: Colors.info },
  outright_paid: { bg: Colors.successBg,  text: Colors.success },
};
function statusStyle(s: SubStatus) {
  return STATUS_STYLE[s] ?? { bg: "#F0F0F3", text: Colors.textSecondary };
}

const N = (v?: number) =>
  v != null ? `₦${v.toLocaleString("en-NG")}` : "—";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

const FILTER_TABS = ["all", "pending", "confirmed", "completed", "rejected"] as const;

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;

  const { data, isLoading, isFetching, refetch } = useQuery<SubsListResp>({
    queryKey: ["admin-subscriptions-mgmt", page, search, statusFilter],
    queryFn: () => api.get<SubsListResp>(API.subscriptions.list, params),
    staleTime: 1000 * 60 * 2,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubStatus }) =>
      api.patch(API.subscriptions.updateStatus(id), { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions-mgmt"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      setSelected((s) => s ? { ...s, status: vars.status } : s);
      setStatusPickerOpen(false);
    },
    onError: () => Alert.alert("Error", "Could not update status."),
  });

  const onSearchCommit = useCallback(() => { setPage(1); refetch(); }, [refetch]);

  const subs = data?.subscriptions ?? [];
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
          <Text style={styles.headerTitle}>Manage Subscriptions</Text>
          <Text style={styles.headerSub}>{total} total subscriptions</Text>
        </View>
        {isFetching && !isLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
      </LinearGradient>

      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search client name or email..."
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
          {FILTER_TABS.map((f) => (
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
      ) : subs.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="receipt-long" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No subscriptions found</Text>
        </View>
      ) : (
        <FlatList
          data={subs}
          keyExtractor={(s) => s._id}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const ss = statusStyle(item.status);
            return (
              <Pressable style={styles.card} onPress={() => setSelected(item)}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>
                      {item.firstName || item.lastName
                        ? `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim()
                        : item.email ?? "Unknown"}
                    </Text>
                    <Text style={styles.cardEstate} numberOfLines={1}>{item.estateName ?? "—"}</Text>
                    <Text style={styles.cardMeta}>
                      {item.plotType ?? ""}{item.numberOfPlots ? ` · ${item.numberOfPlots} plot(s)` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
                      <Text style={[styles.statusText, { color: ss.text }]}>
                        {item.status.replace(/_/g, " ")}
                      </Text>
                    </View>
                    {item.totalAmount != null && (
                      <Text style={styles.amount}>{N(item.totalAmount)}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.cardDate}>Submitted {fmt(item.createdAt)}</Text>
              </Pressable>
            );
          }}
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
                {selected.firstName || selected.lastName
                  ? `${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim()
                  : selected.email ?? "Subscription"}
              </Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <InfoRow label="Email" value={selected.email ?? "—"} />
              <InfoRow label="Phone" value={selected.phone ?? "—"} />
              <InfoRow label="Reference" value={selected.referenceNumber ?? "—"} />
              <InfoRow label="Estate" value={selected.estateName ?? "—"} />
              <InfoRow label="Plot Type" value={selected.plotType ?? "—"} />
              <InfoRow label="No. of Plots" value={selected.numberOfPlots != null ? String(selected.numberOfPlots) : "—"} />
              <InfoRow label="Payment Plan" value={selected.paymentPlan ?? "—"} />
              <InfoRow label="Total Amount" value={N(selected.totalAmount)} />
              <InfoRow label="Submitted" value={fmt(selected.createdAt)} />

              <Text style={styles.sectionLabel}>Current Status</Text>
              <View style={[styles.statusBadge, { alignSelf: "flex-start", backgroundColor: statusStyle(selected.status).bg }]}>
                <Text style={[styles.statusText, { color: statusStyle(selected.status).text }]}>
                  {selected.status.replace(/_/g, " ")}
                </Text>
              </View>

              <Pressable onPress={() => setStatusPickerOpen(true)} style={styles.changeStatusBtn}>
                <MaterialIcons name="edit" size={16} color={Colors.brand} />
                <Text style={styles.changeStatusText}>Change Status</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Status picker */}
      <Modal visible={statusPickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setStatusPickerOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <Pressable onPress={() => setStatusPickerOpen(false)} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            {ALL_STATUSES.map((s) => {
              const ss = statusStyle(s);
              const isSelected = selected?.status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => selected && statusMut.mutate({ id: selected._id, status: s })}
                  disabled={statusMut.isPending || isSelected}
                  style={[styles.statusOption, isSelected && { backgroundColor: ss.bg, borderColor: ss.text }]}
                >
                  <Text style={[styles.statusOptionText, isSelected && { color: ss.text, fontWeight: "700" }]}>
                    {s.replace(/_/g, " ")}
                  </Text>
                  {isSelected && <MaterialIcons name="check" size={16} color={ss.text} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
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
  cardTop: { flexDirection: "row", gap: 10 },
  cardName: { ...Typography.label, color: Colors.textPrimary },
  cardEstate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  cardMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  cardDate: { ...Typography.micro, color: Colors.textMuted, marginTop: 8 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { ...Typography.micro, fontWeight: "700", textTransform: "capitalize" },
  amount: { ...Typography.label, color: Colors.textPrimary },
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
  changeStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  changeStatusText: { ...Typography.label, color: Colors.brand },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  statusOptionText: { ...Typography.body, color: Colors.textSecondary, textTransform: "capitalize" },
});
