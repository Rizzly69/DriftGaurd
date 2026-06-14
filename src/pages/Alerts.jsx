const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, CircleDot, Eye, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const severityConfig = {
  critical: { label: 'Critical', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  high: { label: 'High', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  medium: { label: 'Medium', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low: { label: 'Low', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

const statusConfig = {
  detected: { label: 'Detected', class: 'bg-red-500/10 text-red-400' },
  investigating: { label: 'Investigating', class: 'bg-amber-500/10 text-amber-400' },
  mitigating: { label: 'Mitigating', class: 'bg-blue-500/10 text-blue-400' },
  resolved: { label: 'Resolved', class: 'bg-green-500/10 text-green-400' },
  dismissed: { label: 'Dismissed', class: 'bg-muted text-muted-foreground' },
};

const typeLabels = {
  data_drift: 'Data Drift', concept_drift: 'Concept Drift',
  covariate_shift: 'Covariate Shift', label_shift: 'Label Shift',
};

export default function Alerts() {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['drift-events-all'],
    queryFn: () => db.entities.DriftEvent.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.DriftEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift-events-all'] });
      setSelected(null);
    },
  });

  const filtered = events.filter(e => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Drift Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">All detected drift events and their current status</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36 bg-card text-sm h-9">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-card text-sm h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="detected">Detected</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="mitigating">Mitigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No drift events match the current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/20 transition-all cursor-pointer"
                onClick={() => setSelected(event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <CircleDot className={`w-4 h-4 mt-1 shrink-0 ${event.severity === 'critical' ? 'text-red-400' : event.severity === 'high' ? 'text-amber-400' : 'text-primary'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{typeLabels[event.event_type]}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityConfig[event.severity]?.class}`}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig[event.status]?.class}`}>
                          {statusConfig[event.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.specialty} · {event.detection_method} · Model: {event.model_id || 'N/A'}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground/70 mt-1 truncate">{event.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {event.performance_drop && (
                      <span className="text-sm font-mono text-destructive font-medium">-{event.performance_drop}%</span>
                    )}
                    {event.created_date && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">
                        {format(new Date(event.created_date), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">{typeLabels[selected.event_type]}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Event #{selected.id} · {selected.specialty} · {selected.detection_method}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Severity</p>
                    <Badge className={`mt-1 ${severityConfig[selected.severity]?.class}`}>{selected.severity}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`mt-1 ${statusConfig[selected.status]?.class}`}>{statusConfig[selected.status]?.label}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Performance Drop</p>
                    <p className="text-sm font-mono font-medium text-destructive mt-1">{selected.performance_drop ? `-${selected.performance_drop}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-sm font-mono font-medium text-foreground mt-1">{selected.confidence_score ? `${(selected.confidence_score * 100).toFixed(0)}%` : 'N/A'}</p>
                  </div>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground/80">{selected.description}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Select
                    value={selected.status}
                    onValueChange={(value) => updateMutation.mutate({ id: selected.id, data: { status: value } })}
                  >
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detected">Detected</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="mitigating">Mitigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}