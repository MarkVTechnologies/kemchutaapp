import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Radius, Typography } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info" | "warning";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (config: ToastConfig | string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

// ── Style map ─────────────────────────────────────────────────────────────────
const TOAST_STYLE: Record<ToastType, { bg: string; text: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  success: { bg: Colors.success,  text: "#fff", icon: "check-circle" },
  error:   { bg: Colors.error,    text: "#fff", icon: "error-outline" },
  warning: { bg: Colors.warning,  text: "#fff", icon: "warning-amber" },
  info:    { bg: Colors.brand,    text: "#fff", icon: "info-outline" },
};

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<Required<ToastConfig>>({
    message: "",
    type: "info",
    duration: 3000,
  });
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [translateY, opacity]);

  const showToast = useCallback(
    (input: ToastConfig | string) => {
      const cfg = typeof input === "string" ? { message: input } : input;
      const resolved: Required<ToastConfig> = {
        message: cfg.message,
        type: cfg.type ?? "info",
        duration: cfg.duration ?? 3000,
      };

      if (timerRef.current) clearTimeout(timerRef.current);
      setConfig(resolved);
      setVisible(true);
      translateY.setValue(100);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(hide, resolved.duration);
    },
    [translateY, opacity, hide],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const meta = TOAST_STYLE[config.type];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: meta.bg, bottom: insets.bottom + (Platform.OS === "ios" ? 100 : 80) },
            { transform: [{ translateY }], opacity },
          ]}
          pointerEvents="box-none"
        >
          <MaterialIcons name={meta.icon} size={20} color={meta.text} />
          <Text style={[styles.message, { color: meta.text }]} numberOfLines={2}>
            {config.message}
          </Text>
          <Pressable onPress={hide} hitSlop={12}>
            <MaterialIcons name="close" size={18} color={meta.text} />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  return useContext(ToastContext);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    ...Typography.bodySm,
    fontWeight: "600",
  },
});
