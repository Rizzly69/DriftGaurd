import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingDown, Waves } from 'lucide-react';

const generateCovariateData = () => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    const baseAge = 55;
    const baseBMI = 26;
    const shift = i > 35 ? (i - 35) * 0.3 : 0;
    data.push({
      sample: i,
      age_mean: baseAge + shift + (Math.random() - 0.5) * 3,
      bmi_mean: baseBMI + shift * 0.5 + (Math.random() - 0.5) * 2,
      baseline_age: baseAge,
      baseline_bmi: baseBMI,
    });
  }
  return data;
};

const generatePSIData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    month: `M${i + 1}`,
    psi: i < 8 ? 0.02 + Math.random() * 0.03 : i < 16 ? 0.05 + Math.random() * 0.06 : 0.12 + Math.random() * 0.08,
    threshold: 0.1,
  }));
};

const generateConceptDriftData = () => {
  return Array.from({ length: 40 }, (_, i) => ({
    window: i + 1,
    error_rate: i < 15 ? 3 + Math.random() * 1.5 : i < 25 ? 5 + Math.random() * 3 + (i - 15) * 0.3 : 8 + Math.random() * 4,
    drift_signal: i < 15 ? 0.1 + Math.random() * 0.1 : i < 25 ? 0.3 + Math.random() * 0.2 : 0.6 + Math.random() * 0.3,
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
          <span className="font-mono font-medium text-foreground">{typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DriftDetection() {
  const covariateData = React.useMemo(generateCovariateData, []);
  const psiData = React.useMemo(generatePSIData, []);
  const conceptData = React.useMemo(generateConceptDriftData, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Drift Detection</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time monitoring of data and concept drift indicators</p>
      </div>

      <Tabs defaultValue="covariate" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="covariate" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Covariate Shift</TabsTrigger>
          <TabsTrigger value="psi" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Population Stability</TabsTrigger>
          <TabsTrigger value="concept" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Concept Drift</TabsTrigger>
        </TabsList>

        <TabsContent value="covariate" className="mt-6 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Patient Age Distribution Shift</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mean age per sampling window · <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">Drift detected at sample 36</Badge>
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={covariateData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="ageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(187, 92%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
                <XAxis dataKey="sample" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="age_mean" name="Age Mean" stroke="hsl(187, 92%, 55%)" fill="url(#ageGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="baseline_age" name="Baseline" stroke="hsl(0, 72%, 55%)" fill="none" strokeWidth={1} strokeDasharray="6 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">BMI Distribution Shift</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Mean BMI per sampling window</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={covariateData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
                <XAxis dataKey="sample" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="bmi_mean" name="BMI Mean" stroke="hsl(160, 84%, 45%)" fill="url(#bmiGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="baseline_bmi" name="Baseline" stroke="hsl(0, 72%, 55%)" fill="none" strokeWidth={1} strokeDasharray="6 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="psi" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Waves className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Population Stability Index (PSI)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly PSI values · <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Threshold: 0.1</Badge>
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={psiData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="psiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(35, 92%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(35, 92%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="psi" name="PSI" stroke="hsl(35, 92%, 55%)" fill="url(#psiGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="threshold" name="Threshold" stroke="hsl(0, 72%, 55%)" fill="none" strokeWidth={1} strokeDasharray="6 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="concept" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Concept Drift Signal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Error rate and drift detection signal over sliding windows</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={conceptData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(270, 70%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(270, 70%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
                <XAxis dataKey="window" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="error_rate" name="Error Rate %" stroke="hsl(270, 70%, 60%)" fill="url(#errGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="drift_signal" name="Drift Signal" stroke="hsl(0, 72%, 55%)" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}