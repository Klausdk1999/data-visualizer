# UI Overhaul Design

Date: 2026-04-12

## Summary

Major UI redesign covering: sidebar navigation, merged equipment/device view with configurable widget grid, image uploads for products/users/devices, and user preferences persistence.

## 1. Sidebar Navigation

Replace top tab bar with fixed left sidebar. Collapsible (240px expanded, 64px icons-only).

### Section structure (role-based visibility)

```
MONITORING          (all users)
  Dashboard
  Equipment

MES                 (all users, items marked admin-only hidden for workers)
  Orders
  Hours
  Products          (admin)
  Materials         (admin)
  Customers         (admin)

SETTINGS            (admin only)
  Devices
  Signals
  Signal Values
  Services
  Users
```

- Active item highlighted, URL routing via `?tab=` unchanged
- User info + logout at bottom
- Responsive: collapsed on small screens, hamburger toggle

## 2. Equipment Page

Merged device management + monitoring in a single view.

### Layout

- **Left panel**: Device card list (name, type, location, status badge, thumbnail image). Click to select.
- **Right panel** (selected device):
  - Top bar: device name/type, Edit + Delete buttons (admin only)
  - Below: configurable widget grid (section 3)
  - Edit opens dialog to change name, location, type, active status, image

### Relationship to Devices settings tab

Devices tab under Settings remains for admin-only operations (auth tokens, bulk management). Equipment is the primary interaction point.

## 3. Configurable Widget Grid

Used on both the global Dashboard page and per-device Equipment detail view.

### Layouts

- `1x1` - single full-width widget
- `1x2` - two widgets side by side
- `2x1` - two widgets stacked
- `2x2` - four widgets in grid

### Widget types

| Type             | Description           | Config params                                  |
| ---------------- | --------------------- | ---------------------------------------------- |
| `line_chart`     | Time-series line      | signals[], timespan, auto-refresh              |
| `bar_chart`      | Bar comparison        | signals[], timespan, aggregation (avg/min/max) |
| `gauge`          | Circular gauge        | signal_id, unit, min, max                      |
| `kpi_card`       | Single number + trend | signal_id, label, unit                         |
| `digital_status` | On/off indicator      | signal_id, on_label, off_label                 |
| `table`          | Recent values list    | signals[], row_count                           |

### Widget config flow

1. Click "+" on empty cell or edit icon on existing widget
2. Dialog: pick type -> pick signal(s) -> configure params
3. Save -> persisted to user preferences

## 4. Image Upload

### Backend

- Add `image bytea` + `image_type varchar` columns to Product, User, Device models
- Max size: 2MB enforced server-side
- Endpoints per entity:
  - `PUT /{entity}/{id}/image` - multipart/form-data upload
  - `GET /{entity}/{id}/image` - returns raw image with Content-Type
  - `DELETE /{entity}/{id}/image` - removes image

### Frontend

- Thumbnails in lists/cards
- File picker in edit dialogs with preview
- `<img src="/api/{entity}/{id}/image">` pattern for caching

## 5. User Preferences

### Backend

- Add `preferences jsonb DEFAULT '{}'` column to User model
- `GET /users/{id}/preferences` - returns JSON
- `PUT /users/{id}/preferences` - deep-merges with existing
- Users can only access their own preferences

### Schema

```json
{
  "dashboard": {
    "layout": "2x2",
    "widgets": [
      {"type": "line_chart", "signals": [3, 5], "timespan": "24h"},
      {"type": "gauge", "signal_id": 5, "min": 0, "max": 100, "unit": "A"}
    ]
  },
  "equipment": {
    "5": {
      "layout": "2x2",
      "widgets": [...]
    }
  }
}
```

### Frontend

Load on login, save on change (debounced 1s).

## 6. Testing

### Backend (Go)

- Image upload/download/delete for each entity (Product, User, Device)
- Size limit enforcement (>2MB rejected)
- User preferences CRUD
- Preferences ownership enforcement (user can only access own)

### Frontend (Playwright E2E)

- Sidebar navigation between sections
- Widget CRUD (add, configure, remove)
- Layout switching (1x1, 2x2, etc.)
- Image upload in dialogs
- Preferences persistence (configure widgets, reload, verify still there)
- Role-based visibility (admin sees all sections, worker sees subset)
