# MES + MQTT + Generic Device Data — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the IoT platform with an embedded MQTT broker, generic device data POST route, and a Manufacturing Execution System (products, BOM, raw materials, production orders, stock tracking).

**Architecture:** Phased modular approach across two repos: `go-data-storage` (Go backend) and `data-visualizer` (Next.js frontend). Each phase delivers working features independently. Backend uses GORM + gorilla/mux; frontend uses React + shadcn/ui + Tailwind.

**Tech Stack:** Go 1.25, mochi-mqtt (embedded broker), GORM, gorilla/mux | Next.js 15, React 18, shadcn/ui, Recharts, Axios, Tailwind CSS

**Repos:**
- Backend: `C:\Users\Klaus\Documents\Mestrado\go-data-storage`
- Frontend: `C:\Users\Klaus\Documents\Mestrado\data-visualizer`

---

## Phase 1: Generic Device POST + Embedded MQTT Broker

### Task 1: Add mochi-mqtt dependency to Go backend

**Files:**
- Modify: `go-data-storage/go.mod`

**Step 1: Add the mochi-mqtt module**

Run from `C:\Users\Klaus\Documents\Mestrado\go-data-storage`:
```bash
go get github.com/mochi-mqtt/server/v2
go get github.com/mochi-mqtt/server/v2/hooks/auth
go get github.com/mochi-mqtt/server/v2/listeners
```

**Step 2: Verify go.mod updated**

Run: `grep mochi go.mod`
Expected: line containing `github.com/mochi-mqtt/server/v2`

**Step 3: Commit**

```bash
git add go.mod go.sum
git commit -m "feat: add mochi-mqtt embedded broker dependency"
```

---

### Task 2: Add .env variables for MQTT broker and generic device API

**Files:**
- Modify: `go-data-storage/.env.example`
- Modify: `go-data-storage/.env` (if exists)

**Step 1: Add new env vars to .env.example**

Append to `go-data-storage/.env.example`:
```env

# Embedded MQTT Broker
MQTT_BROKER_ENABLED=true
MQTT_BROKER_PORT=1883
MQTT_BROKER_TLS_ENABLED=false
MQTT_BROKER_TLS_CERT=
MQTT_BROKER_TLS_KEY=

# Generic Device API
DEVICE_API_KEY=
DEVICE_AUTO_CREATE=true
```

**Step 2: Add same vars to local .env**

Copy same block to `.env` with sensible dev defaults.

**Step 3: Commit**

```bash
git add .env.example
git commit -m "feat: add MQTT broker and device API env config"
```

---

### Task 3: Create the generic data handler

This handler receives JSON from any microcontroller via `POST /devices/data`. It auto-creates devices and signals if they don't exist.

**Files:**
- Create: `go-data-storage/internal/handlers/generic_data_handler.go`

**Step 1: Write the handler**

Create `go-data-storage/internal/handlers/generic_data_handler.go`:

```go
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"data-storage/internal/auth"
	"data-storage/internal/db"
	"data-storage/internal/models"

	"gorm.io/gorm"
)

// GenericDeviceData represents the JSON payload from a microcontroller
type GenericDeviceData struct {
	DeviceID string       `json:"device_id"`
	Field1   *json.Number `json:"field_1,omitempty"`
	Field2   *json.Number `json:"field_2,omitempty"`
	Field3   *json.Number `json:"field_3,omitempty"`
	Field4   *json.Number `json:"field_4,omitempty"`
	Field5   *json.Number `json:"field_5,omitempty"`
	Field6   *json.Number `json:"field_6,omitempty"`
	Field7   *json.Number `json:"field_7,omitempty"`
	Field8   *json.Number `json:"field_8,omitempty"`
	// String fields as alternative
	Field1Str *string `json:"field_1_str,omitempty"`
	Field2Str *string `json:"field_2_str,omitempty"`
	Field3Str *string `json:"field_3_str,omitempty"`
	Field4Str *string `json:"field_4_str,omitempty"`
	Field5Str *string `json:"field_5_str,omitempty"`
	Field6Str *string `json:"field_6_str,omitempty"`
	Field7Str *string `json:"field_7_str,omitempty"`
	Field8Str *string `json:"field_8_str,omitempty"`
}

// GenericDeviceDataRaw uses interface{} for flexible field parsing
type GenericDeviceDataRaw struct {
	DeviceID string      `json:"device_id"`
	Field1   interface{} `json:"field_1"`
	Field2   interface{} `json:"field_2"`
	Field3   interface{} `json:"field_3"`
	Field4   interface{} `json:"field_4"`
	Field5   interface{} `json:"field_5"`
	Field6   interface{} `json:"field_6"`
	Field7   interface{} `json:"field_7"`
	Field8   interface{} `json:"field_8"`
}

// GenericDataHandler handles POST /devices/data
func GenericDataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check API key auth or device token auth
	apiKey := r.Header.Get("X-API-Key")
	deviceToken := ""
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" && len(authHeader) > 7 {
		deviceToken = authHeader[7:] // Strip "Bearer "
	}

	envAPIKey := os.Getenv("DEVICE_API_KEY")
	if apiKey == "" && deviceToken == "" {
		http.Error(w, "Authentication required: X-API-Key header or Authorization: Bearer <token>", http.StatusUnauthorized)
		return
	}
	if apiKey != "" && envAPIKey != "" && apiKey != envAPIKey {
		http.Error(w, "Invalid API key", http.StatusUnauthorized)
		return
	}
	if apiKey == "" && envAPIKey == "" && deviceToken == "" {
		http.Error(w, "Authentication required", http.StatusUnauthorized)
		return
	}

	// Parse the JSON body
	var data GenericDeviceDataRaw
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if data.DeviceID == "" {
		http.Error(w, "device_id is required", http.StatusBadRequest)
		return
	}

	// Process and store the data
	err := ProcessGenericDeviceData(data, deviceToken)
	if err != nil {
		log.Printf("Error processing device data: %v", err)
		http.Error(w, fmt.Sprintf("Error processing data: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// ProcessGenericDeviceData finds or creates the device and stores field values
func ProcessGenericDeviceData(data GenericDeviceDataRaw, deviceToken string) error {
	database := db.GetDB()
	autoCreate := os.Getenv("DEVICE_AUTO_CREATE") != "false"

	// Find or create device
	var device models.Device
	result := database.Where("name = ?", data.DeviceID).First(&device)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			if !autoCreate {
				return fmt.Errorf("device '%s' not found and auto-create is disabled", data.DeviceID)
			}
			// Auto-create device
			token, err := auth.GenerateDeviceToken()
			if err != nil {
				return fmt.Errorf("error generating device token: %w", err)
			}
			device = models.Device{
				Name:       data.DeviceID,
				DeviceType: "generic",
				AuthToken:  token,
				IsActive:   true,
			}
			if err := database.Create(&device).Error; err != nil {
				return fmt.Errorf("error creating device: %w", err)
			}
			log.Printf("Auto-created device: %s (ID: %d)", data.DeviceID, device.ID)
		} else {
			return fmt.Errorf("error looking up device: %w", result.Error)
		}
	}

	// If authenticated with device token, verify it matches
	if deviceToken != "" {
		if device.AuthToken != deviceToken {
			return fmt.Errorf("device token does not match device '%s'", data.DeviceID)
		}
	}

	// Process each field
	fields := map[string]interface{}{
		"field_1": data.Field1,
		"field_2": data.Field2,
		"field_3": data.Field3,
		"field_4": data.Field4,
		"field_5": data.Field5,
		"field_6": data.Field6,
		"field_7": data.Field7,
		"field_8": data.Field8,
	}

	now := time.Now()

	for fieldName, fieldValue := range fields {
		if fieldValue == nil {
			continue
		}

		// Find or create signal for this field
		signal, err := ensureGenericSignal(database, device.ID, fieldName, fieldValue)
		if err != nil {
			log.Printf("Error ensuring signal %s for device %d: %v", fieldName, device.ID, err)
			continue
		}

		// Store the value
		sv := models.SignalValue{
			SignalID:   signal.ID,
			Timestamp:  now,
			Metadata:   models.JSONB{"source": "generic_post"},
		}

		switch v := fieldValue.(type) {
		case float64:
			sv.Value = &v
		case string:
			// Store string values in metadata since SignalValue only supports float64 and bool
			sv.Metadata["string_value"] = v
			zero := float64(0)
			sv.Value = &zero
		case bool:
			sv.DigitalValue = &v
		default:
			// Try to convert from json.Number or other numeric types
			if num, ok := fieldValue.(json.Number); ok {
				if f, err := num.Float64(); err == nil {
					sv.Value = &f
				}
			}
		}

		if err := database.Create(&sv).Error; err != nil {
			log.Printf("Error storing value for signal %s: %v", fieldName, err)
		}
	}

	return nil
}

// ensureGenericSignal finds or creates a signal for a generic field
func ensureGenericSignal(database *gorm.DB, deviceID uint, fieldName string, value interface{}) (*models.Signal, error) {
	var signal models.Signal
	result := database.Where("device_id = ? AND name = ?", deviceID, fieldName).First(&signal)
	if result.Error == nil {
		return &signal, nil
	}

	if result.Error != gorm.ErrRecordNotFound {
		return nil, result.Error
	}

	// Determine signal type from value
	signalType := "analogic"
	if _, ok := value.(bool); ok {
		signalType = "digital"
	}

	signal = models.Signal{
		DeviceID:   deviceID,
		Name:       fieldName,
		SignalType: signalType,
		Direction:  "input",
		IsActive:   true,
	}

	if err := database.Create(&signal).Error; err != nil {
		return nil, err
	}

	log.Printf("Auto-created signal: %s (ID: %d) for device %d", fieldName, signal.ID, deviceID)
	return &signal, nil
}
```

