/**
 * Maps backend errors (including rate-limit exceptions raised by Postgres
 * triggers) to bilingual, user-facing messages.
 */
export function friendlyError(err: unknown, lang: "ar" | "en" = "ar"): string {
  const raw = (err as { message?: string })?.message ?? String(err ?? "");
  const ar = lang === "ar";

  if (raw.includes("RATE_LIMIT")) {
    if (raw.includes("offer_create")) {
      return ar
        ? "تجاوزت الحد المسموح لنشر العروض. انتظر قليلاً قبل نشر عرض جديد (10 عروض/ساعة، 30 عرض/يوم)."
        : "You reached the publishing limit. Please wait before posting again (10/hour, 30/day).";
    }
    if (raw.includes("message_send")) {
      return ar
        ? "أرسلت رسائل كثيرة بسرعة. انتظر بضع دقائق."
        : "Too many messages sent too quickly. Please wait a few minutes.";
    }
    return ar ? "عدد كبير من العمليات. حاول لاحقاً." : "Too many actions. Please try again later.";
  }

  if (raw.includes("row-level security") || raw.includes("permission denied")) {
    return ar ? "لا تملك صلاحية تنفيذ هذه العملية." : "You are not allowed to perform this action.";
  }

  return raw || (ar ? "حدث خطأ غير متوقع." : "Something went wrong.");
}
