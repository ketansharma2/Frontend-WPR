import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell,
  LabelList
} from 'recharts';

const HodTeamChart = ({ data, teamMembers, currentUserName }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: '#666',
          fontSize: '14px'
        }}
      >
        No team data available
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.tasks - a.tasks);

  const getBarColor = (index) => {
    if (index === 0) return '#8b5cf6';
    const blueShades = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    return blueShades[index % blueShades.length];
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      <BarChart
        width={400}
        height={220}
        data={sortedData}
        margin={{ top: 15, right: 15, left: 10, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          interval={0}
          tick={{ fontSize: 10, fill: '#374151' }}
          height={50}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#374151' }}
          allowDecimals={false}
        />
        <Bar dataKey="tasks" name="Tasks" radius={[4, 4, 0, 0]}>
          <LabelList 
            dataKey="tasks" 
            position="insideTop" 
            style={{ fill: "#ffffff", fontWeight: "bold", fontSize: "11px" }}
          />
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
};

export default HodTeamChart;
