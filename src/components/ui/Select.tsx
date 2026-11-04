// ─────────────────────────────────────────────────────────────────────────────
// Select — modal list picker, styled to match Input. Mobile equivalent of the
// web app's native <select> dropdowns (Gender, Marital Status, Nationality,
// State, Country, Survey Type on the subscription form).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Radius, Spacing, Shadow } from "@/constants/theme";

interface SelectProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  placeholder?: string;
  options: string[];
  onSelect: (value: string) => void;
  /** Shows a filter box at the top of the list — for long lists (banks, states). */
  searchable?: boolean;
  /** Optional icon at the start of the field, like Input's leftIcon. */
  leftIcon?: React.ReactNode;
}

export function Select({
  label,
  required,
  error,
  value,
  placeholder = "Select an option",
  options,
  onSelect,
  searchable = false,
  leftIcon,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const hasError = Boolean(error);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const openPicker = () => {
    setQuery("");
    setOpen(true);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <Pressable
        onPress={openPicker}
        style={[styles.field, hasError && styles.errored]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={Colors.textMuted} />
      </Pressable>

      {hasError && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, Shadow.lg, { paddingBottom: insets.bottom + 12 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label || "Select"}</Text>
            {searchable ? (
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={18} color={Colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
            ) : null}
            <FlatList
              data={shown}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No matches for "{query}"</Text>
              }
              style={styles.list}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item}
                    </Text>
                    {active && (
                      <MaterialIcons name="check" size={18} color={Colors.brand} />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs },
  required: { color: Colors.error },

  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
  },
  errored: { borderColor: Colors.error, backgroundColor: Colors.errorBg },

  value: { ...Typography.bodyLg, color: Colors.textPrimary, flex: 1 },
  placeholder: { color: Colors.textMuted },

  error: { ...Typography.caption, color: Colors.error, marginTop: Spacing.xs },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,4,20,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius["2xl"],
    borderTopRightRadius: Radius["2xl"],
    maxHeight: "70%",
    paddingTop: 10,
    paddingHorizontal: Spacing.lg,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  sheetTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  list: { marginBottom: 8 },
  leftIcon: { marginRight: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchInput: {
    ...Typography.bodyLg,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 10,
  },
  empty: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionActive: {},
  optionText: { ...Typography.bodyLg, color: Colors.textPrimary },
  optionTextActive: { color: Colors.brand, fontWeight: "700" },
});
