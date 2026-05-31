import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DateRangeCalendar.css';

const DateRangeCalendar = ({ startDate, endDate, onChange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize visible month/year
  const initialDate = startDate ? new Date(startDate) : today;
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Helper to format date as YYYY-MM-DD
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (date) => {
    const dateStr = formatDateString(date);

    if (!startDate || (startDate && endDate)) {
      // Start a new selection
      onChange(dateStr, '');
    } else {
      // We have startDate but no endDate
      const start = new Date(startDate);
      if (date < start) {
        // If clicked date is before start date, make it the new start date
        onChange(dateStr, '');
      } else if (dateStr === startDate) {
        // If clicked on the same start date, clear it
        onChange('', '');
      } else {
        // Complete the range
        onChange(startDate, dateStr);
      }
    }
  };

  // Generate calendar days
  const generateDays = () => {
    const days = [];
    
    // First day of current month
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust firstDayIndex to Monday start (0: Mon, 1: Tue, ..., 6: Sun)
    const mondayOffset = (firstDayIndex + 6) % 7;

    // Last day of current month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Last day of previous month
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month padding days
    for (let i = mondayOffset; i > 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthDays - i + 1);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true, // padding days disabled
        key: `prev-${prevMonthDays - i + 1}`
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const isPast = date < today;
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: isPast,
        isToday: date.toDateString() === today.toDateString(),
        key: `curr-${i}`
      });
    }

    // Next month padding days to complete grid (6 rows of 7 = 42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: true, // padding days disabled
        key: `next-${i}`
      });
    }

    return days;
  };

  const days = generateDays();

  // Helper to determine cell classes
  const getDayClasses = (day) => {
    if (day.isDisabled) return 'calendar-day disabled';

    const dateStr = formatDateString(day.date);
    let classes = 'calendar-day';

    if (!day.isCurrentMonth) {
      classes += ' other-month';
    }

    if (day.isToday) {
      classes += ' today';
    }

    if (dateStr === startDate) {
      classes += ' selected-endpoint start-endpoint';
    } else if (dateStr === endDate) {
      classes += ' selected-endpoint end-endpoint';
    } else if (startDate && endDate) {
      const current = day.date.getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (current > start && current < end) {
        classes += ' in-range';
      }
    }

    return classes;
  };

  return (
    <div className={`custom-calendar-widget ${startDate && endDate ? 'has-range-selected' : ''}`}>
      <div className="calendar-header flex-between">
        <h5 className="calendar-month-title">
          {monthNames[currentMonth]} {currentYear}
        </h5>
        <div className="calendar-nav flex">
          <button type="button" onClick={handlePrevMonth} className="calendar-nav-btn">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={handleNextMonth} className="calendar-nav-btn">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-weekdays-row">
        {daysOfWeek.map((day) => (
          <span key={day} className="weekday-label">
            {day}
          </span>
        ))}
      </div>

      <div className="calendar-days-grid">
        {days.map((day) => (
          <button
            key={day.key}
            type="button"
            className={getDayClasses(day)}
            onClick={() => handleDayClick(day.date)}
            disabled={day.isDisabled}
          >
            <span className="day-number">{day.date.getDate()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangeCalendar;
