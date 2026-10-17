import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../../../../api/client";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import { usePermissions } from "../../../../hooks/usePermissions";
import Icon from "../../../../components/common/Icon";
import { TabSettingsSkeleton } from "../../../../components/ui/Skeleton";
import LandingPageRenderer from "../../../../landing-pages/LandingPageRenderer";
import {
  buildLandingSite,
  initialLandingPage,
  landingPagePayload,
} from "../../../../landing-pages/adapter";
import {
  LANDING_TEMPLATES,
  defaultSections,
  getLandingTemplate,
  recommendedTemplates,
  resolveSections,
} from "../../../../landing-pages/catalog";
import "../../../../landing-pages/editor.css";

const SECTION_LABEL_KEYS = {
  about: "lpSectionAbout",
  highlights: "lpSectionHighlights",
  services: "lpSectionServices",
  team: "lpSectionTeam",
  gallery: "lpSectionGallery",
  schedule: "lpSectionSchedule",
  teams: "lpSectionTeams",
  booking: "lpSectionBooking",
  faq: "lpSectionFaq",
  contact: "lpSectionContact",
};

const DEVICES = [
  { id: "mobile", labelKey: "lpMobile", width: 390 },
  { id: "tablet", labelKey: "lpTablet", width: 820 },
  { id: "desktop", labelKey: "lpDesktop", width: null },
];

/** Saved landing page (API) -> editor state with every list present. */
function toEditorState(page, workspace) {
  const base = initialLandingPage(workspace);
  if (!page) return base;
  return {
    template_key: getLandingTemplate(page.template_key)
      ? page.template_key
      : base.template_key,
    is_published: !!page.is_published,
    sections: resolveSections(page.template_key, page.sections),
    content: { ...base.content, ...(page.content || {}) },
  };
}

/** "title | duration" per line <-> meetings array. */
const meetingsToText = (meetings = []) =>
  meetings
    .map((m) => [m.title, m.duration].filter(Boolean).join(" | "))
    .join("\n");
const textToMeetings = (text) =>
  text
    .split("\n")
    .map((line) => line.split("|"))
    .filter(([title]) => title && title.trim())
    .map(([title, duration = ""]) => ({
      title: title.trim(),
      duration: duration.trim(),
    }));

