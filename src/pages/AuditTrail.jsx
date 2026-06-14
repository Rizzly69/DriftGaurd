const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Shield, Download, Filter, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const categoryStyles = {
  drift_detection: 'bg-primary/10 text-primary border-primary/20',
  model_update: 'bg-accent/10 text-accent border-accent/20',
  alert_status: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  recalibration: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  user_validation: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  system: 'bg-muted text-muted-foreground border-border',
};

const outcomeConfig = {
  success: { icon: CheckCircle2, color: 'text-accent' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  failure: { icon: XCircle, color: 'text-destructive' },
  pending: { icon: Clock, color: 'text-muted-foreground' },
};

const categoryLabels = {
  drift_detection: 'Drift Detection',
  model_update: 'Model Update',
  alert_status: 'Alert Status',
  recalibration: 'Recalibration',
  user_validation: 'User Validation',
  system: 'System',
};

export default function AuditTrail() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => db.entities.AuditLog.list('-created_date'),
  });

  const filtered = logs.filter(l => {
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (outcomeFilter !== 'all' && l.outcome !== outcomeFilter) return false;
    return true;
  });

  const regulatoryCount = logs.filter(l => l.regulatory_flag).length;

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'Category', 'Model', 'Specialty', 'Outcome', 'Regulatory Flag', 'Details'];
    const rows = filtered.map(l => [
      l.id, l.created_date ? format(new Date(l.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
      `"${l.action}"`, l.category, l.model_id || '', l.specialty || '',
      l.outcome, l.regulatory_flag ? 'YES' : 'NO', `"${l.details || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Audit Trail</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Regulatory-grade immutable event log (FDA/EU MDR)</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Total Events</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{logs.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Regulatory Flagged</p>
          <p className="text-2xl font-heading font-bold text-amber-400 mt-1">{regulatoryCount}</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Require regulatory review</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground">Failures / Warnings</p>
          <p className="text-2xl font-heading font-bold text-destructive mt-1">
            {logs.filter(l => l.outcome === 'failure' || l.outcome === 'warning').length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 bg-card text-sm h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-36 bg-card text-sm h-9">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="failure">Failure</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
            <Shield className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No audit events match the current filters</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-0 text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-border bg-secondary/20">
            <span>Action / Details</span>
            <span className="text-right pr-4">Category</span>
            <span className="text-right pr-4">Model</span>
            <span className="text-right pr-4">Outcome</span>
            <span className="text-right">Timestamp</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((log, i) => {
              const OutcomeIcon = outcomeConfig[log.outcome]?.icon || CheckCircle2;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-0 px-4 py-3 hover:bg-secondary/20 transition-colors items-start"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground font-medium truncate">{log.action}</p>
                      {log.regulatory_flag && (
                        <Badge className="text-[9px] px-1 py-0 bg-amber-400/10 text-amber-400 border-amber-400/30 shrink-0">REG</Badge>
                      )}
                    </div>
                    {log.details && <p className="text-xs text-muted-foreground truncate mt-0.5">{log.details}</p>}
                  </div>
                  <div className="pr-4">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 whitespace-nowrap ${categoryStyles[log.category]}`}>
                      {categoryLabels[log.category]}
                    </Badge>
                  </div>
                  <div className="pr-4">
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{log.model_id || '—'}</span>
                  </div>
                  <div className="pr-4">
                    <OutcomeIcon className={`w-4 h-4 ${outcomeConfig[log.outcome]?.color}`} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {log.created_date ? format(new Date(log.created_date), 'MM/dd HH:mm') : '—'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}