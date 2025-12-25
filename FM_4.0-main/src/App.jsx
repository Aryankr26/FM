import { useState } from 'react';
import { LoginPage } from './components/pages/LoginPage.jsx';

/* =========================
   LAYOUTS
========================= */
import { OwnerLayout } from './owner/OwnerLayout.jsx';
import { SupervisorLayout } from './supervisor/SupervisorLayout.jsx';
import FleetLayout from './Fleet/FleetLayout.jsx';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = (role, userData = null) => {
    setUserRole(role);
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUser(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  /* =========================
     OWNER
  ========================= */
  if (userRole === 'OWNER') {
    return (
      <OwnerLayout
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  /* =========================
     SUPERVISOR
  ========================= */
  if (userRole === 'SUPERVISOR') {
    return (
      <SupervisorLayout
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  /* =========================
     FLEET
  ========================= */
  if (userRole === 'FLEET') {
    return (
      <FleetLayout
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  return null;
}
