// ─────────────────────────────────────────────────────────────────────────────
// BookInspectionSheet — Bottom sheet with native DateTimePicker
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";
import type { Estate, InspectionPersons } from "@/types";
import { Colors, Typography, Radius, Spacing } from "@/constants/theme";

export interface BookInspectionSheetRef {
  present: (estate: Estate) => void;
  dismiss: () => void;
}

const PERSON_OPTIONS: InspectionPersons[] = [1, 2, 5];

export const BookInspectionSheet = forwardRef<BookInspectionSheetRef>(
  (_, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["88%"], []);

    const user = useAuthStore((s) => s.user);
    const clientUser = useAuthStore((s) => s.clientUser);
    const me = clientUser ?? user;

    const [estate, setEstate] = useState<Estate | null>(null);

    // Form
    const [firstName, setFirstName] = useState(me?.firstName ?? "");
    const [lastName, setLastName] = useState(me?.lastName ?? "");
    const [email, setEmail] = useState(me?.email ?? "");
    const [phone, setPhone] = useState(me?.phone ?? "");
    const [date, setDate] = useState<Date>(() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(10, 0, 0, 0);
      return d;
    });
    const [persons, setPersons] = useState<InspectionPersons>(1);
    const [showPicker, setShowPicker] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useImperativeHandle(
      ref,
      () => ({
        present: (e: Estate) => {
          setEstate(e);
          setErrors({});
          sheetRef.current?.present();
        },
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const mutation = useMutation({
      mutationFn: async () =>
        api.post(API.inspections.book, {
          estateName: estate?.estate || estate?.name,
          estateId: estate?._id,
          firstName,
          lastName,
          email,
          phone,
          date: date.toISOString(),
          persons,
        }),
      onSuccess: () => {
        sheetRef.current?.dismiss();
        Alert.alert(
          "Inspection Booked",
          "Our team will contact you shortly to confirm the inspection details.",
        );
      },
      onError: (err: any) => {
        Alert.alert(
          "Booking Failed",
          err?.response?.data?.message ?? err?.message ?? "Please try again.",
        );
      },
    });

    const validate = () => {
      const e: Record<string, string> = {};
      if (!firstName.trim()) e.firstName = "Required";
      if (!lastName.trim()) e.lastName = "Required";
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
        e.email = "Valid email required";
      if (!phone.trim() || phone.length < 10) e.phone = "Valid phone required";
      if (date.getTime() < Date.now() + 60 * 60 * 1000)
        e.date = "Pick a future date and time";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
      if (validate()) mutation.mutate();
    };

    const onPickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") setShowPicker(false);
      if (selected) setDate(selected);
    };

    const formatDate = (d: Date) =>
      d.toLocaleString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

    // Resolve estate display name — works with both new (`estate`) and legacy (`name`) shapes
    const estateDisplayName = estate?.estate || estate?.name || "";

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
          />
        )}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name="event-available"
                  size={22}
                  color={Colors.brand}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Book an Inspection</Text>
                {estateDisplayName ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {estateDisplayName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Tunde"
                  autoCapitalize="words"
                  error={errors.firstName}
                  required
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Adeyemi"
                  autoCapitalize="words"
                  error={errors.lastName}
                  required
                />
              </View>
            </View>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
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
              value={phone}
              onChangeText={setPhone}
              placeholder="08012345678"
              keyboardType="phone-pad"
              error={errors.phone}
              required
              leftIcon={
                <MaterialIcons
                  name="phone"
                  size={20}
                  color={Colors.textMuted}
                />
              }
            />

            {/* Date picker */}
            <Text style={styles.fieldLabel}>
              Date & Time <Text style={{ color: Colors.error }}>*</Text>
            </Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={[styles.dateBtn, errors.date ? styles.dateBtnError : null]}
            >
              <MaterialIcons
                name="calendar-month"
                size={20}
                color={Colors.brand}
              />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={Colors.textMuted}
              />
            </Pressable>
            {errors.date ? (
              <Text style={styles.errorText}>{errors.date}</Text>
            ) : null}

            {showPicker ? (
              <DateTimePicker
                value={date}
                mode="datetime"
                minimumDate={new Date(Date.now() + 60 * 60 * 1000)}
                onChange={onPickerChange}
                display={Platform.OS === "ios" ? "inline" : "default"}
              />
            ) : null}

            {/* Persons */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
              Number of Visitors
            </Text>
            <View style={styles.personRow}>
              {PERSON_OPTIONS.map((n) => {
                const active = persons === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setPersons(n)}
                    style={[
                      styles.personBtn,
                      active ? styles.personBtnActive : null,
                    ]}
                  >
                    <MaterialIcons
                      name={n === 1 ? "person" : "group"}
                      size={18}
                      color={active ? "#fff" : Colors.brand}
                    />
                    <Text
                      style={[
                        styles.personText,
                        active ? styles.personTextActive : null,
                      ]}
                    >
                      {n} {n === 1 ? "Person" : "People"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 16 }} />

            <Button
              label={mutation.isPending ? "Booking..." : "Confirm Inspection"}
              onPress={handleSubmit}
              loading={mutation.isPending}
              variant="primary"
              fullWidth
              size="lg"
            />

            <View style={styles.legalRow}>
              <MaterialIcons
                name="info-outline"
                size={14}
                color={Colors.textMuted}
              />
              <Text style={styles.legalText}>
                Our team will reach out within 24 hours to confirm the visit.
              </Text>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

BookInspectionSheet.displayName = "BookInspectionSheet";

const styles = StyleSheet.create({
  background: { backgroundColor: Colors.surface, borderRadius: 28 },
  handle: { backgroundColor: Colors.ink200, width: 42 },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 4 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...Typography.h3, color: Colors.textPrimary, fontWeight: "800" },
  subtitle: { ...Typography.caption, color: Colors.textSecondary },

  divider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: 14 },

  nameRow: { flexDirection: "row" },

  fieldLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  dateBtnError: { borderColor: Colors.error },
  dateText: {
    ...Typography.bodyLg,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: "600",
  },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: 4 },

  personRow: { flexDirection: "row", gap: 8 },
  personBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
  },
  personBtnActive: { backgroundColor: Colors.brand },
  personText: { fontWeight: "700", color: Colors.brand, fontSize: 13 },
  personTextActive: { color: "#fff" },

  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  legalText: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
});
