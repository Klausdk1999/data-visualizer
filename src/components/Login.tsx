"use client";

import React, { useState } from "react";
import { login } from "@/lib/requestHandlers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">IoT Dashboard Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/70 backdrop-blur-sm text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 transition-all"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/70 backdrop-blur-sm text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 transition-all"
                placeholder="••••••••"
              />
            </div>
            {error && <div className="text-red-600 dark:text-red-400 text-sm bg-red-50/50 dark:bg-red-900/20 p-2 rounded-xl border border-red-200/50 dark:border-red-800/50">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500/90 backdrop-blur-sm text-white py-2 px-4 rounded-xl hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
