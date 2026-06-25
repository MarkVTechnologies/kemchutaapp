import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSegments } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { Colors, Radius, Shadow, Typography } from "@/constants/theme";

type Category = "Bug Report" | "Suggestion" | "General";

const CATEGORIES: { label: Category; icon: string }[] = [
  { label: "Bug Report", icon: "🐛" },
  { label: "Suggestion", icon: "💡" },
  { label: "General", icon: "💬" },
];

export function FeedbackButton() {
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<Category>("Bug Report");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const clientUser = useAuthStore((s) => s.clientUser);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Hide during loading or on auth screens
  if (!isHydrated || segments[0] === "(auth)") return null;

  const currentUser = user ?? clientUser;

  const open = () => {
    setSubmitted(false);
    setMessage("");
    setCategory("Bug Report");
    setVisible(true);
  };

  const close = () => {
    if (submitting) return;
    setVisible(false);
  };

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const name = currentUser
        ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
          "Tester"
        : "Anonymous Tester";
      const email = currentUser?.email ?? "tester@kemchutahomesltd.com";
      await api.post(API.contact.submit, {
        name,
        email,
        subject: `[BETA] ${category}`,
        message: trimmed,
      });
      setSubmitted(true);
      setTimeout(() => {
        setVisible(false);
        setSubmitted(false);
      }, 2200);
    } catch {
      // Fail silently — don't block testers from using the app
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={open}
        activeOpacity={0.82}
        accessibilityLabel="Send feedback"
        accessibilityRole="button"
      >
        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={close} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetWrapper}
          pointerEvents="box-none"
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {submitted ? (
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={52}
                  color={Colors.success}
                />
                <Text style={styles.successText}>
                  Feedback received — thanks!
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Send Feedback</Text>
                <Text style={styles.subtitle}>
                  Help us improve before launch
                </Text>

                <Text style={styles.label}>Category</Text>
                <View style={styles.chips}>
                  {CATEGORIES.map(({ label, icon }) => (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.chip,
                        category === label && styles.chipActive,
                      ]}
                      onPress={() => setCategory(label)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === label && styles.chipTextActive,
                        ]}
                      >
                        {icon} {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>What happened?</Text>
                <TextInput
                  style={styles.textArea}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe the issue or idea in as much detail as you like…"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={1000}
                  autoFocus
                />
                <Text style={styles.charCount}>{message.length}/1000</Text>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!message.trim() || submitting) && styles.submitBtnDisabled,
                  ]}
                  onPress={submit}
                  disabled={!message.trim() || submitting}
                  activeOpacity={0.82}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Send Feedback</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    bottom: 88,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9000,
    ...Shadow.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius["2xl"],
    borderTopRightRadius: Radius["2xl"],
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.ink200,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandLight,
  },
  chipText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  chipTextActive: {
    color: Colors.brand,
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    height: 120,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitText: {
    ...Typography.label,
    color: "#fff",
    fontSize: 15,
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
  },
  successText: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: "center",
  },
});
