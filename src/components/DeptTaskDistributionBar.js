import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DeptTaskDistributionBar({ selectedDept, breakdown }) {
  let data = [];
  if (selectedDept === 'all' && breakdown) {
    data = Object.entries(breakdown).map(([dept, count]) => ({
      name: dept.charAt(0).toUpperCase() + dept.slice(1),
      value: count
    }));
  } else if (selectedDept !== 'all' && breakdown) {
    data = Object.entries(breakdown).map(([name, count]) => ({
      name,
      value: count
    }));
  }

  return (
    <div
      style={{
        width: "600px",
        height: "auto",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        gap: "50px",
        alignItems: "center",
        flexDirection: "column",
        borderRadius: "16px",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h3
        style={{
          marginBottom: "10px",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        {selectedDept === 'all' ? 'Task Distribution by Department' : `Task Distribution in ${selectedDept.charAt(0).toUpperCase() + selectedDept.slice(1)} Department`}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    
  );
}