import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Typography } from "@/constants/theme";

// Only ever warns about a genuine, sustained outage. There is deliberately
// no "Connection restored" flash: the underlying network check is a network
// request itself, and the first one or two attempts right after a cold
// launch (before the OS radio/DNS have settled) routinely fail even on a
// perfectly fine connection — that made the "restored" flash appear on
// almost every app open, on both emulator and real devices.
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  // Hidden position must clear the status-bar inset as well as the banner
  // itself: with edge-to-edge the inset alone can exceed a fixed offset,
  // leaving the "hidden" banner peeking out under the clock.
  const hiddenY = -(insets.top + 80);
  const translateY = useRef(new Animated.Value(hiddenY)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? hiddenY : 0,
      useNativeDriver: true,
      bounciness: isOnline ? 0 : 4,
    }).start();
  }, [isOnline, translateY, hiddenY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          top: insets.top,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <MaterialIcons name="wifi-off" size={16} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9998,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a2e",
  },
  text: {
    ...Typography.labelSm,
    color: "#fff",
  },
});