function ListEditor({
  title,
  items,
  onChange,
  makeItem,
  renderItem,
  max,
  disabled,
  addLabel,
  removeLabel,
}) {
  const update = (index, patch) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  return (
    <fieldset className="lpe-list" disabled={disabled}>
      <legend className="form-label">{title}</legend>
      {items.map((item, index) => (
        <div key={index} className="lpe-list__item">
          <div className="lpe-list__fields">
            {renderItem(item, (patch) => update(index, patch))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            aria-label={removeLabel}
            title={removeLabel}
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          className="btn btn-secondary btn-sm lpe-list__add"
          onClick={() => onChange([...items, makeItem()])}
        >
          <Icon name="plus" size={14} /> {addLabel}
        </button>
      )}
    </fieldset>
  );
}

export default function LandingPageTab() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const toast = useToast();
  const { isOwner, canUpdateSettings } = usePermissions();
  const canEdit = isOwner || canUpdateSettings;
  const slug = user?.workspace?.slug;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [services, setServices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [hasSavedPage, setHasSavedPage] = useState(false);
  const [panel, setPanel] = useState("template");
  const [device, setDevice] = useState("mobile");

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError(false);
    try {
      const [pageRes, wsRes, srvRes, specRes] = await Promise.all([
        client.get(endpoints.workspaceSettingsLandingPage),
        client.get(endpoints.publicWorkspaceDetail(slug)),
        client
          .get(endpoints.publicWorkspaceServices(slug))
          .catch(() => ({ data: { data: [] } })),
        client
          .get(endpoints.publicWorkspaceSpecialists(slug))
          .catch(() => ({ data: { data: [] } })),
      ]);
      const ws = wsRes.data?.data || null;
      const state = toEditorState(pageRes.data?.data?.landing_page, ws);
      setIsAvailable(pageRes.data?.data?.is_available !== false);
      setWorkspace(ws);
      setServices(srvRes.data?.data || []);
      setRoles(specRes.data?.data || []);
      setPage(state);
      setHasSavedPage(Boolean(pageRes.data?.data?.landing_page));
      setSavedSnapshot(JSON.stringify(landingPagePayload(state)));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const site = useMemo(
    () =>
      page && workspace
        ? buildLandingSite({
            workspace,
            services,
            roles,
            landingPage: page,
            preview: true,
          })
        : null,
    [page, workspace, services, roles],
  );
  const template = page ? getLandingTemplate(page.template_key) : null;
  // The workspace category's templates come first (clinics choose among four).
  const recommended = workspace ? recommendedTemplates(workspace) : [];
  const orderedTemplates = [
    ...LANDING_TEMPLATES.filter((tpl) => recommended.includes(tpl.id)),
    ...LANDING_TEMPLATES.filter((tpl) => !recommended.includes(tpl.id)),
  ];
  const dirty = page
    ? JSON.stringify(landingPagePayload(page)) !== savedSnapshot
    : false;
  const readOnly = !canEdit || !isAvailable;

  const setContent = (patch) =>
    setPage((p) => ({ ...p, content: { ...p.content, ...patch } }));

  // A new template brings its own section order; sections the owner hid stay hidden.
  const chooseTemplate = (id) =>
    setPage((p) => ({
      ...p,
      template_key: id,
      sections: defaultSections(id).map((s) => ({
        ...s,
        enabled: p.sections.find((x) => x.id === s.id)?.enabled ?? true,
      })),
    }));

  const moveSection = (index, delta) =>
    setPage((p) => {
      const next = [...p.sections];
      const target = index + delta;
      if (target < 0 || target >= next.length) return p;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...p, sections: next };
    });

  const toggleSection = (index) =>
    setPage((p) => ({
      ...p,
      sections: p.sections.map((s, i) =>
        i === index ? { ...s, enabled: !s.enabled } : s,
      ),
    }));

  const save = async (overrides = {}) => {
    const next = { ...page, ...overrides };
    setSaving(true);
    try {
      const res = await client.put(
        endpoints.workspaceSettingsLandingPage,
        landingPagePayload(next),
      );
      const saved = toEditorState(res.data?.data?.landing_page, workspace);
      setPage(saved);
      setSavedSnapshot(JSON.stringify(landingPagePayload(saved)));
      toast.success(t("lpSaved"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("lpSaveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TabSettingsSkeleton />;

  if (loadError || !page) {
    return (
      <div className="card-body lpe-empty">
        <p>{t("lpLoadError")}</p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={load}
        >
          {t("lpRetry")}
        </button>
      </div>
    );
  }

  const supports = (id) => template?.sections.includes(id);
  const c = page.content;
  const commonList = {
    disabled: readOnly,
    addLabel: t("lpAddRow"),
    removeLabel: t("lpRemove"),
  };
  const deviceWidth = DEVICES.find((d) => d.id === device)?.width;

  return (
    <div className="card-body lpe">
      <div className="lpe-head">
        <div>
          <h3 className="lpe-title">
            <Icon name="globe" size={20} style={{ color: "var(--primary)" }} />
            {t("lpTabTitle")}
          </h3>
          <p className="lpe-desc">{t("lpTabDesc")}</p>
        </div>
        <div className="lpe-head__actions">
          <span
            className={`badge-status ${page.is_published ? "badge-status-success" : "badge-status-neutral"}`}
          >
            {page.is_published ? t("lpPublished") : t("lpDraft")}
          </span>
          {page.is_published && !dirty && slug && (
            <Link
              to={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <Icon name="external-link" size={14} /> {t("lpViewPublic")}
            </Link>
          )}
        </div>
      </div>

      {!isAvailable && (
        <p className="lpe-alert lpe-alert--warn">{t("lpNotAvailable")}</p>
      )}
      {isAvailable && !canEdit && (
        <p className="lpe-alert">{t("lpReadOnly")}</p>
      )}

      <p className="lpe-alert lpe-alert--info">
        {t("lpLinkedNotice")}{" "}
        <Link to="/member/workspace/settings?sub=basic">
          {t("lpEditBasicInfo")}
        </Link>
        {" · "}
        <Link to="/member/workspace/settings?sub=branding">
          {t("lpEditBranding")}
        </Link>
        {" · "}
        <Link to="/member/workspace/services">{t("lpEditServices")}</Link>
      </p>

      <div className="lpe-body">
        <div className="lpe-panel">
          <div className="lpe-tabs" role="tablist">
            {[
              ["template", "lpStepTemplate"],
              ["content", "lpStepContent"],
              ["lists", "lpStepLists"],
              ["sections", "lpStepSections"],
            ].map(([id, key]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={panel === id}
                className={panel === id ? "is-on" : undefined}
                onClick={() => setPanel(id)}
              >
                {t(key)}
              </button>
            ))}
          </div>

          {panel === "template" && (
            <>
              {!hasSavedPage && recommended.length > 1 && (
                <p className="lpe-alert lpe-alert--info">
                  {t("lpChooseGroupTemplate")}
                </p>
              )}
              <div
                className="lpe-templates"
                role="radiogroup"
                aria-label={t("lpStepTemplate")}
              >
                {orderedTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    role="radio"
                    aria-checked={tpl.id === page.template_key}
                    className={`lpe-template ${tpl.id === page.template_key ? "is-on" : ""}`}
                    onClick={() => chooseTemplate(tpl.id)}
                    disabled={readOnly}
                  >
                    <span
                      className="lpe-template__swatch"
                      style={{ background: tpl.accentOptions[0] }}
                      aria-hidden="true"
                    />
                    <strong>{t(tpl.nameKey)}</strong>
                    <span>{t(tpl.descKey)}</span>
                    {recommended.includes(tpl.id) && (
                      <span className="lpe-template__badge">
                        {t("lpRecommended")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {panel === "content" && (
            <fieldset className="lpe-fields" disabled={readOnly}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="lp-locale">
                    {t("lpPageLanguage")}
                  </label>
                  <select
                    id="lp-locale"
                    className="form-select"
                    value={c.locale}
                    onChange={(e) => setContent({ locale: e.target.value })}
                  >
                    <option value="ar">{t("lpArabic")}</option>
                    <option value="en">{t("lpEnglish")}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lp-font">
                    {t("lpFont")}
                  </label>
                  <select
                    id="lp-font"
                    className="form-select"
                    value={c.font_choice}
                    onChange={(e) =>
                      setContent({ font_choice: e.target.value })
                    }
                  >
                    <option value="template">{`${t("lpFontTemplate")} (${template?.fonts.template})`}</option>
                    <option value="alt">{`${t("lpFontAlt")} (${template?.fonts.alt})`}</option>
                  </select>
                </div>
              </div>
              {[
                ["kicker", "lpKicker", 120, false, "lpKickerHint"],
                ["headline", "lpHeadline", 160, true],
                ["about_more", "lpAboutMore", 800, true],
                ["landmark", "lpLandmark", 160],
                ["whatsapp", "lpWhatsapp", 30],
                ["booking_label", "lpBookingLabel", 40],
              ].map(([key, labelKey, max, multiline, hintKey]) => (
                <div className="form-group" key={key}>
                  <label className="form-label" htmlFor={`lp-${key}`}>
                    {t(labelKey)}
                  </label>
                  {multiline ? (
                    <textarea
                      id={`lp-${key}`}
                      className="form-textarea"
                      rows={3}
                      maxLength={max}
                      value={c[key]}
                      onChange={(e) => setContent({ [key]: e.target.value })}
                    />
                  ) : (
                    <input
                      id={`lp-${key}`}
                      className="form-input"
                      maxLength={max}
                      dir={key === "whatsapp" ? "ltr" : undefined}
                      inputMode={key === "whatsapp" ? "tel" : undefined}
                      value={c[key]}
                      onChange={(e) => setContent({ [key]: e.target.value })}
                    />
                  )}
                  {hintKey && <small className="lpe-hint">{t(hintKey)}</small>}
                </div>
              ))}
            </fieldset>
          )}

          {panel === "lists" && (
            <div className="lpe-fields">
              <ListEditor
                {...commonList}
                title={t("lpHours")}
                items={c.opening_hours}
                max={14}
                onChange={(opening_hours) => setContent({ opening_hours })}
                makeItem={() => ({
                  days: "",
                  time_range: "",
                  is_closed: false,
                })}
                renderItem={(row, set) => (
                  <>
                    <input
                      className="form-input"
                      placeholder={t("lpDays")}
                      aria-label={t("lpDays")}
                      maxLength={60}
                      value={row.days}
                      onChange={(e) => set({ days: e.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder={t("lpTimeRange")}
                      aria-label={t("lpTimeRange")}
                      maxLength={60}
                      value={row.time_range}
                      disabled={row.is_closed}
                      onChange={(e) => set({ time_range: e.target.value })}
                    />
                    <label className="lpe-check">
                      <input
                        type="checkbox"
                        checked={!!row.is_closed}
                        onChange={(e) => set({ is_closed: e.target.checked })}
                      />
                      {t("lpClosed")}
                    </label>
                  </>
                )}
              />
              <ListEditor
                {...commonList}
                title={t("lpFaqs")}
                items={c.faqs}
                max={20}
                onChange={(faqs) => setContent({ faqs })}
                makeItem={() => ({ question: "", answer: "" })}
                renderItem={(row, set) => (
                  <>
                    <input
                      className="form-input"
                      placeholder={t("lpQuestion")}
                      aria-label={t("lpQuestion")}
                      maxLength={200}
                      value={row.question}
                      onChange={(e) => set({ question: e.target.value })}
                    />
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder={t("lpAnswer")}
                      aria-label={t("lpAnswer")}
                      maxLength={1000}
                      value={row.answer}
                      onChange={(e) => set({ answer: e.target.value })}
                    />
                  </>
                )}
              />
              {supports("schedule") && (
                <ListEditor
                  {...commonList}
                  title={t("lpSchedule")}
                  items={c.schedule}
                  max={60}
                  onChange={(schedule) => setContent({ schedule })}
                  makeItem={() => ({
                    day: "",
                    time_range: "",
                    title: "",
                    instructor: "",
                    is_full: false,
                  })}
                  renderItem={(row, set) => (
                    <>
                      <input
                        className="form-input"
                        placeholder={t("lpDay")}
                        aria-label={t("lpDay")}
                        maxLength={30}
                        value={row.day}
                        onChange={(e) => set({ day: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder={t("lpTimeRange")}
                        aria-label={t("lpTimeRange")}
                        maxLength={60}
                        value={row.time_range}
                        onChange={(e) => set({ time_range: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder={t("lpClassTitle")}
                        aria-label={t("lpClassTitle")}
                        maxLength={120}
                        value={row.title}
                        onChange={(e) => set({ title: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder={t("lpInstructor")}
                        aria-label={t("lpInstructor")}
                        maxLength={80}
                        value={row.instructor}
                        onChange={(e) => set({ instructor: e.target.value })}
                      />
                      <label className="lpe-check">
                        <input
                          type="checkbox"
                          checked={!!row.is_full}
                          onChange={(e) => set({ is_full: e.target.checked })}
                        />
                        {t("lpFull")}
                      </label>
                    </>
                  )}
                />
              )}
              {supports("teams") && (
                <ListEditor
                  {...commonList}
                  title={t("lpTeams")}
                  items={c.teams}
                  max={12}
                  onChange={(teams) => setContent({ teams })}
                  makeItem={() => ({ name: "", description: "", meetings: [] })}
                  renderItem={(row, set) => (
                    <>
                      <input
                        className="form-input"
                        placeholder={t("lpTeamName")}
                        aria-label={t("lpTeamName")}
                        maxLength={120}
                        value={row.name}
                        onChange={(e) => set({ name: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder={t("lpTeamDesc")}
                        aria-label={t("lpTeamDesc")}
                        maxLength={400}
                        value={row.description}
                        onChange={(e) => set({ description: e.target.value })}
                      />
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder={t("lpMeetingsHint")}
                        aria-label={t("lpMeetings")}
                        value={row.meetingsText ?? meetingsToText(row.meetings)}
                        onChange={(e) =>
                          set({
                            meetingsText: e.target.value,
                            meetings: textToMeetings(e.target.value),
                          })
                        }
                      />
                    </>
                  )}
                />
              )}
            </div>
          )}

          {panel === "sections" && (
            <div className="lpe-fields">
              <p className="lpe-hint">{t("lpSectionsHint")}</p>
              <ol className="lpe-sections">
                {page.sections.map((s, index) => (
                  <li key={s.id} className={s.enabled ? undefined : "is-off"}>
                    <label className="lpe-check">
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        disabled={readOnly}
                        onChange={() => toggleSection(index)}
                      />
                      {t(SECTION_LABEL_KEYS[s.id])}
                    </label>
                    <span className="lpe-sections__move">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={readOnly || index === 0}
                        onClick={() => moveSection(index, -1)}
                        aria-label={t("lpMoveUp")}
                        title={t("lpMoveUp")}
                      >
                        <Icon name="chevron-up" size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={
                          readOnly || index === page.sections.length - 1
                        }
                        onClick={() => moveSection(index, 1)}
                        aria-label={t("lpMoveDown")}
                        title={t("lpMoveDown")}
                      >
                        <Icon name="chevron-down" size={15} />
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="lpe-footer">
            <label className="lpe-check lpe-publish">
              <input
                type="checkbox"
                checked={page.is_published}
                disabled={readOnly}
                onChange={(e) =>
                  setPage((p) => ({ ...p, is_published: e.target.checked }))
                }
              />
              <span>
                <strong>{t("lpPublishToggle")}</strong>
                <small>{t("lpPublishHint")}</small>
              </span>
            </label>
            <div className="lpe-footer__actions">
              {dirty && <span className="lpe-dirty">{t("lpUnsaved")}</span>}
              <button
                type="button"
                className="btn btn-primary btn-md"
                disabled={readOnly || saving || !dirty}
                onClick={() => save()}
              >
                {saving ? <span className="spinner spinner-sm" /> : t("lpSave")}
              </button>
            </div>
          </div>
        </div>

        <div className="lpe-preview">
          <div className="lpe-preview__bar">
            <strong>{t("lpPreview")}</strong>
            <div
              className="lpe-devices"
              role="group"
              aria-label={t("lpPreview")}
            >
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={device === d.id}
                  className={device === d.id ? "is-on" : undefined}
                  onClick={() => setDevice(d.id)}
                >
                  {t(d.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="lpe-stage" dir={isRTL ? "rtl" : "ltr"}>
            <div
              className="lpe-frame"
              style={{ width: deviceWidth ? `${deviceWidth}px` : "100%" }}
            >
              {site && (
                <LandingPageRenderer
                  site={site}
                  fallback={<p className="lpe-hint">{t("lpPreviewError")}</p>}
                  loading={<p className="lpe-hint">{t("lpPreviewLoading")}</p>}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
