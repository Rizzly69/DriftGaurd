import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const generateTimelineData = () => {
  const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12',
                   'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24'];
  return months.map((month, i) => ({
    month,
    accuracy: Math.max(88, 97.2 - (i * 0.35) - (Math.random() * 0.5)),
    precision: Math.max(86, 96.5 - (i * 0.38) - (Math.random() * 0.6)),
    recall: Math.max(85, 95.8 - (i * 0.4) - (Math.random() * 0.4)),
    threshold: 92,
  }));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-mono text-muted-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function PerformanceTimeline() {
  const data = React.useMemo(() => generateTimelineData(), []);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading font-semibold text-foreground">Performance Degradation Timeline</h3>
          <p className="text-xs text-muted-foreground mt-1">24-month AI model performance tracking</p>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Accuracy', color: 'hsl(187, 92%, 55%)' },
            { label: 'Precision', color: 'hsl(160, 84%, 45%)' },
            { label: 'Recall', color: 'hsl(270, 70%, 60%)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <YAxis domain={[84, 100]} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={92} stroke="hsl(0, 72%, 55%)" strokeDasharray="6 4" strokeWidth={1} label={{ value: 'Threshold', position: 'right', fontSize: 10, fill: 'hsl(0, 72%, 55%)' }} />
          <Line type="monotone" dataKey="accuracy" stroke="hsl(187, 92%, 55%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="precision" stroke="hsl(160, 84%, 45%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="recall" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}