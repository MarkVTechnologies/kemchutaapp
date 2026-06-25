import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { Colors, Gradients, Typography, Radius, Shadow } from "@/constants/theme";

interface RoiSettings {
  roiPercentage?: number;
  minHoldDays?: number;
  maturityThreshold?: number;
}

interface Buy2SellLead {
  _id: string;
  clientName?: string;
  clientEmail?: string;
  estateName?: string;
  purchasePrice?: number;
  marketValue?: number;
  totalPaid?: number;
  roiAmount?: number;
  status?: string;
  isMature?: boolean;
  createdAt: string;
}

interface LeadsResp {
  leads: Buy2SellLead[];
  total?: number;
  pages?: number;
}

const N = (v?: number) => (v != null ? `₦${v.toLocaleString("en-NG")}` : "—");
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: Colors.successBg, text: Colors.success },
  mature:    { bg: Colors.infoBg,    text: Colors.info },
  paid_out:  { bg: "#F3F0FF",        text: Colors.brand },
  cancelled: { bg: Colors.errorBg,   text: Colors.error },
};
function leadStatusStyle(s?: string) {
  return STATUS_COLORS[s ?? ""] ?? { bg: Colors.warningBg, text: Colors.warning };
}

export default function Buy2SellScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"leads" | "roi">("leads");
  const [selected, setSelected] = useState<Buy2SellLead | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ROI settings
  const { data: roiData, isLoading: roiLoading } = useQuery<RoiSettings>({
    queryKey: ["admin-buy2sell-roi"],
    queryFn: () => api.get<RoiSettings>(API.buy2sell.roi),
    enabled: tab === "roi",
  });
  const [roiForm, setRoiForm] = useState<Partial<RoiSettings>>({});

  const updateRoiMut = useMutation({
    mutationFn: (body: Partial<RoiSettings>) => api.put(API.buy2sell.roi, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-buy2sell-roi"] }); Alert.alert("Saved", "ROI settings updated."); },
    onError: () => Alert.alert("Error", "Could not save ROI settings."),
  });

  // Leads
  const { data: leadsData, isLoading: leadsLoading, isFetching, refetch } = useQuery<LeadsResp>({
    queryKey: ["admin-buy2sell-leads"],
    queryFn: () => api.get<LeadsResp>(API.buy2sell.leads),
    enabled: tab === "leads",
  });

  const recordPaymentMut = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post(API.buy2sell.recordPayment(id), { amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-buy2sell-leads"] });
      setShowPaymentModal(false);
      setPaymentAmount("");
      Alert.alert("Recorded", "Payment recorded successfully.");
    },
    onError: () => Alert.alert("Error", "Could not record payment."),
  });

  const matureMut = useMutation({
    mutationFn: (id: string) => api.patch(API.buy2sell.mature(id), {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-buy2sell-leads"] });
      setSelected((s) => s ? { ...s, isMature: true, status: "mature" } : s);
    },
    onError: () => Alert.alert("Error", "Could not mark as mature."),
  });

  const payoutMut = useMutation({
    mutationFn: (id: string) => api.post(API.buy2sell.payout(id), {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-buy2sell-leads"] });
      setSelected((s) => s ? { ...s, status: "paid_out" } : s);
      Alert.alert("Done", "Payout processed.");
    },
    onError: () => Alert.alert("Error", "Could not process payout."),
  });

  const leads = leadsData?.leads ?? [];

  React.useEffect(() => {
    if (roiData) setRoiForm(roiData);
  }, [roiData]);

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
        <Text style={styles.headerTitle}>Buy2Sell</Text>
        {isFetching && !leadsLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["leads", "roi"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "roi" ? "ROI Settings" : "Leads"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "leads" ? (
        leadsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        ) : leads.length === 0 ? (
          <View style={styles.center}>
            <MaterialIcons name="trending-up" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No Buy2Sell leads yet</Text>
          </View>
        ) : (
          <FlatList
            data={leads}
            keyExtractor={(l) => l._id}
            contentContainerStyle={styles.list}
            refreshing={isFetching}
            onRefresh={refetch}
            renderItem={({ item }) => {
              const ss = leadStatusStyle(item.status);
              return (
                <Pressable style={styles.card} onPress={() => setSelected(item)}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{item.clientName ?? item.clientEmail ?? "—"}</Text>
                      {item.estateName && <Text style={styles.cardSub}>{item.estateName}</Text>}
                      <Text style={styles.cardDate}>{fmt(item.createdAt)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
                        <Text style={[styles.statusText, { color: ss.text }]}>{(item.status ?? "pending").replace(/_/g, " ")}</Text>
                      </View>
                      {item.purchasePrice != null && <Text style={styles.amount}>{N(item.purchasePrice)}</Text>}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.roiForm}>
          {roiLoading ? (
            <ActivityIndicator size="large" color={Colors.brand} />
          ) : (
            <>
              <Text style={styles.roiTitle}>ROI Configuration</Text>
              <Text style={styles.roiSub}>These settings apply to all new Buy2Sell leads.</Text>

              <FormField
                label="ROI Percentage (%)"
                value={roiForm.roiPercentage != null ? String(roiForm.roiPercentage) : ""}
                onChangeText={(v) => setRoiForm((f) => ({ ...f, roiPercentage: parseFloat(v) || undefined }))}
                keyboardType="decimal-pad"
              />
              <FormField
                label="Minimum Hold Days"
                value={roiForm.minHoldDays != null ? String(roiForm.minHoldDays) : ""}
                onChangeText={(v) => setRoiForm((f) => ({ ...f, minHoldDays: parseInt(v) || undefined }))}
                keyboardType="number-pad"
              />
              <FormField
                label="Maturity Threshold (₦)"
                value={roiForm.maturityThreshold != null ? String(roiForm.maturityThreshold) : ""}
                onChangeText={(v) => setRoiForm((f) => ({ ...f, maturityThreshold: parseFloat(v) || undefined }))}
                keyboardType="decimal-pad"
              />

              <Pressable
                onPress={() => updateRoiMut.mutate(roiForm)}
                disabled={updateRoiMut.isPending}
                style={styles.saveBtn}
              >
                {updateRoiMut.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save ROI Settings</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      {/* Lead detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selected.clientName ?? selected.clientEmail ?? "Lead"}
              </Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <InfoRow label="Email" value={selected.clientEmail ?? "—"} />
              <InfoRow label="Estate" value={selected.estateName ?? "—"} />
              <InfoRow label="Purchase Price" value={N(selected.purchasePrice)} />
              <InfoRow label="Market Value" value={N(selected.marketValue)} />
              <InfoRow label="Total Paid" value={N(selected.totalPaid)} />
              <InfoRow label="ROI Amount" value={N(selected.roiAmount)} />
              <InfoRow label="Status" value={(selected.status ?? "pending").replace(/_/g, " ")} />
              <InfoRow label="Created" value={fmt(selected.createdAt)} />

              <Text style={styles.sectionLabel}>Actions</Text>
              <View style={styles.actionsGrid}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => { setShowPaymentModal(true); }}
                >
                  <MaterialIcons name="payments" size={18} color={Colors.brand} />
                  <Text style={styles.actionBtnText}>Record Payment</Text>
                </Pressable>

                {!selected.isMature && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => {
                      Alert.alert("Mark Mature?", "This will mark the lead as mature and eligible for payout.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Confirm", onPress: () => matureMut.mutate(selected._id) },
                      ]);
                    }}
                    disabled={matureMut.isPending}
                  >
                    <MaterialIcons name="verified" size={18} color={Colors.success} />
                    <Text style={[styles.actionBtnText, { color: Colors.success }]}>Mark Mature</Text>
                  </Pressable>
                )}

                {selected.isMature && selected.status !== "paid_out" && (
                  <Pressable
                    style={[styles.actionBtn, { borderColor: Colors.brand }]}
                    onPress={() => {
                      Alert.alert("Process Payout?", `Pay out ROI to ${selected.clientName ?? "client"}?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Confirm", onPress: () => payoutMut.mutate(selected._id) },
                      ]);
                    }}
                    disabled={payoutMut.isPending}
                  >
                    {payoutMut.isPending ? <ActivityIndicator size="small" color={Colors.brand} /> : (
                      <>
                        <MaterialIcons name="send" size={18} color={Colors.brand} />
                        <Text style={styles.actionBtnText}>Process Payout</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Payment modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Pressable onPress={() => setShowPaymentModal(false)} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <FormField
              label="Amount (₦)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="e.g. 500000"
            />
            <Pressable
              onPress={() => {
                const amt = parseFloat(paymentAmount);
                if (!amt || !selected) return Alert.alert("Invalid", "Enter a valid amount.");
                recordPaymentMut.mutate({ id: selected._id, amount: amt });
              }}
              disabled={recordPaymentMut.isPending}
              style={styles.saveBtn}
            >
              {recordPaymentMut.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Record Payment</Text>
              )}
            </Pressable>
          </View>
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

function FormField({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  placeholder?: string;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder ?? ""}
        placeholderTextColor={Colors.textMuted}
      />
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
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", flex: 1 },
  tabs: { flexDirection: "row", backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brand },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  tabTextActive: { color: Colors.brand },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 14, ...Shadow.sm },
  cardTop: { flexDirection: "row", gap: 10 },
  cardName: { ...Typography.label, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  cardDate: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { ...Typography.micro, fontWeight: "700", textTransform: "capitalize" },
  amount: { ...Typography.label, color: Colors.textPrimary },
  roiForm: { padding: 20, gap: 16 },
  roiTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "700" },
  roiSub: { ...Typography.body, color: Colors.textSecondary },
  saveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
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
  actionsGrid: { gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
  },
  actionBtnText: { ...Typography.label, color: Colors.brand },
  formField: { gap: 6 },
  formLabel: { ...Typography.label, color: Colors.textSecondary },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
