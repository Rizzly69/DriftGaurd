import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Performance from '@/pages/Performance';
import DriftDetection from '@/pages/DriftDetection';
import Alerts from '@/pages/Alerts';
import Recalibration from '@/pages/Recalibration';
import DetectionMethods from '@/pages/DetectionMethods';
import EquationEngine from '@/pages/EquationEngine';
import HITLAnnotation from '@/pages/HITLAnnotation';
import AuditTrail from '@/pages/AuditTrail';
import PreOpCheck from '@/pages/PreOpCheck';
import ModelRegistry from '@/pages/ModelRegistry';
import ShadowMode from '@/pages/ShadowMode';
import AlertNotifications from '@/pages/AlertNotifications';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/drift-detection" element={<DriftDetection />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/recalibration" element={<Recalibration />} />
          <Route path="/methods" element={<DetectionMethods />} />
          <Route path="/equation-engine" element={<EquationEngine />} />
          <Route path="/hitl" element={<HITLAnnotation />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/preop" element={<PreOpCheck />} />
          <Route path="/registry" element={<ModelRegistry />} />
          <Route path="/shadow" element={<ShadowMode />} />
          <Route path="/notifications" element={<AlertNotifications />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App