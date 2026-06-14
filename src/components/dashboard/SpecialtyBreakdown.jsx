import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const specialtyData = [
  { specialty: 'Laparoscopic', baseline: 96.8, current: 92.3, drop: 4.5 },
  { specialty: 'Cardiac', baseline: 97.2, current: 91.2, drop: 6.0 },
  { specialty: 'Neuro', baseline: 95.5, current: 91.5, drop: 4.0 },
  { specialty: 'Orthopedic', baseline: 96.0, current: 90.8, drop: 5.2 },
  { specialty: 'General', baseline: 97.0, current: 92.5, drop: 4.5 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function SpecialtyBreakdown() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-foreground">Specialty Performance</h3>
        <p className="text-xs text-muted-foreground mt-1">Baseline vs. current accuracy by surgical domain</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={specialtyData} barGap={4} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" vertical={false} />
          <XAxis dataKey="specialty" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <YAxis domain={[85, 100]} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="baseline" name="Baseline" fill="hsl(187, 92%, 55%)" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="current" name="Current" fill="hsl(187, 92%, 55%, 0.3)" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {specialtyData.map((item) => (
          <div key={item.specialty} className="text-center">
            <span className="text-xs font-mono text-destructive font-medium">-{item.drop}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}