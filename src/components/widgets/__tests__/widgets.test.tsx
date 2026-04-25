import React from "react";
import { render, screen } from "@testing-library/react";
import type { SignalValue, Signal } from "@/types";
import type { WidgetConfig } from "@/types/widgets";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}));

// Mock useWidgetData — we control dataMap, loading, and refresh per test
const mockRefresh = jest.fn();
let mockUseWidgetDataReturn: {
  dataMap: Record<number, SignalValue[]>;
  loading: boolean;
  refresh: () => void;
} = { dataMap: {}, loading: false, refresh: mockRefresh };

jest.mock("../useWidgetData", () => ({
  ...jest.requireActual("../useWidgetData"),
  useWidgetData: () => mockUseWidgetDataReturn,
}));

/* ------------------------------------------------------------------ */
/*  Imports (after mocks)                                              */
/* ------------------------------------------------------------------ */

import { LineChartWidget } from "../LineChartWidget";
import { BarChartWidget } from "../BarChartWidget";
import { GaugeWidget } from "../GaugeWidget";
import { KpiCardWidget } from "../KpiCardWidget";
import { DigitalStatusWidget } from "../DigitalStatusWidget";
import { TableWidget } from "../TableWidget";

/* ------------------------------------------------------------------ */
/*  Shared fixtures                                                    */
/* ------------------------------------------------------------------ */

const mockSignal: Signal = {
  id: 1,
  name: "Temperature",
  unit: "°C",
  signal_type: "analogic",
  direction: "input",
  device_id: 1,
  is_active: true,
};

const mockValues: SignalValue[] = [
  {
    id: 1,
    signal_id: 1,
    timestamp: "2024-01-15T10:00:00Z",
    value: 23.5,
  },
  {
    id: 2,
    signal_id: 1,
    timestamp: "2024-01-15T10:01:00Z",
    value: 24.0,
  },
];

const mockDigitalValues: SignalValue[] = [
  {
    id: 1,
    signal_id: 1,
    timestamp: "2024-01-15T10:00:00Z",
    digital_value: true,
  },
];

const mockDataMap: Record<number, SignalValue[]> = { 1: mockValues };

function baseConfig(overrides: Partial<WidgetConfig> = {}): WidgetConfig {
  return {
    id: "w1",
    type: "line_chart",
    signal_id: 1,
    signals: [1],
    label: "Test Widget",
    ...overrides,
  };
}

beforeEach(() => {
  mockUseWidgetDataReturn = {
    dataMap: {},
    loading: false,
    refresh: mockRefresh,
  };
  mockRefresh.mockClear();
});

/* ================================================================== */
/*  LineChartWidget                                                     */
/* ================================================================== */

describe("LineChartWidget", () => {
  it("renders without crashing with minimal props", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    const { container } = render(
      <LineChartWidget config={baseConfig({ type: "line_chart" })} />
    );
    expect(container).toBeTruthy();
  });

  it("shows loading state (skeleton) when loading with no data", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: true, refresh: mockRefresh };
    const { container } = render(
      <LineChartWidget config={baseConfig({ type: "line_chart" })} />
    );
    // Skeleton components render divs with the skeleton class
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders chart with data", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <LineChartWidget
        config={baseConfig({ type: "line_chart" })}
        signals={[mockSignal]}
      />
    );
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("shows 'No data' when dataMap is empty and not loading", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    render(
      <LineChartWidget config={baseConfig({ type: "line_chart" })} />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("displays the config label", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <LineChartWidget config={baseConfig({ type: "line_chart", label: "Temp Chart" })} />
    );
    expect(screen.getByText("Temp Chart")).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  BarChartWidget                                                     */
/* ================================================================== */

describe("BarChartWidget", () => {
  it("renders without crashing with minimal props", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    const { container } = render(
      <BarChartWidget config={baseConfig({ type: "bar_chart" })} />
    );
    expect(container).toBeTruthy();
  });

  it("shows loading state when loading with no data", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: true, refresh: mockRefresh };
    const { container } = render(
      <BarChartWidget
        config={baseConfig({ type: "bar_chart", signal_id: undefined, signals: [] })}
      />
    );
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders bar chart with data", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <BarChartWidget
        config={baseConfig({ type: "bar_chart" })}
        signals={[mockSignal]}
      />
    );
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("displays the config label", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <BarChartWidget config={baseConfig({ type: "bar_chart", label: "Bar View" })} />
    );
    expect(screen.getByText("Bar View")).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  GaugeWidget                                                        */
/* ================================================================== */

describe("GaugeWidget", () => {
  it("renders without crashing with minimal props", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    const { container } = render(
      <GaugeWidget config={baseConfig({ type: "gauge" })} />
    );
    expect(container).toBeTruthy();
  });

  it("shows loading state when loading with no data", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: true, refresh: mockRefresh };
    const { container } = render(
      <GaugeWidget config={baseConfig({ type: "gauge" })} />
    );
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders gauge with data showing the current value", () => {
    mockUseWidgetDataReturn = {
      dataMap: { 1: [{ id: 2, signal_id: 1, timestamp: "2024-01-15T10:01:00Z", value: 72.3 }] },
      loading: false,
      refresh: mockRefresh,
    };
    render(
      <GaugeWidget config={baseConfig({ type: "gauge", min: 0, max: 100, unit: "°C" })} />
    );
    // The SVG text element should contain the formatted value
    expect(screen.getByText("72.3")).toBeInTheDocument();
  });

  it("displays the config label", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <GaugeWidget config={baseConfig({ type: "gauge", label: "Pressure" })} />
    );
    expect(screen.getByText("Pressure")).toBeInTheDocument();
  });

  it("displays the unit", () => {
    mockUseWidgetDataReturn = {
      dataMap: { 1: [{ id: 1, signal_id: 1, timestamp: "2024-01-15T10:00:00Z", value: 50 }] },
      loading: false,
      refresh: mockRefresh,
    };
    render(
      <GaugeWidget config={baseConfig({ type: "gauge", unit: "bar" })} />
    );
    expect(screen.getByText("bar")).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  KpiCardWidget                                                      */
/* ================================================================== */

describe("KpiCardWidget", () => {
  it("renders without crashing with minimal props", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    const { container } = render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card" })} />
    );
    expect(container).toBeTruthy();
  });

  it("shows loading state when loading with no data", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: true, refresh: mockRefresh };
    const { container } = render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card" })} />
    );
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders the current value", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card" })} />
    );
    // Latest value is 24.0 => displayed as "24.0"
    expect(screen.getByText("24.0")).toBeInTheDocument();
  });

  it("displays the config label", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card", label: "Avg Temp" })} />
    );
    expect(screen.getByText("Avg Temp")).toBeInTheDocument();
  });

  it("displays the unit when provided", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card", unit: "°C" })} />
    );
    expect(screen.getByText("°C")).toBeInTheDocument();
  });

  it("shows dash when no value is available", () => {
    mockUseWidgetDataReturn = { dataMap: { 1: [] }, loading: false, refresh: mockRefresh };
    render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card" })} />
    );
    // mdash character
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows trend indicator when multiple values exist", () => {
    // value goes from 23.5 to 24.0 => "Up"
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <KpiCardWidget config={baseConfig({ type: "kpi_card" })} />
    );
    expect(screen.getByText(/Up/)).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  DigitalStatusWidget                                                */
