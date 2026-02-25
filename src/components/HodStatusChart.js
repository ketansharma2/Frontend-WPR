import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

const HodStatusChart = ({ data }) => {
  const chartData = [
    { name: 'Done', value: data?.done || 0, color: '#55d684' },
    { name: 'In Progress', value: data?.inProgress || 0, color: '#2563EB' },
    { name: 'Not Started', value: data?.notStarted || 0, color: '#9CA3AF' },
    { name: 'Cancelled', value: data?.cancelled || 0, color: '#EF4444' },
    { name: 'On Hold', value: data?.onHold || 0, color: '#ff9549' }
  ].filter(item => item.value > 0);

  const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '150px',
          color: '#666',
          fontSize: '14px'
        }}
      >
        No task status data available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 100, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <PieChart width={90} height={80} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={30}
            innerRadius={10}
            dataKey="value"
            strokeWidth="0.5"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '3px',
          minWidth: '80px'
        }}>
          {chartData.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '2px', 
                backgroundColor: item.color,
                flexShrink: 0
              }} />
              <span style={{ fontSize: '10px', color: '#374151' }}>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HodStatusChart;
