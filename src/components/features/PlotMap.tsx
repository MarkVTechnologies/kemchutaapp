// ─────────────────────────────────────────────────────────────────────────────
// EstateMap — single location pin (per-plot data not in current schema)
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import type { Estate, EstateLocation } from "@/types";
import { Colors, Typography, Radius, Shadow } from "@/constants/theme";

const LOCATION_COORDS: Record<EstateLocation, { lat: number; lng: number }> = {
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abuja: { lat: 9.0765, lng: 7.3986 },
  Asaba: { lat: 6.1996, lng: 6.6889 },
  Anambra: { lat: 6.221, lng: 7.0707 },
};

interface Props {
  estate: Estate;
}

export function PlotMap({ estate }: Props) {
  const center = LOCATION_COORDS[estate.location] ?? LOCATION_COORDS.Lagos;

  const region: Region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsCompass={false}
          toolbarEnabled={false}
        >
          <Marker coordinate={{ latitude: center.lat, longitude: center.lng }}>
            <View style={styles.pinOuter}>
              <View style={styles.pinInner}>
                <MaterialIcons name="apartment" size={16} color="#fff" />
              </View>
            </View>
          </Marker>
        </MapView>

        {/* Address overlay */}
        {estate.address ? (
          <View style={styles.addressCard}>
            <MaterialIcons name="place" size={16} color={Colors.brand} />
            <Text style={styles.addressText} numberOfLines={2}>
              {estate.address}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.noteRow}>
        <MaterialIcons name="info-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.noteText}>
          Exact plot positions are confirmed at site inspection.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20 },

  mapContainer: {
    height: 240,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: Colors.ink100,
    ...Shadow.card,
  },

  pinOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(112,12,235,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  addressCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: 10,
    ...Shadow.card,
  },
  addressText: {
    ...Typography.bodySm,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: "600",
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  noteText: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
