"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Service } from "@/types";

interface ServicesTabProps {
  services: Service[];
  isWorker: boolean;
  onAddService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: number) => void;
}

export default function ServicesTab({
  services, isWorker, onAddService, onEditService, onDeleteService,
}: ServicesTabProps) {
  const t = useTranslations("services");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
        {!isWorker && (
          <Button onClick={onAddService} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("addService")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("id")}</TableHead>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{tc("description")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              {!isWorker && <TableHead>{tc("actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">{service.id}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{service.code}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{service.name}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{service.description || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {service.is_active ? tc("active") : tc("inactive")}
                </TableCell>
                {!isWorker && (
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEditService(service)} className="flex items-center gap-1">
                        <Edit className="w-3 h-3" />
                        {tc("edit")}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDeleteService(service.id)} className="flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        {tc("delete")}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
