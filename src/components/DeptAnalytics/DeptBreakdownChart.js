import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LabelList
} from 'recharts';

const DeptBreakdownChart = ({ data, title }) => {

  console.log("Dept Chart Raw Data:", data);

  // Safe transformation
  const chartData = data
    ? Object.entries(data).map(([dept, count]) => ({
        department: dept,
        tasks: count
      }))
    : [];

  console.log("Dept Chart Formatted Data:", chartData);

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
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
          background: '#fff',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px'
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
    <div
      style={{
        width: "100%",
        height: 400,
        minHeight: 400,
      }}
    >
      <BarChart
        width={450}
        height={400}
        data={chartData}
        margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="department"
          angle={-45}
          textAnchor="end"
          interval={0}
        />
        <YAxis />
        {/* <Tooltip content={<CustomTooltip />} /> */}
        {/* <Legend /> */}
        <Bar dataKey="tasks" fill="#4e53ed" name="Total Tasks">
          <LabelList 
            dataKey="tasks" 
            position="insideTop" 
            style={{ fill: "#ffffff", fontWeight: "bold" }}
          />
        </Bar>
      </BarChart>
    </div>
  );
};

export default DeptBreakdownChart;
