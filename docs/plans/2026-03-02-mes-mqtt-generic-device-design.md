# MES + MQTT + Generic Device Data — Design Document

**Date:** 2026-03-02
**Status:** Approved
**Projects:** go-data-storage (backend), data-visualizer (frontend)

---

## Overview

Extend the IoT Data Storage platform with:

1. **Generic device POST route** — any microcontroller can send JSON with up to 8 fields
2. **Embedded MQTT broker** — microcontrollers connect directly via MQTT
3. **Simple MES** — production orders, products, raw materials, BOM, stock tracking
4. **IoT-MES linking** — associate devices with production orders

## Architecture: Phased Modular

Four independent phases, each delivering working features.

---

## Phase 1: Generic Device POST + Embedded MQTT Broker

### Generic POST Route

**Endpoint:** `POST /devices/data`
**Auth:** `Authorization: Bearer <device_auth_token>` or `X-API-Key: <shared_key_from_env>`

**Request format:**
```json
{
  "device_id": "my-controller-01",
  "field_1": 23.5,
  "field_2": "OK",
  "field_3": 1024,
  "field_4": null,
  "field_5": null,
  "field_6": null,
  "field_7": null,
  "field_8": null
}
```

**Behavior:**
- `device_id` is a string identifier (matches Device.Name in DB)
- Fields 1-8 accept number, string, or null
- If device doesn't exist → auto-create device + signals for each non-null field
- Signal names default to `field_1` through `field_8` (renameable in dashboard)
- If device exists → match fields to existing signals by position, create missing ones
- Store values in `signal_values` table with current timestamp

### Embedded MQTT Broker

**Library:** mochi-mqtt (pure Go, embeddable)

**Configuration (.env):**
```env
MQTT_ENABLED=true
MQTT_PORT=1883
MQTT_TLS_ENABLED=false
MQTT_TLS_CERT=
MQTT_TLS_KEY=
MQTT_SHARED_KEY=          # optional shared API key for devices
```

**Topic structure:** `devices/{device_id}/data`

**MQTT message payload:** Same JSON as POST route (without device_id, inferred from topic).

**Authentication:**
- Username: device name or device_id string
- Password: device's `auth_token` from database
- Validated against DB on connect

**Processing:** Broker hook parses incoming messages on `devices/+/data` and stores values using the same logic as the POST handler.

### Backend Changes (go-data-storage)
- New handler: `internal/handlers/generic_data_handler.go`
- New embedded broker: `internal/mqtt/broker.go`
- New auth hook for MQTT: `internal/mqtt/auth_hook.go`
- Update `cmd/api/main.go` to start broker alongside HTTP server
- New .env variables for MQTT config

### Frontend Changes (data-visualizer)
- No frontend changes in Phase 1 (existing signal values UI already displays the data)

---

## Phase 2: MES Data Models + Backend API

### New Database Entities

**Product**
| Column | Type | Notes |
|--------|------|-------|
| id | uint | PK |
| name | string | required |
| sku | string | unique, stock keeping unit |
| description | string | |
| unit | string | "unit", "kg", "liter", etc. |
| category | string | grouping |
| is_active | bool | |
| metadata | JSONB | extensible |
| created_at | timestamp | |
| updated_at | timestamp | |

**RawMaterial**
| Column | Type | Notes |
|--------|------|-------|
| id | uint | PK |
| name | string | required |
| sku | string | unique |
| description | string | |
| unit | string | "kg", "liter", "unit" |
| stock_quantity | float64 | current stock level |
| min_stock | float64 | reorder threshold (optional) |
| category | string | |
| is_active | bool | |
| metadata | JSONB | |
| created_at | timestamp | |
| updated_at | timestamp | |

**BillOfMaterials**
| Column | Type | Notes |
|--------|------|-------|
| id | uint | PK |
| product_id | uint | FK → products |
| raw_material_id | uint | FK → raw_materials |
| quantity | float64 | material qty per product unit |
| created_at | timestamp | |
| updated_at | timestamp | |

**ProductionOrder**
| Column | Type | Notes |
|--------|------|-------|
| id | uint | PK |
| product_id | uint | FK → products |
| quantity | float64 | units to produce |
| status | string | planned/in_progress/completed/cancelled |
| priority | int | optional ordering |
| device_id | uint | FK → devices (optional, IoT link) |
| work_instructions | text | optional free-text |
| quality_notes | text | optional |
| started_at | timestamp | optional |
| completed_at | timestamp | optional |
| metadata | JSONB | |
| created_at | timestamp | |
| updated_at | timestamp | |

