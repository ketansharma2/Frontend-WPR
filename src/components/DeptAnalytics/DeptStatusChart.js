import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DeptStatusChart = ({ data }) => {

  console.log("DeptStatusChart full data:", data);

  const chartData = [
    { name: 'Done', value: data?.done || 0, color: '#55d684' },
    { name: 'In Progress', value: data?.in_progress || 0, color: '#2563EB' },
    { name: 'Not Started', value: data?.not_started || 0, color: '#9CA3AF' },
    { name: 'Cancelled', value: data?.cancelled || 0, color: '#EF4444' },
    { name: 'On Hold', value: data?.on_hold || 0, color: '#ff9549' }
  ].filter(item => item.value > 0);

  const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = totalTasks
        ? ((item.value / totalTasks) * 100).toFixed(1)
        : 0;

      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}
        >
          <p style={{ margin: 0, fontWeight: '600', color: item.payload.color }}>
            {item.name}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
            Tasks: {item.value}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
            {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#666',
          fontSize: '16px'
        }}
      >
        No task status data available
      </div>
    );
  }

 return (
  <div style={{ width: "100%", height: 400 ,marginTop: 20}}>
    <PieChart width={250} height={330}>
      <Pie
        data={chartData}
        cx="50%"
        cy="50%"
        outerRadius={130}
        dataKey="value"
        label={({ name, value }) => `${name} (${value})`}
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      {/* <Tooltip content={<CustomTooltip />} /> */}
    </PieChart>
  </div>
);



};

export default DeptStatusChart;
