import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
} from "date-fns";
import "./Calendar.css";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">‹</button>
        <h2>{format(currentDate, "MMMM yyyy")}</h2>
        <button onClick={nextMonth} className="nav-btn">›</button>
      </div>
    );
  };

  const renderWeekDays = () => {
    const days = [];
    const start = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="weekday" key={i}>
          {format(addDays(start, i), "EEE")}
        </div>
      );
    }
    return <div className="weekdays-row">{days}</div>;
  };

  const renderDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const weekStart = startOfWeek(monthStart);
    const weekEnd = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = weekStart;

    while (day <= weekEnd) {
      for (let i = 0; i < 7; i++) {
        const isCurrentMonth = day.getMonth() === monthStart.getMonth();
        const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

        days.push(
          <div
            className={`day-cell 
            ${isCurrentMonth ? "" : "faded-day"}
            ${isToday ? "today" : ""}
            `}
            key={day}
          >
            <span className="day-number">{format(day, "d")}</span>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className="days-row" key={day}>
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className="calendar-container">
      {renderDays()}
      {renderWeekDays()}
      {renderHeader()}
    </div>
  );
}