import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import client, { endpoints } from "../../../../api/client";
import Icon from "../../../../components/common/Icon";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import WorkspacePageHeader from "../../../../components/dashboard/WorkspacePageHeader";

export default function SchedulesTab({
  schedules,
  startOfWeek = "sunday",
  canEdit = true,
  canCreate,
  canUpdate,
  canDelete,
  onRefresh,
}) {
  const allowCreate = canCreate !== undefined ? canCreate : canEdit;
  const allowUpdate = canUpdate !== undefined ? canUpdate : canEdit;
  const allowDelete = canDelete !== undefined ? canDelete : canEdit;
  const { t, lang } = useLanguage();
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

  // Schedule horizontal tabs scrolling refs and logic
  const tabsContainerRef = useRef(null);
  const activeTabRef = useRef(null);
  const [hasTabsOverflow, setHasTabsOverflow] = useState(false);

  const checkTabsOverflow = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setHasTabsOverflow(el.scrollWidth > el.clientWidth + 4);
  }, []);

  useEffect(() => {
    checkTabsOverflow();
    window.addEventListener("resize", checkTabsOverflow);
    return () => window.removeEventListener("resize", checkTabsOverflow);
  }, [checkTabsOverflow, schedulesList.length]);

  // Auto-scroll active tab into view when selected
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedScheduleId]);

  // Mouse wheel listener on tabs container to scroll horizontally
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (
        Math.abs(e.deltaY) > Math.abs(e.deltaX) &&
        el.scrollWidth > el.clientWidth
      ) {
        e.preventDefault();
        el.scrollBy({
          left: lang === "ar" ? -e.deltaY : e.deltaY,
          behavior: "auto",
        });
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lang]);

  const scrollTabs = (dir) => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const scrollAmount = 260;
    if (lang === "ar") {
      el.scrollBy({
        left: dir === "next" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    } else {
      el.scrollBy({
        left: dir === "next" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

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

<<<<<<< HEAD
  // Schedule Copy Slots State
  const [copyState, setCopyState] = useState({
    isOpen: false,
    fromDayKey: null,
    fromDayLabel: "",
    targetDays: [],
    saving: false,
    anchorRect: null,
  });

  useEffect(() => {
    if (!copyState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !copyState.saving) {
        setCopyState((prev) => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copyState.isOpen, copyState.saving]);

  const getPopoverPosition = useCallback(() => {
    if (!copyState.anchorRect) return {};

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(calc(100vw - 32px), 360px)",
        maxWidth: "360px",
        maxHeight: "85vh",
        zIndex: 999999,
      };
    }

    const { anchorRect } = copyState;
    const popoverWidth = 320;
    const estimatedHeight = 390;
    const padding = 16;

    let top = anchorRect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - padding) {
      top = Math.max(padding, anchorRect.top - estimatedHeight - 8);
    }

    let left = "auto";
    let right = "auto";

    if (lang === "ar") {
      right = window.innerWidth - anchorRect.right;
      if (right + popoverWidth > window.innerWidth - padding) {
        right = padding;
      }
      if (right < padding) {
        right = padding;
      }
    } else {
      left = anchorRect.left;
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }
    }

    return {
      position: "fixed",
      top: `${top}px`,
      ...(lang === "ar"
        ? { right: `${right}px`, left: "auto" }
        : { left: `${left}px`, right: "auto" }),
      width: `${popoverWidth}px`,
      maxWidth: `calc(100vw - ${padding * 2}px)`,
      maxHeight: "calc(100vh - 32px)",
      zIndex: 999999,
    };
  }, [copyState.anchorRect, lang]);

  const handleOpenCopyModal = (dayKey, dayLabel, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const slots = activeSchedule?.weekly_hours?.[dayKey] || [];
    if (slots.length === 0) {
      toast.error(t("noSlotsToCopy") || "لا توجد فترات لنسخها في هذا اليوم");
      return;
    }

    setCopyState({
      isOpen: true,
      fromDayKey: dayKey,
      fromDayLabel: dayLabel,
      targetDays: [],
      saving: false,
      anchorRect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  const handleToggleTargetDay = (targetDayKey) => {
    setCopyState((prev) => {
      const exists = prev.targetDays.includes(targetDayKey);
      return {
        ...prev,
        targetDays: exists
          ? prev.targetDays.filter((k) => k !== targetDayKey)
          : [...prev.targetDays, targetDayKey],
      };
    });
  };

  const handleToggleAllTargetDays = (eligibleDayKeys) => {
    setCopyState((prev) => {
      const allSelected = prev.targetDays.length === eligibleDayKeys.length;
      return {
        ...prev,
        targetDays: allSelected ? [] : [...eligibleDayKeys],
      };
    });
  };

  const handleApplyCopySlots = () => {
    if (!activeSchedule || copyState.targetDays.length === 0) {
      toast.error(
        t("selectAtLeastOneDay") || "يرجى اختيار يوم واحد على الأقل للنسخ إليه",
      );
      return;
    }

    const fromSlots = activeSchedule.weekly_hours?.[copyState.fromDayKey] || [];
    if (fromSlots.length === 0) {
      toast.error(t("noSlotsToCopy") || "لا توجد فترات لنسخها في هذا اليوم");
      return;
    }

    // Update local weekly_hours directly on the frontend
    setSchedulesList((prev) =>
      prev.map((s) => {
        if (s.id === selectedScheduleId) {
          const updatedWeeklyHours = { ...(s.weekly_hours || {}) };
          copyState.targetDays.forEach((tDay) => {
            updatedWeeklyHours[tDay] = fromSlots.map((slot) => ({ ...slot }));
          });
          return {
            ...s,
            weekly_hours: updatedWeeklyHours,
          };
        }
        return s;
      }),
    );

    toast.success(
      t("slotsCopiedLocalSuccess") ||
        "تم تطبيق الفترات المنسوخة. اضغط على حفظ التغييرات لاعتمادها",
    );
    setCopyState((prev) => ({ ...prev, isOpen: false, saving: false }));
  };
=======
  // Copy slots to other days state
  const [copyDropdownDay, setCopyDropdownDay] = useState(null);
  const [copyTargetDays, setCopyTargetDays] = useState([]);
  const copyDropdownRef = useRef(null);
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828

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
          "حفظ الجدول منجحش",
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
      t("confirmDeleteSchedule") || "هل أنت متأكد من رغبتك في حذف هذا الجدول؟";
    if (!window.confirm(confirmMsg)) return;

    try {
      await client.delete(endpoints.workspaceScheduleItem(activeSchedule.id));
      toast.success(t("scheduleDeletedSuccess") || "تم حذف الجدول بنجاح");
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      toast.error(err.response?.data?.message || "حذف الجدول منجحش");
    }
  };

  // Weekly Hours Multi-slot Handlers
  const handleToggleDay = (dayKey) => {
    if (!allowUpdate || !activeSchedule) return;
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
    if (!allowUpdate || !activeSchedule) return;
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
    if (!allowUpdate || !activeSchedule) return;
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
    if (!allowUpdate || !activeSchedule) return;
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

  // Copy day times to other days – click-outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        copyDropdownRef.current &&
        !copyDropdownRef.current.contains(e.target)
      ) {
        setCopyDropdownDay(null);
        setCopyTargetDays([]);
      }
    };
    if (copyDropdownDay !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [copyDropdownDay]);

  const handleToggleCopyTarget = (dayKey) => {
    setCopyTargetDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((k) => k !== dayKey)
        : [...prev, dayKey],
    );
  };

  const handleApplyCopySlots = (fromDayKey) => {
    if (copyTargetDays.length === 0) return;
    const sourceSlots = activeSchedule?.weekly_hours?.[fromDayKey] || [];
    setSchedulesList((prev) =>
      prev.map((s) => {
        if (s.id === selectedScheduleId) {
          const newWeeklyHours = { ...(s.weekly_hours || {}) };
          copyTargetDays.forEach((targetDay) => {
            newWeeklyHours[targetDay] = sourceSlots.map((slot) => ({
              ...slot,
            }));
          });
          return { ...s, weekly_hours: newWeeklyHours };
        }
        return s;
      }),
    );
    setCopyDropdownDay(null);
    setCopyTargetDays([]);
    toast.success(t("slotsCopiedSuccess") || "تم نسخ الأوقات بنجاح");
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
        err.response?.data?.message || "حفظ ساعات العمل الأسبوعية منجحش",
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
      toast.error(err.response?.data?.message || "حفظ فترة الصلاحية منجحش");
    } finally {
      setSavingValidity(false);
    }
  };

  // Exceptions Handlers
  const handleAddException = async (e) => {
    e.preventDefault();
    if (!activeSchedule) return;
    if (!exceptionForm.date) {
      toast.error(t("selectDateError") || "من فضلك اختار التاريخ الأول");
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
    if (!allowDelete || !activeSchedule) return;
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
      toast.error(err.response?.data?.message || "حذف الاستثناء منجحش");
    }
  };

  return (
    <div
      className="card-body"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
<<<<<<< HEAD
      {/* 1. Standard Workspace Header & Stats */}
      <WorkspacePageHeader
        title={
          t("workspaceSchedules") ||
          (lang === "ar" ? "جداول وساعات العمل" : "Schedules & Availability")
        }
        subtitle={
          t("workspaceSchedulesDesc") ||
          (lang === "ar"
            ? "ضبط أوقات وأيام العمل الفعالة لكل أسبوع، فترات الصلاحية، والاستثناءات المخصصة."
            : "Set weekly working hours, validity windows, holiday exceptions, and break periods.")
        }
        icon="clock"
        actions={
          canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
=======
      {/* 1. Header Toolbar & Schedule Switcher Bar */}
      <div className="schedules-tab-header">
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
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                fontWeight: 700,
                borderRadius: "var(--radius-md, 10px)",
                boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
              }}
            >
<<<<<<< HEAD
              <Icon name="plus" size={18} />
              <span>
                {t("newScheduleBtn") ||
                  (lang === "ar" ? "إنشاء جدول جديد" : "New Schedule")}
              </span>
            </button>
          )
        }
        stats={[
          {
            id: "total_schedules",
            label: lang === "ar" ? "إجمالي الجداول" : "Total Schedules",
            value: schedulesList.length,
            icon: "clock",
            iconBg: "rgba(2, 105, 130, 0.12)",
            iconColor: "var(--primary)",
          },
          {
            id: "workspace_schedules",
            label: lang === "ar" ? "جداول المساحة العامة" : "Workspace Scope",
            value: schedulesList.filter(
              (s) => !s.workspace_member_id && s.scope !== "member",
            ).length,
            valueColor: "#10b981",
            icon: "grid",
            iconBg: "rgba(16, 185, 129, 0.12)",
            iconColor: "#10b981",
          },
          {
            id: "member_schedules",
            label: lang === "ar" ? "جداول الأعضاء المخصصة" : "Member Schedules",
            value: schedulesList.filter(
              (s) => s.workspace_member_id || s.scope === "member",
            ).length,
            valueColor: "#6366f1",
            icon: "users",
            iconBg: "rgba(99, 102, 241, 0.12)",
            iconColor: "#6366f1",
          },
        ]}
      />
