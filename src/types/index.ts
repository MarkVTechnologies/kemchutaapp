// ─────────────────────────────────────────────────────────────────────────────
// KHL TypeScript Types — mirrors all backend Mongoose models
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth / Roles ──────────────────────────────────────────────────────────────
export type UserRole = "realtor" | "client" | "admin";

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ── Realtor ───────────────────────────────────────────────────────────────────
export interface Realtor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  birthDate: string;
  avatar?: string;
  referralCode: string;
  referralLink: string;
  recruitedBy?: string;
  role: "realtor";
  commissionRate?: number;
  totalEarned?: number;
  pendingPayout?: number;
  isActive: boolean;
  createdAt: string;
}

export interface RealtorDashboard {
  realtor: Realtor;
  downlineCount: number;
  recruiterName?: string;
  totalEarned: number;
  pendingPayout: number;
}

// ── Estate ────────────────────────────────────────────────────────────────────
export type EstatePurpose = "Residential" | "Commercial" | "Investment";
export type EstateLocation = "Lagos" | "Asaba" | "Anambra" | "Abuja";

export interface EstateGalleryItem {
  url: string;
  publicId?: string;
  caption?: string;
}
export interface EstateVideo {
  videoId: string;
  title?: string;
  url: string;
}
export interface EstateNamedItem {
  name: string;
}
export interface EstatePaymentPlan {
  plot: string;
  outright: string;
  initialDeposit?: string;
}

export interface Estate {
  _id: string;
  estate: string; // estate name (backend uses 'estate' key)
  slug: string;
  address?: string;
  location: EstateLocation;
  purpose: EstatePurpose;
  title?: string; // e.g. "CofO", "Registered survey"
  price: string; // backend stores as comma-formatted string
  sqm?: string; // e.g. "450SQM"
  desc?: string;
  category?: string;
  depositPercentage?: string;
  img?: string; // featured image URL
  imgPublicId?: string;
  gallery?: EstateGalleryItem[];
  videos?: EstateVideo[];
  amenities?: EstateNamedItem[];
  neighborhood?: EstateNamedItem[];
  paymentPlan?: EstatePaymentPlan[];
  sytemap?: string; // embeddable estate layout/map URL, rendered as an iframe on web
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;

  /** @deprecated kept so older code does not break. Use `estate` instead. */
  name?: string;
  /** @deprecated kept for compatibility. Use `img` instead. */
  featuredImage?: string;
  /** @deprecated kept for compatibility. Use `desc` instead. */
  description?: string;
}

// ── Inspection ────────────────────────────────────────────────────────────────
export type InspectionStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type InspectionPersons = 1 | 2 | 5;

export interface Inspection {
  _id: string;
  estateName: string;
  estateId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  persons: InspectionPersons;
  status: InspectionStatus;
  realtorId?: string;
  createdAt: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────
// NOTE: These status values mirror the backend STATUSES array exactly. The
// portal UI groups them into three buckets via subscriptionStatusBucket().
export type SubscriptionStatus =
  | "pending"
  | "confirmed"
  | "outright_paid"
  | "partial_paid"
  | "inst_1_paid"
  | "inst_2_paid"
  | "inst_3_paid"
  | "inst_4_paid"
  | "inst_5_paid"
  | "inst_6_paid"
  | "completed"
  | "allocated"
  | "rejected";

// Three coarse buckets the UI cares about
export type SubscriptionBucket = "active" | "pending" | "rejected";

/**
 * Single source of truth for grouping the granular backend statuses into the
 * coarse buckets the client portal displays (Active / Pending / Rejected).
 */
export function subscriptionStatusBucket(
  status?: SubscriptionStatus | string,
): SubscriptionBucket {
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  // Everything else (confirmed, *_paid, completed, allocated) is "active"
  return "active";
}

export type PaymentPlan = "Outright" | "Instalment";
export type PlotType = "Residential" | "Commercial" | "Investment";
export type PlotSize = "500sqm" | "300sqm" | "Corner Piece";

// Embedded payment record (lives inside Subscription.payments[])
export interface SubscriptionPayment {
  _id: string;
  amount: number;
  paidAt: string;
  method?: string;
  reference?: string;
  note?: string;
  recordedBy?: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string | null;
  createdAt?: string;
}

// Embedded document record (lives inside Subscription.documents[])
export interface SubscriptionDocument {
  _id: string;
  type: string; // e.g. "contract", "allocation", "receipt"
  label: string;
  url?: string;
  generatedAt?: string;
}

export interface Subscription {
  _id: string;
  referenceNumber?: string;
  // Personal
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  gender?: string;
  // Address
  residentialAddress?: string;
  cityTown?: string;
  lga?: string;
  state?: string;
  countryOfResidence?: string;
  // Plot
  estateId?: string;
  estateName?: string;
  plotType: PlotType;
  paymentPlan: PaymentPlan;
  instalmentMonths?: number | null;
  numberOfPlots: number;
  plotSize: PlotSize;
  surveyType?: string;
  totalAmount: number;
  // Payment tracking
  amountPaid?: number;
  payments?: SubscriptionPayment[];
  // Allocation
  plotNumber?: string; // backend is a single string, not an array
  plotDescription?: string;
  allocationDate?: string | null;
  // Status
  status: SubscriptionStatus;
  realtorId?: string;
  documents?: SubscriptionDocument[];
  // Virtuals attached by the backend (present on byId / my responses)
  balanceRemaining?: number;
  paymentProgressPercent?: number;
  isPaymentComplete?: boolean;
  createdAt: string;
  updatedAt?: string;

  /** @deprecated backend uses `plotNumber` (string). Kept so old code compiles. */
  plotNumbers?: string[];
}

// ── Commission ────────────────────────────────────────────────────────────────
export type CommissionStatus = "pending" | "approved" | "paid";
export type CommissionType = "direct" | "override";

export interface Commission {
  _id: string;
  realtorId: string;
  subscriptionId: string;
  amount: number;
  level: 1 | 2 | 3 | 4;
  type: CommissionType;
  status: CommissionStatus;
  estateName?: string;
  clientName?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CommissionSummary {
  totalEarned: number;
  pendingPayout: number;
  paidToDate: number;
  lastPaidAt?: string;
  commissions: Commission[];
}

// ── Payment ───────────────────────────────────────────────────────────────────
// Standalone gateway payment (kept for compatibility with any payment-gateway
// flow). The client portal reads embedded Subscription.payments[] instead.
export type PaymentStatus = "pending" | "success" | "failed";
export type PaymentGateway = "paystack" | "flutterwave";

export interface Payment {
  _id: string;
  subscriptionId: string;
  amount: number;
  reference: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

// ── Document ──────────────────────────────────────────────────────────────────
// Client-facing on-demand documents. The portal generates these via
// API.subscriptions.document(id, docType).
export type DocumentType =
  | "acknowledgement"
  | "contract"
  | "invoice"
  | "schedule"
  | "allocation"
  | "deed";

export interface KHLDocument {
  _id: string;
  type: DocumentType | string;
  label: string;
  url?: string;
  generatedAt?: string;
  createdAt?: string;
}

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationType =
  | "commission_approved"
  | "commission_paid"
  | "payment_received"
  | "payment_due"
  | "inspection_confirmed"
  | "subscription_approved"
  | "subscription_rejected"
  | "document_ready"
  | "new_recruit"
  | "new_estate"
  | "general";

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  deepLinkPath?: string;
  createdAt: string;
}

// ── API Response wrappers ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

// ── Form types ────────────────────────────────────────────────────────────────
export interface LoginForm {
  email: string;
  password: string;
}

export interface RealtorSignupForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}
