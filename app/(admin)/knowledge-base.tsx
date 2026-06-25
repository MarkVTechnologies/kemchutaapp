import React, { useState, useEffect } from "react";
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
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { Colors, Gradients, Typography, Radius, Shadow } from "@/constants/theme";

interface CompanyInfo {
  name?: string;
  tagline?: string;
  about?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}
interface Faq {
  _id: string;
  question: string;
  answer: string;
  isActive?: boolean;
  order?: number;
}
interface Notice {
  _id: string;
  title: string;
  body?: string;
  message?: string;
  expiresAt?: string;
  createdAt?: string;
}
interface KBData {
  companyInfo?: CompanyInfo;
  faqs?: Faq[];
  notices?: Notice[];
}

export default function KnowledgeBaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"company" | "faqs" | "notices">("company");

  const { data, isLoading, isFetching, refetch } = useQuery<KBData>({
    queryKey: ["admin-knowledge-base"],
    queryFn: () => api.get<KBData>(API.knowledgeBase.get),
    staleTime: 1000 * 60 * 5,
  });

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
        <Text style={styles.headerTitle}>AI Knowledge Base</Text>
        {isFetching && !isLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["company", "faqs", "notices"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "company" ? "Company Info" : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : tab === "company" ? (
        <CompanyInfoTab data={data?.companyInfo} qc={qc} />
      ) : tab === "faqs" ? (
        <FaqsTab faqs={data?.faqs ?? []} qc={qc} refetch={refetch} />
      ) : (
        <NoticesTab notices={data?.notices ?? []} qc={qc} refetch={refetch} />
      )}
    </View>
  );
}

// ── Company Info ──────────────────────────────────────────────────────────────
function CompanyInfoTab({ data, qc }: { data?: CompanyInfo; qc: any }) {
  const [form, setForm] = useState<CompanyInfo>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  const updateMut = useMutation({
    mutationFn: (body: CompanyInfo) => api.put(API.knowledgeBase.updateCompanyInfo, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-knowledge-base"] }); Alert.alert("Saved", "Company info updated."); },
    onError: () => Alert.alert("Error", "Could not save company info."),
  });

  const field = (label: string, key: keyof CompanyInfo, multiline?: boolean, keyboardType?: any) => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && { minHeight: 80, textAlignVertical: "top" }]}
        value={form[key] ?? ""}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        multiline={multiline}
        keyboardType={keyboardType ?? "default"}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      {field("Company Name", "name")}
      {field("Tagline", "tagline")}
      {field("About", "about", true)}
      {field("Address", "address")}
      {field("Phone", "phone", false, "phone-pad")}
      {field("Email", "email", false, "email-address")}
      {field("Website", "website", false, "url")}
      <Pressable onPress={() => updateMut.mutate(form)} disabled={updateMut.isPending} style={styles.saveBtn}>
        {updateMut.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Company Info</Text>}
      </Pressable>
    </ScrollView>
  );
}

