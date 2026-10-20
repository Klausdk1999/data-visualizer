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
import { Plus, Edit, Power, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Company } from "@/types";

interface CompaniesTabProps {
  companies: Company[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onToggleActive: (company: Company) => void;
}

export default function CompaniesTab({
  companies,
  onAddCompany,
  onEditCompany,
  onToggleActive,
}: CompaniesTabProps) {
  const t = useTranslations("companies");
  const tc = useTranslations("common");

  const [searchText, setSearchText] = useState("");

  const filteredCompanies = useMemo(() => {
    if (!searchText.trim()) return companies;
    const q = searchText.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cnpj || "").toLowerCase().includes(q)
    );
  }, [companies, searchText]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            {t("title")}
          </CardTitle>
          <Button onClick={onAddCompany} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("addCompany")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={tc("search")}
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
                <TableHead>{t("cnpj")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead>{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    {tc("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-mono text-sm">{company.id}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cnpj || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          company.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {company.is_active ? t("active") : t("inactive")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditCompany(company)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          {tc("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant={company.is_active ? "destructive" : "default"}
                          onClick={() => onToggleActive(company)}
                          className="flex items-center gap-1"
                        >
                          <Power className="w-3.5 h-3.5" />
                          {company.is_active ? t("deactivate") : t("activate")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
