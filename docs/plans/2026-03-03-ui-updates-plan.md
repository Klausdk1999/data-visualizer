# Data Visualizer UI Updates — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dark/light mode with system detection, i18n support (EN + PT-BR) with locale auto-detect, and redesign the login page with elevated glassmorphism + Framer Motion animations.

**Architecture:** Three layered features. Dark mode is foundational (CSS consolidation + `next-themes` provider). i18n wraps on top (`next-intl` provider). Login redesign uses both plus `framer-motion`. All changes are UI-only — no API/routing changes.

**Tech Stack:** next-themes, next-intl, framer-motion, existing shadcn/ui + Tailwind + lucide-react

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install all three packages**

Run:
```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm install next-themes next-intl framer-motion
```

**Step 2: Verify installation**

Run:
```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && node -e "require('next-themes'); require('framer-motion'); console.log('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add package.json package-lock.json && git commit -m "feat: add next-themes, next-intl, framer-motion dependencies"
```

---

### Task 2: Consolidate CSS and set up dark mode

**Files:**
- Modify: `src/styles/globals.css` — replace contents with merged CSS from `app/globals.css`
- Modify: `components.json` — update CSS path to point to `src/styles/globals.css`
- Delete: `app/globals.css` — no longer needed
- Delete: `tailwind.config.ts` — redundant, `.js` version is the active one

**Step 1: Replace `src/styles/globals.css` with the full theme**

Replace the entire contents of `src/styles/globals.css` with the contents of `app/globals.css` (the one with CSS variable tokens, `.dark` class, body gradients, and glass utilities). This is the file imported by `_app.tsx`, so it's what actually takes effect. The content is:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 20% 98%;
    --foreground: 220 13% 18%;

    --card: 0 0% 100%;
    --card-foreground: 220 13% 18%;

    --popover: 0 0% 100%;
    --popover-foreground: 220 13% 18%;

    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;

    --secondary: 210 20% 94%;
    --secondary-foreground: 220 13% 18%;

    --muted: 210 20% 96%;
    --muted-foreground: 220 9% 46%;

    --accent: 210 20% 94%;
    --accent-foreground: 220 13% 18%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 217 91% 60%;

    --radius: 1rem;
  }

  .dark {
    --background: 220 18% 20%;
    --foreground: 210 20% 98%;

    --card: 220 15% 25%;
    --card-foreground: 210 20% 98%;

    --popover: 220 15% 25%;
    --popover-foreground: 210 20% 98%;

    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;

    --secondary: 220 15% 30%;
    --secondary-foreground: 210 20% 98%;

    --muted: 220 15% 30%;
    --muted-foreground: 210 10% 70%;

    --accent: 220 15% 30%;
    --accent-foreground: 210 20% 98%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 13% 35%;
    --input: 220 13% 35%;
    --ring: 217 91% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    background: linear-gradient(
      135deg,
      hsl(240, 20%, 98%) 0%,
      hsl(220, 25%, 97%) 50%,
      hsl(240, 20%, 99%) 100%
    );
    min-height: 100vh;
  }

  .dark body {
    background: linear-gradient(
      135deg,
      hsl(220, 18%, 22%) 0%,
      hsl(215, 20%, 25%) 30%,
      hsl(220, 18%, 22%) 100%
    );
  }
}

@layer utilities {
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  }

  .glass-dark {
    background: rgba(30, 35, 45, 0.6);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  }

  .glass-card-dark {
    background: rgba(40, 45, 55, 0.65);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
  }

  .glass-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 24px 0 rgba(31, 38, 135, 0.1);
  }

  .glass-header-dark {
    background: rgba(35, 40, 50, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.2);
  }
}
```

**Step 2: Update `components.json`**

Change the CSS path from `app/globals.css` to `src/styles/globals.css`:

```json
"tailwind": {
  "config": "tailwind.config.js",
  "css": "src/styles/globals.css",
  "baseColor": "slate",
  "cssVariables": true
}
```

**Step 3: Delete redundant files**

- Delete `app/globals.css`
- Delete `tailwind.config.ts` (the `.js` version is the active one, referenced by `components.json`)

**Step 4: Verify build**

Run:
```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm run build
```
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add -A && git commit -m "refactor: consolidate globals.css, remove redundant tailwind.config.ts"
```

