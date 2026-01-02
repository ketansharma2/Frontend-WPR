import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DeptStatusChart = ({ data }) => {
  // Transform data for the chart
  const chartData = [
    { name: 'Done', value: data.done || 0, color: '#28a745' },
    { name: 'In Progress', value: data.in_progress || 0, color: '#ffc107' },
    { name: 'Not Started', value: data.not_started || 0, color: '#dc3545' }
  ].filter(item => item.value > 0); // Only show statuses with tasks

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
        height: '300px',
        color: '#666',
        fontSize: '16px'
      }}>
        No task status data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width={400} height={400} aspect={1}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ textAlign: 'center', width: '100%' }}
          height={36}
          formatter={(value, entry) => (
            <span style={{ color: entry.color, fontWeight: 'bold' }}>
              {value}: {entry.payload.value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DeptStatusChart;