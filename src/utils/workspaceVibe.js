/**
 * SAABQ-CAL WORKSPACE VIBE & INDUSTRY DESIGN ENGINE
 *
 * Provides specialized visual aesthetics, localized terminology, badges,
 * icons, and customized workflows based on the workspace category.
 */

const VIBE_DEFINITIONS = {
  clinic: {
    key: "clinic",
    badgeIcon: "shield",
    accentColor: "#0284c7",
    ar: {
      badge: "عيادة واستشارات طبية معتمدة",
      tagline: "رعاية طبية تخصصية معتمدة وحجز استشارات دقيقة",
      specialistTitle: "طبيب / أخصائي معتمد",
      specialistRoleDefault: "طبيب متخصص",
      specialistPrefix: "د. ",
      customerSingular: "مريض / مراجع",
      customerPlural: "المرضى والمراجعين",
      serviceTerm: "كشف / استشارة طبية",
      serviceTermPlural: "الكشوفات والاستشارات",
      durationLabel: "مدة الكشف",
      bookAction: "احجز كشفاً طبياً",
      bookWithSpecialist: "احجز موعداً مع الدكتور",
      notesLabel: "الأعراض أو الملاحظات الطبية",
      notesPlaceholder:
        "يرجى ذكر الأعراض أو التاريخ المرضي أو أي تفاصيل طبية مفيدة...",
      todayStatsLabel: "كشوفات اليوم",
      todayStatsDesc: "كشوفات واستشارات مجدولة لليوم",
      totalBookingsLabel: "إجمالي الكشوفات",
      totalBookingsDesc: "كافة الكشوفات والمواعيد المسجلة",
      dashboardGreetingPrefix: "مرحباً دكتور",
      dashboardBadge: "عيادة ومركز طبي",
      confirmationTitle: "تم تأكيد حجز الموعد الطبي بنجاح!",
      confirmationSubtitle:
        "نتمنى لكم دوام الصحة والعافية. تم إرسال تفاصيل الكشف إلى بيانات التواصل.",
      perks: [
        {
          icon: "shield",
          title: "رعاية طبية معتمدة",
          desc: "كفاءات وأطباء متخصصون",
        },
        {
          icon: "clock",
          title: "دقة في المواعيد",
          desc: "كشف مريح بلا انتظار",
        },
        { icon: "users", title: "خصوصية سريرية", desc: "سجل متابعة آمن وسري" },
      ],
    },
    en: {
      badge: "Certified Medical Clinic",
      tagline:
        "Specialized healthcare and precise clinical appointment scheduling",
      specialistTitle: "Certified Physician / Specialist",
      specialistRoleDefault: "Medical Specialist",
      specialistPrefix: "Dr. ",
      customerSingular: "Patient",
      customerPlural: "Patients",
      serviceTerm: "Medical Consultation",
      serviceTermPlural: "Consultations & Checkups",
      durationLabel: "Checkup Duration",
      bookAction: "Book Medical Visit",
      bookWithSpecialist: "Book with Doctor",
      notesLabel: "Symptoms & Medical Notes",
      notesPlaceholder:
        "Describe symptoms, medical history or important clinical notes...",
      todayStatsLabel: "Today's Consultations",
      todayStatsDesc: "Clinical checkups scheduled for today",
      totalBookingsLabel: "Total Consultations",
      totalBookingsDesc: "All recorded clinical bookings",
      dashboardGreetingPrefix: "Welcome Doctor",
      dashboardBadge: "Medical & Health Clinic",
      confirmationTitle: "Medical Appointment Confirmed!",
      confirmationSubtitle:
        "Wishing you good health. Consultation details have been sent to your contact info.",
      perks: [
        {
          icon: "shield",
          title: "Certified Medical Care",
          desc: "Board-certified specialists",
        },
        {
          icon: "clock",
          title: "Punctual Consultations",
          desc: "Smooth visits with minimal wait",
        },
        {
          icon: "users",
          title: "Clinical Privacy",
          desc: "Confidential and secure records",
        },
      ],
    },
  },

  consulting: {
    key: "consulting",
    badgeIcon: "crown",
    accentColor: "#d97706",
    ar: {
      badge: "استشارات قانونية وإدارية معتمدة",
      tagline: "حلول استراتيجية واستشارات احترافية بأعلى معايير السرية",
      specialistTitle: "مستشار / محامي معتمد",
      specialistRoleDefault: "مستشار قانوني وإداري",
      specialistPrefix: "أ. ",
      customerSingular: "عميل / موكل",
      customerPlural: "الموكلين والعملاء",
      serviceTerm: "جلسة استشارية",
      serviceTermPlural: "الجلسات الاستشارية",
      durationLabel: "مدة الجلسة",
      bookAction: "احجز جلسة استشارية",
      bookWithSpecialist: "احجز استشارة مع المستشار",
      notesLabel: "موضوع الاستشارة أو القضية",
      notesPlaceholder:
        "يرجى توضيح محاور الاستشارة أو تفاصيل المعاملة والهدف المطلوب...",
      todayStatsLabel: "استشارات اليوم",
      todayStatsDesc: "جلسات استشارية مجدولة لليوم",
      totalBookingsLabel: "إجمالي الجلسات",
      totalBookingsDesc: "كافة الاستشارات والاجتماعات المسجلة",
      dashboardGreetingPrefix: "أهلاً بك سعادة المستشار",
      dashboardBadge: "مكتب استشارات وإدارة",
      confirmationTitle: "تم تأكيد الجلسة الاستشارية بنجاح!",
      confirmationSubtitle:
        "ملتزمون بتقديم الرأي السديد وأفضل الحلول الاستراتيجية.",
      perks: [
        {
          icon: "shield",
          title: "سرية مهنية مطلقة",
          desc: "حماية معلومات وقضايا العملاء",
        },
        {
          icon: "award",
          title: "خبرة معتمدة",
          desc: "مستشارون وقانونيون مرخصون",
        },
        {
          icon: "clock",
          title: "جلسات مركزة",
          desc: "استشارات دقيقة ونتائج عملية",
        },
      ],
    },
    en: {
      badge: "Certified Legal & Business Consulting",
      tagline:
        "Strategic advisory and expert counsel with strict professional confidentiality",
      specialistTitle: "Certified Consultant / Legal Advisor",
      specialistRoleDefault: "Senior Advisor",
      specialistPrefix: "Esq. ",
      customerSingular: "Client",
      customerPlural: "Clients",
      serviceTerm: "Advisory Session",
      serviceTermPlural: "Advisory Sessions",
      durationLabel: "Session Duration",
      bookAction: "Book Advisory Session",
      bookWithSpecialist: "Book with Consultant",
      notesLabel: "Consultation Subject & Case Brief",
      notesPlaceholder:
        "Outline the key topics, case details, or strategic goals for the session...",
      todayStatsLabel: "Today's Consultations",
      todayStatsDesc: "Advisory meetings scheduled for today",
      totalBookingsLabel: "Total Consultations",
      totalBookingsDesc: "All recorded consulting engagements",
      dashboardGreetingPrefix: "Welcome Consultant",
      dashboardBadge: "Executive Advisory Firm",
      confirmationTitle: "Advisory Session Confirmed!",
      confirmationSubtitle:
        "We look forward to delivering strategic solutions for your objectives.",
      perks: [
        {
          icon: "shield",
          title: "Strict Confidentiality",
          desc: "Protected client disclosures",
        },
        {
          icon: "award",
          title: "Certified Expertise",
          desc: "Licensed professional counsel",
        },
        {
          icon: "clock",
          title: "Focused Strategy",
          desc: "Actionable and high-impact sessions",
        },
      ],
    },
  },

  beauty: {
    key: "beauty",
    badgeIcon: "sparkles",
    accentColor: "#ec4899",
    ar: {
      badge: "صالون وتجميل وعناية فاخرة",
      tagline: "تجربة عناية وتألق فريدة بأحدث التقنيات وأجود المنتجات",
      specialistTitle: "خبير / خبيرة تجميل معتمدة",
      specialistRoleDefault: "أخصائي عناية وتجميل",
      specialistPrefix: "",
      customerSingular: "ضيف / عميل",
      customerPlural: "العملاء والضيوف",
      serviceTerm: "جلسة عناية وتجميل",
      serviceTermPlural: "جلسات العناية والتجميل",
      durationLabel: "مدة الجلسة",
      bookAction: "احجز جلسة عناية",
      bookWithSpecialist: "احجزي مع الخبيرة",
      notesLabel: "تفضيلات العناية أو طلبات خاصة",
      notesPlaceholder:
        "يرجى ذكر أي حساسية أو تفضيلات خاصة بالقص أو التصفيف أو العلاج...",
      todayStatsLabel: "جلسات اليوم",
      todayStatsDesc: "جلسات عناية وتجميل مجدولة لليوم",
      totalBookingsLabel: "إجمالي الجلسات",
      totalBookingsDesc: "كافة حجوزات العناية والجمال",
      dashboardGreetingPrefix: "أهلاً بك في الصالون",
      dashboardBadge: "مركز تجميل وعناية",
      confirmationTitle: "تم تأكيد موعد العناية والتألق!",
      confirmationSubtitle: "ننتظر تشريفكم لنمنحكم أرقى تجربة استرخاء وجمال.",
      perks: [
        {
          icon: "sparkles",
          title: "عناية فاخرة وراقية",
          desc: "أجواء استرخاء متكاملة",
        },
        {
          icon: "award",
          title: "منتجات أصلية 100%",
          desc: "أجود الماركات العالمية المعتمدة",
        },
        {
          icon: "clock",
          title: "عناية مخصصة لك",
          desc: "جلسات شخصية فائقة العناية",
        },
      ],
    },
    en: {
      badge: "Luxury Beauty & Wellness Salon",
      tagline:
        "Exclusive aesthetic and spa experiences tailored to your signature style",
      specialistTitle: "Certified Beauty Specialist / Stylist",
      specialistRoleDefault: "Beauty Stylist",
      specialistPrefix: "",
      customerSingular: "Guest / Client",
      customerPlural: "Guests & Clients",
      serviceTerm: "Beauty & Care Session",
      serviceTermPlural: "Beauty Sessions",
      durationLabel: "Treatment Duration",
      bookAction: "Book Beauty Experience",
      bookWithSpecialist: "Book with Stylist",
      notesLabel: "Care Preferences or Special Requests",
      notesPlaceholder:
        "Mention any sensitivities, style inspirations or specific preferences...",
      todayStatsLabel: "Today's Sessions",
      todayStatsDesc: "Beauty treatments scheduled for today",
      totalBookingsLabel: "Total Sessions",
      totalBookingsDesc: "All recorded aesthetic appointments",
      dashboardGreetingPrefix: "Welcome Stylist",
      dashboardBadge: "Beauty & Wellness Studio",
      confirmationTitle: "Beauty Experience Confirmed!",
      confirmationSubtitle:
        "We look forward to pampering you with the finest personal care.",
      perks: [
        {
          icon: "sparkles",
          title: "Luxury Pampering",
          desc: "Relaxing boutique environment",
        },
        {
          icon: "award",
          title: "100% Authentic Products",
          desc: "Premium certified salon lines",
        },
        {
          icon: "clock",
          title: "Personalized Care",
          desc: "Custom treatments for you",
        },
      ],
    },
  },

  education: {
    key: "education",
    badgeIcon: "users",
    accentColor: "#6366f1",
    ar: {
      badge: "أكاديمية تعليم وتدريب وتطوير",
      tagline: "مناهج تعليمية تفاعلية وتدريب احترافي لبناء المهارات المستقبلية",
      specialistTitle: "معلم / مدرب أكاديمي معتمد",
      specialistRoleDefault: "مدرب ومحاضر معتمد",
      specialistPrefix: "أ. ",
      customerSingular: "طالب / متدرب",
      customerPlural: "الطلاب والمتدربين",
      serviceTerm: "حصة تعليمية / جلسة تدريب",
      serviceTermPlural: "الحصص والدورات التدريبية",
      durationLabel: "مدة الحصة",
      bookAction: "احجز حصة تعليمية",
      bookWithSpecialist: "احجز مع المعلم",
      notesLabel: "المستوى الدراسي أو أهداف التعلم",
      notesPlaceholder:
        "يرجى ذكر المرحلة التعليمية أو الموضوعات المراد التركيز عليها...",
      todayStatsLabel: "حصص اليوم",
      todayStatsDesc: "حصص ودروس تدريبية مجدولة لليوم",
      totalBookingsLabel: "إجمالي الحصص",
      totalBookingsDesc: "كافة الحصص والورش التدريبية المسجلة",
      dashboardGreetingPrefix: "مرحباً أستاذ",
      dashboardBadge: "أكاديمية تعليم وتطوير",
      confirmationTitle: "تم تأكيد الحصة التعليمية بنجاح!",
      confirmationSubtitle: "خطوة واثقة نحو التميز العلمي وبناء المعرفة.",
      perks: [
        {
          icon: "award",
          title: "مناهج تدريب معتمدة",
          desc: "تعليم تفاعلي مبسط وشامل",
        },
        {
          icon: "users",
          title: "متابعة فردية دقيقة",
          desc: "جلسات 1-على-1 لرفع المستوى",
        },
        {
          icon: "clock",
          title: "مرونة في المواعيد",
          desc: "أوقات تناسب جدول دراستك",
        },
      ],
    },
    en: {
      badge: "Education & Coaching Academy",
      tagline:
        "Interactive educational curricula and professional skill-building masterclasses",
      specialistTitle: "Certified Instructor / Academic Coach",
      specialistRoleDefault: "Course Instructor",
      specialistPrefix: "Prof. ",
      customerSingular: "Student / Learner",
      customerPlural: "Students & Learners",
      serviceTerm: "Lesson / Coaching Session",
      serviceTermPlural: "Lessons & Classes",
      durationLabel: "Lesson Duration",
      bookAction: "Book a Lesson",
      bookWithSpecialist: "Book with Instructor",
      notesLabel: "Academic Level or Learning Goals",
      notesPlaceholder:
        "Specify grade level, current topics or key learning objectives...",
      todayStatsLabel: "Today's Lessons",
      todayStatsDesc: "Classes and lessons scheduled for today",
      totalBookingsLabel: "Total Lessons",
      totalBookingsDesc: "All recorded lessons and courses",
      dashboardGreetingPrefix: "Welcome Instructor",
      dashboardBadge: "Education & Academy",
      confirmationTitle: "Lesson Confirmed Successfully!",
      confirmationSubtitle:
        "A steady step toward academic mastery and practical skills.",
      perks: [
        {
          icon: "award",
          title: "Certified Curriculum",
          desc: "Engaging, outcome-driven classes",
        },
        {
          icon: "users",
          title: "Focused 1-on-1 Guidance",
          desc: "Personalized mentorship",
        },
        {
          icon: "clock",
          title: "Flexible Scheduling",
          desc: "Slots that fit your academic calendar",
        },
      ],
    },
  },

  creative: {
    key: "creative",
    badgeIcon: "image",
    accentColor: "#8b5cf6",
    ar: {
      badge: "استوديو تصوير وإنتاج إبداعي",
      tagline: "إنتاج بصري واحترافي يحول الأفكار إلى لقطات وقصص خالدة",
      specialistTitle: "مصور / مخرج إبداعي معتمد",
      specialistRoleDefault: "مصور وصانع محتوى",
      specialistPrefix: "",
      customerSingular: "عميل / مبدع",
      customerPlural: "العملاء والمبدعين",
      serviceTerm: "جلسة تصوير / عمل إبداعي",
      serviceTermPlural: "جلسات التصوير والإنتاج",
      durationLabel: "مدة جلسة التصوير",
      bookAction: "احجز جلسة تصوير",
      bookWithSpecialist: "احجز مع المصور",
      notesLabel: "فكرة العمل أو تفاصيل جلسة التصوير",
      notesPlaceholder:
        "يرجى توضيح فكرة التصوير، الملابس، أو الموقع المقترح وأي متطلبات...",
      todayStatsLabel: "جلسات تصوير اليوم",
      todayStatsDesc: "جلسات إنتاج وتصوير مجدولة لليوم",
      totalBookingsLabel: "إجمالي الجلسات",
      totalBookingsDesc: "كافة حجوزات الإنتاج والتصوير",
      dashboardGreetingPrefix: "أهلاً بك في الاستوديو",
      dashboardBadge: "استوديو وإنتاج إبداعي",
      confirmationTitle: "تم تأكيد جلسة التصوير الإبداعي!",
      confirmationSubtitle:
        "نحن مستعدون لصناعة عمل بصري استثنائي يليق برؤيتكم.",
      perks: [
        {
          icon: "image",
          title: "معدات وإضاءة سينمائية",
          desc: "أحدث كاميرات وأطقم تصوير احترافية",
        },
        {
          icon: "sparkles",
          title: "معالجة فنية متقنة",
          desc: "تحرير وتلوين بأعلى جودة",
        },
        {
          icon: "clock",
          title: "تسليم سريع للمحتوى",
          desc: "معاينة وتسليم للقطات بدقة عالية",
        },
      ],
    },
    en: {
      badge: "Creative & Photography Studio",
      tagline:
        "High-end visual production transforming visions into timeless imagery",
      specialistTitle: "Certified Photographer / Creative Director",
      specialistRoleDefault: "Creative Director",
      specialistPrefix: "",
      customerSingular: "Client / Creator",
      customerPlural: "Clients & Creators",
      serviceTerm: "Photo Shoot / Creative Session",
      serviceTermPlural: "Shoots & Productions",
      durationLabel: "Shoot Duration",
      bookAction: "Book Photo Shoot",
      bookWithSpecialist: "Book with Photographer",
      notesLabel: "Creative Concept & Shoot Details",
      notesPlaceholder:
        "Share project concepts, outfit inspirations, locations, or deliverables...",
      todayStatsLabel: "Today's Shoots",
      todayStatsDesc: "Creative shoots scheduled for today",
      totalBookingsLabel: "Total Shoots",
      totalBookingsDesc: "All recorded studio sessions",
      dashboardGreetingPrefix: "Welcome Creator",
      dashboardBadge: "Production & Studio",
      confirmationTitle: "Photo Shoot Confirmed!",
      confirmationSubtitle:
        "We are ready to craft stunning visuals that exceed your vision.",
      perks: [
        {
          icon: "image",
          title: "Pro Cinematic Gear",
          desc: "Industry-standard cameras & lights",
        },
        {
          icon: "sparkles",
          title: "Artistic Retouching",
          desc: "Masterful color grading & edit",
        },
        {
          icon: "clock",
          title: "Express Deliverables",
          desc: "High-resolution delivery",
        },
      ],
    },
  },

  fitness: {
    key: "fitness",
    badgeIcon: "crown",
    accentColor: "#f97316",
    ar: {
      badge: "نادي لياقة ورياضة وبناء أجسام",
      tagline:
        "برامج تدريبية مكثفة ومدربون محترفون للوصول إلى ذروة اللياقة البدنية",
      specialistTitle: "مدرب شخصي / كوتش معتمد",
      specialistRoleDefault: "كوتش تدريب ولياقة",
      specialistPrefix: "كوتش ",
      customerSingular: "مشترك / رياضي",
      customerPlural: "المشتركين والأبطال",
      serviceTerm: "حصة تدريبية / تمرين",
      serviceTermPlural: "الحصص والتمارين الرياضية",
      durationLabel: "مدة التمرين",
      bookAction: "احجز حصة تدريبية",
      bookWithSpecialist: "احجز تمرين مع الكوتش",
      notesLabel: "الأهداف الرياضية أو الحالة البدنية",
      notesPlaceholder:
        "يرجى ذكر أهدافك (تضخيم، تنشيف، لياقة) وأي إصابات أو ملاحظات صحية...",
      todayStatsLabel: "تمارين اليوم",
      todayStatsDesc: "حصص وتدريبات بدنية مجدولة لليوم",
      totalBookingsLabel: "إجمالي التمارين",
      totalBookingsDesc: "كافة الحصص والتمارين المسجلة",
      dashboardGreetingPrefix: "مرحباً كوتش",
      dashboardBadge: "نادي رياضي ولياقة",
      confirmationTitle: "تم تأكيد موعد التمرين بنجاح!",
      confirmationSubtitle: "استعد لتمارين قوية تكسر بها أرقامك القياسية!",
      perks: [
        {
          icon: "award",
          title: "خطط تدريب مخصصة",
          desc: "برامج تدريب وتغذية تناسب جسمك",
        },
        {
          icon: "users",
          title: "إشراف كوتش معتمد",
          desc: "توجيه لحظي لضبط الأداء الصحيح",
        },
        {
          icon: "clock",
          title: "تتبع التطور المستمر",
          desc: "قياس الأوزان والنتائج دورياً",
        },
      ],
    },
    en: {
      badge: "Fitness & Sports Athletics Club",
      tagline:
        "High-performance fitness coaching and personalized athletic conditioning",
      specialistTitle: "Personal Trainer / Certified Coach",
      specialistRoleDefault: "Fitness Coach",
      specialistPrefix: "Coach ",
      customerSingular: "Athlete / Member",
      customerPlural: "Athletes & Members",
      serviceTerm: "Training Session / Workout",
      serviceTermPlural: "Workouts & Sessions",
      durationLabel: "Workout Duration",
      bookAction: "Book Workout Session",
      bookWithSpecialist: "Book with Coach",
      notesLabel: "Fitness Goals & Physical Conditions",
      notesPlaceholder:
        "Specify workout targets (strength, conditioning, fat loss) and any injuries...",
      todayStatsLabel: "Today's Workouts",
      todayStatsDesc: "Training sessions scheduled for today",
      totalBookingsLabel: "Total Workouts",
      totalBookingsDesc: "All recorded training bookings",
      dashboardGreetingPrefix: "Welcome Coach",
      dashboardBadge: "Athletic Club & Gym",
      confirmationTitle: "Training Session Confirmed!",
      confirmationSubtitle:
        "Get ready to push boundaries and crush your personal best!",
      perks: [
        {
          icon: "award",
          title: "Custom Training Plans",
          desc: "Tailored workouts and diet guidance",
        },
        {
          icon: "users",
          title: "Certified Coach Guidance",
          desc: "Real-time form and technique focus",
        },
        {
          icon: "clock",
          title: "Progress Milestones",
          desc: "Track power and body composition",
        },
      ],
    },
  },

  services: {
    key: "services",
    badgeIcon: "clock",
    accentColor: "#2563eb",
    ar: {
      badge: "خدمات عامة وصيانة احترافية",
      tagline:
        "تنفيذ دقيق وسريع لجميع أعمال الصيانة والخدمات العامة بضمان الجودة",
      specialistTitle: "فني / خبير صيانة معتمد",
      specialistRoleDefault: "فني متخصص",
      specialistPrefix: "فني ",
      customerSingular: "عميل / مستفيد",
      customerPlural: "العملاء والمستفيدين",
      serviceTerm: "طلب خدمة / موعد صيانة",
      serviceTermPlural: "طلبات ومواعيد الصيانة",
      durationLabel: "مدة الخدمة التقديرية",
      bookAction: "احجز موعد خدمة",
      bookWithSpecialist: "احجز مع الفني المختص",
      notesLabel: "تفاصيل العطل أو متطلبات الخدمة",
      notesPlaceholder:
        "يرجى توضيح نوع العطل، موقع العمل، أو أي أدوات ومستلزمات مطلوبة...",
      todayStatsLabel: "مواعيد خدمة اليوم",
      todayStatsDesc: "زيارات ومواعيد صيانة مجدولة لليوم",
      totalBookingsLabel: "إجمالي طلبات الخدمة",
      totalBookingsDesc: "كافة طلبات وزيارات الصيانة المسجلة",
      dashboardGreetingPrefix: "مرحباً بك",
      dashboardBadge: "مركز خدمات وصيانة",
      confirmationTitle: "تم تأكيد طلب الخدمة بنجاح!",
      confirmationSubtitle:
        "فريقنا جاهز لتنفيذ طلبكم بأعلى درجات الإتقان والسرعة.",
      perks: [
        {
          icon: "shield",
          title: "ضمان جودة معتمد",
          desc: "التزام تام بمعايير العمل والإتقان",
        },
        {
          icon: "clock",
          title: "التزام بالمواعيد",
          desc: "سرعة في الحضور والاستجابة",
        },
        {
          icon: "award",
          title: "فنيون محترفون",
          desc: "خبرة متراكمة وأدوات متطورة",
        },
      ],
    },
    en: {
      badge: "Professional Services & Maintenance",
      tagline:
        "Prompt, dependable service execution and expert repairs with verified quality",
      specialistTitle: "Certified Technician / Specialist",
      specialistRoleDefault: "Certified Technician",
      specialistPrefix: "",
      customerSingular: "Customer / Client",
      customerPlural: "Customers & Clients",
      serviceTerm: "Service Visit / Maintenance",
      serviceTermPlural: "Service Visits",
      durationLabel: "Estimated Duration",
      bookAction: "Book Service Visit",
      bookWithSpecialist: "Book with Technician",
      notesLabel: "Issue Description or Requirements",
      notesPlaceholder:
        "Describe the issue, work site access, or specific parts required...",
      todayStatsLabel: "Today's Service Visits",
      todayStatsDesc: "Maintenance visits scheduled for today",
      totalBookingsLabel: "Total Service Orders",
      totalBookingsDesc: "All recorded maintenance requests",
      dashboardGreetingPrefix: "Welcome Specialist",
      dashboardBadge: "Maintenance & Services",
      confirmationTitle: "Service Order Confirmed!",
      confirmationSubtitle:
        "Our technicians are prepared to execute your request with excellence.",
      perks: [
        {
          icon: "shield",
          title: "Quality Guarantee",
          desc: "Rigorous standards and warranty",
        },
        {
          icon: "clock",
          title: "Punctual Response",
          desc: "Rapid dispatch and prompt timing",
        },
        {
          icon: "award",
          title: "Certified Techs",
          desc: "Vetted experts with advanced tools",
        },
      ],
    },
  },

  default: {
    key: "default",
    badgeIcon: "calendar",
    accentColor: "#026982",
    ar: {
      badge: "مساحة عمل وحجوزات احترافية",
      tagline: "حجز مواعيد سهل وسلس وتنظيم مواعيد ذكي وفوري",
      specialistTitle: "أخصائي / مستشار معتمد",
      specialistRoleDefault: "أخصائي معتمد",
      specialistPrefix: "",
      customerSingular: "عميل",
      customerPlural: "العملاء",
      serviceTerm: "موعد / خدمة",
      serviceTermPlural: "الخدمات والمواعيد",
      durationLabel: "المدة",
      bookAction: "احجز موعداً",
      bookWithSpecialist: "احجز موعداً",
      notesLabel: "ملاحظات إضافية أو تفاصيل الحجز",
      notesPlaceholder: "اكتب أي تفاصيل أو متطلبات ترغب في مشاركتها مسبقاً...",
      todayStatsLabel: "مواعيد اليوم",
      todayStatsDesc: "مواعيد مجدولة لليوم",
      totalBookingsLabel: "إجمالي الحجوزات",
      totalBookingsDesc: "كافة الحجوزات المسجلة",
      dashboardGreetingPrefix: "مرحباً بك",
      dashboardBadge: "مساحة عمل احترافية",
      confirmationTitle: "تم تأكيد موعدك بنجاح!",
      confirmationSubtitle: "تم إرسال كافة تفاصيل الموعد وتأكيد الحجز بنجاح.",
      perks: [
        {
          icon: "calendar",
          title: "حجز إلكتروني فوري",
          desc: "تأكيد لحظي وتحديث مستمر",
        },
        {
          icon: "clock",
          title: "مواعيد دقيقة",
          desc: "تنظيم ذكي للوقت والجلسات",
        },
        { icon: "shield", title: "خدمة موثوقة", desc: "تجربة سلسة ومريحة" },
      ],
    },
    en: {
      badge: "Professional Workspace & Appointments",
      tagline: "Seamless appointment booking and automated calendar scheduling",
      specialistTitle: "Certified Specialist",
      specialistRoleDefault: "Specialist",
      specialistPrefix: "",
      customerSingular: "Client",
      customerPlural: "Clients",
      serviceTerm: "Appointment",
      serviceTermPlural: "Appointments",
      durationLabel: "Duration",
      bookAction: "Book Appointment",
      bookWithSpecialist: "Book Appointment",
      notesLabel: "Additional Notes or Details",
      notesPlaceholder:
        "Add any specific details or preferences you wish to share in advance...",
      todayStatsLabel: "Today's Schedule",
      todayStatsDesc: "Appointments scheduled for today",
      totalBookingsLabel: "Total Bookings",
      totalBookingsDesc: "All recorded bookings",
      dashboardGreetingPrefix: "Welcome",
      dashboardBadge: "Professional Workspace",
      confirmationTitle: "Appointment Confirmed!",
      confirmationSubtitle: "All booking details have been sent successfully.",
      perks: [
        {
          icon: "calendar",
          title: "Instant Online Booking",
          desc: "Real-time calendar confirmation",
        },
        {
          icon: "clock",
          title: "Precision Scheduling",
          desc: "Automated buffer and slot handling",
        },
        {
          icon: "shield",
          title: "Reliable Experience",
          desc: "Seamless and stress-free service",
        },
      ],
    },
  },
};

