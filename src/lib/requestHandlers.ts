// apiService.ts
import axios from "axios";

// Use relative path when behind nginx, or full URL for direct access
const getBaseURL = () => {
  const envURL = process.env.NEXT_PUBLIC_API_URL;
  if (envURL) {
    if (envURL.startsWith('/')) {
      return envURL;
    }
    return envURL.endsWith('/') ? envURL : `${envURL}/`;
  }
  return typeof window !== 'undefined' ? '/api/' : 'http://localhost:8080/';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
});

// Add auth token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const login = async (email: string, password: string) => {
  try {
    const response = await axiosInstance.post("auth/login", { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

// User endpoints
export const getUsers = async () => {
  try {
    const response = await axiosInstance.get("users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const createUser = async (userData: any) => {
  try {
    const response = await axiosInstance.post("users", userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Device endpoints
export const getDevices = async (params?: { user_id?: string; active?: string }) => {
  try {
    const response = await axiosInstance.get("devices", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
};

export const getDevice = async (deviceId: string) => {
  try {
    const response = await axiosInstance.get(`devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching device:", error);
    throw error;
  }
};

export const createDevice = async (deviceData: any) => {
  try {
    const response = await axiosInstance.post("auth/register-device", deviceData);
    return response.data;
  } catch (error) {
    console.error("Error creating device:", error);
    throw error;
  }
};

export const updateDevice = async (deviceId: string, deviceData: any) => {
  try {
    const response = await axiosInstance.put(`devices/${deviceId}`, deviceData);
    return response.data;
  } catch (error) {
    console.error("Error updating device:", error);
    throw error;
  }
};

export const deleteDevice = async (deviceId: string) => {
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
}) => {
  try {
    const response = await axiosInstance.get("signals", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching signals:", error);
    throw error;
  }
};

export const getSignal = async (signalId: string) => {
  try {
    const response = await axiosInstance.get(`signals/${signalId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching signal:", error);
    throw error;
  }
};

export const createSignal = async (signalData: any) => {
  try {
    const response = await axiosInstance.post("signals", signalData);
    return response.data;
  } catch (error) {
    console.error("Error creating signal:", error);
    throw error;
  }
};

export const updateSignal = async (signalId: string, signalData: any) => {
  try {
    const response = await axiosInstance.put(`signals/${signalId}`, signalData);
    return response.data;
  } catch (error) {
    console.error("Error updating signal:", error);
    throw error;
  }
};

export const deleteSignal = async (signalId: string) => {
  try {
    await axiosInstance.delete(`signals/${signalId}`);
  } catch (error) {
    console.error("Error deleting signal:", error);
    throw error;
  }
};

export const getSignalsByDevice = async (deviceId: string, params?: {
  signal_type?: string;
  direction?: string;
}) => {
  try {
    const response = await axiosInstance.get(`devices/${deviceId}/signals`, { params });
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
}) => {
  try {
    const response = await axiosInstance.get("signal-values", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching signal values:", error);
    throw error;
  }
};

export const getSignalValue = async (valueId: string) => {
  try {
    const response = await axiosInstance.get(`signal-values/${valueId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching signal value:", error);
    throw error;
  }
};

export const createSignalValue = async (valueData: any) => {
  try {
    const response = await axiosInstance.post("signal-values", valueData);
    return response.data;
  } catch (error) {
    console.error("Error creating signal value:", error);
    throw error;
  }
};

export const getSignalValuesBySignal = async (signalId: string, params?: {
  from_date?: string;
  to_date?: string;
  limit?: string;
}) => {
  try {
    const response = await axiosInstance.get(`signals/${signalId}/values`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching signal values:", error);
    throw error;
  }
};
