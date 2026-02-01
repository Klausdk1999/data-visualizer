// TTN-specific types for river monitoring data

export interface TTNUplink {
  id: number;
  device_id: string;
  dev_eui: string;
  received_at: string;
  distance_mm: number;
  distance_cm: number;
  battery_percent: number;
  temperature: number;
  signal_strength: number;
  reading_count: number;
  rssi: number;
  snr: number;
  gateway_id: string;
  f_cnt: number;
}

export interface TTNDevice {
  device_id: string;
  dev_eui: string;
  last_seen: string;
  uplink_count: number;
}

export interface TTNStats {
  total_uplinks: number;
  unique_devices: number;
  first_uplink?: string;
  last_uplink?: string;
}

export type TTNParameter = "distance" | "battery";
