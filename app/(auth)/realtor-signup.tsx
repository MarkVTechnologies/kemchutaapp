import React, { useState, useEffect } from "react";
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
import * as WebBrowser from "expo-web-browser";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { useAuthStore } from "@/store/authStore";
import { TERMS_URL, PRIVACY_URL } from "@/constants/links";
import { useBiometrics } from "@/hooks/useBiometrics";
import {
  Colors,
  Typography,
  Radius,
  Shadow,
  Gradients,
} from "@/constants/theme";

const STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];
const BANKS = [
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank",
  "FCMB",
  "GTBank",
  "Heritage Bank",
  "Keystone Bank",
  "MoniePoint",
  "Opay Digital",
  "Polaris Bank",
  "Stanbic IBTC",
  "Sterling Bank",
  "Union Bank",
  "UBA",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
];

type Step = "personal" | "bank" | "security";
const STEPS: Step[] = ["personal", "bank", "security"];
const STEP_META: Record<
  Step,
  { icon: keyof typeof MaterialIcons.glyphMap; title: string; sub: string }
> = {
  personal: {
    icon: "person-outline",
    title: "Personal Info",
    sub: "Tell us about yourself",
  },
  bank: {
    icon: "account-balance",
    title: "Bank Details",
    sub: "For commission payouts",
  },
  security: {
    icon: "lock-outline",
    title: "Set Password",
    sub: "Secure your account",
  },
};

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  birthDate: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}
const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  state: "",
  birthDate: "",
  bank: "",
  accountName: "",
  accountNumber: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
};