---

### Task 3: Add ThemeProvider and theme toggle

**Files:**
- Modify: `src/pages/_app.tsx` — wrap with `ThemeProvider`
- Create: `src/components/ui/theme-toggle.tsx` — Sun/Moon toggle button

**Step 1: Create `src/components/ui/theme-toggle.tsx`**

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  );
}
```

**Step 2: Update `src/pages/_app.tsx`**

```tsx
import "@/styles/globals.css";
import Head from "next/head";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Head>
        <title>IoT Data Storage Dashboard</title>
        <meta
          name="description"
          content="IoT Data Storage Dashboard - Manage devices, signals, and data"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

**Step 3: Add `ThemeToggle` to Dashboard header**

In `src/components/Dashboard.tsx`, import `ThemeToggle`:

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";
```

Then in the header's right side `<div className="flex items-center space-x-4">` (line ~499), add `<ThemeToggle />` before the user email span:

```tsx
<div className="flex items-center space-x-4">
  <ThemeToggle />
  <span className="text-sm text-gray-700 dark:text-gray-300">
    {user?.email || user?.name}
  </span>
  <Button ...>
```

**Step 4: Verify dark mode works**

Run:
```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm run dev
```
Open browser, click the moon/sun toggle. Verify dark mode applies correctly.

**Step 5: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/components/ui/theme-toggle.tsx src/pages/_app.tsx src/components/Dashboard.tsx && git commit -m "feat: add dark/light mode toggle with next-themes"
```

---

### Task 4: Set up i18n with next-intl

**Files:**
- Create: `src/messages/en.json`
- Create: `src/messages/pt-BR.json`
- Create: `src/lib/i18n.ts` — locale detection + persistence helper
- Modify: `src/pages/_app.tsx` — add `NextIntlClientProvider`
- Modify: `src/pages/_document.tsx` — dynamic `lang` attribute

**Step 1: Create `src/lib/i18n.ts`**

```ts
const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return detectBrowserLocale();
}

export function setStoredLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const browserLang = navigator.language;
  if (browserLang.startsWith("pt")) return "pt-BR";
  return DEFAULT_LOCALE;
}

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { Locale };
```

**Step 2: Create `src/messages/en.json`**

