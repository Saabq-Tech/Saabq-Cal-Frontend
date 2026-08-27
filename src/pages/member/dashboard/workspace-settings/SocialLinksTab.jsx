import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";

export default function SocialLinksTab({
  socialForm,
  setSocialForm: _setSocialForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t } = useLanguage();

  // Initialize links state
  const [links, setLinks] = useState(() => {
    if (
      Array.isArray(socialForm.social_links) &&
      socialForm.social_links.length > 0
    ) {
      return socialForm.social_links;
    }
    if (Array.isArray(socialForm.links) && socialForm.links.length > 0) {
      return socialForm.links;
    }
    const initial = [];
    if (socialForm.website_url)
      initial.push({ platform: "website", url: socialForm.website_url });
    if (socialForm.twitter_url)
      initial.push({ platform: "x", url: socialForm.twitter_url });
    if (socialForm.linkedin_url)
      initial.push({ platform: "linkedin", url: socialForm.linkedin_url });
    if (socialForm.instagram_url)
      initial.push({ platform: "instagram", url: socialForm.instagram_url });
    if (socialForm.facebook_url)
      initial.push({ platform: "facebook", url: socialForm.facebook_url });

    return initial.length > 0 ? initial : [{ platform: "website", url: "" }];
  });

  useEffect(() => {
    if (
      Array.isArray(socialForm.social_links) &&
      socialForm.social_links.length > 0
    ) {
      setLinks(socialForm.social_links);
    } else if (Array.isArray(socialForm.links) && socialForm.links.length > 0) {
      setLinks(socialForm.links);
    } else {
      const initial = [];
      if (socialForm.website_url)
        initial.push({ platform: "website", url: socialForm.website_url });
      if (socialForm.twitter_url)
        initial.push({ platform: "x", url: socialForm.twitter_url });
      if (socialForm.linkedin_url)
        initial.push({ platform: "linkedin", url: socialForm.linkedin_url });
      if (socialForm.instagram_url)
        initial.push({ platform: "instagram", url: socialForm.instagram_url });
      if (socialForm.facebook_url)
        initial.push({ platform: "facebook", url: socialForm.facebook_url });

      if (initial.length > 0) {
        setLinks(initial);
      }
    }
  }, [socialForm]);

  const DEFAULT_PLATFORMS = [
    {
      id: "website",
      label: t("websiteLink") || "الموقع الإلكتروني",
      icon: <Icon name="globe" size={16} style={{ display: "block" }} />,
    },
    {
      id: "x",
      label: "X / Twitter",
      icon: <Icon name="x-social" size={15} style={{ display: "block" }} />,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: <Icon name="linkedin" size={15} style={{ display: "block" }} />,
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: <Icon name="instagram" size={15} style={{ display: "block" }} />,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: <Icon name="facebook" size={15} style={{ display: "block" }} />,
    },
    {
      id: "youtube",
      label: "YouTube",
      icon: <Icon name="youtube" size={15} style={{ display: "block" }} />,
    },
    {
      id: "github",
      label: "GitHub",
      icon: <Icon name="github" size={15} style={{ display: "block" }} />,
    },
    {
      id: "link",
      label: t("generalLink") || "رابط عام",
      icon: <Icon name="link" size={15} style={{ display: "block" }} />,
    },
  ];

  const updateLinkPlatform = (idx, platId) => {
    const next = [...links];
    next[idx] = { ...next[idx], platform: platId };
    setLinks(next);
  };

  const updateLinkUrl = (idx, url) => {
    const next = [...links];
    next[idx] = { ...next[idx], url };
    setLinks(next);
  };

  const addLink = () => {
    setLinks([...links, { platform: "link", url: "" }]);
  };

  const removeLink = (idx) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validLinks = links
      .filter((l) => l.url && l.url.trim() !== "")
      .map((l) => ({ platform: l.platform || "website", url: l.url.trim() }));
    onSave({ social_links: validLinks });
  };

  return (
    <form className="card-body" onSubmit={handleSubmit} style={{ gap: 20 }}>
      {/* Top Header */}
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            margin: 0,
            color: "var(--heading)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="link" size={20} style={{ color: "var(--primary)" }} />
          {t("socialMediaLinks") || "وسائل التواصل الاجتماعي والروابط"}
        </h3>
        <p
          style={{
            fontSize: "0.84rem",
            color: "var(--text-secondary)",
            margin: "4px 0 0",
          }}
        >
          {t("socialMediaLinksDesc") ||
            "روابط حساباتك وموقعك التي تظهر للعملاء في صفحة الحجز والإيميلات"}
        </p>
      </div>

      {/* Dynamic Links List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {links.map((linkItem, idx) => {
          const platforms = DEFAULT_PLATFORMS;
          return (
            <div
              key={idx}
              style={{
                background: "var(--surface-alt)",
                padding: 16,
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {/* Platform Selector Bar (Round Pill Buttons) */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {platforms.map((plat) => {
                    const isActive = linkItem.platform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() =>
                          canEdit && updateLinkPlatform(idx, plat.id)
                        }
                        title={plat.label}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: isActive
                            ? "1.5px solid var(--primary)"
                            : "1px solid var(--border)",
                          background: isActive
                            ? "var(--primary)"
                            : "var(--surface)",
                          color: isActive ? "#ffffff" : "var(--text-secondary)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: canEdit ? "pointer" : "default",
                          padding: 0,
                          lineHeight: 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {plat.icon}
                      </button>
                    );
                  })}
                </div>

                {/* Trash Delete Icon Button */}
                {canEdit && links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    title={t("deleteLinkTooltip") || "حذف الرابط"}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "1px solid rgba(225, 29, 72, 0.3)",
                      background: "rgba(225, 29, 72, 0.12)",
                      color: "#f43f5e",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      padding: 0,
                      lineHeight: 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon
                      name="trash"
                      size={16}
                      style={{ display: "block", margin: "auto" }}
                    />
                  </button>
                )}
              </div>

              {/* URL Input Field */}
              <div>
                <input
                  type="url"
                  className="form-input"
                  value={linkItem.url || ""}
                  onChange={(e) => updateLinkUrl(idx, e.target.value)}
                  placeholder="https://example.com/username"
                  disabled={!canEdit}
                  style={{
                    width: "100%",
                    height: 42,
                    fontSize: "0.88rem",
                    direction: "ltr",
                    textAlign: "left",
                    borderRadius: "var(--radius-md)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Link Button */}
      {canEdit && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={addLink}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--primary)",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: 0,
            }}
          >
            <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>+</span>
            {t("addSocialLink") || "إضافة رابط"}
          </button>
        </div>
      )}

      {/* Primary Save Button */}
      {canEdit && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: 12,
          }}
        >
          <button
            type="submit"
            className="btn btn-primary btn-md"
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
            }}
          >
            {saving ? (
              <>
                <span
                  className="spinner spinner-sm"
                  style={{ borderTopColor: "#fff" }}
                />
                {t("saving") || "جاري الحفظ..."}
              </>
            ) : (
              t("saveChanges") || "حفظ التغييرات"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
