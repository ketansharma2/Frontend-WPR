import React, { useState, useEffect } from "react";
import "./ToggleSwitch.css";

export default function DateToggleSwitch({ onToggle, active: propActive }) {
  const [active, setActive] = useState(propActive || "Today");

  useEffect(() => {
    if (propActive) {
      setActive(propActive);
    }
  }, [propActive]);

  const handleToggle = (newActive) => {
    setActive(newActive);
    onToggle(newActive === "Today" ? "today" : "yesterday");
  };

  return (
    <div className="toggle-wrapper">
      <div className={`toggle-pill ${active === "Today" ? "left" : "right"}`}></div>

      <span
        className={`toggle-option ${active === "Today" ? "active" : ""}`}
        onClick={() => handleToggle("Today")}
      >
        Today
      </span>

      <span
        className={`toggle-option ${active === "Yesterday" ? "active" : ""}`}
        onClick={() => handleToggle("Yesterday")}
      >
        Yesterday
      </span>
    </div>
  );
}