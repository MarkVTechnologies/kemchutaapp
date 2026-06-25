// ─────────────────────────────────────────────────────────────────────────────
// Subscription Detail — Plot info, status, payments, documents
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { openSubscriptionDocument } from "@/services/documents/documentOpener";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { Subscription, SubscriptionPayment } from "@/types";
import { subscriptionStatusBucket } from "@/types";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { InlineLoader } from "@/components/ui/AppLoader";
import { PaymentInitiator } from "@/components/features/PaymentInitiator";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

const formatNaira = (n?: number) =>
  "₦" + (n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const formatDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

type ListResp = Subscription[] | { subscriptions: Subscription[] };
const normalizeList = (d: ListResp): Subscription[] =>
  Array.isArray(d) ? d : (d?.subscriptions ?? []);

// Status bucket → banner copy
const BUCKET_META = {
  pending: {
    color: Colors.warning,
    bg: Colors.warningBg,
    label: "Pending Review",
    desc: "Our team is reviewing your subscription. We'll notify you once approved.",
  },
  active: {
    color: Colors.success,
    bg: Colors.successBg,
    label: "Active",
    desc: "Your subscription is active. Check your documents for records.",
  },
  rejected: {
    color: Colors.error,
    bg: Colors.errorBg,
    label: "Rejected",
    desc: "This subscription was rejected. Please contact support.",
  },
} as const;

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  // The client byId route is admin-only, so we read from the client's own
  // subscriptions list (same query key the list/portal screens populate) and
  // pick the matching record. No extra network call needed when cached.
  const listQ = useQuery({
    queryKey: ["client-subscriptions"],
    queryFn: () => api.get<ListResp>(API.subscriptions.my),
  });

  if (listQ.isLoading) {
    return <InlineLoader message="Loading subscription..." />;
  }

  const all = listQ.data ? normalizeList(listQ.data) : [];
  const sub = all.find((s) => s._id === id) ?? null;

  if (listQ.isError || !sub) {
    return (
      <View style={styles.center}>
        <MaterialIcons
          name="error-outline"
          size={42}
          color={Colors.textMuted}
        />
        <Text style={styles.errTitle}>Subscription not found</Text>
        <Button
          label="Go Back"
          onPress={() => router.back()}
          variant="primary"
        />
      </View>
    );
  }

  // Payments are embedded in the subscription. A confirmed payment counts.
  const payments: SubscriptionPayment[] = Array.isArray(sub.payments)
    ? sub.payments
    : [];
  const totalPaid =
    sub.amountPaid ??
    payments
      .filter((p) => p.confirmed)
      .reduce((s, p) => s + (p.amount || 0), 0);
  const balance = Math.max(0, sub.totalAmount - totalPaid);
  const documents = Array.isArray(sub.documents) ? sub.documents : [];

  const bucket = subscriptionStatusBucket(sub.status);
  const meta = BUCKET_META[bucket];

  const openDoc = async (docId: string, docType: string) => {
    if (openingDoc) return;
    setOpeningDoc(docId);
    await openSubscriptionDocument({
      subscriptionId: sub._id,
      docType,
      referenceNumber: sub.referenceNumber,
      onFinish: () => setOpeningDoc(null),
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={[styles.headerContent, { paddingTop: insets.top + 12 }]}>
            <View style={styles.topRow}>
              <Pressable
                onPress={() => router.back()}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <MaterialIcons name="arrow-back" size={22} color="#fff" />
              </Pressable>
              <Text style={styles.headerTitle}>Subscription</Text>
              <View style={{ width: 40 }} />
            </View>

            <FadeInView>
              <Text style={styles.estateName} numberOfLines={2}>
                {sub.estateName ?? "Plot Subscription"}
              </Text>
              <View style={[styles.statusBanner, { backgroundColor: meta.bg }]}>
                <Text style={[styles.statusLabel, { color: meta.color }]}>
                  {meta.label.toUpperCase()}
                </Text>
                <Text style={[styles.statusDesc, { color: meta.color }]}>
                  {meta.desc}
                </Text>
              </View>
            </FadeInView>
          </View>
        </View>

        {/* Plot details */}
        <FadeInView delay={80}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plot Details</Text>
            <View style={[styles.detailCard, Shadow.card]}>
              <DetailRow
                icon="straighten"
                label="Plot Size"
                value={sub.plotSize}
              />
              <DetailRow
                icon="format-list-numbered"
                label="Number of Plots"
                value={sub.numberOfPlots.toString()}
              />
              <DetailRow icon="category" label="Type" value={sub.plotType} />
              <DetailRow
                icon="payments"
                label="Payment Plan"
                value={sub.paymentPlan}
              />
              {sub.plotNumber ? (
                <DetailRow
                  icon="grid-on"
                  label="Allocated Plot"
                  value={sub.plotNumber}
                />
              ) : null}
              <DetailRow
                icon="event"
                label="Subscribed"
                value={formatDate(sub.createdAt)}
                last
              />
            </View>
          </View>
        </FadeInView>

        {/* Payment summary */}
        <FadeInView delay={120}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={[styles.paymentCard, Shadow.card]}>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Total Amount</Text>
                <Text style={styles.payValue}>
                  {formatNaira(sub.totalAmount)}
                </Text>
              </View>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Paid</Text>
                <Text style={[styles.payValue, { color: Colors.success }]}>
                  {formatNaira(totalPaid)}
                </Text>
              </View>
              <View style={styles.payDivider} />
              <View style={styles.payRow}>
                <Text
                  style={[
                    styles.payLabel,
                    { fontWeight: "800", color: Colors.textPrimary },
                  ]}
                >
                  Balance
                </Text>
                <Text style={styles.balanceValue}>{formatNaira(balance)}</Text>
              </View>

              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[Colors.brand400, Colors.brand]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${sub.totalAmount > 0 ? Math.min(100, (totalPaid / sub.totalAmount) * 100) : 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {sub.totalAmount > 0
                  ? Math.round((totalPaid / sub.totalAmount) * 100)
                  : 0}
                % paid
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Payment history */}
        {payments.length > 0 ? (
          <FadeInView delay={160}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              <View style={{ gap: 8 }}>
                {payments.map((p) => (
                  <PaymentRow key={p._id} payment={p} />
                ))}
              </View>
            </View>
          </FadeInView>
        ) : null}

        {/* Documents */}
        {documents.length > 0 ? (
          <FadeInView delay={200}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <View style={{ gap: 8 }}>
                {documents.map((d) => (
                  <Pressable
                    key={d._id}
                    onPress={() => openDoc(d._id, d.type)}
                    disabled={!!openingDoc}
                    style={[
                      styles.docsCard,
                      Shadow.card,
                      openingDoc && openingDoc !== d._id
                        ? { opacity: 0.5 }
                        : null,
                    ]}
                  >
                    <View style={styles.docsIcon}>
                      <MaterialIcons
                        name="description"
                        size={22}
                        color={Colors.brand}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docsTitle}>{d.label || d.type}</Text>
                      <Text style={styles.docsSub}>
                        {formatDate(d.generatedAt)}
                      </Text>
                    </View>
                    {openingDoc === d._id ? (
                      <ActivityIndicator size="small" color={Colors.brand} />
                    ) : (
                      <MaterialIcons
                        name="open-in-new"
                        size={20}
                        color={Colors.brand}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </FadeInView>
        ) : null}
      </ScrollView>

      {/* Sticky pay CTA when balance > 0 */}
      {balance > 0 && bucket !== "rejected" ? (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          <View>
            <Text style={styles.ctaLabel}>Balance</Text>
            <Text style={styles.ctaAmount}>{formatNaira(balance)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <PaymentInitiator
              subscriptionId={sub._id}
              amount={balance}
              onComplete={() => {
                listQ.refetch();
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last ? styles.detailRowBorder : null]}>
      <View style={styles.detailIconWrap}>
        <MaterialIcons name={icon} size={18} color={Colors.brand} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function PaymentRow({ payment }: { payment: SubscriptionPayment }) {
  const isConfirmed = !!payment.confirmed;
  return (
    <View style={[styles.payHistRow, Shadow.sm]}>
      <View
        style={[
          styles.payHistIcon,
          {
            backgroundColor: isConfirmed ? Colors.successBg : Colors.warningBg,
          },
        ]}
      >
        <MaterialIcons
          name={isConfirmed ? "check-circle" : "schedule"}
          size={18}
          color={isConfirmed ? Colors.success : Colors.warning}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.payHistAmount}>{formatNaira(payment.amount)}</Text>
        <View style={styles.payHistMeta}>
          <Text style={styles.payHistMetaText}>
            {payment.method ?? "Bank Transfer"}
          </Text>
          <View style={styles.payHistDot} />
          <Text style={styles.payHistMetaText}>
            {formatDate(payment.paidAt ?? payment.createdAt)}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.payHistStatus,
          { color: isConfirmed ? Colors.success : Colors.warning },
        ]}
      >
        {isConfirmed ? "CONFIRMED" : "PENDING"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: Colors.background,
  },
  errTitle: { ...Typography.h3, color: Colors.textPrimary, marginTop: 8 },

  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  headerContent: { paddingHorizontal: 16, paddingBottom: 20 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    letterSpacing: 1,
  },

  estateName: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 12,
    lineHeight: 30,
  },
  statusBanner: { borderRadius: Radius.lg, padding: 14 },
  statusLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusDesc: { fontSize: 12, lineHeight: 18, opacity: 0.85 },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: "800",
    marginBottom: 10,
  },

  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1 },
  detailValue: {
    ...Typography.bodySm,
    color: Colors.textPrimary,
    fontWeight: "800",
  },

  paymentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  payLabel: { ...Typography.body, color: Colors.textSecondary },
  payValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  payDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  balanceValue: { ...Typography.h3, color: Colors.brand, fontWeight: "900" },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand50,
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: {
    ...Typography.caption,
    color: Colors.brand,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "right",
  },

  payHistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
  },
  payHistIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  payHistAmount: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  payHistMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  payHistMetaText: { ...Typography.caption, color: Colors.textMuted },
  payHistDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  payHistStatus: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },

  docsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 14,
  },
  docsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  docsTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  docsSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
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
  ctaLabel: { ...Typography.caption, color: Colors.textMuted },
  ctaAmount: { ...Typography.h3, color: Colors.brand, fontWeight: "800" },
});