**StockMovement**
| Column | Type | Notes |
|--------|------|-------|
| id | uint | PK |
| raw_material_id | uint | FK → raw_materials |
| production_order_id | uint | FK → production_orders (optional) |
| movement_type | string | "in", "out", "adjustment" |
| quantity | float64 | positive=in, negative=out |
| notes | string | |
| created_at | timestamp | |

### API Endpoints (all require user auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/products` | List/Create products |
| GET/PUT/DELETE | `/products/{id}` | Product CRUD |
| GET/POST | `/raw-materials` | List/Create raw materials |
| GET/PUT/DELETE | `/raw-materials/{id}` | Material CRUD |
| GET/POST | `/products/{id}/bom` | List/Add BOM entries |
| DELETE | `/bom/{id}` | Remove BOM entry |
| GET/POST | `/production-orders` | List/Create orders |
| GET/PUT/DELETE | `/production-orders/{id}` | Order CRUD |
| PUT | `/production-orders/{id}/status` | Status transition (auto-decrements stock on complete) |
| GET | `/stock-movements` | List movements (filter: material_id, order_id) |
| POST | `/raw-materials/{id}/adjust-stock` | Manual stock adjustment |

### Stock Decrement Logic

When a production order status changes to "completed":
1. Look up the product's BOM entries
2. For each BOM entry: decrement `raw_materials.stock_quantity` by `bom.quantity * order.quantity`
3. Create a StockMovement record for each decrement (type="out", linked to the order)
4. If any material would go negative → return error, don't complete the order

### Backend Changes (go-data-storage)
- New models in `internal/models/` (or extend models.go)
- New handlers: `products_handler.go`, `raw_materials_handler.go`, `production_orders_handler.go`, `stock_handler.go`
- New migration: `004_add_mes_tables.sql`
- Update `cmd/api/main.go` with new routes

---

## Phase 3: MES Frontend

### New Dashboard Tabs

**Products Tab** (`/?tab=products`)
- Table: name, SKU, category, unit, status
- Add/Edit/Delete dialog
- Click product → BOM sub-table showing raw materials + quantities
- Add/remove BOM entries inline

**Materials Tab** (`/?tab=materials`)
- Table: name, SKU, category, unit, stock quantity, min stock, status
- Stock level indicators (green/yellow/red vs min_stock)
- Add/Edit/Delete dialog
- "Adjust Stock" button → dialog for manual in/out with notes
- Expandable stock movement history per material

**Orders Tab** (`/?tab=orders`)
- Table: ID, product, quantity, status, priority, device, started_at, completed_at
- Status badges: planned=gray, in_progress=blue, completed=green, cancelled=red
- Add order dialog: select product, quantity, optional device link, instructions
- Status transition buttons: Plan → Start → Complete
- Complete confirmation (warns about stock decrement)
- Filter by status, product, device

### Navigation Update
Group the 8 tabs:
- **IoT**: Dashboard, Devices, Signals, Values
- **MES**: Products, Materials, Orders
- **Admin**: Users

### Frontend Changes (data-visualizer)
- New types in `src/types/index.ts`
- New API functions in `src/lib/requestHandlers.ts`
- New tabs: `ProductsTab.tsx`, `MaterialsTab.tsx`, `OrdersTab.tsx`
- New dialogs: `ProductDialog.tsx`, `RawMaterialDialog.tsx`, `ProductionOrderDialog.tsx`, `StockAdjustDialog.tsx`, `BOMDialog.tsx`
- Update `Dashboard.tsx` with new tabs, state, and grouped navigation

---

## Phase 4: MES + IoT Linking

### Device-Order Association (Display)
- Production orders have optional `device_id` linking to a device
- Orders tab: device dropdown when creating/editing orders
- Order detail view: mini-chart of device signals during order's active time range (started_at → completed_at)

### Future Automation Hooks (documented, not implemented)
- Counter signal tracking units produced → progress bar
- Auto-complete order when counter reaches target
- Quality signal → pause order if out of range

### Changes
- Backend: Endpoint to fetch signal values for a device within an order's time range
- Frontend: Order detail component with embedded signal chart

---

## .env Configuration Summary

New variables added across phases:

```env
# Phase 1: MQTT Broker
MQTT_ENABLED=true
MQTT_PORT=1883
MQTT_TLS_ENABLED=false
MQTT_TLS_CERT=
MQTT_TLS_KEY=

# Phase 1: Generic Device API
DEVICE_API_KEY=            # shared API key for device data POST (optional)
DEVICE_AUTO_CREATE=true    # auto-create unknown devices

# Phase 2-4: No new env vars (uses existing DB config)
```

---

## Security Considerations

- MQTT broker auth validates against device tokens in DB
- Optional TLS for MQTT connections
- Generic POST route requires either device token or shared API key
- All MES endpoints require user JWT auth
- Stock decrement is transactional (all-or-nothing)
- Input validation on all new endpoints
