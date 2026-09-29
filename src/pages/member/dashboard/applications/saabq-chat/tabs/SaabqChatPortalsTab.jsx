import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatPortalsTab() {
  const { t } = useLanguage();
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatPortals || endpoints.chatPortals)
      .then((res) => {
        const list = res.data?.data?.portals || res.data?.data || [];
        setPortals(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setPortals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--heading)",
            }}
          >
            {t("helpCenterPortals")}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            {t("helpCenterPortalsDesc")}
          </p>
        </div>
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          {t("loadingPortals")}
        </div>
      ) : portals.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          {t("noPortalsFound")}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {portals.map((p) => (
            <div
              key={p.id}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-lg, 16px)",
                border: "1px solid var(--border)",
                padding: 24,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(2, 105, 130, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="book-open" size={20} />
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "0.98rem",
                      fontWeight: 800,
                      color: "var(--heading)",
                    }}
                  >
                    {p.name}
                  </h4>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                    Slug: /{p.slug}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: "0.82rem" }}>
                  <strong>{p.articles_count}</strong>{" "}
                  <span style={{ color: "var(--text-secondary)" }}>
                    {t("publishedArticles")}
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem" }}>
                  <strong>{p.categories_count}</strong>{" "}
                  <span style={{ color: "var(--text-secondary)" }}>
                    {t("mainCategories")}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginBottom: 6,
                  }}
                >
                  {t("includedCategories")}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.categories?.map((cat, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "var(--surface-subtle, rgba(0,0,0,0.03))",
                        border:
                          "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center", gap: 6 }}
              >
                <Icon name="external-link" size={13} />
                <span>{t("previewPortal")}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
