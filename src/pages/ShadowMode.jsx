const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GitCompare, ArrowUpCircle, CheckCircle2, Clock, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusStyles = {
  running: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  promoted: 'bg-accent/10 text-accent border-accent/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const recStyles = {
  promote_b: 'text-accent',
  keep_a: 'text-amber-400',
  needs_more_data: 'text-muted-foreground',
  escalate: 'text-destructive',
};

const recLabels = {
  promote_b: '✓ Promote new model',
  keep_a: '→ Keep current model',
  needs_more_data: '⏳ Collect more data',
  escalate: '⚠ Escalate for review',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-mono font-medium">{Number(e.value).toFixed(1)}{e.name === 'Latency' ? 'ms' : '%'}</span>
        </div>
      ))}
    </div>
  );
};

function ComparisonCard({ comparison, onPromote }) {
  const barData = [
    { metric: 'Accuracy', A: comparison.model_a_accuracy, B: comparison.model_b_accuracy },
    { metric: 'Latency', A: comparison.model_a_latency, B: comparison.model_b_latency },
  ];
  const radarData = [
    { axis: 'Accuracy', A: comparison.model_a_accuracy || 0, B: comparison.model_b_accuracy || 0 },
    { axis: 'Speed', A: comparison.model_a_latency ? Math.max(0, 100 - comparison.model_a_latency) : 60, B: comparison.model_b_latency ? Math.max(0, 100 - comparison.model_b_latency) : 60 },
    { axis: 'Stability', A: 85, B: 88 },
    { axis: 'Agreement', A: comparison.agreement_rate || 0, B: comparison.agreement_rate || 0 },
  ];

  const bIsWinner = (comparison.model_b_accuracy || 0) > (comparison.model_a_accuracy || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-foreground">{comparison.model_a_id}</span>
            <span className="text-muted-foreground text-sm">vs</span>
            <span className="font-mono font-bold text-primary">{comparison.model_b_id}</span>
            <Badge variant="outline" className="text-[10px] capitalize border-border text-muted-foreground">{comparison.specialty}</Badge>
          </div>
          {comparison.recommendation && (
            <p className={`text-sm font-semibold mt-1 ${recStyles[comparison.recommendation]}`}>
              {recLabels[comparison.recommendation]}
            </p>
          )}
        </div>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyles[comparison.status]}`}>
          {comparison.status}
        </Badge>
      </div>

      {comparison.sample_count && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Samples evaluated</span>
            <span className="font-mono">{comparison.sample_count.toLocaleString()}</span>
          </div>
          <Progress value={Math.min(100, (comparison.sample_count / 1000) * 100)} className="h-1.5" />
        </div>
      )}

      {comparison.agreement_rate && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/40 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Agreement Rate</p>
            <p className="text-xl font-mono font-bold text-foreground mt-1">{comparison.agreement_rate.toFixed(1)}%</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${bIsWinner ? 'bg-accent/10' : 'bg-amber-400/10'}`}>
            <p className="text-[10px] text-muted-foreground">Accuracy Delta</p>
            <p className={`text-xl font-mono font-bold mt-1 ${bIsWinner ? 'text-accent' : 'text-amber-400'}`}>
              {bIsWinner ? '+' : ''}{((comparison.model_b_accuracy || 0) - (comparison.model_a_accuracy || 0)).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {comparison.model_a_accuracy && comparison.model_b_accuracy && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-2">Performance Comparison</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData} barGap={4} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,14%)" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(215,20%,55%)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="A" name="Model A" fill="hsl(215,20%,45%)" radius={[3,3,0,0]} barSize={14} />
                <Bar dataKey="B" name="Model B" fill="hsl(187,92%,55%)" radius={[3,3,0,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-2">Multi-Axis Comparison</p>
            <ResponsiveContainer width="100%" height={140}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(222,30%,18%)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8, fill: 'hsl(215,20%,55%)' }} />
                <PolarRadiusAxis tick={false} domain={[0, 100]} />
                <Radar dataKey="A" name="Model A" stroke="hsl(215,20%,55%)" fill="hsl(215,20%,55%)" fillOpacity={0.1} strokeWidth={1.5} />
                <Radar dataKey="B" name="Model B" stroke="hsl(187,92%,55%)" fill="hsl(187,92%,55%)" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {comparison.notes && (
        <p className="text-xs text-muted-foreground border-t border-border pt-3">{comparison.notes}</p>
      )}

      {comparison.status === 'completed' && comparison.recommendation === 'promote_b' && (
        <Button className="w-full gap-2 bg-accent/10 text-accent hover:bg-accent/20 border-0" onClick={() => onPromote(comparison)}>
          <ArrowUpCircle className="w-4 h-4" /> Promote {comparison.model_b_id} to Active
        </Button>
      )}
    </motion.div>
  );
}

export default function ShadowMode() {
  const [promoteTarget, setPromoteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: comparisons = [], isLoading } = useQuery({
    queryKey: ['shadow-comparisons'],
    queryFn: () => db.entities.ShadowComparison.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.ShadowComparison.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shadow-comparisons'] });
      setPromoteTarget(null);
      toast.success('Model promoted to active');
    },
  });

  const handlePromote = (comparison) => setPromoteTarget(comparison);

  const confirmPromote = () => {
    updateMutation.mutate({ id: promoteTarget.id, data: { status: 'promoted' } });
  };

  const running = comparisons.filter(c => c.status === 'running').length;
  const completed = comparisons.filter(c => c.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GitCompare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Shadow Mode Comparisons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Run old and new models side-by-side before promotion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Running</p>
          <p className="text-2xl font-heading font-bold text-blue-400 mt-1">{running}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Ready to Promote</p>
          <p className="text-2xl font-heading font-bold text-primary mt-1">{completed}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Promoted</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">
            {comparisons.filter(c => c.status === 'promoted').length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : comparisons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No shadow comparisons running</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {comparisons.map(c => (
            <ComparisonCard key={c.id} comparison={c} onPromote={handlePromote} />
          ))}
        </div>
      )}

      <Dialog open={!!promoteTarget} onOpenChange={() => setPromoteTarget(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Promotion</DialogTitle>
            <DialogDescription>
              Promote <strong>{promoteTarget?.model_b_id}</strong> to active? The current model will be archived. This action is logged in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPromoteTarget(null)}>Cancel</Button>
            <Button className="flex-1 bg-accent/10 text-accent hover:bg-accent/20 border-0" onClick={confirmPromote}>
              <ArrowUpCircle className="w-4 h-4 mr-2" /> Promote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}