This file contains ALL English strings for the app. Keys are organized by component area:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm",
    "loading": "Loading...",
    "error": "Error",
    "add": "Add",
    "edit": "Edit",
    "create": "Create",
    "close": "Close",
    "actions": "Actions",
    "active": "Active",
    "inactive": "Inactive",
    "yes": "Yes",
    "no": "No",
    "id": "ID",
    "name": "Name",
    "description": "Description",
    "type": "Type",
    "status": "Status",
    "noData": "No data available"
  },
  "login": {
    "title": "IoT Dashboard",
    "subtitle": "Sign in to your account",
    "email": "Email",
    "emailPlaceholder": "user@example.com",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "submit": "Sign In",
    "submitting": "Signing in...",
    "errorInvalidCredentials": "Invalid email or password. Please try again.",
    "errorInvalidRequest": "Invalid request. Please check your input.",
    "errorNetwork": "Unable to connect to server. Please check if the API is running.",
    "errorTimeout": "Connection timed out. Please try again.",
    "errorGeneric": "Login failed. Please try again later."
  },
  "header": {
    "title": "IoT Data Storage Dashboard",
    "logout": "Logout"
  },
  "tabs": {
    "dashboard": "Dashboard",
    "devices": "Devices",
    "signals": "Signal Configurations",
    "values": "Signal Values",
    "products": "Products",
    "materials": "Materials",
    "orders": "Orders",
    "users": "Users"
  },
  "devices": {
    "title": "Devices",
    "addDevice": "Add Device",
    "editDevice": "Edit Device",
    "createDevice": "Create Device",
    "name": "Name",
    "type": "Type",
    "location": "Location",
    "token": "Auth Token",
    "isActive": "Active",
    "confirmDelete": "Are you sure you want to delete this device?"
  },
  "signals": {
    "title": "Signal Configurations",
    "addSignal": "Add Signal",
    "editSignal": "Edit Signal",
    "createSignal": "Create Signal",
    "device": "Device",
    "signalType": "Signal Type",
    "direction": "Direction",
    "unit": "Unit",
    "minValue": "Min Value",
    "maxValue": "Max Value",
    "digital": "Digital",
    "analogic": "Analogic",
    "input": "Input",
    "output": "Output"
  },
  "signalValues": {
    "title": "Signal Values",
    "addValue": "Add Value",
    "signal": "Signal",
    "value": "Value",
    "digitalValue": "Digital Value",
    "timestamp": "Timestamp",
    "timeRange": "Time Range",
    "last1h": "Last 1h",
    "last24h": "Last 24h",
    "last7d": "Last 7 days",
    "last30d": "Last 30 days",
    "custom": "Custom",
    "from": "From",
    "to": "To",
    "chart": "Chart",
    "table": "Table"
  },
  "users": {
    "title": "Users",
    "addUser": "Add User",
    "editUser": "Edit User",
    "createUser": "Create User",
    "email": "Email",
    "password": "Password",
    "category": "Category",
    "matricula": "Matricula",
    "rfid": "RFID"
  },
  "products": {
    "title": "Products",
    "addProduct": "Add Product",
    "editProduct": "Edit Product",
    "createProduct": "Create Product",
    "sku": "SKU",
    "category": "Category",
    "bom": "Bill of Materials",
    "manageBom": "Manage BOM",
    "addBomEntry": "Add BOM Entry",
    "rawMaterial": "Raw Material",
    "quantity": "Quantity"
  },
  "materials": {
    "title": "Raw Materials",
    "addMaterial": "Add Material",
    "editMaterial": "Edit Material",
    "createMaterial": "Create Material",
    "sku": "SKU",
    "stock": "Stock",
    "minStock": "Min Stock",
    "unit": "Unit",
    "category": "Category",
    "adjustStock": "Adjust Stock",
    "adjustment": "Adjustment",
    "reason": "Reason"
  },
  "orders": {
    "title": "Production Orders",
    "addOrder": "Add Order",
    "editOrder": "Edit Order",
    "createOrder": "Create Order",
    "product": "Product",
    "quantity": "Quantity",
    "planned": "Planned",
    "inProgress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "device": "Device",
    "startOrder": "Start",
    "completeOrder": "Complete",
    "cancelOrder": "Cancel",
    "workInstructions": "Work Instructions",
    "qualityNotes": "Quality Notes"
  },
  "ttn": {
    "title": "TTN River Monitoring",
    "devices": "Devices",
    "uplinks": "Uplinks",
    "stats": "Statistics",
    "distance": "Distance",
    "temperature": "Temperature",
    "humidity": "Humidity",
    "battery": "Battery",
    "rssi": "RSSI",
    "snr": "SNR",
    "dateRange": "Date Range",
    "parameter": "Parameter",
    "startDate": "Start Date",
    "endDate": "End Date",
    "totalUplinks": "Total Uplinks",
    "activeDevices": "Active Devices"
  },
  "dashboardTab": {
    "totalDevices": "Total Devices",
    "totalSignals": "Total Signals",
    "totalValues": "Total Values",
    "totalUsers": "Total Users",
    "recentValues": "Recent Values",
    "totalProducts": "Total Products",
    "totalMaterials": "Total Materials",
    "activeOrders": "Active Orders"
  },
  "errors": {
    "fetchFailed": "Failed to fetch data. Please try again.",
    "authFailed": "Authentication failed. Please login again.",
    "noToken": "No authentication token found. Please login again.",
    "deleteFailed": "Failed to delete item",
    "saveFailed": "Failed to save item",
    "updateFailed": "Failed to update item"
  }
}
```

**Step 3: Create `src/messages/pt-BR.json`**

```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "confirm": "Confirmar",
    "loading": "Carregando...",
    "error": "Erro",
    "add": "Adicionar",
    "edit": "Editar",
    "create": "Criar",
    "close": "Fechar",
    "actions": "Ações",
    "active": "Ativo",
    "inactive": "Inativo",
    "yes": "Sim",
    "no": "Não",
    "id": "ID",
    "name": "Nome",
    "description": "Descrição",
    "type": "Tipo",
    "status": "Status",
    "noData": "Nenhum dado disponível"
  },
  "login": {
    "title": "IoT Dashboard",
    "subtitle": "Entre na sua conta",
    "email": "Email",
    "emailPlaceholder": "usuario@exemplo.com",
    "password": "Senha",
    "passwordPlaceholder": "Digite sua senha",
    "submit": "Entrar",
    "submitting": "Entrando...",
    "errorInvalidCredentials": "Email ou senha inválidos. Tente novamente.",
    "errorInvalidRequest": "Requisição inválida. Verifique seus dados.",
    "errorNetwork": "Não foi possível conectar ao servidor. Verifique se a API está funcionando.",
    "errorTimeout": "Conexão expirou. Tente novamente.",
    "errorGeneric": "Falha no login. Tente novamente mais tarde."
  },
  "header": {
    "title": "Painel IoT de Armazenamento de Dados",
    "logout": "Sair"
  },
  "tabs": {
    "dashboard": "Painel",
    "devices": "Dispositivos",
    "signals": "Configurações de Sinais",
    "values": "Valores de Sinais",
    "products": "Produtos",
    "materials": "Materiais",
    "orders": "Ordens",
    "users": "Usuários"
  },
  "devices": {
    "title": "Dispositivos",
    "addDevice": "Adicionar Dispositivo",
    "editDevice": "Editar Dispositivo",
    "createDevice": "Criar Dispositivo",
    "name": "Nome",
    "type": "Tipo",
    "location": "Localização",
    "token": "Token de Autenticação",
    "isActive": "Ativo",
    "confirmDelete": "Tem certeza que deseja excluir este dispositivo?"
  },
  "signals": {
    "title": "Configurações de Sinais",
    "addSignal": "Adicionar Sinal",
    "editSignal": "Editar Sinal",
    "createSignal": "Criar Sinal",
    "device": "Dispositivo",
    "signalType": "Tipo de Sinal",
    "direction": "Direção",
    "unit": "Unidade",
    "minValue": "Valor Mínimo",
    "maxValue": "Valor Máximo",
    "digital": "Digital",
    "analogic": "Analógico",
    "input": "Entrada",
    "output": "Saída"
  },
  "signalValues": {
    "title": "Valores de Sinais",
    "addValue": "Adicionar Valor",
    "signal": "Sinal",
    "value": "Valor",
    "digitalValue": "Valor Digital",
    "timestamp": "Data/Hora",
    "timeRange": "Período",
    "last1h": "Última 1h",
    "last24h": "Últimas 24h",
    "last7d": "Últimos 7 dias",
    "last30d": "Últimos 30 dias",
    "custom": "Personalizado",
    "from": "De",
    "to": "Até",
    "chart": "Gráfico",
    "table": "Tabela"
  },
  "users": {
    "title": "Usuários",
    "addUser": "Adicionar Usuário",
    "editUser": "Editar Usuário",
    "createUser": "Criar Usuário",
    "email": "Email",
    "password": "Senha",
    "category": "Categoria",
    "matricula": "Matrícula",
    "rfid": "RFID"
  },
  "products": {
    "title": "Produtos",
    "addProduct": "Adicionar Produto",
    "editProduct": "Editar Produto",
    "createProduct": "Criar Produto",
    "sku": "SKU",
    "category": "Categoria",
    "bom": "Lista de Materiais",
    "manageBom": "Gerenciar BOM",
    "addBomEntry": "Adicionar Item BOM",
    "rawMaterial": "Matéria-Prima",
    "quantity": "Quantidade"
  },
  "materials": {
    "title": "Matérias-Primas",
    "addMaterial": "Adicionar Material",
    "editMaterial": "Editar Material",
    "createMaterial": "Criar Material",
    "sku": "SKU",
    "stock": "Estoque",
    "minStock": "Estoque Mínimo",
    "unit": "Unidade",
    "category": "Categoria",
    "adjustStock": "Ajustar Estoque",
    "adjustment": "Ajuste",
    "reason": "Motivo"
  },
  "orders": {
    "title": "Ordens de Produção",
    "addOrder": "Adicionar Ordem",
    "editOrder": "Editar Ordem",
    "createOrder": "Criar Ordem",
    "product": "Produto",
    "quantity": "Quantidade",
    "planned": "Planejada",
    "inProgress": "Em Progresso",
    "completed": "Concluída",
    "cancelled": "Cancelada",
    "device": "Dispositivo",
    "startOrder": "Iniciar",
    "completeOrder": "Concluir",
    "cancelOrder": "Cancelar",
    "workInstructions": "Instruções de Trabalho",
    "qualityNotes": "Notas de Qualidade"
  },
  "ttn": {
    "title": "Monitoramento de Rios TTN",
    "devices": "Dispositivos",
    "uplinks": "Uplinks",
    "stats": "Estatísticas",
    "distance": "Distância",
    "temperature": "Temperatura",
    "humidity": "Umidade",
    "battery": "Bateria",
    "rssi": "RSSI",
    "snr": "SNR",
    "dateRange": "Período",
    "parameter": "Parâmetro",
    "startDate": "Data Inicial",
    "endDate": "Data Final",
    "totalUplinks": "Total de Uplinks",
    "activeDevices": "Dispositivos Ativos"
  },
  "dashboardTab": {
    "totalDevices": "Total de Dispositivos",
    "totalSignals": "Total de Sinais",
    "totalValues": "Total de Valores",
    "totalUsers": "Total de Usuários",
    "recentValues": "Valores Recentes",
    "totalProducts": "Total de Produtos",
    "totalMaterials": "Total de Materiais",
    "activeOrders": "Ordens Ativas"
  },
  "errors": {
    "fetchFailed": "Falha ao carregar dados. Tente novamente.",
    "authFailed": "Falha na autenticação. Faça login novamente.",
    "noToken": "Token de autenticação não encontrado. Faça login novamente.",
    "deleteFailed": "Falha ao excluir item",
    "saveFailed": "Falha ao salvar item",
    "updateFailed": "Falha ao atualizar item"
  }
}
```

**Step 4: Create locale switcher component `src/components/ui/locale-switcher.tsx`**

```tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { type Locale, SUPPORTED_LOCALES, setStoredLocale } from "@/lib/i18n";

