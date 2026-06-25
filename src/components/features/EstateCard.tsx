import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Estate } from "@/types";
import { formatNaira, getFeaturedImage, getEstateName } from "@/utils/estate";
import { Colors, Typography, Radius, Shadow } from "@/constants/theme";

interface Props {
  estate: Estate;
}

export function EstateCard({ estate }: Props) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const imageUrl = getFeaturedImage(estate);
  const name = getEstateName(estate);

  const handlePress = () => {
    if (!estate.slug) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/estate/${estate.slug}` as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View
        style={[
          styles.card,
          Shadow.card,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {/* Image area */}
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.35)"]}
                style={styles.overlay}
              />
            </>
          ) : (
            <LinearGradient
              colors={[Colors.brand400, Colors.brand700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.placeholder}
            >
              <MaterialIcons
                name="landscape"
                size={42}
                color="rgba(255,255,255,0.7)"
              />
            </LinearGradient>
          )}

          <View style={styles.topRow}>
            {estate.location ? (
              <View style={styles.chip}>
                <MaterialIcons name="location-on" size={12} color="#fff" />
                <Text style={styles.chipText}>{estate.location}</Text>
              </View>
            ) : (
              <View />
            )}
            {estate.sqm ? (
              <View style={styles.sqmChip}>
                <Text style={styles.sqmText}>{estate.sqm}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Content */}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>

          {estate.address ? (
            <View style={styles.addressRow}>
              <MaterialIcons name="place" size={13} color={Colors.textMuted} />
              <Text style={styles.address} numberOfLines={1}>
                {estate.address}
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.price}>{formatNaira(estate.price)}</Text>
            </View>

            {estate.title ? (
              <View style={styles.titleBadge}>
                <MaterialIcons name="verified" size={12} color={Colors.brand} />
                <Text style={styles.titleText} numberOfLines={1}>
                  {estate.title}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: "hidden",
  },

  imageWrap: {
    width: "100%",
    height: 180,
    position: "relative",
    backgroundColor: Colors.ink100,
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  topRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  chipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sqmChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  sqmText: {
    color: Colors.brand700,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  body: { padding: 16 },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  address: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },

  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  priceLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  price: { ...Typography.h3, color: Colors.brand, fontWeight: "800" },

  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.brand50,
    borderRadius: Radius.full,
    maxWidth: 140,
  },
  titleText: { fontSize: 11, fontWeight: "700", color: Colors.brand700 },
});
