// ─────────────────────────────────────────────────────────────────────────────
// API Endpoint Constants
// All endpoints matching the existing KHL Node.js/Express backend
// ─────────────────────────────────────────────────────────────────────────────

// Set this in your .env file: EXPO_PUBLIC_API_BASE_URL=https://your-api.com
export const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export const API = {
  // ── Estates (Public) ──────────────────────────────────────────────────────
  estates: {
    list: "/api/estates",
    bySlug: (slug: string) => `/api/estates/slug/${slug}`,
    byId: (id: string) => `/api/estates/id/${id}`,
    create: "/api/estates",
    update: (id: string) => `/api/estates/${id}`,
    delete: (id: string) => `/api/estates/${id}`,
    toggle: (id: string) => `/api/estates/${id}/toggle`,
    deleteImage: (id: string, publicId: string) =>
      `/api/estates/${id}/gallery/${encodeURIComponent(publicId)}`,
  },

  // ── Realtors ──────────────────────────────────────────────────────────────
  realtors: {
    signup: "/api/realtors/signup",
    login: "/api/realtors/login",
    dashboard: "/api/realtors/dashboard",
    myRecruits: "/api/realtors/my-recruits",
    leaderboard: "/api/realtors/leaderboard",
    recruitTree: "/api/realtors/recruits/tree", // new — Sprint 1 backend add
    networkFeed: "/api/realtors/network/feed", // new
    avatar: "/api/realtors/avatar",
    forgotPassword: "/api/realtors/forgot-password",
    resetPassword: "/api/realtors/reset-password",
    updateMe: "/api/realtors/me",
    updateBank: "/api/realtors/me/bank",
    changePassword: "/api/realtors/me/password",
    preferences: "/api/realtors/me/preferences",
    list: "/api/realtors",
    byId: (id: string) => `/api/realtors/${id}`,
    update: (id: string) => `/api/realtors/${id}`,
    delete: (id: string) => `/api/realtors/${id}`,
  },

  // ── Clients ───────────────────────────────────────────────────────────────
  clients: {
    register: "/api/clients/register",
    login: "/api/clients/login",
    forgotPassword: "/api/clients/forgot-password",
    resetPassword: "/api/clients/reset-password",
    profile: "/api/clients/me",
    dashboard: "/api/clients/dashboard", // { stats, subscriptions, investments, ... }
    inspections: "/api/clients/inspections", // { inspections, total, page, pages }
    updateMe: "/api/clients/me",
    changePassword: "/api/clients/me/password",
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    login: "/api/admin/login",
    forgotPassword: "/api/admin/forgot-password",
    resetPassword: "/api/admin/reset-password",
    dashboard: "/api/admin/dashboard",
    analytics: "/api/admin/analytics",
  },

  // ── Auth (shared) ─────────────────────────────────────────────────────────
  auth: {
    me: "/api/auth/me",
    refresh: "/api/auth/refresh", // new — Sprint 1 backend add
  },

  // ── Inspections ───────────────────────────────────────────────────────────
  inspections: {
    book: "/api/inspections",
    list: "/api/inspections",
    updateStatus: (id: string) => `/api/inspections/${id}/status`,
    updateNotes: (id: string) => `/api/inspections/${id}/notes`,
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  subscriptions: {
    submit: "/api/subscriptions",
    // Client portal — returns ONLY the logged-in client's subscriptions
    // (matched by email server-side). This is the endpoint the client app
    // must use; `list` below is the admin-only table and 403s for clients.
    my: "/api/subscriptions/my",
    list: "/api/subscriptions", // admin-only
    byId: (id: string) => `/api/subscriptions/${id}`, // admin-only
    updateStatus: (id: string) => `/api/subscriptions/${id}/status`,
    // On-demand PDF generation (shared admin + client). docType is one of:
    // acknowledgement | contract | invoice | schedule | allocation | deed
    document: (id: string, docType: string) =>
      `/api/subscriptions/${id}/documents/${docType}`,
  },

  // ── Commissions ───────────────────────────────────────────────────────────
  commissions: {
    my: "/api/commissions/my",       // realtor: own commissions + totals
    list: "/api/commissions",        // admin only
    tiers: "/api/commissions/tiers", // admin: get/update tier %s
    pay: (id: string) => `/api/commissions/${id}/pay`,
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  payments: {
    initializeNative: "/api/payments/initialize-native",
    webhook: "/api/payments/webhook",
    list: "/api/payments",
    myPayments: "/api/payments/my",
  },

  // ── Devices (Push Notifications) ─────────────────────────────────────────
  devices: {
    register: "/api/devices/register",
    unregister: "/api/devices/unregister",
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    inbox: "/api/notifications/inbox",
    markRead: (id: string) => `/api/notifications/${id}/read`,
  },

  // ── Buy2Sell ──────────────────────────────────────────────────────────────
  buy2sell: {
    roi: "/api/buy2sell/roi",
    leads: "/api/buy2sell/leads",
    leadById: (id: string) => `/api/buy2sell/leads/${id}`,
    recordPayment: (id: string) => `/api/buy2sell/leads/${id}/record-payment`,
    mature: (id: string) => `/api/buy2sell/leads/${id}/mature`,
    payout: (id: string) => `/api/buy2sell/leads/${id}/process-payout`,
  },

  // ── Branches (Contact info) ───────────────────────────────────────────────
  branches: {
    list: "/api/branches",
    create: "/api/branches",
    update: (branchId: string) => `/api/branches/${branchId}`,
    delete: (branchId: string) => `/api/branches/${branchId}`,
  },

  // ── Bank Accounts ─────────────────────────────────────────────────────────
  bankAccounts: {
    list: "/api/bank-accounts",
    create: "/api/bank-accounts",
    update: (id: string) => `/api/bank-accounts/${id}`,
    delete: (id: string) => `/api/bank-accounts/${id}`,
  },

  // ── Knowledge Base ────────────────────────────────────────────────────────
  knowledgeBase: {
    get: "/api/knowledge-base",
    updateCompanyInfo: "/api/knowledge-base/company-info",
    addFaq: "/api/knowledge-base/faqs",
    updateFaq: (id: string) => `/api/knowledge-base/faqs/${id}`,
    deleteFaq: (id: string) => `/api/knowledge-base/faqs/${id}`,
    addNotice: "/api/knowledge-base/notices",
    deleteNotice: (id: string) => `/api/knowledge-base/notices/${id}`,
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  contact: {
    submit: "/api/contact",
    ai: {
      chat: "/api/ai/chat", // backend expects { message, history } → returns { reply }
    },
  },
} as const;
