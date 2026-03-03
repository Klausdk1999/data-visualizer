# Data Visualizer - Next.js Frontend

Web dashboard for visualizing IoT device data, managing devices, configuring signals, and manufacturing execution (MES).

## Dependencies

- **Node.js 20+**
- **npm** or **yarn** or **pnpm**

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install

# Or with pnpm
pnpm install
```

## Configuration

Create `.env.local` file (optional):

```env
NEXT_PUBLIC_API_URL=/api
```

For local development without nginx:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Commands

### Development

```bash
# Start development server
npm run dev
# Opens http://localhost:3000

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
# Generates: coverage/ directory

# Run tests in CI mode
npm run test:ci
```

### Code Quality

```bash
# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check

# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
data-visualizer/
├── src/
│   ├── pages/                  # Next.js pages
│   │   ├── index.tsx           # Main dashboard page
│   │   └── ttn/
│   │       └── index.tsx       # TTN river monitoring dashboard
│   ├── components/
│   │   ├── Login.tsx           # Authentication component
│   │   ├── Dashboard.tsx       # Main dashboard shell with tab navigation
│   │   ├── dialogs/            # Modal dialogs for CRUD operations
│   │   │   ├── DeviceDialog.tsx
│   │   │   ├── SignalDialog.tsx
│   │   │   ├── SignalValueDialog.tsx
│   │   │   ├── UserDialog.tsx
│   │   │   ├── ProductDialog.tsx
│   │   │   ├── ProductionOrderDialog.tsx
│   │   │   ├── RawMaterialDialog.tsx
│   │   │   ├── BOMDialog.tsx
│   │   │   └── StockAdjustDialog.tsx
│   │   ├── tabs/               # Dashboard tab components
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── DevicesTab.tsx
│   │   │   ├── SignalsTab.tsx
│   │   │   ├── SignalValuesTab.tsx
│   │   │   ├── UsersTab.tsx
│   │   │   ├── ProductsTab.tsx
│   │   │   ├── MaterialsTab.tsx
│   │   │   └── OrdersTab.tsx
│   │   ├── ttn/                # TTN-specific components
│   │   │   ├── TTNChart.tsx
│   │   │   ├── TTNDataTable.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   └── ParameterSelector.tsx
│   │   ├── ui/                 # shadcn/ui components
│   │   └── __tests__/          # Component tests
│   ├── lib/
│   │   ├── requestHandlers.ts  # API client with auth handling
│   │   └── __tests__/
│   ├── types/
│   │   ├── index.ts            # Main type definitions
│   │   └── ttn.ts              # TTN-specific types
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── jest.config.js
├── jest.setup.js
└── .prettierrc
```

## Features

- ✅ **User Authentication** - Login with email/password, JWT-based sessions
- ✅ **Device Management** - CRUD for IoT devices with signal configuration
- ✅ **Signal Configuration** - Configure input/output, analogic/digital signals
- ✅ **Signal Values** - Time-series data visualization with Recharts
  - Multi-signal comparison on a single chart
  - Preset time ranges (1h, 24h, 7d, 30d) and custom date ranges
  - URL-based filter state for shareable links
- ✅ **TTN River Monitoring** - Dedicated dashboard at `/ttn`
  - Interactive charts (distance/battery over time)
  - Data table with sorting and filtering
  - Date range and parameter selection
- ✅ **Manufacturing Execution System (MES)**
  - Product management with Bill of Materials (BOM)
  - Raw material inventory with stock adjustments
  - Production order tracking with status transitions (planned → in_progress → completed)
  - Signal values linked to production orders via device and time range
- ✅ **Responsive Design** - Works on desktop and mobile

## URL Routing

The dashboard supports URL-based navigation via query parameters:

- `/?tab=dashboard` - Overview dashboard
- `/?tab=devices` - Device management
- `/?tab=signals` - Signal configurations
- `/?tab=values` - Signal values (supports `&signals=1,2,3`, `&timespan=1h|24h|7d|30d`, `&from=YYYY-MM-DD&to=YYYY-MM-DD`)
- `/?tab=users` - User management
- `/?tab=products` - Product management with BOM
- `/?tab=materials` - Raw material inventory and stock
- `/?tab=orders` - Production order tracking

## Usage

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open browser:**
   Navigate to http://localhost:3000

3. **Login:**
   - Use credentials from your backend
   - Default: Create a user via API first

4. **Manage Devices:**
   - View all devices
   - Register new devices
   - Configure signals

5. **View Data:**
   - Browse signal values
   - Filter by device or signal
   - View real-time updates

6. **TTN River Monitoring:**
   - Navigate to `/ttn` route
   - View distance and battery charts
   - Filter by date range
   - View detailed data table

## API Integration

The frontend communicates with the Go API. Ensure:

- API is running on `http://localhost:8080` (or configure `NEXT_PUBLIC_API_URL`)
- CORS is enabled on the API
- Authentication tokens are stored in localStorage

## Testing

Tests are located alongside source files:

- `src/lib/__tests__/requestHandlers.test.ts` - API client tests
- `src/components/__tests__/Login.test.tsx` - Component tests

Run tests:

```bash
npm test
```

## Docker

```bash
# Build image
docker build -t iot-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api:8080 \
  iot-frontend
```

## Testing

### Unit Tests (Jest)

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### E2E Tests (Playwright)

```bash
# First time: Install Playwright and browsers
npm install -D @playwright/test
npx playwright install

# Run E2E tests
npm run test:e2e      # Headless mode
npm run test:e2e:ui   # UI mode (interactive)
npm run test:e2e:headed # Headed mode (see browser)

# Note: Make sure both frontend and backend are running before running E2E tests
```

## Troubleshooting

- **API connection errors**: Check `NEXT_PUBLIC_API_URL` and ensure API is running on `http://localhost:8080`
- **Network Error on login**: Verify backend is running and accessible. Check terminal for backend logs.
- **Authentication issues**: Clear localStorage and login again
- **Build errors**: Delete `.next` folder and rebuild
- **Test failures**: Ensure all dependencies are installed

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Code splitting enabled
- Image optimization
- CSS optimization
- Production builds are optimized automatically
