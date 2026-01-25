import React, { useEffect, useState } from "react";
import { isAuthenticated, getCurrentUser, logout, setOnUnauthorizedCallback } from "@/lib/requestHandlers";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setLoading(false);

    // Set up global 401 handler to redirect to login
    setOnUnauthorizedCallback(() => {
      setAuthenticated(false);
    });

    // Cleanup on unmount
    return () => {
      setOnUnauthorizedCallback(null);
    };
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
