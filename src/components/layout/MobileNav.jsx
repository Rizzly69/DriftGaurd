import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  LayoutDashboard, Activity, AlertTriangle, BarChart3, Settings2, Waves, Shield,
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

export default function MobileNav({ open, onClose }) {
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 bg-card p-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm">DriftGuard</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Surgical AI</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}