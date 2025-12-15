import React, { useState, useRef, useEffect } from "react";
import { FaFlag, FaChevronDown } from "react-icons/fa";
import "./PrioritySelector.css";

const PRIORITY_LEVELS = [
  {
    id: 'normal',
    label: 'Normal',
    color: '#10b981', // Green
    bgColor: '#dcfce7',
    borderColor: '#10b981',
    icon: '🟢'
  },
  {
    id: 'important',
    label: 'Important', 
    color: '#f59e0b', // Orange
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    icon: '🟡'
  },
  {
    id: 'urgent',
    label: 'Urgent',
    color: '#ef4444', // Red
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    icon: '🔴'
  }
];

export default function PrioritySelector({ 
  currentPriority = 'normal', 
  onPriorityChange, 
  taskId,
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(currentPriority);
  const dropdownRef = useRef(null);

  const currentPriorityLevel = PRIORITY_LEVELS.find(p => p.id === selectedPriority) || PRIORITY_LEVELS[0];

  useEffect(() => {
    setSelectedPriority(currentPriority);
  }, [currentPriority]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrioritySelect = (priorityId) => {
    setSelectedPriority(priorityId);
    setIsOpen(false);
    if (onPriorityChange) {
      onPriorityChange(priorityId, taskId);
    }
  };

  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!dropdownRef.current) return { top: 0, left: 0 };
    
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownHeight = PRIORITY_LEVELS.length * 50 + 20; // Estimate height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top = rect.bottom + 5;
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      top = rect.top - dropdownHeight - 5;
    }
    
    return {
      top: top,
      left: rect.left,
      right: window.innerWidth - rect.right
    };
  };

  return (
    <div className="priority-selector" ref={dropdownRef}>
      <button
        className={`priority-button ${disabled ? 'disabled' : ''}`}
        onClick={handleToggleDropdown}
        disabled={disabled}
        style={{
          borderColor: currentPriorityLevel.borderColor,
          backgroundColor: currentPriorityLevel.bgColor
        }}
        title={`Current priority: ${currentPriorityLevel.label}`}
      >
        <span className="priority-icon" style={{ color: currentPriorityLevel.color }}>
          {currentPriorityLevel.icon}
        </span>
      </button>

      {isOpen && (
        <div
          className="priority-dropdown"
          style={{
            ...getDropdownPosition(),
            right: 'auto',
            transform: 'none'
          }}
        >
          {PRIORITY_LEVELS.map((priority) => (
            <div
              key={priority.id}
              className={`priority-option ${selectedPriority === priority.id ? 'selected' : ''}`}
              onClick={() => handlePrioritySelect(priority.id)}
              style={{
                backgroundColor: selectedPriority === priority.id ? priority.bgColor : 'transparent',
                borderLeftColor: priority.borderColor,
                color: priority.color
              }}
            >
              <span className="priority-option-icon">{priority.icon}</span>
              <span className="priority-option-label">{priority.label}</span>
              {selectedPriority === priority.id && (
                <span className="priority-check">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}