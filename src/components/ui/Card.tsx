import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radius, Shadow, Spacing } from "@/constants/theme";

interface CardProps {
  children:  React.ReactNode;
  style?:    ViewStyle;
  padding?:  number;
  shadow?:   keyof typeof Shadow | false;
  border?:   boolean;
}

export function Card({
  children,
  style,
  padding = Spacing.base,
  shadow  = "card",
  border  = false,
}: CardProps) {
  return (
    <View style={[
      styles.card,
      shadow && Shadow[shadow],
      border && styles.bordered,
      { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius:    Radius["2xl"],
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
