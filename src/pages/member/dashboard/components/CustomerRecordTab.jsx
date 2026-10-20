import { useState, useEffect, useCallback, useMemo } from "react";
import client, { endpoints } from "../../../../api/client";
import Icon from "../../../../components/common/Icon";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import { getRecordTypes, getRecordTitle } from "./recordTypes";
import "./CustomerRecordTab.css";

const emptyMed = { name: "", dose: "", frequency: "", duration: "" };

function emptyForm(typeId) {
  return {
    type: typeId,
    title: "",
    body: "",
    record_date: new Date().toISOString().slice(0, 10),
    data: {},
    files: [],
  };
}

/**
 * The detailed record of a customer: a timeline of typed entries (visits,
 * prescriptions, assessments...) chosen by the workspace kind, each with
 * structured fields, free notes and private attachments.
 */
export default function CustomerRecordTab({ customerId, workspace, canWrite }) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const types = useMemo(() => getRecordTypes(workspace), [workspace]);
  const typeById = useMemo(
    () => Object.fromEntries(types.map((ty) => [ty.id, ty])),
    [types],
  );
  const label = (obj) => obj?.[lang] || obj?.ar || "";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceCustomerRecords(customerId))
      .then((res) => setRecords(res.data?.data || []))
      .catch(() => toast.error(t("recordLoadFailed") || "تعذر تحميل السجل"))
      .finally(() => setLoading(false));
    // t/toast may change identity on each render; reload only per customer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = (typeId) => {
    setEditingId(null);
    setForm(emptyForm(typeId));
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      type: record.type,
      title: record.title || "",
      body: record.body || "",
      record_date: record.record_date || "",
      data: { ...(record.data || {}) },
      files: [],
      existing: record.attachments || [],
      remove: [],
    });
  };

  const setData = (key, value) =>
    setForm((f) => ({ ...f, data: { ...f.data, [key]: value } }));

  const save = async () => {
    const payload = new FormData();
    payload.append("type", form.type);
    payload.append("title", form.title);
    payload.append("body", form.body);
    if (form.record_date) payload.append("record_date", form.record_date);
    appendData(payload, "data", form.data);
    form.files.forEach((file) => payload.append("files[]", file));
    (form.remove || []).forEach((id) =>
      payload.append("remove_attachments[]", id),
    );

    setSaving(true);
    try {
      await client.post(
        editingId
          ? endpoints.workspaceCustomerRecordItem(customerId, editingId)
          : endpoints.workspaceCustomerRecords(customerId),
        payload,
      );
      toast.success(t("recordSaved") || "تم حفظ الإدخال");
      setForm(null);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("recordSaveFailed") ||
          "تعذر حفظ الإدخال",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(t("recordDeleteConfirm") || "حذف هذا الإدخال وملفاته؟"))
      return;
    try {
      await client.delete(
        endpoints.workspaceCustomerRecordItem(customerId, record.id),
      );
      setRecords((rs) => rs.filter((r) => r.id !== record.id));
    } catch {
      toast.error(t("recordDeleteFailed") || "تعذر حذف الإدخال");
    }
  };

  const download = async (record, attachment) => {
    try {
      const res = await client.get(
        endpoints.workspaceCustomerRecordAttachment(
          customerId,
          record.id,
          attachment.id,
        ),
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("fileDownloadFailed") || "تعذر تحميل الملف");
    }
  };

  const visible =
    filter === "all" ? records : records.filter((r) => r.type === filter);
  const formType = form ? typeById[form.type] : null;

  return (
    <div className="cr-tab animate-fade-in">
      <div className="cr-header">
        <h3>{getRecordTitle(workspace, lang)}</h3>
        {canWrite && (
          <div className="cr-add-types">
            {types.map((ty) => (
              <button
                key={ty.id}
                type="button"
                className="cr-type-chip"
                style={{ "--cr-color": ty.color }}
                onClick={() => openNew(ty.id)}
              >
                <Icon name="plus" size={14} />
                {label(ty.label)}
              </button>
            ))}
          </div>
        )}
      </div>

      {form && formType && (
        <div className="cr-form" style={{ "--cr-color": formType.color }}>
          <div className="cr-form-head">
            <Icon name={formType.icon} size={18} />
            <strong>
              {editingId ? t("edit") || "تعديل" : t("add") || "إضافة"}:{" "}
              {label(formType.label)}
            </strong>
          </div>

          <div className="cr-form-row">
            <label>
              <span>{t("title") || "العنوان"}</span>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="cr-date">
              <span>{t("date") || "التاريخ"}</span>
              <input
                type="date"
                className="form-input"
                value={form.record_date}
                onChange={(e) =>
                  setForm({ ...form, record_date: e.target.value })
                }
              />
            </label>
          </div>

          {formType.fields.map((field) => (
            <RecordField
              key={field.key}
              field={field}
              label={label(field.label)}
              value={form.data[field.key]}
              onChange={(v) => setData(field.key, v)}
              t={t}
            />
          ))}

          <label>
            <span>{t("notes") || "ملاحظات"}</span>
            <textarea
              className="form-input"
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>

          <div className="cr-files">
            {(form.existing || [])
              .filter((a) => !(form.remove || []).includes(a.id))
              .map((a) => (
                <span key={a.id} className="cr-file">
                  <Icon name="link" size={13} />
                  {a.name}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, remove: [...form.remove, a.id] })
                    }
                    aria-label={t("delete") || "حذف"}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
            {form.files.map((file, i) => (
              <span key={`${file.name}-${i}`} className="cr-file new">
                <Icon name="link" size={13} />
                {file.name}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      files: form.files.filter((_, j) => j !== i),
                    })
                  }
                  aria-label={t("delete") || "حذف"}
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
            <label className="cr-file-pick">
              <Icon name="upload-cloud" size={14} />
              {t("attachFiles") || "إرفاق ملفات"}
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  setForm({
                    ...form,
                    files: [...form.files, ...e.target.files],
                  });
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="cr-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={save}
            >
              {saving ? t("saving") || "جاري الحفظ..." : t("save") || "حفظ"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setForm(null)}
            >
              {t("cancel") || "إلغاء"}
            </button>
          </div>
        </div>
      )}

      <div className="cr-filters">
        <button
          type="button"
          className={`cr-filter${filter === "all" ? " active" : ""}`}
          onClick={() => setFilter("all")}
        >
          {t("all") || "الكل"} ({records.length})
        </button>
        {types.map((ty) => {
          const count = records.filter((r) => r.type === ty.id).length;
          if (!count) return null;
          return (
            <button
              key={ty.id}
              type="button"
              className={`cr-filter${filter === ty.id ? " active" : ""}`}
              onClick={() => setFilter(ty.id)}
            >
              {label(ty.label)} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="cr-empty">{t("loading") || "جاري التحميل..."}</p>
      ) : visible.length === 0 ? (
        <p className="cr-empty">
          {t("recordEmpty") || "لا توجد إدخالات في السجل بعد"}
        </p>
      ) : (
        <ol className="cr-timeline">
          {visible.map((record) => {
            const ty = typeById[record.type] || typeById.note;
            return (
              <li
                key={record.id}
                className="cr-entry"
                style={{ "--cr-color": ty?.color }}
              >
                <span className="cr-entry-dot">
                  <Icon name={ty?.icon || "file-text"} size={14} />
                </span>
                <div className="cr-entry-card">
                  <div className="cr-entry-head">
                    <span className="cr-entry-type">
                      {label(ty?.label) || record.type}
                    </span>
                    {record.title && <strong>{record.title}</strong>}
                    <span className="cr-entry-meta">
                      {record.record_date}
                      {record.author && ` · ${record.author.name}`}
                    </span>
                    {canWrite && (
                      <span className="cr-entry-actions">
                        <button
                          type="button"
                          onClick={() => openEdit(record)}
                          aria-label={t("edit") || "تعديل"}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(record)}
                          aria-label={t("delete") || "حذف"}
                        >
                          <Icon name="trash-2" size={14} />
                        </button>
                      </span>
                    )}
                  </div>

                  {ty?.fields.map((field) => {
                    const value = record.data?.[field.key];
                    if (!value || (Array.isArray(value) && !value.length))
                      return null;
                    return field.type === "meds" ? (
                      <table key={field.key} className="cr-meds">
                        <thead>
                          <tr>
                            <th>{t("medicationName") || "الدواء"}</th>
                            <th>{t("medicationDose") || "الجرعة"}</th>
                            <th>{t("medicationFrequency") || "التكرار"}</th>
                            <th>{t("medicationDuration") || "المدة"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {value.map((m, i) => (
                            <tr key={i}>
                              <td>{m.name}</td>
                              <td>{m.dose}</td>
                              <td>{m.frequency}</td>
                              <td>{m.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div key={field.key} className="cr-entry-field">
                        <span>{label(field.label)}:</span> {value}
                      </div>
                    );
                  })}

                  {record.body && (
                    <p className="cr-entry-body">{record.body}</p>
                  )}

                  {record.attachments?.length > 0 && (
                    <div className="cr-files">
                      {record.attachments.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="cr-file link"
                          onClick={() => download(record, a)}
                        >
                          <Icon name="link" size={13} />
                          {a.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function RecordField({ field, label, value, onChange, t }) {
  if (field.type === "meds") {
    const meds =
      Array.isArray(value) && value.length ? value : [{ ...emptyMed }];
    const update = (i, key, v) =>
      onChange(meds.map((m, j) => (j === i ? { ...m, [key]: v } : m)));
    return (
      <div className="cr-meds-edit">
        <span>{label}</span>
        {meds.map((m, i) => (
          <div key={i} className="cr-med-row">
            <input
              className="form-input"
              placeholder={t("medicationName") || "اسم الدواء"}
              value={m.name}
              onChange={(e) => update(i, "name", e.target.value)}
            />
            <input
              className="form-input"
              placeholder={t("medicationDose") || "الجرعة"}
              value={m.dose}
              onChange={(e) => update(i, "dose", e.target.value)}
            />
            <input
              className="form-input"
              placeholder={t("medicationFrequency") || "التكرار"}
              value={m.frequency}
              onChange={(e) => update(i, "frequency", e.target.value)}
            />
            <input
              className="form-input"
              placeholder={t("medicationDuration") || "المدة"}
              value={m.duration}
              onChange={(e) => update(i, "duration", e.target.value)}
            />
            <button
              type="button"
              onClick={() => onChange(meds.filter((_, j) => j !== i))}
              aria-label={t("delete") || "حذف"}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="cr-add-med"
          onClick={() => onChange([...meds, { ...emptyMed }])}
        >
          <Icon name="plus" size={14} />
          {t("addMedication") || "إضافة دواء"}
        </button>
      </div>
    );
  }

  return (
    <label>
      <span>{label}</span>
      {field.type === "textarea" ? (
        <textarea
          className="form-input"
          rows={2}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="form-input"
          type={field.type === "number" ? "number" : "text"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

/** Flattens nested data into FormData keys like data[medications][0][name]. */
function appendData(formData, prefix, value) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => appendData(formData, `${prefix}[${i}]`, v));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) =>
      appendData(formData, `${prefix}[${k}]`, v),
    );
  } else if (value !== undefined && value !== null && value !== "") {
    formData.append(prefix, value);
  }
}
