import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const SelfAssignedChart = ({ data }) => {
  // Calculate self vs assigned task counts
  const selfTasks = data.self_tasks?.length || 0;
  const assignedTasks = data.master_tasks?.length || 0;

  // Transform data for the chart
  const chartData = [
    { name: 'Self Assigned', value: selfTasks, color: '#007bff' },
    { name: 'Assigned by Others', value: assignedTasks, color: '#6f42c1' }
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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
        No task data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width={400} height={400} aspect={1}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {/* <Tooltip content={<CustomTooltip />} /> */}
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ textAlign: 'center' }}
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontWeight: 'bold' }}>
                {value}: {entry.payload.value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SelfAssignedChart;