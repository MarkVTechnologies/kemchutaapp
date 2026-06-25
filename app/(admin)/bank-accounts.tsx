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

interface BankAccount {
  _id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPrimary?: boolean;
  createdAt?: string;
}

interface AccountsResp {
  accounts?: BankAccount[];
}

const EMPTY = { bankName: "", accountName: "", accountNumber: "" };

export default function BankAccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const { data, isLoading, isFetching, refetch } = useQuery<AccountsResp>({
    queryKey: ["admin-bank-accounts"],
    queryFn: () => api.get<AccountsResp>(API.bankAccounts.list),
    staleTime: 1000 * 60 * 5,
  });

  const createMut = useMutation({
    mutationFn: (body: typeof EMPTY) => api.post<BankAccount>(API.bankAccounts.create, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bank-accounts"] }); closeForm(); },
    onError: () => Alert.alert("Error", "Could not create bank account."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<BankAccount> }) =>
      api.put(API.bankAccounts.update(id), body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-bank-accounts"] }); closeForm(); },
    onError: () => Alert.alert("Error", "Could not update bank account."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(API.bankAccounts.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bank-accounts"] }),
    onError: () => Alert.alert("Error", "Could not delete bank account."),
  });

  const setPrimaryMut = useMutation({
    mutationFn: (id: string) => api.put(API.bankAccounts.update(id), { isPrimary: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bank-accounts"] }),
    onError: () => Alert.alert("Error", "Could not set primary account."),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormModal(true); };
  const openEdit = (a: BankAccount) => { setEditing(a); setForm({ bankName: a.bankName, accountName: a.accountName, accountNumber: a.accountNumber }); setFormModal(true); };
  const closeForm = () => { setFormModal(false); setEditing(null); setForm(EMPTY); };

  const handleSave = () => {
    if (!form.bankName.trim() || !form.accountName.trim() || !form.accountNumber.trim()) {
      return Alert.alert("Required", "All fields are required.");
    }
    if (editing) updateMut.mutate({ id: editing._id, body: form });
    else createMut.mutate(form);
  };

  const handleDelete = (a: BankAccount) => {
    Alert.alert("Delete Account", `Remove "${a.bankName}" account ending ...${a.accountNumber.slice(-4)}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(a._id) },
    ]);
  };

  const accounts = data?.accounts ?? (Array.isArray(data) ? (data as BankAccount[]) : []);
  const isSaving = createMut.isPending || updateMut.isPending;

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
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <Pressable onPress={openCreate} style={styles.addBtn}>
          <MaterialIcons name="add" size={20} color="#fff" />
        </Pressable>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : accounts.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="account-balance" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No bank accounts yet</Text>
          <Pressable onPress={openCreate} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Add Account</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(a) => a._id}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={[styles.card, item.isPrimary && styles.cardPrimary]}>
              <View style={styles.cardHeader}>
                <View style={styles.bankIcon}>
                  <MaterialIcons name="account-balance" size={20} color={item.isPrimary ? Colors.brand : Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.bankName}>{item.bankName}</Text>
                    {item.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.accountName}>{item.accountName}</Text>
                  <Text style={styles.accountNumber}>{item.accountNumber}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={8}>
                    <MaterialIcons name="edit" size={18} color={Colors.brand} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} style={styles.iconBtn} hitSlop={8} disabled={deleteMut.isPending}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
              {!item.isPrimary && (
                <Pressable
                  onPress={() => setPrimaryMut.mutate(item._id)}
                  disabled={setPrimaryMut.isPending}
                  style={styles.setPrimaryBtn}
                >
                  <Text style={styles.setPrimaryText}>Set as Primary</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      {/* Form modal */}
      <Modal visible={formModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeForm}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? "Edit Account" : "Add Bank Account"}</Text>
            <Pressable onPress={closeForm} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <FormField label="Bank Name *" value={form.bankName} onChangeText={(v) => setForm((f) => ({ ...f, bankName: v }))} />
            <FormField label="Account Name *" value={form.accountName} onChangeText={(v) => setForm((f) => ({ ...f, accountName: v }))} />
            <FormField
              label="Account Number *"
              value={form.accountNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, accountNumber: v }))}
              keyboardType="number-pad"
            />
            <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{editing ? "Save Changes" : "Add Account"}</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  emptyBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 16, ...Shadow.sm, gap: 12 },
  cardPrimary: { borderWidth: 1.5, borderColor: Colors.brand },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bankName: { ...Typography.label, color: Colors.textPrimary },
  primaryBadge: { backgroundColor: Colors.brand, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  primaryText: { ...Typography.micro, color: "#fff", fontWeight: "700" },
  accountName: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 2 },
  accountNumber: { ...Typography.bodySm, color: Colors.textMuted, marginTop: 2, fontFamily: "monospace" },
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  setPrimaryBtn: {
    borderWidth: 1,
    borderColor: Colors.brand,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  setPrimaryText: { ...Typography.labelSm, color: Colors.brand },
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
  saveBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
