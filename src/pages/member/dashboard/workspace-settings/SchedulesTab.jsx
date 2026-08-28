import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import client, { endpoints } from "../../../../api/client";
import Icon from "../../../../components/common/Icon";
import SearchableSelect from "../../../../components/common/SearchableSelect";

export default function SchedulesTab({
  schedules,
  startOfWeek = "sunday",
  canEdit,
  onRefresh,
}) {
  const { t } = useLanguage();
  const toast = useToast();

  const [effectiveStartOfWeek, setEffectiveStartOfWeek] = useState(startOfWeek);

  useEffect(() => {
    setEffectiveStartOfWeek(startOfWeek);
  }, [startOfWeek]);

  const [timezones, setTimezones] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    client
      .get(endpoints.timezones)
      .then((res) => {
        if (res.data?.data) {
          setTimezones(res.data.data);
        }
      })
      .catch(() => {});

    client
      .get(endpoints.workspaceMembers)
      .then((res) => {
        if (res.data?.data) {
          setMembers(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const tzList =
    Array.isArray(timezones) && timezones.length > 0
      ? timezones
      : [
          {
            id: 1,
            name: "Asia/Riyadh",
            label: "Asia/Riyadh (+03:00)",
            offset: "+03:00",
          },
          {
            id: 2,
            name: "Asia/Dubai",
            label: "Asia/Dubai (+04:00)",
            offset: "+04:00",
          },
          {
            id: 3,
            name: "Africa/Cairo",
            label: "Africa/Cairo (+03:00)",
            offset: "+03:00",
          },
          {
            id: 4,
            name: "Europe/London",
            label: "Europe/London (+00:00)",
            offset: "+00:00",
          },
          {
            id: 5,
            name: "America/New_York",
            label: "America/New_York (-05:00)",
            offset: "-05:00",
          },
        ];

  const tzOptions = tzList.map((tz) => ({
    value: tz.name,
    label: tz.label || `${tz.name} (${tz.offset || ""})`,
    id: tz.id,
    raw: tz,
  }));

  const normalizeSchedule = (sch) => {
    if (!sch) return null;
    const weekly_hours = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    if (
      Array.isArray(sch.availability_rules) &&
      sch.availability_rules.length > 0
    ) {
      sch.availability_rules.forEach((rule) => {
        const day = parseInt(rule.day_of_week, 10);
        if (day >= 0 && day <= 6 && (rule.is_available ?? true)) {
          const from = rule.start_time
            ? String(rule.start_time).substring(0, 5)
            : "09:00";
          const to = rule.end_time
            ? String(rule.end_time).substring(0, 5)
            : "17:00";
          if (!weekly_hours[day]) weekly_hours[day] = [];
          weekly_hours[day].push({ from, to });
        }
      });
    } else if (sch.weekly_hours) {
      Object.assign(weekly_hours, sch.weekly_hours);
    } else {
      weekly_hours[0] = [{ from: "09:00", to: "17:00" }];
      weekly_hours[1] = [{ from: "09:00", to: "17:00" }];
      weekly_hours[2] = [{ from: "09:00", to: "17:00" }];
      weekly_hours[3] = [{ from: "09:00", to: "17:00" }];
      weekly_hours[4] = [{ from: "09:00", to: "17:00" }];
    }

    const exceptions = Array.isArray(sch.availability_overrides)
      ? sch.availability_overrides.map((ov) => ({
          id: ov.id,
          date: ov.date,
          type: ov.override_type === "custom_hours" ? "custom" : "closed",
          reason:
            ov.reason ||
            (ov.override_type === "custom_hours"
              ? t("customHours") || "ساعات مخصصة"
              : t("vacationClosedDay") || "إجازة / يوم مقفول"),
          from_time: ov.start_time
            ? String(ov.start_time).substring(0, 5)
            : null,
          to_time: ov.end_time ? String(ov.end_time).substring(0, 5) : null,
        }))
      : sch.exceptions || [];

    const workspace_member_id =
      sch.workspace_member_id || sch.workspace_member?.id || null;

    return {
      ...sch,
      name: sch.name || "",
      workspace_member_id,
      scope: workspace_member_id ? "member" : sch.scope || "workspace",
      timezone: sch.timezone?.name || sch.timezone || "Asia/Riyadh",
      timezone_id: sch.timezone_id || sch.timezone?.id || null,
      is_default: !!sch.is_default,
      valid_from: sch.valid_from || "",
      valid_until: sch.valid_until || "",
      weekly_hours,
      exceptions,
    };
  };

  const [schedulesList, setSchedulesList] = useState(() => {
    return Array.isArray(schedules) ? schedules.map(normalizeSchedule) : [];
  });

  useEffect(() => {
    if (Array.isArray(schedules)) {
      setSchedulesList(schedules.map(normalizeSchedule));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules]);

  // Selected Active Schedule ID
  const [selectedScheduleId, setSelectedScheduleId] = useState(() => {
    const active =
      (Array.isArray(schedules) ? schedules : []).find((s) => s.is_default) ||
      schedules?.[0];
    return active?.id || null;
  });

  useEffect(() => {
    if (
      schedulesList.length > 0 &&
      !schedulesList.some((s) => s.id === selectedScheduleId)
    ) {
      const active =
        schedulesList.find((s) => s.is_default) || schedulesList[0];
      setSelectedScheduleId(active?.id || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedulesList]);

  const activeSchedule =
    schedulesList.find((s) => s.id === selectedScheduleId) || schedulesList[0];

  // Schedule Modal State (Create / Edit)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    editing_id: null,
    name: "",
    scope: "workspace",
    timezone: "Asia/Riyadh",
    is_default: false,
  });

  // Schedule Validity State
  const [validityForm, setValidityForm] = useState({
    valid_from: activeSchedule?.valid_from || "",
    valid_until: activeSchedule?.valid_until || "",
  });

  useEffect(() => {
    if (activeSchedule) {
      setValidityForm({
        valid_from: activeSchedule.valid_from || "",
        valid_until: activeSchedule.valid_until || "",
      });
    }
  }, [selectedScheduleId, activeSchedule]);

  // Exceptions Form State
  const [exceptionForm, setExceptionForm] = useState({
    date: "",
    type: "closed", // 'closed' or 'custom'
    reason: "",
    from_time: "09:00",
    to_time: "13:00",
  });

  const allDays = [
    { key: 0, label: t("daySunday") || "الأحد" },
    { key: 1, label: t("dayMonday") || "الإثنين" },
    { key: 2, label: t("dayTuesday") || "الثلاثاء" },
    { key: 3, label: t("dayWednesday") || "الأربعاء" },
    { key: 4, label: t("dayThursday") || "الخميس" },
    { key: 5, label: t("dayFriday") || "الجمعة" },
    { key: 6, label: t("daySaturday") || "السبت" },
  ];

  const getStartDayIndex = (startDay) => {
    if (typeof startDay === "number") return startDay % 7;
    if (typeof startDay === "string") {
      const lower = startDay.toLowerCase();
      if (lower === "monday" || lower === "1") return 1;
      if (lower === "saturday" || lower === "6") return 6;
      if (lower === "sunday" || lower === "0") return 0;
    }
    return 0;
  };

  const startIndex = getStartDayIndex(effectiveStartOfWeek);
  const daysList = Array.from({ length: 7 }, (_, i) => {
    const dayKey = (startIndex + i) % 7;
    return allDays.find((d) => d.key === dayKey);
  });

  const [savingModal, setSavingModal] = useState(false);
  const [savingWeeklyRules, setSavingWeeklyRules] = useState(false);
  const [savingValidity, setSavingValidity] = useState(false);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setModalForm({
      editing_id: null,
      name: "",
      scope: "workspace",
      workspace_member_id: "",
      timezone: "Asia/Riyadh",
      timezone_id: timezones.find((t) => t.name === "Asia/Riyadh")?.id || null,
      is_default: false,
    });
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!activeSchedule) return;
    const isMemberScope =
      !!activeSchedule.workspace_member_id || activeSchedule.scope === "member";
    setModalForm({
      editing_id: activeSchedule.id,
      name: activeSchedule.name || "",
      scope: isMemberScope ? "member" : "workspace",
      workspace_member_id: activeSchedule.workspace_member_id || "",
      timezone: activeSchedule.timezone || "Asia/Riyadh",
      timezone_id: activeSchedule.timezone_id || null,
      is_default: !!activeSchedule.is_default,
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveModalForm = async (e) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return;

    try {
      setSavingModal(true);
      const foundTz = timezones.find((t) => t.name === modalForm.timezone);
      const timezoneId = modalForm.timezone_id || foundTz?.id || null;

      const payload = {
        name: modalForm.name.trim(),
        timezone_id: timezoneId,
        is_default: modalForm.is_default,
        workspace_member_id:
          modalForm.scope === "member" && modalForm.workspace_member_id
            ? Number(modalForm.workspace_member_id)
            : null,
      };

      if (modalForm.editing_id) {
        await client.put(
          endpoints.workspaceScheduleItem(modalForm.editing_id),
          payload,
        );
        toast.success(t("scheduleUpdatedSuccess") || "تم تحديث البيانات بنجاح");
      } else {
        await client.post(endpoints.workspaceSchedules, payload);
        toast.success(
          t("scheduleCreatedSuccess") || "تم إنشاء الجدول الجديد بنجاح",
        );
      }

      setIsScheduleModalOpen(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
      toast.error(
        err.response?.data?.message ||
          t("saveScheduleFailed") ||
          "فشل حفظ الجدول",
      );
    } finally {
      setSavingModal(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!activeSchedule) return;
    if (activeSchedule.is_default) {
      toast.error(
        t("cannotDeleteDefaultSchedule") ||
          "لا يمكن حذف الجدول الافتراضي لمساحة العمل",
      );
      return;
    }

    const confirmMsg =
      t("confirmDeleteSchedule") || "هل أنت تأكد من رغبتك في حذف هذا الجدول؟";
    if (!window.confirm(confirmMsg)) return;

    try {
      await client.delete(endpoints.workspaceScheduleItem(activeSchedule.id));
      toast.success(t("scheduleDeletedSuccess") || "تم حذف الجدول بنجاح");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      toast.error(err.response?.data?.message || "فشل حذف الجدول");
    }
  };

  // Weekly Hours Multi-slot Handlers
  const handleToggleDay = (dayKey) => {
    if (!canEdit || !activeSchedule) return;
    setSchedulesList((prev) =>
      prev.map((s) => {
        if (s.id === selectedScheduleId) {
          const currentSlots = s.weekly_hours?.[dayKey] || [];
          const updatedSlots =
            currentSlots.length > 0 ? [] : [{ from: "09:00", to: "17:00" }];
          return {
            ...s,
            weekly_hours: {
              ...(s.weekly_hours || {}),
              [dayKey]: updatedSlots,
            },
          };
        }
        return s;
      }),
    );
  };

  const handleAddSlot = (dayKey) => {
    if (!canEdit || !activeSchedule) return;
    setSchedulesList((prev) =>
      prev.map((s) => {
        if (s.id === selectedScheduleId) {
          const currentSlots = s.weekly_hours?.[dayKey] || [];
          return {
            ...s,
            weekly_hours: {
              ...(s.weekly_hours || {}),
              [dayKey]: [...currentSlots, { from: "18:00", to: "21:00" }],
            },
          };
        }
        return s;
      }),
    );
  };

  const handleRemoveSlot = (dayKey, slotIdx) => {
    if (!canEdit || !activeSchedule) return;
    setSchedulesList((prev) =>
      prev.map((s) => {
        if (s.id === selectedScheduleId) {
          const currentSlots = s.weekly_hours?.[dayKey] || [];
          const filtered = currentSlots.filter((_, idx) => idx !== slotIdx);
          return {
            ...s,
            weekly_hours: {
              ...(s.weekly_hours || {}),
              [dayKey]: filtered,
            },
          };
        }
        return s;
      }),
    );
  };

  const handleSlotChange = (dayKey, slotIdx, field, value) => {
    if (!canEdit || !activeSchedule) return;
    setSchedulesList((prev) =>
      prev.map((s) => {
        if (s.id === selectedScheduleId) {
          const currentSlots = [...(s.weekly_hours?.[dayKey] || [])];
          if (currentSlots[slotIdx]) {
            currentSlots[slotIdx] = {
              ...currentSlots[slotIdx],
              [field]: value,
            };
          }
          return {
            ...s,
            weekly_hours: {
              ...(s.weekly_hours || {}),
              [dayKey]: currentSlots,
            },
          };
        }
        return s;
      }),
    );
  };

  const handleSaveWeeklyRules = async () => {
    if (!activeSchedule) return;

    try {
      setSavingWeeklyRules(true);
      const rules = Object.keys(activeSchedule.weekly_hours || {}).map(
        (dayKey) => {
          const slots = activeSchedule.weekly_hours[dayKey] || [];
          return {
            day_of_week: parseInt(dayKey, 10),
            is_available: slots.length > 0,
            slots: slots.map((s) => ({
              start_time: s.from,
              end_time: s.to,
            })),
          };
        },
      );

      await client.put(
        `${endpoints.workspaceSchedules}/${activeSchedule.id}/weekly-rules`,
        { rules },
      );
      toast.success(
        t("weeklyRulesSavedSuccess") || "تم حفظ ساعات العمل الأسبوعية بنجاح",
      );
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to save weekly rules:", err);
      toast.error(
        err.response?.data?.message || "فشل حفظ ساعات العمل الأسبوعية",
      );
    } finally {
      setSavingWeeklyRules(false);
    }
  };

  // Save Validity Period
  const handleSaveValidity = async () => {
    if (!activeSchedule) return;

    try {
      setSavingValidity(true);
      await client.put(endpoints.workspaceScheduleItem(activeSchedule.id), {
        valid_from: validityForm.valid_from || null,
        valid_until: validityForm.valid_until || null,
      });
      toast.success(t("scheduleSavedSuccess") || "تم حفظ إعدادات الجدول بنجاح");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to save schedule validity:", err);
      toast.error(err.response?.data?.message || "فشل حفظ فترة الصلاحية");
    } finally {
      setSavingValidity(false);
    }
  };

  // Exceptions Handlers
  const handleAddException = async (e) => {
    e.preventDefault();
    if (!activeSchedule) return;
    if (!exceptionForm.date) {
      toast.error(t("selectDateError") || "يرجى اختيار التاريخ أولاً");
      return;
    }

    try {
      const isCustom = exceptionForm.type === "custom";
      const payload = {
        date: exceptionForm.date,
        override_type: isCustom ? "custom_hours" : "unavailable",
        is_available: isCustom,
        start_time: isCustom ? exceptionForm.from_time : null,
        end_time: isCustom ? exceptionForm.to_time : null,
        reason: exceptionForm.reason || null,
      };

      await client.post(
        `${endpoints.workspaceSchedules}/${activeSchedule.id}/overrides`,
        payload,
      );
      setExceptionForm({
        date: "",
        type: "closed",
        reason: "",
        from_time: "09:00",
        to_time: "13:00",
      });
      toast.success(t("exceptionAddedSuccess") || "تم إضافة الاستثناء بنجاح");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to add exception:", err);
      toast.error(err.response?.data?.message || "فشل إضافة الاستثناء");
    }
  };

  const handleDeleteException = async (exId) => {
    if (!canEdit || !activeSchedule) return;
    try {
      await client.delete(
        `${endpoints.workspaceSchedules}/${activeSchedule.id}/overrides/${exId}`,
      );
      toast.success(t("exceptionDeletedSuccess") || "تم حذف الاستثناء بنجاح");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete exception:", err);
      toast.error(err.response?.data?.message || "فشل حذف الاستثناء");
    }
  };

  return (
    <div
      className="card-body"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* 1. Header Toolbar & Schedule Switcher Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--primary-subtle)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="clock" size={18} />
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                margin: 0,
                color: "var(--heading)",
              }}
            >
              {t("workspaceSchedules") || "الجداول والتوفر"}
            </h2>
          </div>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {t("workspaceSchedulesDesc") ||
              "ضبط أوقات وأيام العمل الفعالة لكل أسبوع، فترات الصلاحية، والاستثناءات المخصصة"}
          </p>
        </div>

        {canEdit && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreateModal}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            {t("newScheduleBtn") || "جدول جديد"}
          </button>
        )}
      </div>

      {/* 2. Schedule Selector Tabs */}
      {schedulesList.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px border-dashed var(--border)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Icon name="clock" size={24} />
          </div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 6px",
              color: "var(--heading)",
            }}
          >
            {t("noSchedulesFound") ||
              "لا توجد جداول عمل أو ساعات توفر مضافة حالياً"}
          </h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--muted)",
              margin: "0 0 16px",
            }}
          >
            {t("noSchedulesDesc") ||
              "قم بإنشاء جدول العمل الأول لمساحتك لتحديد أيام وساعات العمل المتاحة."}
          </p>
          {canEdit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreateModal}
            >
              + {t("addFirstSchedule") || "إضافة جدول جديد"}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="schedule-top-bar">
            <div
              className="no-scrollbar"
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                flex: 1,
                minWidth: 0,
              }}
            >
              {schedulesList.map((sch) => {
                const isSelected = sch.id === selectedScheduleId;
                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => setSelectedScheduleId(sch.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 20,
                      fontSize: "0.86rem",
                      fontWeight: isSelected ? 800 : 500,
                      border: isSelected
                        ? "1.5px solid var(--primary)"
                        : "1px solid var(--border-light)",
                      background: isSelected
                        ? "var(--primary-subtle)"
                        : "var(--bg-card)",
                      color: isSelected
                        ? "var(--primary)"
                        : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{sch.name}</span>
                    {sch.workspace_member_id && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "var(--surface-alt)",
                          color: "var(--primary)",
                          border: "1px solid var(--border)",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                      >
                        {members.find(
                          (m) =>
                            String(m.id) === String(sch.workspace_member_id),
                        )?.name ||
                          members.find(
                            (m) =>
                              String(m.id) === String(sch.workspace_member_id),
                          )?.user?.name ||
                          sch.workspace_member?.name ||
                          sch.workspace_member?.user?.name ||
                          t("memberSchedule") ||
                          "عضو"}
                      </span>
                    )}
                    {sch.is_default && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          background: "var(--primary)",
                          color: "#ffffff",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        {t("defaultBadge") || "افتراضي"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeSchedule && canEdit && (
              <div className="schedule-top-bar-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleOpenEditModal}
                  title={t("editScheduleModalTitle") || "تعديل بيانات الجدول"}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="edit" size={13} />
                  {t("editScheduleNameBtn") || "تعديل"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleDeleteSchedule}
                  disabled={activeSchedule.is_default}
                  title={
                    activeSchedule.is_default
                      ? t("cannotDeleteDefaultSchedule") ||
                        "لا يمكن حذف الجدول الافتراضي لمساحة العمل"
                      : t("deleteScheduleBtn") || "حذف الجدول"
                  }
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: activeSchedule.is_default
                      ? "var(--muted)"
                      : "#ef4444",
                    opacity: activeSchedule.is_default ? 0.5 : 1,
                    cursor: activeSchedule.is_default
                      ? "not-allowed"
                      : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="trash" size={13} />
                  {t("deleteScheduleBtn") || "حذف"}
                </button>
              </div>
            )}
          </div>

          {/* 3. Weekly Hours Builder */}
          {activeSchedule && (
            <>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {daysList.map((d) => {
                  const slots = activeSchedule.weekly_hours?.[d.key] || [];
                  const isDayEnabled = slots.length > 0;

                  return (
                    <div
                      key={d.key}
                      className="schedule-day-card"
                      style={{
                        padding: "14px 20px",
                        background: "var(--surface-alt)",
                        borderRadius: "var(--radius-lg)",
                        border: isDayEnabled
                          ? "1px solid var(--border-light)"
                          : "1px solid var(--border)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 16,
                        opacity: isDayEnabled ? 1 : 0.7,
                      }}
                    >
                      {/* Day Checkbox & Title */}
                      <div
                        className="schedule-day-header"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          minWidth: 140,
                          paddingTop: 6,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isDayEnabled}
                          onChange={() => handleToggleDay(d.key)}
                          disabled={!canEdit}
                          style={{
                            accentColor: "var(--primary)",
                            width: 18,
                            height: 18,
                            cursor: canEdit ? "pointer" : "default",
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "0.96rem",
                            color: isDayEnabled
                              ? "var(--heading)"
                              : "var(--muted)",
                          }}
                        >
                          {d.label}
                        </span>
                      </div>

                      {/* Slots Rows */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          minWidth: 0,
                          width: "100%",
                        }}
                      >
                        {isDayEnabled ? (
                          slots.map((slot, sIdx) => (
                            <div key={sIdx} className="schedule-slot-row">
                              <input
                                type="time"
                                className="form-input schedule-time-input"
                                value={slot.from}
                                onChange={(e) =>
                                  handleSlotChange(
                                    d.key,
                                    sIdx,
                                    "from",
                                    e.target.value,
                                  )
                                }
                                disabled={!canEdit}
                              />
                              <span
                                style={{
                                  fontSize: "0.82rem",
                                  color: "var(--muted)",
                                  flexShrink: 0,
                                }}
                              >
                                إلى
                              </span>
                              <input
                                type="time"
                                className="form-input schedule-time-input"
                                value={slot.to}
                                onChange={(e) =>
                                  handleSlotChange(
                                    d.key,
                                    sIdx,
                                    "to",
                                    e.target.value,
                                  )
                                }
                                disabled={!canEdit}
                              />

                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(d.key, sIdx)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    padding: 4,
                                    flexShrink: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title={t("deleteSlotTooltip") || "حذف الفترة"}
                                >
                                  <Icon name="x" size={14} />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <span
                            style={{
                              fontSize: "0.84rem",
                              color: "var(--muted)",
                              paddingTop: 6,
                            }}
                          >
                            {t("unavailableClosed") || "غير متاح (مغلق)"}
                          </span>
                        )}
                      </div>

                      {/* Action: Add Slot */}
                      {canEdit && isDayEnabled && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleAddSlot(d.key)}
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--primary)",
                            fontWeight: 700,
                          }}
                        >
                          {t("addTimeSlotBtn") || "+ إضافة فترة"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {canEdit && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveWeeklyRules}
                    disabled={savingWeeklyRules}
                    style={{ gap: 6, padding: "8px 24px", fontWeight: 700 }}
                  >
                    {savingWeeklyRules ? (
                      <>
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                        {t("saving") || "جاري الحفظ..."}
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={14} />
                        {t("saveWeeklyHoursBtn") || "حفظ ساعات العمل الأسبوعية"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 4. CARD 1: Schedule Validity Period Card (Matching Screenshot 1) */}
          <div
            className="card"
            style={{
              padding: 24,
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <Icon name="calendar" size={20} />
              <h3
                style={{
                  fontSize: "1.08rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--heading)",
                }}
              >
                {t("scheduleValidityTitle") || "فترة صلاحية الجدول"}
              </h3>
            </div>
            <p
              style={{
                fontSize: "0.84rem",
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              {t("scheduleValiditySub") ||
                "حدد تاريخ بداية و/أو نهاية لسريان هذا الجدول المتكرر. بعد تاريخ النهاية يتوقف عرض المواعيد تلقائياً، اتركها فارغة لجدول دائم."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t("validFromLabel") || "ساري من"}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={validityForm.valid_from}
                  onChange={(e) =>
                    setValidityForm({
                      ...validityForm,
                      valid_from: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t("validUntilLabel") || "ساري حتى"}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={validityForm.valid_until}
                  onChange={(e) =>
                    setValidityForm({
                      ...validityForm,
                      valid_until: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>

            {canEdit && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveValidity}
                  disabled={savingValidity}
                  style={{ gap: 6, padding: "8px 24px", fontWeight: 700 }}
                >
                  {savingValidity ? (
                    <>
                      <span
                        className="spinner spinner-sm"
                        style={{ borderTopColor: "#fff" }}
                      />
                      {t("saving") || "جاري الحفظ..."}
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={14} />
                      {t("saveValidityBtn") || "حفظ الصلاحية"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 5. CARD 2: Exceptions & Overrides Card (Matching Screenshot 1) */}
          <div
            className="card"
            style={{
              padding: 24,
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <Icon name="alert-triangle" size={20} />
              <h3
                style={{
                  fontSize: "1.08rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--heading)",
                }}
              >
                {t("exceptionsTitle") || "استثناءات (إجازات / ساعات مخصصة)"}
              </h3>
            </div>
            <p
              style={{
                fontSize: "0.84rem",
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              {t("exceptionsSub") ||
                "حدد يوماً مقفولاً تماماً، أو يوماً بساعات مختلفة عن المعتاد"}
            </p>

            {/* Inline Add Exception Form */}
            {canEdit && (
              <form
                onSubmit={handleAddException}
                style={{
                  background: "var(--surface-alt)",
                  padding: 18,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  marginBottom: 20,
                }}
              >
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("selectDateLabel") || "اختر التاريخ"}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={exceptionForm.date}
                    onChange={(e) =>
                      setExceptionForm({
                        ...exceptionForm,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="ex_type"
                      checked={exceptionForm.type === "closed"}
                      onChange={() =>
                        setExceptionForm({ ...exceptionForm, type: "closed" })
                      }
                      style={{ accentColor: "var(--primary)" }}
                    />
                    {t("typeClosedDay") || "يوم مقفول"}
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="ex_type"
                      checked={exceptionForm.type === "custom"}
                      onChange={() =>
                        setExceptionForm({ ...exceptionForm, type: "custom" })
                      }
                      style={{ accentColor: "var(--primary)" }}
                    />
                    {t("typeCustomHours") || "ساعات مخصصة"}
                  </label>
                </div>

                {exceptionForm.type === "custom" && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label
                        className="form-label"
                        style={{ fontSize: "0.8rem" }}
                      >
                        من الساعة
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        value={exceptionForm.from_time}
                        onChange={(e) =>
                          setExceptionForm({
                            ...exceptionForm,
                            from_time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label
                        className="form-label"
                        style={{ fontSize: "0.8rem" }}
                      >
                        إلى الساعة
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        value={exceptionForm.to_time}
                        onChange={(e) =>
                          setExceptionForm({
                            ...exceptionForm,
                            to_time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t("reasonOptionalLabel") || "السبب (اختياري)"}
                    value={exceptionForm.reason}
                    onChange={(e) =>
                      setExceptionForm({
                        ...exceptionForm,
                        reason: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {t("addExceptionBtn") || "+ إضافة"}
                </button>
              </form>
            )}

            {/* Added Exceptions List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!activeSchedule.exceptions ||
              activeSchedule.exceptions.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "var(--muted)",
                    fontSize: "0.86rem",
                  }}
                >
                  {t("noExceptionsFound") || "لا توجد استثناءات"}
                </div>
              ) : (
                activeSchedule.exceptions.map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "var(--surface-alt)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          color: "var(--heading)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>📅 {ex.date}</span>
                        <span
                          className={`profile-badge ${ex.type === "closed" ? "unverified" : "verified"}`}
                          style={{ fontSize: "0.74rem", padding: "2px 8px" }}
                        >
                          {ex.type === "closed"
                            ? t("typeClosedDay") || "يوم مقفول"
                            : t("typeCustomHours") || "ساعات مخصصة"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          marginTop: 4,
                        }}
                      >
                        {ex.reason}{" "}
                        {ex.type === "custom" &&
                          `(${ex.from_time} - ${ex.to_time})`}
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteException(ex.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: 4,
                        }}
                        title={t("deleteExceptionTooltip") || "حذف الاستثناء"}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 6. MODAL: Create / Edit Schedule (Matching Screenshot 2) */}
      {isScheduleModalOpen &&
        createPortal(
          <div className="modal-backdrop">
            <div className="modal-card modal-sm animate-scale-up">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalForm.editing_id
                    ? t("editScheduleModalTitle") || "تعديل بيانات الجدول"
                    : t("newScheduleModalTitle") || "جدول جديد"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveModalForm} className="modal-body">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("scheduleNameLabel") || "الاسم *"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={modalForm.name}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, name: e.target.value })
                    }
                    placeholder={
                      t("scheduleNamePlaceholder") || "مثال: الجدول الافتراضي"
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("memberScopeLabel") ||
                      "نطاق الجدول (العضو / مساحة العمل)"}
                  </label>
                  <select
                    className="form-select"
                    value={modalForm.scope}
                    onChange={(e) => {
                      const newScope = e.target.value;
                      setModalForm({
                        ...modalForm,
                        scope: newScope,
                        workspace_member_id:
                          newScope === "member"
                            ? modalForm.workspace_member_id ||
                              (members[0]?.id ? String(members[0].id) : "")
                            : "",
                      });
                    }}
                  >
                    <option value="workspace">
                      {t("workspaceLevelScope") || "مستوى مساحة العمل (عام)"}
                    </option>
                    <option value="member">
                      {t("specificMemberScope") || "عضو محدد في مساحة العمل"}
                    </option>
                  </select>
                </div>

                {modalForm.scope === "member" && (
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t("selectWorkspaceMember") || "العضو المحدد *"}
                    </label>
                    <select
                      className="form-select"
                      value={modalForm.workspace_member_id || ""}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          workspace_member_id: e.target.value,
                        })
                      }
                      required={modalForm.scope === "member"}
                    >
                      <option value="">
                        {t("selectMemberPlaceholder") || "-- اختر العضو --"}
                      </option>
                      {members.map((mem) => {
                        const memberName =
                          mem.name ||
                          mem.user?.name ||
                          mem.email ||
                          `Member #${mem.id}`;
                        return (
                          <option key={mem.id} value={mem.id}>
                            {memberName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("timezoneLabel") || "المنطقة الزمنية"}
                  </label>
                  <SearchableSelect
                    value={modalForm.timezone}
                    options={tzOptions}
                    placeholder={
                      t("selectTimezone") || "-- اختر المنطقة الزمنية --"
                    }
                    searchPlaceholder={
                      t("searchTimezones") || "بحث في المناطق الزمنية..."
                    }
                    onChange={(selectedVal, rawObj) => {
                      const foundTz = rawObj?.raw || rawObj;
                      setModalForm({
                        ...modalForm,
                        timezone: selectedVal,
                        timezone_id: foundTz?.id || modalForm.timezone_id,
                      });
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={modalForm.is_default}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          is_default: e.target.checked,
                        })
                      }
                      disabled={
                        activeSchedule?.is_default &&
                        modalForm.editing_id === activeSchedule.id
                      }
                      style={{
                        accentColor: "var(--primary)",
                        width: 18,
                        height: 18,
                      }}
                    />
                    <span>
                      {t("isDefaultScheduleLabel") || "الجدول الافتراضي"}
                    </span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsScheduleModalOpen(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingModal}
                    style={{ fontWeight: 700 }}
                  >
                    {savingModal ? (
                      <>
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                        {t("saving") || "جاري الحفظ..."}
                      </>
                    ) : (
                      t("save") || "حفظ"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
