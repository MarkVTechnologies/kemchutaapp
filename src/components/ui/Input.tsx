// ─────────────────────────────────────────────────────────────────────────────
// Input — KHL Design System
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Colors, Typography, Radius, Spacing } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?:    boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={[
        styles.inputWrapper,
        focused   && styles.focused,
        hasError  && styles.errored,
      ]}>
        {leftIcon && (
          <View style={styles.iconLeft}>{leftIcon}</View>
        )}

        <TextInput
          ref={ref}
          style={[styles.input, leftIcon && styles.inputWithLeft, rightIcon && styles.inputWithRight]}
          placeholderTextColor={Colors.textMuted}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          accessibilityLabel={label}
          {...props}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.iconRight}
            hitSlop={8}
            accessibilityRole="button"
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {hasError && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {hint && !hasError && (
        <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
});

Input.displayName = "Input";

const styles = StyleSheet.create({
  container:   { marginBottom: Spacing.base },
  label:       { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs },
  required:    { color: Colors.error },

  inputWrapper: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    minHeight:       52,
    paddingHorizontal: Spacing.md,
  },
  focused: { borderColor: Colors.brand, backgroundColor: Colors.brandLight + "33" },
  errored: { borderColor: Colors.error, backgroundColor: Colors.errorBg },

  input: {
    flex:      1,
    ...Typography.bodyLg,
    color:     Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  inputWithLeft:  { paddingLeft: Spacing.sm },
  inputWithRight: { paddingRight: Spacing.sm },

  iconLeft:  { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm, padding: 4 },

  error: { ...Typography.caption, color: Colors.error, marginTop: Spacing.xs },
  hint:  { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
});
