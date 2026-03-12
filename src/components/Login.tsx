"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { login } from "@/lib/requestHandlers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { LayoutDashboard, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";

interface LoginProps {
  onLoginSuccess: () => void;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

export default function Login({ onLoginSuccess, locale = "en", onLocaleChange }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password).catch((err: any) => err);

    if (result instanceof Error || result?.isAxiosError) {
      const err = result;
      if (err.response?.status === 401) {
        setError(t("errorInvalidCredentials"));
      } else if (err.response?.status === 400) {
        setError(err.response?.data || t("errorInvalidRequest"));
      } else if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
        setError(t("errorNetwork"));
      } else if (err.code === "ECONNABORTED") {
        setError(t("errorTimeout"));
      } else {
        setError(err.response?.data || t("errorGeneric"));
      }
    } else {
      onLoginSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-indigo-950/50 dark:to-gray-900 animate-gradient" />

      {/* Floating decorative blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-300/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-300/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200/20 dark:bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-4s" }} />

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
        {onLocaleChange && (
          <LocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />
        )}
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-blue-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <LayoutDashboard className="w-7 h-7 text-white" />
            </motion.div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              {t("title")}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("subtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("emailPlaceholder")}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t("passwordPlaceholder")}
                />
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-600 dark:text-red-400 text-sm bg-red-50/50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200/50 dark:border-red-800/50"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