interface LocaleSwitcherProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  "pt-BR": "PT",
};

export function LocaleSwitcher({ locale, onLocaleChange }: LocaleSwitcherProps) {
  const handleChange = () => {
    const nextLocale = locale === "en" ? "pt-BR" : "en";
    setStoredLocale(nextLocale);
    onLocaleChange(nextLocale);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleChange}
      className="text-xs font-semibold px-2"
      title={locale === "en" ? "Mudar para Português" : "Switch to English"}
    >
      {LOCALE_LABELS[locale]}
    </Button>
  );
}
```

**Step 5: Update `src/pages/_app.tsx` with `NextIntlClientProvider`**

```tsx
import "@/styles/globals.css";
import Head from "next/head";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { useState, useEffect } from "react";
import { getStoredLocale, type Locale } from "@/lib/i18n";
import enMessages from "@/messages/en.json";
import ptBRMessages from "@/messages/pt-BR.json";

const messages = {
  en: enMessages,
  "pt-BR": ptBRMessages,
};

export default function App({ Component, pageProps }: AppProps) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        <Head>
          <title>IoT Data Storage Dashboard</title>
          <meta
            name="description"
            content="IoT Data Storage Dashboard - Manage devices, signals, and data"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} locale={locale} onLocaleChange={setLocale} />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
