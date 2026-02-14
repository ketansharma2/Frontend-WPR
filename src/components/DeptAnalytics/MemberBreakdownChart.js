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

const MemberBreakdownChart = ({ data, title }) => {

  // Safe transformation (prevents crash if data undefined)
  const chartData = data
    ? Object.entries(data).map(([member, count]) => ({
        member: member,
        tasks: count
      }))
    : [];

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
        No member data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#28a745' }}>
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
        margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="member"
          angle={-45}
          textAnchor="end"
          interval={0}
        />

        <YAxis />

        {/* <Tooltip content={<CustomTooltip />} /> */}

        {/* <Legend /> */}

        <Bar
          dataKey="tasks"
          fill="#4e53ed"
          name="Total Tasks"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="tasks"
            position="insideTop"
            style={{ fill: "#fff", fontWeight: "bold" }}
          />
        </Bar>
      </BarChart>
    </div>
  );
};

export default MemberBreakdownChart;
