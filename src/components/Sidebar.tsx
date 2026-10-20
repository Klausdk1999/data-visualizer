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
  Activity,
  Building2,
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
  | "equipment"
  | "companies";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userType: string;
  userName: string;
  companyName?: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

interface NavItem {
  key: TabType;
  icon: React.ElementType;
  roles?: string[]; // if specified, user role must be in this list
}

interface NavSection {
  labelKey: string;
  roles?: string[];
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    labelKey: "monitoring",
    items: [
      { key: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "mes",
    items: [
      { key: "orders", icon: ClipboardList },
      { key: "hours", icon: Clock },
      { key: "products", icon: Package, roles: ["superadmin", "admin", "manager"] },
      { key: "materials", icon: Boxes, roles: ["superadmin", "admin", "manager"] },
      { key: "customers", icon: UserSquare, roles: ["superadmin", "admin", "manager"] },
    ],
  },
  {
    labelKey: "settings",
    roles: ["superadmin", "admin", "manager"],
    items: [
      { key: "companies", icon: Building2, roles: ["superadmin"] },
      { key: "services", icon: Wrench, roles: ["superadmin", "admin", "manager"] },
      { key: "users", icon: Users, roles: ["superadmin", "admin"] },
    ],
  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  userType,
  userName,
  companyName,
  onLogout,
  collapsed,
  onToggleCollapse,
  locale,
  onLocaleChange,
}: SidebarProps) {
  const t = useTranslations();

  const isRoleAllowed = (allowedRoles?: string[]) => {
    if (!allowedRoles) return true;
    return allowedRoles.includes(userType);
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "?";
  const roleLabel =
    userType === "superadmin"
      ? t("users.superadmin") || "Super Admin"
      : userType === "admin"
      ? t("users.admin") || "Admin"
      : userType === "manager"
      ? t("users.manager") || "Manager"
      : userType === "worker"
      ? t("users.worker") || "Worker"
      : userType;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col transition-all duration-200 z-30 ${
        collapsed ? "w-16" : "w-60"
      }`}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: "2px 0 12px rgba(0,0,0,0.08)",
      }}
    >
      {/* ── Header / Brand ── */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        {!collapsed && (
          <div className="flex-1 min-w-0 mr-2">
            <p
              className="text-sm font-bold truncate leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {companyName || "Industrial IoT"}
            </p>
            <p
              className="text-[11px] font-medium truncate leading-tight"
              style={{ color: "var(--indigo-accent)" }}
            >
              {userType === "superadmin" ? "Multi-Tenant Cloud" : "MES Platform"}
            </p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg transition-colors shrink-0"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--sidebar-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent")
          }
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Utility buttons (theme / locale) ── */}
      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "justify-end px-3"
        } py-2 gap-1`}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <ThemeToggle />
        {!collapsed && onLocaleChange && locale && (
          <LocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
        {sections.map((section) => {
          if (!isRoleAllowed(section.roles)) return null;
          const visibleItems = section.items.filter((item) =>
            isRoleAllowed(item.roles)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.labelKey}>
              {!collapsed && (
                <p
                  className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--sidebar-text-muted)" }}
                >
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
                      className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                      }`}
                      style={
                        isActive
                          ? {
                              background: "var(--sidebar-active-gradient)",
                              color: "#ffffff",
                              boxShadow: "0 2px 8px rgba(75,92,240,0.35)",
                            }
                          : {
                              color: "var(--sidebar-text)",
                              background: "transparent",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "var(--sidebar-hover)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--text-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--sidebar-text)";
                        }
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User + Actions footer ── */}
      <div
        className="p-3 space-y-2"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {/* User info */}
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3 px-1"
          } py-1`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, #4B5CF0, #7C3AED)",
            }}
          >
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {userName}
              </p>
              <p
                className="text-[11px] truncate leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                {roleLabel}
              </p>
            </div>
          )}
        </div>

        {/* System Diagnosis button */}
        {!collapsed && (
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "var(--diagnosis-btn)" }}
            title="System Diagnosis"
          >
            <Activity className="w-3.5 h-3.5" />
            System Diagnosis
          </button>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          title={collapsed ? t("sidebar.logout") : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          }`}
          style={{ color: "var(--red-accent)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--badge-urgent-bg)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t("sidebar.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