=======
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

        {allowCreate && (
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
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828

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
          {allowCreate && (
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
            {/* Desktop / Tablet: Horizontal pill tabs with smooth scrolling & navigation arrows (hidden on mobile) */}
            <div className="schedule-desktop-tabs-wrapper">
              {hasTabsOverflow && (
                <button
                  type="button"
                  className="schedule-tabs-arrow-btn"
                  onClick={() => scrollTabs("prev")}
                  aria-label={lang === "ar" ? "تمرير لليمين" : "Scroll right"}
                  title={lang === "ar" ? "السابق" : "Previous"}
                >
                  <Icon
                    name={lang === "ar" ? "chevron-right" : "chevron-left"}
                    size={16}
                  />
                </button>
              )}

              <div
                ref={tabsContainerRef}
                className="schedule-desktop-tabs"
                onScroll={checkTabsOverflow}
              >
                {schedulesList.map((sch) => {
                  const isSelected = sch.id === selectedScheduleId;
                  const memberName =
                    members.find(
                      (m) => String(m.id) === String(sch.workspace_member_id),
                    )?.name ||
                    members.find(
                      (m) => String(m.id) === String(sch.workspace_member_id),
                    )?.user?.name ||
                    sch.workspace_member?.name ||
                    sch.workspace_member?.user?.name ||
                    (sch.workspace_member_id
                      ? t("memberSchedule") || "عضو"
                      : null);

                  return (
                    <button
                      key={sch.id}
                      ref={isSelected ? activeTabRef : null}
                      type="button"
                      className={`schedule-tab-btn ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedScheduleId(sch.id)}
                    >
                      <span
                        style={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sch.name}
                      </span>
                      {memberName && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            background: isSelected
                              ? "var(--surface)"
                              : "var(--surface-alt)",
                            color: isSelected
                              ? "var(--primary)"
                              : "var(--text-secondary)",
                            border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {memberName}
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
                            flexShrink: 0,
                          }}
                        >
                          {t("defaultBadge") || "افتراضي"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasTabsOverflow && (
                <button
                  type="button"
                  className="schedule-tabs-arrow-btn"
                  onClick={() => scrollTabs("next")}
                  aria-label={lang === "ar" ? "تمرير لليسار" : "Scroll left"}
                  title={lang === "ar" ? "التالي" : "Next"}
                >
                  <Icon
                    name={lang === "ar" ? "chevron-left" : "chevron-right"}
                    size={16}
                  />
                </button>
              )}
            </div>

            {/* Mobile: Clean, touch-friendly select dropdown & metadata row (hidden on desktop) */}
            <div className="schedule-mobile-picker">
              <div className="schedule-mobile-select-row">
                <select
                  className="form-select schedule-mobile-select"
                  value={selectedScheduleId || ""}
                  onChange={(e) =>
                    setSelectedScheduleId(Number(e.target.value))
                  }
                >
                  {schedulesList.map((sch) => {
                    const memberName =
                      members.find(
                        (m) => String(m.id) === String(sch.workspace_member_id),
                      )?.name ||
                      members.find(
                        (m) => String(m.id) === String(sch.workspace_member_id),
                      )?.user?.name ||
                      sch.workspace_member?.name ||
                      sch.workspace_member?.user?.name ||
                      (sch.workspace_member_id
                        ? t("memberSchedule") || "عضو"
                        : null);

                    const defaultText = sch.is_default
                      ? ` [${t("defaultBadge") || "افتراضي"}]`
                      : "";
                    const memberText = memberName ? ` (${memberName})` : "";
                    return (
                      <option key={sch.id} value={sch.id}>
                        {sch.name}
                        {defaultText}
                        {memberText}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="schedule-mobile-meta-row">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {activeSchedule?.is_default && (
                    <span
                      style={{
                        fontSize: "0.74rem",
                        background: "var(--primary)",
                        color: "#ffffff",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontWeight: 700,
                      }}
                    >
                      {t("defaultBadge") || "افتراضي"}
                    </span>
                  )}
                  {(() => {
                    const activeMemberName =
                      members.find(
                        (m) =>
                          String(m.id) ===
                          String(activeSchedule?.workspace_member_id),
                      )?.name ||
                      members.find(
                        (m) =>
                          String(m.id) ===
                          String(activeSchedule?.workspace_member_id),
                      )?.user?.name ||
                      activeSchedule?.workspace_member?.name ||
                      activeSchedule?.workspace_member?.user?.name;
                    return activeMemberName ? (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          background: "var(--surface-alt)",
                          color: "var(--primary)",
                          border: "1px solid var(--border)",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {activeMemberName}
                      </span>
                    ) : null;
                  })()}
                </div>

                {activeSchedule && (allowUpdate || allowDelete) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {allowUpdate && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={handleOpenEditModal}
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="edit" size={13} />
                        {t("editScheduleNameBtn") || "تعديل"}
                      </button>
                    )}
                    {allowDelete && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={handleDeleteSchedule}
                        disabled={activeSchedule.is_default}
                        style={{
                          fontSize: "0.82rem",
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
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop / Tablet Actions */}
            {activeSchedule && (allowUpdate || allowDelete) && (
              <div className="schedule-top-bar-actions schedule-desktop-actions">
                {allowUpdate && (
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
                )}
                {allowDelete && (
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
                )}
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
                          disabled={!allowUpdate}
                          style={{
                            accentColor: "var(--primary)",
                            width: 18,
                            height: 18,
                            cursor: allowUpdate ? "pointer" : "default",
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
                                disabled={!allowUpdate}
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
                                disabled={!allowUpdate}
                              />

                              {allowUpdate && (
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

<<<<<<< HEAD
                      {/* Action: Copy Slots & Add Slot */}
                      {canEdit && isDayEnabled && (
                        <div className="schedule-day-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm schedule-copy-btn"
                            onClick={(e) =>
                              handleOpenCopyModal(d.key, d.label, e)
                            }
                            title={t("copySlotsToDays") || "نسخ للأيام الأخرى"}
                            aria-label={
                              t("copySlotsToDays") || "نسخ للأيام الأخرى"
                            }
                          >
                            <Icon name="copy" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm schedule-add-slot-btn"
=======
                      {/* Actions: Add Slot & Copy to Days */}
                      {allowUpdate && isDayEnabled && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828
                            onClick={() => handleAddSlot(d.key)}
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--primary)",
                              fontWeight: 700,
                            }}
                          >
                            {t("addTimeSlotBtn") || "+ إضافة فترة"}
                          </button>
<<<<<<< HEAD
=======
                          <div
                            style={{ position: "relative" }}
                            ref={
                              copyDropdownDay === d.key ? copyDropdownRef : null
                            }
                          >
                            <button
                              type="button"
                              className="btn-copy-slots-trigger"
                              onClick={() => {
                                if (copyDropdownDay === d.key) {
                                  setCopyDropdownDay(null);
                                  setCopyTargetDays([]);
                                } else {
                                  setCopyDropdownDay(d.key);
                                  setCopyTargetDays([]);
                                }
                              }}
                              title={
                                t("copySlotsToDays") || "نسخ للأيام الأخرى"
                              }
                            >
                              <Icon name="copy" size={15} />
                            </button>
                            {copyDropdownDay === d.key && (
                              <div className="copy-slots-dropdown">
                                <div className="copy-slots-dropdown-header">
                                  {t("copySlotsToDays") || "نسخ للأيام الأخرى"}
                                </div>
                                <div className="copy-slots-dropdown-list">
                                  {daysList
                                    .filter((dd) => dd.key !== d.key)
                                    .map((dd) => (
                                      <label
                                        key={dd.key}
                                        className="copy-slots-dropdown-item"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={copyTargetDays.includes(
                                            dd.key,
                                          )}
                                          onChange={() =>
                                            handleToggleCopyTarget(dd.key)
                                          }
                                          style={{
                                            accentColor: "var(--primary)",
                                            width: 16,
                                            height: 16,
                                            cursor: "pointer",
                                          }}
                                        />
                                        <span>{dd.label}</span>
                                      </label>
                                    ))}
                                </div>
                                <div className="copy-slots-dropdown-actions">
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleApplyCopySlots(d.key)}
                                    disabled={copyTargetDays.length === 0}
                                    style={{
                                      fontSize: "0.78rem",
                                      fontWeight: 700,
                                      padding: "6px 16px",
                                    }}
                                  >
                                    {t("applyCopyBtn") || "تطبيق"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {allowUpdate && (
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
            className="card schedule-sub-card"
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
              className="schedule-validity-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
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
                  disabled={!allowUpdate}
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
                  disabled={!allowUpdate}
                />
              </div>
            </div>

            {allowUpdate && (
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
            className="card schedule-sub-card"
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
            {allowUpdate && (
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
                  <div
                    className="schedule-exception-time-row"
                    style={{ display: "flex", gap: 12, marginBottom: 14 }}
                  >
                    <div
                      className="form-group"
                      style={{ flex: 1, minWidth: 0 }}
                    >
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

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginTop: 8,
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 18px",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      width: "auto",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="plus" size={14} />
                    <span>
                      {(t("addExceptionBtn") || "إضافة").replace(/^\+\s*/, "")}
                    </span>
                  </button>
                </div>
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
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Icon
                            name="calendar"
                            size={15}
                            style={{ color: "var(--primary)", flexShrink: 0 }}
                          />
                          <span>{ex.date}</span>
                        </span>
                        <span
                          className={`profile-badge ${ex.type === "closed" ? "unverified" : "verified"}`}
                          style={{
                            fontSize: "0.74rem",
                            padding: "2px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Icon
                            name={ex.type === "closed" ? "x-circle" : "clock"}
                            size={12}
                            style={{ flexShrink: 0 }}
                          />
                          <span>
                            {ex.type === "closed"
                              ? t("typeClosedDay") || "يوم مقفول"
                              : t("typeCustomHours") || "ساعات مخصصة"}
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {ex.reason && <span>{ex.reason}</span>}
                        {ex.type === "custom" && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              direction: "ltr",
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            <Icon
                              name="clock"
                              size={12}
                              style={{ flexShrink: 0 }}
                            />
                            <span>
                              {ex.from_time} – {ex.to_time}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {allowDelete && (
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

      {/* 7. MODAL / POPOVER: Copy Schedule Slots to other days */}
      {copyState.isOpen &&
        copyState.fromDayKey !== null &&
        copyState.fromDayKey !== undefined &&
        createPortal(
          <div className="schedule-copy-portal">
            <div
              className="schedule-copy-backdrop"
              onClick={() => {
                if (!copyState.saving) {
                  setCopyState((prev) => ({ ...prev, isOpen: false }));
                }
              }}
            />
            <div
              className="schedule-copy-popover"
              style={getPopoverPosition()}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popover Header */}
              <div className="schedule-copy-header">
                <div className="schedule-copy-title-box">
                  <Icon name="copy" size={16} className="schedule-copy-icon" />
                  <h4 className="schedule-copy-title">
                    {t("copyTimesTo") || "نسخ الفترات إلى"}
                  </h4>
                </div>
                <button
                  type="button"
                  className="schedule-copy-close-btn"
                  onClick={() => {
                    if (!copyState.saving) {
                      setCopyState((prev) => ({ ...prev, isOpen: false }));
                    }
                  }}
                  disabled={copyState.saving}
                  aria-label={t("close") || "إغلاق"}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              {/* Source Day Info with Slots Chips */}
              <div className="schedule-copy-source-info">
                <div className="schedule-copy-source-label">
                  <span>{t("copySlotsFrom") || "نسخ مواعيد:"}</span>
                  <strong>{copyState.fromDayLabel}</strong>
                </div>
                <div className="schedule-copy-source-slots">
                  {(
                    activeSchedule?.weekly_hours?.[copyState.fromDayKey] || []
                  ).map((s, idx) => (
                    <span key={idx} className="schedule-copy-slot-chip">
                      {s.from} – {s.to}
                    </span>
                  ))}
                </div>
              </div>

              {/* Toolbar: Counter & Toggle All */}
              {(() => {
                const otherDays = daysList.filter(
                  (d) => d && d.key !== copyState.fromDayKey,
                );
                const eligibleDayKeys = otherDays.map((d) => d.key);
                const allSelected =
                  copyState.targetDays.length === eligibleDayKeys.length;

                return (
                  <>
                    <div className="schedule-copy-toolbar">
                      <span className="schedule-copy-selected-count">
                        {copyState.targetDays.length} / {otherDays.length}{" "}
                        {t("selected") || "محدد"}
                      </span>
                      <button
                        type="button"
                        className="schedule-copy-toggle-all"
                        onClick={() =>
                          handleToggleAllTargetDays(eligibleDayKeys)
                        }
                        disabled={copyState.saving}
                      >
                        {allSelected
                          ? t("deselectAll") || "إلغاء تحديد الكل"
                          : t("selectAll") || "تحديد الكل"}
                      </button>
                    </div>

                    {/* Target Days Checkbox List */}
                    <div className="schedule-copy-days-list custom-scrollbar">
                      {otherDays.map((targetDay) => {
                        const isChecked = copyState.targetDays.includes(
                          targetDay.key,
                        );
                        const currentTargetSlots =
                          activeSchedule?.weekly_hours?.[targetDay.key] || [];

                        return (
                          <label
                            key={targetDay.key}
                            className={`schedule-copy-day-item ${
                              isChecked ? "is-checked" : ""
                            }`}
                          >
                            <div className="schedule-copy-day-content">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  handleToggleTargetDay(targetDay.key)
                                }
                                disabled={copyState.saving}
                                className="schedule-copy-checkbox"
                              />
                              <span className="schedule-copy-day-name">
                                {targetDay.label}
                              </span>
                            </div>
                            {currentTargetSlots.length > 0 ? (
                              <span className="schedule-copy-slots-badge">
                                {currentTargetSlots.length}{" "}
                                {currentTargetSlots.length === 1
                                  ? t("slotCountSingular") || "فترة"
                                  : t("slotCountPlural") || "فترات"}
                              </span>
                            ) : (
                              <span className="schedule-copy-slots-badge is-empty">
                                {t("unavailableClosed") || "مغلق"}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Popover Footer */}
              <div className="schedule-copy-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setCopyState((prev) => ({ ...prev, isOpen: false }))
                  }
                  disabled={copyState.saving}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyCopySlots}
                  disabled={
                    copyState.saving || copyState.targetDays.length === 0
                  }
                  style={{ gap: 6, fontWeight: 700 }}
                >
                  {copyState.saving ? (
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
                      {t("apply") || "تطبيق"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
