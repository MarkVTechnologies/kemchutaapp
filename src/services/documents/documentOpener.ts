// ─────────────────────────────────────────────────────────────────────────────
// Document opener (Expo SDK 54) — fetches a subscription PDF with the auth token
// attached via expo/fetch, writes it to a cached File using the new
// File/Directory/Paths API, then opens it with the native viewer.
// No deprecated FileSystem calls, no web browser, no "not authorized" errors.
// ─────────────────────────────────────────────────────────────────────────────
import { fetch } from "expo/fetch";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { BASE_URL, API } from "@/constants/api";
import { TokenStore, ClientTokenStore } from "@/services/storage/tokenStore";

// Resolve whichever session token exists, mirroring the axios interceptor.
async function resolveAuthToken(): Promise<string | null> {
  try {
    const realtorToken = await TokenStore.getToken();
    if (realtorToken) return realtorToken;
  } catch {
    // ignore — fall through to client store
  }
  try {
    const clientToken = await ClientTokenStore.getToken();
    if (clientToken) return clientToken;
  } catch {
    // ignore
  }
  return null;
}

interface OpenDocOptions {
  subscriptionId: string;
  docType: string; // acknowledgement | contract | invoice | schedule | allocation | deed
  referenceNumber?: string; // used for a friendly filename
  onStart?: () => void;
  onFinish?: () => void;
}

/**
 * Downloads the requested subscription document and opens it with the device's
 * native PDF viewer. Returns true on success, false on failure.
 */
export async function openSubscriptionDocument({
  subscriptionId,
  docType,
  referenceNumber,
  onStart,
  onFinish,
}: OpenDocOptions): Promise<boolean> {
  onStart?.();
  let file: File | null = null;
  try {
    const token = await resolveAuthToken();
    if (!token) {
      Alert.alert(
        "Session Expired",
        "Please sign in again to view this document.",
      );
      return false;
    }

    const url = `${BASE_URL}${API.subscriptions.document(subscriptionId, docType)}`;

    // 1. Fetch the PDF with the Bearer token (expo/fetch supports headers)
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 404) {
        Alert.alert(
          "Not Available",
          "This document isn't ready yet. Please check back later.",
        );
      } else if (response.status === 401 || response.status === 403) {
        Alert.alert(
          "Session Expired",
          "Please sign in again to view this document.",
        );
      } else {
        Alert.alert("Couldn't Open", "Unable to open this document right now.");
      }
      return false;
    }

    // Guard: backend sends JSON (not a PDF) on some error paths
    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();
    if (contentType && !contentType.includes("pdf")) {
      Alert.alert(
        "Couldn't Open",
        "This document isn't available right now. Please try again later.",
      );
      return false;
    }

    // 2. Write the bytes to a cached file (SDK 54 File API)
    const safeRef = (referenceNumber || subscriptionId).replace(
      /[^a-zA-Z0-9-_]/g,
      "",
    );
    const dir = new Directory(Paths.cache, "documents");
    try {
      if (!dir.exists) dir.create();
    } catch {
      // directory may already exist / race — ignore and proceed
    }

    file = new File(dir, `${docType}-${safeRef}.pdf`);
    // Overwrite any stale copy
    try {
      if (file.exists) file.delete();
    } catch {
      // ignore
    }

    const bytes = await response.bytes();
    file.write(bytes);

    // 3. Hand it to the native viewer / share sheet
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert(
        "Cannot Open",
        "This device cannot preview documents. Please try again later.",
      );
      return false;
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Open document",
      UTI: "com.adobe.pdf", // iOS hint so Quick Look previews inline
    });
    return true;
  } catch (err) {
    // Surface the real reason in Metro logs so failures aren't a black box.
    console.warn("[openSubscriptionDocument] failed:", err);
    Alert.alert("Couldn't Open", "Unable to open this document right now.");
    return false;
  } finally {
    onFinish?.();
  }
}
