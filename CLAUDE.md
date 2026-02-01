# Data Visualizer

IoT Data Storage Dashboard - A web application for monitoring and managing IoT devices, signals, and their values.

## Tech Stack

- **Framework:** Next.js 15 (Pages Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Forms:** React Hook Form
- **Icons:** Lucide React

## Directory Structure

```
src/
├── components/
│   ├── dialogs/          # Modal dialogs for CRUD operations
│   │   ├── DeviceDialog.tsx
│   │   ├── SignalDialog.tsx
│   │   ├── SignalValueDialog.tsx
│   │   └── UserDialog.tsx
│   ├── tabs/             # Main dashboard tab components
│   │   ├── DashboardTab.tsx
│   │   ├── DevicesTab.tsx
│   │   ├── SignalsTab.tsx
│   │   ├── SignalValuesTab.tsx
│   │   └── UsersTab.tsx
│   ├── ttn/              # TTN (The Things Network) components
│   ├── ui/               # shadcn/ui components
│   ├── Dashboard.tsx     # Main dashboard component
│   └── Login.tsx         # Authentication component
├── lib/
│   └── requestHandlers.ts  # API client with axios
├── pages/
│   ├── index.tsx         # Main entry point
│   └── ttn/              # TTN monitoring pages
└── types/
    ├── index.ts          # Main type definitions
    └── ttn.ts            # TTN-specific types
```

## Key Components

- **Dashboard.tsx:** Main application shell with tab navigation, manages global state for devices, signals, and values
- **SignalValuesTab.tsx:** Displays signal values with time-series chart and data table, supports time range filtering and multi-signal comparison
- **requestHandlers.ts:** Centralized API client with authentication handling and 401 interception

## Development Commands

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Production build
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run Playwright E2E tests

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
```

## API Integration

The backend API supports the following query parameters for signal values:

- `signal_id` - Filter by signal ID
- `device_id` - Filter by device ID
- `from_date` - Start date for time range (ISO 8601)
- `to_date` - End date for time range (ISO 8601)
- `limit` - Maximum number of records

## URL Routing

The dashboard supports URL-based navigation:

- `/?tab=dashboard` - Overview dashboard
- `/?tab=devices` - Device management
- `/?tab=signals` - Signal configurations
- `/?tab=values` - Signal values with optional filters:
  - `&signals=1,2,3` - Selected signal IDs
  - `&timespan=1h|24h|7d|30d` - Preset time ranges
  - `&from=YYYY-MM-DD&to=YYYY-MM-DD` - Custom date range
- `/?tab=users` - User management
