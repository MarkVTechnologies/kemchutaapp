// ─────────────────────────────────────────────────────────────────────────────
// Auth Store — Zustand
// Handles realtor, client, and admin authentication state
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { TokenStore, ClientTokenStore } from "@/services/storage/tokenStore";
import { api } from "@/services/api/client";
import { API } from "@/constants/api";
import type {
  AuthUser,
  UserRole,
  LoginResponse,
  RealtorSignupForm,
} from "@/types";

interface AuthStore {
  // Realtor / Admin auth
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isHydrated: boolean; // true after secure store read on app launch

  // Client auth (separate portal)
  clientUser: AuthUser | null;
  clientToken: string | null;
  isClientLoading: boolean;

  // Actions
  hydrate: () => Promise<void>;
  realtorLogin: (email: string, password: string) => Promise<void>;
  realtorSignup: (form: RealtorSignupForm) => Promise<void>;
  clientLogin: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clientLogout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setClientUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    user: null,
    token: null,
    role: null,
    isLoading: false,
    isHydrated: false,
    clientUser: null,
    clientToken: null,
    isClientLoading: false,

    // ── Hydrate from SecureStore on app launch ──────────────────────────────
    hydrate: async () => {
      try {
        const [token, user, role] = await Promise.all([
          TokenStore.getToken(),
          TokenStore.getUser<AuthUser>(),
          TokenStore.getRole(),
        ]);
        const [clientToken, clientUser] = await Promise.all([
          ClientTokenStore.getToken(),
          ClientTokenStore.getUser<AuthUser>(),
        ]);

        set((s) => {
          s.token = token;
          s.user = user;
          s.role = role as UserRole | null;
          s.clientToken = clientToken;
          s.clientUser = clientUser;
          s.isHydrated = true;
        });
      } catch {
        set((s) => {
          s.isHydrated = true;
        });
      }
    },

    // ── Realtor login ───────────────────────────────────────────────────────
    realtorLogin: async (email, password) => {
      set((s) => {
        s.isLoading = true;
      });
      try {
        const data = await api.post<LoginResponse>(API.realtors.login, {
          email,
          password,
        });

        await Promise.all([
          TokenStore.setToken(data.token),
          TokenStore.setUser(data.user),
          TokenStore.setRole(data.user.role),
          data.refreshToken
            ? TokenStore.setRefreshToken(data.refreshToken)
            : Promise.resolve(),
        ]);

        set((s) => {
          s.token = data.token;
          s.user = data.user;
          s.role = data.user.role;
        });
      } finally {
        set((s) => {
          s.isLoading = false;
        });
      }
    },

    // ── Realtor signup ──────────────────────────────────────────────────────
    realtorSignup: async (form) => {
      set((s) => {
        s.isLoading = true;
      });
      try {
        const data = await api.post<LoginResponse>(API.realtors.signup, form);

        await Promise.all([
          TokenStore.setToken(data.token),
          TokenStore.setUser(data.user),
          TokenStore.setRole(data.user.role),
        ]);

        set((s) => {
          s.token = data.token;
          s.user = data.user;
          s.role = data.user.role;
        });
      } finally {
        set((s) => {
          s.isLoading = false;
        });
      }
    },

    // ── Client login ────────────────────────────────────────────────────────
    clientLogin: async (email, password) => {
      set((s) => {
        s.isClientLoading = true;
      });
      try {
        const data = await api.post<LoginResponse>(API.clients.login, {
          email,
          password,
        });

        await Promise.all([
          ClientTokenStore.setToken(data.token),
          ClientTokenStore.setUser(data.user),
        ]);

        set((s) => {
          s.clientToken = data.token;
          s.clientUser = data.user;
        });
      } finally {
        set((s) => {
          s.isClientLoading = false;
        });
      }
    },

    // ── Admin login ─────────────────────────────────────────────────────────
    adminLogin: async (email, password) => {
      set((s) => {
        s.isLoading = true;
      });
      try {
        const data = await api.post<LoginResponse>(API.admin.login, {
          email,
          password,
        });

        await Promise.all([
          TokenStore.setToken(data.token),
          TokenStore.setUser(data.user),
          TokenStore.setRole("admin"),
        ]);

        set((s) => {
          s.token = data.token;
          s.user = data.user;
          s.role = "admin";
        });
      } finally {
        set((s) => {
          s.isLoading = false;
        });
      }
    },

    // ── Logout (realtor / admin) ────────────────────────────────────────────
    logout: async () => {
      await TokenStore.clearAll();
      set((s) => {
        s.user = null;
        s.token = null;
        s.role = null;
      });
    },

    // ── Logout (client) ─────────────────────────────────────────────────────
    clientLogout: async () => {
      await ClientTokenStore.clearAll();
      set((s) => {
        s.clientUser = null;
        s.clientToken = null;
      });
    },

    setUser: (user) => {
      set((s) => {
        s.user = user;
      });
      void TokenStore.setUser(user);
    },

    setClientUser: (user) => {
      set((s) => {
        s.clientUser = user;
      });
      void ClientTokenStore.setUser(user);
    },
  })),
);
