# UI Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the data-visualizer frontend with sidebar navigation, configurable widget dashboards, merged equipment/device view, image uploads, and user preferences persistence.

**Architecture:** Sidebar replaces top nav. New widget grid system for Dashboard and Equipment pages reads/writes layout config from a `preferences` JSONB column on the User model. Images stored as `bytea` in PostgreSQL with dedicated upload/download endpoints. All changes maintain role-based access control.

**Tech Stack:** Next.js 15 / React 18 / TypeScript / Tailwind / shadcn-ui / Recharts / Go 1.25 / GORM / PostgreSQL

---

## Phase 1: Backend Foundation

### Task 1: Add User Preferences Column + Endpoints

**Files:**

- Modify: `go-data-storage/internal/models/models.go:12-23` (User struct)
- Modify: `go-data-storage/internal/handlers/users_handler.go`
- Modify: `go-data-storage/cmd/api/main.go:57-62` (routes)
- Test: `go-data-storage/tests/handlers_test.go`

**Step 1: Write failing tests for preferences endpoints**

Add to `tests/handlers_test.go`:

```go
func TestGetUserPreferences(t *testing.T) {
	testDB := setupTestDB(t)
	user := createTestUser(t, testDB, "Admin", "admin@test.com", "pass123", "admin")

	// Set preferences directly in DB
	testDB.Model(&user).Update("preferences", models.JSONB{"dashboard": map[string]interface{}{"layout": "2x2"}})

	token, _ := auth.GenerateJWT(user.ID, user.Email, user.Type)
	req := httptest.NewRequest("GET", fmt.Sprintf("/users/%d/preferences", user.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-User-ID", strconv.FormatUint(uint64(user.ID), 10))
	w := httptest.NewRecorder()

	handlers.UserPreferencesHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var prefs map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &prefs)
	dashboard, ok := prefs["dashboard"].(map[string]interface{})
	if !ok || dashboard["layout"] != "2x2" {
		t.Errorf("Expected dashboard.layout=2x2, got %v", prefs)
	}
}

func TestPutUserPreferences(t *testing.T) {
	testDB := setupTestDB(t)
	user := createTestUser(t, testDB, "Admin", "admin@test.com", "pass123", "admin")

	token, _ := auth.GenerateJWT(user.ID, user.Email, user.Type)
	body, _ := json.Marshal(map[string]interface{}{
		"dashboard": map[string]interface{}{
			"layout": "1x1",
			"widgets": []interface{}{
				map[string]interface{}{"type": "gauge", "signal_id": 1},
			},
		},
	})
	req := httptest.NewRequest("PUT", fmt.Sprintf("/users/%d/preferences", user.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-User-ID", strconv.FormatUint(uint64(user.ID), 10))
	w := httptest.NewRecorder()

	handlers.UserPreferencesHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Verify in DB
	var updated models.User
	testDB.First(&updated, user.ID)
	if updated.Preferences == nil {
		t.Fatal("Preferences should not be nil")
	}
}

func TestUserPreferences_CannotAccessOtherUser(t *testing.T) {
	testDB := setupTestDB(t)
	user1 := createTestUser(t, testDB, "User1", "user1@test.com", "pass123", "worker")
	user2 := createTestUser(t, testDB, "User2", "user2@test.com", "pass123", "worker")

	token, _ := auth.GenerateJWT(user1.ID, user1.Email, user1.Type)
	req := httptest.NewRequest("GET", fmt.Sprintf("/users/%d/preferences", user2.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-User-ID", strconv.FormatUint(uint64(user1.ID), 10))
	w := httptest.NewRecorder()

	handlers.UserPreferencesHandler(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected 403, got %d", w.Code)
	}
}
```

**Step 2: Run tests to verify they fail**

Run: `cd go-data-storage && go test ./tests/ -run "TestGetUserPreferences|TestPutUserPreferences|TestUserPreferences_Cannot" -v`
Expected: FAIL (UserPreferencesHandler not defined, Preferences field not found)

