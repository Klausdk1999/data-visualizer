import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "../Sidebar";
import type { TabType } from "../Sidebar";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/components/ui/locale-switcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

describe("Sidebar", () => {
  const defaultProps = {
    activeTab: "dashboard" as TabType,
    onTabChange: jest.fn(),
    userType: "admin",
    userName: "Test User",
    onLogout: jest.fn(),
    collapsed: false,
    onToggleCollapse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders navigation items", () => {
    render(<Sidebar {...defaultProps} />);

    // Check for section labels (admin user sees all sections)
    expect(screen.getByText("sidebar.monitoring")).toBeInTheDocument();
    expect(screen.getByText("sidebar.mes")).toBeInTheDocument();
    expect(screen.getByText("sidebar.settings")).toBeInTheDocument();

    // Check for some nav item labels
    expect(screen.getByText("sidebar.dashboard")).toBeInTheDocument();
    expect(screen.getByText("sidebar.devices")).toBeInTheDocument();
    expect(screen.getByText("sidebar.orders")).toBeInTheDocument();
  });

  it("highlights active tab", () => {
    render(<Sidebar {...defaultProps} activeTab="devices" />);

    // The active button should have the active class (bg-blue-500)
    const devicesButton = screen.getByText("sidebar.devices").closest("button");
    expect(devicesButton).toHaveClass("bg-blue-500/90");

    // Another button should not have the active class
    const dashboardButton = screen.getByText("sidebar.dashboard").closest("button");
    expect(dashboardButton).not.toHaveClass("bg-blue-500/90");
  });

  it("calls onTabChange when item clicked", () => {
    const onTabChange = jest.fn();
    render(<Sidebar {...defaultProps} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText("sidebar.signals"));

    expect(onTabChange).toHaveBeenCalledWith("signals");
  });

  it("hides admin-only sections for non-admin users", () => {
    render(<Sidebar {...defaultProps} userType="user" />);

    // Settings section is admin-only
    expect(screen.queryByText("sidebar.settings")).not.toBeInTheDocument();
    // Devices is under settings (admin-only section)
    expect(screen.queryByText("sidebar.devices")).not.toBeInTheDocument();
  });

  it("displays user name and logout button", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("sidebar.logout")).toBeInTheDocument();
  });

  it("calls onLogout when logout clicked", () => {
    const onLogout = jest.fn();
    render(<Sidebar {...defaultProps} onLogout={onLogout} />);

    fireEvent.click(screen.getByText("sidebar.logout"));

    expect(onLogout).toHaveBeenCalled();
  });
});
