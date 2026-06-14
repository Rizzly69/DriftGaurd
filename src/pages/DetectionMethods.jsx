import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap } from 'lucide-react';

const methods = [
  {
    name: 'MMD',
    fullName: 'Maximum Mean Discrepancy',
    sensitivity: 0.89,
    specificity: 0.92,
    latency_days: 7,
    description: 'Kernel-based test for comparing two distributions. Best for detecting subtle covariate shifts in high-dimensional data.',
    bestFor: 'Covariate Shift',
    recommended: true,
  },
  {
    name: 'K-S Test',
    fullName: 'Kolmogorov-Smirnov Test',
    sensitivity: 0.82,
    specificity: 0.88,
    latency_days: 12,
    description: 'Non-parametric test comparing cumulative distributions. Effective for univariate feature drift detection.',
    bestFor: 'Data Drift',
    recommended: false,
  },
  {
    name: 'PSI',
    fullName: 'Population Stability Index',
    sensitivity: 0.78,
    specificity: 0.85,
    latency_days: 14,
    description: 'Measures the shift in population distributions over time. Widely used in production ML monitoring.',
    bestFor: 'Population Shift',
    recommended: false,
  },
  {
    name: 'SPC',
    fullName: 'Statistical Process Control',
    sensitivity: 0.75,
    specificity: 0.90,
    latency_days: 10,
    description: 'Control charts monitoring KPIs for out-of-bound deviations. Reliable for sudden performance drops.',
    bestFor: 'Sudden Drift',
    recommended: false,
  },
  {
    name: 'ADWIN',
    fullName: 'Adaptive Windowing',
    sensitivity: 0.85,
    specificity: 0.86,
    latency_days: 9,
    description: 'Adaptive sliding window algorithm for detecting concept drift. Automatically adjusts window size based on data.',
    bestFor: 'Concept Drift',
    recommended: false,
  },
];

const radarData = methods.map(m => ({
  method: m.name,
  Sensitivity: m.sensitivity * 100,
  Specificity: m.specificity * 100,
  Speed: Math.max(0, 100 - (m.latency_days * 5)),
}));

const comparisonData = methods.map(m => ({
  name: m.name,
  sensitivity: (m.sensitivity * 100).toFixed(0),
  specificity: (m.specificity * 100).toFixed(0),
  latency: m.latency_days,
}));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">{entry.value}{entry.name === 'Latency' ? ' days' : '%'}</span>
        </div>
      ))}
    </div>
  );
};

export default function DetectionMethods() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Detection Methods</h1>
        <p className="text-sm text-muted-foreground mt-1">Comparison of drift detection algorithms and their performance characteristics</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-semibold text-foreground mb-1">Method Comparison Radar</h3>
          <p className="text-xs text-muted-foreground mb-4">Sensitivity, specificity, and detection speed</p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(222, 30%, 18%)" />
              <PolarAngleAxis dataKey="method" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(215, 20%, 55%)' }} domain={[0, 100]} />
              <Radar name="Sensitivity" dataKey="Sensitivity" stroke="hsl(187, 92%, 55%)" fill="hsl(187, 92%, 55%)" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Specificity" dataKey="Specificity" stroke="hsl(160, 84%, 45%)" fill="hsl(160, 84%, 45%)" fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Speed" dataKey="Speed" stroke="hsl(270, 70%, 60%)" fill="hsl(270, 70%, 60%)" fillOpacity={0.1} strokeWidth={2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-semibold text-foreground mb-1">Detection Latency</h3>
          <p className="text-xs text-muted-foreground mb-4">Days to detect drift after onset</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="latency" name="Latency" fill="hsl(187, 92%, 55%)" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {methods.map((method) => (
          <div key={method.name} className={`bg-card rounded-2xl border p-5 transition-colors ${method.recommended ? 'border-primary/40 hover:border-primary/60' : 'border-border hover:border-primary/20'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-foreground">{method.name}</h3>
                  {method.recommended && (
                    <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 border-0">
                      <Zap className="w-2.5 h-2.5 mr-0.5" /> Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{method.fullName}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/80 mb-4 leading-relaxed">{method.description}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Sensitivity</p>
                <p className="text-sm font-mono font-medium text-foreground mt-0.5">{(method.sensitivity * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Specificity</p>
                <p className="text-sm font-mono font-medium text-foreground mt-0.5">{(method.specificity * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Latency</p>
                <p className="text-sm font-mono font-medium text-foreground mt-0.5">{method.latency_days}d</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{method.bestFor}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}