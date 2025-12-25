import { useState, type ComponentType } from 'react';
import { LoginPage } from './components/pages/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OwnerDashboard } from './components/pages/OwnerDashboard';
import { SupervisorDashboard } from './components/pages/SupervisorDashboard';
import { GeofencingPage } from './components/pages/GeofencingPage';
import { FuelReports } from './components/pages/FuelReports';
import { ComplaintsPanel } from './components/pages/ComplaintsPanel';
import { Settings } from './components/pages/Settings';
import { ReportsData } from './components/pages/ReportsData';
import { CompanyRoutes } from './components/pages/CompanyRoutes';

const LoginPageAny = LoginPage as unknown as ComponentType<any>;
const DashboardLayoutAny = DashboardLayout as unknown as ComponentType<any>;
const OwnerDashboardAny = OwnerDashboard as unknown as ComponentType<any>;
const SupervisorDashboardAny = SupervisorDashboard as unknown as ComponentType<any>;
const GeofencingPageAny = GeofencingPage as unknown as ComponentType<any>;
const FuelReportsAny = FuelReports as unknown as ComponentType<any>;
const ComplaintsPanelAny = ComplaintsPanel as unknown as ComponentType<any>;
const SettingsAny = Settings as unknown as ComponentType<any>;
const ReportsDataAny = ReportsData as unknown as ComponentType<any>;
const CompanyRoutesAny = CompanyRoutes as unknown as ComponentType<any>;

type Page = 'dashboard' | 'vehicles' | 'fuel' | 'complaints' | 'settings' | 'reports' | 'routes';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('fleet.token');
    return !!token;
  });

  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('fleet.role') || 'user';
  });

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('fleet.token');
    localStorage.removeItem('fleet.role');
    localStorage.removeItem('fleet.email');
    setIsLoggedIn(false);
    setUserRole('user');
    setCurrentPage('dashboard');
    setSelectedVehicleId(undefined);
  };

  const handleNavigate = (page: Page, vehicleId?: string) => {
    setCurrentPage(page);
    setSelectedVehicleId(vehicleId);
  };

  if (!isLoggedIn) {
    return <LoginPageAny onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return userRole === 'owner' ? (
          <OwnerDashboardAny onNavigate={handleNavigate} selectedVehicleId={selectedVehicleId} />
        ) : (
          <SupervisorDashboardAny onNavigate={handleNavigate} selectedVehicleId={selectedVehicleId} />
        );
      case 'vehicles':
        return <GeofencingPageAny />;
      case 'fuel':
        return <FuelReportsAny />;
      case 'complaints':
        return <ComplaintsPanelAny />;
      case 'settings':
        return <SettingsAny />;
      case 'reports':
        return <ReportsDataAny />;
      case 'routes':
        return <CompanyRoutesAny onNavigate={handleNavigate} />;
      default:
        return userRole === 'owner' ? (
          <OwnerDashboardAny onNavigate={handleNavigate} selectedVehicleId={selectedVehicleId} />
        ) : (
          <SupervisorDashboardAny onNavigate={handleNavigate} selectedVehicleId={selectedVehicleId} />
        );
    }
  };

  return (
    <DashboardLayoutAny userRole={userRole} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout}>
      {renderPage()}
    </DashboardLayoutAny>
  );
}
