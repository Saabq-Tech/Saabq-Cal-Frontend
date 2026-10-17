/** Public API payloads shaped like GET /customers/workspaces/{slug}, /services and /specialists. */
export const workspaceFixture = {
  id: 7,
  name: "Glow Clinic",
  slug: "glow-clinic",
  locale: "ar",
  workspace_type_id: 1,
  workspace_type: { name: { ar: "عيادة", en: "Clinic" } },
  description: {
    ar: "<p>نهتم <strong>بصحة</strong> بشرتك</p>",
    en: "<p>We care</p>",
  },
  booking_short_intro: "Skin care in Heliopolis",
  logo_url: "https://cdn.example.com/logo.png",
  cover_url: "javascript:alert(1)",
  primary_color: "#123456",
  address: "Heliopolis, Cairo",
  phone: "+201000000000",
  email: "hello@glow.test",
  currency_code: "EGP",
  feature_highlights: [
    { title: "Laser", description: "Latest devices" },
    { title: "" },
  ],
  gallery_urls: [
    { url: "https://cdn.example.com/1.jpg", caption: "Room" },
    "ftp://bad",
    { url: "" },
  ],
};

export const servicesFixture = [
  {
    id: 1,
    slug: "facial",
    name: { ar: "تنظيف بشرة", en: "Facial" },
    duration_minutes: 45,
    price: "300",
    currency: "EGP",
    status: "active",
    booking_enabled: true,
  },
  {
    id: 2,
    slug: "hidden",
    name: { ar: "مخفية", en: "Hidden" },
    price: 100,
    status: "active",
    booking_enabled: false,
  },
];

export const rolesFixture = [
  {
    id: 3,
    name: "Doctors",
    members: [
      {
        id: 9,
        name: "Dr. Sara",
        title: "Dermatologist",
        bio: "10 years",
        avatar_url: null,
      },
    ],
  },
  {
    id: 4,
    name: "Leads",
    members: [{ id: 9, name: "Dr. Sara", title: "Dermatologist" }],
  },
];