/* ================================================================== */

describe("DigitalStatusWidget", () => {
  it("renders without crashing with minimal props", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    const { container } = render(
      <DigitalStatusWidget config={baseConfig({ type: "digital_status" })} />
    );
    expect(container).toBeTruthy();
  });

  it("shows loading state when loading with no data", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: true, refresh: mockRefresh };
    const { container } = render(
      <DigitalStatusWidget config={baseConfig({ type: "digital_status" })} />
    );
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows ON when digital_value is true", () => {
    mockUseWidgetDataReturn = {
      dataMap: { 1: mockDigitalValues },
      loading: false,
      refresh: mockRefresh,
    };
    render(
      <DigitalStatusWidget config={baseConfig({ type: "digital_status" })} />
    );
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("shows OFF when digital_value is false", () => {
    mockUseWidgetDataReturn = {
      dataMap: {
        1: [{ id: 1, signal_id: 1, timestamp: "2024-01-15T10:00:00Z", digital_value: false }],
      },
      loading: false,
      refresh: mockRefresh,
    };
    render(
      <DigitalStatusWidget config={baseConfig({ type: "digital_status" })} />
    );
    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("uses custom on/off labels", () => {
    mockUseWidgetDataReturn = {
      dataMap: { 1: mockDigitalValues },
      loading: false,
      refresh: mockRefresh,
    };
    render(
      <DigitalStatusWidget
        config={baseConfig({
          type: "digital_status",
          on_label: "RUNNING",
          off_label: "STOPPED",
        })}
      />
    );
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  it("displays the config label", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    render(
      <DigitalStatusWidget
        config={baseConfig({ type: "digital_status", label: "Motor" })}
      />
    );
    expect(screen.getByText("Motor")).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  TableWidget                                                        */
/* ================================================================== */

describe("TableWidget", () => {
  it("renders without crashing with minimal props", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: false, refresh: mockRefresh };
    const { container } = render(
      <TableWidget config={baseConfig({ type: "table" })} />
    );
    expect(container).toBeTruthy();
  });

  it("shows loading state when loading with no data", () => {
    mockUseWidgetDataReturn = { dataMap: {}, loading: true, refresh: mockRefresh };
    const { container } = render(
      <TableWidget config={baseConfig({ type: "table" })} />
    );
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders table rows with data", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <TableWidget config={baseConfig({ type: "table" })} />
    );
    // Table should show header columns
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    // Should display values: 23.5 and 24
    expect(screen.getByText("23.5")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("shows 'No data' when no values exist", () => {
    mockUseWidgetDataReturn = { dataMap: { 1: [] }, loading: false, refresh: mockRefresh };
    render(
      <TableWidget config={baseConfig({ type: "table" })} />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("displays the config label", () => {
    mockUseWidgetDataReturn = { dataMap: mockDataMap, loading: false, refresh: mockRefresh };
    render(
      <TableWidget config={baseConfig({ type: "table", label: "Readings" })} />
    );
    expect(screen.getByText("Readings")).toBeInTheDocument();
  });
});