**Step 3: Add Preferences field to User model**

In `internal/models/models.go`, add to User struct:

```go
type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"not null"`
	Email        string    `json:"email" gorm:"uniqueIndex"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Type         string    `json:"type" gorm:"default:worker"`
	Rfid         string    `json:"rfid,omitempty" gorm:"uniqueIndex"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	Preferences  JSONB     `json:"preferences,omitempty" gorm:"type:jsonb;default:'{}'"`
	Devices      []Device  `json:"-" gorm:"foreignKey:UserID"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
```

**Step 4: Add UserPreferencesHandler**

In `internal/handlers/users_handler.go`, add:

```go
func UserPreferencesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.ParseUint(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Ownership check: user can only access own preferences
	requestingUserID := r.Header.Get("X-User-ID")
	if requestingUserID != strconv.FormatUint(userID, 10) {
		// Allow admins to access any user's preferences
		role := r.Header.Get("X-User-Role")
		if role != "admin" {
			http.Error(w, "Cannot access another user's preferences", http.StatusForbidden)
			return
		}
	}

	database := db.GetDB()
	var user models.User
	if err := database.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	switch r.Method {
	case "GET":
		prefs := user.Preferences
		if prefs == nil {
			prefs = models.JSONB{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(prefs)

	case "PUT":
		var incoming models.JSONB
		if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		// Deep merge: incoming overwrites existing keys
		existing := user.Preferences
		if existing == nil {
			existing = models.JSONB{}
		}
		for k, v := range incoming {
			existing[k] = v
		}
		if err := database.Model(&user).Update("preferences", existing).Error; err != nil {
			http.Error(w, "Failed to save preferences", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(existing)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
```

**Step 5: Register route**

In `cmd/api/main.go`, add after user routes:

```go
r.HandleFunc("/users/{id}/preferences", auth.RequireUserAuth(handlers.UserPreferencesHandler)).Methods("GET", "PUT")
```

**Step 6: Run tests to verify they pass**

Run: `cd go-data-storage && go test ./tests/ -run "TestGetUserPreferences|TestPutUserPreferences|TestUserPreferences_Cannot" -v`
Expected: PASS

**Step 7: Commit**

```bash
cd go-data-storage && git add internal/models/models.go internal/handlers/users_handler.go cmd/api/main.go tests/handlers_test.go
git commit -m "feat: add user preferences JSONB column and GET/PUT endpoints"
```

---

### Task 2: Add Image Upload/Download Endpoints

**Files:**

- Create: `go-data-storage/internal/handlers/image_handler.go`
- Modify: `go-data-storage/internal/models/models.go` (Product, User, Device structs)
- Modify: `go-data-storage/cmd/api/main.go` (routes)
- Test: `go-data-storage/tests/handlers_test.go`

**Step 1: Write failing tests for image upload and download**

Add to `tests/handlers_test.go`:

