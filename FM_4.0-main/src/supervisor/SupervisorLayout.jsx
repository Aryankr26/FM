import { useState } from 'react';
import {
  LayoutDashboard,
  Truck,
  Droplet,
  Navigation,
  AlertCircle,
  MapPin,
  LogOut,
  User,
  Wrench,
  UserCheck,
  Map,
  Menu,
} from 'lucide-react';

import { Button } from '../components/ui/button.jsx';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet.jsx';

/* =========================
   SUPERVISOR PAGES
========================= */
import SupervisorDashboard from './SupervisorDashboard.jsx';
import { FuelEntry } from './FuelEntry.jsx';
import { LiveTracking } from './LiveTracking.jsx';
//import { VehicleTracking } from './VehicleTracking.jsx';
//import { ComplaintsPanel } from './ComplaintsPanel.jsx';
import GeofencingPage  from './GeofencingPage.jsx';
import { Maintenance } from './Maintenance.jsx';
import { AssignDriver } from './AssignDriver.jsx';
import { Companyroutesmanagemnt } from './Companyroutesmanagemnt.jsx';

/**
 * SupervisorLayout (TOP HEADER)
 * - Header navigation
 * - Page state
 * - Page rendering
 */
export function SupervisorLayout({ onLogout, user }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fuel-entry', label: 'Fuel Entry', icon: Droplet },
    { id: 'live-tracking', label: 'Live Tracking', icon: Navigation },
   // { id: 'vehicle-tracking', label: 'Vehicle Tracking', icon: Truck },
  //  { id: 'complaints', label: 'Complaints', icon: AlertCircle },
    { id: 'geofencing', label: 'Geofencing', icon: MapPin },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'assign-driver', label: 'Assign Driver', icon: UserCheck },
    { id: 'company-routes', label: 'Company Routes', icon: Map },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SupervisorDashboard onNavigate={setCurrentPage} />;
      case 'fuel-entry':
        return <FuelEntry />;
      case 'live-tracking':
        return <LiveTracking />;
      //case 'vehicle-tracking':
       // return <VehicleTracking />;
    //  case 'complaints':
      //  return <ComplaintsPanel />;
      case 'geofencing':
        return <GeofencingPage />;
      case 'maintenance':
        return <Maintenance />;
      case 'assign-driver':
        return <AssignDriver />;
      case 'company-routes':
        return <Companyroutesmanagemnt />;
      default:
        return <SupervisorDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-svh flex-col bg-slate-100 md:h-screen">
      {/* ================= TOP HEADER ================= */}
      <header className="bg-[#0a0f1e] text-white shadow-lg">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-200 hover:bg-slate-800 hover:text-white md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex min-w-0 items-center gap-3 mr-2 sm:mr-10">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              FleetMaster Pro
            </h1>
            <p className="text-[10px] text-slate-400">
              Supervisor Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex flex-1 items-center gap-2 min-w-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium leading-none">
                {user?.name || 'Supervisor'}
              </p>
              <p className="text-[10px] text-slate-400">
                Operations
              </p>
            </div>
          </div>

          <Button
            onClick={onLogout}
            variant="ghost"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[18rem] bg-[#0a0f1e] p-0 text-white border-slate-800 [&>button]:text-slate-200 [&>button]:hover:bg-slate-800">
          <SheetHeader className="border-b border-slate-800 p-5">
            <SheetTitle className="text-white">Navigation</SheetTitle>
            <p className="text-xs text-slate-400">Supervisor Portal</p>
          </SheetHeader>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
        </SheetContent>
      </Sheet>

      {/* ================= MAIN CONTENT ================= 
     
      <main className="flex-1 overflow-auto bg-slate-50 p-6">*/}
     
     <main className="flex-1 min-h-0 overflow-auto bg-slate-50">

        {renderPage()}
      </main>
    </div>
  );
}
