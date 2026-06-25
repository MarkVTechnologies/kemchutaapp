import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Gradients, Typography, Radius, Spacing } from "@/constants/theme";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to crash reporting service
    if (__DEV__) {
      console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.root}>
          <LinearGradient colors={Gradients.brand} style={styles.top} />
          <View style={styles.body}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="error-outline" size={40} color={Colors.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.sub}>
              An unexpected error occurred. Tap below to recover, or restart the app if the problem persists.
            </Text>
            {__DEV__ && this.state.error ? (
              <View style={styles.debugBox}>
                <Text style={styles.debugText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}
            <Pressable onPress={this.handleReset} style={styles.btn}>
              <MaterialIcons name="refresh" size={18} color="#fff" />
              <Text style={styles.btnText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  top: { height: 120 },
  body: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.xl,
    marginTop: -40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { ...Typography.h2, color: Colors.textPrimary, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 24, maxWidth: 300 },
  debugBox: {
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.lg,
    padding: 12,
    width: "100%",
    marginBottom: 20,
  },
  debugText: { fontSize: 11, color: Colors.error, fontFamily: "monospace" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