// ── FAQs ─────────────────────────────────────────────────────────────────────
function FaqsTab({ faqs, qc, refetch }: { faqs: Faq[]; qc: any; refetch: () => void }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });

  const addMut = useMutation({
    mutationFn: (body: typeof form) => api.post(API.knowledgeBase.addFaq, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-knowledge-base"] }); setModal(false); setForm({ question: "", answer: "" }); },
    onError: () => Alert.alert("Error", "Could not add FAQ."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Faq> }) =>
      api.put(API.knowledgeBase.updateFaq(id), body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-knowledge-base"] }); setModal(false); setEditing(null); },
    onError: () => Alert.alert("Error", "Could not update FAQ."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(API.knowledgeBase.deleteFaq(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-knowledge-base"] }),
    onError: () => Alert.alert("Error", "Could not delete FAQ."),
  });

  const openAdd = () => { setEditing(null); setForm({ question: "", answer: "" }); setModal(true); };
  const openEdit = (f: Faq) => { setEditing(f); setForm({ question: f.question, answer: f.answer }); setModal(true); };

  const handleSave = () => {
    if (!form.question.trim() || !form.answer.trim()) return Alert.alert("Required", "Question and answer are required.");
    if (editing) updateMut.mutate({ id: editing._id, body: form });
    else addMut.mutate(form);
  };

  const isSaving = addMut.isPending || updateMut.isPending;

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={openAdd} style={styles.addRowBtn}>
        <MaterialIcons name="add" size={18} color={Colors.brand} />
        <Text style={styles.addRowText}>Add FAQ</Text>
      </Pressable>
      {faqs.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="help-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No FAQs yet</Text>
        </View>
      ) : (
        <FlatList
          data={faqs}
          keyExtractor={(f) => f._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.formLabel, { flex: 1 }]} numberOfLines={2}>{item.question}</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={8}>
                    <MaterialIcons name="edit" size={18} color={Colors.brand} />
                  </Pressable>
                  <Pressable
                    onPress={() => Alert.alert("Delete FAQ?", item.question, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(item._id) },
                    ])}
                    style={styles.iconBtn}
                    hitSlop={8}
                    disabled={deleteMut.isPending}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.faqAnswer} numberOfLines={3}>{item.answer}</Text>
              <View style={styles.faqFooter}>
                <Text style={styles.faqStatus}>{item.isActive !== false ? "Active" : "Inactive"}</Text>
                <Switch
                  value={item.isActive !== false}
                  onValueChange={(v) => updateMut.mutate({ id: item._id, body: { isActive: v } })}
                  trackColor={{ false: Colors.border, true: Colors.brand }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? "Edit FAQ" : "Add FAQ"}</Text>
            <Pressable onPress={() => setModal(false)} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Question *</Text>
              <TextInput
                style={styles.formInput}
                value={form.question}
                onChangeText={(v) => setForm((f) => ({ ...f, question: v }))}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Answer *</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 100, textAlignVertical: "top" }]}
                value={form.answer}
                onChangeText={(v) => setForm((f) => ({ ...f, answer: v }))}
                multiline
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? "Save" : "Add FAQ"}</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Notices ───────────────────────────────────────────────────────────────────
function NoticesTab({ notices, qc, refetch }: { notices: Notice[]; qc: any; refetch: () => void }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", expiresAt: "" });

  const addMut = useMutation({
    mutationFn: (body: typeof form) => api.post(API.knowledgeBase.addNotice, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-knowledge-base"] }); setModal(false); setForm({ title: "", message: "", expiresAt: "" }); },
    onError: () => Alert.alert("Error", "Could not add notice."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(API.knowledgeBase.deleteNotice(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-knowledge-base"] }),
    onError: () => Alert.alert("Error", "Could not delete notice."),
  });

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setModal(true)} style={styles.addRowBtn}>
        <MaterialIcons name="add" size={18} color={Colors.brand} />
        <Text style={styles.addRowText}>Add Notice</Text>
      </Pressable>
      {notices.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="notifications-none" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No notices yet</Text>
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(n) => n._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.formLabel, { flex: 1 }]}>{item.title}</Text>
                <Pressable
                  onPress={() => Alert.alert("Delete Notice?", item.title, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(item._id) },
                  ])}
                  style={styles.iconBtn}
                  hitSlop={8}
                  disabled={deleteMut.isPending}
                >
                  <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                </Pressable>
              </View>
              {(item.body || item.message) && (
                <Text style={styles.faqAnswer} numberOfLines={2}>{item.body ?? item.message}</Text>
              )}
              {item.expiresAt && (
                <Text style={styles.faqStatus}>Expires: {fmt(item.expiresAt)}</Text>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Notice</Text>
            <Pressable onPress={() => setModal(false)} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput style={styles.formInput} value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput style={[styles.formInput, { minHeight: 80, textAlignVertical: "top" }]} value={form.message} onChangeText={(v) => setForm((f) => ({ ...f, message: v }))} multiline placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Expires At (YYYY-MM-DD)</Text>
              <TextInput style={styles.formInput} value={form.expiresAt} onChangeText={(v) => setForm((f) => ({ ...f, expiresAt: v }))} placeholder="2026-12-31" placeholderTextColor={Colors.textMuted} />
            </View>
            <Pressable onPress={() => {
              if (!form.title.trim()) return Alert.alert("Required", "Title is required.");
              addMut.mutate(form);
            }} disabled={addMut.isPending} style={styles.saveBtn}>
              {addMut.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Add Notice</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
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
  tabText: { ...Typography.labelSm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.brand },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  addRowText: { ...Typography.label, color: Colors.brand },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 14, ...Shadow.sm, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  faqAnswer: { ...Typography.body, color: Colors.textSecondary, lineHeight: 20 },
  faqFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqStatus: { ...Typography.caption, color: Colors.textMuted },
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
