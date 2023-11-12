// apiService.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/",
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
