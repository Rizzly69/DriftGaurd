const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GitBranch, RotateCcw, Star, Eye, ArrowUpCircle, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const statusStyles = {
  active: 'bg-accent/10 text-accent border-accent/20',
  shadow: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  archived: 'bg-muted text-muted-foreground border-border',
  rollback_candidate: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
};

const statusLabels = {
  active: 'Active', shadow: 'Shadow', archived: 'Archived', rollback_candidate: 'Rollback Candidate',
};

function MetricBar({ label, value, max = 100, good = 'high' }) {
  const pct = (value / max) * 100;
  const color = good === 'high'
    ? value >= 94 ? 'bg-accent' : value >= 90 ? 'bg-amber-400' : 'bg-destructive'
    : value <= 80 ? 'bg-accent' : value <= 120 ? 'bg-amber-400' : 'bg-destructive';

  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="font-mono text-foreground">{value}{good === 'low' ? 'ms' : '%'}</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export default function ModelRegistry() {
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [confirmRollback, setConfirmRollback] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['model-versions'],
    queryFn: () => db.entities.ModelVersion.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.ModelVersion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-versions'] });
      toast.success('Model status updated');
      setConfirmRollback(null);
    },
  });

  const handlePromote = (version) => {
    const currentActive = versions.find(v => v.specialty === version.specialty && v.status === 'active');
    if (currentActive) {
      updateMutation.mutate({ id: currentActive.id, data: { status: 'archived', is_current: false } });
    }
    updateMutation.mutate({ id: version.id, data: { status: 'active', is_current: true } });
    toast.success(`${version.model_id} ${version.version} promoted to active`);
  };

  const handleRollback = (version) => {
    handlePromote(version);
    toast.success(`Rolled back to ${version.model_id} ${version.version}`);
  };

  const filtered = versions.filter(v => specialtyFilter === 'all' || v.specialty === specialtyFilter);

  const grouped = filtered.reduce((acc, v) => {
    const key = v.model_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Model Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Version history, promotion, and rollback for all AI models</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-44 bg-card text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {['laparoscopic', 'cardiac', 'neurosurgery', 'orthopedic', 'general'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GitBranch className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No model versions found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([modelId, modelVersions]) => (
            <div key={modelId}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-heading font-semibold text-foreground">{modelId}</h3>
                <Badge variant="outline" className="text-[10px] capitalize border-border text-muted-foreground">
                  {modelVersions[0]?.specialty}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {modelVersions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-card rounded-xl border p-4 ${v.status === 'active' ? 'border-accent/30' : 'border-border'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{v.version}</span>
                        {v.status === 'active' && <Star className="w-3.5 h-3.5 text-accent fill-accent" />}
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyles[v.status]}`}>
                        {statusLabels[v.status]}
                      </Badge>
                    </div>

                    {v.changelog && (
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{v.changelog}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {v.accuracy && <MetricBar label="Accuracy" value={v.accuracy} />}
                      {v.f1_score && <MetricBar label="F1 Score" value={v.f1_score} />}
                      {v.latency_ms && <MetricBar label="Latency" value={v.latency_ms} max={200} good="low" />}
                    </div>

                    {v.created_date && (
                      <p className="text-[10px] font-mono text-muted-foreground mb-3">
                        {format(new Date(v.created_date), 'MMM d, yyyy')}
                        {v.training_samples && ` · ${v.training_samples.toLocaleString()} samples`}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {v.status === 'shadow' && (
                        <Button size="sm" className="flex-1 h-7 text-xs bg-accent/10 text-accent hover:bg-accent/20 border-0 gap-1" onClick={() => handlePromote(v)}>
                          <ArrowUpCircle className="w-3 h-3" /> Promote
                        </Button>
                      )}
                      {v.status === 'archived' && (
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => setConfirmRollback(v)}>
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </Button>
                      )}
                      {v.status === 'rollback_candidate' && (
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-amber-400 border-amber-400/30 hover:bg-amber-400/10 gap-1" onClick={() => setConfirmRollback(v)}>
                          <RotateCcw className="w-3 h-3" /> Quick Rollback
                        </Button>
                      )}
                      {v.status === 'active' && (
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 cursor-default opacity-60" disabled>
                          <Eye className="w-3 h-3" /> Current
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!confirmRollback} onOpenChange={() => setConfirmRollback(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Rollback</DialogTitle>
            <DialogDescription>
              Roll back to <strong>{confirmRollback?.model_id} {confirmRollback?.version}</strong>? The current active model will be archived.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmRollback(null)}>Cancel</Button>
            <Button className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-0" onClick={() => handleRollback(confirmRollback)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Confirm Rollback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}