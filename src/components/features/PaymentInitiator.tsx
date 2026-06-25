// ─────────────────────────────────────────────────────────────────────────────
// PaymentInitiator — Opens Paystack/Flutterwave checkout, verifies on close
// Backend should accept { subscriptionId, amount, email } and return
// { authorizationUrl, reference } (Paystack-style)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/services/api/client";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/authStore";

interface Props {
  subscriptionId: string;
  amount: number;
  onComplete?: () => void;
  label?: string;
}

interface InitResponse {
  authorizationUrl?: string;
  authorization_url?: string;
  link?: string;
  reference?: string;
  paymentUrl?: string;
}

const CALLBACK_URL = "khlmobile://payment-callback";

export function PaymentInitiator({
  subscriptionId,
  amount,
  onComplete,
  label = "Pay Now",
}: Props) {
  const [busy, setBusy] = useState(false);
  const client = useAuthStore((s) => s.clientUser);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<InitResponse>(
        API.payments.initializeNative,
        {
          subscriptionId,
          amount,
          email: client?.email,
          callbackUrl: CALLBACK_URL,
        },
      );
      return res.data;
    },
  });

  const handlePay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await mutation.mutateAsync();
      const url =
        data.authorizationUrl ??
        data.authorization_url ??
        data.paymentUrl ??
        data.link;

      if (!url) {
        Alert.alert(
          "Payment Error",
          "Could not start payment session. Please try again.",
        );
        return;
      }

      // Opens system browser sheet; closes when user dismisses or completes
      const result = await WebBrowser.openAuthSessionAsync(url, CALLBACK_URL);

      if (result.type === "success" || result.type === "dismiss") {
        // Backend webhook updates payment status. We just nudge parent to refetch.
        Alert.alert(
          "Payment Initiated",
          "We'll update your subscription as soon as the payment confirms. This may take up to a minute.",
          [{ text: "OK", onPress: () => onComplete?.() }],
        );
      } else if (result.type === "cancel") {
        // User cancelled — no message needed
      }
    } catch (err: any) {
      Alert.alert(
        "Payment Failed",
        err?.response?.data?.message ??
          err?.message ??
          "Could not start the payment session.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label={busy ? "Opening..." : label}
      onPress={handlePay}
      loading={busy}
      variant="primary"
      fullWidth
      size="lg"
    />
  );
}
