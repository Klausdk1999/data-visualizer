import React, { useEffect, useState } from "react";
import { isAuthenticated, getCurrentUser, logout } from "@/lib/requestHandlers";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
