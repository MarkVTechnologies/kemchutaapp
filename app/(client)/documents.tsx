// ─────────────────────────────────────────────────────────────────────────────
// Documents — All KHL documents across all subscriptions, native in-app viewer
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { Subscription, SubscriptionDocument } from "@/types";
import { openSubscriptionDocument } from "@/services/documents/documentOpener";
import { DotPattern } from "@/components/ui/DotPattern";
import { InlineLoader } from "@/components/ui/AppLoader";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

// Icon/colour per document type. Unknown types fall back to a generic look.
const TYPE_META: Record<
  string,
  {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    bg: string;
  }
> = {
  contract: {
    label: "Contract",
    icon: "description",
    color: Colors.brand,
    bg: Colors.brand50,
  },
  acknowledgement: {
    label: "Acknowledgement",
    icon: "verified",
    color: Colors.brand,
    bg: Colors.brand50,
  },
  invoice: {
    label: "Invoice",
    icon: "receipt-long",
    color: Colors.success,
    bg: Colors.successBg,
  },
  schedule: {
    label: "Payment Schedule",
    icon: "event-note",
    color: Colors.warning,
    bg: Colors.warningBg,
  },
  allocation: {
    label: "Allocation",
    icon: "grid-on",
    color: Colors.brand,
    bg: Colors.brand50,
  },
  deed: {
    label: "Deed of Assignment",
    icon: "work-outline",
    color: Colors.brand,
    bg: Colors.brand50,
  },
};

const fallbackMeta = {
  label: "Document",
  icon: "description" as keyof typeof MaterialIcons.glyphMap,
  color: Colors.brand,
  bg: Colors.brand50,
};

const formatDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

type ListResp = Subscription[] | { subscriptions: Subscription[] };
const normalize = (d: ListResp): Subscription[] =>
  Array.isArray(d) ? d : (d?.subscriptions ?? []);

interface DocWithContext extends SubscriptionDocument {
  estateName?: string;
  subscriptionId: string;
  referenceNumber?: string;
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["client-subscriptions"],
    queryFn: () => api.get<ListResp>(API.subscriptions.my),
  });

  // Flatten docs across all subscriptions
  const allDocs = useMemo<DocWithContext[]>(() => {
    if (!data) return [];
    const subs = normalize(data);
    const out: DocWithContext[] = [];
    for (const s of subs) {
      const docs = s.documents;
      if (!Array.isArray(docs)) continue;
      for (const d of docs) {
        if (d && typeof d === "object" && d._id) {
          out.push({
            ...d,
            estateName: s.estateName,
            subscriptionId: s._id,
            referenceNumber: s.referenceNumber,
          });
        }
      }
    }
    return out.sort(
      (a, b) =>
        new Date(b.generatedAt ?? 0).getTime() -
        new Date(a.generatedAt ?? 0).getTime(),
    );
  }, [data]);

  const handleOpen = async (doc: DocWithContext) => {
    if (openingId) return; // prevent double taps while a download is in flight
    setOpeningId(doc._id);
    await openSubscriptionDocument({
      subscriptionId: doc.subscriptionId,
      docType: doc.type,
      referenceNumber: doc.referenceNumber,
      onFinish: () => setOpeningId(null),
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.patternWrap} pointerEvents="none">
          <DotPattern width={420} height={200} opacity={0.08} />
        </View>

        <View style={[styles.headerContent, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>
            Contracts, receipts and allocations for your plots
          </Text>
        </View>
      </View>

      {isLoading ? (
        <InlineLoader message="Loading documents..." />
      ) : allDocs.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="folder-off" size={36} color={Colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptyBody}>
            Documents appear here once your subscription is approved and
            allocations are issued.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brand}
            />
          }
        >
          {allDocs.map((doc) => {
            const meta = TYPE_META[doc.type] ?? fallbackMeta;
            const isOpening = openingId === doc._id;
            return (
              <Pressable
                key={doc._id}
                onPress={() => handleOpen(doc)}
                disabled={!!openingId}
                style={[
                  styles.docRow,
                  Shadow.sm,
                  openingId && !isOpening ? { opacity: 0.5 } : null,
                ]}
              >
                <View style={[styles.docIcon, { backgroundColor: meta.bg }]}>
                  <MaterialIcons
                    name={meta.icon}
                    size={22}
                    color={meta.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.label || meta.label}</Text>
                  {doc.estateName ? (
                    <Text style={styles.docEstate} numberOfLines={1}>
                      {doc.estateName}
                    </Text>
                  ) : null}
                  <Text style={styles.docDate}>
                    {formatDate(doc.generatedAt)}
                  </Text>
                </View>
                {isOpening ? (
                  <ActivityIndicator size="small" color={Colors.brand} />
                ) : (
                  <MaterialIcons
                    name="open-in-new"
                    size={18}
                    color={Colors.brand}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  patternWrap: { position: "absolute", top: 0, right: 0 },
  headerContent: { paddingHorizontal: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitle: { ...Typography.bodySm, color: "rgba(255,255,255,0.75)" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 6,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 8,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  docEstate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  docDate: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});
