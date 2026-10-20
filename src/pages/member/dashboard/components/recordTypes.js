/**
 * Entry types for the customer record, per workspace kind. Each type lists the
 * structured fields stored in the record's `data`; every type also has a free
 * text body and file attachments.
 *
 * Field types: text, textarea, number, meds (list of medications).
 */

const note = {
  id: "note",
  icon: "file-text",
  color: "#64748b",
  label: { ar: "ملاحظة", en: "Note" },
  fields: [],
};

const document = {
  id: "document",
  icon: "link",
  color: "#0ea5e9",
  label: { ar: "مستند / ملف", en: "Document" },
  fields: [],
};

const PRESETS = {
  clinic: [
    {
      id: "visit",
      icon: "stethoscope",
      color: "#026982",
      label: { ar: "كشف", en: "Visit" },
      fields: [
        {
          key: "complaint",
          type: "textarea",
          label: { ar: "الشكوى", en: "Complaint" },
        },
        {
          key: "examination",
          type: "textarea",
          label: { ar: "الفحص", en: "Examination" },
        },
        {
          key: "vitals",
          type: "text",
          label: { ar: "العلامات الحيوية", en: "Vitals" },
        },
      ],
    },
    {
      id: "diagnosis",
      icon: "clipboard-list",
      color: "#7c3aed",
      label: { ar: "تشخيص", en: "Diagnosis" },
      fields: [
        {
          key: "diagnosis",
          type: "textarea",
          label: { ar: "التشخيص", en: "Diagnosis" },
        },
      ],
    },
    {
      id: "prescription",
      icon: "plus-square",
      color: "#16a34a",
      label: { ar: "روشتة", en: "Prescription" },
      fields: [
        {
          key: "medications",
          type: "meds",
          label: { ar: "الأدوية", en: "Medications" },
        },
      ],
    },
    {
      id: "procedure",
      icon: "tool",
      color: "#ea580c",
      label: { ar: "إجراء / جلسة", en: "Procedure" },
      fields: [
        {
          key: "procedure",
          type: "text",
          label: { ar: "الإجراء", en: "Procedure" },
        },
        {
          key: "teeth",
          type: "text",
          label: { ar: "الأسنان / المنطقة", en: "Teeth / area" },
          dentalOnly: true,
        },
      ],
    },
    {
      id: "lab",
      icon: "activity",
      color: "#db2777",
      label: { ar: "تحاليل / أشعة", en: "Labs / imaging" },
      fields: [
        { key: "test", type: "text", label: { ar: "الفحص", en: "Test" } },
        {
          key: "result",
          type: "textarea",
          label: { ar: "النتيجة", en: "Result" },
        },
      ],
    },
    {
      id: "chronic",
      icon: "heart",
      color: "#dc2626",
      label: { ar: "أمراض مزمنة / حساسية", en: "Chronic / allergies" },
      fields: [
        {
          key: "condition",
          type: "text",
          label: { ar: "الحالة", en: "Condition" },
        },
      ],
    },
    note,
    document,
  ],
  education: [
    {
      id: "assessment",
      icon: "award",
      color: "#026982",
      label: { ar: "تقييم / اختبار", en: "Assessment" },
      fields: [
        {
          key: "subject",
          type: "text",
          label: { ar: "المادة", en: "Subject" },
        },
        { key: "score", type: "number", label: { ar: "الدرجة", en: "Score" } },
        { key: "max_score", type: "number", label: { ar: "من", en: "Out of" } },
      ],
    },
    {
      id: "homework",
      icon: "book-open",
      color: "#7c3aed",
      label: { ar: "واجب", en: "Homework" },
      fields: [
        { key: "due", type: "text", label: { ar: "موعد التسليم", en: "Due" } },
      ],
    },
    {
      id: "progress",
      icon: "bar-chart",
      color: "#16a34a",
      label: { ar: "متابعة تقدم", en: "Progress" },
      fields: [],
    },
    note,
    document,
  ],
  consulting: [
    {
      id: "session",
      icon: "message-square",
      color: "#026982",
      label: { ar: "جلسة", en: "Session" },
      fields: [
        {
          key: "topics",
          type: "textarea",
          label: { ar: "المحاور", en: "Topics" },
        },
      ],
    },
    {
      id: "recommendation",
      icon: "sparkles",
      color: "#ca8a04",
      label: { ar: "توصيات", en: "Recommendations" },
      fields: [],
    },
    note,
    document,
  ],
  general: [note, document],
};

export function getWorkspaceKind(workspace) {
  const slug = String(
    workspace?.workspace_type?.slug ||
      workspace?.workspace_type?.name?.en ||
      "",
  ).toLowerCase();
  const has = (...words) => words.some((w) => slug.includes(w));
  if (has("clinic", "dental", "medical", "health")) {
    return { kind: "clinic", isDental: has("dental") };
  }
  if (has("edu", "academy", "tutor", "school")) return { kind: "education" };
  if (has("consult")) return { kind: "consulting" };
  return { kind: "general" };
}

export function getRecordTypes(workspace) {
  const { kind, isDental } = getWorkspaceKind(workspace);
  return PRESETS[kind].map((type) => ({
    ...type,
    fields: type.fields.filter((f) => !f.dentalOnly || isDental),
  }));
}

export function getRecordTitle(workspace, lang) {
  const { kind } = getWorkspaceKind(workspace);
  const titles = {
    clinic: { ar: "الملف الطبي", en: "Medical record" },
    education: { ar: "الملف الأكاديمي", en: "Academic record" },
    consulting: { ar: "ملف الاستشارات", en: "Consulting record" },
    general: { ar: "السجل", en: "Record" },
  };
  return titles[kind][lang] || titles[kind].ar;
}
