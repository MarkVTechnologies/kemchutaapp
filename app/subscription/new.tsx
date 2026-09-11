// ─────────────────────────────────────────────────────────────────────────────
// New Subscription — mirrors the web app's SubscribeModal field-for-field
// (client/src/components/subscription/SubscribeModal.tsx). Single scrollable
// form, no login required (guest checkout, matching web), public POST to
// /api/subscriptions.
//
// One deliberate correction vs. the web app: the web form's Payment Plan
// button is labeled "6 Months Installment" but sends that literal string as
// `paymentPlan`, which does not match the backend's zod/mongoose enum
// (["Outright", "Instalment"]) — a real submission would 400 there. This
// screen keeps the same visible label but sends the correct
// `paymentPlan: "Instalment"` + `instalmentMonths: 6`.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type { Estate, Subscription, PlotType, PlotSize } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import { formatNaira, parsePrice, getEstateName } from "@/utils/estate";
import { Colors, Gradients, Typography, Radius, Spacing } from "@/constants/theme";

// ── Options — exact match to the web SubscribeModal ──────────────────────────
const TITLES = ["Mr", "Mrs", "Miss", "Dr", "Chief", "Engr", "Hon"];
const GENDERS = ["Male", "Female", "Prefer not to say"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const NATIONALITIES = [
  "Nigerian", "Ghanaian", "South African", "Kenyan", "British", "American", "Canadian", "Other",
];
const PLOT_TYPES: PlotType[] = ["Residential", "Commercial", "Investment"];
const PLOT_SIZES: PlotSize[] = ["500sqm", "300sqm", "Corner Piece"];
const PAYMENT_PLAN_LABELS = ["Outright", "6 Months Installment"] as const;
const SURVEY_TYPES = ["Registered Survey", "Provisional Survey"];
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];
const COUNTRIES = [
  "Nigeria", "Ghana", "South Africa", "Kenya", "United Kingdom", "United States",
  "Canada", "Germany", "France", "Australia", "Other",
];

const INSTALMENT_MONTHS = 6;

interface FormState {
  title: string;
  firstName: string;
  lastName: string;
  maritalStatus: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: string;
  spouseFirstName: string;
  spouseLastName: string;
  nationality: string;
  employerName: string;
  residentialAddress: string;
  cityTown: string;
  lga: string;
  state: string;
  countryOfResidence: string;
  phone: string;
  email: string;
  plotType: PlotType;
  paymentPlanLabel: (typeof PAYMENT_PLAN_LABELS)[number];
  numberOfPlots: number;
  plotSize: PlotSize;
  surveyType: string;
  kinFirstName: string;
  kinLastName: string;
  kinAddress: string;
  kinCity: string;
  kinLga: string;
  kinPhone: string;
  agreedToTerms: boolean;
}

const MAX_DOB = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000);

type EstateResp = Estate | { estate: Estate };
const normalizeEstate = (d: any): Estate => (d?.estate?._id ? d.estate : d);

const calcTotal = (basePrice: number, plotSize: PlotSize, numberOfPlots: number) => {
  let unit = basePrice;
  if (plotSize === "Corner Piece") unit = unit + unit * 0.1;
  return unit * numberOfPlots;
};

const TERMS_CLAUSES = [
  { title: "1. Subscription Agreement", body: "By subscribing to any plot on the Kemchuta Homes platform, the subscriber agrees to be bound by the terms herein. This subscription constitutes a binding agreement between the subscriber and Kemchuta Homes Ltd." },
  { title: "2. Payment Terms", body: "All payments must be made as agreed under the chosen payment plan. For outright purchase, full payment is required within 7 working days of subscription. For installment plans, payments must be made according to the agreed schedule. Failure to make payments on time may result in forfeiture of the plot without refund." },
  { title: "3. Allocation & Title", body: "Physical allocation of plots is subject to full payment and completion of all documentation. Title documents will be processed and issued after full payment has been confirmed. The type of title issued will be as agreed during subscription." },
  { title: "4. Corner Piece Premium", body: "Corner piece plots attract an additional 10% premium on the standard plot price. This premium is non-negotiable and applies to all corner piece selections." },
  { title: "5. Refund Policy", body: "Cancellations made within 48 hours of subscription will attract a 5% administrative fee. Cancellations after 48 hours will attract a 15% administrative fee. No refunds will be processed for plots already allocated unless due to fault of Kemchuta Homes Ltd." },
  { title: "6. Transfer of Ownership", body: "Plots may not be transferred to third parties without prior written consent from Kemchuta Homes Ltd. A transfer fee of 2% of the current market value will apply to all approved transfers." },
  { title: "7. Development Rights", body: "Subscribers are required to develop their plots within the estate's development timeline. Kemchuta Homes Ltd reserves the right to repurchase undeveloped plots at the original subscription price after the development period lapses." },
  { title: "8. Dispute Resolution", body: "Any disputes arising from this agreement shall first be resolved through mediation. If mediation fails, the matter shall be referred to arbitration in accordance with Nigerian law." },
];