```

**Step 6: Update `src/pages/_document.tsx`**

Remove the hardcoded `<title>` and `<meta>` tags (they're already in `_app.tsx`):

```tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

**Step 7: Verify build**

Run:
```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm run build
```
Expected: Build succeeds.

**Step 8: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/messages/ src/lib/i18n.ts src/components/ui/locale-switcher.tsx src/pages/_app.tsx src/pages/_document.tsx && git commit -m "feat: add i18n infrastructure with EN and PT-BR translations"
```

---

### Task 5: Apply i18n to Login component

**Files:**
- Modify: `src/components/Login.tsx`

**Step 1: Update Login to use translations**

Replace hardcoded strings with `useTranslations()`. The Login component receives `locale` and `onLocaleChange` props (passed through from `_app.tsx` via `index.tsx`).

Add at the top of the Login component:
```tsx
import { useTranslations } from "next-intl";
```

Inside the component function:
```tsx
const t = useTranslations("login");
```

Then replace:
- `"IoT Dashboard Login"` → `t("title")`
- `"Email"` → `t("email")`
- `"user@example.com"` → `t("emailPlaceholder")`
- `"Password"` → `t("password")`
- `"••••••••"` → `t("passwordPlaceholder")`
- `"Logging in..."` → `t("submitting")`
- `"Login"` → `t("submit")`
- Error messages → use `t("errorInvalidCredentials")`, `t("errorNetwork")`, etc.

**Step 2: Verify the login page renders with translations**

Run dev server and check both locales work.

**Step 3: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/components/Login.tsx src/pages/index.tsx && git commit -m "feat: apply i18n translations to login page"
```

