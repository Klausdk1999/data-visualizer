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

// MES Types

export interface Product {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  category?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  bom?: BillOfMaterials[];
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  stock_quantity: number;
  min_stock?: number;
  category?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface BillOfMaterials {
  id: number;
  product_id: number;
  product?: Product;
  raw_material_id: number;
  raw_material?: RawMaterial;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductionOrder {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  priority?: number;
  device_id?: number;
  device?: Device;
  work_instructions?: string;
  quality_notes?: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: number;
  raw_material_id: number;
  raw_material?: RawMaterial;
  production_order_id?: number;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  notes?: string;
  created_at?: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  category?: string;
  is_active?: boolean;
}

export interface CreateRawMaterialRequest {
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  category?: string;
  is_active?: boolean;
}

export interface CreateBOMEntryRequest {
  raw_material_id: number;
  quantity: number;
}

export interface CreateProductionOrderRequest {
  product_id: number;
  quantity: number;
  priority?: number;
  device_id?: number;
  work_instructions?: string;
  quality_notes?: string;
}

export interface AdjustStockRequest {
  quantity: number;
  movement_type: "in" | "out" | "adjustment";
  notes?: string;
}
