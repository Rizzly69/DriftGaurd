import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  computeMMD, computeKSStatistic, computePSI, computeSPCLimits,
  computeCUSUM, computeADWIN, generateNormalSamples,
  interpretPSI, interpretMMD
} from '@/lib/driftEquations';
import { FlaskConical, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-mono font-medium text-foreground">{typeof e.value === 'number' ? e.value.toFixed(4) : e.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── MMD Panel ───────────────────────────────────────────────────────────────
function MMDPanel() {
  const [shift, setShift] = useState([2.0]);
  const [sigma, setSigma] = useState([1.0]);
  const [seed, setSeed] = useState(0);

  const { mmd2, interpretation, histData } = useMemo(() => {
    const P = generateNormalSamples(60, 8, 60);
    const Q = generateNormalSamples(60 + shift[0], 8, 60);
    const mmd2 = computeMMD(P.slice(0, 20), Q.slice(0, 20), sigma[0]);
    const interpretation = interpretMMD(mmd2, 0.05);
    const bins = 20;
    const min = 30, max = 90;
    const binW = (max - min) / bins;
    const histData = Array.from({ length: bins }, (_, i) => {
      const lo = min + i * binW, hi = lo + binW;
      return {
        bin: lo.toFixed(0),
        baseline: P.filter(x => x >= lo && x < hi).length,
        current: Q.filter(x => x >= lo && x < hi).length,
      };
    });
    return { mmd2, interpretation, histData };
  }, [shift, sigma, seed]);

  return (
    <div className="space-y-6">
      <div className="bg-card/60 rounded-xl border border-border p-4 font-mono text-sm text-muted-foreground">
        <span className="text-primary">MMD²</span>(P,Q) = E[k(x,x')] − 2·E[k(x,y)] + E[k(y,y')]<br />
        <span className="text-muted-foreground/60 text-xs">where k(x,y) = exp(−‖x−y‖² / 2σ²) &nbsp;&nbsp;[RBF kernel]</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">Distribution Shift (Δμ): <span className="text-foreground font-mono">{shift[0].toFixed(1)}</span></Label>
            <Slider min={0} max={10} step={0.5} value={shift} onValueChange={setShift} className="w-full" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">Kernel Bandwidth (σ): <span className="text-foreground font-mono">{sigma[0].toFixed(1)}</span></Label>
            <Slider min={0.5} max={5} step={0.5} value={sigma} onValueChange={setSigma} className="w-full" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSeed(s => s + 1)} className="gap-2">
            <RefreshCw className="w-3 h-3" /> Resample
          </Button>
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-mono">MMD² score</span>
              <span className="text-lg font-mono font-bold text-foreground">{mmd2.toFixed(5)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Threshold</span>
              <span className="text-xs font-mono text-muted-foreground">0.05000</span>
            </div>
            <div className="pt-1 border-t border-border">
              <span className={`text-sm font-semibold ${interpretation.color}`}>{interpretation.level}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-3">Baseline (P) vs. Current (Q) distributions</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histData} barGap={2} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" vertical={false} />
              <XAxis dataKey="bin" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="baseline" name="Baseline P" fill="hsl(187,92%,55%)" fillOpacity={0.7} radius={[3,3,0,0]} barSize={8} />
              <Bar dataKey="current" name="Current Q" fill="hsl(340,75%,55%)" fillOpacity={0.7} radius={[3,3,0,0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── K-S Panel ────────────────────────────────────────────────────────────────
function KSPanel() {
  const [shift, setShift] = useState([1.5]);
  const [seed, setSeed] = useState(0);

  const { result, cdfData } = useMemo(() => {
    const s1 = generateNormalSamples(65, 10, 80).sort((a, b) => a - b);
    const s2 = generateNormalSamples(65 + shift[0], 10, 80).sort((a, b) => a - b);
    const result = computeKSStatistic(s1, s2);
    const allVals = [...new Set([...s1, ...s2])].sort((a, b) => a - b).filter((_, i) => i % 3 === 0);
    const n1 = s1.length, n2 = s2.length;
    const cdfData = allVals.map(v => ({
      val: v.toFixed(1),
      cdf1: s1.filter(x => x <= v).length / n1,
      cdf2: s2.filter(x => x <= v).length / n2,
      gap: Math.abs(s1.filter(x => x <= v).length / n1 - s2.filter(x => x <= v).length / n2),
    }));
    return { result, cdfData };
  }, [shift, seed]);

  return (
    <div className="space-y-6">
      <div className="bg-card/60 rounded-xl border border-border p-4 font-mono text-sm text-muted-foreground">
        <span className="text-primary">D</span> = sup<sub>x</sub> |F₁(x) − F₂(x)|<br />
        <span className="text-muted-foreground/60 text-xs">Critical value (α=0.05): 1.36 / √(n·m/(n+m))</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">Mean Shift: <span className="text-foreground font-mono">{shift[0].toFixed(1)}</span></Label>
            <Slider min={0} max={8} step={0.5} value={shift} onValueChange={setShift} className="w-full" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSeed(s => s + 1)} className="gap-2">
            <RefreshCw className="w-3 h-3" /> Resample
          </Button>
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground font-mono">D statistic</span><span className="text-lg font-mono font-bold">{result.statistic.toFixed(4)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Critical value</span><span className="text-xs font-mono text-amber-400">{result.criticalValue.toFixed(4)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">p-value</span><span className="text-xs font-mono">{result.pValue.toFixed(4)}</span></div>
            <div className="pt-1 border-t border-border">
              {result.driftDetected
                ? <span className="text-sm font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Drift Detected (D &gt; critical)</span>
                : <span className="text-sm font-semibold text-accent flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> No Significant Drift</span>
              }
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-3">Empirical CDFs — gap between curves is D</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={cdfData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" />
              <XAxis dataKey="val" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="cdf1" name="F₁ (Baseline)" stroke="hsl(187,92%,55%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cdf2" name="F₂ (Current)" stroke="hsl(340,75%,55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── PSI Panel ────────────────────────────────────────────────────────────────
function PSIPanel() {
  const [shift, setShift] = useState([3.0]);
  const [seed, setSeed] = useState(0);

  const { psiResult, contribData } = useMemo(() => {
    const baseline = generateNormalSamples(60, 8, 500);
    const current = generateNormalSamples(60 + shift[0], 8, 500);
    const psiResult = computePSI(baseline, current, 12);
    const contribData = psiResult.contributions.map(c => ({ ...c, contribution: Math.abs(c.contribution) }));
    return { psiResult, contribData };
  }, [shift, seed]);

  const interp = interpretPSI(psiResult.psi);

  return (
    <div className="space-y-6">
      <div className="bg-card/60 rounded-xl border border-border p-4 font-mono text-sm text-muted-foreground">
        <span className="text-primary">PSI</span> = Σ (Actual% − Expected%) × ln(Actual% / Expected%)<br />
        <span className="text-muted-foreground/60 text-xs">PSI &lt; 0.1: stable &nbsp;·&nbsp; 0.1–0.2: moderate &nbsp;·&nbsp; &gt; 0.2: major shift</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">Population Shift: <span className="text-foreground font-mono">{shift[0].toFixed(1)}</span></Label>
            <Slider min={0} max={15} step={1} value={shift} onValueChange={setShift} className="w-full" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSeed(s => s + 1)} className="gap-2">
            <RefreshCw className="w-3 h-3" /> Resample
          </Button>
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground font-mono">PSI score</span><span className="text-2xl font-mono font-bold">{psiResult.psi.toFixed(4)}</span></div>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
              <div className={`h-2 rounded-full transition-all ${psiResult.psi < 0.1 ? 'bg-accent' : psiResult.psi < 0.2 ? 'bg-amber-400' : 'bg-destructive'}`} style={{ width: `${Math.min(100, psiResult.psi / 0.3 * 100)}%` }} />
            </div>
            <div className="pt-1 border-t border-border">
              <span className={`text-sm font-semibold ${interp.color}`}>{interp.level}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{interp.description}</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-3">PSI contribution per bin</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contribData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" vertical={false} />
              <XAxis dataKey="bin" tick={{ fontSize: 8, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="contribution" name="PSI Contribution" fill="hsl(35,92%,55%)" radius={[4,4,0,0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── SPC Panel ────────────────────────────────────────────────────────────────
function SPCPanel() {
  const [driftStart, setDriftStart] = useState([35]);
  const [seed, setSeed] = useState(0);

  const { spcData, limits, cusumData } = useMemo(() => {
    const baseline = generateNormalSamples(93, 1.2, 30);
    const limits = computeSPCLimits(baseline);
    const stream = Array.from({ length: 60 }, (_, i) => {
      const drift = i >= driftStart[0] ? (i - driftStart[0]) * 0.15 : 0;
      return 93 - drift + (Math.random() - 0.5) * 2.4;
    });
    const spcData = stream.map((val, i) => ({
      sample: i + 1,
      value: val,
      ucl: limits.ucl,
      lcl: limits.lcl,
      mean: limits.mean,
      violation: val > limits.ucl || val < limits.lcl,
    }));
    const cusumResults = computeCUSUM(stream, limits.mean, limits.std);
    const cusumData = cusumResults.map((r, i) => ({
      sample: i + 1,
      cPlus: r.cPlus,
      cMinus: r.cMinus,
      threshold: r.decisionInterval,
      alarm: r.alarm,
    }));
    return { spcData, limits, cusumData };
  }, [driftStart, seed]);

  const violations = spcData.filter(d => d.violation).length;

  return (
    <div className="space-y-6">
      <div className="bg-card/60 rounded-xl border border-border p-4 font-mono text-sm text-muted-foreground">
        <span className="text-primary">UCL</span> = μ + 3σ &nbsp;&nbsp; <span className="text-primary">LCL</span> = μ − 3σ<br />
        <span className="text-primary">CUSUM:</span> C⁺ = max(0, C⁺ₙ₋₁ + (xₙ − μ − k)) &nbsp;·&nbsp; k = 0.5σ, h = 5σ
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-3 block">Drift onset at sample: <span className="text-foreground font-mono">{driftStart[0]}</span></Label>
        <Slider min={10} max={55} step={1} value={driftStart} onValueChange={setDriftStart} className="w-full max-w-sm" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">UCL</p>
          <p className="font-mono font-bold text-sm text-foreground">{limits.ucl.toFixed(2)}</p>
        </div>
        <div className="bg-secondary/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Mean (μ)</p>
          <p className="font-mono font-bold text-sm text-foreground">{limits.mean.toFixed(2)}</p>
        </div>
        <div className="bg-secondary/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Violations</p>
          <p className={`font-mono font-bold text-sm ${violations > 0 ? 'text-destructive' : 'text-accent'}`}>{violations}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-3">X-bar Control Chart</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={spcData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" />
            <XAxis dataKey="sample" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="ucl" name="UCL" stroke="hsl(0,72%,55%)" strokeWidth={1} strokeDasharray="5 3" dot={false} />
            <Line type="monotone" dataKey="lcl" name="LCL" stroke="hsl(0,72%,55%)" strokeWidth={1} strokeDasharray="5 3" dot={false} />
            <Line type="monotone" dataKey="mean" name="Mean" stroke="hsl(187,92%,55%)" strokeWidth={1} strokeDasharray="3 2" dot={false} />
            <Line type="monotone" dataKey="value" name="Value" stroke="hsl(160,84%,45%)" strokeWidth={1.5} dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload.violation) return null;
              return <circle key={cx} cx={cx} cy={cy} r={4} fill="hsl(0,72%,55%)" />;
            }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-3">CUSUM Chart — C⁺ and C⁻ vs. Decision Interval</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={cusumData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" />
            <XAxis dataKey="sample" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="cPlus" name="C⁺" stroke="hsl(187,92%,55%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="cMinus" name="C⁻" stroke="hsl(270,70%,60%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="threshold" name="Decision h" stroke="hsl(0,72%,55%)" strokeWidth={1} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── ADWIN Panel ──────────────────────────────────────────────────────────────
function ADWINPanel() {
  const [driftAt, setDriftAt] = useState([50]);
  const [delta, setDelta] = useState([0.002]);
  const [seed, setSeed] = useState(0);

  const { adwinData, driftPoints } = useMemo(() => {
    const stream = Array.from({ length: 100 }, (_, i) => {
      const mean = i >= driftAt[0] ? 93 - (i - driftAt[0]) * 0.2 : 93;
      return mean + (Math.random() - 0.5) * 3;
    });
    const { results, driftPoints } = computeADWIN(stream, delta[0]);
    const adwinData = results.map(r => ({
      index: r.index,
      value: r.value,
      windowMean: r.windowMean,
      windowSize: r.windowSize,
      drift: r.driftDetected ? r.value : null,
    }));
    return { adwinData, driftPoints };
  }, [driftAt, delta, seed]);

  return (
    <div className="space-y-6">
      <div className="bg-card/60 rounded-xl border border-border p-4 font-mono text-sm text-muted-foreground">
        <span className="text-primary">ε_cut</span> = √((1/|W₀| + 1/|W₁|) × ln(4|W|/δ) / 2)<br />
        <span className="text-muted-foreground/60 text-xs">Drift detected when |μ(W₀) − μ(W₁)| ≥ ε_cut &nbsp;·&nbsp; δ = confidence parameter</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">Drift at sample: <span className="text-foreground font-mono">{driftAt[0]}</span></Label>
            <Slider min={10} max={90} step={5} value={driftAt} onValueChange={setDriftAt} className="w-full" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">δ (confidence): <span className="text-foreground font-mono">{delta[0]}</span></Label>
            <Slider min={0.001} max={0.05} step={0.001} value={delta} onValueChange={setDelta} className="w-full" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSeed(s => s + 1)} className="gap-2">
            <RefreshCw className="w-3 h-3" /> Resample
          </Button>
          <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Drift points</span><span className="font-mono font-bold text-destructive">{driftPoints.length}</span></div>
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">First detected</span><span className="font-mono text-sm">{driftPoints.length > 0 ? `Sample ${driftPoints[0]}` : 'None'}</span></div>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-3">ADWIN stream — red dots = drift detections</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={adwinData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" />
              <XAxis dataKey="index" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} interval={9} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" name="Signal" stroke="hsl(187,92%,55%)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="windowMean" name="Window μ" stroke="hsl(160,84%,45%)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="drift" name="Drift" stroke="hsl(0,72%,55%)" dot={{ r: 5, fill: 'hsl(0,72%,55%)' }} strokeWidth={0} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EquationEngine() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Drift Equation Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live computation of all drift detection algorithms with interactive parameters</p>
        </div>
      </div>

      <Tabs defaultValue="mmd" className="w-full">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="mmd" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">MMD</TabsTrigger>
          <TabsTrigger value="ks" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">K-S Test</TabsTrigger>
          <TabsTrigger value="psi" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">PSI</TabsTrigger>
          <TabsTrigger value="spc" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">SPC / CUSUM</TabsTrigger>
          <TabsTrigger value="adwin" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">ADWIN</TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card rounded-2xl border border-border p-6">
          <TabsContent value="mmd"><MMDPanel /></TabsContent>
          <TabsContent value="ks"><KSPanel /></TabsContent>
          <TabsContent value="psi"><PSIPanel /></TabsContent>
          <TabsContent value="spc"><SPCPanel /></TabsContent>
          <TabsContent value="adwin"><ADWINPanel /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}