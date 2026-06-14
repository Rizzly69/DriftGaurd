import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Activity, AlertTriangle, BarChart3, Settings2, Shield, Cpu, Waves,
  FlaskConical, Brain, ScrollText, ClipboardList, GitBranch, GitCompare, Bell
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/performance', icon: Activity, label: 'Performance' },
  { path: '/drift-detection', icon: Waves, label: 'Drift Detection' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/recalibration', icon: Settings2, label: 'Recalibration' },
  { path: '/methods', icon: BarChart3, label: 'Detection Methods' },
  { path: '/equation-engine', icon: FlaskConical, label: 'Equation Engine' },
  { path: '/hitl', icon: Brain, label: 'HITL Validation' },
  { path: '/audit', icon: ScrollText, label: 'Audit Trail' },
  { path: '/preop', icon: ClipboardList, label: 'Pre-Op Check' },
  { path: '/registry', icon: GitBranch, label: 'Model Registry' },
  { path: '/shadow', icon: GitCompare, label: 'Shadow Mode' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm text-foreground tracking-tight">DriftGuard</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Surgical AI Monitor</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-3 py-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-foreground">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] text-muted-foreground">All monitors active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}