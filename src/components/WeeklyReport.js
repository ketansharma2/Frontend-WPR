import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import FilterPopup from "./FilterPopup";
import { FaSearch, FaTimes, FaChevronDown } from "react-icons/fa";
import "./weekly.css";

export default function WeeklyReport({ tasks, taskTypeFilter, setTaskTypeFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        date: '',
        tasktype: '',
        category: '',
        status: ''
    });
    const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchQuery ||
               fromDate || toDate ||
               taskTypeFilter ||
               statusFilter ||
               categoryFilter;
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setFromDate('');
        setToDate('');
        setTaskTypeFilter('');
        setStatusFilter('');
        setCategoryFilter('');
    };

    // Helper function to get display text for filters
    const getFilterDisplayText = (filterType, value) => {
        if (!value) return filterType === 'date' ? 'Date Range' :
                          filterType === 'tasktype' ? 'Task Type' :
                          filterType === 'category' ? 'Category' : 'Status';
        
        if (value === 'all') return 'All';
        
        const displayMap = {
            tasktype: { 'fixed': 'Fixed', 'variable': 'Variable', 'hod assigned': 'HOD Assigned' },
            category: { 'self': 'Self', 'assigned': 'Assigned', 'all': 'All' },
            status: { 'In Progress': 'In Progress', 'Done': 'Done', 'Not Started': 'Not Started', 'all': 'All' }
        };
        
        return displayMap[filterType]?.[value] || value;
    };

    // Get date filter display text
    const getDateFilterDisplay = () => {
        if (!fromDate && !toDate) return 'Date Range';
        if (fromDate && toDate) return `${fromDate} to ${toDate}`;
        if (fromDate) return `From ${fromDate}`;
        if (toDate) return `To ${toDate}`;
        return 'Date Range';
    };

    // Filter tasks based on all filter criteria
    const filteredTasks = tasks.filter(task => {
        // Search filter
        if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Task type filter
        if (taskTypeFilter && task.type !== taskTypeFilter) return false;

        // Status filter
        if (statusFilter && task.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter && task.category !== categoryFilter) return false;

        // Date range filter
        if (!fromDate && !toDate) return true; // No date filter applied
        
        const createdDate = new Date(task.createdAt);
        const taskDate = new Date(createdDate);
        taskDate.setHours(0, 0, 0, 0);
        
        let fromDateTime = null;
        let toDateTime = null;
        
        if (fromDate) {
            fromDateTime = new Date(fromDate);
            fromDateTime.setHours(0, 0, 0, 0);
        }
        
        if (toDate) {
            toDateTime = new Date(toDate);
            toDateTime.setHours(23, 59, 59, 999); // End of day
        }
        
        // Check if task date falls within the range
        if (fromDateTime && toDateTime) {
            return taskDate >= fromDateTime && taskDate <= toDateTime;
        } else if (fromDateTime) {
            return taskDate >= fromDateTime;
        } else if (toDateTime) {
            return taskDate <= toDateTime;
        }
        
        return true;
    });

    const doneTasks = filteredTasks.filter(task => task.status === 'Done');
    const inProgressTasks = filteredTasks.filter(task => task.status === 'In Progress');
    const notStartedTasks = filteredTasks.filter(task => task.status === 'Not Started');

    const data = [
      { name: "Done", value: doneTasks.length, color: "#2D63FF" },
      { name: "In progress", value: inProgressTasks.length, color: "#F4C430" },
      { name: "Not started", value: notStartedTasks.length, color: "#FF6B6B" },
    ];

   return (
     <div className="cu-task-wrapper">
       {/* Professional Search and Filter Bar */}
       <div className="professional-filter-bar">
         {/* Search Bar */}
         <div className="search-container">
           <FaSearch className="search-icon" />
           <input
             type="text"
             placeholder="Search tasks and meetings..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="search-input"
           />
           {searchQuery && (
             <FaTimes
               className="clear-search"
               onClick={() => setSearchQuery('')}
             />
           )}
         </div>

         {/* Filter Controls */}
         <div className="filter-controls">
           {/* Date Range Filter - Always Visible */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: fromDate || toDate ? '#e3f2fd' : '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', minWidth: '280px' }}>
             <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057', whiteSpace: 'nowrap' }}>Date Range:</span>
             <input
               type="date"
               value={fromDate}
               onChange={(e) => setFromDate(e.target.value)}
               placeholder="From"
               style={{
                 padding: '4px 6px',
                 border: '1px solid #ced4da',
                 borderRadius: '4px',
                 fontSize: '11px',
                 width: '100px'
               }}
             />
             <span style={{ fontSize: '11px', color: '#6c757d' }}>to</span>
             <input
               type="date"
               value={toDate}
               onChange={(e) => setToDate(e.target.value)}
               placeholder="To"
               style={{
                 padding: '4px 6px',
                 border: '1px solid #ced4da',
                 borderRadius: '4px',
                 fontSize: '11px',
                 width: '100px'
               }}
             />
             {(fromDate || toDate) && (
               <button
                 onClick={() => {
                   setFromDate('');
                   setToDate('');
                 }}
                 style={{
                   padding: '4px 6px',
                   background: '#dc3545',
                   color: 'white',
                   border: 'none',
                   borderRadius: '4px',
                   fontSize: '10px',
                   cursor: 'pointer',
                   marginLeft: '4px'
                 }}
                 title="Clear dates"
               >
                 ×
               </button>
             )}
           </div>

           {/* Task Type Filter */}
           <div className="filter-dropdown">
             <button
               className={`filter-btn ${activeFilters.tasktype ? 'active' : ''}`}
               onClick={(e) => {
                 e.stopPropagation();
                 setShowTaskTypeDropdown(!showTaskTypeDropdown);
                 setShowCategoryDropdown(false);
                 setShowStatusDropdown(false);
               }}
             >
               {getFilterDisplayText('tasktype', activeFilters.tasktype)}
               <FaChevronDown className="dropdown-arrow" />
             </button>
             {showTaskTypeDropdown && (
               <div className="dropdown-menu">
                 <div className="dropdown-item" onClick={() => { setTaskTypeFilter(''); setShowTaskTypeDropdown(false); }}>All</div>
                 <div className="dropdown-item" onClick={() => { setTaskTypeFilter('fixed'); setShowTaskTypeDropdown(false); }}>Fixed</div>
                 <div className="dropdown-item" onClick={() => { setTaskTypeFilter('variable'); setShowTaskTypeDropdown(false); }}>Variable</div>
                 <div className="dropdown-item" onClick={() => { setTaskTypeFilter('hod assigned'); setShowTaskTypeDropdown(false); }}>HOD Assigned</div>
               </div>
             )}
           </div>
 
           {/* Category Filter */}
           <div className="filter-dropdown">
             <button
               className={`filter-btn ${activeFilters.category ? 'active' : ''}`}
               onClick={(e) => {
                 e.stopPropagation();
                 setShowCategoryDropdown(!showCategoryDropdown);
                 setShowTaskTypeDropdown(false);
                 setShowStatusDropdown(false);
               }}
             >
               {getFilterDisplayText('category', activeFilters.category)}
               <FaChevronDown className="dropdown-arrow" />
             </button>
             {showCategoryDropdown && (
               <div className="dropdown-menu">
                 <div className="dropdown-item" onClick={() => { setCategoryFilter(''); setShowCategoryDropdown(false); }}>All</div>
                 <div className="dropdown-item" onClick={() => { setCategoryFilter('self'); setShowCategoryDropdown(false); }}>Self</div>
                 <div className="dropdown-item" onClick={() => { setCategoryFilter('assigned'); setShowCategoryDropdown(false); }}>Assigned</div>
               </div>
             )}
           </div>

           {/* Status Filter */}
           <div className="filter-dropdown">
             <button
               className={`filter-btn ${activeFilters.status ? 'active' : ''}`}
               onClick={(e) => {
                 e.stopPropagation();
                 setShowStatusDropdown(!showStatusDropdown);
                 setShowTaskTypeDropdown(false);
                 setShowCategoryDropdown(false);
               }}
             >
               {getFilterDisplayText('status', activeFilters.status)}
               <FaChevronDown className="dropdown-arrow" />
             </button>
             {showStatusDropdown && (
               <div className="dropdown-menu">
                 <div className="dropdown-item" onClick={() => { setStatusFilter(''); setShowStatusDropdown(false); }}>All</div>
                 <div className="dropdown-item" onClick={() => { setStatusFilter('In Progress'); setShowStatusDropdown(false); }}>In Progress</div>
                 <div className="dropdown-item" onClick={() => { setStatusFilter('Done'); setShowStatusDropdown(false); }}>Done</div>
                 <div className="dropdown-item" onClick={() => { setStatusFilter('Not Started'); setShowStatusDropdown(false); }}>Not Started</div>
               </div>
             )}
           </div>

           {/* Clear All Filters Button - Show when filters are active */}
           {hasActiveFilters() && (
             <button
               className="clear-all-filters-btn"
               onClick={clearAllFilters}
               title="Clear all filters"
             >
               <FaTimes className="clear-all-icon" />
               Clear All
             </button>
           )}
         </div>

       </div>
       <div className="weekly-container"><div className="kpi-row">
         <div className="kpi-box">
           <p>Total Tasks</p>
           <h2>{filteredTasks.length}</h2>
         </div>

         <div className="kpi-box">
           <p>Done</p>
           <h2>{doneTasks.length}</h2>
         </div>

         <div className="kpi-box">
           <p>In progress</p>
           <h2>{inProgressTasks.length}</h2>
         </div>
       </div>

       <div className="content-area">
         {/* LEFT SIDE */}
         <div className="left-panel">

           {/* Blue Weekly Card */}
           <div className="weekly-card">
             <h2>Weekly Report</h2>

             <div className="stats-row">
               <div>
                 <h3>13 Hour</h3>
                 <p>Completed tasks</p>
               </div>

               <div>
                 <h3>0%</h3>
                 <p>Completion</p>
               </div>

               <div>
                 <h3>24 hrs Week</h3>
                 <p>Time using</p>
               </div>

               <div>
                 <h3>In-started</h3>
                 <p>Status</p>
               </div>
             </div>
           </div>

           {/* TABLE */}
           <h3 className="mt">Tasks List</h3>

           <table className="task-table">
             <thead>
               <tr>
                 <th>Task</th>
                 <th>Status</th>
               </tr>
             </thead>

             <tbody>
               {inProgressTasks.map((task, index) => (
                 <tr key={index}>
                   <td>{task.name}</td>
                   <td>In progress</td>
                 </tr>
               ))}
             </tbody>
           </table>

           <button className="download-btn">Download rpt</button>
         </div>

         {/* RIGHT SIDE */}
         <div className="right-panel">
           <h3>Task status summary</h3>

           <PieChart width={300} height={300} style={{ marginLeft: 'auto' }}>
             <Pie
               data={data}
               dataKey="value"
               nameKey="name"
               cx={150}
               cy={150}
               outerRadius={110}
               label
             >
               {data.map((entry, index) => (
                 <Cell key={index} fill={entry.color} />
               ))}
             </Pie>
             <Tooltip />
             <Legend />
           </PieChart>
         </div>
       </div>
     </div>
     </div>
   );
 }