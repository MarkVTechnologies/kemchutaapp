// ─────────────────────────────────────────────────────────────────────────────
// GallerySwiper — Horizontal paging image gallery for estate detail
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
} from "react-native";
import { Image } from "expo-image";
import { Colors, Radius } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface Props {
  images: string[];
  height?: number;
}

export function GallerySwiper({ images, height = 320 }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  if (images.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No images available</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(item, i) => `${i}-${item}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height, backgroundColor: Colors.ink200 }}
            contentFit="cover"
            transition={300}
          />
        )}
      />

      {/* Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {index + 1} / {images.length}
        </Text>
      </View>

      {/* Dots */}
      {images.length > 1 ? (
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : null]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    width: "100%",
    backgroundColor: Colors.ink100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  counter: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  dotsRow: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#fff",
  },
});
