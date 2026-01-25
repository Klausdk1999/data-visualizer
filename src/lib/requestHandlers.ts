// apiService.ts
import axios from "axios";
import type {
  User,
  Device,
  Signal,
  SignalValue,
  LoginResponse,
  CreateDeviceRequest,
  CreateSignalRequest,
  CreateSignalValueRequest,
  CreateUserRequest,
} from "@/types";
import type { TTNUplink, TTNDevice, TTNStats } from "@/types/ttn";

// Use relative path when behind nginx, or full URL for direct access
const getBaseURL = () => {
  const envURL = process.env.NEXT_PUBLIC_API_URL;
  if (envURL) {
    if (envURL.startsWith("/")) {
      return envURL;
    }
    // Remove trailing slash if present, we'll add it per-request
    return envURL.replace(/\/$/, "");
  }
  // Default to localhost:8080 for development
  return "http://localhost:8080";
};

// Auth event system for handling 401 errors globally
type AuthEventCallback = () => void;
let onUnauthorizedCallback: AuthEventCallback | null = null;

export const setOnUnauthorizedCallback = (callback: AuthEventCallback | null) => {
  onUnauthorizedCallback = callback;
};

const handleUnauthorized = () => {
  // Clear auth data
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  // Notify listeners
  if (onUnauthorizedCallback) {
    onUnauthorizedCallback();
  }
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  // Don't require token for login endpoint
  if (token && !config.url?.includes("auth/login")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for handling 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      // Don't trigger logout for login endpoint - that's expected for bad credentials
      if (!requestUrl.includes("auth/login")) {
        console.error("401 Unauthorized - Session expired or invalid token");
        handleUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post<LoginResponse>("auth/login", { email, password });
    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("auth_token");
};

// User endpoints
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await axiosInstance.get<User[]>("users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUser = async (userId: string): Promise<User> => {
  try {
    const response = await axiosInstance.get<User>(`users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  try {
    const response = await axiosInstance.post<User>("users", userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  userData: Partial<CreateUserRequest>
): Promise<User> => {
  try {
    const response = await axiosInstance.put<User>(`users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`users/${userId}`);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Device endpoints
export const getDevices = async (params?: {
  user_id?: string;
  active?: string;
}): Promise<Device[]> => {
  try {
    const response = await axiosInstance.get<Device[]>("devices", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
};

export const getDevice = async (deviceId: string): Promise<Device> => {
  try {
    const response = await axiosInstance.get<Device>(`devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching device:", error);
    throw error;
  }
};

export const createDevice = async (
  deviceData: CreateDeviceRequest
): Promise<Device & { auth_token: string }> => {
  try {
    const response = await axiosInstance.post<Device & { auth_token: string }>(
      "auth/register-device",
      deviceData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating device:", error);
    throw error;
  }
};

export const updateDevice = async (
  deviceId: string,
  deviceData: Partial<CreateDeviceRequest & { is_active?: boolean }>
): Promise<Device> => {
  try {
    const response = await axiosInstance.put<Device>(`devices/${deviceId}`, deviceData);
    return response.data;
  } catch (error) {
    console.error("Error updating device:", error);
    throw error;
  }
};

export const deleteDevice = async (deviceId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`devices/${deviceId}`);
  } catch (error) {
    console.error("Error deleting device:", error);
    throw error;
  }
};

// Signal configuration endpoints
export const getSignals = async (params?: {
  device_id?: string;
  signal_type?: string;
  direction?: string;
  active?: string;
}): Promise<Signal[]> => {
  try {
    const response = await axiosInstance.get<Signal[]>("signals", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching signals:", error);
    throw error;
  }
};

export const getSignal = async (signalId: string): Promise<Signal> => {
  try {
    const response = await axiosInstance.get<Signal>(`signals/${signalId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching signal:", error);
    throw error;
  }
};

export const createSignal = async (signalData: CreateSignalRequest): Promise<Signal> => {
  try {
    const response = await axiosInstance.post<Signal>("signals", signalData);
    return response.data;
  } catch (error) {
    console.error("Error creating signal:", error);
    throw error;
  }
};

export const updateSignal = async (
  signalId: string,
  signalData: Partial<CreateSignalRequest>
): Promise<Signal> => {
  try {
    const response = await axiosInstance.put<Signal>(`signals/${signalId}`, signalData);
    return response.data;
  } catch (error) {
    console.error("Error updating signal:", error);
    throw error;
  }
};

export const deleteSignal = async (signalId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`signals/${signalId}`);
  } catch (error) {
    console.error("Error deleting signal:", error);
    throw error;
  }
};

export const getSignalsByDevice = async (
  deviceId: string,
  params?: {
    signal_type?: string;
    direction?: string;
  }
): Promise<Signal[]> => {
  try {
    const response = await axiosInstance.get<Signal[]>(`devices/${deviceId}/signals`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching device signals:", error);
    throw error;
  }
};

// Signal value endpoints
export const getSignalValues = async (params?: {
  signal_id?: string;
  device_id?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: string;
}): Promise<SignalValue[]> => {
  try {
    const response = await axiosInstance.get<SignalValue[]>("signal-values", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching signal values:", error);
    throw error;
  }
};

export const getSignalValue = async (valueId: string): Promise<SignalValue> => {
  try {
    const response = await axiosInstance.get<SignalValue>(`signal-values/${valueId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching signal value:", error);
    throw error;
  }
};

export const createSignalValue = async (
  valueData: CreateSignalValueRequest
): Promise<SignalValue> => {
  try {
    const response = await axiosInstance.post<SignalValue>("signal-values", valueData);
    return response.data;
  } catch (error) {
    console.error("Error creating signal value:", error);
    throw error;
  }
};

export const deleteSignalValue = async (valueId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`signal-values/${valueId}`);
  } catch (error) {
    console.error("Error deleting signal value:", error);
    throw error;
  }
};

export const getSignalValuesBySignal = async (
  signalId: string,
  params?: {
    from_date?: string;
    to_date?: string;
    limit?: string;
  }
): Promise<SignalValue[]> => {
  try {
    const response = await axiosInstance.get<SignalValue[]>(`signals/${signalId}/values`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching signal values:", error);
    throw error;
  }
};

// TTN endpoints
export const getTTNUplinks = async (params?: {
  device_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<TTNUplink[]> => {
  try {
    const response = await axiosInstance.get<TTNUplink[]>("ttn/uplinks", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching TTN uplinks:", error);
    throw error;
  }
};

export const getTTNDevices = async (): Promise<TTNDevice[]> => {
  try {
    const response = await axiosInstance.get<TTNDevice[]>("ttn/devices");
    return response.data;
  } catch (error) {
    console.error("Error fetching TTN devices:", error);
    throw error;
  }
};

export const getTTNStats = async (): Promise<TTNStats> => {
  try {
    const response = await axiosInstance.get<TTNStats>("ttn/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching TTN stats:", error);
    throw error;
  }
};
