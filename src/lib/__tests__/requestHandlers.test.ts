import { login, logout, getCurrentUser, isAuthenticated } from "../requestHandlers";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("requestHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });

  describe("login", () => {
    it("should login successfully and store token", async () => {
      const mockResponse = {
        data: {
          token: "test-token",
          user: { id: 1, email: "test@example.com" },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await login("test@example.com", "password");

      expect(result.token).toBe("test-token");
      expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", "test-token");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockResponse.data.user)
      );
    });

    it("should throw error on login failure", async () => {
      mockedAxios.post.mockRejectedValue({
        response: { data: "Invalid credentials" },
      });

      await expect(login("test@example.com", "wrong")).rejects.toThrow();
    });
  });

  describe("logout", () => {
    it("should clear localStorage", () => {
      logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith("auth_token");
      expect(localStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  describe("getCurrentUser", () => {
    it("should return user from localStorage", () => {
      const user = { id: 1, email: "test@example.com" };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(user));

      const result = getCurrentUser();
      expect(result).toEqual(user);
    });

    it("should return null if no user in localStorage", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true if token exists", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue("test-token");

      expect(isAuthenticated()).toBe(true);
    });

    it("should return false if no token", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
    });
  });
});
