import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import client, { endpoints } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SEO from '../../components/ui/SEO';
import LazyImage from '../../components/ui/LazyImage';
import { BookingFormSkeleton } from '../../components/ui/Skeleton';
import Icon from '../../components/common/Icon';
import { formatCurrency } from '../../utils/currency';


const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CustomerBookAppointmentPage() {
  const { idOrSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();

  const preselectedServiceId = searchParams.get('service') || searchParams.get('service_id');

  const [workspace, setWorkspace] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [disabledNotice, setDisabledNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const getTranslatableText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isRTL ? (val.ar || val.en || Object.values(val)[0] || '') : (val.en || val.ar || Object.values(val)[0] || '');
    }
    return String(val);
  };

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Slots & Form State
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  
  // Wizard Step State (1: Service, 2: Date & Slot, 3: Details & Questions)
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedService) {
        toast.error(isRTL ? 'يرجى اختيار الخدمة أولاً للمتابعة' : 'Please select a service first to proceed');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDate || !selectedSlot) {
        toast.error(isRTL ? 'يرجى تحديد اليوم والوقت المتاح للمتابعة' : 'Please select date and slot to proceed');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Dynamic form field answers (field_statuses & booking_questions)
  const [formFields, setFormFields] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    consultation_subject: '',
    attendee_count: 1,
    preferred_contact_method: 'phone',
    payment_proof: null,
    upload_receipt: null,
    payment_notes: '',
    transaction_number: '',
    bank_name: '',
    card_last4: '',
  });

  const [questionAnswers, setQuestionAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Require authentication before accessing booking page
  useEffect(() => {
    if (!user) {
      toast.warning(
        isRTL
          ? 'يرجى تسجيل الدخول أولاً لمتابعة حجز الموعد'
          : 'Please sign in first to book an appointment'
      );
      navigate('/customer/login', { replace: true, state: { from: location } });
    }
  }, [user, navigate, isRTL, location, toast]);

  // Fetch workspace details & services
  useEffect(() => {
    if (!user || !idOrSlug) return;
    setLoading(true);
    Promise.all([
      client.get(endpoints.publicWorkspaceDetail(idOrSlug)),
      client.get(endpoints.publicWorkspaceServices(idOrSlug)),
    ])
      .then(([wsRes, srvRes]) => {
        const wsData = wsRes.data.data;
        const srvData = srvRes.data.data || [];
        const bookableServices = srvData.filter((s) => s.status === 'active' && s.booking_enabled === true);
        setWorkspace(wsData);
        setServices(bookableServices);

        if (wsData?.name) {
          document.title = `${wsData.name} — ${isRTL ? 'حجز موعد جديد' : 'Book Appointment'}`;
        }

        if (preselectedServiceId) {
          const match = bookableServices.find((s) => String(s.slug) === String(preselectedServiceId) || String(s.id) === String(preselectedServiceId));
          if (match) {
            setSelectedService(match);
            setDisabledNotice('');
          } else {
            setSelectedService(null);
            setDisabledNotice(isRTL ? 'عذراً، الخدمة المطلوبة غير متاحة للحجز أونلاين حالياً. يرجى اختيار إحدى الخدمات المتاحة أدناه.' : 'Sorry, the requested service is currently not available for online booking. Please select an available service below.');
          }
        } else if (bookableServices.length > 0) {
          setSelectedService(bookableServices[0]);
          setDisabledNotice('');
        } else {
          setSelectedService(null);
          setDisabledNotice('');
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user, idOrSlug, preselectedServiceId, isRTL]);

  // Fetch available slots when service or date changes
  useEffect(() => {
    if (!user || !selectedService || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot('');
    client
      .get(endpoints.publicWorkspaceSlots(idOrSlug, selectedService.id), {
        params: { date: selectedDate },
      })
      .then((res) => {
        setSlots(res.data.data || []);
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlots([]);
        setSlotsLoading(false);
      });
  }, [user, idOrSlug, selectedService, selectedDate]);

  // Calendar generation helpers
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDays = lastDay.getDate();

    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const maxDays = workspace?.maximum_booking_days || 60;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDays);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      // Format local YYYY-MM-DD
      const dateStr = [
        dateObj.getFullYear(),
        String(dateObj.getMonth() + 1).padStart(2, '0'),
        String(dateObj.getDate()).padStart(2, '0'),
      ].join('-');

      const isPast = dateStr < todayStr;
      const isTooFar = dateStr > maxDateStr;
      const isAvailable = !isPast && !isTooFar;

      days.push({
        day,
        dateStr,
        isAvailable,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentMonth, workspace]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleQuestionAnswerChange = (qId, label, val) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [qId]: {
        booking_question_id: qId,
        question_label: label,
        answer: val,
      },
    }));
  };

  // Submit appointment handler
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning(
        isRTL ? 'يرجى تسجيل الدخول كعميل لتأكيد حجز الموعد' : 'Please sign in as customer to complete booking'
      );
      navigate('/customer/login');
      return;
    }

    if (!selectedService || !selectedDate || !selectedSlot) {
      toast.error(
        isRTL ? 'يرجى تحديد الخدمة والتاريخ والوقت' : 'Please select service, date, and slot'
      );
      return;
    }

    // Validate active booking questions requirement
    const activeQuestions = (workspace?.booking_questions || []).filter(
      (q) => !q.service_id || q.service_id === selectedService.id
    );

    for (const q of activeQuestions) {
      if (q.is_required && (!questionAnswers[q.id] || !questionAnswers[q.id].answer)) {
        toast.error(
          isRTL ? `يرجى إجابة السؤال المطلوب: "${q.label}"` : `Please answer required question: "${q.label}"`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const slotTime = typeof selectedSlot === 'string' ? selectedSlot : selectedSlot.start_time || selectedSlot.time;
      const startsAt = `${selectedDate} ${slotTime}:00`;

      const answersArray = Object.values(questionAnswers);

      let paymentProof = null;
      const proofInput = formFields.payment_proof || formFields.upload_receipt;
      if (proofInput instanceof File) {
        paymentProof = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(proofInput);
        });
      } else if (typeof proofInput === 'string') {
        paymentProof = proofInput;
      }

      const receiptMode = workspace?.payment_receipt_mode || 'required';
      if (receiptMode === 'required' && parseFloat(selectedService?.price || 0) > 0 && !paymentProof) {
        toast.error(
          isRTL ? 'يرجى رفع إيصال التحويل لإتمام الحجز' : 'Please upload payment receipt to complete booking'
        );
        setSubmitting(false);
        return;
      }

      const serviceCurrency = selectedService?.currency_detail || selectedService?.currency || workspace?.currency_detail || workspace?.currency;
      const currencyCode = typeof serviceCurrency === 'string' ? serviceCurrency : (serviceCurrency?.code || serviceCurrency?.symbol || 'SAR');
      const currencyId = typeof serviceCurrency === 'object' ? serviceCurrency?.id : (selectedService?.currency_id || workspace?.currency_id || undefined);

      const payload = {
        workspace_id: workspace.id,
        service_id: selectedService.id,
        starts_at: startsAt,
        notes: formFields.notes || null,
        currency: currencyCode,
        currency_code: currencyCode,
        currency_id: currencyId,
        payment_proof: paymentProof || undefined,
        answers: answersArray.length > 0 ? answersArray : undefined,
        metadata: {
          consultation_subject: formFields.consultation_subject || undefined,
          attendee_count: formFields.attendee_count || undefined,
          preferred_contact_method: formFields.preferred_contact_method || undefined,
          payment_proof: paymentProof || undefined,
          payment_notes: formFields.payment_notes || undefined,
          transaction_number: formFields.transaction_number || undefined,
          bank_name: formFields.bank_name || undefined,
          card_last4: formFields.card_last4 || undefined,
          currency: currencyCode,
          currency_id: currencyId,
        },
      };

      await client.post('/customers/appointments', payload);

      toast.success(isRTL ? 'تم حجز الموعد بنجاح!' : 'Appointment booked successfully!');
      navigate('/customer/profile');
    } catch (err) {
      console.error('Booking failed:', err);
      const serverMsg = err.response?.data?.message;
      let userMsg = isRTL ? 'فشل حجز الموعد، حاول مرة أخرى' : 'Failed to book appointment';

      if (serverMsg) {
        if (serverMsg.includes('Attempt to read property') || serverMsg.includes('symbol') || serverMsg.includes('null')) {
          userMsg = isRTL
            ? 'تعذر إكمال الحجز بسبب عدم ضبط عملة الخدمة في مساحة العمل'
            : 'Unable to complete booking due to unconfigured service currency in workspace.';
        } else {
          userMsg = serverMsg;
        }
      }
      toast.error(userMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <main className="main-content">
        <SEO
          title={isRTL ? 'حجز موعد جديد' : 'Book Appointment'}
          noindex
        />
        <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', height: 140 }} />
        <BookingFormSkeleton />
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="main-content">
        <SEO title={isRTL ? 'مساحة العمل غير موجودة' : 'Workspace Not Found'} noindex />
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="card" style={{ padding: 48, maxWidth: 500, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 12 }}>{t('noWorkspacesFound')}</h1>
            <Link to="/workspaces" className="btn btn-primary">
              {t('exploreWorkspaces')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const primaryColor = workspace.primary_color || 'var(--primary)';
  const secondaryColor = workspace.secondary_color || 'var(--secondary)';
  const hoverColor = workspace.hover_color || primaryColor;

  const fieldStatuses = workspace.field_statuses || {};
  const activeQuestions = (workspace.booking_questions || []).filter(
    (q) => !q.service_id || q.service_id === selectedService?.id
  );

  const monthNamesAr = MONTH_NAMES_AR;
  const monthNamesEn = MONTH_NAMES_EN;
  const weekDaysAr = WEEK_DAYS_AR;
  const weekDaysEn = WEEK_DAYS_EN;

  const currentMonthLabel = isRTL
    ? `${monthNamesAr[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
    : `${monthNamesEn[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <main
      className="main-content"
      style={{
        background: 'var(--background-alt, #f8fafc)',
        minHeight: 'calc(100vh - 70px)',
        paddingBottom: 60,
        '--primary': primaryColor,
        '--primary-hover': hoverColor,
        '--secondary': secondaryColor,
      }}
    >
      <SEO
        title={isRTL ? `حجز موعد في ${workspace.name}` : `Book Appointment at ${workspace.name}`}
        description={workspace.booking_short_intro || (isRTL ? 'احجز موعدك بسهولة' : 'Book your appointment easily')}
        noindex
        canonical={`/workspaces/${workspace.slug}/book`}
      />
      {/* Header Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          color: '#ffffff',
          padding: '40px 0 60px',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <Link
              to={`/workspaces/${workspace.slug}`}
              style={{
                color: 'rgba(255,255,255,0.9)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.9rem',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.15)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full, 9999px)',
              }}
            >
              <Icon name="arrow-left" size={14} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              <span>{isRTL ? 'العودة إلى مساحة العمل' : 'Back to Workspace'}</span>
            </Link>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)' }}>
            {isRTL ? `حجز موعد في ${workspace.name}` : `Book Appointment at ${workspace.name}`}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginTop: 8, fontSize: '1.05rem', maxWidth: 650, textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
            {workspace.booking_short_intro || (isRTL ? 'اختر الخدمة واليوم والوقت المناسب لحجز موعدك بسهولة.' : 'Select service, date, and preferred time to schedule your appointment.')}
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: -30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
          
          {/* Main Booking Form Panel */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card" style={{ padding: 28, borderRadius: 'var(--radius-lg)' }}>
              <form onSubmit={handleSubmitBooking}>
                
                {/* Visual Step Progress Bar Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
                  {[
                    { step: 1, title: isRTL ? 'الخدمة' : 'Service' },
                    { step: 2, title: isRTL ? 'اليوم والوقت' : 'Date & Time' },
                    { step: 3, title: isRTL ? 'تفاصيل الحجز' : 'Details & Questions' },
                  ].map((s, i) => {
                    const isActive = currentStep === s.step;
                    const isPassed = currentStep > s.step;
                    return (
                      <div
                        key={s.step}
                        onClick={() => {
                          if (isPassed) setCurrentStep(s.step);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          cursor: isPassed ? 'pointer' : 'default',
                          opacity: isActive || isPassed ? 1 : 0.45,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isActive || isPassed ? primaryColor : 'var(--muted)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            boxShadow: isActive ? `0 0 0 4px ${primaryColor}22` : 'none',
                          }}
                        >
                          {isPassed ? '✓' : s.step}
                        </div>
                        <span style={{ fontSize: '0.92rem', fontWeight: isActive ? 700 : 600, color: isActive ? primaryColor : 'var(--text)' }}>
                          {s.title}
                        </span>
                        {i < 2 && <div style={{ width: 30, height: 2, background: isPassed ? primaryColor : 'var(--border)', marginInlineStart: 6 }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Step 1 Panel: Select Service */}
                {currentStep === 1 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
                      1. {isRTL ? 'اختر الخدمة المطلوبة' : 'Select Service'}
                    </h3>
                    
                    {disabledNotice && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon name="alert-triangle" size={20} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.88rem', color: '#dc2626', fontWeight: 600 }}>{disabledNotice}</span>
                      </div>
                    )}
                    
                    {services.length === 0 ? (
                      <p style={{ color: 'var(--muted)' }}>{t('noServicesFound')}</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                        {services.map((srv) => {
                          const active = selectedService?.id === srv.id;
                          return (
                            <div
                              key={srv.id}
                              onClick={() => setSelectedService(srv)}
                              style={{
                                padding: 18,
                                borderRadius: 'var(--radius-md)',
                                border: active ? `2px solid ${primaryColor}` : '1px solid var(--border)',
                                background: active ? 'var(--primary-subtle, rgba(232, 141, 34, 0.06))' : 'var(--surface)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: active ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>{getTranslatableText(srv.name)}</strong>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: primaryColor }}>
                                  {formatCurrency(srv.price, srv.currency_detail || srv.currency, isRTL, t('freeService'))}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', gap: 14, alignItems: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Icon name="clock" size={14} />
                                  <span>{srv.duration_minutes} {t('durationMinutes')}</span>
                                </span>
                                {srv.location && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Icon name="map-pin" size={14} />
                                    <span>{srv.location}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 Panel: Date & Available Time Slot Selection */}
                {currentStep === 2 && selectedService && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
                      2. {isRTL ? 'اختر اليوم والوقت المتاح' : 'Select Date & Available Time Slot'}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                      
                      {/* Interactive Calendar Widget */}
                      <div style={{ background: 'var(--surface-alt)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <button type="button" onClick={handlePrevMonth} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                            {isRTL ? '▶' : '◀'}
                          </button>
                          <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>{currentMonthLabel}</strong>
                          <button type="button" onClick={handleNextMonth} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                            {isRTL ? '◀' : '▶'}
                          </button>
                        </div>

                        {/* Calendar Header Weekdays */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {(isRTL ? weekDaysAr : weekDaysEn).map((wd, i) => (
                            <div key={i}>{wd}</div>
                          ))}
                        </div>

                        {/* Calendar Days Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                          {calendarDays.map((item, idx) => {
                            if (!item) return <div key={idx} />;
                            const isSelected = selectedDate === item.dateStr;
                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={!item.isAvailable}
                                onClick={() => setSelectedDate(item.dateStr)}
                                style={{
                                  height: 38,
                                  border: isSelected ? `2px solid ${primaryColor}` : '1px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  background: isSelected
                                    ? primaryColor
                                    : item.isAvailable
                                    ? 'var(--surface)'
                                    : 'transparent',
                                  color: isSelected
                                    ? '#ffffff'
                                    : item.isAvailable
                                    ? 'var(--text)'
                                    : 'var(--muted)',
                                  fontWeight: isSelected ? 700 : 500,
                                  fontSize: '0.85rem',
                                  cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                                  opacity: item.isAvailable ? 1 : 0.45,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {item.day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slots Selector Panel */}
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                          {isRTL ? `الأوقات المتاحة ليوم: ${selectedDate}` : `Available Slots for: ${selectedDate}`}
                        </div>

                        {slotsLoading ? (
                          <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <div className="spinner spinner-sm" style={{ margin: '0 auto 8px' }} />
                            <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{t('loading')}</span>
                          </div>
                        ) : (() => {
                          const availableSlots = slots.filter((slot) => {
                            if (typeof slot === 'object' && slot.is_available === false) return false;
                            return true;
                          });

                          if (availableSlots.length === 0) {
                            return (
                              <div style={{ padding: 20, textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', color: 'var(--muted)', fontSize: '0.88rem' }}>
                                {isRTL ? 'عذراً، لا تتوفر أوقات متاحة في هذا اليوم.' : 'No slots available on this date.'}
                              </div>
                            );
                          }

                          // Convert 24-hour HH:mm to 12-hour AM/PM format
                          const formatTime12h = (time24) => {
                            if (!time24) return '';
                            const [hStr, mStr] = time24.split(':');
                            let h = parseInt(hStr, 10);
                            const m = mStr || '00';
                            const period = isRTL ? (h >= 12 ? 'م' : 'ص') : (h >= 12 ? 'PM' : 'AM');
                            h = h % 12 || 12;
                            return `${h}:${m} ${period}`;
                          };

                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, maxHeight: 260, overflowY: 'auto', padding: 2 }}>
                              {availableSlots.map((slot, idx) => {
                                const rawTime = typeof slot === 'string' ? slot : slot.start_time || slot.time;
                                const formattedTime = formatTime12h(rawTime);
                                const isSelected = selectedSlot === rawTime;

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedSlot(rawTime)}
                                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                    style={{
                                      borderRadius: 'var(--radius-md)',
                                      justifyContent: 'center',
                                      fontWeight: isSelected ? 700 : 600,
                                      padding: '8px 12px',
                                      fontSize: '0.88rem',
                                    }}
                                  >
                                    {formattedTime}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                  </div>
                )}

                {/* Step 3 Panel: Booking Form & Workspace Custom Questions */}
                {currentStep === 3 && selectedService && selectedSlot && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
                      3. {isRTL ? 'بيانات الحجز وأسئلة مساحة العمل' : 'Booking Information & Questions'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      
                      {/* Fully Dynamic Form Fields from Workspace API field_statuses */}
                      {(() => {
                        const FIELD_LABELS = {
                          full_name: { ar: 'الاسم الكامل', en: 'Full Name', placeholderAr: 'أدخل اسمك الكامل', placeholderEn: 'Enter full name', type: 'text', defaultValue: user?.name || '' },
                          email: { ar: 'البريد الإلكتروني', en: 'Email Address', placeholderAr: 'name@example.com', placeholderEn: 'name@example.com', type: 'email', defaultValue: user?.email || '' },
                          phone: { ar: 'رقم الهاتف', en: 'Phone Number', placeholderAr: '+9665...', placeholderEn: '+9665...', type: 'text', defaultValue: user?.phone || '' },
                          consultation_subject: { ar: 'موضوع الجلسة / الاستشارة', en: 'Consultation Subject', placeholderAr: 'مثال: استشارة تقنية / استفسار أولي', placeholderEn: 'e.g., General Consultation', type: 'text' },
                          attendee_count: { ar: 'عدد الحضور / الأشخاص', en: 'Attendee Count', placeholderAr: '1', placeholderEn: '1', type: 'number' },
                          preferred_contact_method: { ar: 'وسيلة التواصل المفضلة', en: 'Preferred Contact Method', type: 'select' },
                          payment_proof: { ar: 'إثبات الدفع / الإيصال', en: 'Upload Payment Proof', type: 'file' },
                          upload_receipt: { ar: 'إثبات الدفع / الإيصال', en: 'Upload Payment Proof', type: 'file' },
                          payment_notes: { ar: 'ملاحظات الدفع / التحويل', en: 'Payment Notes', placeholderAr: 'أدخل أي ملاحظات خاصة بالتحويل...', placeholderEn: 'Enter payment notes...', type: 'textarea' },
                          transaction_number: { ar: 'رقم العملية / الحوالة', en: 'Transaction Number', placeholderAr: 'مثال: TRX-998811', placeholderEn: 'e.g., TRX-998811', type: 'text' },
                          bank_name: { ar: 'اسم البنك المحول منه', en: 'Bank Name', placeholderAr: 'مثال: البنك الأهلي / الراجحي', placeholderEn: 'e.g., Al Rajhi Bank', type: 'text' },
                          card_last4: { ar: 'آخر 4 أرقام من البطاقة', en: 'Card Last 4 Digits', placeholderAr: '4321', placeholderEn: '4321', type: 'text' },
                          notes: { ar: 'ملاحظات أو طلبات خاصة', en: 'Notes / Special Requests', placeholderAr: 'أدخل أي تفاصيل تود مشاركتها قبل الموعد...', placeholderEn: 'Enter any notes...', type: 'textarea' },
                        };

                        return Object.entries(fieldStatuses).map(([fieldKey, status]) => {
                          if (status === 'disabled' || !FIELD_LABELS[fieldKey]) return null;

                          const receiptMode = workspace?.payment_receipt_mode || 'required';
                          if ((fieldKey === 'upload_receipt' || fieldKey === 'payment_proof') && receiptMode === 'disabled') {
                            return null;
                          }

                          const meta = FIELD_LABELS[fieldKey];
                          const labelText = isRTL ? meta.ar : meta.en;
                          let isRequired = status === 'required';
                          if (fieldKey === 'upload_receipt' || fieldKey === 'payment_proof') {
                            isRequired = receiptMode === 'required';
                          }
                          const val = formFields[fieldKey] !== undefined ? formFields[fieldKey] : (meta.defaultValue || '');

                          if (meta.type === 'file') {
                            return (
                              <div key={fieldKey}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                                  <Icon name="custom-b7882d93" size={15} />
                                  <span>{labelText}</span>
                                  {isRequired && <span style={{ color: 'red' }}> *</span>}
                                </label>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="form-control"
                                  onChange={(e) => setFormFields((p) => ({ ...p, [fieldKey]: e.target.files[0] }))}
                                  required={isRequired}
                                />
                              </div>
                            );
                          }

                          if (meta.type === 'select' && fieldKey === 'preferred_contact_method') {
                            return (
                              <div key={fieldKey}>
                                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                                  {labelText}
                                  {isRequired && <span style={{ color: 'red' }}> *</span>}
                                </label>
                                <select
                                  className="form-control"
                                  value={val || 'phone'}
                                  onChange={(e) => setFormFields((p) => ({ ...p, [fieldKey]: e.target.value }))}
                                  required={isRequired}
                                >
                                  <option value="phone">{isRTL ? 'رقم الهاتف / الاتصال' : 'Phone Call'}</option>
                                  <option value="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</option>
                                  <option value="whatsapp">{isRTL ? 'واتساب' : 'WhatsApp'}</option>
                                </select>
                              </div>
                            );
                          }

                          if (meta.type === 'textarea') {
                            return (
                              <div key={fieldKey}>
                                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                                  {labelText}
                                  {isRequired && <span style={{ color: 'red' }}> *</span>}
                                </label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  placeholder={isRTL ? meta.placeholderAr : meta.placeholderEn}
                                  value={val}
                                  onChange={(e) => setFormFields((p) => ({ ...p, [fieldKey]: e.target.value }))}
                                  required={isRequired}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={fieldKey}>
                              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                                {labelText}
                                {isRequired && <span style={{ color: 'red' }}> *</span>}
                              </label>
                              <input
                                type={meta.type}
                                className="form-control"
                                placeholder={isRTL ? meta.placeholderAr : meta.placeholderEn}
                                value={val}
                                onChange={(e) => setFormFields((p) => ({ ...p, [fieldKey]: e.target.value }))}
                                required={isRequired}
                              />
                            </div>
                          );
                        });
                      })()}

                      {/* Workspace Configured Booking Questions */}
                      {activeQuestions.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon name="copy" size={16} />
                            <span>{isRTL ? 'أسئلة حجز مساحة العمل الإضافية' : 'Workspace Required Questions'}</span>
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {activeQuestions.map((q) => {
                              const answerVal = questionAnswers[q.id]?.answer || '';
                              return (
                                <div key={q.id}>
                                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                                    {q.label}
                                    {q.is_required && <span style={{ color: 'red' }}> *</span>}
                                  </label>
                                  {q.description && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                                      {q.description}
                                    </p>
                                  )}

                                  {q.field_type === 'textarea' ? (
                                    <textarea
                                      className="form-control"
                                      rows={3}
                                      placeholder={q.placeholder || ''}
                                      value={answerVal}
                                      onChange={(e) => handleQuestionAnswerChange(q.id, q.label, e.target.value)}
                                      required={q.is_required}
                                    />
                                  ) : q.field_type === 'select' && Array.isArray(q.options) ? (
                                    <select
                                      className="form-control"
                                      value={answerVal}
                                      onChange={(e) => handleQuestionAnswerChange(q.id, q.label, e.target.value)}
                                      required={q.is_required}
                                    >
                                      <option value="">{isRTL ? 'اختر الإجابة' : 'Select Option'}</option>
                                      {q.options.map((opt, i) => (
                                        <option key={i} value={typeof opt === 'string' ? opt : opt.value || opt.label}>
                                          {typeof opt === 'string' ? opt : opt.label || opt.value}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={q.field_type === 'number' ? 'number' : 'text'}
                                      className="form-control"
                                      placeholder={q.placeholder || ''}
                                      value={answerVal}
                                      onChange={(e) => handleQuestionAnswerChange(q.id, q.label, e.target.value)}
                                      required={q.is_required}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Step Action Controls (Previous, Next & Submit) */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <div>
                    {currentStep > 1 && (
                      <button type="button" onClick={handlePrevStep} className="btn btn-secondary btn-md">
                        {isRTL ? '← الخطوة السابقة' : '← Previous Step'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link to={`/workspaces/${workspace.slug}`} className="btn btn-ghost btn-md">
                      {t('cancel')}
                    </Link>

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn btn-primary btn-md"
                        disabled={
                          (currentStep === 1 && !selectedService) ||
                          (currentStep === 2 && (!selectedDate || !selectedSlot))
                        }
                        style={{ minWidth: 140, justifyContent: 'center' }}
                      >
                        <span>{isRTL ? 'التالي →' : 'Next Step →'}</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary btn-md"
                        disabled={submitting || !selectedSlot}
                        style={{ minWidth: 170, justifyContent: 'center' }}
                      >
                        {submitting ? (
                          <>
                            <div className="spinner spinner-sm" />
                            <span>{isRTL ? 'جاري الحجز...' : 'Booking...'}</span>
                          </>
                        ) : (
                          <span>{t('bookAppointment') || (isRTL ? 'تأكيد وحجز الموعد' : 'Confirm Booking')}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Sidebar: Workspace Summary & Booking Receipt */}
          <div>
            <div className="card" style={{ padding: 24, borderRadius: 'var(--radius-lg)', position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                {isRTL ? 'ملخص تفاصيل الحجز' : 'Booking Summary'}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {workspace.logo_url && (
                  <LazyImage src={workspace.logo_url} alt={`${workspace.name} logo`} width={48} height={48} objectFit="cover" style={{ borderRadius: 'var(--radius-md)' }} />
                )}
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem' }}>{workspace.name}</strong>
                  {workspace.slug && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>@{workspace.slug}</span>}
                </div>
              </div>

              {selectedService ? (
                <div style={{ background: 'var(--surface-alt)', padding: 18, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{getTranslatableText(selectedService.name)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                    {getTranslatableText(selectedService.short_description || selectedService.description)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
                    <span>{isRTL ? 'السعر:' : 'Price:'}</span>
                    <strong style={{ color: primaryColor }}>
                      {formatCurrency(selectedService.price, selectedService.currency_detail || selectedService.currency || workspace?.currency_detail || workspace?.currency, isRTL, t('freeService'))}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: 6 }}>
                    <span>{isRTL ? 'المدة:' : 'Duration:'}</span>
                    <span>{selectedService.duration_minutes} {t('durationMinutes')}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {isRTL ? 'يرجى تحديد خدمة لعرض التفاصيل.' : 'Please select a service.'}
                </p>
              )}

              {selectedDate && selectedSlot && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, fontSize: '0.88rem', color: 'var(--text)' }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Icon name="calendar" size={15} />
                      <span>{isRTL ? 'اليوم:' : 'Date:'}</span>
                    </span>
                    <strong>{selectedDate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Icon name="clock" size={15} />
                      <span>{isRTL ? 'الوقت:' : 'Time:'}</span>
                    </span>
                    <strong>
                      {(() => {
                        const [hStr, mStr] = selectedSlot.split(':');
                        let h = parseInt(hStr, 10);
                        const m = mStr || '00';
                        const period = isRTL ? (h >= 12 ? 'م' : 'ص') : (h >= 12 ? 'PM' : 'AM');
                        h = h % 12 || 12;
                        return `${h}:${m} ${period}`;
                      })()}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
