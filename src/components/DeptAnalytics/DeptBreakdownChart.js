import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DeptBreakdownChart = ({ data, title }) => {
  // Transform data for the chart
  const chartData = Object.entries(data).map(([dept, count]) => ({
    department: dept,
    tasks: count
  }));

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
        No department data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff' }}>
            {label}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            Tasks: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width={500} height={500} aspect={1}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60
        }}
      >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="department"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ textAlign: 'center', width: '100%' }}
          />
          <Bar
            dataKey="tasks"
            fill="#007bff"
            name="Total Tasks"
            radius={[4, 4, 0, 0]}
            label={{
              position: 'insideTop',
              fill: 'white',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          />
        </BarChart>
    </ResponsiveContainer>
  );
};

export default DeptBreakdownChart;