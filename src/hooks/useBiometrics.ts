// ─────────────────────────────────────────────────────────────────────────────
// useBiometrics — Face ID / Touch ID / Android Biometric
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { TokenStore } from "@/services/storage/tokenStore";

export type BiometricType = "faceId" | "fingerprint" | "iris" | "none";

interface BiometricState {
  isAvailable:   boolean;
  isEnrolled:    boolean;
  isEnabled:     boolean;   // user opted in
  biometricType: BiometricType;
}

export function useBiometrics() {
  const [state, setState] = useState<BiometricState>({
    isAvailable:   false,
    isEnrolled:    false,
    isEnabled:     false,
    biometricType: "none",
  });

  // ── Check device support ──────────────────────────────────────────────────
  const checkSupport = useCallback(async () => {
    const [hasHardware, isEnrolled, types, isEnabled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      TokenStore.isBiometricEnabled(),
    ]);

    let biometricType: BiometricType = "none";
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = "faceId";
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = "fingerprint";
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = "iris";
    }

    setState({
      isAvailable:   hasHardware && isEnrolled,
      isEnrolled,
      isEnabled,
      biometricType,
    });

    return { hasHardware, isEnrolled, biometricType };
  }, []);

  // ── Authenticate ──────────────────────────────────────────────────────────
  const authenticate = useCallback(async (
    promptMessage = "Confirm your identity to continue",
  ): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Use Password",
        disableDeviceFallback: false,
        fallbackLabel: "Enter Password",
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  // ── Enable biometric login ────────────────────────────────────────────────
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    const success = await authenticate("Enable Face ID / Biometric login");
    if (success) {
      await TokenStore.setBiometricEnabled(true);
      setState((s) => ({ ...s, isEnabled: true }));
    }
    return success;
  }, [authenticate]);

  // ── Disable biometric login ───────────────────────────────────────────────
  const disableBiometric = useCallback(async () => {
    await TokenStore.setBiometricEnabled(false);
    setState((s) => ({ ...s, isEnabled: false }));
  }, []);

  return {
    ...state,
    checkSupport,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
}
