import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import client, { endpoints } from '../../../../api/client';
import Icon from '../../../../components/common/Icon';
import UserAvatar from '../../../../components/ui/UserAvatar';

export default function BookingsCalendar({ onSelectBooking }) {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canSeeOthers = isOwner || userPermissions.includes('bookings_read');

  const loadCalendarBookings = async (date) => {
    try {
      setLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Pad dates slightly to include overlapping timezones
      const dateFrom = new Date(firstDay);
      dateFrom.setDate(dateFrom.getDate() - 7);
      const dateTo = new Date(lastDay);
      dateTo.setDate(dateTo.getDate() + 7);

      const res = await client.get(endpoints.workspaceCalendarBookings, {
        params: {
          date_from: dateFrom.toISOString(),
          date_to: dateTo.toISOString()
        },
      });
      setCalendarBookings(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarBookings(currentDate);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = [
    t('month_1') || 'January', t('month_2') || 'February', t('month_3') || 'March',
    t('month_4') || 'April', t('month_5') || 'May', t('month_6') || 'June',
    t('month_7') || 'July', t('month_8') || 'August', t('month_9') || 'September',
    t('month_10') || 'October', t('month_11') || 'November', t('month_12') || 'December'
  ];
    
  const dayNames = [
    t('day_0') || 'Sun', t('day_1') || 'Mon', t('day_2') || 'Tue',
    t('day_3') || 'Wed', t('day_4') || 'Thu', t('day_5') || 'Fri', t('day_6') || 'Sat'
  ];

  // Map bookings to days
  const bookingsByDay = useMemo(() => {
    const map = {};
    calendarBookings.forEach(b => {
      if (!b.starts_at) return;
      const d = new Date(b.starts_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [calendarBookings]);

  const formatTranslatable = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isRTL ? val.ar || val.en || Object.values(val)[0] || '' : val.en || val.ar || Object.values(val)[0] || '';
    }
    return String(val);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>{t('statusConfirmed') || 'Confirmed'}</span>;
      case 'pending': return <span style={{ color: '#b45309', fontSize: '0.75rem', fontWeight: 600 }}>{t('statusPending') || 'Pending'}</span>;
      case 'cancelled': return <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>{t('statusCancelled') || 'Cancelled'}</span>;
      case 'completed': return <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>{t('statusCompleted') || 'Completed'}</span>;
      default: return <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
    }
  };

  const renderCalendarDays = () => {
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    // Ensure the total slots are a multiple of 7 by adding blanks at the end if necessary
    const remaining = totalSlots.length % 7;
    const endBlanks = remaining > 0 ? Array(7 - remaining).fill(null) : [];
    const fullGrid = [...totalSlots, ...endBlanks];

    return fullGrid.map((day, idx) => {
      if (!day) return <div key={`blank-${idx}`} className="calendar-day-blank" />;
      
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
      const dayBookings = bookingsByDay[key] || [];
      const isSelected = selectedDay === key;
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      return (
        <div 
          key={day} 
          onClick={() => setSelectedDay(isSelected ? null : key)}
          className={`calendar-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ 
              fontWeight: isToday ? 800 : 600, 
              color: isToday ? 'var(--primary)' : 'var(--heading)', 
              fontSize: isToday ? '1rem' : '0.9rem',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: isToday ? 'var(--primary-subtle)' : 'transparent'
            }}>
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontWeight: 700 }}>
                {dayBookings.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {dayBookings.slice(0, 3).map(b => {
              const isMine = b.workspace_member_id === user.id;
              // Own bookings show in primary color. Others show in a distinct color.
              const bgColor = isMine ? 'var(--primary)' : '#8b5cf6';
              const time = new Date(b.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={b.id} 
                  className="calendar-event"
                  style={{ background: bgColor }}
                  title={b.customer_name_snapshot || b.customer?.name}
                >
                  {time} - {b.customer_name_snapshot || b.customer?.name}
                </div>
              );
            })}
            {dayBookings.length > 3 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 700, marginTop: 4 }}>
                +{dayBookings.length - 3} {isRTL ? 'المزيد' : 'more'}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="card-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--heading)' }}>
            {t('workspaceBookings') || 'المواعيد والحجوزات'} - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            {t('workspaceBookingsDesc') || 'استعراض وتحديث حالة كافة الحجوزات والجلسات المقررة للمساحة'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrevMonth} style={{ borderRadius: '8px', padding: '6px 12px' }}>
            <Icon name={isRTL ? "chevron-right" : "chevron-left"} size={18} />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleNextMonth} style={{ borderRadius: '8px', padding: '6px 12px' }}>
            <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 36, height: 36, border: '4px solid var(--primary-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="calendar-wrapper">
            <div className="calendar-grid">
              {dayNames.map(day => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
              {renderCalendarDays()}
            </div>
          </div>

          {selectedDay && bookingsByDay[selectedDay] && (
            <div style={{ background: 'var(--surface-alt)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 0, marginBottom: 16, color: 'var(--heading)' }}>
                {isRTL ? 'مواعيد يوم' : 'Appointments for'} {selectedDay}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookingsByDay[selectedDay].map(b => {
                  const customerName = b.customer_name_snapshot || b.customer?.name || 'عميل';
                  const serviceTitle = formatTranslatable(b.service?.name) || b.service_name_snapshot || b.service?.title || 'خدمة';
                  const isMine = b.workspace_member_id === user.id;
                  
                  return (
                    <div 
                      key={b.id} 
                      className="booking-list-item"
                      style={{ borderRight: isMine ? '4px solid var(--primary)' : '4px solid #8b5cf6' }}
                      onClick={() => onSelectBooking && onSelectBooking(b.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <UserAvatar name={customerName} avatarUrl={b.customer?.avatar_url} size={44} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--heading)' }}>{customerName}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{serviceTitle}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'end' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--heading)' }}>
                          {new Date(b.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {renderStatusBadge(b.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--primary)' }}></span>
          {isRTL ? 'مواعيدي' : 'My Appointments'}
        </div>
        {canSeeOthers && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: '#8b5cf6' }}></span>
            {isRTL ? 'مواعيد أخرى' : 'Other Appointments'}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .calendar-wrapper {
          overflow-x: auto;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          background: var(--surface);
        }
        .calendar-wrapper::-webkit-scrollbar {
          height: 8px;
        }
        .calendar-wrapper::-webkit-scrollbar-thumb {
          background-color: var(--border-dark);
          border-radius: 4px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(130px, 1fr));
          min-width: 900px; /* Forces scrolling on smaller screens */
        }
        .calendar-header-cell {
          text-align: center;
          padding: 12px 0;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-secondary);
          border-right: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          background: var(--surface-alt);
        }
        .calendar-header-cell:nth-child(7n) {
          border-right: none;
        }
        .calendar-day-cell {
          min-height: 120px;
          border-right: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--surface);
          position: relative;
        }
        .calendar-grid > .calendar-day-cell:nth-last-child(-n+7) {
          border-bottom: none;
        }
        .calendar-grid > .calendar-day-blank:nth-last-child(-n+7) {
          border-bottom: none;
        }
        .calendar-day-cell:nth-child(7n) {
          border-right: none;
        }
        .calendar-day-cell:hover {
          background: var(--surface-alt) !important;
        }
        .calendar-day-cell.is-today {
          background: var(--surface);
        }
        .calendar-day-cell.is-selected {
          background: var(--primary-subtle) !important;
          box-shadow: inset 0 0 0 2px var(--primary);
        }
        .calendar-day-blank {
          min-height: 120px;
          border-right: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          background: rgba(0,0,0,0.02);
        }
        .calendar-day-blank:nth-child(7n) {
          border-right: none;
        }
        .calendar-event {
          font-size: 0.75rem;
          color: #fff;
          padding: 5px 8px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .calendar-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .booking-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .booking-list-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border-color: var(--border-dark);
        }
      `}</style>
    </div>
  );
}
