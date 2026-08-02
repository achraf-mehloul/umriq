/**
 * Algerian payment methods reference.
 * All flows are manual bank/mobile transfers — no card processing on device.
 * Buyer sees the seller's chosen account only after the booking is confirmed.
 */
export type PaymentAccountType = "baridimob" | "ccp" | "edahabia" | "cib" | "bank" | "paypal" | "visa";

export interface PaymentMethodInfo {
  id: PaymentAccountType;
  label_ar: string;
  label_en: string;
  provider_ar: string;
  provider_en: string;
  needs_rip: boolean;
  needs_bic: boolean;
  numberLabel_ar: string;
  numberLabel_en: string;
  hint_ar: string;
  hint_en: string;
  color: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: "baridimob",
    label_ar: "بريدي موب",
    label_en: "BaridiMob",
    provider_ar: "بريد الجزائر",
    provider_en: "Algérie Poste",
    needs_rip: true,
    needs_bic: false,
    numberLabel_ar: "رقم CCP",
    numberLabel_en: "CCP number",
    hint_ar: "استخدم تطبيق BaridiMob لتحويل فوري إلى رقم CCP أو RIP.",
    hint_en: "Use the BaridiMob app to instantly transfer to a CCP or RIP.",
    color: "#f5c542",
  },
  {
    id: "ccp",
    label_ar: "CCP (بريد الجزائر)",
    label_en: "CCP (Algérie Poste)",
    provider_ar: "بريد الجزائر",
    provider_en: "Algérie Poste",
    needs_rip: true,
    needs_bic: false,
    numberLabel_ar: "رقم الحساب البريدي",
    numberLabel_en: "Postal account number",
    hint_ar: "التحويل من مكتب البريد أو تطبيق ECCP باستخدام رقم CCP أو RIP الكامل.",
    hint_en: "Transfer at the post office or via ECCP using the full CCP / RIP.",
    color: "#0aa15a",
  },
  {
    id: "edahabia",
    label_ar: "الذهبية",
    label_en: "Edahabia",
    provider_ar: "بطاقة بريد الجزائر",
    provider_en: "Algérie Poste card",
    needs_rip: false,
    needs_bic: false,
    numberLabel_ar: "رقم البطاقة الذهبية",
    numberLabel_en: "Edahabia card number",
    hint_ar: "الدفع الإلكتروني عبر بوابة SATIM أو GAB.",
    hint_en: "Online payment through SATIM gateway or ATM.",
    color: "#c99a2e",
  },
  {
    id: "cib",
    label_ar: "بطاقة CIB",
    label_en: "CIB card",
    provider_ar: "بنوك جزائرية",
    provider_en: "Algerian banks",
    needs_rip: true,
    needs_bic: true,
    numberLabel_ar: "رقم البطاقة أو RIB",
    numberLabel_en: "Card / RIB number",
    hint_ar: "التحويل من أي بنك جزائري (BNA, BEA, BADR, CPA...) عبر RIB.",
    hint_en: "Transfer from any Algerian bank (BNA, BEA, BADR, CPA...) via RIB.",
    color: "#1e6cf5",
  },
  {
    id: "bank",
    label_ar: "تحويل بنكي آخر",
    label_en: "Other bank transfer",
    provider_ar: "بنك",
    provider_en: "Bank",
    needs_rip: true,
    needs_bic: true,
    numberLabel_ar: "رقم الحساب",
    numberLabel_en: "Account number",
    hint_ar: "أي تحويل بنكي داخلي.",
    hint_en: "Any local bank transfer.",
    color: "#666",
  },
];

export function paymentMethodOf(type: PaymentAccountType) {
  return PAYMENT_METHODS.find((p) => p.id === type) ?? PAYMENT_METHODS[0];
}

/** BaridiMob / CCP RIP is 20 digits. Format for display: 4 groups of 5. */
export function formatRIP(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 20);
  return digits.replace(/(.{5})(?=.)/g, "$1 ").trim();
}