```go
func TestImageUpload_Product(t *testing.T) {
	testDB := setupTestDB(t)
	admin := createTestUser(t, testDB, "Admin", "admin@test.com", "pass123", "admin")
	token, _ := auth.GenerateJWT(admin.ID, admin.Email, admin.Type)

	product := models.Product{Name: "Test Product", Category: "test"}
	testDB.Create(&product)

	// Create a small PNG (1x1 pixel)
	imgData := []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
		0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
	}

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, _ := writer.CreateFormFile("image", "test.png")
	part.Write(imgData)
	writer.Close()

	req := httptest.NewRequest("PUT", fmt.Sprintf("/products/%d/image", product.ID), &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-User-ID", strconv.FormatUint(uint64(admin.ID), 10))
	w := httptest.NewRecorder()

	handler := auth.RequireAdmin(handlers.ImageUploadHandler("products"))
	handler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Verify in DB
	var updated models.Product
	testDB.First(&updated, product.ID)
	if len(updated.Image) == 0 {
		t.Error("Image should be stored in DB")
	}
}

func TestImageUpload_TooLarge(t *testing.T) {
	testDB := setupTestDB(t)
	admin := createTestUser(t, testDB, "Admin", "admin@test.com", "pass123", "admin")
	token, _ := auth.GenerateJWT(admin.ID, admin.Email, admin.Type)

	product := models.Product{Name: "Test Product", Category: "test"}
	testDB.Create(&product)

	// Create 3MB of data (exceeds 2MB limit)
	bigData := make([]byte, 3*1024*1024)

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, _ := writer.CreateFormFile("image", "big.png")
	part.Write(bigData)
	writer.Close()

	req := httptest.NewRequest("PUT", fmt.Sprintf("/products/%d/image", product.ID), &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-User-ID", strconv.FormatUint(uint64(admin.ID), 10))
	w := httptest.NewRecorder()

	handler := auth.RequireAdmin(handlers.ImageUploadHandler("products"))
	handler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 for oversized image, got %d", w.Code)
	}
}

func TestImageDownload_Product(t *testing.T) {
	testDB := setupTestDB(t)
	imgData := []byte{0x89, 0x50, 0x4E, 0x47} // Fake PNG
	product := models.Product{Name: "Test", Category: "test", Image: imgData, ImageType: "image/png"}
	testDB.Create(&product)

	req := httptest.NewRequest("GET", fmt.Sprintf("/products/%d/image", product.ID), nil)
	w := httptest.NewRecorder()

	handlers.ImageDownloadHandler("products")(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", w.Code)
	}
	if w.Header().Get("Content-Type") != "image/png" {
		t.Errorf("Expected image/png, got %s", w.Header().Get("Content-Type"))
	}
	if !bytes.Equal(w.Body.Bytes(), imgData) {
		t.Error("Image data mismatch")
	}
}
```

**Step 2: Run tests to verify they fail**

Run: `cd go-data-storage && go test ./tests/ -run "TestImage" -v`
Expected: FAIL

**Step 3: Add Image fields to models**

In `internal/models/models.go`, add to Product, User, and Device structs:

```go
// Add to Product struct:
Image     []byte `json:"-" gorm:"type:bytea"`
ImageType string `json:"-" gorm:"type:varchar(50)"`

// Add to User struct:
Image     []byte `json:"-" gorm:"type:bytea"`
ImageType string `json:"-" gorm:"type:varchar(50)"`

// Add to Device struct:
Image     []byte `json:"-" gorm:"type:bytea"`
ImageType string `json:"-" gorm:"type:varchar(50)"`
```

Note: `json:"-"` so images are never included in regular JSON responses.

**Step 4: Create image_handler.go**

Create `internal/handlers/image_handler.go`:

```go
package handlers

import (
	"fmt"
	"io"
	"net/http"
	"strconv"

	"data-storage/internal/db"

	"github.com/gorilla/mux"
)

const maxImageSize = 2 * 1024 * 1024 // 2MB

// modelForEntity returns the GORM table name for a given entity string.
func tableForEntity(entity string) string {
	switch entity {
	case "products":
		return "products"
	case "users":
		return "users"
	case "devices":
		return "devices"
	default:
		return ""
	}
}

// ImageUploadHandler returns a handler that accepts multipart image upload for the given entity.
func ImageUploadHandler(entity string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		table := tableForEntity(entity)
		if table == "" {
			http.Error(w, "Invalid entity", http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)
		id, err := strconv.ParseUint(vars["id"], 10, 64)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		// Limit request body size
		r.Body = http.MaxBytesReader(w, r.Body, maxImageSize+1024) // small overhead for multipart headers

		file, header, err := r.FormFile("image")
		if err != nil {
			http.Error(w, fmt.Sprintf("Image too large (max %dMB) or invalid form data", maxImageSize/(1024*1024)), http.StatusBadRequest)
			return
		}
		defer file.Close()

		if header.Size > maxImageSize {
			http.Error(w, fmt.Sprintf("Image too large: %d bytes (max %d bytes)", header.Size, maxImageSize), http.StatusBadRequest)
			return
		}

		data, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, "Failed to read image", http.StatusInternalServerError)
			return
		}

		if len(data) > int(maxImageSize) {
			http.Error(w, "Image too large", http.StatusBadRequest)
			return
		}

		contentType := http.DetectContentType(data)

		database := db.GetDB()
		result := database.Table(table).Where("id = ?", id).Updates(map[string]interface{}{
			"image":      data,
			"image_type": contentType,
		})
		if result.RowsAffected == 0 {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok","size":%d,"type":"%s"}`, len(data), contentType)
	}
}

