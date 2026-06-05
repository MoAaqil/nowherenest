import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ bookings, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const getBookingsForDate = (date) => {
    if (!date) return [];
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false;

      const start = new Date(b.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(b.endDate);
      end.setHours(23,59,59,999);
      
      const target = new Date(date);
      target.setHours(12,0,0,0);

      return target >= start && target <= end;
    });
  };

  return (
    <div className="calendar-container card">
      <div className="calendar-header flex-between" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>{monthNames[month]} {year}</h3>
        <div className="flex gap-12" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={prevMonth} className="btn-icon" style={{ padding: '4px', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date())} className="btn btn-outline btn-small" style={{ fontSize: '12px', padding: '4px 12px' }}>Today</button>
          <button onClick={nextMonth} className="btn-icon" style={{ padding: '4px', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}><ChevronRight size={20}/></button>
        </div>
      </div>
      
      <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#E2E8F0' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-header" style={{ background: '#F8FAFC', padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>
            {day}
          </div>
        ))}
        
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="calendar-day empty" style={{ background: '#F8FAFC', minHeight: '120px' }}></div>;
          
          const dayBookings = getBookingsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div 
              key={date.toISOString()} 
              className={`calendar-day ${isToday ? 'today' : ''}`}
              onClick={() => onDateClick && onDateClick(date)}
              style={{ 
                background: isToday ? '#F0FDF4' : '#FFFFFF', 
                minHeight: '120px', 
                padding: '8px', 
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isToday ? '#DCFCE7' : '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.background = isToday ? '#F0FDF4' : '#FFFFFF'}
            >
              <div className="day-number" style={{ fontSize: '14px', fontWeight: isToday ? 'bold' : '500', color: isToday ? 'var(--primary-color)' : '#334155', marginBottom: '8px' }}>
                {date.getDate()}
              </div>
              <div className="day-bookings" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {dayBookings.map(b => {
                  let bgColor = '#E0F2FE';
                  let textColor = '#0369A1';
                  if (b.status === 'checked_in') { bgColor = '#DCFCE7'; textColor = '#15803D'; }
                  if (b.status === 'checked_out') { bgColor = '#FEF3C7'; textColor = '#B45309'; }

                  return (
                    <div 
                      key={b._id} 
                      title={`${b.guestName || b.customer?.name} - ${b.property?.name}`}
                      style={{ 
                        background: bgColor, 
                        color: textColor, 
                        fontSize: '11px', 
                        padding: '4px 6px', 
                        borderRadius: '4px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        fontWeight: '500'
                      }}
                    >
                      {b.guestName || b.customer?.name?.split(' ')[0]}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
