import React, { useState } from "react";
import {
  FiUserCheck,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import "./FilterPopup.css";

export default function FilterPopup({ setTaskTypeFilter, setStatusFilter, setDateFilter, setCategoryFilter, filter }) {
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filters = filter === 'meeting' ? [
    { icon: <FiCalendar />, label: "Date" },
    { icon: <FiUser />, label: "Status" },
  ] : [
    { icon: <FiCalendar />, label: "Date" },
    { icon: <FiUserCheck />, label: "Task type" },
    { icon: <FiUser />, label: "Category" },
    { icon: <FiUser />, label: "Status" },
  ];

  const dateOptions = ["Today", "Yesterday", "Past week", "Past month"];
  const taskTypeOptions = ["Fixed", "Variable", "HOD Assigned"];
  const categoryOptions = ["Self", "Assigned", "All"];
  const statusOptions = ["Done", "In progress"];

  return (
    <>
      <div style={{ position: "relative" }}>
        {/* SELECT BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="filter-button"
        >
          Filter
          <span>▾</span>
        </button>

        {/* POPUP */}
        {open && (
          <div className="filter-popup">

            {/* SCROLLABLE FILTER LIST */}
            <div>
              {filters.map((item, index) => (
                <div key={`filter-${index}`}>
                  <div
                    className="filter-item"
                    onClick={() => {
                      let filterKey = null;
                      if (item.label === "Date") filterKey = 'date';
                      else if (item.label === "Task type") filterKey = 'tasktype';
                      else if (item.label === "Category") filterKey = 'category';
                      else if (item.label === "Status") filterKey = 'status';
                      setSelectedFilter(selectedFilter === filterKey ? null : filterKey);
                    }}
                  >
                    <span className="filter-item-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* SUB-POPUP FOR DATE */}
            {selectedFilter === 'date' && (
              <div className="sub-popup">
                {dateOptions.map((option, index) => (
                  <div
                    key={`date-${index}`}
                    className="sub-option"
                    onClick={() => { const val = option.toLowerCase().replace(' ', '_'); setDateFilter(val); setOpen(false); }}
                  >
                    • {option}
                  </div>
                ))}
              </div>
            )}

            {/* SUB-POPUP FOR TASK TYPE */}
            {selectedFilter === 'tasktype' && (
              <div className="sub-popup">
                {taskTypeOptions.map((option, index) => (
                  <div
                    key={`tasktype-${index}`}
                    className="sub-option"
                    onClick={() => { setTaskTypeFilter(option.toLowerCase()); setOpen(false); }}
                  >
                    • {option}
                  </div>
                ))}
              </div>
            )}

            {/* SUB-POPUP FOR CATEGORY */}
            {selectedFilter === 'category' && (
              <div className="sub-popup">
                {categoryOptions.map((option, index) => (
                  <div
                    key={`category-${index}`}
                    className="sub-option"
                    onClick={() => { setCategoryFilter(option.toLowerCase()); setOpen(false); }}
                  >
                    • {option}
                  </div>
                ))}
              </div>
            )}

            {/* SUB-POPUP FOR STATUS */}
            {selectedFilter === 'status' && (
              <div className="sub-popup">
                {statusOptions.map((option, index) => (
                  <div
                    key={`status-${index}`}
                    className="sub-option"
                    onClick={() => { setStatusFilter(option); setOpen(false); }}
                  >
                    • {option}
                  </div>
                ))}
              </div>
            )}

            {/* CLEAR ALL BUTTON */}
            <div className="clear-container">
              <button
                className="clear-all-btn"
                onClick={() => {
                  setTaskTypeFilter('');
                  setStatusFilter('');
                  setCategoryFilter('');
                  setDateFilter('all');
                  setOpen(false);
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}