---

### Task 6: Apply i18n to Dashboard header and tabs

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add translations to Dashboard**

Import and use translations:
```tsx
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
```

Inside the component:
```tsx
const t = useTranslations();
```

Replace in header:
- `"IoT Data Storage Dashboard"` → `t("header.title")`
- `"Logout"` → `t("header.logout")`

Replace tab labels:
- `"Dashboard"` → `t("tabs.dashboard")`
- `"Devices"` → `t("tabs.devices")`
- `"Signal Configurations"` → `t("tabs.signals")`
- `"Signal Values"` → `t("tabs.values")`
- `"Products"` → `t("tabs.products")`
- `"Materials"` → `t("tabs.materials")`
- `"Orders"` → `t("tabs.orders")`
- `"Users"` → `t("tabs.users")`

Replace error messages:
- `"No authentication token found..."` → `t("errors.noToken")`
- `"Authentication failed..."` → `t("errors.authFailed")`
- `"Failed to fetch data..."` → `t("errors.fetchFailed")`

Add `<LocaleSwitcher />` next to `<ThemeToggle />` in header.

**Step 2: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/components/Dashboard.tsx && git commit -m "feat: apply i18n to dashboard header and tab navigation"
```

---

### Task 7: Apply i18n to tab components

**Files:**
- Modify: `src/components/tabs/DevicesTab.tsx`
- Modify: `src/components/tabs/SignalsTab.tsx`
- Modify: `src/components/tabs/SignalValuesTab.tsx`
- Modify: `src/components/tabs/UsersTab.tsx`
- Modify: `src/components/tabs/ProductsTab.tsx`
- Modify: `src/components/tabs/MaterialsTab.tsx`
- Modify: `src/components/tabs/OrdersTab.tsx`
- Modify: `src/components/tabs/DashboardTab.tsx`

**Step 1: For each tab component**

Add `import { useTranslations } from "next-intl";` at the top. Add `const t = useTranslations("<section>");` in the component body. Replace all hardcoded English strings (titles, button labels, table headers) with `t("key")` calls using the keys from the translation files.

Pattern for each tab:
- Card title → `t("title")`
- "Add X" button → `t("addX")`
- Table headers → `t("name")`, `t("type")`, etc.
- Common strings → use `useTranslations("common")` as a second hook: `const tc = useTranslations("common");`

**Step 2: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/components/tabs/ && git commit -m "feat: apply i18n translations to all tab components"
```

---

### Task 8: Apply i18n to dialog components