function PickerField({
  label,
  value,
  options,
  onSelect,
  placeholder,
  error,
  icon,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder: string;
  error?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={pS.wrap}>
      <Text style={pS.label}>
        {label} <Text style={{ color: Colors.error }}>*</Text>
      </Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[
          pS.trigger,
          error ? pS.errored : null,
          open ? pS.triggerOpen : null,
        ]}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={Colors.textMuted}
          style={{ marginRight: 8 }}
        />
        <Text style={value ? pS.val : pS.ph}>{value || placeholder}</Text>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={22}
          color={Colors.textMuted}
        />
      </Pressable>
      {error ? <Text style={pS.err}>{error}</Text> : null}
      {open ? (
        <View style={pS.drop}>
          <ScrollView
            style={pS.dropScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                style={[pS.opt, value === opt ? pS.optSelected : null]}
              >
                <Text
                  style={[
                    pS.optText,
                    value === opt ? pS.optTextSelected : null,
                  ]}
                >
                  {opt}
                </Text>
                {value === opt ? (
                  <MaterialIcons name="check" size={18} color={Colors.brand} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
const pS = StyleSheet.create({
  wrap: { marginBottom: 16, zIndex: 10 },
  label: { ...Typography.label, color: Colors.textPrimary, marginBottom: 6 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  triggerOpen: { borderColor: Colors.brand },
  errored: { borderColor: Colors.error },
  val: { ...Typography.bodyLg, color: Colors.textPrimary, flex: 1 },
  ph: { ...Typography.bodyLg, color: Colors.textMuted, flex: 1 },
  drop: {
    position: "absolute",
    top: 86,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    ...Shadow.md,
  },
  dropScroll: { maxHeight: 220 },
  opt: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optSelected: { backgroundColor: Colors.brand50 },
  optText: { ...Typography.body, color: Colors.textPrimary },
  optTextSelected: { color: Colors.brand, fontWeight: "700" },
  err: { ...Typography.caption, color: Colors.error, marginTop: 4 },
});

export default function RealtorSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ ref?: string }>();
  const { realtorSignup, isLoading } = useAuthStore();
  const biometrics = useBiometrics();

  const [step, setStep] = useState<Step>("personal");
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    referralCode: params.ref ?? "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    biometrics.checkSupport();
  }, []);

  const update = (field: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validateStep = (s: Step) => {
    const errs: Partial<FormState> = {};
    if (s === "personal") {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
        errs.email = "Valid email is required";
      if (!form.phone.trim() || form.phone.length < 10)
        errs.phone = "Valid phone number is required";
      if (!form.state) errs.state = "State is required";
      if (!form.birthDate) errs.birthDate = "Date of birth is required";
    }
    if (s === "bank") {
      if (!form.bank) errs.bank = "Bank is required";
      if (!form.accountName.trim())
        errs.accountName = "Account name is required";
      if (!form.accountNumber.trim() || form.accountNumber.length < 10)
        errs.accountNumber = "Enter a valid 10-digit account number";
    }
    if (s === "security") {
      if (form.password.length < 8) errs.password = "Minimum 8 characters";
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };
  const prevStep = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  };

  const handleSubmit = async () => {
    if (!validateStep("security")) return;
    try {
      await realtorSignup(form);
      if (biometrics.isAvailable && !biometrics.isEnabled) {
        Alert.alert(
          "Enable Biometric Login?",
          "Sign in faster next time with Face ID or fingerprint.",
          [
            {
              text: "Not now",
              style: "cancel",
              onPress: () => router.replace("/(tabs)/dashboard" as any),
            },
            {
              text: "Enable",
              onPress: async () => {
                await biometrics.enableBiometric();
                router.replace("/(tabs)/dashboard" as any);
              },
            },
          ],
        );
      } else {
        router.replace("/(tabs)/dashboard" as any);
      }
    } catch (err: unknown) {
      Alert.alert(
        "Registration Failed",
        err instanceof Error ? err.message : "Signup failed. Please try again.",
      );
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const meta = STEP_META[step];
  const pwStrength =
    form.password.length > 0
      ? Math.min(Math.floor(form.password.length / 3), 4)
      : 0;
  // Strength uses purple shades — no gold
  const strengthColor =
    ["#DC2626", "#A35FF4", "#8A2FF0", "#700CEB"][pwStrength - 1] ??
    Colors.border;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={Gradients.royal}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.patternWrap} pointerEvents="none">
        <DotPattern width={420} height={260} opacity={0.07} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNav}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.stepCounter}>{stepIndex + 1} of 3</Text>
        </View>

        <FadeInView>
          <Text style={styles.pageTitle}>Realtor Registration</Text>
          <Text style={styles.pageSub}>
            Join KHL and start earning commissions
          </Text>

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
            <View
              style={[
                styles.stepBadge,
                stepIndex === 0 ? styles.stepBadgeCurrent : null,
              ]}
            >
              <MaterialIcons name={meta.icon} size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.stepTitle}>{meta.title}</Text>
              <Text style={styles.stepSub}>{meta.sub}</Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={[styles.card, Shadow.card]}>
            {step === "personal" ? (
              <View>
                <View style={styles.nameRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="First Name"
                      value={form.firstName}
                      onChangeText={update("firstName")}
                      placeholder="Tunde"
                      error={errors.firstName}
                      required
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Last Name"
                      value={form.lastName}
                      onChangeText={update("lastName")}
                      placeholder="Adeyemi"
                      error={errors.lastName}
                      required
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <Input
                  label="Email"
                  value={form.email}
                  onChangeText={update("email")}
                  placeholder="you@example.com"
                  error={errors.email}
                  required
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
                  label="Phone Number"
                  value={form.phone}
                  onChangeText={update("phone")}
                  placeholder="08012345678"
                  error={errors.phone}
                  required
                  keyboardType="phone-pad"
                  leftIcon={
                    <MaterialIcons
                      name="phone"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                <PickerField
                  label="State of Residence"
                  value={form.state}
                  options={STATES}
                  onSelect={update("state")}
                  placeholder="Select state"
                  error={errors.state}
                  icon="location-on"
                />
                <Input
                  label="Date of Birth"
                  value={form.birthDate}
                  onChangeText={update("birthDate")}
                  placeholder="YYYY-MM-DD"
                  error={errors.birthDate}
                  required
                  keyboardType="numbers-and-punctuation"
                  leftIcon={
                    <MaterialIcons
                      name="cake"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                <Input
                  label="Referral Code (Optional)"
                  value={form.referralCode}
                  onChangeText={update("referralCode")}
                  placeholder="e.g. kem001XX"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={
                    <MaterialIcons
                      name="redeem"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
              </View>
            ) : null}

            {step === "bank" ? (
              <View>
                <View style={styles.bankNotice}>
                  <MaterialIcons
                    name="verified-user"
                    size={18}
                    color={Colors.brand}
                  />
                  <Text style={styles.bankNoticeText}>
                    Bank details are encrypted and used only for commission
                    payouts.
                  </Text>
                </View>
                <PickerField
                  label="Bank"
                  value={form.bank}
                  options={BANKS}
                  onSelect={update("bank")}
                  placeholder="Select your bank"
                  error={errors.bank}
                  icon="account-balance"
                />
                <Input
                  label="Account Name"
                  value={form.accountName}
                  onChangeText={update("accountName")}
                  placeholder="As shown on bank statement"
                  error={errors.accountName}
                  required
                  autoCapitalize="words"
                  leftIcon={
                    <MaterialIcons
                      name="badge"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                <Input
                  label="Account Number"
                  value={form.accountNumber}
                  onChangeText={update("accountNumber")}
                  placeholder="10-digit NUBAN"
                  error={errors.accountNumber}
                  required
                  keyboardType="numeric"
                  maxLength={10}
                  leftIcon={
                    <MaterialIcons
                      name="pin"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
              </View>
            ) : null}

            {step === "security" ? (
              <View>
                <Input
                  label="Password"
                  value={form.password}
                  onChangeText={update("password")}
                  placeholder="Minimum 8 characters"
                  error={errors.password}
                  required
                  secureTextEntry
                  textContentType="newPassword"
                  leftIcon={
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                {pwStrength > 0 ? (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthBar}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthSeg,
                            i < pwStrength
                              ? { backgroundColor: strengthColor }
                              : null,
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[styles.strengthLabel, { color: strengthColor }]}
                    >
                      {strengthLabel}
                    </Text>
                  </View>
                ) : null}
                <Input
                  label="Confirm Password"
                  value={form.confirmPassword}
                  onChangeText={update("confirmPassword")}
                  placeholder="Repeat your password"
                  error={errors.confirmPassword}
                  required
                  secureTextEntry
                  textContentType="newPassword"
                  leftIcon={
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                />
                <View style={styles.termsBox}>
                  <Text style={styles.termsText}>
                    By registering you agree to KHL's{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}
                      accessibilityRole="link"
                    >
                      Terms of Service
                    </Text>{" "}
                    and{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}
                      accessibilityRole="link"
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </FadeInView>

        <View style={styles.btnRow}>
          {stepIndex > 0 ? (
            <Button
              label="Back"
              onPress={prevStep}
              variant="outline"
              style={styles.btnHalf}
            />
          ) : null}
          {step !== "security" ? (
            <Button
              label="Next Step"
              onPress={nextStep}
              style={stepIndex > 0 ? styles.btnHalf : styles.btnFull}
              fullWidth={stepIndex === 0}
            />
          ) : (
            <Button
              label={
                isLoading ? "Creating Account..." : "Create Realtor Account"
              }
              onPress={handleSubmit}
              loading={isLoading}
              variant="primary"
              style={stepIndex > 0 ? styles.btnHalf : styles.btnFull}
              fullWidth={stepIndex === 0}
            />
          )}
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.brand },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  patternWrap: { position: "absolute", top: 0, right: 0 },

  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  stepCounter: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1,
  },

  pageTitle: { ...Typography.h1, color: "#fff", marginBottom: 4 },
  pageSub: {
    ...Typography.body,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },

  progressTrack: { flexDirection: "row", gap: 4, marginBottom: 16 },
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
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  stepBadgeCurrent: { backgroundColor: "rgba(255,255,255,0.25)" },
  stepTitle: { ...Typography.label, color: "#fff", fontWeight: "800" },
  stepSub: { ...Typography.caption, color: "rgba(255,255,255,0.65)" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius["2xl"],
    padding: 20,
    marginBottom: 12,
  },
  nameRow: { flexDirection: "row" },

  bankNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand50,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  bankNoticeText: {
    ...Typography.bodySm,
    color: Colors.brand700,
    flex: 1,
    lineHeight: 18,
  },

  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: -8,
  },
  strengthBar: { flex: 1, flexDirection: "row", gap: 3 },
  strengthSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  strengthLabel: {
    ...Typography.caption,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },

  termsBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 8,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: { color: Colors.brand, fontWeight: "700" },

  btnRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  btnHalf: { flex: 1 },
  btnFull: { flex: 1 },
});
