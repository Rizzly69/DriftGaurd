const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Activity, AlertTriangle, Shield, TrendingDown } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import StatCard from '@/components/dashboard/StatCard';
import PerformanceTimeline from '@/components/dashboard/PerformanceTimeline';
import SpecialtyBreakdown from '@/components/dashboard/SpecialtyBreakdown';
import RecentAlerts from '@/components/dashboard/RecentAlerts';
import DriftDistribution from '@/components/dashboard/DriftDistribution';

export default function Dashboard() {
  const { data: driftEvents = [] } = useQuery({
    queryKey: ['drift-events'],
    queryFn: () => db.entities.DriftEvent.list('-created_date'),
  });

  const criticalCount = driftEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length;
  const activeEvents = driftEvents.filter(e => e.status === 'detected' || e.status === 'investigating').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Model Drift Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-Guided Robotic Surgery Monitoring Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Models"
          value="12"
          subtitle="Across 5 specialties"
          icon={Shield}
          accentColor="primary"
        />
        <StatCard
          title="Avg. Accuracy"
          value="93.2%"
          subtitle="Rolling 30-day average"
          icon={Activity}
          trend="1.4%"
          trendDirection="down"
          accentColor="accent"
        />
        <StatCard
          title="Drift Events"
          value={activeEvents || 0}
          subtitle="Active investigations"
          icon={AlertTriangle}
          accentColor="chart4"
        />
        <StatCard
          title="Critical Alerts"
          value={criticalCount || 0}
          subtitle="Requiring immediate action"
          icon={TrendingDown}
          accentColor="destructive"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceTimeline />
        </div>
        <DriftDistribution />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SpecialtyBreakdown />
        <RecentAlerts />
      </div>
    </div>
  );
}