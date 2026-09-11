// ─────────────────────────────────────────────────────────────────────────────
// Estate Detail — Gallery, payment plans, amenities, neighborhood, map, CTA
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { Estate } from "@/types";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { GallerySwiper } from "@/components/features/GallerySwiper";
import { PlotMap } from "@/components/features/PlotMap";
import {
  BookInspectionSheet,
  BookInspectionSheetRef,
} from "@/components/features/BookInspectionSheet";
import {
  formatNaira,
  getAllImages,
  getEstateName,
  getEstateDescription,
  flattenNamed,
} from "@/utils/estate";
import { Colors, Typography, Radius, Shadow } from "@/constants/theme";
import { ChatWidget } from "@/components/features/ChatWidget";

type EstateResponse = Estate | { estate: Estate } | { data: Estate };
const normalize = (d: any): Estate =>
  d?.estate?._id ? d.estate : d?.data?._id ? d.data : d;

export default function EstateDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BookInspectionSheetRef>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["estate", slug],
    queryFn: () => api.get<EstateResponse>(API.estates.bySlug(slug!)),
    enabled: !!slug,
  });

  const estate = data ? normalize(data) : null;

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }
  if (isError || !estate) {
    return (
      <View style={styles.loading}>
        <MaterialIcons
          name="error-outline"
          size={42}
          color={Colors.textMuted}
        />
        <Text style={styles.errorTitle}>Estate not found</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.retryBtn,
            { backgroundColor: "transparent", marginTop: 8 },
          ]}
        >
          <Text style={[styles.retryText, { color: Colors.brand }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const images = getAllImages(estate);
  const name = getEstateName(estate);
  const description = getEstateDescription(estate);
  const amenities = flattenNamed(estate.amenities);
  const neighborhood = flattenNamed(estate.neighborhood);
  const plans = Array.isArray(estate.paymentPlan) ? estate.paymentPlan : [];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${name} on Kemchuta Homes — premium plots from ${formatNaira(estate.price)}.`,
      });
    } catch {}
  };
  const handleBook = () => sheetRef.current?.present(estate);
  const handleSubscribe = () =>
    router.push(`/subscription/new?estateSlug=${estate.slug}` as any);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Gallery */}
        <View>
          <GallerySwiper images={images} height={340} />
          <View style={[styles.topNav, { top: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={handleShare} style={styles.iconBtn} hitSlop={8}>
              <MaterialIcons name="share" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Title block */}
        <FadeInView>
          <View style={styles.titleBlock}>
            <View style={styles.chipRow}>
              {estate.location ? (
                <View style={styles.locationChip}>
                  <MaterialIcons
                    name="location-on"
                    size={13}
                    color={Colors.brand}
                  />
                  <Text style={styles.locationText}>{estate.location}</Text>
                </View>
              ) : null}
              {estate.purpose ? (
                <View style={styles.greyChip}>
                  <Text style={styles.greyChipText}>{estate.purpose}</Text>
                </View>
              ) : null}
              {estate.sqm ? (
                <View style={styles.greyChip}>
                  <Text style={styles.greyChipText}>{estate.sqm}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.name}>{name}</Text>

            {estate.address ? (
              <View style={styles.addressRow}>
                <MaterialIcons
                  name="place"
                  size={15}
                  color={Colors.textMuted}
                />
                <Text style={styles.address}>{estate.address}</Text>
              </View>
            ) : null}

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Starting from</Text>
                <Text style={styles.price}>{formatNaira(estate.price)}</Text>
              </View>
              {estate.title ? (
                <View style={styles.docBadge}>
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color={Colors.brand}
                  />
                  <Text style={styles.docText}>{estate.title}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </FadeInView>

        {/* Description */}
        {description ? (
          <FadeInView delay={80}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this estate</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </FadeInView>
        ) : null}

        {/* Payment plans */}
        {plans.length > 0 ? (
          <FadeInView delay={120}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Plans</Text>
              <View style={{ gap: 10 }}>
                {plans.map((p, i) => (
                  <View key={i} style={[styles.planCard, Shadow.card]}>
                    <View style={styles.planHeader}>
                      <View style={styles.planSizeBadge}>
                        <Text style={styles.planSizeText}>{p.plot}</Text>
                      </View>
                      <Text style={styles.planPrice}>
                        {formatNaira(p.outright)}
                      </Text>
                    </View>
                    {p.initialDeposit ? (
                      <View style={styles.planDeposit}>
                        <MaterialIcons
                          name="payments"
                          size={14}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.planDepositText}>
                          Initial deposit: {p.initialDeposit}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>
        ) : null}

        {/* Amenities */}
        {amenities.length > 0 ? (
          <FadeInView delay={160}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.tagWrap}>
                {amenities.map((a, i) => (
                  <View key={i} style={styles.amenityTag}>
                    <MaterialIcons
                      name="check-circle"
                      size={14}
                      color={Colors.brand}
                    />
                    <Text style={styles.tagText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>
        ) : null}

        {/* Neighborhood */}
        {neighborhood.length > 0 ? (
          <FadeInView delay={200}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nearby Landmarks</Text>
              <View style={styles.tagWrap}>
                {neighborhood.map((n, i) => (
                  <View key={i} style={styles.landmarkTag}>
                    <MaterialIcons
                      name="near-me"
                      size={13}
                      color={Colors.brand700}
                    />
                    <Text style={styles.tagText}>{n}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>
        ) : null}

        {/* Estate layout map (only present when the backend provides one) */}
        {estate.sytemap ? (
          <FadeInView delay={240}>
            <View style={[styles.section, { paddingHorizontal: 0 }]}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
                {name} Layout
              </Text>
              <PlotMap estate={estate} />
            </View>
          </FadeInView>
        ) : null}
      </ScrollView>

      {/* Bottom CTA bar */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.ctaPriceRow}>
          <Text style={styles.ctaPriceLabel}>From</Text>
          <Text style={styles.ctaPrice}>{formatNaira(estate.price)}</Text>
        </View>
        <View style={styles.ctaButtonRow}>
          <View style={{ flex: 1 }}>
            <Button
              label="Book Inspection"
              onPress={handleBook}
              variant="outline"
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Subscribe Now"
              onPress={handleSubscribe}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </View>
      <ChatWidget bottomOffset={120} />
      <BookInspectionSheet ref={sheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    gap: 8,
  },
  errorTitle: { ...Typography.h3, color: Colors.textPrimary, marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  retryText: { color: "#fff", fontWeight: "700" },

  topNav: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  titleBlock: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  chipRow: { flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.brand50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  locationText: {
    color: Colors.brand700,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  greyChip: {
    backgroundColor: Colors.ink100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  greyChipText: {
    color: Colors.ink700,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  name: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 32,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },
  address: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1 },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabel: { ...Typography.caption, color: Colors.textMuted },
  price: { ...Typography.h1, color: Colors.brand, fontWeight: "800" },
  docBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.brand50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    maxWidth: 150,
  },
  docText: { fontSize: 11, fontWeight: "700", color: Colors.brand700 },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
    fontWeight: "800",
  },
  description: {
    ...Typography.bodyLg,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // Payment plan card
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planSizeBadge: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planSizeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planPrice: { ...Typography.h3, color: Colors.brand, fontWeight: "800" },
  planDeposit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  planDepositText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  // Tags
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brand50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  landmarkTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.ink100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  tagText: { fontSize: 12, fontWeight: "700", color: Colors.textPrimary },

  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  ctaPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  ctaButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  ctaPriceLabel: { ...Typography.caption, color: Colors.textMuted },
  ctaPrice: { ...Typography.h3, color: Colors.brand, fontWeight: "800" },
});
