const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, GitBranch, Brain, SlidersHorizontal, Database, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const actionIcons = {
  retrain: RefreshCw,
  transfer_learning: GitBranch,
  active_learning: Brain,
  parameter_tuning: SlidersHorizontal,
  data_augmentation: Database,
};

const actionLabels = {
  retrain: 'Full Retrain',
  transfer_learning: 'Transfer Learning',
  active_learning: 'Active Learning',
  parameter_tuning: 'Parameter Tuning',
  data_augmentation: 'Data Augmentation',
};

const statusStyles = {
  scheduled: 'bg-blue-500/10 text-blue-400',
  in_progress: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-green-500/10 text-green-400',
  failed: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function Recalibration() {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['recalibration-actions'],
    queryFn: () => db.entities.RecalibrationAction.list('-created_date'),
  });

  const completedCount = actions.filter(a => a.status === 'completed').length;
  const avgImprovement = actions
    .filter(a => a.performance_before && a.performance_after)
    .reduce((acc, a) => acc + (a.performance_after - a.performance_before), 0) / Math.max(1, completedCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Recalibration Actions</h1>
        <p className="text-sm text-muted-foreground mt-1">Adaptive model recalibration tracking and history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Total Actions</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{actions.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">{completedCount}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Avg Improvement</p>
          <p className="text-2xl font-heading font-bold text-primary mt-1">
            {avgImprovement > 0 ? `+${avgImprovement.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <RefreshCw className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No recalibration actions recorded</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Actions will appear here when models are recalibrated</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, i) => {
            const Icon = actionIcons[action.action_type] || RefreshCw;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{actionLabels[action.action_type]}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyles[action.status]}`}>
                        {action.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Model: {action.model_id} · {action.specialty}
                      {action.data_samples_used && ` · ${action.data_samples_used.toLocaleString()} samples`}
                    </p>
                    {action.trigger_reason && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{action.trigger_reason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {action.performance_before && action.performance_after ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-muted-foreground">{action.performance_before}%</span>
                        <ArrowRight className="w-3 h-3 text-primary" />
                        <span className="text-accent font-medium">{action.performance_after}%</span>
                      </div>
                    ) : null}
                    {action.created_date && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">
                        {format(new Date(action.created_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}