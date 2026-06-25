// ─────────────────────────────────────────────────────────────────────────────
// New Subscription — 3-step flow: Plot · Personal & Address · Review
// Accessed from estate detail with ?estateSlug=xxx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type {
  Estate,
  Subscription,
  PlotType,
  PlotSize,
  PaymentPlan,
} from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { useAuthStore } from "@/store/authStore";
import { formatNaira, parsePrice, getEstateName } from "@/utils/estate";
import {
  Colors,
  Gradients,
  Typography,
  Radius,
  Shadow,
} from "@/constants/theme";

type Step = "plot" | "details" | "review";
const STEPS: Step[] = ["plot", "details", "review"];
const STEP_META: Record<
  Step,
  {
    num: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    sub: string;
  }
> = {
  plot: {
    num: "1",
    icon: "landscape",
    title: "Plot Selection",
    sub: "Choose your plot configuration",
  },
  details: {
    num: "2",
    icon: "person-outline",
    title: "Your Details",
    sub: "Personal info and address",
  },
  review: {
    num: "3",
    icon: "task-alt",
    title: "Review & Submit",
    sub: "Confirm your subscription",
  },
};

const PLOT_TYPES: PlotType[] = ["Residential", "Commercial", "Investment"];
const PLOT_SIZES: PlotSize[] = ["500sqm", "300sqm", "Corner Piece"];
const PAYMENT_PLANS: PaymentPlan[] = ["Outright", "6 Months Installment"];
const TITLES = ["Mr", "Mrs", "Miss", "Dr", "Engr", "Chief", "Prof"];
const GENDERS = ["Male", "Female"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];

interface FormState {
  // Plot
  plotType: PlotType;
  plotSize: PlotSize;
  paymentPlan: PaymentPlan;
  numberOfPlots: number;
  // Personal
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  // Address
  address: string;
  city: string;
  lga: string;
  state: string;
  country: string;
}

const INITIAL: FormState = {
  plotType: "Residential",
  plotSize: "500sqm",
  paymentPlan: "Outright",
  numberOfPlots: 1,
  title: "Mr",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "Male",
  maritalStatus: "Single",
  address: "",
  city: "",
  lga: "",
  state: "",
  country: "Nigeria",
};

type EstateResp = Estate | { estate: Estate };
const normalizeEstate = (d: any): Estate => (d?.estate?._id ? d.estate : d);

