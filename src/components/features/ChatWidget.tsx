// ─────────────────────────────────────────────────────────────────────────────
// ChatWidget — Floating button + full-screen AI chat modal
// Sends { message, history } to API.ai.chat, expects { reply } back.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

const SUGGESTIONS = [
  "Show me estates in Lagos",
  "What's the cheapest plot?",
  "How does the payment plan work?",
  "Can I book an inspection?",
];

const WELCOME_TEXT =
  "Hi! I'm the KHL Assistant. I can help you find the right estate, explain payment plans, or guide you through booking an inspection. What would you like to know?";

interface Props {
  /** Optional bottom offset so the FAB sits above tab bars etc. */
  bottomOffset?: number;
}

export function ChatWidget({ bottomOffset = 90 }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  // Gentle pulse on the floating button when closed
  useEffect(() => {
    if (open) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (message: string) =>
      api.post<{ reply?: string; message?: string }>(API.ai.chat, {
        message,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    onSuccess: (res) => {
      const reply =
        res?.reply ?? res?.message ?? "I'm not sure how to help with that yet.";
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Connection issue. Please try again.";
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Sorry, ${msg.toLowerCase()}`,
          createdAt: Date.now(),
        },
      ]);
    },
  });

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setOpen(true);
  };

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || mutation.isPending) return;
    setInput("");
    const newMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, newMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    mutation.mutate(value);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      <Animated.View
        style={[
          styles.fabWrap,
          { bottom: bottomOffset, transform: [{ scale: pulse }] },
        ]}
        pointerEvents="box-none"
      >
        <Pressable onPress={handleOpen} style={styles.fabPressable}>
          <LinearGradient colors={Gradients.purple} style={styles.fab}>
            <MaterialIcons name="chat" size={26} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Full-screen chat modal */}
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          {/* Header */}
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 12 }]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>KHL Assistant</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Powered by AI</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
                {messages.length > 0 ? (
                  <Pressable
                    onPress={handleClear}
                    style={styles.headerBtn}
                    hitSlop={6}
                  >
                    <MaterialIcons name="restart-alt" size={20} color="#fff" />
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setOpen(false)}
                  style={styles.headerBtn}
                  hitSlop={6}
                >
                  <MaterialIcons name="close" size={22} color="#fff" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          {/* Conversation */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Welcome card */}
              <View style={styles.welcomeCard}>
                <View style={styles.welcomeIcon}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={20}
                    color={Colors.brand}
                  />
                </View>
                <Text style={styles.welcomeText}>{WELCOME_TEXT}</Text>
              </View>

              {/* Suggestion chips (only before user starts chatting) */}
              {messages.length === 0 ? (
                <View style={styles.suggestionsWrap}>
                  <Text style={styles.suggestionsLabel}>Try asking</Text>
                  <View style={styles.suggestionsRow}>
                    {SUGGESTIONS.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => handleSend(s)}
                        style={styles.suggestion}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Messages */}
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubbleWrap,
                    m.role === "user"
                      ? styles.bubbleWrapUser
                      : styles.bubbleWrapAi,
                  ]}
                >
                  {m.role === "assistant" ? (
                    <View style={styles.aiAvatar}>
                      <MaterialIcons
                        name="auto-awesome"
                        size={14}
                        color="#fff"
                      />
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.bubble,
                      m.role === "user" ? styles.bubbleUser : styles.bubbleAi,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        m.role === "user" ? styles.bubbleTextUser : null,
                      ]}
                    >
                      {m.content}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Typing indicator */}
              {mutation.isPending ? (
                <View style={[styles.bubbleWrap, styles.bubbleWrapAi]}>
                  <View style={styles.aiAvatar}>
                    <MaterialIcons name="auto-awesome" size={14} color="#fff" />
                  </View>
                  <View
                    style={[
                      styles.bubble,
                      styles.bubbleAi,
                      styles.typingBubble,
                    ]}
                  >
                    <TypingDots />
                  </View>
                </View>
              ) : null}

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Input bar */}
            <View
              style={[
                styles.inputBar,
                { paddingBottom: Math.max(insets.bottom, 10) },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Ask anything about KHL..."
                placeholderTextColor={Colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
                blurOnSubmit={false}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => handleSend()}
                disabled={!input.trim() || mutation.isPending}
                style={[
                  styles.sendBtn,
                  !input.trim() || mutation.isPending
                    ? styles.sendBtnDisabled
                    : null,
                ]}
              >
                <MaterialIcons name="arrow-upward" size={20} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

// ── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots() {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(300 - delay),
        ]),
      ).start();
    animate(d1, 0);
    animate(d2, 150);
    animate(d3, 300);
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 4, paddingVertical: 4 }}>
      <Animated.View style={[typing.dot, { opacity: d1 }]} />
      <Animated.View style={[typing.dot, { opacity: d2 }]} />
      <Animated.View style={[typing.dot, { opacity: d3 }]} />
    </View>
  );
}
const typing = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brand },
});

const styles = StyleSheet.create({
  // Floating button
  fabWrap: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
  },
  fabPressable: { width: "100%", height: "100%" },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },

  // Modal
  modalRoot: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  headerTitle: { ...Typography.h3, color: "#fff", fontWeight: "800" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  statusText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  // Conversation
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },

  welcomeCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: Colors.brand50,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 16,
  },
  welcomeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    ...Typography.bodySm,
    color: Colors.brand900,
    flex: 1,
    lineHeight: 20,
  },

  suggestionsWrap: { marginBottom: 16 },
  suggestionsLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestion: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: { fontSize: 12, fontWeight: "600", color: Colors.brand700 },

  bubbleWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 10,
  },
  bubbleWrapUser: { justifyContent: "flex-end" },
  bubbleWrapAi: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: Colors.brand,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  typingBubble: { paddingVertical: 14 },
  bubbleText: { ...Typography.body, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 22,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
