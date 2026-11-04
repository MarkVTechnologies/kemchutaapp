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
import { Select } from "@/components/ui/Select";
import { NIGERIAN_BANKS, OTHER_BANK } from "@/constants/banks";
import {
  OTHER_COUNTRY,
  REGIONS_BY_COUNTRY,
  SIGNUP_COUNTRIES,
} from "@/constants/locations";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { DotPattern } from "@/components/ui/DotPattern";
import { useAuthStore } from "@/store/authStore";
import { TERMS_URL, PRIVACY_URL } from "@/constants/links";
import { useBiometrics } from "@/hooks/useBiometrics";
import { useAndroidKeyboardInset } from "@/hooks/useAndroidKeyboardInset";
import {
  Colors,
  Typography,
  Radius,
  Shadow,
  Gradients,
} from "@/constants/theme";

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
  country: string;
  countryOther: string;
  state: string;
  birthDate: string;
  bank: string;
  bankOther: string;
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
  country: "Nigeria",
  countryOther: "",
  state: "",
  birthDate: "",
  bank: "",
  bankOther: "",
  accountName: "",
  accountNumber: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
};

export default function RealtorSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardInset = useAndroidKeyboardInset();
  const params = useLocalSearchParams<{ ref?: string }>();
  const { realtorSignup, isLoading } = useAuthStore();
  const biometrics = useBiometrics();

  const [step, setStep] = useState<Step>("personal");
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    referralCode: params.ref ?? "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [showPw, setShowPw] = useState(false);

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
      if (form.country === OTHER_COUNTRY && !form.countryOther.trim())
        errs.countryOther = "Country is required";
      if (!form.state.trim()) errs.state = "State is required";
      if (!form.birthDate) errs.birthDate = "Date of birth is required";
    }
    if (s === "bank") {
      if (!form.bank) errs.bank = "Bank is required";
      if (form.bank === OTHER_BANK && !form.bankOther.trim())
        errs.bankOther = "Enter your bank's name";
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
      // Explicit payload, mirroring the web form. `ref` (not referralCode) is
      // the field the API reads — sending the form as-is silently dropped
      // referral codes, so recruiters weren't credited.
      const ref = form.referralCode.trim();
      await realtorSignup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate,
        country:
          form.country === OTHER_COUNTRY ? form.countryOther.trim() : form.country,
        state: form.state.trim(),
        bank: form.bank === OTHER_BANK ? form.bankOther.trim() : form.bank,
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        password: form.password,
        ...(ref ? { ref } : {}),
      });
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: keyboardInset },
        ]}
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
                <Select
                  label="Country of Residence"
                  required
                  value={form.country}
                  options={SIGNUP_COUNTRIES}
                  onSelect={(c) => {
                    // A state from the previous country no longer applies.
                    setForm((f) => ({ ...f, country: c, state: "" }));
                    setErrors((e) => ({ ...e, countryOther: undefined, state: undefined }));
                  }}
                  searchable
                  leftIcon={
                    <MaterialIcons name="public" size={20} color={Colors.textMuted} />
                  }
                />
                {form.country === OTHER_COUNTRY ? (
                  <Input
                    label="Country"
                    value={form.countryOther}
                    onChangeText={update("countryOther")}
                    placeholder="Type your country"
                    error={errors.countryOther}
                    required
                    autoCapitalize="words"
                  />
                ) : null}
                {REGIONS_BY_COUNTRY[form.country] ? (
                  <Select
                    label={form.country === "Nigeria" ? "State of Residence" : "State / Region"}
                    required
                    value={form.state}
                    options={REGIONS_BY_COUNTRY[form.country]}
                    onSelect={update("state")}
                    placeholder="Select state"
                    error={errors.state}
                    searchable
                    leftIcon={
                      <MaterialIcons name="location-on" size={20} color={Colors.textMuted} />
                    }
                  />
                ) : (
                  <Input
                    label="State / Region"
                    value={form.state}
                    onChangeText={update("state")}
                    placeholder="Type your state or region"
                    error={errors.state}
                    required
                    autoCapitalize="words"
                    leftIcon={
                      <MaterialIcons name="location-on" size={20} color={Colors.textMuted} />
                    }
                  />
                )}
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
                <Select
                  label="Bank"
                  required
                  value={form.bank}
                  options={[...NIGERIAN_BANKS, OTHER_BANK]}
                  onSelect={update("bank")}
                  placeholder="Select your bank"
                  error={errors.bank}
                  searchable
                  leftIcon={
                    <MaterialIcons name="account-balance" size={20} color={Colors.textMuted} />
                  }
                />
                {form.bank === OTHER_BANK ? (
                  <Input
                    label="Bank Name"
                    value={form.bankOther}
                    onChangeText={update("bankOther")}
                    placeholder="Type your bank's name"
                    error={errors.bankOther}
                    required
                    autoCapitalize="words"
                  />
                ) : null}
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
                  secureTextEntry={!showPw}
                  textContentType="newPassword"
                  rightIcon={
                    <MaterialIcons
                      name={showPw ? "visibility-off" : "visibility"}
                      size={20}
                      color={Colors.textMuted}
                    />
                  }
                  onRightIconPress={() => setShowPw((v) => !v)}
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
                  secureTextEntry={!showPw}
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

        {/* Each Button sits in a flex wrapper with fullWidth: Button applies
            `style` to an inner view, so flex on it never widened the button. */}
        <View style={styles.btnRow}>
          {stepIndex > 0 ? (
            <View style={styles.btnBack}>
              <Button label="Back" onPress={prevStep} variant="outline" fullWidth />
            </View>
          ) : null}
          <View style={styles.btnMain}>
            {step !== "security" ? (
              <Button label="Next Step" onPress={nextStep} fullWidth />
            ) : (
              <Button
                label={
                  isLoading ? "Creating Account..." : "Create Realtor Account"
                }
                onPress={handleSubmit}
                loading={isLoading}
                variant="primary"
                fullWidth
              />
            )}
          </View>
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
  btnBack: { flex: 1 },
  btnMain: { flex: 2 },
});