export default function NewSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ estateSlug?: string }>();
  const clientUser = useAuthStore((s) => s.clientUser);
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    title: "",
    firstName: clientUser?.firstName ?? "",
    lastName: clientUser?.lastName ?? "",
    maritalStatus: "",
    dateOfBirth: "",
    gender: "",
    spouseFirstName: "",
    spouseLastName: "",
    nationality: "Nigerian",
    employerName: "",
    residentialAddress: "",
    cityTown: "",
    lga: "",
    state: "",
    countryOfResidence: "Nigeria",
    phone: clientUser?.phone ?? "",
    email: clientUser?.email ?? "",
    plotType: "Residential",
    paymentPlanLabel: "Outright",
    numberOfPlots: 1,
    plotSize: "500sqm",
    surveyType: "Registered Survey",
    kinFirstName: "",
    kinLastName: "",
    kinAddress: "",
    kinCity: "",
    kinLga: "",
    kinPhone: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [submitted, setSubmitted] = useState<{ referenceNumber?: string } | null>(null);

  const estateQ = useQuery({
    queryKey: ["estate", params.estateSlug],
    queryFn: () => api.get<EstateResp>(API.estates.bySlug(params.estateSlug!)),
    enabled: !!params.estateSlug,
  });
  const estate = estateQ.data ? normalizeEstate(estateQ.data) : null;
  const estateName = estate ? getEstateName(estate) : "";
  const basePrice = estate ? parsePrice(estate.price) : 0;
  const totalAmount = calcTotal(basePrice, form.plotSize, Number(form.numberOfPlots) || 1);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    const req = (f: keyof FormState, label: string) => {
      const v = form[f];
      if (!v || (typeof v === "string" && !v.trim())) e[f] = `${label} is required`;
    };
    req("title", "Title");
    req("firstName", "First name");
    req("lastName", "Last name");
    req("maritalStatus", "Marital status");
    req("dateOfBirth", "Date of birth");
    req("gender", "Gender");
    req("residentialAddress", "Residential address");
    req("cityTown", "City / Town");
    req("lga", "LGA");
    req("state", "State");
    req("phone", "Phone number");
    req("kinFirstName", "Next of kin first name");
    req("kinLastName", "Next of kin last name");
    req("kinAddress", "Next of kin address");
    req("kinPhone", "Next of kin phone");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required";
    if (!form.agreedToTerms) e.agreedToTerms = "You must agree to the terms and conditions";
    return e;
  };

  const submitMutation = useMutation({
    mutationFn: () => {
      const isInstalment = form.paymentPlanLabel === "6 Months Installment";
      return api.post<{ subscription?: Subscription; message?: string }>(
        API.subscriptions.submit,
        {
          estateName,
          estateId: estate?._id,
          title: form.title,
          firstName: form.firstName,
          lastName: form.lastName,
          maritalStatus: form.maritalStatus,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          spouseFirstName: form.spouseFirstName || undefined,
          spouseLastName: form.spouseLastName || undefined,
          nationality: form.nationality,
          employerName: form.employerName || undefined,
          residentialAddress: form.residentialAddress,
          cityTown: form.cityTown,
          lga: form.lga,
          state: form.state,
          countryOfResidence: form.countryOfResidence,
          phone: form.phone,
          email: form.email,
          plotType: form.plotType,
          paymentPlan: isInstalment ? "Instalment" : "Outright",
          instalmentMonths: isInstalment ? INSTALMENT_MONTHS : undefined,
          numberOfPlots: form.numberOfPlots,
          plotSize: form.plotSize,
          surveyType: form.surveyType,
          totalAmount,
          kinFirstName: form.kinFirstName,
          kinLastName: form.kinLastName,
          kinAddress: form.kinAddress,
          kinCity: form.kinCity || undefined,
          kinLga: form.kinLga || undefined,
          kinPhone: form.kinPhone,
        },
      );
    },
    onSuccess: (data) => {
      setSubmitted({ referenceNumber: data?.subscription?.referenceNumber });
    },
    onError: (err: any) => {
      toast.showToast({
        message: err?.response?.data?.message ?? "Something went wrong. Please try again.",
        type: "error",
      });
    },
  });

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.showToast({ message: "Please fill in all required fields", type: "error" });
      return;
    }
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <SuccessScreen
        estateName={estateName}
        form={form}
        totalAmount={totalAmount}
        referenceNumber={submitted.referenceNumber}
        onClose={() => router.back()}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.eyebrowRow}>
              <MaterialIcons name="north-east" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={styles.eyebrow}>Subscribe</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {estateName || "Estate Subscription"}
            </Text>
            {basePrice > 0 && (
              <Text style={styles.headerSub}>From {formatNaira(basePrice)} per plot</Text>
            )}
          </View>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
            <MaterialIcons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <View style={styles.estateBanner}>
            <MaterialIcons name="apartment" size={18} color={Colors.brand} />
            <View>
              <Text style={styles.estateBannerLabel}>ESTATE</Text>
              <Text style={styles.estateBannerValue}>{estateName || "—"}</Text>
            </View>
          </View>

          <SectionHeader icon="person-outline">Personal Information</SectionHeader>

          <FieldLabel required error={errors.title}>Title</FieldLabel>
          <ChipGroup options={TITLES} value={form.title} onSelect={(v) => set("title", v)} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="First Name" required value={form.firstName} onChangeText={(v) => set("firstName", v)} placeholder="John" error={errors.firstName} autoCapitalize="words" />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Input label="Last Name" required value={form.lastName} onChangeText={(v) => set("lastName", v)} placeholder="Doe" error={errors.lastName} autoCapitalize="words" />
            </View>
          </View>

          <Text style={styles.inputLabel}>
            Date of Birth<Text style={styles.required}> *</Text>
          </Text>
          <Pressable
            style={[styles.dateField, errors.dateOfBirth && styles.dateFieldError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateValue, !form.dateOfBirth && styles.datePlaceholder]}>
              {form.dateOfBirth || "mm/dd/yyyy"}
            </Text>
            <MaterialIcons name="calendar-today" size={18} color={Colors.textMuted} />
          </Pressable>
          {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
          {showDatePicker && (
            <DateTimePicker
              value={form.dateOfBirth ? new Date(form.dateOfBirth) : MAX_DOB}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={MAX_DOB}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) set("dateOfBirth", date.toISOString().split("T")[0]);
              }}
            />
          )}

          <Select label="Gender" required value={form.gender} options={GENDERS} onSelect={(v) => set("gender", v)} error={errors.gender} placeholder="Select gender" />
          <Select label="Marital Status" required value={form.maritalStatus} options={MARITAL} onSelect={(v) => set("maritalStatus", v)} error={errors.maritalStatus} placeholder="Select status" />

          {form.maritalStatus === "Married" && (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input label="Spouse First Name" value={form.spouseFirstName} onChangeText={(v) => set("spouseFirstName", v)} placeholder="Spouse first name" autoCapitalize="words" />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Input label="Spouse Last Name" value={form.spouseLastName} onChangeText={(v) => set("spouseLastName", v)} placeholder="Spouse last name" autoCapitalize="words" />
              </View>
            </View>
          )}

          <Select label="Nationality" value={form.nationality} options={NATIONALITIES} onSelect={(v) => set("nationality", v)} />
          <Input label="Employer's Name" value={form.employerName} onChangeText={(v) => set("employerName", v)} placeholder="Company / Business name" />

          <SectionHeader icon="place">Contact & Address</SectionHeader>

          <Input label="Residential Address" required value={form.residentialAddress} onChangeText={(v) => set("residentialAddress", v)} placeholder="Full residential address" error={errors.residentialAddress} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="City / Town" required value={form.cityTown} onChangeText={(v) => set("cityTown", v)} placeholder="City or town" error={errors.cityTown} autoCapitalize="words" />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Input label="LGA" required value={form.lga} onChangeText={(v) => set("lga", v)} placeholder="Local Govt. Area" error={errors.lga} autoCapitalize="words" />
            </View>
          </View>

          <Select label="State" required value={form.state} options={NIGERIAN_STATES} onSelect={(v) => set("state", v)} error={errors.state} placeholder="Select state" />
          <Select label="Country of Residence" value={form.countryOfResidence} options={COUNTRIES} onSelect={(v) => set("countryOfResidence", v)} />

          <Input label="Phone Number" required value={form.phone} onChangeText={(v) => set("phone", v)} placeholder="+234 800 000 0000" error={errors.phone} keyboardType="phone-pad" />
          <Input label="Email Address" required value={form.email} onChangeText={(v) => set("email", v)} placeholder="you@example.com" error={errors.email} keyboardType="email-address" autoCapitalize="none" />

          <SectionHeader icon="description">Subscription Details</SectionHeader>

          <FieldLabel>Type of Plot</FieldLabel>
          <ChipGroup options={PLOT_TYPES} value={form.plotType} onSelect={(v) => set("plotType", v as PlotType)} />

          <View style={styles.plotSizeLabelRow}>
            <Text style={styles.fieldLabel}>PLOT SIZE</Text>
            {form.plotSize === "Corner Piece" && (
              <Text style={styles.premiumNote}>+10% corner piece premium applies</Text>
            )}
          </View>
          <ChipGroup
            options={PLOT_SIZES}
            value={form.plotSize}
            onSelect={(v) => set("plotSize", v as PlotSize)}
            activeColor={(opt) => (opt === "Corner Piece" ? Colors.warning : Colors.brand)}
          />

          <FieldLabel>Payment Plan</FieldLabel>
          <ChipGroup
            options={[...PAYMENT_PLAN_LABELS]}
            value={form.paymentPlanLabel}
            onSelect={(v) => set("paymentPlanLabel", v as FormState["paymentPlanLabel"])}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Number of Plots</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => set("numberOfPlots", Math.max(1, form.numberOfPlots - 1))}
                  style={styles.qtyBtn}
                >
                  <MaterialIcons name="remove" size={18} color={Colors.brand} />
                </Pressable>
                <View style={styles.qtyValueBox}>
                  <Text style={styles.qtyValue}>{form.numberOfPlots}</Text>
                </View>
                <Pressable
                  onPress={() => set("numberOfPlots", Math.min(20, form.numberOfPlots + 1))}
                  style={styles.qtyBtn}
                >
                  <MaterialIcons name="add" size={18} color={Colors.brand} />
                </Pressable>
              </View>
            </View>
          </View>

          <Select label="Survey Type" value={form.surveyType} options={SURVEY_TYPES} onSelect={(v) => set("surveyType", v)} />

          <View style={styles.totalBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Total Amount Payable</Text>
              <Text style={styles.totalValue}>{basePrice > 0 ? formatNaira(totalAmount) : "—"}</Text>
              {form.plotSize === "Corner Piece" && basePrice > 0 && (
                <Text style={styles.premiumInline}>Includes 10% corner piece premium</Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.totalMeta}>
                {form.numberOfPlots} plot{form.numberOfPlots > 1 ? "s" : ""} × {form.plotSize}
              </Text>
              <Text style={styles.totalMeta}>{form.paymentPlanLabel}</Text>
            </View>
          </View>

          <SectionHeader icon="groups">Next of Kin</SectionHeader>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="First Name" required value={form.kinFirstName} onChangeText={(v) => set("kinFirstName", v)} placeholder="Next of kin first name" error={errors.kinFirstName} autoCapitalize="words" />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Input label="Last Name" required value={form.kinLastName} onChangeText={(v) => set("kinLastName", v)} placeholder="Next of kin last name" error={errors.kinLastName} autoCapitalize="words" />
            </View>
          </View>

          <Input label="Residential Address" required value={form.kinAddress} onChangeText={(v) => set("kinAddress", v)} placeholder="Next of kin full address" error={errors.kinAddress} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="City / Town" value={form.kinCity} onChangeText={(v) => set("kinCity", v)} placeholder="City or town" autoCapitalize="words" />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Input label="LGA" value={form.kinLga} onChangeText={(v) => set("kinLga", v)} placeholder="Local Govt. Area" autoCapitalize="words" />
            </View>
          </View>

          <Input label="Phone Number" required value={form.kinPhone} onChangeText={(v) => set("kinPhone", v)} placeholder="Next of kin phone" error={errors.kinPhone} keyboardType="phone-pad" />

          <Pressable
            style={[styles.termsBox, errors.agreedToTerms && styles.termsBoxError]}
            onPress={() => set("agreedToTerms", !form.agreedToTerms)}
          >
            <View style={[styles.checkbox, form.agreedToTerms && styles.checkboxActive]}>
              {form.agreedToTerms && <MaterialIcons name="check" size={13} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              I have read and agree to the{" "}
              <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
                Terms and Conditions
              </Text>{" "}
              of this subscription. I confirm that all information provided is accurate and complete.
            </Text>
          </Pressable>
          {errors.agreedToTerms && <Text style={styles.errorText}>{errors.agreedToTerms}</Text>}

          <Button
            label={submitMutation.isPending ? "Submitting..." : "Submit Subscription"}
            onPress={handleSubmit}
            loading={submitMutation.isPending}
            variant="primary"
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
          <Text style={styles.footerNote}>
            Our team will contact you within 24 hours to complete your subscription
          </Text>
        </FadeInView>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>

      <Modal visible={showTerms} animationType="slide" onRequestClose={() => setShowTerms(false)}>
        <View style={[styles.termsModalRoot, { paddingTop: insets.top }]}>
          <LinearGradient colors={Gradients.brand} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.termsHeader}>
            <Text style={styles.termsHeaderTitle}>Terms & Conditions</Text>
            <Pressable onPress={() => setShowTerms(false)} style={styles.closeBtn} hitSlop={8}>
              <MaterialIcons name="close" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
          <ScrollView contentContainerStyle={styles.termsBody}>
            {TERMS_CLAUSES.map((c) => (
              <View key={c.title} style={{ marginBottom: 20 }}>
                <Text style={styles.termsClauseTitle}>{c.title}</Text>
                <Text style={styles.termsClauseBody}>{c.body}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.termsFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Button label="I've Read the Terms" onPress={() => setShowTerms(false)} variant="primary" fullWidth />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  estateName,
  form,
  totalAmount,
  referenceNumber,
  onClose,
}: {
  estateName: string;
  form: FormState;
  totalAmount: number;
  referenceNumber?: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const rows: [string, string][] = [
    ...(referenceNumber ? ([["Reference", referenceNumber]] as [string, string][]) : []),
    ["Estate", estateName],
    ["Subscriber", `${form.title} ${form.firstName} ${form.lastName}`],
    ["Plot Type", form.plotType],
    ["Plot Size", form.plotSize],
    ["No. of Plots", `${form.numberOfPlots}`],
    ["Payment Plan", form.paymentPlanLabel],
    ["Total Amount", formatNaira(totalAmount)],
  ];

  return (
    <View style={[styles.successRoot, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.successIcon}>
        <MaterialIcons name="check-circle" size={44} color="#fff" />
      </View>
      <Text style={styles.successTitle}>Subscription Submitted!</Text>
      <Text style={styles.successBody}>
        Your subscription form has been received. Our team will contact you within 24 hours to
        confirm and guide you through the next steps.
      </Text>
      <View style={styles.successCard}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.successRow}>
            <Text style={styles.successRowLabel}>{label}</Text>
            <Text style={styles.successRowValue} numberOfLines={1}>{value}</Text>
          </View>
        ))}
      </View>
      <Button label="Close" onPress={onClose} variant="primary" size="lg" fullWidth />
    </View>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function SectionHeader({ children, icon }: { children: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLine} />
      <View style={styles.sectionHeaderChip}>
        <MaterialIcons name={icon} size={12} color={Colors.brand} />
        <Text style={styles.sectionHeaderText}>{children.toUpperCase()}</Text>
      </View>
      <View style={styles.sectionHeaderLine} />
    </View>
  );
}

function FieldLabel({ children, required, error }: { children: string; required?: boolean; error?: string }) {
  return (
    <Text style={[styles.inputLabel, error && { color: Colors.error }]}>
      {children}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function ChipGroup({
  options,
  value,
  onSelect,
  activeColor,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  activeColor?: (opt: string) => string;
}) {
  return (
    <View style={styles.chipGroup}>
      {options.map((opt) => {
        const active = value === opt;
        const color = activeColor ? activeColor(opt) : Colors.brand;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.chip,
              active && { backgroundColor: color, borderColor: color },
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eyebrow: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.65)", letterSpacing: 1, textTransform: "uppercase" },
  headerTitle: { fontSize: 19, fontWeight: "900", color: "#fff", letterSpacing: -0.3, maxWidth: 260 },
  headerSub: { fontSize: 13, fontWeight: "600", color: "rgba(239,194,255,0.85)", marginTop: 3 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  scroll: { paddingHorizontal: 20, paddingTop: 20, flexGrow: 1 },
  row: { flexDirection: "row" },

  estateBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.brand50 + "55",
    borderWidth: 1, borderColor: Colors.brand50,
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 18,
  },
  estateBannerLabel: { fontSize: 10, fontWeight: "700", color: Colors.textMuted, letterSpacing: 1 },
  estateBannerValue: { fontSize: 14, fontWeight: "800", color: Colors.textPrimary },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, marginBottom: 14 },
  sectionHeaderLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionHeaderChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionHeaderText: { fontSize: 10, fontWeight: "800", color: Colors.brand, letterSpacing: 1.5 },

  inputLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs },
  required: { color: Colors.error },
  fieldLabel: { fontSize: 10, fontWeight: "800", color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 9 },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: 4, marginBottom: 8 },

  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
  chipTextActive: { color: "#fff" },

  plotSizeLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
  premiumNote: { fontSize: 11, fontWeight: "700", color: Colors.warning },

  dateField: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
    minHeight: 52, paddingHorizontal: Spacing.md, marginBottom: 4,
  },
  dateFieldError: { borderColor: Colors.error, backgroundColor: Colors.errorBg },
  dateValue: { ...Typography.bodyLg, color: Colors.textPrimary },
  datePlaceholder: { color: Colors.textMuted },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.brand50,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: Colors.brand,
  },
  qtyValueBox: {
    flex: 1, alignItems: "center", justifyContent: "center", height: 40,
    borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  qtyValue: { fontSize: 16, fontWeight: "900", color: Colors.textPrimary },

  totalBox: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    backgroundColor: Colors.brand50 + "40", borderWidth: 1.5, borderColor: Colors.brand50,
    borderRadius: Radius.xl, padding: 16, marginBottom: 18,
  },
  totalLabel: { fontSize: 10, fontWeight: "700", color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  totalValue: { fontSize: 22, fontWeight: "900", color: Colors.brand, letterSpacing: -0.5 },
  premiumInline: { fontSize: 11, fontWeight: "700", color: Colors.warning, marginTop: 3 },
  totalMeta: { fontSize: 11, fontWeight: "600", color: Colors.textMuted, marginTop: 2 },

  termsBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: Colors.brand50 + "30", borderWidth: 1.5, borderColor: Colors.brand50,
    borderRadius: Radius.xl, padding: 14, marginTop: 6,
  },
  termsBoxError: { backgroundColor: Colors.errorBg, borderColor: Colors.error },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: Colors.brand50,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  checkboxActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  termsText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  termsLink: { color: Colors.brand, fontWeight: "700", textDecorationLine: "underline" },

  footerNote: { fontSize: 11, color: Colors.textMuted, textAlign: "center", marginTop: 10 },

  termsModalRoot: { flex: 1, backgroundColor: Colors.surface },
  termsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  termsHeaderTitle: { fontSize: 17, fontWeight: "900", color: "#fff" },
  termsBody: { padding: 20 },
  termsClauseTitle: { fontSize: 13, fontWeight: "800", color: Colors.textPrimary, marginBottom: 6 },
  termsClauseBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  termsFooter: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.borderLight },

  successRoot: { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: 28, alignItems: "center" },
  successIcon: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  successTitle: { fontSize: 21, fontWeight: "900", color: Colors.textPrimary, marginBottom: 10, textAlign: "center" },
  successBody: { fontSize: 14, color: Colors.textMuted, textAlign: "center", lineHeight: 21, marginBottom: 22 },
  successCard: {
    width: "100%", backgroundColor: Colors.brand50 + "30", borderWidth: 1, borderColor: Colors.brand50,
    borderRadius: Radius.xl, padding: 16, marginBottom: 22,
  },
  successRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.brand50 + "40",
  },
  successRowLabel: { fontSize: 11, fontWeight: "700", color: Colors.textMuted },
  successRowValue: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary, flex: 1, textAlign: "right", marginLeft: 12 },
});
