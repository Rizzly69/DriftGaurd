const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const severities = ['critical', 'high', 'medium', 'low'];
const specialties = ['all', 'laparoscopic', 'cardiac', 'neurosurgery', 'orthopedic', 'general'];

function buildEmailBody(event) {
  return `
DRIFTGUARD ALERT — ${event.severity?.toUpperCase()} SEVERITY

Drift Event Detected
━━━━━━━━━━━━━━━━━━━━
Type:            ${event.event_type?.replace('_', ' ')}
Specialty:       ${event.specialty}
Detection Method: ${event.detection_method}
Performance Drop: ${event.performance_drop ? event.performance_drop + '%' : 'N/A'}
Model ID:        ${event.model_id || 'N/A'}
Confidence:      ${event.confidence_score ? (event.confidence_score * 100).toFixed(0) + '%' : 'N/A'}
Status:          ${event.status}

${event.description ? 'Description:\n' + event.description : ''}

━━━━━━━━━━━━━━━━━━━━
This is an automated alert from the DriftGuard Surgical AI Monitoring System.
Please log in to review and take action.
`.trim();
}

export default function AlertNotifications() {
  const [email, setEmail] = useState('');
  const [minSeverity, setMinSeverity] = useState('high');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [notifyOnDetected, setNotifyOnDetected] = useState(true);
  const [notifyOnResolved, setNotifyOnResolved] = useState(false);
  const [sending, setSending] = useState(null);
  const [sentLog, setSentLog] = useState([]);

  const { data: driftEvents = [] } = useQuery({
    queryKey: ['drift-events-notify'],
    queryFn: () => db.entities.DriftEvent.list('-created_date', 20),
  });

  const severityRank = { low: 0, medium: 1, high: 2, critical: 3 };

  const filteredEvents = driftEvents.filter(e => {
    if (specialtyFilter !== 'all' && e.specialty !== specialtyFilter) return false;
    if (severityRank[e.severity] < severityRank[minSeverity]) return false;
    if (!notifyOnResolved && e.status === 'resolved') return false;
    if (!notifyOnDetected && e.status === 'detected') return false;
    return true;
  });

  const sendNotification = async (event) => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSending(event.id);
    try {
      await db.integrations.Core.SendEmail({
        to: email,
        subject: `[DriftGuard] ${event.severity?.toUpperCase()} Alert — ${event.event_type?.replace('_', ' ')} in ${event.specialty}`,
        body: buildEmailBody(event),
      });
      setSentLog(prev => [event.id, ...prev]);
      toast.success(`Alert sent to ${email}`);
    } catch (err) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSending(null);
    }
  };

  const sendAllMatching = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    for (const event of filteredEvents.slice(0, 5)) {
      await sendNotification(event);
    }
  };

  const severityColors = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Alert Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send email alerts for drift events to clinical staff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-heading font-semibold text-foreground">Notification Settings</h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Recipient Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="surgeon@hospital.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 bg-secondary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Minimum Severity</Label>
            <Select value={minSeverity} onValueChange={setMinSeverity}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severities.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Specialty Filter</Label>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Notify on new detections</Label>
              <Switch checked={notifyOnDetected} onCheckedChange={setNotifyOnDetected} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Notify on resolved events</Label>
              <Switch checked={notifyOnResolved} onCheckedChange={setNotifyOnResolved} />
            </div>
          </div>

          <Button className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0" onClick={sendAllMatching}>
            <Send className="w-4 h-4" /> Send All Matching ({filteredEvents.length})
          </Button>
        </div>

        {/* Events Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{filteredEvents.length} events matching filters</p>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border text-center">
              <Bell className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No events match the current filters</p>
            </div>
          ) : (
            filteredEvents.map((event, i) => {
              const alreadySent = sentLog.includes(event.id);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {event.event_type?.replace('_', ' ')}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityColors[event.severity]}`}>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.specialty} · {event.detection_method} · {event.model_id || 'Unknown model'}
                    </p>
                    {event.performance_drop && (
                      <p className="text-xs font-mono text-destructive mt-0.5">-{event.performance_drop}%</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={alreadySent ? 'outline' : 'default'}
                    className={`shrink-0 gap-1.5 h-8 text-xs ${alreadySent ? 'text-accent border-accent/30' : 'bg-primary/10 text-primary hover:bg-primary/20 border-0'}`}
                    onClick={() => sendNotification(event)}
                    disabled={sending === event.id}
                  >
                    {sending === event.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Sending</>
                    ) : alreadySent ? (
                      <><CheckCircle2 className="w-3 h-3" /> Sent</>
                    ) : (
                      <><Send className="w-3 h-3" /> Notify</>
                    )}
                  </Button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}