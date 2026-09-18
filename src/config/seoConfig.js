/**
 * Centralized SEO Configuration for Saabq Cal (سابق كول)
 *
 * Provides unified, structured, and bilingual (AR/EN) SEO metadata,
 * OpenGraph, Twitter Cards, and JSON-LD Structured Data for all frontend routes.
 */

export const SITE_CONFIG = {
  name: {
    ar: "سابق كول — Saabq Cal",
    en: "Saabq Cal — سابق كول",
  },
  shortName: "Saabq Cal",
  baseUrl: "https://cal.saabq.com",
  defaultOgImage: "/logo.png",
  twitterHandle: "@SaabqCal",
  companyName: "Saabq Tech",
  defaultKeywords: {
    ar: "حجز مواعيد, جدولة ذكية, إدارة المواعيد, مساحات عمل, سابق كول, استشارات, عيادات, خدمات أعمال, حجز أونلاين",
    en: "appointment scheduling, smart booking, calendar management, workspace booking, saabq cal, consultations, online scheduling software",
  },
};

/**
 * Generates Schema.org JSON-LD structured data objects.
 */
export const structuredDataSchemas = {
  organization: (origin = SITE_CONFIG.baseUrl) => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Saabq Cal",
    alternateName: "سابق كول",
    url: origin,
    logo: `${origin}/logo.png`,
    sameAs: [
      "https://twitter.com/SaabqCal",
      "https://facebook.com/SaabqCal",
      "https://linkedin.com/company/saabq",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Arabic", "English"],
    },
  }),

  webSite: (origin = SITE_CONFIG.baseUrl) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Saabq Cal",
    alternateName: "سابق كول",
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/workspaces?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }),

  softwareApp: (origin = SITE_CONFIG.baseUrl, lang = "ar") => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Saabq Cal — سابق كول",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All (Web-based)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    description:
      lang === "ar"
        ? "المنصة الرائدة في إدارة وجدولة المواعيد وحجز الخدمات الاستشارية والطبية والمهنية بذكاء وسلاسة."
        : "The leading platform for smart appointment scheduling, calendar automation, and booking management for businesses and professionals.",
  }),

  breadcrumbs: (items = [], origin = SITE_CONFIG.baseUrl) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${origin}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  }),

  faqPage: (faqs = []) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }),

  article: ({
    title,
    description,
    url,
    image,
    publishedAt,
    updatedAt,
    author,
    origin = SITE_CONFIG.baseUrl,
  }) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: image
      ? image.startsWith("http")
        ? image
        : `${origin}${image}`
      : `${origin}/logo.png`,
    datePublished: publishedAt || new Date().toISOString(),
    dateModified: updatedAt || publishedAt || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: author || "Saabq Cal Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Saabq Cal",
      logo: {
        "@type": "ImageObject",
        url: `${origin}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url ? (url.startsWith("http") ? url : `${origin}${url}`) : origin,
    },
  }),

  localBusiness: ({
    name,
    description,
    url,
    image,
    telephone,
    email,
    address,
    city,
    country,
    category = "LocalBusiness",
    priceRange = "$$",
    origin = SITE_CONFIG.baseUrl,
  }) => ({
    "@context": "https://schema.org",
    "@type": category,
    name,
    url: url ? (url.startsWith("http") ? url : `${origin}${url}`) : origin,
    ...(description && { description }),
    ...(image && {
      image: image.startsWith("http") ? image : `${origin}${image}`,
    }),
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...(priceRange && { priceRange }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        ...(city && { addressLocality: city }),
        ...(country && { addressCountry: country }),
      },
    }),
  }),

  serviceBooking: ({
    name,
    description,
    providerName,
    url,
    price,
    currency = "EGP",
    origin = SITE_CONFIG.baseUrl,
  }) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    ...(description && { description }),
    url: url ? (url.startsWith("http") ? url : `${origin}${url}`) : origin,
    ...(providerName && {
      provider: {
        "@type": "LocalBusiness",
        name: providerName,
      },
    }),
    ...(price !== undefined && {
      offers: {
        "@type": "Offer",
        price: String(price),
        priceCurrency: currency,
      },
    }),
  }),
};

/**
 * Complete registry of SEO metadata by pageKey.
 */
export const PAGE_SEO_CONFIG = {
  // -------------------------------------------------------------
  // Public Marketing & Informational Pages
  // -------------------------------------------------------------
  home: {
    title: {
      ar: "المنصة الذكية لإدارة المواعيد وحجز الخدمات",
      en: "Smart Appointment Scheduling & Booking Management",
    },
    description: {
      ar: "منصة سابق كول الذكية لإدارة المواعيد والجدولة الآلية للشركات والمستشارين والعيادات والمحترفين. نظّم وقتك، استقبل الحجوزات، وضاعف إنتاجيتك بسهولة.",
      en: "Saabq Cal is the smart appointment scheduling and automated booking platform for businesses, clinics, consultants, and professionals. Organize your time and grow your business.",
    },
    keywords: {
      ar: "جدولة المواعيد, حجز مواعيد أونلاين, إدارة العيادات, مواعيد استشارات, تقويم ذكي, نظام حجوزات, سابق كول",
      en: "appointment booking software, online scheduling, clinic management, consultation bookings, smart calendar, appointment scheduler",
    },
    canonical: "/",
    ogType: "website",
    structuredData: ({ origin, lang }) => [
      structuredDataSchemas.organization(origin),
      structuredDataSchemas.webSite(origin),
      structuredDataSchemas.softwareApp(origin, lang),
    ],
  },

  about: {
    title: {
      ar: "من نحن — رؤيتنا في تطوير تجربة الجدولة الذكية",
      en: "About Us — Our Vision for Smart Scheduling",
    },
    description: {
      ar: "تعرف على منصة سابق كول ورؤيتنا في تمكين الشركات والمهنيين في العالم العربي بحلول متطورة ومبتكرة لإدارة الوقت وتنظيم المواعيد بكفاءة واحترافية.",
      en: "Discover Saabq Cal and our mission to empower businesses and professionals across the region with state-of-the-art scheduling and time management tools.",
    },
    keywords: {
      ar: "عن سابق كول, من نحن, إدارة الوقت, رؤية سابق, فريق سابق كول",
      en: "about saabq cal, our mission, scheduling platform company, smart booking team",
    },
    canonical: "/about",
    ogType: "website",
  },

  features: {
    title: {
      ar: "المميزات والحلول — كل ما تحتاجه لإدارة المواعيد باحترافية",
      en: "Features & Capabilities — Everything You Need for Smart Scheduling",
    },
    description: {
      ar: "استكشف مميزات سابق كول الشاملة: جدولة مخصصة، مزامنة مع التقويمات، إشعارات فورية، روابط حجز مخصصة، مدفوعات إلكترونية، وإدارة شاملة للعملاء وفرق العمل.",
      en: "Explore Saabq Cal features: custom availability schedules, multi-calendar sync, automated SMS & email reminders, custom booking forms, payment gateways, and team management.",
    },
    keywords: {
      ar: "مميزات سابق كول, مزامنة التقويم, إشعارات الحجز, نماذج الحجز, إدارة الفرق, المدفوعات الإلكترونية",
      en: "booking software features, calendar sync, automated reminders, team scheduling, online payments",
    },
    canonical: "/features",
    ogType: "website",
  },

  howItWorks: {
    title: {
      ar: "كيف يعمل سابق كول — خطوات بسيطة لتنظيم مواعيدك",
      en: "How It Works — Simple Steps to Automate Your Bookings",
    },
    description: {
      ar: "شاهد كيف يمكنك إعداد حسابك وخدماتك في دقائق، مشاركة رابط الحجز المخصص، واستقبال حجوزات عملائك تلقائياً وبدون أي تعارض في المواعيد.",
      en: "Learn how to set up your services in minutes, share your custom booking link, and receive automated client bookings without double-booking.",
    },
    keywords: {
      ar: "كيف يعمل سابق كول, خطوات الحجز, دليل الاستخدام, مشاركة رابط الحجز",
      en: "how saabq cal works, setup booking system, schedule appointments guide",
    },
    canonical: "/how-it-works",
    ogType: "website",
  },

  blog: {
    title: {
      ar: "المدونة — مقالات ونصائح في إدارة الأعمال وتنظيم الوقت",
      en: "Blog — Insights & Tips for Business Growth & Time Management",
    },
    description: {
      ar: "تابع أحدث المقالات والنصائح الاحترافية حول تحسين الإنتاجية، إدارة مواعيد العملاء، تطوير الأعمال، وأحدث استراتيجيات التحول الرقمي.",
      en: "Read the latest insights and expert tips on productivity, client scheduling, business operations, and digital booking automation.",
    },
    keywords: {
      ar: "مدونة سابق كول, نصائح إدارة الوقت, مقالات الجدولة, تطوير الأعمال, الإنتاجية",
      en: "saabq blog, time management articles, productivity tips, booking management guides",
    },
    canonical: "/blog",
    ogType: "blog",
  },

  blogDetail: {
    title: {
      ar: "مقال من المدونة",
      en: "Blog Post",
    },
    description: {
      ar: "اقرأ هذا المقال الشامل على مدونة سابق كول وتعرف على أفضل الممارسات في تنظيم الأعمال والجدولة.",
      en: "Read this insightful article on Saabq Cal Blog to learn best practices in business organization and scheduling.",
    },
    ogType: "article",
  },

  privacy: {
    title: {
      ar: "سياسة الخصوصية — التزامنا بأمان وحماية بياناتك",
      en: "Privacy Policy — Our Commitment to Data Protection & Security",
    },
    description: {
      ar: "تعرف على سياسة الخصوصية لمنصة سابق كول وكيفية جمع واستخدام وحماية بياناتك ومعلوماتك الشخصية وتشفيرها بأعلى معايير الأمان.",
      en: "Read the Privacy Policy for Saabq Cal and understand how we protect, handle, and secure your personal and appointment data.",
    },
    canonical: "/privacy",
    ogType: "website",
  },

  terms: {
    title: {
      ar: "الشروط والأحكام — اتفاقية استخدام منصة سابق كول",
      en: "Terms of Service — Saabq Cal Platform Agreement",
    },
    description: {
      ar: "الشروط والأحكام الرسمية الحاكمة لاستخدام خدمات ومنصات سابق كول وحقوق والتزامات المستخدمين ومقدمي الخدمات.",
      en: "The official terms and conditions governing the use of Saabq Cal services, user rights, and workspace obligations.",
    },
    canonical: "/terms",
    ogType: "website",
  },

  // -------------------------------------------------------------
  // Customer Directory & Public Booking Pages
  // -------------------------------------------------------------
  customerWorkspaces: {
    title: {
      ar: "دليل مساحات العمل والخبراء — احجز موعدك الآن",
      en: "Workspaces & Experts Directory — Book Your Appointment",
    },
    description: {
      ar: "تصفح مساحات العمل والعيادات والمستشارين المتاحين على سابق كول، واستعرض الخدمات والأسعار، واحجز موعدك بسهولة وبشكل فوري.",
      en: "Browse verified workspaces, clinics, and professional consultants on Saabq Cal. View available services, pricing, and book your session instantly.",
    },
    keywords: {
      ar: "دليل الخبراء, حجز استشارة, عيادات ومراكز, مساحات عمل, حجز جلسة",
      en: "workspaces directory, expert booking, book consultant, clinic appointments",
    },
    canonical: "/workspaces",
    ogType: "website",
  },

  customerWorkspaceProfile: {
    title: {
      ar: "الملف التعريفي لمساحة العمل والخدمات المتاحة",
      en: "Workspace Profile & Available Services",
    },
    description: {
      ar: "استعرض خدمات مساحة العمل وفريق المختصين والمواعيد المتاحة للحجز الفوري عبر منصة سابق كول.",
      en: "View workspace details, specialized team members, and available booking slots on Saabq Cal.",
    },
    ogType: "business.business",
  },

  customerSpecialist: {
    title: {
      ar: "الملف التعريفي للمختص وجدول المواعيد",
      en: "Specialist Profile & Available Schedule",
    },
    description: {
      ar: "تعرف على خبرات المختص والخدمات التي يقدمها، واختر الموعد الأنسب لك للحجز المباشر.",
      en: "Learn more about the specialist, view offered services, and book your dedicated session directly.",
    },
    ogType: "profile",
  },

  customerBookAppointment: {
    title: {
      ar: "حجز موعد جديد وتأكيد الحجز",
      en: "Book an Appointment & Confirm Reservation",
    },
    description: {
      ar: "اختر الخدمة والوقت المناسب وأكمل بياناتك لتأكيد حجزك وتلقي تفاصيل الموعد فوراً.",
      en: "Select your desired service, pick a suitable time slot, and submit details to confirm your booking.",
    },
    ogType: "website",
  },

  // -------------------------------------------------------------
  // Customer Authentication Pages (Noindex)
  // -------------------------------------------------------------
  customerLogin: {
    title: {
      ar: "تسجيل دخول العملاء",
      en: "Customer Sign In",
    },
    description: {
      ar: "سجل الدخول إلى حساب العميل الخاص بك في سابق كول لمتابعة مواعيدك وإدارة حجوزاتك.",
      en: "Sign in to your customer account on Saabq Cal to view and manage your upcoming appointments.",
    },
    canonical: "/customer/login",
    noindex: true,
  },

  customerRegister: {
    title: {
      ar: "إنشاء حساب عميل جديد",
      en: "Create Customer Account",
    },
    description: {
      ar: "أنشئ حسابك في سابق كول لتتمكن من حجز المواعيد وإدارتها ومتابعة تفاصيل جلساتك بسهولة.",
      en: "Create a new customer account on Saabq Cal to book, manage, and track your reservations.",
    },
    canonical: "/customer/register",
    noindex: true,
  },

  customerForgotPassword: {
    title: {
      ar: "استعادة كلمة المرور — حساب العميل",
      en: "Reset Password — Customer Account",
    },
    description: {
      ar: "استعد الوصول إلى حساب العميل الخاص بك عن طريق استعادة كلمة المرور بأمان.",
      en: "Recover access to your customer account via secure password reset link.",
    },
    canonical: "/customer/forgot-password",
    noindex: true,
  },

  customerVerifyAccount: {
    title: {
      ar: "تأكيد وتفعيل حساب العميل",
      en: "Verify Customer Account",
    },
    description: {
      ar: "أدخل رمز التحقق لتأكيد بريدك الإلكتروني وتفعيل حساب العميل الخاص بك.",
      en: "Enter verification code to confirm your email and activate your customer account.",
    },
    noindex: true,
  },

  // -------------------------------------------------------------
  // Customer Dashboard Pages (Noindex)
  // -------------------------------------------------------------
  customerProfile: {
    title: {
      ar: "لوحة تحكم العميل والملف الشخصي",
      en: "Customer Profile & Dashboard",
    },
    description: {
      ar: "إدارة بيانات الملف الشخصي، الحجوزات، المواعيد القادمة، والمحادثات.",
      en: "Manage your customer profile, upcoming appointments, notifications, and chats.",
    },
    noindex: true,
  },

  customerOverview: {
    title: {
      ar: "نظرة عامة — لوحة تحكم العميل",
      en: "Overview — Customer Dashboard",
    },
    noindex: true,
  },

  customerAppointments: {
    title: {
      ar: "مواعيدي وحجوزاتي",
      en: "My Appointments & Bookings",
    },
    noindex: true,
  },

  customerSecurity: {
    title: {
      ar: "أمان الحساب والمصادقة",
      en: "Account Security & Authentication",
    },
    noindex: true,
  },

  customerChangePassword: {
    title: {
      ar: "تغيير كلمة المرور",
      en: "Change Password",
    },
    noindex: true,
  },

  // -------------------------------------------------------------
  // Workspace Member Auth Pages (Noindex)
  // -------------------------------------------------------------
  memberLogin: {
    title: {
      ar: "تسجيل دخول مقدمي الخدمات ومساحات العمل",
      en: "Member & Workspace Sign In",
    },
    description: {
      ar: "سجل الدخول إلى لوحة تحكم مساحة العمل لإدارة الخدمات والمواعيد والتقويم والعملاء.",
      en: "Sign in to your workspace dashboard on Saabq Cal to manage your schedules, team, and bookings.",
    },
    canonical: "/member/login",
    noindex: true,
  },

  memberRegister: {
    title: {
      ar: "إنشاء مساحة عمل جديدة والانضمام كمقدم خدمة",
      en: "Create Workspace & Join as Service Provider",
    },
    description: {
      ar: "ابدأ الآن مجاناً وأنشئ مساحة عملك على سابق كول لاستقبال الحجوزات وتنظيم جدولك بذكاء.",
      en: "Get started for free on Saabq Cal to create your workspace, customize your booking page, and accept appointments.",
    },
    canonical: "/member/register",
    noindex: true,
  },

  memberForgotPassword: {
    title: {
      ar: "استعادة كلمة المرور — حساب مساحة العمل",
      en: "Reset Password — Workspace Member",
    },
    description: {
      ar: "استعد كلمة المرور للوصول إلى لوحة تحكم مساحة العمل الخاصة بك بأمان.",
      en: "Reset your password to securely access your workspace dashboard.",
    },
    canonical: "/member/forgot-password",
    noindex: true,
  },

  memberVerifyAccount: {
    title: {
      ar: "تأكيد وتفعيل حساب مساحة العمل",
      en: "Verify Workspace Account",
    },
    description: {
      ar: "أدخل رمز التحقق لتأكيد وتفعيل حساب مساحة العمل الخاص بك في سابق كول.",
      en: "Enter verification code to confirm and activate your workspace account.",
    },
    noindex: true,
  },

  // -------------------------------------------------------------
  // Member Personal & Workspace Management (Noindex)
  // -------------------------------------------------------------
  memberProfile: {
    title: {
      ar: "الملف الشخصي لمقدم الخدمة",
      en: "Member Profile Settings",
    },
    noindex: true,
  },

  memberSecurity: {
    title: {
      ar: "أمان الحساب والمصادقة الثنائية",
      en: "Account Security & 2FA",
    },
    noindex: true,
  },

  memberChangePassword: {
    title: {
      ar: "تغيير كلمة المرور",
      en: "Change Password",
    },
    noindex: true,
  },

  workspaceOverview: {
    title: {
      ar: "لوحة تحكم مساحة العمل — نظرة عامة",
      en: "Workspace Overview & Analytics",
    },
    noindex: true,
  },

  workspaceSettings: {
    title: {
      ar: "إعدادات مساحة العمل والعلامة التجارية",
      en: "Workspace Settings & Branding",
    },
    noindex: true,
  },

  workspaceSubscriptions: {
    title: {
      ar: "الاشتراكات والترقية والفوترة",
      en: "Subscriptions, Plans & Billing",
    },
    noindex: true,
  },

  workspaceMembers: {
    title: {
      ar: "فريق العمل والأعضاء",
      en: "Team Members & Specialists",
    },
    noindex: true,
  },

  workspaceRoles: {
    title: {
      ar: "الأدوار والصلاحيات",
      en: "Roles & Permissions",
    },
    noindex: true,
  },

  workspaceServices: {
    title: {
      ar: "إدارة الخدمات والباقات",
      en: "Services & Offerings Management",
    },
    noindex: true,
  },

  workspaceBookings: {
    title: {
      ar: "الحجوزات والمواعيد",
      en: "Bookings & Appointments Calendar",
    },
    noindex: true,
  },

  workspaceBookingDetail: {
    title: {
      ar: "تفاصيل الحجز",
      en: "Booking Details",
    },
    noindex: true,
  },

  workspaceSchedules: {
    title: {
      ar: "أوقات وجداول العمل والتوافر",
      en: "Working Hours & Availability Schedules",
    },
    noindex: true,
  },

  workspacePayments: {
    title: {
      ar: "المدفوعات والفواتير",
      en: "Payments & Financial Transactions",
    },
    noindex: true,
  },

  workspaceResources: {
    title: {
      ar: "الموارد والقاعات والأجهزة",
      en: "Resources & Rooms Management",
    },
    noindex: true,
  },

  workspaceLogs: {
    title: {
      ar: "سجل العمليات والتقارير",
      en: "Activity Logs & Audit Reports",
    },
    noindex: true,
  },

  workspaceCustomers: {
    title: {
      ar: "قاعدة بيانات العملاء",
      en: "Customer Directory & CRM",
    },
    noindex: true,
  },

  workspaceCustomerProfile: {
    title: {
      ar: "الملف التفصيلي للعميل",
      en: "Customer Profile & Booking History",
    },
    noindex: true,
  },

  workspaceTemplates: {
    title: {
      ar: "قوالب الإشعارات والرسائل",
      en: "Notification Templates & Messages",
    },
    noindex: true,
  },

  workspaceIntegrations: {
    title: {
      ar: "التكاملات والتطبيقات المتصلة",
      en: "Integrations & Connected Apps",
    },
    noindex: true,
  },

  workspaceApiIntegration: {
    title: {
      ar: "واجهات الربط البرمجي ومفاتيح API",
      en: "API Keys & Webhook Integrations",
    },
    noindex: true,
  },

  notifications: {
    title: {
      ar: "مركز الإشعارات والتنبيهات",
      en: "Notifications Center",
    },
    noindex: true,
  },

  chats: {
    title: {
      ar: "المحادثات والرسائل المباشرة",
      en: "Direct Messages & Client Chats",
    },
    noindex: true,
  },

  // -------------------------------------------------------------
  // Error Pages (Noindex)
  // -------------------------------------------------------------
  error404: {
    title: {
      ar: "الصفحة غير موجودة — 404",
      en: "Page Not Found — 404",
    },
    description: {
      ar: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
      en: "Sorry, the page you are looking for does not exist or has been moved.",
    },
    noindex: true,
  },

  error403: {
    title: {
      ar: "غير مصرح بالدخول — 403",
      en: "Access Forbidden — 403",
    },
    description: {
      ar: "ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.",
      en: "You do not have permission to access this page.",
    },
    noindex: true,
  },

  error500: {
    title: {
      ar: "خطأ داخلي في الخادم — 500",
      en: "Internal Server Error — 500",
    },
    description: {
      ar: "حدث خطأ غير متوقع في الخادم، يرجى المحاولة مرة أخرى لاحقاً.",
      en: "An unexpected server error occurred, please try again later.",
    },
    noindex: true,
  },

  error503: {
    title: {
      ar: "الخدمة غير متوفرة مؤقتاً — 503",
      en: "Service Unavailable — 503",
    },
    description: {
      ar: "الخدمة تخضع للصيانة المؤقتة، يرجى المحاولة بعد قليل.",
      en: "The service is temporarily undergoing maintenance, please check back shortly.",
    },
    noindex: true,
  },

  errorGeneric: {
    title: {
      ar: "حدث خطأ غير متوقع",
      en: "An Unexpected Error Occurred",
    },
    noindex: true,
  },
};

/**
 * Resolves SEO metadata by pageKey, current language, and optional overrides.
 *
 * @param {string} pageKey - Identifier from PAGE_SEO_CONFIG
 * @param {string} lang - 'ar' or 'en'
 * @param {object} overrides - Explicit overrides (title, description, image, etc.)
 * @returns {object} Normalized SEO object ready for <Helmet> / <SEO>
 */
export function getSEO(pageKey, lang = "ar", overrides = {}) {
  const currentLang = lang === "en" ? "en" : "ar";
  const config = (pageKey && PAGE_SEO_CONFIG[pageKey]) || {};

  // Resolve Title
  let rawTitle = overrides.title;
  if (!rawTitle) {
    if (typeof config.title === "object") {
      rawTitle =
        config.title[currentLang] || config.title.ar || config.title.en;
    } else if (typeof config.title === "string") {
      rawTitle = config.title;
    }
  }

  // Resolve Description
  let rawDescription = overrides.description;
  if (!rawDescription) {
    if (typeof config.description === "object") {
      rawDescription =
        config.description[currentLang] ||
        config.description.ar ||
        config.description.en;
    } else if (typeof config.description === "string") {
      rawDescription = config.description;
    }
  }

  // Resolve Keywords
  let rawKeywords = overrides.keywords;
  if (!rawKeywords) {
    if (typeof config.keywords === "object") {
      rawKeywords =
        config.keywords[currentLang] ||
        config.keywords.ar ||
        config.keywords.en;
    } else if (typeof config.keywords === "string") {
      rawKeywords = config.keywords;
    } else {
      rawKeywords = SITE_CONFIG.defaultKeywords[currentLang];
    }
  }

  // Resolve Canonical
  const canonical = overrides.canonical || config.canonical;

  // Resolve OG Type
  const ogType = overrides.ogType || config.ogType || "website";

  // Resolve OG Image
  const image =
    overrides.image ||
    overrides.ogImage ||
    config.image ||
    config.ogImage ||
    SITE_CONFIG.defaultOgImage;

  // Resolve Noindex
  const noindex =
    overrides.noindex !== undefined
      ? overrides.noindex
      : config.noindex !== undefined
        ? config.noindex
        : false;

  // Resolve Structured Data
  let baseStructuredData = config.structuredData || config.jsonLd;
  if (typeof baseStructuredData === "function") {
    baseStructuredData = baseStructuredData({
      origin: SITE_CONFIG.baseUrl,
      lang: currentLang,
      overrides,
    });
  }

  let overrideStructuredData = overrides.structuredData || overrides.jsonLd;
  if (typeof overrideStructuredData === "function") {
    overrideStructuredData = overrideStructuredData({
      origin: SITE_CONFIG.baseUrl,
      lang: currentLang,
      overrides,
    });
  }

  let structuredData = [];
  if (baseStructuredData) {
    if (Array.isArray(baseStructuredData)) {
      structuredData.push(...baseStructuredData);
    } else {
      structuredData.push(baseStructuredData);
    }
  }
  if (overrideStructuredData) {
    if (Array.isArray(overrideStructuredData)) {
      structuredData.push(...overrideStructuredData);
    } else {
      structuredData.push(overrideStructuredData);
    }
  }
  if (structuredData.length === 0) {
    structuredData = null;
  }

  return {
    title: rawTitle,
    description: rawDescription,
    keywords: rawKeywords,
    canonical,
    ogType,
    image,
    ogImage: image,
    noindex,
    structuredData,
    jsonLd: structuredData,
  };
}

export default PAGE_SEO_CONFIG;
