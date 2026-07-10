import React, { useCallback, useState } from 'react';
import Landing from './components/Landing.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { Toast } from './components/ui.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  let screen;
  if (adminPassword) {
    screen = (
      <AdminDashboard adminPassword={adminPassword} onLogout={() => setAdminPassword(null)} notify={notify} />
    );
  } else if (user) {
    screen = <UserDashboard user={user} onLogout={() => setUser(null)} notify={notify} />;
  } else {
    screen = <Landing onLogin={setUser} onAdmin={setAdminPassword} notify={notify} />;
  }

  return (
    <>
      {screen}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
