import { useEffect, useState } from 'react';
import { LayoutDashboard, Truck, Droplet, MessageSquare, Settings as SettingsIcon, LogOut, Bell, User, X, FileText, Building2, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Switch } from './ui/switch';
export function DashboardLayout({ children, userRole, currentPage, onNavigate, onLogout }) {
    const [isContentOpen, setIsContentOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const THEME_STORAGE_KEY = 'fleet.theme';

    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            const nextIsDark = savedTheme === 'dark' || document.documentElement.classList.contains('dark');
            setIsDarkMode(nextIsDark);
        }
        catch {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
    }, []);

    const setTheme = (nextIsDark) => {
        setIsDarkMode(nextIsDark);
        if (nextIsDark) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
        try {
            localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
        }
        catch (error) {
            void error;
        }
    };
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'reports', label: 'Reports/Data', icon: FileText },
        { id: 'routes', label: 'Company Routes', icon: Building2 },
        { id: 'vehicles', label: 'Geofencing', icon: Truck },
        { id: 'fuel', label: 'Fuel Reports', icon: Droplet },
        { id: 'complaints', label: 'Complaints', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ];
    const handleNavigation = (page) => {
        onNavigate(page);
        if (page !== 'dashboard' && page !== 'vehicles' && page !== 'fuel' && page !== 'complaints' && page !== 'settings' && page !== 'reports' && page !== 'routes') {
            setIsContentOpen(true);
        }
        else {
            setIsContentOpen(false);
        }
    };
    const currentPageLabel = navItems.find(item => item.id === currentPage)?.label || 'Dashboard';
    return (<div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Remove the map background - GeofencingPage has its own map */}

      {/* Left Sidebar */}
      <aside className="relative z-10 w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl border-r border-sidebar-border">
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-[#10b981] p-2 rounded-lg">
              <Truck className="h-6 w-6"/>
            </div>
            <div>
              <h1 className="tracking-tight">FleetMaster Pro</h1>
              <p className="text-xs text-sidebar-foreground/60">Transport Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs text-sidebar-foreground/60 px-4 mb-3">MAIN MENU</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (<div key={item.id}>
                <button onClick={() => handleNavigation(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                  <Icon className="h-5 w-5"/>
                  <span>{item.label}</span>
                </button>
                
                {/* Vehicle Tracking Expanded Section */}
                {item.id === 'vehicles' && isActive && (<div className="mt-3 space-y-3 px-2">
                    {/* Removed search, notification icons and vehicle stats */}
                  </div>)}
              </div>);
        })}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3 p-3 bg-sidebar-accent rounded-lg">
            <div className="h-10 w-10 rounded-full bg-[#10b981] flex items-center justify-center">
              <User className="h-5 w-5 text-white"/>
            </div>
            <div className="flex-1">
              <p className="text-sm text-sidebar-accent-foreground">RKT Travels</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole}</p>
            </div>
            <div className="relative">
              <Bell className="h-5 w-5 text-sidebar-foreground/60"/>
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                3
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-sidebar-accent">
            <div className="flex items-center gap-2">
              {isDarkMode ? (<Moon className="h-4 w-4"/>) : (<Sun className="h-4 w-4"/>)}
              <span className="text-sm text-sidebar-accent-foreground">Dark mode</span>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={setTheme} aria-label="Toggle dark mode"/>
          </div>

          <Button onClick={onLogout} variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent">
            <LogOut className="h-5 w-5 mr-3"/>
            Logout
          </Button>
        </div>
      </aside>

      {/* Content Sheet Overlay */}
      <Sheet open={isContentOpen} onOpenChange={setIsContentOpen}>
        <SheetContent side="right" className="w-[45vw] overflow-y-auto p-0">
          <SheetHeader className="p-6 border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-foreground">
                {navItems.find(item => item.id === currentPage)?.icon && (<div className="bg-[#10b981] p-2 rounded-lg">
                    {(() => {
                const Icon = navItems.find(item => item.id === currentPage).icon;
                return <Icon className="h-5 w-5 text-white"/>;
            })()}
                  </div>)}
                {currentPageLabel}
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsContentOpen(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4"/>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
            </p>
          </SheetHeader>
          <div className="p-6">
            {children}
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Dashboard Content - Shows when on dashboard page */}
      {currentPage === 'dashboard' && (<main className="relative z-10 flex-1 overflow-hidden h-screen">
          {children}
        </main>)}

      {/* Main Vehicle Tracking Content - Shows when on vehicles page */}
      {currentPage === 'vehicles' && (<main className="relative z-10 flex-1 overflow-hidden h-screen">
          {children}
        </main>)}

      {/* Main Fuel Reports Content - Shows when on fuel page */}
      {currentPage === 'fuel' && (<main className="relative z-10 flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>)}

      {/* Main Complaints Content - Shows when on complaints page */}
      {currentPage === 'complaints' && (<main className="relative z-10 flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>)}

      {/* Main Settings Content - Shows when on settings page */}
      {currentPage === 'settings' && (<main className="relative z-10 flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>)}

      {/* Main Reports Content - Shows when on reports page */}
      {currentPage === 'reports' && (<main className="relative z-10 flex-1 overflow-y-auto">
          {children}
        </main>)}

      {/* Main Company Routes Content - Shows when on routes page */}
      {currentPage === 'routes' && (<main className="relative z-10 flex-1 overflow-y-auto">
          {children}
        </main>)}
    </div>);
}
