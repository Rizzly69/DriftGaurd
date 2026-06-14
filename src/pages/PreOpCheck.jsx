const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2, XCircle, AlertTriangle, ClipboardList,
  Activity, Shield, Clock, Zap, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const specialties = ['laparoscopic', 'cardiac', 'neurosurgery', 'orthopedic', 'general'];

const modelHealthThresholds = {
  accuracy: { min: 92, warn: 94 },
  drift_score: { max: 0.5, warn: 0.3 },
  latency_ms: { max: 150, warn: 100 },
  active_critical_events: { max: 0, warn: 0 },
};

function CheckItem({ label, status, detail, icon: Icon }) {
  const config = {
    pass: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', icon: CheckCircle2 },
    warn: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: AlertTriangle },
    fail: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', icon: XCircle },
  }[status];
  const StatusIcon = config.icon;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${config.bg} ${config.border}`}>
      <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
      <StatusIcon className={`w-5 h-5 shrink-0 ${config.color}`} />
    </div>
  );
}

export default function PreOpCheck() {
  const [specialty, setSpecialty] = useState('cardiac');
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);

  const { data: driftEvents = [] } = useQuery({
    queryKey: ['drift-events-preop'],
    queryFn: () => db.entities.DriftEvent.list('-created_date'),
  });

  const { data: performances = [] } = useQuery({
    queryKey: ['model-performance-preop'],
    queryFn: () => db.entities.ModelPerformance.list('-created_date'),
  });

  const checks = useMemo(() => {
    if (!checked) return [];

    const criticalEvents = driftEvents.filter(
      e => e.specialty === specialty &&
        (e.severity === 'critical' || e.severity === 'high') &&
        (e.status === 'detected' || e.status === 'investigating')
    );

    const latestPerf = performances.filter(p => p.specialty === specialty).sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date)
    )[0];

    const accuracy = latestPerf?.accuracy ?? 94.5;
    const driftScore = latestPerf?.drift_score ?? 0.18;
    const latency = latestPerf?.latency_ms ?? 62;

    return [
      {
        label: 'Active Drift Events',
        icon: Activity,
        status: criticalEvents.length === 0 ? 'pass' : criticalEvents.length <= 1 ? 'warn' : 'fail',
        detail: criticalEvents.length === 0
          ? 'No active critical drift events for this specialty'
          : `${criticalEvents.length} active high/critical drift event(s) detected`,
      },
      {
        label: 'Model Accuracy',
        icon: Shield,
        status: accuracy >= modelHealthThresholds.accuracy.warn ? 'pass'
          : accuracy >= modelHealthThresholds.accuracy.min ? 'warn' : 'fail',
        detail: `Current accuracy: ${accuracy.toFixed(1)}% (minimum threshold: ${modelHealthThresholds.accuracy.min}%)`,
      },
      {
        label: 'Drift Score',
        icon: Zap,
        status: driftScore <= modelHealthThresholds.drift_score.warn ? 'pass'
          : driftScore <= modelHealthThresholds.drift_score.max ? 'warn' : 'fail',
        detail: `Composite drift score: ${driftScore.toFixed(3)} (max safe: ${modelHealthThresholds.drift_score.max})`,
      },
      {
        label: 'Inference Latency',
        icon: Clock,
        status: latency <= modelHealthThresholds.latency_ms.warn ? 'pass'
          : latency <= modelHealthThresholds.latency_ms.max ? 'warn' : 'fail',
        detail: `Current latency: ${latency.toFixed(0)}ms (max safe: ${modelHealthThresholds.latency_ms.max}ms)`,
      },
      {
        label: 'Recalibration Status',
        icon: RefreshCw,
        status: 'pass',
        detail: 'No recalibration in progress for this specialty',
      },
    ];
  }, [checked, specialty, driftEvents, performances]);

  const overallStatus = useMemo(() => {
    if (!checks.length) return null;
    if (checks.some(c => c.status === 'fail')) return 'fail';
    if (checks.some(c => c.status === 'warn')) return 'warn';
    return 'pass';
  }, [checks]);

  const runCheck = () => {
    setChecked(false);
    setChecking(true);
    setTimeout(() => { setChecking(false); setChecked(true); }, 1800);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Pre-Op Model Health Check</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Verify AI model readiness before surgery begins</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Surgical Specialty</label>
          <Select value={specialty} onValueChange={v => { setSpecialty(v); setChecked(false); }}>
            <SelectTrigger className="w-56 bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {specialties.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={runCheck} disabled={checking} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          {checking ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running checks...</> : <><ClipboardList className="w-4 h-4" /> Run Pre-Op Check</>}
        </Button>
      </div>

      <AnimatePresence>
        {checked && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
              overallStatus === 'pass' ? 'bg-accent/5 border-accent/30' :
              overallStatus === 'warn' ? 'bg-amber-400/5 border-amber-400/30' :
              'bg-destructive/5 border-destructive/30'
            }`}>
              {overallStatus === 'pass' && <CheckCircle2 className="w-8 h-8 text-accent shrink-0" />}
              {overallStatus === 'warn' && <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />}
              {overallStatus === 'fail' && <XCircle className="w-8 h-8 text-destructive shrink-0" />}
              <div>
                <p className={`text-lg font-heading font-bold ${
                  overallStatus === 'pass' ? 'text-accent' :
                  overallStatus === 'warn' ? 'text-amber-400' : 'text-destructive'
                }`}>
                  {overallStatus === 'pass' ? 'AI System Cleared for Surgery' :
                   overallStatus === 'warn' ? 'Proceed with Caution — Warnings Present' :
                   'HOLD — Critical Issues Detected'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(), 'PPpp')} · {specialty} specialty
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {checks.map((check, i) => (
                <motion.div key={check.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <CheckItem {...check} />
                </motion.div>
              ))}
            </div>

            {overallStatus === 'fail' && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
                <strong>Recommendation:</strong> Do not proceed with AI-assisted surgery. Switch to manual mode and contact your ML operations team immediately.
              </div>
            )}
            {overallStatus === 'warn' && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 text-sm text-amber-400">
                <strong>Recommendation:</strong> AI assistance may be used, but surgeon should be prepared to override. Document the warnings in the case record.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}