// ─────────────────────────────────────────────────────────────────────────────
// EstateSkeleton — Shimmer placeholder while estates load
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Radius, Spacing, Shadow } from "@/constants/theme";

const { width } = Dimensions.get("window");
const SHIMMER_WIDTH = width;

function Shimmer({ style }: { style?: object }) {
  const x = useRef(new Animated.Value(-SHIMMER_WIDTH)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(x, {
        toValue: SHIMMER_WIDTH,
        duration: 1400,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  return (
    <View style={[styles.shimmerBase, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX: x }] },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.5)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

export function EstateSkeleton() {
  return (
    <View style={[styles.card, Shadow.card]}>
      <Shimmer style={styles.image} />
      <View style={styles.content}>
        <Shimmer style={styles.titleLine} />
        <Shimmer style={styles.locationLine} />
        <View style={styles.footer}>
          <Shimmer style={styles.priceLine} />
          <Shimmer style={styles.badge} />
        </View>
      </View>
    </View>
  );
}

export function EstateSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <EstateSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerBase: { backgroundColor: Colors.ink100, overflow: "hidden" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: 180 },
  content: { padding: 16 },
  titleLine: { height: 18, width: "65%", borderRadius: 4, marginBottom: 10 },
  locationLine: { height: 12, width: "40%", borderRadius: 4, marginBottom: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLine: { height: 20, width: "35%", borderRadius: 4 },
  badge: { height: 22, width: 80, borderRadius: 11 },
});
