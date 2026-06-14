import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingDown, Clock, Zap } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

const generatePerformanceData = (specialty) => {
  const baseAccuracy = { laparoscopic: 96.8, cardiac: 97.2, neurosurgery: 95.5, orthopedic: 96.0, general: 97.0 };
  const base = baseAccuracy[specialty] || 96.5;
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  return weeks.map(week => ({
    week: `W${week}`,
    accuracy: Math.max(88, base - (week * 0.15) - (Math.random() * 0.8)),
    f1: Math.max(86, (base - 1) - (week * 0.17) - (Math.random() * 0.6)),
    latency: Math.min(180, 45 + (week * 1.2) + (Math.random() * 5)),
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
          <span className="font-mono font-medium text-foreground">
            {entry.name === 'Latency' ? `${entry.value.toFixed(0)}ms` : `${entry.value.toFixed(1)}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Performance() {
  const [specialty, setSpecialty] = useState('cardiac');
  const data = React.useMemo(() => generatePerformanceData(specialty), [specialty]);

  const latestAccuracy = data[data.length - 1]?.accuracy || 0;
  const initialAccuracy = data[0]?.accuracy || 0;
  const degradation = (initialAccuracy - latestAccuracy).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Performance Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">52-week model performance analysis</p>
        </div>
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="laparoscopic">Laparoscopic</SelectItem>
            <SelectItem value="cardiac">Cardiac</SelectItem>
            <SelectItem value="neurosurgery">Neurosurgery</SelectItem>
            <SelectItem value="orthopedic">Orthopedic</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current Accuracy" value={`${latestAccuracy.toFixed(1)}%`} icon={Activity} accentColor="primary" />
        <StatCard title="Total Degradation" value={`-${degradation}%`} icon={TrendingDown} accentColor="destructive" />
        <StatCard title="Avg Latency" value={`${data[data.length - 1]?.latency.toFixed(0)}ms`} icon={Clock} accentColor="chart4" />
        <StatCard title="F1 Score" value={`${data[data.length - 1]?.f1.toFixed(1)}%`} icon={Zap} accentColor="accent" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-semibold text-foreground">Accuracy & F1 Score</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="text-[10px] mr-2">{specialty}</Badge>
              Weekly performance metrics
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="f1Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis domain={[82, 100]} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="accuracy" name="Accuracy" stroke="hsl(187, 92%, 55%)" fill="url(#accGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="f1" name="F1 Score" stroke="hsl(160, 84%, 45%)" fill="url(#f1Grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="mb-6">
          <h3 className="font-heading font-semibold text-foreground">Inference Latency</h3>
          <p className="text-xs text-muted-foreground mt-1">Response time degradation over time</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="latency" name="Latency" stroke="hsl(35, 92%, 55%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}