/**
 * Identify the workspace vibe key from workspace data.
 */
export function getWorkspaceVibeKey(workspace) {
  if (!workspace) return "default";

  // Check explicit type ID or slug
  const typeId = workspace.workspace_type_id || workspace.workspace_type?.id;
  const rawType = workspace.workspace_type;

  let textToMatch = "";
  if (typeof rawType === "string") {
    textToMatch += " " + rawType;
  } else if (rawType && typeof rawType === "object") {
    textToMatch += " " + (rawType.slug || "");
    textToMatch += " " + (rawType.name?.en || rawType.name?.ar || "");
    if (typeof rawType.name === "string") textToMatch += " " + rawType.name;
  }

  if (workspace.name) {
    if (typeof workspace.name === "string") textToMatch += " " + workspace.name;
    else if (typeof workspace.name === "object") {
      textToMatch += " " + (workspace.name.ar || workspace.name.en || "");
    }
  }

  if (workspace.description) {
    if (typeof workspace.description === "string")
      textToMatch += " " + workspace.description;
    else if (typeof workspace.description === "object") {
      textToMatch +=
        " " + (workspace.description.ar || workspace.description.en || "");
    }
  }

  const s = textToMatch.toLowerCase();

  // Match Clinic / Medical
  if (
    typeId === 1 ||
    s.includes("clinic") ||
    s.includes("medic") ||
    s.includes("doctor") ||
    s.includes("dental") ||
    s.includes("health") ||
    s.includes("therap") ||
    s.includes("عياد") ||
    s.includes("طبية") ||
    s.includes("طبيب") ||
    s.includes("أسنان") ||
    s.includes("كشف") ||
    s.includes("علاج")
  ) {
    return "clinic";
  }

  // Match Legal & Business Consulting
  if (
    typeId === 2 ||
    s.includes("consult") ||
    s.includes("legal") ||
    s.includes("advisory") ||
    s.includes("law") ||
    s.includes("business") ||
    s.includes("financ") ||
    s.includes("استشار") ||
    s.includes("قانون") ||
    s.includes("إدار") ||
    s.includes("محام") ||
    s.includes("مالي")
  ) {
    return "consulting";
  }

  // Match Beauty & Wellness Salons
  if (
    typeId === 3 ||
    s.includes("beauty") ||
    s.includes("salon") ||
    s.includes("spa") ||
    s.includes("wellness") ||
    s.includes("barber") ||
    s.includes("hair") ||
    s.includes("nail") ||
    s.includes("makeup") ||
    s.includes("صالون") ||
    s.includes("تجميل") ||
    s.includes("عناية") ||
    s.includes("سبا") ||
    s.includes("حلاق") ||
    s.includes("مشغل")
  ) {
    return "beauty";
  }

  // Match Education & Coaching
  if (
    typeId === 4 ||
    s.includes("edu") ||
    s.includes("teach") ||
    s.includes("coach") ||
    s.includes("academy") ||
    s.includes("school") ||
    s.includes("tutor") ||
    s.includes("course") ||
    s.includes("train") ||
    s.includes("تعليم") ||
    s.includes("تدريب") ||
    s.includes("تطوير") ||
    s.includes("أكاديم") ||
    s.includes("مدرس") ||
    s.includes("دورة") ||
    s.includes("معهد")
  ) {
    return "education";
  }

  // Match Creative & Photography Studios
  if (
    typeId === 5 ||
    s.includes("creative") ||
    s.includes("studio") ||
    s.includes("photo") ||
    s.includes("design") ||
    s.includes("media") ||
    s.includes("video") ||
    s.includes("art") ||
    s.includes("استوديو") ||
    s.includes("تصوير") ||
    s.includes("إبداع") ||
    s.includes("تصميم") ||
    s.includes("إنتاج") ||
    s.includes("فوتو")
  ) {
    return "creative";
  }

  // Match Fitness & Sports Clubs
  if (
    typeId === 6 ||
    s.includes("gym") ||
    s.includes("fitness") ||
    s.includes("sport") ||
    s.includes("athlet") ||
    s.includes("workout") ||
    s.includes("crossfit") ||
    s.includes("club") ||
    s.includes("أندي") ||
    s.includes("رياض") ||
    s.includes("لياق") ||
    s.includes("جيم") ||
    s.includes("تمرين") ||
    s.includes("كوتش")
  ) {
    return "fitness";
  }

  // Match General Services & Maintenance
  if (
    typeId === 7 ||
    s.includes("servic") ||
    s.includes("maintenance") ||
    s.includes("repair") ||
    s.includes("clean") ||
    s.includes("fix") ||
    s.includes("خدمات") ||
    s.includes("صيان") ||
    s.includes("تصليح") ||
    s.includes("نظاف") ||
    s.includes("فني")
  ) {
    return "services";
  }

  return "default";
}