**Step 2: Register the route in main.go**

Add to `go-data-storage/cmd/api/main.go` after the legacy endpoints section (before CORS setup):

```go
// Generic device data endpoint (API key or device token auth)
r.HandleFunc("/devices/data", handlers.GenericDataHandler).Methods("POST")
```

**Step 3: Build and verify**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`
Expected: No errors

**Step 4: Commit**

```bash
git add internal/handlers/generic_data_handler.go cmd/api/main.go
git commit -m "feat: add generic device data POST endpoint with auto-creation"
```

---

### Task 4: Create the embedded MQTT broker

**Files:**
- Create: `go-data-storage/internal/mqtt/broker.go`

**Step 1: Write the embedded broker**

Create `go-data-storage/internal/mqtt/broker.go`:

```go
package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"data-storage/internal/db"
	"data-storage/internal/handlers"
	"data-storage/internal/models"

	mqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/hooks/auth"
	"github.com/mochi-mqtt/server/v2/listeners"
	"github.com/mochi-mqtt/server/v2/packets"
)

// BrokerConfig holds embedded MQTT broker configuration
type BrokerConfig struct {
	Enabled    bool
	Port       string
	TLSEnabled bool
	TLSCert    string
	TLSKey     string
}

// LoadBrokerConfigFromEnv loads broker config from environment
func LoadBrokerConfigFromEnv() BrokerConfig {
	enabled := os.Getenv("MQTT_BROKER_ENABLED")
	port := os.Getenv("MQTT_BROKER_PORT")
	if port == "" {
		port = "1883"
	}

	return BrokerConfig{
		Enabled:    enabled == "true",
		Port:       port,
		TLSEnabled: os.Getenv("MQTT_BROKER_TLS_ENABLED") == "true",
		TLSCert:    os.Getenv("MQTT_BROKER_TLS_CERT"),
		TLSKey:     os.Getenv("MQTT_BROKER_TLS_KEY"),
	}
}

// DeviceAuthHook validates device credentials against the database
type DeviceAuthHook struct {
	mqtt.HookBase
}

func (h *DeviceAuthHook) ID() string {
	return "device-auth-hook"
}

func (h *DeviceAuthHook) Provides(b byte) bool {
	return b == mqtt.OnConnectAuthenticate || b == mqtt.OnACLCheck
}

func (h *DeviceAuthHook) OnConnectAuthenticate(cl *mqtt.Client, pk packets.Packet) bool {
	username := string(pk.Connect.Username)
	password := string(pk.Connect.Password)

	if username == "" || password == "" {
		log.Printf("MQTT auth failed: empty username or password from %s", cl.ID)
		return false
	}

	// Validate: password should be the device's auth_token
	database := db.GetDB()
	var device models.Device
	result := database.Where("name = ? AND auth_token = ? AND is_active = ?", username, password, true).First(&device)
	if result.Error != nil {
		log.Printf("MQTT auth failed for device '%s': %v", username, result.Error)
		return false
	}

	log.Printf("MQTT auth success for device '%s' (ID: %d)", username, device.ID)
	return true
}

func (h *DeviceAuthHook) OnACLCheck(cl *mqtt.Client, topic string, write bool) bool {
	// Devices can only publish to devices/{their-name}/data
	username := string(cl.Properties.Username)
	expectedTopic := fmt.Sprintf("devices/%s/data", username)

	if write {
		return topic == expectedTopic
	}
	// Allow reading from their own topic
	return strings.HasPrefix(topic, fmt.Sprintf("devices/%s/", username))
}

// MessageProcessingHook processes incoming MQTT messages and stores data
type MessageProcessingHook struct {
	mqtt.HookBase
}

func (h *MessageProcessingHook) ID() string {
	return "message-processing-hook"
}

func (h *MessageProcessingHook) Provides(b byte) bool {
	return b == mqtt.OnPublished
}

func (h *MessageProcessingHook) OnPublished(cl *mqtt.Client, pk packets.Packet) {
	topic := pk.TopicName

	// Only process messages on devices/+/data topics
	parts := strings.Split(topic, "/")
	if len(parts) != 3 || parts[0] != "devices" || parts[2] != "data" {
		return
	}

	deviceName := parts[1]

	// Parse JSON payload
	var data handlers.GenericDeviceDataRaw
	if err := json.Unmarshal(pk.Payload, &data); err != nil {
		log.Printf("MQTT: Error parsing payload from %s: %v", deviceName, err)
		return
	}

	// Set device_id from topic if not in payload
	if data.DeviceID == "" {
		data.DeviceID = deviceName
	}

	// Process using the same logic as the HTTP handler
	if err := handlers.ProcessGenericDeviceData(data, ""); err != nil {
		log.Printf("MQTT: Error processing data from %s: %v", deviceName, err)
	} else {
		log.Printf("MQTT: Stored data from device '%s'", deviceName)
	}
}

