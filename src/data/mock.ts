export interface Offer {
  id: string;
  agencyAr: string;
  agencyEn: string;
  cityAr: string;
  cityEn: string;
  airline: string;
  date: string;
  totalSeats: number;
  remaining: number;
  originalPrice: number;
  price: number;
  urgent: boolean;
  verified: boolean;
  rating: number;
  hoursLeft: number;
}

export const offers: Offer[] = [
  { id: "1", agencyAr: "وكالة الحرمين", agencyEn: "Al Haramain Travel", cityAr: "الجزائر", cityEn: "Algiers", airline: "Saudia", date: "2026-06-18", totalSeats: 12, remaining: 4, originalPrice: 285000, price: 219000, urgent: true, verified: true, rating: 4.9, hoursLeft: 6 },
  { id: "2", agencyAr: "النور للسياحة", agencyEn: "An-Nour Tours", cityAr: "وهران", cityEn: "Oran", airline: "Air Algérie", date: "2026-06-22", totalSeats: 20, remaining: 9, originalPrice: 268000, price: 235000, urgent: false, verified: true, rating: 4.7, hoursLeft: 72 },
  { id: "3", agencyAr: "بيت العمرة", agencyEn: "Bait Al Umrah", cityAr: "قسنطينة", cityEn: "Constantine", airline: "Flynas", date: "2026-07-02", totalSeats: 15, remaining: 2, originalPrice: 245000, price: 189000, urgent: true, verified: true, rating: 5.0, hoursLeft: 3 },
  { id: "4", agencyAr: "البركة ترافل", agencyEn: "Al Baraka Travel", cityAr: "عنابة", cityEn: "Annaba", airline: "Turkish Airlines", date: "2026-07-10", totalSeats: 30, remaining: 18, originalPrice: 312000, price: 289000, urgent: false, verified: true, rating: 4.6, hoursLeft: 120 },
  { id: "5", agencyAr: "الصفا والمروة", agencyEn: "As-Safa Wal-Marwa", cityAr: "سطيف", cityEn: "Setif", airline: "Saudia", date: "2026-06-28", totalSeats: 18, remaining: 6, originalPrice: 275000, price: 229000, urgent: false, verified: true, rating: 4.8, hoursLeft: 48 },
  { id: "6", agencyAr: "زمزم للسفر", agencyEn: "Zamzam Travel", cityAr: "تلمسان", cityEn: "Tlemcen", airline: "Air Algérie", date: "2026-07-05", totalSeats: 10, remaining: 1, originalPrice: 255000, price: 199000, urgent: true, verified: true, rating: 4.9, hoursLeft: 2 },
];

export interface Conversation {
  id: string;
  nameAr: string;
  nameEn: string;
  lastAr: string;
  lastEn: string;
  time: string;
  unread: number;
  online: boolean;
}

export const conversations: Conversation[] = [
  { id: "1", nameAr: "وكالة الحرمين", nameEn: "Al Haramain Travel", lastAr: "نعم متوفرة، أرسل لك التفاصيل", lastEn: "Yes available, sending details", time: "09:42", unread: 2, online: true },
  { id: "2", nameAr: "النور للسياحة", nameEn: "An-Nour Tours", lastAr: "متى تريد إتمام الحجز؟", lastEn: "When do you want to confirm?", time: "08:11", unread: 0, online: true },
  { id: "3", nameAr: "بيت العمرة", nameEn: "Bait Al Umrah", lastAr: "شكراً لك، تمت الصفقة", lastEn: "Thank you, deal closed", time: "أمس", unread: 0, online: false },
  { id: "4", nameAr: "البركة ترافل", nameEn: "Al Baraka Travel", lastAr: "سأرسل العرض النهائي قريباً", lastEn: "I'll send the final offer soon", time: "أمس", unread: 1, online: false },
];

export interface Notif {
  id: string;
  type: "deal" | "message" | "urgent" | "system";
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  time: string;
  unread: boolean;
}
export const notifs: Notif[] = [
  { id: "1", type: "urgent", titleAr: "عرض عاجل!", titleEn: "Urgent offer!", bodyAr: "6 مقاعد بخصم 23% — تنتهي خلال 3 ساعات", bodyEn: "6 seats at 23% off — ends in 3h", time: "5د", unread: true },
  { id: "2", type: "deal", titleAr: "تمت صفقة جديدة", titleEn: "New deal completed", bodyAr: "حجز 4 مقاعد مع وكالة الحرمين", bodyEn: "4 seats reserved with Al Haramain", time: "1س", unread: true },
  { id: "3", type: "message", titleAr: "رسالة جديدة", titleEn: "New message", bodyAr: "النور للسياحة: متى تريد إتمام...", bodyEn: "An-Nour Tours: When do you...", time: "3س", unread: false },
  { id: "4", type: "system", titleAr: "تم تفعيل حسابك", titleEn: "Account verified", bodyAr: "أصبح حسابك موثقاً ✓", bodyEn: "Your account is now verified ✓", time: "أمس", unread: false },
];
