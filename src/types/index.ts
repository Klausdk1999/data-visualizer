// Type definitions for the application

export interface User {
  id: number;
  name: string;
  email?: string;
  categoria?: string;
  matricula?: string;
  rfid?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Device {
  id: number;
  name: string;
  description?: string;
  device_type?: string;
  location?: string;
  user_id?: number;
  user?: User;
  auth_token?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Signal {
  id: number;
  device_id: number;
  device?: Device;
  name: string;
  signal_type: "digital" | "analogic";
  direction: "input" | "output";
  sensor_name?: string;
  description?: string;
  unit?: string;
  min_value?: number;
  max_value?: number;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SignalValue {
  id: number;
  signal_id: number;
  signal?: Signal;
  user_id?: number;
  user?: User;
  timestamp: string;
  value?: number;
  digital_value?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateDeviceRequest {
  name: string;
  description?: string;
  device_type?: string;
  location?: string;
}

export interface CreateSignalRequest {
  device_id: number;
  name: string;
  signal_type: "digital" | "analogic";
  direction: "input" | "output";
  sensor_name?: string;
  description?: string;
  unit?: string;
  min_value?: number;
  max_value?: number;
  metadata?: Record<string, any>;
  is_active?: boolean;
}

export interface CreateSignalValueRequest {
  signal_id: number;
  user_id?: number;
  timestamp?: string;
  value?: number;
  digital_value?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateUserRequest {
  name: string;
  email?: string;
  password?: string;
  categoria?: string;
  matricula?: string;
  rfid?: string;
}