/**
 * Returns complete localized tokens, terms, perks, and styles for a workspace.
 */
export function getWorkspaceVibe(workspace, lang = "ar") {
  const vibeKey = getWorkspaceVibeKey(workspace);
  const def = VIBE_DEFINITIONS[vibeKey] || VIBE_DEFINITIONS.default;
  const localized = def[lang] || def.ar || def.en;

  // Honor explicit custom customer labels set on workspace if any
  const customSingular = workspace?.customer_label_singular;
  const customPlural = workspace?.customer_label_plural;

  const resolvedCustomerSingular = customSingular
    ? typeof customSingular === "object"
      ? customSingular[lang] ||
        customSingular.ar ||
        customSingular.en ||
        localized.customerSingular
      : customSingular
    : localized.customerSingular;

  const resolvedCustomerPlural = customPlural
    ? typeof customPlural === "object"
      ? customPlural[lang] ||
        customPlural.ar ||
        customPlural.en ||
        localized.customerPlural
      : customPlural
    : localized.customerPlural;

  return {
    key: def.key,
    badgeIcon: def.badgeIcon,
    accentColor: def.accentColor,
    isClinic: def.key === "clinic",
    isConsulting: def.key === "consulting",
    isBeauty: def.key === "beauty",
    isEducation: def.key === "education",
    isCreative: def.key === "creative",
    isFitness: def.key === "fitness",
    isServices: def.key === "services",
    isDefault: def.key === "default",
    ...localized,
    customerSingular: resolvedCustomerSingular,
    customerPlural: resolvedCustomerPlural,
  };
}
