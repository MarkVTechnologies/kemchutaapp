// ─────────────────────────────────────────────────────────────────────────────
// API Client — Axios instance with role-aware auth + silent realtor refresh
// ─────────────────────────────────────────────────────────────────────────────
import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { BASE_URL, API } from "@/constants/api";
import { TokenStore, ClientTokenStore } from "@/services/storage/tokenStore";
import { reportNetworkSuccess, reportNetworkFailure } from "@/services/networkSignal";

// ── Create base instance ──────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000, // 15s — generous for Nigerian 3G
  headers: {
    "Content-Type": "application/json",
    "X-App-Platform": "mobile",
  },
});

// ── Role-aware token resolver ─────────────────────────────────────────────────
// Tries the realtor/admin store first, then the client store. In normal flow
// only one is ever populated at a time, so order doesn't really matter — but
// realtor-first matches the original behavior so nothing regresses.
async function resolveAuthToken(): Promise<string | null> {
  const realtorToken = await TokenStore.getToken();
  if (realtorToken) return realtorToken;
  const clientToken = await ClientTokenStore.getToken();
  return clientToken ?? null;
}

// ── Request interceptor — attach whichever token exists ──────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await resolveAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers["X-Device-Platform"] = "mobile";
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — 401 handling ──────────────────────────────────────
// The backend issues 7-day JWTs with no refresh endpoint.
// On 401: if no session exists it's a wrong-credential login → pass through.
// If a session exists it's an expired token → clear it so RouteGuard redirects.
apiClient.interceptors.response.use(
  (response) => {
    reportNetworkSuccess();
    return response;
  },
  async (error: AxiosError) => {
    // Any HTTP response at all (even an error status) proves the device
    // reached the internet — only a true network-level failure (no response)
    // means the connectivity signal should treat this as an outage.
    if (error.response) {
      reportNetworkSuccess();
    } else if (axios.isAxiosError(error)) {
      reportNetworkFailure();
    }
    if (error.response?.status === 401) {
      const realtorToken = await TokenStore.getToken();
      const clientToken  = await ClientTokenStore.getToken();

      if (!realtorToken && !clientToken) {
        // No session — login attempt with wrong credentials. Let the error
        // propagate so the login screen shows the server's message.
        return Promise.reject(error);
      }

      // Session exists but token is expired — clear and let RouteGuard redirect.
      if (realtorToken) await TokenStore.clearAll();
      if (clientToken)  await ClientTokenStore.clearAll();
    }

    return Promise.reject(error);
  },
);

// ── Legacy client portal axios instance (kept for backward compatibility) ────
// Most screens now go through `apiClient` which auto-detects the right token,
// so this is only used if older code imports it directly.
export const clientApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

clientApiClient.interceptors.request.use(async (config) => {
  const token = await ClientTokenStore.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Typed API helper ──────────────────────────────────────────────────────────
export const api = {
  get: <T>(url: string, params?: object) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  delete: <T>(url: string) => apiClient.delete<T>(url).then((r) => r.data),

  // Multipart upload (avatar, documents)
  upload: <T>(url: string, formData: FormData) =>
    apiClient
      .put<T>(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),
};
