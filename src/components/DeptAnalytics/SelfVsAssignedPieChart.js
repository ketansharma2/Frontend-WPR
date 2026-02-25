import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const SelfVsAssignedPieChart = ({ data }) => {
  console.log('SelfVsAssignedPieChart data:', data);

  // Always include both categories for legend
  const chartData = [
    { name: 'Self Tasks', value: data.self || 0, color: '#007bff' },
    { name: 'Master Tasks', value: data.assigned || 0, color: '#6f42c1' }
  ];

  console.log('SelfVsAssignedPieChart chartData:', chartData);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: data.payload.color }}>
            {data.name}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            Tasks: {data.value}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            Percentage: {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#666',
        fontSize: '16px'
      }}>
        No task data available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: '100%', display: 'flex', flexDirection: 'column', padding: '5px', boxSizing: 'border-box' }}>
      <h4 style={{ margin: '0 0 2px 0', color: '#374151', fontSize: '11px', fontWeight: '600', textAlign: 'center', flexShrink: 0 }}>Self vs Master Task</h4>
      <div style={{ width: "100%", flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <PieChart width={140} height={140} margin={{ top: 10, right: 5, bottom: 5, left: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={32}
            dataKey="value"
            label={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </div>
      {/* Custom Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '2px' }}>
        {chartData.filter(item => item.value > 0).map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: entry.color }} />
            <span style={{ fontSize: '10px', color: '#374151' }}>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

};

export default SelfVsAssignedPieChart;