**Files:**
- Modify: `src/components/dialogs/DeviceDialog.tsx`
- Modify: `src/components/dialogs/SignalDialog.tsx`
- Modify: `src/components/dialogs/SignalValueDialog.tsx`
- Modify: `src/components/dialogs/UserDialog.tsx`
- Modify: `src/components/dialogs/ProductDialog.tsx`
- Modify: `src/components/dialogs/RawMaterialDialog.tsx`
- Modify: `src/components/dialogs/ProductionOrderDialog.tsx`
- Modify: `src/components/dialogs/StockAdjustDialog.tsx`
- Modify: `src/components/dialogs/BOMDialog.tsx`

**Step 1: For each dialog component**

Same pattern as tabs. Import `useTranslations`, replace hardcoded strings:
- Dialog titles: `"Edit Device"` → `t("editDevice")`, `"Create Device"` → `t("createDevice")`
- Labels: `"Name"` → `t("name")`, `"Description"` → `tc("description")`
- Buttons: `"Save"` → `tc("save")`, `"Cancel"` → `tc("cancel")`

**Step 2: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/components/dialogs/ && git commit -m "feat: apply i18n translations to all dialog components"
```

---

### Task 9: Apply i18n to TTN components

**Files:**
- Modify: `src/pages/ttn/index.tsx`
- Modify: `src/components/ttn/TTNChart.tsx`
- Modify: `src/components/ttn/TTNDataTable.tsx`
- Modify: `src/components/ttn/DateRangePicker.tsx`
- Modify: `src/components/ttn/ParameterSelector.tsx`

**Step 1: Apply translations**

Same pattern. Use `useTranslations("ttn")` for TTN-specific strings.

**Step 2: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/pages/ttn/ src/components/ttn/ && git commit -m "feat: apply i18n translations to TTN components"
```

---

### Task 10: Redesign Login page with Framer Motion

**Files:**
- Modify: `src/components/Login.tsx` — complete rewrite
- Modify: `src/styles/globals.css` — add animated gradient keyframes

**Step 1: Add animated gradient keyframes to `src/styles/globals.css`**

Add at the end, inside a new `@layer utilities` block or after the existing one:

```css
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(5px) rotate(-1deg);
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
```

**Step 2: Rewrite `src/components/Login.tsx`**

```tsx
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

    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
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
    } finally {
      setLoading(false);
    }
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
```

**Step 3: Update `src/pages/index.tsx` to pass locale props to Login**

The `Login` component now accepts optional `locale` and `onLocaleChange` props. Update `index.tsx` to pass them through from pageProps:

```tsx
if (!authenticated) {
  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      locale={pageProps?.locale}
      onLocaleChange={pageProps?.onLocaleChange}
    />
  );
}
```

Note: The props are passed by `_app.tsx` via the `Component` render. The `index.tsx` page component receives them as props.

**Step 4: Verify the login page**

Run:
```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm run dev
```

Open browser. Verify:
- Animated gradient background
- Floating blobs
- Card slides in with animation
- Form fields stagger in
- Theme toggle and locale switcher in top-right
- Error messages animate in/out
- Loading spinner on submit

**Step 5: Commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add src/components/Login.tsx src/pages/index.tsx src/styles/globals.css && git commit -m "feat: redesign login page with framer-motion animations and glassmorphism"
```

---

### Task 11: Final verification and build check

**Files:** None (verification only)

**Step 1: Run build**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm run build
```
Expected: No errors.

**Step 2: Run tests**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && npm run test
```
Note: The Login test may need updating for the new structure.

**Step 3: Manual verification checklist**

- [ ] Dark mode toggles correctly on Login page
- [ ] Dark mode toggles correctly on Dashboard
- [ ] Theme preference persists across page reload
- [ ] System theme is detected on first visit
- [ ] Locale auto-detects browser language
- [ ] Locale switcher works on Login page
- [ ] Locale switcher works on Dashboard
- [ ] Locale preference persists across reload
- [ ] All tab names are translated in PT-BR
- [ ] All dialog titles/labels are translated in PT-BR
- [ ] Login page animations are smooth
- [ ] Login error messages show correctly in both languages
- [ ] Build succeeds with no errors

**Step 4: Final commit**

```bash
cd C:/Users/Klaus/Documents/Mestrado/data-visualizer && git add -A && git commit -m "feat: complete UI updates — dark mode, i18n, login redesign"
```