// StartBroker starts the embedded MQTT broker
func StartBroker(cfg BrokerConfig) (*mqtt.Server, error) {
	if !cfg.Enabled {
		log.Println("Embedded MQTT broker is disabled")
		return nil, nil
	}

	server := mqtt.New(&mqtt.Options{
		InlineClient: true,
	})

	// Add device auth hook
	if err := server.AddHook(&DeviceAuthHook{}, nil); err != nil {
		return nil, fmt.Errorf("failed to add auth hook: %w", err)
	}

	// Add message processing hook
	if err := server.AddHook(&MessageProcessingHook{}, nil); err != nil {
		return nil, fmt.Errorf("failed to add message hook: %w", err)
	}

	// Add TCP listener
	address := fmt.Sprintf(":%s", cfg.Port)

	if cfg.TLSEnabled && cfg.TLSCert != "" && cfg.TLSKey != "" {
		tlsConfig := &listeners.Config{
			TLSConfig: nil, // Will be configured below
		}
		tcp := listeners.NewTCP(listeners.Config{
			ID:      "mqtt-tls",
			Address: address,
		})
		_ = tlsConfig // TLS config setup would go here
		if err := server.AddListener(tcp); err != nil {
			return nil, fmt.Errorf("failed to add TLS listener: %w", err)
		}
	} else {
		tcp := listeners.NewTCP(listeners.Config{
			ID:      "mqtt-tcp",
			Address: address,
		})
		if err := server.AddListener(tcp); err != nil {
			return nil, fmt.Errorf("failed to add TCP listener: %w", err)
		}
	}

	// Start the broker in a goroutine
	go func() {
		if err := server.Serve(); err != nil {
			log.Printf("MQTT broker error: %v", err)
		}
	}()

	log.Printf("Embedded MQTT broker started on %s", address)
	return server, nil
}
```

**Step 2: Build and check compilation**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`

Note: This might need adjustments to the mochi-mqtt API. Check the actual v2 API and fix imports/types as needed. The key concepts remain the same.

**Step 3: Commit**

```bash
git add internal/mqtt/broker.go
git commit -m "feat: add embedded MQTT broker with device auth and message processing"
```

---

### Task 5: Wire broker startup into main.go

**Files:**
- Modify: `go-data-storage/cmd/api/main.go`

**Step 1: Add broker startup after MQTT client section**

In `cmd/api/main.go`, add after the existing MQTT client block (line ~42) and before the router setup:

```go
	// Start embedded MQTT broker (if configured)
	brokerConfig := mqtt.LoadBrokerConfigFromEnv()
	broker, err := mqtt.StartBroker(brokerConfig)
	if err != nil {
		log.Printf("Warning: Failed to start embedded MQTT broker: %v", err)
		log.Println("Continuing without embedded MQTT broker")
	}
	if broker != nil {
		defer broker.Close()
	}
```

**Step 2: Add X-API-Key to CORS allowed headers**

In the CORS config, add `"X-API-Key"` to the AllowedHeaders list:

```go
AllowedHeaders: []string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "X-API-Key"},
```

**Step 3: Build and verify**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`
Expected: Clean build

**Step 4: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat: wire embedded MQTT broker startup and generic data route into main"
```

---

### Task 6: Manual test Phase 1

**Step 1: Start the server**

```bash
cd C:\Users\Klaus\Documents\Mestrado\go-data-storage
go run ./cmd/api/
```

**Step 2: Test generic POST with curl**

```bash
curl -X POST http://localhost:8080/devices/data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key-123" \
  -d '{"device_id":"test-mcu-01","field_1":23.5,"field_2":1024,"field_3":null,"field_4":null,"field_5":null,"field_6":null,"field_7":null,"field_8":null}'
```

Expected: `{"status":"ok"}` with 201 status

**Step 3: Verify device was auto-created**

Login first, then check devices:
```bash
curl http://localhost:8080/devices -H "Authorization: Bearer <your-jwt-token>"
```

Expected: should show `test-mcu-01` device with auto-created signals

**Step 4: Test MQTT with mosquitto_pub (if available)**

```bash
mosquitto_pub -h localhost -p 1883 -u "test-mcu-01" -P "<device-auth-token>" -t "devices/test-mcu-01/data" -m '{"field_1":25.0,"field_2":2048}'
```

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: Phase 1 testing adjustments"
```

---

## Phase 2: MES Data Models + Backend API

### Task 7: Add MES models to Go backend

**Files:**
- Modify: `go-data-storage/internal/models/models.go`

**Step 1: Add the new MES model structs**

Append to `go-data-storage/internal/models/models.go` (before the closing of the file):

```go
// Product represents a manufactured product
type Product struct {
	ID          uint              `gorm:"primaryKey" json:"id,omitempty"`
	Name        string            `gorm:"not null" json:"name"`
	SKU         string            `gorm:"uniqueIndex" json:"sku,omitempty"`
	Description string            `json:"description,omitempty"`
	Unit        string            `json:"unit,omitempty"`
	Category    string            `json:"category,omitempty"`
	IsActive    bool              `gorm:"default:true" json:"is_active"`
	Metadata    JSONB             `gorm:"type:jsonb" json:"metadata,omitempty"`
	BOM         []BillOfMaterials `gorm:"foreignKey:ProductID" json:"bom,omitempty"`
	CreatedAt   time.Time         `json:"created_at,omitempty"`
	UpdatedAt   time.Time         `json:"updated_at,omitempty"`
}

// RawMaterial represents a raw material in stock
type RawMaterial struct {
	ID            uint      `gorm:"primaryKey" json:"id,omitempty"`
	Name          string    `gorm:"not null" json:"name"`
	SKU           string    `gorm:"uniqueIndex" json:"sku,omitempty"`
	Description   string    `json:"description,omitempty"`
	Unit          string    `json:"unit,omitempty"`
	StockQuantity float64   `gorm:"default:0" json:"stock_quantity"`
	MinStock      *float64  `json:"min_stock,omitempty"`
	Category      string    `json:"category,omitempty"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	Metadata      JSONB     `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt     time.Time `json:"created_at,omitempty"`
	UpdatedAt     time.Time `json:"updated_at,omitempty"`
}

