"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Phone, Building2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Customer } from "@/types";

interface CustomersTabProps {
  customers: Customer[];
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: number) => void;
}

export default function CustomersTab({
  customers,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: CustomersTabProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");

  const [searchText, setSearchText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchText.trim()) return customers;
    const q = searchText.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.cnpj || "").toLowerCase().includes(q)
    );
  }, [customers, searchText]);

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
          <Button onClick={onAddCustomer} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("addCustomer")}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-72"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("id")}</TableHead>
                <TableHead>{tc("name")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("cnpj")}</TableHead>
                <TableHead>{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    {tc("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <TableRow
                      className={`cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? "bg-blue-50 dark:bg-blue-950"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() => handleRowClick(customer)}
                    >
                      <TableCell className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                        {customer.id}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {customer.phone || (
                          <span className="text-gray-400 italic text-sm">{t("noPhone")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {customer.cnpj || (
                          <span className="text-gray-400 italic text-sm">{t("noCnpj")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            {tc("edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteCustomer(customer.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {tc("delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded details row */}
                    {selectedCustomer?.id === customer.id && (
                      <TableRow className="bg-blue-50/50 dark:bg-blue-950/50">
                        <TableCell colSpan={5}>
                          <div className="py-3 px-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-start gap-2">
                              <Phone className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {t("phone")}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                                  {customer.phone || (
                                    <span className="text-gray-400 italic">{t("noPhone")}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Building2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {t("cnpj")}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                                  {customer.cnpj || (
                                    <span className="text-gray-400 italic">{t("noCnpj")}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {t("address")}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                                  {customer.address || (
                                    <span className="text-gray-400 italic">{t("noAddress")}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
