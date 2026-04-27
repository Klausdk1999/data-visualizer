"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { getCurrentUser } from "@/lib/requestHandlers";
import EquipmentTab from "@/components/tabs/EquipmentTab";
import {
  getDevices,
  getSignals,
  getSignalValues,
  createDevice,
  updateDevice,
  deleteDevice,
  createSignal,
  updateSignal,
  deleteSignal,
  createSignalValue,
  deleteSignalValue,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  getProductionOrders,
  createProductionOrder,
  updateProductionOrder,
  deleteProductionOrder,
  updateOrderStatus,
  adjustStock,
  getProductBOM,
  addBOMEntry,
  deleteBOMEntry,
  getServices,
  createService,
  updateService,
  deleteService,
  getTimeEntries,
  createTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/requestHandlers";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { TabType } from "@/components/Sidebar";
import DashboardTab from "@/components/tabs/DashboardTab";
import DevicesTab from "@/components/tabs/DevicesTab";
import SignalsTab from "@/components/tabs/SignalsTab";
import SignalValuesTab from "@/components/tabs/SignalValuesTab";
import UsersTab from "@/components/tabs/UsersTab";
import ProductsTab from "@/components/tabs/ProductsTab";
import MaterialsTab from "@/components/tabs/MaterialsTab";
import OrdersTab from "@/components/tabs/OrdersTab";
import ServicesTab from "@/components/tabs/ServicesTab";
import HoursTab from "@/components/tabs/HoursTab";
import CustomersTab from "@/components/tabs/CustomersTab";
import DeviceDialog from "@/components/dialogs/DeviceDialog";
import SignalDialog from "@/components/dialogs/SignalDialog";
import SignalValueDialog from "@/components/dialogs/SignalValueDialog";
import UserDialog from "@/components/dialogs/UserDialog";
import ProductDialog from "@/components/dialogs/ProductDialog";
import RawMaterialDialog from "@/components/dialogs/RawMaterialDialog";
import ProductionOrderDialog from "@/components/dialogs/ProductionOrderDialog";
import StockAdjustDialog from "@/components/dialogs/StockAdjustDialog";
import BOMDialog from "@/components/dialogs/BOMDialog";
import ServiceDialog from "@/components/dialogs/ServiceDialog";
import TimeEntryDialog from "@/components/dialogs/TimeEntryDialog";
import CustomerDialog from "@/components/dialogs/CustomerDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n";
import type {
  User,
  Device,
  Signal,
  SignalValue,
  CreateDeviceRequest,
  CreateSignalRequest,
  CreateSignalValueRequest,
  CreateUserRequest,
  Product,
  RawMaterial,
  BillOfMaterials,
  ProductionOrder,
  Customer,
  CreateProductRequest,
  CreateRawMaterialRequest,
  CreateProductionOrderRequest,
  CreateBOMEntryRequest,
  AdjustStockRequest,
  Service,
  TimeEntry,
  CreateServiceRequest,
  CreateTimeEntryRequest,
  CreateCustomerRequest,
} from "@/types";

interface DashboardProps {
  onLogout: () => void;
  initialTab?: TabType;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

export default function Dashboard({
  onLogout,
  initialTab = "dashboard",
  locale = "en",
  onLocaleChange,
}: DashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalValues, setSignalValues] = useState<SignalValue[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dialog states
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    Device | Signal | User | Product | RawMaterial | ProductionOrder | null
  >(null);
  const [error, setError] = useState<string>("");

  // MES state
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [bomEntries, setBomEntries] = useState<BillOfMaterials[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);

  // Device token dialog (shown after creating a new device)
  const [newDeviceToken, setNewDeviceToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  // MES dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [stockAdjustDialogOpen, setStockAdjustDialogOpen] = useState(false);
  const [bomDialogOpen, setBomDialogOpen] = useState(false);

  // Hours/Services state
  const [services, setServices] = useState<Service[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Update URL when tab changes
  const updateUrl = useCallback(
    (tab: TabType, extraParams?: Record<string, string>) => {
      const params = new URLSearchParams();
      params.set("tab", tab);
      if (extraParams) {
        Object.entries(extraParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
      }
      router.replace(`/?${params.toString()}`, undefined, { shallow: true });
    },
    [router]
  );

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      updateUrl(tab);
    },
    [updateUrl]
  );

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if we have auth token
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError(t("errors.noToken"));
        return;
      }

      const currentUser = getCurrentUser();
      const isAdmin = currentUser?.type === "admin";

      if (isAdmin) {
        const [
          devicesData,
          signalsData,
          valuesData,
          usersData,
          productsData,
          materialsData,
          ordersData,
          servicesData,
          timeEntriesData,
          customersData,
        ] = await Promise.all([
          getDevices(),
          getSignals(),
          getSignalValues({ limit: "100" }),
          getUsers(),
          getProducts(),
          getRawMaterials(),
          getProductionOrders(),
          getServices(),
          getTimeEntries(),
          getCustomers(),
        ]);
        setDevices(devicesData);
        setSignals(signalsData);
        setSignalValues(valuesData);
        setUsers(usersData);
        setProducts(productsData);
        setRawMaterials(materialsData);
        setProductionOrders(ordersData);
        setServices(servicesData);
        setTimeEntries(timeEntriesData);
        setCustomers(customersData);
      } else {
        // Workers can only fetch: production orders (read), services (read), time entries (own)
        const [ordersData, servicesData, timeEntriesData] = await Promise.all([
          getProductionOrders(),
          getServices(),
          getTimeEntries(),
        ]);
        setProductionOrders(ordersData);
        setServices(servicesData);
        setTimeEntries(timeEntriesData);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        setError(t("errors.authFailed"));
        // Clear invalid token
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      } else {
        setError(error.response?.data || t("errors.fetchFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (deviceId: number) => {
    setSelectedDevice(deviceId === selectedDevice ? null : deviceId);
    if (deviceId !== selectedDevice) {
      fetchDeviceSignals(deviceId);
    }
  };

  const fetchDeviceSignals = async (deviceId: number) => {
    try {
      const deviceSignals = await getSignals({ device_id: deviceId.toString() });
      setSignals(deviceSignals);
      setSelectedSignal(null);
    } catch (error) {
      console.error("Error fetching device signals:", error);
    }
  };

  const handleSignalSelect = (signalId: number) => {
    setSelectedSignal(signalId === selectedSignal ? null : signalId);
    if (signalId !== selectedSignal) {
      fetchSignalValues(signalId);
    }
  };

  const fetchSignalValues = async (signalId: number) => {
    try {
      const values = await getSignalValues({ signal_id: signalId.toString(), limit: "100" });
      setSignalValues(values);
    } catch (error) {
      console.error("Error fetching signal values:", error);
    }
  };

  // Device CRUD handlers
  const handleCreateDevice = async (deviceData: CreateDeviceRequest) => {
    setError("");
    try {
      if (editingItem && "device_type" in editingItem) {
        await updateDevice((editingItem as Device).id.toString(), deviceData);
      } else {
        const result = await createDevice(deviceData);
        if (result.auth_token) {
          setNewDeviceToken(result.auth_token);
          setTokenCopied(false);
        }
      }
      setDeviceDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm(t("devices.confirmDelete"))) return;
    try {
      await deleteDevice(deviceId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // Signal CRUD handlers
  const handleCreateSignal = async (signalData: CreateSignalRequest) => {
    setError("");
    try {
      if (editingItem && "signal_type" in editingItem) {
        await updateSignal((editingItem as Signal).id.toString(), signalData);
      } else {
        await createSignal(signalData);
      }
      setSignalDialogOpen(false);
      setEditingItem(null);
      fetchData();
      if (selectedDevice) fetchDeviceSignals(selectedDevice);
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteSignal = async (signalId: number) => {
    if (!confirm(t("devices.confirmDeleteSignal"))) return;
    try {
      await deleteSignal(signalId.toString());
      fetchData();
      if (selectedDevice) fetchDeviceSignals(selectedDevice);
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // Signal Value CRUD handlers
  const handleCreateSignalValue = async (valueData: CreateSignalValueRequest) => {
    setError("");
    try {
      await createSignalValue(valueData);
      setValueDialogOpen(false);
      fetchData();
      if (selectedSignal) fetchSignalValues(selectedSignal);
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteSignalValue = async (valueId: number) => {
    if (!confirm(t("devices.confirmDeleteSignalValue"))) return;
    try {
      await deleteSignalValue(valueId.toString());
      fetchData();
      if (selectedSignal) fetchSignalValues(selectedSignal);
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // User CRUD handlers
  const handleCreateUser = async (userData: CreateUserRequest) => {
    setError("");
    try {
      if (editingItem && "email" in editingItem) {
        await updateUser((editingItem as User).id.toString(), userData);
      } else {
        await createUser(userData);
      }
      setUserDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t("devices.confirmDeleteUser"))) return;
    try {
      await deleteUser(userId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // Product select handler
  const handleProductSelect = async (productId: number) => {
    const newId = productId === selectedProduct ? null : productId;
    setSelectedProduct(newId);
    if (newId) {
      try {
        const bom = await getProductBOM(newId.toString());
        setBomEntries(bom);
      } catch (err) {
        console.error("Error fetching BOM:", err);
      }
    } else {
      setBomEntries([]);
    }
  };

  // Product CRUD handlers
  const handleCreateProduct = async (data: CreateProductRequest) => {
    setError("");
    try {
      if (editingItem && "sku" in editingItem) {
        await updateProduct((editingItem as Product).id.toString(), data);
        setProductDialogOpen(false);
        setEditingItem(null);
      } else {
        const newProduct = await createProduct(data);
        // After creating, re-open dialog in edit mode so user can add BOM entries
        setSelectedProduct(newProduct.id);
        setBomEntries([]);
        setEditingItem(newProduct);
      }
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm(t("devices.confirmDeleteProduct"))) return;
    try {
      await deleteProduct(productId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // BOM handlers
  const handleAddBOMEntry = async (data: CreateBOMEntryRequest) => {
    if (!selectedProduct) return;
    setError("");
    try {
      await addBOMEntry(selectedProduct.toString(), data);
      const bom = await getProductBOM(selectedProduct.toString());
      setBomEntries(bom);
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteBOMEntry = async (bomId: number) => {
    if (!confirm(t("devices.confirmRemoveBOM"))) return;
    try {
      await deleteBOMEntry(bomId.toString());
      if (selectedProduct) {
        const bom = await getProductBOM(selectedProduct.toString());
        setBomEntries(bom);
      }
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // Raw Material CRUD handlers
  const handleCreateRawMaterial = async (data: CreateRawMaterialRequest) => {
    setError("");
    try {
      if (editingItem && "stock_quantity" in editingItem) {
        await updateRawMaterial((editingItem as RawMaterial).id.toString(), data);
      } else {
        await createRawMaterial(data);
      }
      setMaterialDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteRawMaterial = async (materialId: number) => {
    if (!confirm(t("devices.confirmDeleteMaterial"))) return;
    try {
      await deleteRawMaterial(materialId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  const handleAdjustStock = async (data: AdjustStockRequest) => {
    if (!selectedMaterial) return;
    setError("");
    try {
      await adjustStock(selectedMaterial.id.toString(), data);
      setStockAdjustDialogOpen(false);
      setSelectedMaterial(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.updateFailed"));
    }
  };

  // Production Order CRUD handlers
  const handleCreateOrder = async (data: CreateProductionOrderRequest) => {
    setError("");
    try {
      if (editingItem && "status" in editingItem && "product_id" in editingItem) {
        const orderId = (editingItem as ProductionOrder).id.toString();
        await updateProductionOrder(orderId, data);
        // Auto-set status to completed when end date is provided
        if (data.completed_at) {
          await updateOrderStatus(orderId, "completed");
        }
      } else {
        await createProductionOrder(data);
      }
      setOrderDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(t("devices.confirmDeleteOrder"))) return;
    try {
      await deleteProductionOrder(orderId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    const confirmMsg =
      status === "completed"
        ? t("devices.confirmCompleteOrder")
        : status === "cancelled"
          ? t("devices.confirmCancelOrder")
          : t("devices.confirmStartOrder");
    if (!confirm(confirmMsg)) return;
    setError("");
    try {
      await updateOrderStatus(orderId.toString(), status);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.updateFailed"));
    }
  };

  // Service CRUD handlers
  const handleCreateService = async (data: CreateServiceRequest) => {
    setError("");
    try {
      if (editingService) {
        await updateService(editingService.id.toString(), data);
      } else {
        await createService(data);
      }
      setServiceDialogOpen(false);
      setEditingService(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm(t("services.confirmDelete"))) return;
    try {
      await deleteService(serviceId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // Time Entry CRUD handlers
  const handleCreateTimeEntry = async (entries: CreateTimeEntryRequest[]) => {
    setError("");
    try {
      if (editingTimeEntry && entries.length === 1) {
        await updateTimeEntry(editingTimeEntry.id.toString(), entries[0]);
      } else {
        await createTimeEntries(entries);
      }
      setTimeEntryDialogOpen(false);
      setEditingTimeEntry(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteTimeEntry = async (entryId: number) => {
    if (!confirm(t("hours.confirmDelete"))) return;
    try {
      await deleteTimeEntry(entryId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  // Customer CRUD handlers
  const handleCreateCustomer = async (data: CreateCustomerRequest) => {
    setError("");
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id.toString(), data);
      } else {
        await createCustomer(data);
      }
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      const updatedCustomers = await getCustomers();
      setCustomers(updatedCustomers);
    } catch (err: any) {
      setError(err.response?.data || t("errors.saveFailed"));
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm(t("customers.confirmDelete"))) return;
    try {
      await deleteCustomer(customerId.toString());
      const updatedCustomers = await getCustomers();
      setCustomers(updatedCustomers);
    } catch (err: any) {
      setError(err.response?.data || t("errors.deleteFailed"));
    }
  };

  const isWorker = user?.type === "worker";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userType={user?.type || ""}
        userName={user?.name || user?.email || ""}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        locale={locale}
        onLocaleChange={onLocaleChange}
      />

      <main
        className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? "ml-16" : "ml-60"}`}
      >
        {/* Error Message */}
        {error && (
          <div className="px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-red-500/90 backdrop-blur-sm text-white p-3 rounded-xl shadow-md border border-red-400/30">
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-gray-700 dark:text-gray-300 text-center">
              {t("common.loading")}
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardTab
                  signals={signals}
                  orders={productionOrders}
                  timeEntries={timeEntries}
                  rawMaterials={rawMaterials}
                  userId={user?.id ?? 0}
                />
              )}

              {activeTab === "devices" && (
                <DevicesTab
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onDeviceSelect={handleDeviceSelect}
                  onAddDevice={() => {
                    setEditingItem(null);
                    setDeviceDialogOpen(true);
                  }}
                  onEditDevice={(device) => {
                    setEditingItem(device);
                    setDeviceDialogOpen(true);
                  }}
                  onDeleteDevice={handleDeleteDevice}
                />
              )}

              {activeTab === "signals" && (
                <SignalsTab
                  signals={signals}
                  selectedDevice={selectedDevice}
                  selectedSignal={selectedSignal}
                  onSignalSelect={handleSignalSelect}
                  onAddSignal={() => {
                    setEditingItem(null);
                    setSignalDialogOpen(true);
                  }}
                  onEditSignal={(signal) => {
                    setEditingItem(signal);
                    setSignalDialogOpen(true);
                  }}
                  onDeleteSignal={handleDeleteSignal}
                />
              )}

              {activeTab === "values" && (
                <SignalValuesTab
                  signals={signals}
                  signalValues={signalValues}
                  selectedSignal={selectedSignal}
                  onAddValue={() => {
                    setEditingItem(null);
                    setValueDialogOpen(true);
                  }}
                  onDeleteValue={handleDeleteSignalValue}
                />
              )}

              {activeTab === "users" && (
                <UsersTab
                  users={users}
                  onAddUser={() => {
                    setEditingItem(null);
                    setUserDialogOpen(true);
                  }}
                  onEditUser={(user) => {
                    setEditingItem(user);
                    setUserDialogOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === "products" && (
                <ProductsTab
                  products={products}
                  rawMaterials={rawMaterials}
                  selectedProduct={selectedProduct}
                  bomEntries={bomEntries}
                  onProductSelect={handleProductSelect}
                  onAddProduct={() => {
                    setEditingItem(null);
                    setProductDialogOpen(true);
                  }}
                  onEditProduct={(product) => {
                    setEditingItem(product);
                    handleProductSelect(product.id);
                    setProductDialogOpen(true);
                  }}
                  onDeleteProduct={handleDeleteProduct}
                  onAddBOMEntry={() => setBomDialogOpen(true)}
                  onDeleteBOMEntry={handleDeleteBOMEntry}
                />
              )}

              {activeTab === "materials" && (
                <MaterialsTab
                  materials={rawMaterials}
                  onAddMaterial={() => {
                    setEditingItem(null);
                    setMaterialDialogOpen(true);
                  }}
                  onEditMaterial={(material) => {
                    setEditingItem(material);
                    setMaterialDialogOpen(true);
                  }}
                  onDeleteMaterial={handleDeleteRawMaterial}
                  onAdjustStock={(material) => {
                    setSelectedMaterial(material);
                    setStockAdjustDialogOpen(true);
                  }}
                />
              )}

              {activeTab === "orders" && (
                <OrdersTab
                  orders={productionOrders}
                  isWorker={isWorker}
                  onAddOrder={() => {
                    setEditingItem(null);
                    setOrderDialogOpen(true);
                  }}
                  onEditOrder={(order) => {
                    setEditingItem(order);
                    setOrderDialogOpen(true);
                  }}
                  onDeleteOrder={handleDeleteOrder}
                  onUpdateStatus={handleUpdateOrderStatus}
                />
              )}

              {activeTab === "hours" && (
                <HoursTab
                  timeEntries={
                    isWorker ? timeEntries.filter((e) => e.user_id === user?.id) : timeEntries
                  }
                  isWorker={isWorker}
                  onAddEntry={() => {
                    setEditingTimeEntry(null);
                    setTimeEntryDialogOpen(true);
                  }}
                  onEditEntry={(entry) => {
                    setEditingTimeEntry(entry);
                    setTimeEntryDialogOpen(true);
                  }}
                  onDeleteEntry={handleDeleteTimeEntry}
                />
              )}

              {activeTab === "services" && (
                <ServicesTab
                  services={services}
                  isWorker={isWorker}
                  onAddService={() => {
                    setEditingService(null);
                    setServiceDialogOpen(true);
                  }}
                  onEditService={(service) => {
                    setEditingService(service);
                    setServiceDialogOpen(true);
                  }}
                  onDeleteService={handleDeleteService}
                />
              )}

              {activeTab === "customers" && (
                <CustomersTab
                  customers={customers}
                  onAddCustomer={() => {
                    setEditingCustomer(null);
                    setCustomerDialogOpen(true);
                  }}
                  onEditCustomer={(customer) => {
                    setEditingCustomer(customer);
                    setCustomerDialogOpen(true);
                  }}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}
              {activeTab === "equipment" && (
                <EquipmentTab
                  devices={devices}
                  signals={signals}
                  user={user}
                  userId={user?.id ?? 0}
                  onEditDevice={(device) => {
                    setEditingItem(device);
                    setDeviceDialogOpen(true);
                  }}
                  onDeleteDevice={handleDeleteDevice}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <DeviceDialog
        open={deviceDialogOpen}
        onOpenChange={setDeviceDialogOpen}
        editingItem={editingItem as Device | null}
        onSubmit={handleCreateDevice}
      />

      <SignalDialog
        open={signalDialogOpen}
        onOpenChange={setSignalDialogOpen}
        editingItem={editingItem as Signal | null}
        selectedDevice={selectedDevice}
        onSubmit={handleCreateSignal}
      />

      <SignalValueDialog
        open={valueDialogOpen}
        onOpenChange={setValueDialogOpen}
        selectedSignal={selectedSignal}
        onSubmit={handleCreateSignalValue}
      />

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        editingItem={editingItem as User | null}
        onSubmit={handleCreateUser}
      />

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        editingItem={editingItem as Product | null}
        rawMaterials={rawMaterials}
        bomEntries={bomEntries}
        onSubmit={handleCreateProduct}
        onAddBOMEntry={handleAddBOMEntry}
        onDeleteBOMEntry={handleDeleteBOMEntry}
      />

      <RawMaterialDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        editingItem={editingItem as RawMaterial | null}
        onSubmit={handleCreateRawMaterial}
      />

      <ProductionOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        editingItem={editingItem as ProductionOrder | null}
        products={products}
        devices={devices}
        customers={customers}
        onSubmit={handleCreateOrder}
      />

      <StockAdjustDialog
        open={stockAdjustDialogOpen}
        onOpenChange={setStockAdjustDialogOpen}
        materialName={selectedMaterial?.name || ""}
        onSubmit={handleAdjustStock}
      />

      <BOMDialog
        open={bomDialogOpen}
        onOpenChange={setBomDialogOpen}
        rawMaterials={rawMaterials}
        onSubmit={handleAddBOMEntry}
      />

      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        editingItem={editingService}
        onSubmit={handleCreateService}
      />

      <TimeEntryDialog
        open={timeEntryDialogOpen}
        onOpenChange={setTimeEntryDialogOpen}
        editingItem={editingTimeEntry}
        onSubmit={handleCreateTimeEntry}
        productionOrders={productionOrders}
        services={services}
        users={users}
        currentUser={user}
      />

      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        editingItem={editingCustomer}
        onSubmit={handleCreateCustomer}
      />

      {/* Device Token Dialog — shown once after creating a new device */}
      <Dialog open={!!newDeviceToken} onOpenChange={() => setNewDeviceToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t("devices.tokenCreated")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("devices.tokenWarning")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono break-all text-gray-900 dark:text-gray-100">
                {newDeviceToken}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (newDeviceToken) {
                    navigator.clipboard.writeText(newDeviceToken);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }
                }}
                className="flex items-center gap-1 shrink-0"
              >
                {tokenCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {tokenCopied ? t("devices.copied") : t("devices.copyToken")}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewDeviceToken(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
