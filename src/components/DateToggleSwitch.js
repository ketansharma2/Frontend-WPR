import React, { useState, useEffect } from "react";
import "./ToggleSwitch.css";

export default function DateToggleSwitch({ onToggle, active: propActive }) {
  const [activeIndex, setActiveIndex] = useState(propActive === "Today" ? 0 : 1);

  useEffect(() => {
    if (propActive) {
      setActiveIndex(propActive === "Today" ? 0 : 1);
    }
  }, [propActive]);

  const handleToggle = (index) => {
    setActiveIndex(index);
    onToggle(index === 0 ? "today" : "yesterday");
  };

  return (
    <div className="toggle-wrapper" tabIndex="0">
      <span
        className="indicator"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      ></span>

      <button
        className={`segment ${activeIndex === 0 ? "active" : ""}`}
        onClick={() => handleToggle(0)}
      >
        Today
      </button>

      <button
        className={`segment ${activeIndex === 1 ? "active" : ""}`}
        onClick={() => handleToggle(1)}
      >
        Yesterday
      </button>
    </div>
  );
}