export default function NewSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ estateSlug?: string }>();
  const clientUser = useAuthStore((s) => s.clientUser);

  const [step, setStep] = useState<Step>("plot");
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    firstName: clientUser?.firstName ?? "",
    lastName: clientUser?.lastName ?? "",
    email: clientUser?.email ?? "",
    phone: clientUser?.phone ?? "",
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const estateQ = useQuery({
    queryKey: ["estate", params.estateSlug],
    queryFn: () => api.get<EstateResp>(API.estates.bySlug(params.estateSlug!)),
    enabled: !!params.estateSlug,
  });
  const estate = estateQ.data ? normalizeEstate(estateQ.data) : null;

  // Calculate total based on selected plot size from estate's payment plans
  const totalAmount = useMemo(() => {
    if (!estate) return 0;
    const plans = Array.isArray(estate.paymentPlan) ? estate.paymentPlan : [];
    const match = plans.find((p) =>
      p.plot
        ?.toLowerCase()
        .includes(form.plotSize.toLowerCase().replace(/\s/g, "")),
    );
    const base = match ? parsePrice(match.outright) : parsePrice(estate.price);
    return base * form.numberOfPlots;
  }, [estate, form.plotSize, form.numberOfPlots]);

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post<Subscription | { subscription: Subscription }>(
        API.subscriptions.submit,
        {
          estateId: estate?._id,
          estateName: estate ? getEstateName(estate) : undefined,
          ...form,
          totalAmount,
        },
      ),
    onSuccess: (data: any) => {
      const sub = data?.subscription ?? data;
      Alert.alert(
        "Subscription Submitted",
        "Your subscription has been received. Continue to make payment now or complete it later.",
        [
          {
            text: "Pay Later",
            style: "cancel",
            onPress: () => router.replace("/(client)/subscriptions" as any),
          },
          {
            text: "Pay Now",
            onPress: () =>
              router.replace(`/(client)/subscription/${sub._id}` as any),
          },
        ],
      );
    },
    onError: (err: any) => {
      Alert.alert(
        "Submission Failed",
        err?.response?.data?.message ?? "Please try again.",
      );
    },
  });

  const update = (field: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validateStep = (s: Step) => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (s === "plot") {
      if (form.numberOfPlots < 1) errs.numberOfPlots = "Must be at least 1";
    }
    if (s === "details") {
      if (!form.firstName.trim()) errs.firstName = "Required";
      if (!form.lastName.trim()) errs.lastName = "Required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
        errs.email = "Valid email required";
      if (!form.phone.trim() || form.phone.length < 10)
        errs.phone = "Valid phone required";
      if (!form.dob) errs.dob = "Required";
      if (!form.address.trim()) errs.address = "Required";
      if (!form.city.trim()) errs.city = "Required";
      if (!form.state.trim()) errs.state = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const prev = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  useEffect(() => {
    // Require login
    if (!clientUser) {
      router.replace(
        `/(auth)/client-login?redirect=${encodeURIComponent(`/subscription/new?estateSlug=${params.estateSlug ?? ""}`)}` as any,
      );
    }
  }, [clientUser]);

  const stepIndex = STEPS.indexOf(step);
  const meta = STEP_META[step];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNav}>
          <Pressable
            onPress={() => (stepIndex === 0 ? router.back() : prev())}
            style={styles.backBtn}
            hitSlop={8}
          >
            <MaterialIcons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backText}>
              {stepIndex === 0 ? "Cancel" : "Back"}
            </Text>
          </Pressable>
          <Text style={styles.stepCounter}>
            {stepIndex + 1} of {STEPS.length}
          </Text>
        </View>

        <Text style={styles.pageTitle}>Subscribe to a Plot</Text>
        {estate ? (
          <Text style={styles.pageSub}>{getEstateName(estate)}</Text>
        ) : null}

        <View style={styles.progressTrack}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressSeg,
                i < stepIndex ? styles.progressDone : null,
                i === stepIndex ? styles.progressActive : null,
              ]}
            />
          ))}
        </View>

        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <MaterialIcons name={meta.icon} size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.stepTitle}>{meta.title}</Text>
            <Text style={styles.stepSub}>{meta.sub}</Text>
          </View>
        </View>

        <FadeInView>
          <View style={[styles.card, Shadow.lg]}>
            {step === "plot" ? (
              <View>
                <FieldLabel>Plot Type</FieldLabel>
                <OptionGroup
                  options={PLOT_TYPES}
                  value={form.plotType}
                  onSelect={(v) => update("plotType")(v)}
                />

                <FieldLabel>Plot Size</FieldLabel>
                <OptionGroup
                  options={PLOT_SIZES}
                  value={form.plotSize}
                  onSelect={(v) => update("plotSize")(v)}
                />

                <FieldLabel>Payment Plan</FieldLabel>
                <OptionGroup
                  options={PAYMENT_PLANS}
                  value={form.paymentPlan}
                  onSelect={(v) => update("paymentPlan")(v)}
                />

                <FieldLabel>Number of Plots</FieldLabel>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        numberOfPlots: Math.max(1, f.numberOfPlots - 1),
                      }))
                    }
                    style={styles.qtyBtn}
                  >
                    <MaterialIcons
                      name="remove"
                      size={20}
                      color={Colors.brand}
                    />
                  </Pressable>
                  <View style={styles.qtyValueBox}>
                    <Text style={styles.qtyValue}>{form.numberOfPlots}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        numberOfPlots: f.numberOfPlots + 1,
                      }))
                    }
                    style={styles.qtyBtn}
                  >
                    <MaterialIcons name="add" size={20} color={Colors.brand} />
                  </Pressable>
                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Estimated Total</Text>
                  <Text style={styles.totalValue}>
                    {formatNaira(totalAmount)}
                  </Text>
                </View>
              </View>
            ) : null}

            {step === "details" ? (
              <View>
                <FieldLabel>Title</FieldLabel>
                <OptionGroup
                  options={TITLES}
                  value={form.title}
                  onSelect={(v) => update("title")(v)}
                  small
                />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="First Name"
                      value={form.firstName}
                      onChangeText={update("firstName")}
                      required
                      error={errors.firstName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Last Name"
                      value={form.lastName}
                      onChangeText={update("lastName")}
                      required
                      error={errors.lastName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <Input
                  label="Email"
                  value={form.email}
                  onChangeText={update("email")}
                  required
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <MaterialIcons
                      name="mail-outline"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChangeText={update("phone")}
                  required
                  error={errors.phone}
                  keyboardType="phone-pad"
                  leftIcon={
                    <MaterialIcons
                      name="phone"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />

                <Input
                  label="Date of Birth"
                  value={form.dob}
                  onChangeText={update("dob")}
                  placeholder="YYYY-MM-DD"
                  required
                  error={errors.dob}
                  leftIcon={
                    <MaterialIcons
                      name="cake"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />

                <FieldLabel>Gender</FieldLabel>
                <OptionGroup
                  options={GENDERS}
                  value={form.gender}
                  onSelect={(v) => update("gender")(v)}
                />

                <FieldLabel>Marital Status</FieldLabel>
                <OptionGroup
                  options={MARITAL}
                  value={form.maritalStatus}
                  onSelect={(v) => update("maritalStatus")(v)}
                />

                <View style={styles.addressDivider}>
                  <Text style={styles.dividerText}>ADDRESS</Text>
                </View>

                <Input
                  label="Street Address"
                  value={form.address}
                  onChangeText={update("address")}
                  required
                  error={errors.address}
                  autoCapitalize="words"
                  leftIcon={
                    <MaterialIcons
                      name="home"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="City"
                      value={form.city}
                      onChangeText={update("city")}
                      required
                      error={errors.city}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Input
                      label="LGA"
                      value={form.lga}
                      onChangeText={update("lga")}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="State"
                      value={form.state}
                      onChangeText={update("state")}
                      required
                      error={errors.state}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Country"
                      value={form.country}
                      onChangeText={update("country")}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {step === "review" ? (
              <View>
                <ReviewSection title="Plot">
                  <ReviewRow
                    label="Estate"
                    value={estate ? getEstateName(estate) : "—"}
                  />
                  <ReviewRow label="Type" value={form.plotType} />
                  <ReviewRow label="Size" value={form.plotSize} />
                  <ReviewRow
                    label="Quantity"
                    value={form.numberOfPlots.toString()}
                  />
                  <ReviewRow
                    label="Payment Plan"
                    value={form.paymentPlan}
                    last
                  />
                </ReviewSection>

                <ReviewSection title="Personal">
                  <ReviewRow
                    label="Name"
                    value={`${form.title} ${form.firstName} ${form.lastName}`}
                  />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="Phone" value={form.phone} last />
                </ReviewSection>

                <ReviewSection title="Address">
                  <ReviewRow label="Street" value={form.address} />
                  <ReviewRow
                    label="City"
                    value={`${form.city}${form.lga ? `, ${form.lga}` : ""}`}
                  />
                  <ReviewRow
                    label="State"
                    value={`${form.state}, ${form.country}`}
                    last
                  />
                </ReviewSection>

                <View style={styles.grandTotal}>
                  <Text style={styles.grandTotalLabel}>Total Amount</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatNaira(totalAmount)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </FadeInView>

        <View style={styles.actionRow}>
          {step !== "review" ? (
            <Button
              label="Continue"
              onPress={next}
              variant="primary"
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              label={
                submitMutation.isPending
                  ? "Submitting..."
                  : "Submit Subscription"
              }
              onPress={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
              variant="primary"
              fullWidth
              size="lg"
            />
          )}
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.fieldLabel}>{String(children).toUpperCase()}</Text>
  );
}

function OptionGroup({
  options,
  value,
  onSelect,
  small,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  small?: boolean;
}) {
  return (
    <View style={styles.optGroup}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.opt,
              small ? styles.optSmall : null,
              active ? styles.optActive : null,
            ]}
          >
            <Text
              style={[styles.optText, active ? styles.optTextActive : null]}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.reviewSectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.reviewBox}>{children}</View>
    </View>
  );
}
function ReviewRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, !last ? styles.reviewRowBorder : null]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.brand },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },

  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  stepCounter: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "800",
    letterSpacing: 1,
  },

  pageTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  pageSub: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 14,
  },

  progressTrack: { flexDirection: "row", gap: 4, marginBottom: 14 },
  progressSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressActive: { backgroundColor: Colors.accentLight },
  progressDone: { backgroundColor: "#fff" },

  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  stepTitle: { ...Typography.label, color: "#fff", fontWeight: "800" },
  stepSub: { ...Typography.caption, color: "rgba(255,255,255,0.7)" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 20,
    marginBottom: 12,
  },
  row: { flexDirection: "row" },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  optGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  opt: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optSmall: { paddingHorizontal: 12, paddingVertical: 6 },
  optActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  optText: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
  optTextActive: { color: "#fff" },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.brand,
  },
  qtyValueBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  qtyValue: { fontSize: 18, fontWeight: "900", color: Colors.textPrimary },

  totalBox: {
    backgroundColor: Colors.brand50,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    ...Typography.bodySm,
    color: Colors.brand700,
    fontWeight: "700",
  },
  totalValue: { fontSize: 20, fontWeight: "900", color: Colors.brand },

  addressDivider: { marginTop: 16, marginBottom: 8, alignItems: "center" },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 2,
  },

  reviewSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 6,
  },
  reviewBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 12,
  },
  reviewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  reviewLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  reviewValue: {
    ...Typography.bodySm,
    color: Colors.textPrimary,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },

  grandTotal: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.xl,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  grandTotalValue: { color: "#fff", fontSize: 22, fontWeight: "900" },

  actionRow: { marginBottom: 8 },
});
