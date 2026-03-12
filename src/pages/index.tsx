import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  isAuthenticated,
  logout,
  setOnUnauthorizedCallback,
} from "@/lib/requestHandlers";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";

type TabType = "dashboard" | "devices" | "signals" | "values" | "users" | "products" | "materials" | "orders" | "services" | "hours";

export default function Home(props: any) {
  const router = useRouter();
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

  // Parse URL params for Dashboard
  const getInitialTab = (): TabType => {
    const tab = router.query.tab as string;
    const validTabs: TabType[] = ["dashboard", "devices", "signals", "values", "users", "products", "materials", "orders", "services", "hours"];
    return validTabs.includes(tab as TabType) ? (tab as TabType) : "orders";
  };

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
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        locale={props.locale}
        onLocaleChange={props.onLocaleChange}
      />
    );
  }

  // Wait for router to be ready before rendering Dashboard with URL params
  if (!router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} initialTab={getInitialTab()} locale={props.locale} onLocaleChange={props.onLocaleChange} />;
}
