# Data Visualizer - Next.js Frontend

Web dashboard for visualizing IoT device data, managing devices, and configuring signals.

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
│   ├── pages/              # Next.js pages
│   │   └── index.tsx       # Main dashboard page
│   ├── components/         # React components
│   │   ├── Login.tsx      # Login component
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   └── __tests__/     # Component tests
│   └── lib/               # Utilities
│       ├── requestHandlers.ts  # API client
│       └── __tests__/     # API client tests
├── public/                # Static assets
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Test setup
└── .prettierrc            # Prettier config
```

## Features

- ✅ **User Authentication** - Login with email/password
- ✅ **Device Management** - View and manage IoT devices
- ✅ **Signal Configuration** - Configure input/output signals
- ✅ **Signal Values** - View real-time sensor data
- ✅ **Filtering** - Filter by device, signal, user
- ✅ **Responsive Design** - Works on desktop and mobile

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

## Troubleshooting

- **API connection errors**: Check `NEXT_PUBLIC_API_URL` and ensure API is running
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
