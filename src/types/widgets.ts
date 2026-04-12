export type WidgetType = "line_chart" | "bar_chart" | "gauge" | "kpi_card" | "digital_status" | "table";
export type GridLayout = "1x1" | "1x2" | "2x1" | "2x2";
export type Timespan = "1h" | "6h" | "24h" | "7d" | "30d";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  signals?: number[];
  signal_id?: number;
  timespan?: Timespan;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  on_label?: string;
  off_label?: string;
  row_count?: number;
  auto_refresh?: boolean;
}

export interface DashboardLayout {
  layout: GridLayout;
  widgets: WidgetConfig[];
}

export interface UserPreferences {
  dashboard?: DashboardLayout;
  equipment?: Record<string, DashboardLayout>;
}
