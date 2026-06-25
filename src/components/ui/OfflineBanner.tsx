import React, { useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Colors, Typography } from "@/constants/theme";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-60)).current;
  const prevOnline = useRef(true);

  useEffect(() => {
    const wasOnline = prevOnline.current;
    prevOnline.current = isOnline;

    if (!isOnline) {
      // Slide down to show
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else if (!wasOnline && isOnline) {
      // Was offline, now online — hide after brief "restored" flash
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, translateY]);

  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          top: insets.top,
          backgroundColor: isOnline ? Colors.success : "#1a1a2e",
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <MaterialIcons
        name={isOnline ? "wifi" : "wifi-off"}
        size={16}
        color="#fff"
      />
      <Text style={styles.text}>
        {isOnline ? "Connection restored" : "No internet connection"}
      </Text>
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
  },
  text: {
    ...Typography.labelSm,
    color: "#fff",
  },
});
