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

interface Branch {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  mapLink?: string;
  isHeadquarters?: boolean;
}

interface BranchesResp {
  branches?: Branch[];
}

const EMPTY: Partial<Branch> = { name: "", address: "", city: "", state: "", phone: "", email: "" };

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<Partial<Branch>>(EMPTY);

  const { data, isLoading, isFetching, refetch } = useQuery<BranchesResp>({
    queryKey: ["admin-branches"],
    queryFn: () => api.get<BranchesResp>(API.branches.list),
    staleTime: 1000 * 60 * 5,
  });

  const createMut = useMutation({
    mutationFn: (body: Partial<Branch>) => api.post<Branch>(API.branches.create, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-branches"] }); closeForm(); },
    onError: () => Alert.alert("Error", "Could not create branch."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Branch> }) =>
      api.put(API.branches.update(id), body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-branches"] }); closeForm(); },
    onError: () => Alert.alert("Error", "Could not update branch."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(API.branches.delete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-branches"] }),
    onError: () => Alert.alert("Error", "Could not delete branch."),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormModal(true); };
  const openEdit = (b: Branch) => { setEditing(b); setForm(b); setFormModal(true); };
  const closeForm = () => { setFormModal(false); setEditing(null); setForm(EMPTY); };

  const handleSave = () => {
    if (!form.name?.trim()) return Alert.alert("Required", "Branch name is required.");
    if (editing) updateMut.mutate({ id: editing._id, body: form });
    else createMut.mutate(form);
  };

  const handleDelete = (b: Branch) => {
    Alert.alert("Delete Branch", `Remove "${b.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(b._id) },
    ]);
  };

  const branches = data?.branches ?? (Array.isArray(data) ? (data as Branch[]) : []);
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
        <Text style={styles.headerTitle}>Contact Info</Text>
        <Pressable onPress={openCreate} style={styles.addBtn}>
          <MaterialIcons name="add" size={20} color="#fff" />
        </Pressable>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : branches.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="location-city" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No branches yet</Text>
          <Pressable onPress={openCreate} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Add First Branch</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {item.isHeadquarters && (
                      <View style={styles.hqBadge}>
                        <Text style={styles.hqText}>HQ</Text>
                      </View>
                    )}
                  </View>
                  {(item.city || item.state) && (
                    <Text style={styles.cardSub}>{[item.city, item.state].filter(Boolean).join(", ")}</Text>
                  )}
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
              {item.address && (
                <View style={styles.metaRow}>
                  <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{item.address}</Text>
                </View>
              )}
              {item.phone && (
                <View style={styles.metaRow}>
                  <MaterialIcons name="phone" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{item.phone}</Text>
                </View>
              )}
              {item.email && (
                <View style={styles.metaRow}>
                  <MaterialIcons name="email" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{item.email}</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Create/Edit modal */}
      <Modal visible={formModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeForm}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? "Edit Branch" : "New Branch"}</Text>
            <Pressable onPress={closeForm} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <FormField label="Branch Name *" value={form.name ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
            <FormField label="Address" value={form.address ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
            <FormField label="City" value={form.city ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
            <FormField label="State" value={form.state ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, state: v }))} />
            <FormField label="Phone" value={form.phone ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
            <FormField label="Email" value={form.email ?? ""} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" />

            <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{editing ? "Save Changes" : "Create Branch"}</Text>
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
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
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
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 16, ...Shadow.sm, gap: 8 },
  cardHeader: { flexDirection: "row", gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { ...Typography.label, color: Colors.textPrimary, flex: 1 },
  hqBadge: { backgroundColor: Colors.brand, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  hqText: { ...Typography.micro, color: "#fff", fontWeight: "700" },
  cardSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
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