// ImageDownloadHandler returns a handler that serves the stored image for the given entity.
func ImageDownloadHandler(entity string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		table := tableForEntity(entity)
		if table == "" {
			http.Error(w, "Invalid entity", http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)
		id, err := strconv.ParseUint(vars["id"], 10, 64)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		var result struct {
			Image     []byte
			ImageType string
		}
		database := db.GetDB()
		if err := database.Table(table).Select("image, image_type").Where("id = ?", id).Scan(&result).Error; err != nil {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}

		if len(result.Image) == 0 {
			http.Error(w, "No image", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", result.ImageType)
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Write(result.Image)
	}
}

// ImageDeleteHandler returns a handler that removes the stored image for the given entity.
func ImageDeleteHandler(entity string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		table := tableForEntity(entity)
		if table == "" {
			http.Error(w, "Invalid entity", http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)
		id, err := strconv.ParseUint(vars["id"], 10, 64)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		database := db.GetDB()
		result := database.Table(table).Where("id = ?", id).Updates(map[string]interface{}{
			"image":      nil,
			"image_type": "",
		})
		if result.RowsAffected == 0 {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
	}
}
```

**Step 5: Register image routes**

In `cmd/api/main.go`, add after existing routes:

```go
// Image endpoints
for _, entity := range []string{"products", "users", "devices"} {
	r.HandleFunc(fmt.Sprintf("/%s/{id}/image", entity), handlers.ImageDownloadHandler(entity)).Methods("GET")
	r.HandleFunc(fmt.Sprintf("/%s/{id}/image", entity), auth.RequireAdmin(handlers.ImageUploadHandler(entity))).Methods("PUT")
	r.HandleFunc(fmt.Sprintf("/%s/{id}/image", entity), auth.RequireAdmin(handlers.ImageDeleteHandler(entity))).Methods("DELETE")
}
```

Add `"fmt"` to imports in main.go if not already present.

**Step 6: Run tests to verify they pass**

Run: `cd go-data-storage && go test ./tests/ -run "TestImage" -v`
Expected: PASS

**Step 7: Run all tests**

Run: `cd go-data-storage && go test ./... -v`
Expected: ALL PASS

**Step 8: Commit**

```bash
cd go-data-storage && git add internal/models/models.go internal/handlers/image_handler.go cmd/api/main.go tests/handlers_test.go
git commit -m "feat: add image upload/download/delete endpoints for products, users, and devices"
```

---

## Phase 2: Frontend - Sidebar Navigation

### Task 3: Create Sidebar Component

**Files:**

- Create: `data-visualizer/src/components/Sidebar.tsx`
- Modify: `data-visualizer/src/components/Dashboard.tsx:710-830` (replace top nav with sidebar layout)

**Step 1: Create Sidebar component**

Create `src/components/Sidebar.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  ClipboardList,
  Clock,
  Package,
  Boxes,
  Users,
  Settings,
  Cpu,
  Radio,
  BarChart3,
  Wrench,
  UserSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";
import { useTranslations } from "next-intl";

export type TabType =
  | "dashboard"
  | "equipment"
  | "orders"
  | "hours"
  | "products"
  | "materials"
  | "customers"
  | "devices"
  | "signals"
  | "values"
  | "services"
  | "users";

interface SidebarSection {
  label: string;
  items: SidebarItem[];
  adminOnly?: boolean;
}

interface SidebarItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userType: string;
  userName: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  userType,
  userName,
  onLogout,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const isAdmin = userType === "admin";

  const sections: SidebarSection[] = [
    {
      label: t("monitoring"),
      items: [
        { id: "dashboard", label: t("dashboard"), icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: "equipment", label: t("equipment"), icon: <Monitor className="w-5 h-5" /> },
      ],
    },
    {
      label: t("mes"),
      items: [
        { id: "orders", label: t("orders"), icon: <ClipboardList className="w-5 h-5" /> },
        { id: "hours", label: t("hours"), icon: <Clock className="w-5 h-5" /> },
        {
          id: "products",
          label: t("products"),
          icon: <Package className="w-5 h-5" />,
          adminOnly: true,
        },
        {
          id: "materials",
          label: t("materials"),
          icon: <Boxes className="w-5 h-5" />,
          adminOnly: true,
        },
        {
          id: "customers",
          label: t("customers"),
          icon: <UserSquare className="w-5 h-5" />,
          adminOnly: true,
        },
      ],
    },
    {
      label: t("settings"),
      adminOnly: true,
      items: [
        { id: "devices", label: t("devices"), icon: <Cpu className="w-5 h-5" /> },
        { id: "signals", label: t("signals"), icon: <Radio className="w-5 h-5" /> },
        { id: "values", label: t("values"), icon: <BarChart3 className="w-5 h-5" /> },
        { id: "services", label: t("services"), icon: <Wrench className="w-5 h-5" /> },
        { id: "users", label: t("users"), icon: <Users className="w-5 h-5" /> },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 z-50 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <span className="font-bold text-lg text-gray-900 dark:text-white">IoT MES</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {sections.map((section) => {
          if (section.adminOnly && !isAdmin) return null;
          const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5 px-2">
                {visibleItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onTabChange(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        activeTab === item.id
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer - User info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-medium shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userName}
              </p>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Add sidebar translations**

Add to locale files (`messages/en.json` and `messages/pt.json`) a `"sidebar"` key with all labels.

**Step 3: Modify Dashboard.tsx to use Sidebar**

Replace the top nav bar (lines ~710-830) with:

- Sidebar component on left
- Main content area with `ml-60` (or `ml-16` when collapsed)
- Remove old tab button row
- Keep all existing tab content rendering

**Step 4: Test manually and verify all tabs navigate correctly**

**Step 5: Commit**

```bash
cd data-visualizer && git add src/components/Sidebar.tsx src/components/Dashboard.tsx messages/
git commit -m "feat: replace top nav with collapsible sidebar navigation"
```

---

## Phase 3: Widget Grid System

### Task 4: Create Widget Components

**Files:**

- Create: `data-visualizer/src/components/widgets/WidgetGrid.tsx`
- Create: `data-visualizer/src/components/widgets/WidgetConfigDialog.tsx`
- Create: `data-visualizer/src/components/widgets/LineChartWidget.tsx`
- Create: `data-visualizer/src/components/widgets/BarChartWidget.tsx`
- Create: `data-visualizer/src/components/widgets/GaugeWidget.tsx`
- Create: `data-visualizer/src/components/widgets/KpiCardWidget.tsx`
- Create: `data-visualizer/src/components/widgets/DigitalStatusWidget.tsx`
- Create: `data-visualizer/src/components/widgets/TableWidget.tsx`
- Create: `data-visualizer/src/types/widgets.ts`

**Step 1: Define widget types**

Create `src/types/widgets.ts`:

```typescript
export type WidgetType =
  | "line_chart"
  | "bar_chart"
  | "gauge"
  | "kpi_card"
  | "digital_status"
  | "table";
export type GridLayout = "1x1" | "1x2" | "2x1" | "2x2";
export type Timespan = "1h" | "6h" | "24h" | "7d" | "30d" | "custom";
export type Aggregation = "avg" | "min" | "max" | "sum";

export interface WidgetConfig {
  id: string; // unique per widget instance (uuid)
  type: WidgetType;
  signals?: number[]; // signal IDs
  signal_id?: number; // single signal (gauge, kpi, digital)
  timespan?: Timespan;
  aggregation?: Aggregation;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  on_label?: string;
  off_label?: string;
  row_count?: number;
  auto_refresh?: boolean;
  custom_from?: string; // ISO date for custom timespan
  custom_to?: string;
}

export interface DashboardLayout {
  layout: GridLayout;
  widgets: WidgetConfig[];
}

export interface UserPreferences {
  dashboard?: DashboardLayout;
  equipment?: Record<string, DashboardLayout>; // keyed by device ID
}
```

**Step 2: Create WidgetGrid component**

Create `src/components/widgets/WidgetGrid.tsx` — a container that renders a CSS grid based on layout type and maps each cell to the appropriate widget component based on `WidgetConfig.type`.

**Step 3: Create each widget component**

Each widget:

- Receives its `WidgetConfig` + fetches its own signal data via `getSignalValues()`
- Has an edit icon (top-right) that opens WidgetConfigDialog
- Has a timespan selector (for chart-based widgets)
- Uses Recharts for charts, custom SVG for gauge
- Auto-refreshes if configured (30s interval)

**Step 4: Create WidgetConfigDialog**

Dialog flow: select widget type -> select signal(s) -> configure params -> save.

**Step 5: Commit**

```bash
cd data-visualizer && git add src/components/widgets/ src/types/widgets.ts
git commit -m "feat: add configurable widget grid system with 6 widget types"
```

---

### Task 5: Add Preferences API to Frontend

**Files:**

- Modify: `data-visualizer/src/lib/requestHandlers.ts`
- Create: `data-visualizer/src/hooks/usePreferences.ts`

**Step 1: Add API functions**

In `requestHandlers.ts`:

```typescript
export async function getUserPreferences(userId: number): Promise<UserPreferences> {
  const response = await api.get(`/users/${userId}/preferences`);
  return response.data;
}

export async function updateUserPreferences(
  userId: number,
  prefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await api.put(`/users/${userId}/preferences`, prefs);
  return response.data;
}
```

**Step 2: Create usePreferences hook**

Create `src/hooks/usePreferences.ts` — loads preferences on mount, exposes `preferences` state and `savePreferences()` function with 1s debounce.

**Step 3: Commit**

```bash
cd data-visualizer && git add src/lib/requestHandlers.ts src/hooks/usePreferences.ts
git commit -m "feat: add user preferences API functions and React hook"
```

---

### Task 6: Integrate Widget Grid into Dashboard and Equipment

**Files:**

- Modify: `data-visualizer/src/components/tabs/DashboardTab.tsx`
- Modify: `data-visualizer/src/components/tabs/EquipmentTab.tsx`

**Step 1: Update DashboardTab**

Replace current static KPI cards with WidgetGrid. Load layout from `preferences.dashboard`. Show layout picker (1x1/1x2/2x1/2x2) and "Add Widget" button. Save on every change via `usePreferences`.

**Step 2: Update EquipmentTab**

- Keep left device list panel
- Replace right panel chart section with WidgetGrid keyed by device ID
- Add Edit + Delete buttons at top (admin only) that open DeviceDialog
- Load layout from `preferences.equipment[deviceId]`

**Step 3: Commit**

```bash
cd data-visualizer && git add src/components/tabs/DashboardTab.tsx src/components/tabs/EquipmentTab.tsx
git commit -m "feat: integrate configurable widget grid into dashboard and equipment tabs"
```

---

## Phase 4: Image Upload in Frontend

### Task 7: Add Image Upload Components

**Files:**

- Create: `data-visualizer/src/components/ui/image-upload.tsx`
- Modify: `data-visualizer/src/lib/requestHandlers.ts` (add image API functions)
- Modify: `data-visualizer/src/components/dialogs/ProductDialog.tsx`
- Modify: `data-visualizer/src/components/dialogs/DeviceDialog.tsx`
- Modify: `data-visualizer/src/components/dialogs/UserDialog.tsx`

**Step 1: Add image API functions to requestHandlers**

```typescript
export async function uploadImage(entity: string, id: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("image", file);
  await api.put(`/${entity}/${id}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteImage(entity: string, id: number): Promise<void> {
  await api.delete(`/${entity}/${id}/image`);
}

export function getImageUrl(entity: string, id: number): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return `${base}/${entity}/${id}/image`;
}
```

**Step 2: Create ImageUpload UI component**

Create `src/components/ui/image-upload.tsx` — file picker with preview, drag-and-drop, 2MB size validation on client side, remove button.

**Step 3: Add ImageUpload to dialogs**

Add to ProductDialog, DeviceDialog, and UserDialog — show current image thumbnail, allow upload/replace/remove.

**Step 4: Commit**

```bash
cd data-visualizer && git add src/components/ui/image-upload.tsx src/lib/requestHandlers.ts src/components/dialogs/
git commit -m "feat: add image upload to product, device, and user dialogs"
```

---

## Phase 5: Testing

### Task 8: Backend Tests

**Files:**

- Modify: `go-data-storage/tests/handlers_test.go`

Tests already written in Tasks 1 and 2. Run full suite:

```bash
cd go-data-storage && go test ./... -v
```

Verify all pass. Fix any failures.

**Commit:** Only if fixes were needed.

---

### Task 9: Frontend E2E Tests

**Files:**

- Create: `data-visualizer/e2e/sidebar.spec.ts`
- Create: `data-visualizer/e2e/widgets.spec.ts`
- Create: `data-visualizer/e2e/image-upload.spec.ts`

**Step 1: Sidebar navigation tests**

```typescript
// e2e/sidebar.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Sidebar Navigation", () => {
  test("navigates between sections", async ({ page }) => {
    // Login, click sidebar items, verify URL and content changes
  });

  test("hides admin tabs for workers", async ({ page }) => {
    // Login as worker, verify Products/Materials/Settings not visible
  });

  test("collapses and expands", async ({ page }) => {
    // Click collapse button, verify width, click again, verify expanded
  });
});
```

**Step 2: Widget grid tests**

```typescript
// e2e/widgets.spec.ts
test.describe("Widget Grid", () => {
  test("adds and configures a widget", async ({ page }) => {
    // Navigate to dashboard, click add widget, select type, pick signal, save
  });

  test("switches layout", async ({ page }) => {
    // Change from 1x1 to 2x2, verify grid changes
  });

  test("persists widgets after reload", async ({ page }) => {
    // Add widget, reload page, verify widget still there
  });
});
```

**Step 3: Image upload tests**

```typescript
// e2e/image-upload.spec.ts
test.describe("Image Upload", () => {
  test("uploads product image", async ({ page }) => {
    // Open product dialog, upload image, save, verify thumbnail visible
  });

  test("rejects oversized image", async ({ page }) => {
    // Try uploading >2MB file, verify error message
  });
});
```

**Step 4: Run E2E tests**

Run: `cd data-visualizer && npx playwright test`

**Step 5: Commit**

```bash
cd data-visualizer && git add e2e/
git commit -m "test: add E2E tests for sidebar, widgets, and image upload"
```

---

## Task Summary

| #   | Task                                         | Phase    | Repo            |
| --- | -------------------------------------------- | -------- | --------------- |
| 1   | User preferences column + endpoints          | Backend  | go-data-storage |
| 2   | Image upload/download endpoints              | Backend  | go-data-storage |
| 3   | Sidebar navigation component                 | Frontend | data-visualizer |
| 4   | Widget components (6 types + grid)           | Frontend | data-visualizer |
| 5   | Preferences API + React hook                 | Frontend | data-visualizer |
| 6   | Integrate widgets into Dashboard + Equipment | Frontend | data-visualizer |
| 7   | Image upload in dialogs                      | Frontend | data-visualizer |
| 8   | Backend test verification                    | Testing  | go-data-storage |
| 9   | E2E tests (sidebar, widgets, images)         | Testing  | data-visualizer |
