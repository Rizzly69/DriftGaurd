import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const driftTypes = [
  { name: 'Covariate Shift', value: 42, color: 'hsl(187, 92%, 55%)' },
  { name: 'Concept Drift', value: 28, color: 'hsl(160, 84%, 45%)' },
  { name: 'Label Shift', value: 18, color: 'hsl(270, 70%, 60%)' },
  { name: 'Data Drift', value: 12, color: 'hsl(35, 92%, 55%)' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.color }} />
        <span className="text-xs text-foreground font-medium">{payload[0].name}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-mono">{payload[0].value}% of events</p>
    </div>
  );
};

export default function DriftDistribution() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="mb-4">
        <h3 className="font-heading font-semibold text-foreground">Drift Type Distribution</h3>
        <p className="text-xs text-muted-foreground mt-1">Breakdown of detected drift categories</p>
      </div>

      <div className="flex items-center gap-6">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={driftTypes}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {driftTypes.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-3">
          {driftTypes.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-mono font-medium text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}