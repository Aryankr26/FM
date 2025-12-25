import { useState } from 'react';

import {
  LayoutDashboard,
  Droplet,
  MapPin,
  Activity,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  User,
  Menu,
} from 'lucide-react';

import { Button } from '../components/ui/button.jsx';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet.jsx';

/* =========================
   OWNER PAGES
========================= */
import OwnerDashboard from './OwnerDashboard.jsx';
import { FuelAnalysis } from './FuelAnalysis.jsx';
import SLAReports  from './SLAReports.jsx';
//import { RiskInsights } from './RiskInsights.jsx';
//import { Penalties } from './Penalties.jsx';
//import { FuelReports } from './FuelReports.jsx';
import { Settings } from './Settings.jsx';
import AddVehicle from './AddVehicle.jsx';
import { OwnerLiveTracking } from './OwnerLiveTracking.jsx';
import { RouteTracing } from './RouteTracing.jsx';


/**
 * OwnerLayout
 * Executive / decision-making layout
 */
export function OwnerLayout({ onLogout, user }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-tracking', label: 'Live Tracking', icon: MapPin },
    { id: 'route-tracing', label: 'Route Tracing', icon: Activity },
    { id: 'fuel-analysis', label: 'Fuel Analysis', icon: Droplet },
    //{ id: 'fuel-reports', label: 'Fuel Reports', icon: FileText },
    { id: 'sla-reports', label: 'SLA Reports', icon: BarChart3 },
  //  { id: 'risk-insights', label: 'Risk Insights', icon: TrendingUp },
   // { id: 'penalties', label: 'Penalties', icon: AlertTriangle },
    { id: 'addvehicle', label: 'Add Vehicle', icon: SettingsIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'live-tracking':
        return <OwnerLiveTracking />;
      case 'route-tracing':
        return <RouteTracing />;
      case 'fuel-analysis':
        return <FuelAnalysis />;
     // case 'fuel-reports':
       // return <FuelReports />;
      case 'sla-reports':
        return <SLAReports />;
     // case 'risk-insights':
       // return <RiskInsights />;
      //case 'penalties':
        //return <Penalties />;
      case 'settings':
        return <Settings />;
        case 'addvehicle':
        return <AddVehicle/>;
      case 'dashboard':
      default:
        return <OwnerDashboard />;
    }
  };

  return (
    <div className="flex min-h-svh flex-col bg-slate-100 overflow-hidden md:h-screen md:flex-row">
      <header className="flex h-14 items-center justify-between bg-[#0b1220] px-4 text-white shadow-lg md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">FleetMaster Pro</p>
            <p className="truncate text-[10px] text-slate-400">Owner Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-emerald-600/90 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[18rem] bg-[#0b1220] p-0 text-white border-slate-800 [&>button]:text-slate-200 [&>button]:hover:bg-slate-800">
          <SheetHeader className="border-b border-slate-800 p-5">
            <SheetTitle className="text-white">FleetMaster Pro</SheetTitle>
            <p className="text-xs text-slate-400">Owner Portal</p>
          </SheetHeader>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="text-xs text-slate-400 px-3 mb-2">MANAGEMENT</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'Fleet Owner'}</p>
                <p className="text-xs text-slate-400 truncate">Administrator</p>
              </div>
            </div>

            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ================= SIDEBAR ================= */}
      <aside className="hidden w-72 bg-[#0b1220] text-white flex-col shadow-xl md:flex">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight">
                FleetMaster Pro
              </h1>
              <p className="text-xs text-slate-400">
                Owner Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs text-slate-400 px-4 mb-3">
            MANAGEMENT
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || 'Fleet Owner'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                Administrator
              </p>
            </div>
          </div>

          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 min-h-0 overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
    </div>
  );
}