// BillOfMaterials links a product to the raw materials needed to produce it
type BillOfMaterials struct {
	ID            uint        `gorm:"primaryKey" json:"id,omitempty"`
	ProductID     uint        `gorm:"not null;index" json:"product_id"`
	Product       *Product    `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	RawMaterialID uint        `gorm:"not null;index" json:"raw_material_id"`
	RawMaterial   *RawMaterial `gorm:"foreignKey:RawMaterialID" json:"raw_material,omitempty"`
	Quantity      float64     `gorm:"not null" json:"quantity"`
	CreatedAt     time.Time   `json:"created_at,omitempty"`
	UpdatedAt     time.Time   `json:"updated_at,omitempty"`
}

// ProductionOrder represents a manufacturing order
type ProductionOrder struct {
	ID               uint       `gorm:"primaryKey" json:"id,omitempty"`
	ProductID        uint       `gorm:"not null;index" json:"product_id"`
	Product          *Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity         float64    `gorm:"not null" json:"quantity"`
	Status           string     `gorm:"not null;default:'planned'" json:"status"`
	Priority         int        `gorm:"default:0" json:"priority,omitempty"`
	DeviceID         *uint      `gorm:"index" json:"device_id,omitempty"`
	Device           *Device    `gorm:"foreignKey:DeviceID" json:"device,omitempty"`
	WorkInstructions string     `json:"work_instructions,omitempty"`
	QualityNotes     string     `json:"quality_notes,omitempty"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	CompletedAt      *time.Time `json:"completed_at,omitempty"`
	Metadata         JSONB      `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt        time.Time  `json:"created_at,omitempty"`
	UpdatedAt        time.Time  `json:"updated_at,omitempty"`
}

// StockMovement tracks changes to raw material stock
type StockMovement struct {
	ID                uint         `gorm:"primaryKey" json:"id,omitempty"`
	RawMaterialID     uint         `gorm:"not null;index" json:"raw_material_id"`
	RawMaterial       *RawMaterial `gorm:"foreignKey:RawMaterialID" json:"raw_material,omitempty"`
	ProductionOrderID *uint        `gorm:"index" json:"production_order_id,omitempty"`
	MovementType      string       `gorm:"not null" json:"movement_type"` // "in", "out", "adjustment"
	Quantity          float64      `gorm:"not null" json:"quantity"`
	Notes             string       `json:"notes,omitempty"`
	CreatedAt         time.Time    `json:"created_at,omitempty"`
}
```

**Step 2: Update db.go AutoMigrate**

In `go-data-storage/internal/db/db.go`, update the `AutoMigrate` call to include new models:

```go
err = DB.AutoMigrate(
	&models.User{},
	&models.Device{},
	&models.Signal{},
	&models.SignalValue{},
	&models.Product{},
	&models.RawMaterial{},
	&models.BillOfMaterials{},
	&models.ProductionOrder{},
	&models.StockMovement{},
)
```

**Step 3: Build and verify**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`
Expected: Clean build

**Step 4: Commit**

```bash
git add internal/models/models.go internal/db/db.go
git commit -m "feat: add MES models (Product, RawMaterial, BOM, ProductionOrder, StockMovement)"
```

---

### Task 8: Create Products handler

**Files:**
- Create: `go-data-storage/internal/handlers/products_handler.go`

**Step 1: Write the products handler**

Create `go-data-storage/internal/handlers/products_handler.go`:

```go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"data-storage/internal/db"
	"data-storage/internal/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// ProductsHandler handles GET (list) and POST (create) for products
func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getAllProducts(w, r)
	case "POST":
		createProduct(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// ProductHandler handles GET/PUT/DELETE for a single product
func ProductHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getProduct(w, r)
	case "PUT":
		updateProduct(w, r)
	case "DELETE":
		deleteProduct(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAllProducts(w http.ResponseWriter, r *http.Request) {
	var products []models.Product
	query := db.GetDB()

	if category := r.URL.Query().Get("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if active := r.URL.Query().Get("active"); active != "" {
		query = query.Where("is_active = ?", active == "true")
	}

	result := query.Find(&products)
	if result.Error != nil {
		log.Printf("Error fetching products: %v", result.Error)
		http.Error(w, "Error fetching products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func getProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var product models.Product
	result := db.GetDB().Preload("BOM.RawMaterial").First(&product, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Product not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error fetching product", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func createProduct(w http.ResponseWriter, r *http.Request) {
	var product models.Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if product.Name == "" {
		http.Error(w, "Product name is required", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Create(&product)
	if result.Error != nil {
		log.Printf("Error creating product: %v", result.Error)
		http.Error(w, "Error creating product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

func updateProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var product models.Product
	if db.GetDB().First(&product, id).Error != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	var updateData models.Product
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	product.Name = updateData.Name
	product.SKU = updateData.SKU
	product.Description = updateData.Description
	product.Unit = updateData.Unit
	product.Category = updateData.Category
	product.IsActive = updateData.IsActive
	product.Metadata = updateData.Metadata

	if err := db.GetDB().Save(&product).Error; err != nil {
		http.Error(w, "Error updating product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func deleteProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Delete(&models.Product{}, id)
	if result.Error != nil {
		http.Error(w, "Error deleting product", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// BOM handlers

// ProductBOMHandler handles GET/POST for BOM entries of a product
func ProductBOMHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getProductBOM(w, r)
	case "POST":
		addBOMEntry(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// BOMEntryHandler handles DELETE for individual BOM entries
func BOMEntryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	deleteBOMEntry(w, r)
}

func getProductBOM(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	productID, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var entries []models.BillOfMaterials
	result := db.GetDB().Preload("RawMaterial").Where("product_id = ?", productID).Find(&entries)
	if result.Error != nil {
		http.Error(w, "Error fetching BOM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

func addBOMEntry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	productID, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var entry models.BillOfMaterials
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	entry.ProductID = uint(productID)

	if entry.RawMaterialID == 0 {
		http.Error(w, "raw_material_id is required", http.StatusBadRequest)
		return
	}
	if entry.Quantity <= 0 {
		http.Error(w, "quantity must be positive", http.StatusBadRequest)
		return
	}

	if err := db.GetDB().Create(&entry).Error; err != nil {
		http.Error(w, "Error creating BOM entry", http.StatusInternalServerError)
		return
	}

	// Reload with RawMaterial preloaded
	db.GetDB().Preload("RawMaterial").First(&entry, entry.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(entry)
}

func deleteBOMEntry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid BOM entry ID", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Delete(&models.BillOfMaterials{}, id)
	if result.Error != nil {
		http.Error(w, "Error deleting BOM entry", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		http.Error(w, "BOM entry not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
```

**Step 2: Build**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`

**Step 3: Commit**

```bash
git add internal/handlers/products_handler.go
git commit -m "feat: add Products and BOM CRUD handlers"
```

---

### Task 9: Create Raw Materials handler

**Files:**
- Create: `go-data-storage/internal/handlers/raw_materials_handler.go`

**Step 1: Write the handler**

Create `go-data-storage/internal/handlers/raw_materials_handler.go`:

```go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"data-storage/internal/db"
	"data-storage/internal/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// RawMaterialsHandler handles GET/POST for raw materials
func RawMaterialsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getAllRawMaterials(w, r)
	case "POST":
		createRawMaterial(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// RawMaterialHandler handles GET/PUT/DELETE for a single raw material
func RawMaterialHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getRawMaterial(w, r)
	case "PUT":
		updateRawMaterial(w, r)
	case "DELETE":
		deleteRawMaterial(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAllRawMaterials(w http.ResponseWriter, r *http.Request) {
	var materials []models.RawMaterial
	query := db.GetDB()

	if category := r.URL.Query().Get("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if active := r.URL.Query().Get("active"); active != "" {
		query = query.Where("is_active = ?", active == "true")
	}

	result := query.Find(&materials)
	if result.Error != nil {
		log.Printf("Error fetching raw materials: %v", result.Error)
		http.Error(w, "Error fetching raw materials", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(materials)
}

func getRawMaterial(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid raw material ID", http.StatusBadRequest)
		return
	}

	var material models.RawMaterial
	result := db.GetDB().First(&material, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Raw material not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error fetching raw material", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(material)
}

func createRawMaterial(w http.ResponseWriter, r *http.Request) {
	var material models.RawMaterial
	if err := json.NewDecoder(r.Body).Decode(&material); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if material.Name == "" {
		http.Error(w, "Material name is required", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Create(&material)
	if result.Error != nil {
		log.Printf("Error creating raw material: %v", result.Error)
		http.Error(w, "Error creating raw material", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(material)
}

func updateRawMaterial(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid raw material ID", http.StatusBadRequest)
		return
	}

	var material models.RawMaterial
	if db.GetDB().First(&material, id).Error != nil {
		http.Error(w, "Raw material not found", http.StatusNotFound)
		return
	}

	var updateData models.RawMaterial
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	material.Name = updateData.Name
	material.SKU = updateData.SKU
	material.Description = updateData.Description
	material.Unit = updateData.Unit
	material.Category = updateData.Category
	material.IsActive = updateData.IsActive
	material.MinStock = updateData.MinStock
	material.Metadata = updateData.Metadata
	// Note: stock_quantity is NOT updated here — use adjust-stock endpoint

	if err := db.GetDB().Save(&material).Error; err != nil {
		http.Error(w, "Error updating raw material", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(material)
}

func deleteRawMaterial(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid raw material ID", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Delete(&models.RawMaterial{}, id)
	if result.Error != nil {
		http.Error(w, "Error deleting raw material", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		http.Error(w, "Raw material not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AdjustStockRequest represents a manual stock adjustment
type AdjustStockRequest struct {
	Quantity     float64 `json:"quantity"`      // positive=add, negative=subtract
	MovementType string  `json:"movement_type"` // "in", "out", "adjustment"
	Notes        string  `json:"notes"`
}

// AdjustStockHandler handles POST /raw-materials/{id}/adjust-stock
func AdjustStockHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid raw material ID", http.StatusBadRequest)
		return
	}

	var req AdjustStockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MovementType == "" {
		req.MovementType = "adjustment"
	}

	database := db.GetDB()

	// Use a transaction
	tx := database.Begin()

	var material models.RawMaterial
	if tx.First(&material, id).Error != nil {
		tx.Rollback()
		http.Error(w, "Raw material not found", http.StatusNotFound)
		return
	}

	material.StockQuantity += req.Quantity
	if material.StockQuantity < 0 {
		tx.Rollback()
		http.Error(w, "Stock would go negative", http.StatusBadRequest)
		return
	}

	if err := tx.Save(&material).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Error updating stock", http.StatusInternalServerError)
		return
	}

	// Create stock movement record
	materialID := uint(id)
	movement := models.StockMovement{
		RawMaterialID: materialID,
		MovementType:  req.MovementType,
		Quantity:      req.Quantity,
		Notes:         req.Notes,
	}
	if err := tx.Create(&movement).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Error recording stock movement", http.StatusInternalServerError)
		return
	}

	tx.Commit()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(material)
}

// StockMovementsHandler handles GET /stock-movements
func StockMovementsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var movements []models.StockMovement
	query := db.GetDB().Preload("RawMaterial").Order("created_at DESC")

	if materialID := r.URL.Query().Get("raw_material_id"); materialID != "" {
		query = query.Where("raw_material_id = ?", materialID)
	}
	if orderID := r.URL.Query().Get("production_order_id"); orderID != "" {
		query = query.Where("production_order_id = ?", orderID)
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 100
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	query = query.Limit(limit)

	result := query.Find(&movements)
	if result.Error != nil {
		http.Error(w, "Error fetching stock movements", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(movements)
}
```

**Step 2: Build**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`

**Step 3: Commit**

```bash
git add internal/handlers/raw_materials_handler.go
git commit -m "feat: add RawMaterials CRUD, stock adjustment, and stock movements handlers"
```

---

### Task 10: Create Production Orders handler

**Files:**
- Create: `go-data-storage/internal/handlers/production_orders_handler.go`

**Step 1: Write the handler with stock decrement logic**

Create `go-data-storage/internal/handlers/production_orders_handler.go`:

```go
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"data-storage/internal/db"
	"data-storage/internal/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// ProductionOrdersHandler handles GET/POST for production orders
func ProductionOrdersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getAllProductionOrders(w, r)
	case "POST":
		createProductionOrder(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// ProductionOrderHandler handles GET/PUT/DELETE for a single order
func ProductionOrderHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getProductionOrder(w, r)
	case "PUT":
		updateProductionOrder(w, r)
	case "DELETE":
		deleteProductionOrder(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAllProductionOrders(w http.ResponseWriter, r *http.Request) {
	var orders []models.ProductionOrder
	query := db.GetDB().Preload("Product").Preload("Device")

	if status := r.URL.Query().Get("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if productID := r.URL.Query().Get("product_id"); productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if deviceID := r.URL.Query().Get("device_id"); deviceID != "" {
		query = query.Where("device_id = ?", deviceID)
	}

	query = query.Order("priority DESC, created_at DESC")

	result := query.Find(&orders)
	if result.Error != nil {
		log.Printf("Error fetching production orders: %v", result.Error)
		http.Error(w, "Error fetching production orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func getProductionOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.ProductionOrder
	result := db.GetDB().Preload("Product.BOM.RawMaterial").Preload("Device").First(&order, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			http.Error(w, "Production order not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error fetching production order", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func createProductionOrder(w http.ResponseWriter, r *http.Request) {
	var order models.ProductionOrder
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if order.ProductID == 0 {
		http.Error(w, "product_id is required", http.StatusBadRequest)
		return
	}
	if order.Quantity <= 0 {
		http.Error(w, "quantity must be positive", http.StatusBadRequest)
		return
	}

	// Verify product exists
	var product models.Product
	if db.GetDB().First(&product, order.ProductID).Error != nil {
		http.Error(w, "Product not found", http.StatusBadRequest)
		return
	}

	if order.Status == "" {
		order.Status = "planned"
	}

	validStatuses := map[string]bool{"planned": true, "in_progress": true, "completed": true, "cancelled": true}
	if !validStatuses[order.Status] {
		http.Error(w, "Invalid status. Must be: planned, in_progress, completed, cancelled", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Create(&order)
	if result.Error != nil {
		log.Printf("Error creating production order: %v", result.Error)
		http.Error(w, "Error creating production order", http.StatusInternalServerError)
		return
	}

	// Reload with relations
	db.GetDB().Preload("Product").Preload("Device").First(&order, order.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func updateProductionOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.ProductionOrder
	if db.GetDB().First(&order, id).Error != nil {
		http.Error(w, "Production order not found", http.StatusNotFound)
		return
	}

	var updateData models.ProductionOrder
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	order.Quantity = updateData.Quantity
	order.Priority = updateData.Priority
	order.DeviceID = updateData.DeviceID
	order.WorkInstructions = updateData.WorkInstructions
	order.QualityNotes = updateData.QualityNotes
	order.Metadata = updateData.Metadata

	if err := db.GetDB().Save(&order).Error; err != nil {
		http.Error(w, "Error updating production order", http.StatusInternalServerError)
		return
	}

	db.GetDB().Preload("Product").Preload("Device").First(&order, order.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func deleteProductionOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	result := db.GetDB().Delete(&models.ProductionOrder{}, id)
	if result.Error != nil {
		http.Error(w, "Error deleting production order", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		http.Error(w, "Production order not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// StatusUpdateRequest for changing order status
type StatusUpdateRequest struct {
	Status string `json:"status"`
}

// UpdateOrderStatusHandler handles PUT /production-orders/{id}/status
func UpdateOrderStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var req StatusUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{"planned": true, "in_progress": true, "completed": true, "cancelled": true}
	if !validStatuses[req.Status] {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	database := db.GetDB()
	tx := database.Begin()

	var order models.ProductionOrder
	if tx.First(&order, id).Error != nil {
		tx.Rollback()
		http.Error(w, "Production order not found", http.StatusNotFound)
		return
	}

	now := time.Now()

	// Handle status transitions
	switch req.Status {
	case "in_progress":
		if order.Status != "planned" {
			tx.Rollback()
			http.Error(w, "Can only start a planned order", http.StatusBadRequest)
			return
		}
		order.StartedAt = &now

	case "completed":
		if order.Status != "in_progress" {
			tx.Rollback()
			http.Error(w, "Can only complete an in-progress order", http.StatusBadRequest)
			return
		}
		order.CompletedAt = &now

		// Decrement stock based on BOM
		if err := decrementStock(tx, &order); err != nil {
			tx.Rollback()
			http.Error(w, fmt.Sprintf("Cannot complete order: %v", err), http.StatusBadRequest)
			return
		}

	case "cancelled":
		if order.Status == "completed" {
			tx.Rollback()
			http.Error(w, "Cannot cancel a completed order", http.StatusBadRequest)
			return
		}
	}

	order.Status = req.Status

	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Error updating order status", http.StatusInternalServerError)
		return
	}

	tx.Commit()

	database.Preload("Product").Preload("Device").First(&order, order.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

// decrementStock reduces raw material stock based on BOM when an order is completed
func decrementStock(tx *gorm.DB, order *models.ProductionOrder) error {
	var bomEntries []models.BillOfMaterials
	if err := tx.Where("product_id = ?", order.ProductID).Find(&bomEntries).Error; err != nil {
		return fmt.Errorf("error fetching BOM: %w", err)
	}

	if len(bomEntries) == 0 {
		// No BOM entries, nothing to decrement
		return nil
	}

	for _, entry := range bomEntries {
		requiredQty := entry.Quantity * order.Quantity

		var material models.RawMaterial
		if err := tx.First(&material, entry.RawMaterialID).Error; err != nil {
			return fmt.Errorf("raw material %d not found", entry.RawMaterialID)
		}

		if material.StockQuantity < requiredQty {
			return fmt.Errorf("insufficient stock for '%s': need %.2f %s, have %.2f",
				material.Name, requiredQty, material.Unit, material.StockQuantity)
		}

		material.StockQuantity -= requiredQty
		if err := tx.Save(&material).Error; err != nil {
			return fmt.Errorf("error updating stock for '%s': %w", material.Name, err)
		}

		// Record stock movement
		orderID := order.ID
		movement := models.StockMovement{
			RawMaterialID:     entry.RawMaterialID,
			ProductionOrderID: &orderID,
			MovementType:      "out",
			Quantity:          -requiredQty,
			Notes:             fmt.Sprintf("Consumed for production order #%d", order.ID),
		}
		if err := tx.Create(&movement).Error; err != nil {
			return fmt.Errorf("error recording stock movement: %w", err)
		}
	}

	return nil
}
```

**Step 2: Build**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`

**Step 3: Commit**

```bash
git add internal/handlers/production_orders_handler.go
git commit -m "feat: add ProductionOrders handler with stock decrement on completion"
```

---

### Task 11: Register all MES routes in main.go

**Files:**
- Modify: `go-data-storage/cmd/api/main.go`

**Step 1: Add MES routes**

Add these routes after the signal-values routes section in `cmd/api/main.go`:

```go
	// MES: Products
	r.HandleFunc("/products", auth.RequireUserAuth(handlers.ProductsHandler))
	r.HandleFunc("/products/{id}", auth.RequireUserAuth(handlers.ProductHandler))
	r.HandleFunc("/products/{id}/bom", auth.RequireUserAuth(handlers.ProductBOMHandler))

	// MES: Raw Materials
	r.HandleFunc("/raw-materials", auth.RequireUserAuth(handlers.RawMaterialsHandler))
	r.HandleFunc("/raw-materials/{id}", auth.RequireUserAuth(handlers.RawMaterialHandler))
	r.HandleFunc("/raw-materials/{id}/adjust-stock", auth.RequireUserAuth(handlers.AdjustStockHandler)).Methods("POST")

	// MES: Production Orders
	r.HandleFunc("/production-orders", auth.RequireUserAuth(handlers.ProductionOrdersHandler))
	r.HandleFunc("/production-orders/{id}", auth.RequireUserAuth(handlers.ProductionOrderHandler))
	r.HandleFunc("/production-orders/{id}/status", auth.RequireUserAuth(handlers.UpdateOrderStatusHandler)).Methods("PUT")

	// MES: Stock Movements
	r.HandleFunc("/stock-movements", auth.RequireUserAuth(handlers.StockMovementsHandler)).Methods("GET")

	// MES: BOM entries
	r.HandleFunc("/bom/{id}", auth.RequireUserAuth(handlers.BOMEntryHandler)).Methods("DELETE")
```

**Step 2: Build and verify**

Run: `cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go build ./cmd/api/`
Expected: Clean build

**Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat: register all MES API routes in main.go"
```

---

### Task 12: Create migration file for documentation

**Files:**
- Create: `go-data-storage/migrations/004_add_mes_tables.sql`

**Step 1: Write the migration (documentation only — GORM auto-migrates)**

Create `go-data-storage/migrations/004_add_mes_tables.sql`:

```sql
-- MES Tables (auto-migrated by GORM, this file is for documentation)

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    sku VARCHAR UNIQUE,
    description VARCHAR,
    unit VARCHAR,
    category VARCHAR,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw Materials
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    sku VARCHAR UNIQUE,
    description VARCHAR,
    unit VARCHAR,
    stock_quantity FLOAT DEFAULT 0,
    min_stock FLOAT,
    category VARCHAR,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill of Materials
CREATE TABLE IF NOT EXISTS bill_of_materials (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
    quantity FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bom_product_id ON bill_of_materials(product_id);
CREATE INDEX idx_bom_raw_material_id ON bill_of_materials(raw_material_id);

-- Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity FLOAT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'planned',
    priority INTEGER DEFAULT 0,
    device_id INTEGER REFERENCES devices(id),
    work_instructions TEXT,
    quality_notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_production_orders_product_id ON production_orders(product_id);
CREATE INDEX idx_production_orders_device_id ON production_orders(device_id);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
    production_order_id INTEGER REFERENCES production_orders(id),
    movement_type VARCHAR NOT NULL,
    quantity FLOAT NOT NULL,
    notes VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_raw_material_id ON stock_movements(raw_material_id);
CREATE INDEX idx_stock_movements_production_order_id ON stock_movements(production_order_id);
```

**Step 2: Commit**

```bash
git add migrations/004_add_mes_tables.sql
git commit -m "docs: add MES migration file for reference"
```

---

## Phase 3: MES Frontend

### Task 13: Add MES types to frontend

**Files:**
- Modify: `data-visualizer/src/types/index.ts`

**Step 1: Add new interfaces**

Append to `data-visualizer/src/types/index.ts`:

```typescript
// MES Types

export interface Product {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  category?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  bom?: BillOfMaterials[];
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  stock_quantity: number;
  min_stock?: number;
  category?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface BillOfMaterials {
  id: number;
  product_id: number;
  product?: Product;
  raw_material_id: number;
  raw_material?: RawMaterial;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductionOrder {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  priority?: number;
  device_id?: number;
  device?: Device;
  work_instructions?: string;
  quality_notes?: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: number;
  raw_material_id: number;
  raw_material?: RawMaterial;
  production_order_id?: number;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  notes?: string;
  created_at?: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  category?: string;
  is_active?: boolean;
}

export interface CreateRawMaterialRequest {
  name: string;
  sku?: string;
  description?: string;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  category?: string;
  is_active?: boolean;
}

export interface CreateBOMEntryRequest {
  raw_material_id: number;
  quantity: number;
}

export interface CreateProductionOrderRequest {
  product_id: number;
  quantity: number;
  priority?: number;
  device_id?: number;
  work_instructions?: string;
  quality_notes?: string;
}

export interface AdjustStockRequest {
  quantity: number;
  movement_type: "in" | "out" | "adjustment";
  notes?: string;
}
```

**Step 2: Commit**

```bash
cd C:\Users\Klaus\Documents\Mestrado\data-visualizer
git add src/types/index.ts
git commit -m "feat: add MES type definitions"
```

---

### Task 14: Add MES API functions to requestHandlers

**Files:**
- Modify: `data-visualizer/src/lib/requestHandlers.ts`

**Step 1: Add import of new types**

Update the import statement at the top of `requestHandlers.ts` to include the new types:

```typescript
import type {
  User, Device, Signal, SignalValue,
  LoginResponse,
  CreateDeviceRequest, CreateSignalRequest, CreateSignalValueRequest, CreateUserRequest,
  Product, RawMaterial, BillOfMaterials, ProductionOrder, StockMovement,
  CreateProductRequest, CreateRawMaterialRequest, CreateBOMEntryRequest,
  CreateProductionOrderRequest, AdjustStockRequest,
} from "@/types";
```

**Step 2: Append MES API functions**

Append to `data-visualizer/src/lib/requestHandlers.ts`:

```typescript
// MES: Product endpoints
export const getProducts = async (params?: { category?: string; active?: string }): Promise<Product[]> => {
  const response = await axiosInstance.get<Product[]>("products", { params });
  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get<Product>(`products/${id}`);
  return response.data;
};

export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
  const response = await axiosInstance.post<Product>("products", data);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<CreateProductRequest>): Promise<Product> => {
  const response = await axiosInstance.put<Product>(`products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axiosInstance.delete(`products/${id}`);
};

// MES: BOM endpoints
export const getProductBOM = async (productId: string): Promise<BillOfMaterials[]> => {
  const response = await axiosInstance.get<BillOfMaterials[]>(`products/${productId}/bom`);
  return response.data;
};

export const addBOMEntry = async (productId: string, data: CreateBOMEntryRequest): Promise<BillOfMaterials> => {
  const response = await axiosInstance.post<BillOfMaterials>(`products/${productId}/bom`, data);
  return response.data;
};

export const deleteBOMEntry = async (id: string): Promise<void> => {
  await axiosInstance.delete(`bom/${id}`);
};

// MES: Raw Material endpoints
export const getRawMaterials = async (params?: { category?: string; active?: string }): Promise<RawMaterial[]> => {
  const response = await axiosInstance.get<RawMaterial[]>("raw-materials", { params });
  return response.data;
};

export const getRawMaterial = async (id: string): Promise<RawMaterial> => {
  const response = await axiosInstance.get<RawMaterial>(`raw-materials/${id}`);
  return response.data;
};

export const createRawMaterial = async (data: CreateRawMaterialRequest): Promise<RawMaterial> => {
  const response = await axiosInstance.post<RawMaterial>("raw-materials", data);
  return response.data;
};

export const updateRawMaterial = async (id: string, data: Partial<CreateRawMaterialRequest>): Promise<RawMaterial> => {
  const response = await axiosInstance.put<RawMaterial>(`raw-materials/${id}`, data);
  return response.data;
};

export const deleteRawMaterial = async (id: string): Promise<void> => {
  await axiosInstance.delete(`raw-materials/${id}`);
};

export const adjustStock = async (id: string, data: AdjustStockRequest): Promise<RawMaterial> => {
  const response = await axiosInstance.post<RawMaterial>(`raw-materials/${id}/adjust-stock`, data);
  return response.data;
};

// MES: Stock Movements
export const getStockMovements = async (params?: {
  raw_material_id?: string;
  production_order_id?: string;
  limit?: string;
}): Promise<StockMovement[]> => {
  const response = await axiosInstance.get<StockMovement[]>("stock-movements", { params });
  return response.data;
};

// MES: Production Order endpoints
export const getProductionOrders = async (params?: {
  status?: string;
  product_id?: string;
  device_id?: string;
}): Promise<ProductionOrder[]> => {
  const response = await axiosInstance.get<ProductionOrder[]>("production-orders", { params });
  return response.data;
};

export const getProductionOrder = async (id: string): Promise<ProductionOrder> => {
  const response = await axiosInstance.get<ProductionOrder>(`production-orders/${id}`);
  return response.data;
};

export const createProductionOrder = async (data: CreateProductionOrderRequest): Promise<ProductionOrder> => {
  const response = await axiosInstance.post<ProductionOrder>("production-orders", data);
  return response.data;
};

export const updateProductionOrder = async (
  id: string,
  data: Partial<CreateProductionOrderRequest>
): Promise<ProductionOrder> => {
  const response = await axiosInstance.put<ProductionOrder>(`production-orders/${id}`, data);
  return response.data;
};

export const deleteProductionOrder = async (id: string): Promise<void> => {
  await axiosInstance.delete(`production-orders/${id}`);
};

export const updateOrderStatus = async (id: string, status: string): Promise<ProductionOrder> => {
  const response = await axiosInstance.put<ProductionOrder>(`production-orders/${id}/status`, { status });
  return response.data;
};
```

**Step 3: Verify build**

Run: `cd C:\Users\Klaus\Documents\Mestrado\data-visualizer && npm run build`

**Step 4: Commit**

```bash
git add src/lib/requestHandlers.ts
git commit -m "feat: add MES API functions to request handlers"
```

---

### Task 15: Create ProductsTab component

**Files:**
- Create: `data-visualizer/src/components/tabs/ProductsTab.tsx`

**Step 1: Create the component**

Follow the same pattern as DevicesTab.tsx. Create `data-visualizer/src/components/tabs/ProductsTab.tsx` with:
- Table with columns: ID, Name, SKU, Category, Unit, Status, Actions
- Add Product button
- Edit/Delete buttons per row
- Click product name to select it (shows BOM below)
- BOM sub-table when a product is selected: Material Name, Quantity, Unit, Delete button
- Add BOM Entry button (shows when product is selected)

Use the same shadcn/ui components: Card, CardHeader, CardTitle, CardContent, Table, Button.
Import types: `Product`, `BillOfMaterials`, `RawMaterial`.

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/tabs/ProductsTab.tsx
git commit -m "feat: add ProductsTab component with BOM sub-table"
```

---

### Task 16: Create MaterialsTab component

**Files:**
- Create: `data-visualizer/src/components/tabs/MaterialsTab.tsx`

**Step 1: Create the component**

Follow the DevicesTab pattern. Create with:
- Table with columns: ID, Name, SKU, Category, Unit, Stock, Min Stock, Status, Actions
- Stock level indicator: green if stock > min_stock*1.5, yellow if stock > min_stock, red if stock <= min_stock
- Add Material button
- Edit/Delete/Adjust Stock buttons per row
- "Adjust Stock" opens a callback to the parent

**Step 2: Verify build and commit**

```bash
git add src/components/tabs/MaterialsTab.tsx
git commit -m "feat: add MaterialsTab component with stock indicators"
```

---

### Task 17: Create OrdersTab component

**Files:**
- Create: `data-visualizer/src/components/tabs/OrdersTab.tsx`

**Step 1: Create the component**

Create with:
- Table with columns: ID, Product, Quantity, Status, Priority, Device, Started, Completed, Actions
- Status badges with colors: planned=gray, in_progress=blue, completed=green, cancelled=red
- Add Order button
- Status transition buttons (Start/Complete/Cancel) based on current status
- Edit/Delete buttons
- Filter dropdown for status

**Step 2: Verify build and commit**

```bash
git add src/components/tabs/OrdersTab.tsx
git commit -m "feat: add OrdersTab component with status transitions"
```

---

### Task 18: Create MES dialog components

**Files:**
- Create: `data-visualizer/src/components/dialogs/ProductDialog.tsx`
- Create: `data-visualizer/src/components/dialogs/RawMaterialDialog.tsx`
- Create: `data-visualizer/src/components/dialogs/ProductionOrderDialog.tsx`
- Create: `data-visualizer/src/components/dialogs/StockAdjustDialog.tsx`
- Create: `data-visualizer/src/components/dialogs/BOMDialog.tsx`

**Step 1: Create each dialog following the DeviceDialog pattern**

**ProductDialog**: Fields: name (required), sku, description, unit, category. Create/Edit mode.

**RawMaterialDialog**: Fields: name (required), sku, description, unit, category, min_stock. Create/Edit mode. Note: stock_quantity is NOT editable here (use adjust-stock).

**ProductionOrderDialog**: Fields: product_id (dropdown), quantity (required), priority, device_id (dropdown, optional), work_instructions (textarea), quality_notes (textarea). Create/Edit mode. Needs products list and devices list as props.

**StockAdjustDialog**: Fields: movement_type (in/out/adjustment dropdown), quantity (number, required), notes. Single-purpose dialog.

**BOMDialog**: Fields: raw_material_id (dropdown), quantity (number, required). Needs rawMaterials list as prop. Single-purpose dialog.

**Step 2: Verify build and commit**

```bash
git add src/components/dialogs/ProductDialog.tsx src/components/dialogs/RawMaterialDialog.tsx src/components/dialogs/ProductionOrderDialog.tsx src/components/dialogs/StockAdjustDialog.tsx src/components/dialogs/BOMDialog.tsx
git commit -m "feat: add MES dialog components (Product, Material, Order, Stock, BOM)"
```

---

### Task 19: Update Dashboard.tsx with MES tabs and state

**Files:**
- Modify: `data-visualizer/src/components/Dashboard.tsx`

**Step 1: Update TabType to include MES tabs**

```typescript
type TabType = "dashboard" | "devices" | "signals" | "values" | "users" | "products" | "materials" | "orders";
```

**Step 2: Add MES state variables**

Add alongside existing state:
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
```

Add dialog states:
```typescript
const [productDialogOpen, setProductDialogOpen] = useState(false);
const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
const [orderDialogOpen, setOrderDialogOpen] = useState(false);
const [stockAdjustDialogOpen, setStockAdjustDialogOpen] = useState(false);
const [bomDialogOpen, setBomDialogOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
```

**Step 3: Update fetchData to include MES data**

Add MES fetches to the `Promise.all`:
```typescript
const [devicesData, signalsData, valuesData, usersData, productsData, materialsData, ordersData] = await Promise.all([
  getDevices(),
  getSignals(),
  getSignalValues({ limit: "100" }),
  getUsers(),
  getProducts(),
  getRawMaterials(),
  getProductionOrders(),
]);
```

**Step 4: Add MES CRUD handlers**

Follow the same pattern as existing handlers for products, materials, orders, BOM, and stock adjustment.

**Step 5: Update tab navigation**

Group tabs into IoT / MES / Admin sections with visual separators. Add icons from lucide-react: `Package`, `Boxes`, `ClipboardList` for Products, Materials, Orders.

**Step 6: Add MES tab content rendering and dialogs**

Wire up the new tab components and dialogs following the existing pattern.

**Step 7: Verify build**

Run: `npm run build`

**Step 8: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: integrate MES tabs, state, and CRUD handlers into Dashboard"
```

---

### Task 20: Update index.tsx to accept new tab types

**Files:**
- Modify: `data-visualizer/src/pages/index.tsx`

**Step 1: Update the valid tab list**

Find the tab validation logic and add the new tab types: `"products"`, `"materials"`, `"orders"`.

**Step 2: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: accept MES tab types in URL routing"
```

---

## Phase 4: MES + IoT Linking

### Task 21: Add order signal values endpoint to backend

**Files:**
- Modify: `go-data-storage/internal/handlers/production_orders_handler.go`

**Step 1: Add handler for fetching device signals during order time range**

Add to `production_orders_handler.go`:

```go
// OrderSignalValuesHandler returns signal values for the device linked to an order,
// filtered by the order's active time range
func OrderSignalValuesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 32)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.ProductionOrder
	if db.GetDB().First(&order, id).Error != nil {
		http.Error(w, "Production order not found", http.StatusNotFound)
		return
	}

	if order.DeviceID == nil {
		http.Error(w, "Order has no linked device", http.StatusBadRequest)
		return
	}

	// Get signals for the device
	var signals []models.Signal
	db.GetDB().Where("device_id = ?", *order.DeviceID).Find(&signals)

	signalIDs := make([]uint, len(signals))
	for i, s := range signals {
		signalIDs[i] = s.ID
	}

	// Query signal values within the order's time range
	query := db.GetDB().Where("signal_id IN ?", signalIDs).Preload("Signal").Order("timestamp ASC")

	if order.StartedAt != nil {
		query = query.Where("timestamp >= ?", *order.StartedAt)
	}
	if order.CompletedAt != nil {
		query = query.Where("timestamp <= ?", *order.CompletedAt)
	}

	var values []models.SignalValue
	query.Find(&values)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(values)
}
```

**Step 2: Register the route in main.go**

```go
r.HandleFunc("/production-orders/{id}/signal-values", auth.RequireUserAuth(handlers.OrderSignalValuesHandler)).Methods("GET")
```

**Step 3: Build and commit**

```bash
git add internal/handlers/production_orders_handler.go cmd/api/main.go
git commit -m "feat: add endpoint to fetch signal values linked to production orders"
```

---

### Task 22: Add order detail view with signal chart in frontend

**Files:**
- Modify: `data-visualizer/src/lib/requestHandlers.ts`
- Modify: `data-visualizer/src/components/tabs/OrdersTab.tsx`

**Step 1: Add API function**

Add to `requestHandlers.ts`:
```typescript
export const getOrderSignalValues = async (orderId: string): Promise<SignalValue[]> => {
  const response = await axiosInstance.get<SignalValue[]>(`production-orders/${orderId}/signal-values`);
  return response.data;
};
```

**Step 2: Add signal chart to OrdersTab**

When a production order with a linked device is selected, show a mini Recharts LineChart below the table showing the device's signal values during the order's active period. Use the same chart pattern from SignalValuesTab.tsx.

**Step 3: Build and commit**

```bash
git add src/lib/requestHandlers.ts src/components/tabs/OrdersTab.tsx
git commit -m "feat: add signal values chart to production order detail view"
```

---

### Task 23: Update CLAUDE.md with new features

**Files:**
- Modify: `data-visualizer/CLAUDE.md`

**Step 1: Update directory structure, key components, and URL routing sections**

Add MES tabs, new components, and new API endpoints to the documentation.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with MES and MQTT features"
```

---

### Task 24: Final integration test

**Step 1: Start backend**
```bash
cd C:\Users\Klaus\Documents\Mestrado\go-data-storage && go run ./cmd/api/
```

**Step 2: Start frontend**
```bash
cd C:\Users\Klaus\Documents\Mestrado\data-visualizer && npm run dev
```

**Step 3: Test MES workflow**
1. Create a raw material (e.g., "Steel Rod", unit: "kg", stock: 100)
2. Create a product (e.g., "Widget A", unit: "unit")
3. Add BOM entry: Widget A needs 2kg of Steel Rod
4. Create production order: 10 units of Widget A
5. Start the order → verify started_at is set
6. Complete the order → verify stock decremented by 20kg
7. Check stock movements show the consumption

**Step 4: Test generic device POST**
```bash
curl -X POST http://localhost:8080/devices/data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-key>" \
  -d '{"device_id":"line-sensor-01","field_1":42.5,"field_2":1}'
```
Verify in dashboard Signal Values tab.

**Step 5: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: final integration adjustments"
```
