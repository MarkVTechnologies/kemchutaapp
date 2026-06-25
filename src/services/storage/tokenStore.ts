// ─────────────────────────────────────────────────────────────────────────────
// Token Store — Secure Enclave via expo-secure-store
// NEVER stores tokens in AsyncStorage (XSS-equivalent risk on web)
// iOS: Keychain Services  |  Android: EncryptedSharedPreferences / Keystore
// ─────────────────────────────────────────────────────────────────────────────
import * as SecureStore from "expo-secure-store";

const KEYS = {
  TOKEN:         "khl_access_token",
  REFRESH_TOKEN: "khl_refresh_token",
  USER:          "khl_user_json",
  ROLE:          "khl_user_role",
  BIOMETRIC:     "khl_biometric_enabled",
  // Client portal has its own separate token space
  CLIENT_TOKEN:  "khl_client_access_token",
  CLIENT_USER:   "khl_client_user_json",
} as const;

// ── Realtor / Admin token ─────────────────────────────────────────────────────
export const TokenStore = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async setUser(user: object): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  async getUser<T = unknown>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setRole(role: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ROLE, role);
  },

  async getRole(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ROLE);
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.BIOMETRIC, String(enabled));
  },

  async isBiometricEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEYS.BIOMETRIC);
    return val === "true";
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
      SecureStore.deleteItemAsync(KEYS.ROLE),
    ]);
  },
};

// ── Client portal token (separate namespace) ──────────────────────────────────
export const ClientTokenStore = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.CLIENT_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.CLIENT_TOKEN);
  },

  async setUser(user: object): Promise<void> {
    await SecureStore.setItemAsync(KEYS.CLIENT_USER, JSON.stringify(user));
  },

  async getUser<T = unknown>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(KEYS.CLIENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.CLIENT_TOKEN),
      SecureStore.deleteItemAsync(KEYS.CLIENT_USER),
    ]);
  },
};
