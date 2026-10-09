import React, { useState, useEffect, useCallback } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatPortalsTab() {
  const [portals, setPortals] = useState([]);
  const [activePortal, setActivePortal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalForm, setPortalForm] = useState({
    name: "",
    slug: "",
    color: "#1F93FF",
    header_text: "",
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    status: "published",
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Portals
  const fetchPortals = useCallback(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatPortals)
      .then((res) => {
        const list = res.data?.data?.payload || res.data?.data || [];
        setPortals(Array.isArray(list) ? list : []);
        if (list.length > 0) {
          setActivePortal((prev) => prev || list[0]);
        }
      })
      .catch(() => setPortals([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  // Fetch Categories & Articles when activePortal changes
  useEffect(() => {
    if (!activePortal?.id) return;
    setDetailsLoading(true);
    Promise.all([
      client
        .get(endpoints.workspaceSaabqChatPortalCategories(activePortal.id))
        .catch(() => ({ data: { data: [] } })),
      client
        .get(endpoints.workspaceSaabqChatPortalArticles(activePortal.id))
        .catch(() => ({ data: { data: [] } })),
    ])
      .then(([catRes, artRes]) => {
        const cList = catRes.data?.data?.payload || catRes.data?.data || [];
        const aList = artRes.data?.data?.payload || artRes.data?.data || [];
        setCategories(Array.isArray(cList) ? cList : []);
        setArticles(Array.isArray(aList) ? aList : []);
      })
      .finally(() => setDetailsLoading(false));
  }, [activePortal?.id]);

  // Create Portal
  const handleSavePortal = async (e) => {
    e.preventDefault();
    if (!portalForm.name.trim() || !portalForm.slug.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatPortals, portalForm);
      setShowPortalModal(false);
      setPortalForm({ name: "", slug: "", color: "#1F93FF", header_text: "" });
      fetchPortals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create portal");
    } finally {
      setSubmitting(false);
    }
  };

  // Create Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !activePortal?.id) return;
    setSubmitting(true);
    try {
      await client.post(
        endpoints.workspaceSaabqChatPortalCategories(activePortal.id),
        categoryForm,
      );
      setShowCategoryModal(false);
      setCategoryForm({ name: "", slug: "", description: "" });
      const res = await client.get(
        endpoints.workspaceSaabqChatPortalCategories(activePortal.id),
      );
      setCategories(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId) => {
    if (!activePortal?.id || !confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    try {
      await client.delete(
        endpoints.workspaceSaabqChatPortalCategoryDetail(
          activePortal.id,
          catId,
        ),
      );
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete category");
    }
  };

  // Create Article
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (
      !articleForm.title.trim() ||
      !articleForm.content.trim() ||
      !activePortal?.id
    )
      return;
    setSubmitting(true);
    try {
      await client.post(
        endpoints.workspaceSaabqChatPortalArticles(activePortal.id),
        articleForm,
      );
      setShowArticleModal(false);
      setArticleForm({ title: "", content: "", status: "published" });
      const res = await client.get(
        endpoints.workspaceSaabqChatPortalArticles(activePortal.id),
      );
      setArticles(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create article");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (artId) => {
    if (!activePortal?.id || !confirm("هل أنت متأكد من حذف هذا المقال؟"))
      return;
    try {
      await client.delete(
        endpoints.workspaceSaabqChatPortalArticleDetail(activePortal.id, artId),
      );
      setArticles((prev) => prev.filter((a) => a.id !== artId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete article");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
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
            مركز المساعدة وقاعدة المعرفة (Help Center & Articles)
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
            }}
          >
            إدارة البوابات المعرفية العامة، تصنيفات المساعدة، والمقالات المتاحة
            للعملاء
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setPortalForm({
              name: "",
              slug: "",
              color: "#1F93FF",
              header_text: "",
            });
            setShowPortalModal(true);
          }}
          style={{ gap: 6 }}
        >
          <Icon name="plus" size={15} />
          <span>إنشاء بوابة معرفية جديدة</span>
        </button>
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          جاري التحميل...
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
          لا توجد بوابات مساعدة مسجلة
        </div>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}
        >
          {/* Left: Portals List */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: 14,
            }}
          >
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: "0.92rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              البوابات المعرفية
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {portals.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActivePortal(p)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background:
                      activePortal?.id === p.id
                        ? "rgba(2, 105, 130, 0.08)"
                        : "transparent",
                    border:
                      activePortal?.id === p.id
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color:
                        activePortal?.id === p.id
                          ? "var(--primary)"
                          : "var(--heading)",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    /{p.slug}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Active Portal Detail (Categories & Articles) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {activePortal ? (
              <>
                {/* Categories Section */}
                <div
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius-lg, 16px)",
                    border: "1px solid var(--border)",
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 800,
                      }}
                    >
                      أقسام وتصنيفات: {activePortal.name}
                    </h4>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowCategoryModal(true)}
                      style={{ gap: 4 }}
                    >
                      <Icon name="plus" size={13} />
                      <span>إضافة تصنيف</span>
                    </button>
                  </div>

                  {detailsLoading ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "var(--muted)",
                      }}
                    >
                      جاري التحميل...
                    </div>
                  ) : categories.length === 0 ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      لا توجد تصنيفات بعد
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {categories.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background:
                              "var(--surface-subtle, rgba(0,0,0,0.02))",
                            padding: 12,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: 700, fontSize: "0.84rem" }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--muted)",
                              }}
                            >
                              /{c.slug}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#dc2626",
                            }}
                          >
                            <Icon name="trash-2" size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Articles Section */}
                <div
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius-lg, 16px)",
                    border: "1px solid var(--border)",
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 800,
                      }}
                    >
                      المقالات والشروحات
                    </h4>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowArticleModal(true)}
                      style={{ gap: 4 }}
                    >
                      <Icon name="plus" size={13} />
                      <span>كتابة مقال جديد</span>
                    </button>
                  </div>

                  {detailsLoading ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "var(--muted)",
                      }}
                    >
                      جاري التحميل...
                    </div>
                  ) : articles.length === 0 ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      لا توجد مقالات بعد
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {articles.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            background:
                              "var(--surface-subtle, rgba(0,0,0,0.02))",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: 700, fontSize: "0.88rem" }}
                            >
                              {a.title}
                            </div>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "1px 6px",
                                borderRadius: 6,
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "#059669",
                              }}
                            >
                              {a.status}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(a.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: "#dc2626", padding: "4px 8px" }}
                          >
                            <Icon name="trash-2" size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--muted)",
                }}
              >
                حدد بوابة لعرض تفاصيلها
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portal Modal */}
      {showPortalModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إنشاء بوابة مساعدة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPortalModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSavePortal} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم البوابة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مركز مساعدة العملاء"
                  value={portalForm.name}
                  onChange={(e) =>
                    setPortalForm({ ...portalForm, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الاسم اللطيف (Slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="help"
                  value={portalForm.slug}
                  onChange={(e) =>
                    setPortalForm({ ...portalForm, slug: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPortalModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء البوابة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة تصنيف جديد</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCategoryModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم التصنيف *
                </label>
                <input
                  type="text"
                  required
                  placeholder="الحجوزات والمواعيد"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الاسم اللطيف (Slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="bookings"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ التصنيف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h4 className="modal-title">كتابة مقال معرفي جديد</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowArticleModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveArticle} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  عنوان المقال *
                </label>
                <input
                  type="text"
                  required
                  placeholder="كيفية حجز موعد استشارة وتأكيده"
                  value={articleForm.title}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  المحتوى *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="اكتب خطوات الشرح بالتفصيل هنا..."
                  value={articleForm.content}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, content: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowArticleModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري النشر..." : "نشر المقال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
