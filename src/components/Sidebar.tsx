"use client";

import React from "react";
import {
  LayoutDashboard,
  Monitor,
  ClipboardList,
  Clock,
  Package,
  Boxes,
  UserSquare,
  Cpu,
  Radio,
  BarChart3,
  Wrench,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n";

export type TabType =
  | "dashboard"
  | "devices"
  | "signals"
  | "values"
  | "users"
  | "products"
  | "materials"
  | "orders"
  | "services"
  | "hours"
  | "customers"
  | "equipment";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userType: string;
  userName: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

interface NavItem {
  key: TabType;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  labelKey: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    labelKey: "monitoring",
    items: [
      { key: "dashboard", icon: LayoutDashboard },
      { key: "equipment", icon: Monitor },
    ],
  },
  {
    labelKey: "mes",
    items: [
      { key: "orders", icon: ClipboardList },
      { key: "hours", icon: Clock },
      { key: "products", icon: Package, adminOnly: true },
      { key: "materials", icon: Boxes, adminOnly: true },
      { key: "customers", icon: UserSquare, adminOnly: true },
    ],
  },
  {
    labelKey: "settings",
    adminOnly: true,
    items: [
      { key: "devices", icon: Cpu },
      { key: "signals", icon: Radio },
      { key: "values", icon: BarChart3 },
      { key: "services", icon: Wrench },
      { key: "users", icon: Users },
    ],
  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  userType,
  userName,
  onLogout,
  collapsed,
  onToggleCollapse,
  locale,
  onLocaleChange,
}: SidebarProps) {
  const t = useTranslations();
  const isAdmin = userType === "admin";

  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 shadow-sm dark:bg-gray-900/80 dark:border-gray-700/60 transition-all duration-200 z-30 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200/60 dark:border-gray-700/60">
        {!collapsed && (
          <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
            IoT Dashboard
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Utility buttons */}
      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "justify-end px-3"
        } py-2 gap-1 border-b border-gray-200/60 dark:border-gray-700/60`}
      >
        <ThemeToggle />
        {!collapsed && onLocaleChange && locale && (
          <LocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {sections.map((section) => {
          if (section.adminOnly && !isAdmin) return null;

          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.labelKey}>
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t(`sidebar.${section.labelKey}`)}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  const label = t(`sidebar.${item.key}`);

                  return (
                    <button
                      key={item.key}
                      onClick={() => onTabChange(item.key)}
                      title={collapsed ? label : undefined}
                      className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                      } ${
                        isActive
                          ? "bg-blue-500/90 text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200/60 dark:border-gray-700/60 p-2">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3 px-2"
          } py-2`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userName}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={collapsed ? t("sidebar.logout") : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors ${
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t("sidebar.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
