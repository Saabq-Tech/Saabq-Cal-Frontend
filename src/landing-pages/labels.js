/**
 * Fixed text inside landing page templates. Templates render in the page's own language
 * (landing page content.locale), which can differ from the dashboard language, so these labels
 * live here instead of translations.js. Business content itself comes from the workspace.
 * Each entry is { ar, en }; keep the Arabic text on its `ar:` line (lang:check relies on it).
 */
const LABELS = {
  about: { ar: "عن النشاط", en: "About" },
  services: { ar: "الخدمات", en: "Services" },
  team: { ar: "الفريق", en: "Team" },
  gallery: { ar: "الصور", en: "Gallery" },
  schedule: { ar: "الجدول", en: "Schedule" },
  booking: { ar: "الحجز", en: "Booking" },
  faq: { ar: "أسئلة متكررة", en: "FAQ" },
  contact: { ar: "العنوان والتواصل", en: "Location & contact" },
  hours: { ar: "مواعيد العمل", en: "Opening hours" },
  closed: { ar: "مغلق", en: "Closed" },
  phone: { ar: "هاتف", en: "Phone" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  email: { ar: "البريد", en: "Email" },
  poweredBy: { ar: "الحجز عبر تقويم سابق", en: "Booking by Saabq Cal" },
  slotsNote: {
    ar: "اختر الخدمة والوقت المناسب من المواعيد المتاحة",
    en: "Pick a service and an available time",
  },
  full: { ar: "مكتمل", en: "Full" },
  book: { ar: "احجز", en: "Book" },
  bookDefault: { ar: "احجز موعدًا", en: "Book an appointment" },
  learnMore: { ar: "تعرّف علينا", en: "Learn more" },
  menu: { ar: "القائمة", en: "Menu" },
  map: { ar: "خريطة الموقع", en: "Map" },
  photo: { ar: "صورة", en: "Photo" },
  heroPhoto: {
    ar: "صورة الغلاف من إعدادات الهوية",
    en: "Cover image from branding settings",
  },
  insidePhoto: { ar: "صورة المكان من الداخل", en: "Interior photo" },
  free: { ar: "مجانًا", en: "Free" },
  minutes: { ar: "دقيقة", en: "min" },

  dentalUrgent: { ar: "ألم الآن؟ موعد عاجل", en: "In pain now? Urgent visit" },
  dentalJourney: { ar: "رحلة العلاج", en: "Treatment journey" },
  dentalPriceNote: {
    ar: "السعر النهائي يُحدد بعد الفحص.",
    en: "The final price is set after the examination.",
  },

  medicalTeams: { ar: "الأقسام والأطباء", en: "Departments & doctors" },
  medicalSearchLabel: {
    ar: "ابحث بالقسم أو نوع الكشف",
    en: "Search by department or visit type",
  },
  medicalSearchPlaceholder: { ar: "مثال: باطنة", en: "e.g. Internal medicine" },
  medicalDepartments: { ar: "الأقسام", en: "Departments" },
  medicalNoResults: { ar: "لا توجد نتائج لـ", en: "No results for" },
  medicalNextSlot: {
    ar: "اختر أقرب موعد متاح عند الحجز",
    en: "Choose the next available time when booking",
  },
  medicalBranches: { ar: "الفروع", en: "Branches" },

  therapyApproach: { ar: "طريقتي", en: "Approach" },
  therapyApproachTitle: { ar: "طريقتي في العمل", en: "How I work" },
  therapyAreas: { ar: "مجالات العمل", en: "Areas" },
  therapyWorkWith: { ar: "أعمل مع", en: "I work with" },
  therapyNotListed: {
    ar: "إن لم يكن ما تمر به ضمن هذه القائمة، يمكنك حجز مكالمة تعارف لنعرف إن كنت الشخص المناسب أو نرشح لك غيري.",
    en: "If what you are going through is not listed, book an intro call so we can see whether I am the right fit or suggest someone else.",
  },
  therapyAboutMe: { ar: "عنّي", en: "About me" },
  therapyFirstSession: { ar: "الجلسة الأولى", en: "First session" },
  therapyReady: {
    ar: "حين تكون مستعدًا، اختر وقتًا للجلسة الأولى.",
    en: "When you are ready, choose a time for the first session.",
  },
  therapyIntroCall: {
    ar: "أو مكالمة تعارف قصيرة",
    en: "Or a short intro call",
  },
  therapyPlace: { ar: "مكان الجلسات", en: "Where sessions take place" },
  therapyEmergency: { ar: "في حالة الطوارئ", en: "In an emergency" },
  therapyEmergencyText: {
    ar: "إذا كنت في خطر الآن، لا تنتظر موعدًا: تواصل مع خدمات الطوارئ المحلية فورًا.",
    en: "If you are in danger right now, do not wait for an appointment: contact your local emergency services immediately.",
  },

  consultingOffice: { ar: "المكتب", en: "The firm" },
  consultingAbout: { ar: "عن المكتب", en: "About the firm" },
  consultingPractice: { ar: "مجالات الممارسة", en: "Practice areas" },
  consultingPracticeNav: { ar: "مجالات العمل", en: "Practice" },
  consultingHow: { ar: "كيف نعمل معك", en: "How we work with you" },
  consultingNotes: { ar: "مقالات وملاحظات", en: "Notes" },
  consultingNotesNav: { ar: "مقالات", en: "Notes" },
  consultingBookLine: {
    ar: "احجز جلسة أولى، واكتب ملخص موضوعك. يبقى ما تكتبه سريًا.",
    en: "Book a first session and summarize your matter. What you write stays confidential.",
  },

  beautyStory: { ar: "قصتنا", en: "Our story" },
  beautyWork: { ar: "أعمالنا", en: "Our work" },
  beautyWorkTitle: { ar: "من أعمالنا", en: "From our work" },
  beautyExperts: { ar: "الخبيرات", en: "Our experts" },
  beautyMenu: { ar: "قائمة الخدمات", en: "Service menu" },
  beautyPriceNote: {
    ar: "قد تختلف الأسعار حسب الطول والحالة",
    en: "Prices may vary with length and condition",
  },
  beautyBookTitle: { ar: "احجزي موعدك", en: "Book your visit" },
  beautyBookText: {
    ar: "اختاري الخدمة والخبيرة والوقت المناسب. يصلك تأكيد وتذكير قبل الموعد.",
    en: "Choose the service, expert and time. You will get a confirmation and a reminder before your visit.",
  },
  beautyWelcome: { ar: "نستقبلك", en: "We are open" },
  beautyAddress: { ar: "العنوان", en: "Address" },
  beautyReach: { ar: "تواصلي", en: "Get in touch" },

  educationAbout: { ar: "من نحن", en: "About us" },
  educationPrograms: { ar: "البرامج", en: "Programs" },
  educationWeek: { ar: "جدول الأسبوع", en: "Weekly schedule" },
  educationTrial: { ar: "ابدأ بحصة تجريبية", en: "Start with a trial class" },
  educationTrialText: {
    ar: "احضر حصة واحدة قبل الاشتراك، واختر موعدها من الجدول المتاح.",
    en: "Attend one class before you enroll, at a time that suits you.",
  },
  educationTeachers: { ar: "المدرسون", en: "Teachers" },
  educationFaq: { ar: "أسئلة أولياء الأمور", en: "Parent questions" },

  creativeWork: { ar: "الأعمال", en: "Work" },
  creativeAbout: { ar: "عن الاستوديو", en: "About the studio" },
  creativePackages: { ar: "الباقات", en: "Packages" },
  creativeBigger: {
    ar: "مشروع أكبر أو فيديو؟ احجز مكالمة لتحديد النطاق.",
    en: "Bigger project or video? Book a call to scope it.",
  },
  creativeAsk: { ar: "عندك مشروع؟", en: "Have a project?" },

  fitnessClub: { ar: "النادي", en: "The club" },
  fitnessAbout: { ar: "عن النادي", en: "About the club" },
  fitnessClasses: { ar: "الكلاسات", en: "Classes" },
  fitnessWeek: { ar: "كلاسات الأسبوع", en: "This week's classes" },
  fitnessCoaches: { ar: "المدربون", en: "Coaches" },
  fitnessPlans: { ar: "الاشتراكات", en: "Memberships" },
  fitnessTrial: { ar: "احجز زيارة تجريبية", en: "Book a trial visit" },
  fitnessVisit: { ar: "زورنا", en: "Visit us" },

  servicesAbout: { ar: "عن الشركة", en: "About us" },
  servicesAreas: { ar: "المناطق", en: "Areas" },
  servicesReach: { ar: "نصل إلى", en: "Where we work" },
  servicesWork: { ar: "من أعمالنا", en: "Our work" },
  servicesType: { ar: "نوع الخدمة", en: "Service" },
  servicesWhen: { ar: "الموعد المفضل", en: "Preferred time" },
  servicesToday: { ar: "اليوم", en: "Today" },
  servicesTomorrow: { ar: "غدًا", en: "Tomorrow" },
  servicesOtherDay: { ar: "يوم آخر", en: "Another day" },
  servicesContinue: { ar: "اختيار الموعد", en: "Choose a time" },

  companyAbout: { ar: "الشركة", en: "Company" },
  companyAboutTitle: { ar: "عن الشركة", en: "About the company" },
  companySolutions: { ar: "الحلول", en: "Solutions" },
  companySolutionsTitle: { ar: "الحلول والخدمات", en: "Solutions & services" },
  companyLeadership: { ar: "الإدارة", en: "Leadership" },
  companyDemo: { ar: "احجز عرضًا توضيحيًا", en: "Book a demo" },
  companyExplore: { ar: "تعرف على الحلول", en: "Explore solutions" },
  companyTalk: { ar: "تحدث مع الفريق المناسب", en: "Talk to the right team" },
  companyTalkText: {
    ar: "لكل فريق مواعيده. اختر الفريق ونوع الاجتماع.",
    en: "Each team has its own availability. Pick a team and a meeting type.",
  },
  companyTeam: { ar: "الفريق", en: "Team" },
  companyMeetingType: { ar: "نوع الاجتماع", en: "Meeting type" },
  companyBookMeeting: { ar: "احجز الاجتماع", en: "Book the meeting" },
  companyRouting: {
    ar: "يُوزَّع الحجز على عضو متاح من الفريق.",
    en: "Your booking goes to an available team member.",
  },
  companyHq: { ar: "المقر والتواصل", en: "Office & contact" },

  realestateCompany: { ar: "الشركة", en: "Company" },
  realestateAbout: { ar: "عن الشركة", en: "About the company" },
  realestateProjects: { ar: "المشروعات", en: "Projects" },
  realestateUnits: { ar: "الوحدات", en: "Units" },
  realestateUnitsTitle: { ar: "الوحدات المتاحة", en: "Available units" },
  realestateUnitsPrices: { ar: "الوحدات والأسعار", en: "Units & prices" },
  realestateType: { ar: "النوع", en: "Type" },
  realestateArea: { ar: "التفاصيل", en: "Details" },
  realestateFrom: { ar: "يبدأ من", en: "From" },
  realestateViewing: { ar: "معاينة", en: "Viewing" },
  realestateBookViewing: { ar: "احجز معاينة", en: "Book a viewing" },
  realestateViewingText: {
    ar: "يرافقك مستشار مبيعات في الموقع أو المكتب، أو عبر مكالمة فيديو.",
    en: "A sales advisor meets you on site, at the office or over a video call.",
  },
  realestatePlace: { ar: "مكان المعاينة", en: "Viewing location" },
  realestateOnSite: { ar: "في الموقع", en: "On site" },
  realestateOffice: { ar: "في المكتب", en: "At the office" },
  realestateVideo: { ar: "فيديو", en: "Video" },
  realestateConfirm: {
    ar: "اختيار موعد المعاينة",
    en: "Choose a viewing time",
  },
  realestateAdvisors: { ar: "مستشارو المبيعات", en: "Sales advisors" },
};

/** Label for the page language, falling back to Arabic. */
export function tl(lang, key) {
  const entry = LABELS[key];
  if (!entry) return key;
  return entry[lang] || entry.ar;
}

export const LABEL_KEYS = Object.keys(LABELS);
