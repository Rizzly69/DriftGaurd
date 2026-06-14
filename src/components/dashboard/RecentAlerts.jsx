const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CircleDot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const severityStyles = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const typeLabels = {
  data_drift: 'Data Drift',
  concept_drift: 'Concept Drift',
  covariate_shift: 'Covariate Shift',
  label_shift: 'Label Shift',
};

export default function RecentAlerts() {
  const { data: events = [] } = useQuery({
    queryKey: ['drift-events-recent'],
    queryFn: () => db.entities.DriftEvent.list('-created_date', 5),
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-heading font-semibold text-foreground">Recent Drift Alerts</h3>
          <p className="text-xs text-muted-foreground mt-1">Latest detected anomalies</p>
        </div>
        <Link to="/alerts" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No drift events detected</p>
          <p className="text-xs text-muted-foreground/60 mt-1">System is operating within normal parameters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <CircleDot className={`w-4 h-4 mt-0.5 ${event.severity === 'critical' ? 'text-red-400' : event.severity === 'high' ? 'text-amber-400' : 'text-primary'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{typeLabels[event.event_type]}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityStyles[event.severity]}`}>
                    {event.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{event.specialty} · {event.detection_method}</p>
                {event.created_date && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    {format(new Date(event.created_date), 'MMM d, HH:mm')}
                  </p>
                )}
              </div>
              {event.performance_drop && (
                <span className="text-xs font-mono text-destructive whitespace-nowrap">-{event.performance_drop}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}