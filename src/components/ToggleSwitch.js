import React, { useState, useEffect } from "react";
import "./ToggleSwitch.css";

export default function ToggleSwitch({ onToggle, active: propActive }) {
  const [active, setActive] = useState(propActive || "Tasks");

  useEffect(() => {
    if (propActive) {
      setActive(propActive);
    }
  }, [propActive]);

  const handleToggle = (newActive) => {
    setActive(newActive);
    onToggle(newActive === "Tasks" ? "task" : "meeting");
  };

  return (
    <div className="toggle-wrapper">
      <div className={`toggle-pill ${active === "Tasks" ? "left" : "right"}`}></div>

      <span
        className={`toggle-option ${active === "Tasks" ? "active" : ""}`}
        onClick={() => handleToggle("Tasks")}
      >
        Tasks
      </span>

      <span
        className={`toggle-option ${active === "Meeting" ? "active" : ""}`}
        onClick={() => handleToggle("Meeting")}
      >
        Meeting
      </span>
    </div>
  );
}