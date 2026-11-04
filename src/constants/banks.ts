// ─────────────────────────────────────────────────────────────────────────────
// Nigerian banks for payout details (realtor signup). Commercial and
// non-interest banks, plus the digital banks / MFBs / PSBs people commonly
// get paid into. The backend stores `bank` as free text, so adding names here
// never breaks existing accounts. "Other" lets the user type a bank that
// isn't listed. Labels for banks that were in the original list are kept
// short and familiar (GTBank, UBA, FCMB …).
// ─────────────────────────────────────────────────────────────────────────────

export const OTHER_BANK = "Other (type it in)";

export const NIGERIAN_BANKS: string[] = [
  // Commercial banks
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank",
  "FCMB",
  "Globus Bank",
  "GTBank",
  "Keystone Bank",
  "Nova Bank",
  "Optimus Bank",
  "Parallex Bank",
  "Polaris Bank",
  "PremiumTrust Bank",
  "Providus Bank",
  "Signature Bank",
  "Stanbic IBTC",
  "Standard Chartered",
  "Sterling Bank",
  "SunTrust Bank",
  "Titan Trust Bank",
  "UBA",
  "Union Bank",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
  // Non-interest banks
  "Jaiz Bank",
  "Lotus Bank",
  "TAJBank",
  "The Alternative Bank",
  // Digital banks, microfinance banks and payment service banks
  "9PSB",
  "Carbon",
  "FairMoney MFB",
  "Kuda Bank",
  "LAPO MFB",
  "Moniepoint",
  "MoMo PSB",
  "OPay",
  "Paga",
  "PalmPay",
  "Rubies MFB",
  "SmartCash PSB",
  "Sparkle",
  "VFD Microfinance Bank",
].sort((a, b) => a.localeCompare(b));
