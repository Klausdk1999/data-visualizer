// apiService.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://go-pe.onrender.com/",
});

export const getUsers = async () => {
  try {
    const response = await axiosInstance.get("users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getReadings = async () => {
  try {
    const response = await axiosInstance.get("readings");
    return response.data;
  } catch (error) {
    console.error("Error fetching readings:", error);
    throw error;
  }
};

export const getReadingsByUser = async (userId: string) => {
  try {
    const response = await axiosInstance.get(`readings/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching readings:", error);
    throw error;
  }
};

export const getReadingsForUser = async (userId: number) => {
  try {
    const response = await fetch(`/api/user-readings/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching readings for user:", error);
    return [];
  }
};

