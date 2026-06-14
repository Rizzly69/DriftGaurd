const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, CheckCircle2, XCircle, HelpCircle, Clock, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-blue-500/10 text-blue-400', icon: User },
  validated: { label: 'Validated', color: 'bg-green-500/10 text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400', icon: XCircle },
  escalated: { label: 'Escalated', color: 'bg-purple-500/10 text-purple-400', icon: AlertTriangle },
};

const agreementConfig = {
  agree: { label: 'Agree', color: 'text-accent', icon: CheckCircle2 },
  disagree: { label: 'Disagree', color: 'text-destructive', icon: XCircle },
  uncertain: { label: 'Uncertain', color: 'text-amber-400', icon: HelpCircle },
};

const priorityStyles = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

export default function HITLAnnotationPage() {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [agreement, setAgreement] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const queryClient = useQueryClient();

  const { data: annotations = [], isLoading } = useQuery({
    queryKey: ['hitl-annotations'],
    queryFn: () => db.entities.HITLAnnotation.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.HITLAnnotation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hitl-annotations'] });
      setSelected(null);
      setNotes('');
      setAgreement('');
      toast.success('Annotation submitted successfully');
    },
  });

  const handleSubmitAnnotation = () => {
    if (!agreement) {
      toast.error('Please select an agreement level');
      return;
    }
    updateMutation.mutate({
      id: selected.id,
      data: {
        agreement,
        notes,
        annotation_status: 'validated',
        expert_label: agreement === 'agree' ? selected.model_prediction : 'Corrected by expert',
      },
    });
  };

  const handleEscalate = () => {
    updateMutation.mutate({ id: selected.id, data: { annotation_status: 'escalated' } });
    toast.info('Case escalated to senior reviewer');
  };

  const filtered = annotations.filter(a => filterStatus === 'all' || a.annotation_status === filterStatus);

  const pendingCount = annotations.filter(a => a.annotation_status === 'pending').length;
  const validatedCount = annotations.filter(a => a.annotation_status === 'validated').length;
  const disagreements = annotations.filter(a => a.agreement === 'disagree').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Human-in-the-Loop Validation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Expert annotation and validation of AI-flagged surgical samples</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-heading font-bold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Validated</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">{validatedCount}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Model Disagreements</p>
          <p className="text-2xl font-heading font-bold text-destructive mt-1">{disagreements}</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Used to trigger retraining</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['pending', 'in_review', 'validated', 'escalated', 'all'].map(s => (
          <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} size="sm" className={`text-xs ${filterStatus === s ? 'bg-primary/10 text-primary border-primary/30' : ''}`} onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'All' : statusConfig[s]?.label || s}
            {s !== 'all' && <span className="ml-1.5 font-mono text-[10px]">{annotations.filter(a => a.annotation_status === s).length}</span>}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Brain className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No annotations in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((ann, i) => {
              const Status = statusConfig[ann.annotation_status] || statusConfig.pending;
              const StatusIcon = Status.icon;
              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/20 transition-colors"
                  onClick={() => { setSelected(ann); setNotes(ann.notes || ''); setAgreement(ann.agreement || ''); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">{ann.sample_id}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityStyles[ann.priority]}`}>
                      {ann.priority}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{ann.model_id}</p>
                  <p className="text-xs text-muted-foreground">{ann.specialty}</p>
                  {ann.model_prediction && (
                    <div className="mt-3 p-2 rounded-lg bg-secondary/40">
                      <p className="text-[10px] text-muted-foreground">AI Prediction</p>
                      <p className="text-xs text-foreground mt-0.5 truncate">{ann.model_prediction}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${Status.color}`}>
                      {Status.label}
                    </Badge>
                    {ann.agreement && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${agreementConfig[ann.agreement]?.color} bg-transparent border-current/30`}>
                        {agreementConfig[ann.agreement]?.label}
                      </Badge>
                    )}
                    {ann.model_confidence && (
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto">{(ann.model_confidence * 100).toFixed(0)}% conf.</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">Review: {selected.sample_id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Model</p><p className="font-medium mt-0.5">{selected.model_id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Specialty</p><p className="font-medium mt-0.5">{selected.specialty}</p></div>
                  <div><p className="text-xs text-muted-foreground">Confidence</p><p className="font-mono font-medium mt-0.5">{selected.model_confidence ? `${(selected.model_confidence * 100).toFixed(0)}%` : 'N/A'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Priority</p><Badge variant="outline" className={`mt-0.5 text-[10px] ${priorityStyles[selected.priority]}`}>{selected.priority}</Badge></div>
                </div>
                {selected.model_prediction && (
                  <div className="p-3 rounded-xl bg-secondary/40">
                    <p className="text-xs text-muted-foreground mb-1">AI Model Prediction</p>
                    <p className="text-sm text-foreground">{selected.model_prediction}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Expert Assessment</label>
                  <Select value={agreement} onValueChange={setAgreement}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select agreement level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agree">✓ Agree with AI prediction</SelectItem>
                      <SelectItem value="disagree">✗ Disagree — correction needed</SelectItem>
                      <SelectItem value="uncertain">? Uncertain — needs more data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Expert Notes</label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add clinical observations, corrections, or context..." className="h-24 text-sm resize-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1 h-9 bg-primary/10 text-primary hover:bg-primary/20 border-0" onClick={handleSubmitAnnotation} disabled={updateMutation.isPending}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Submit Annotation
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-amber-400 border-amber-400/30 hover:bg-amber-400/10" onClick={handleEscalate}>
                    Escalate
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}