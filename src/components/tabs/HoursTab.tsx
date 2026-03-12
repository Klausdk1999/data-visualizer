"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimeEntry } from "@/types";

interface HoursTabProps {
  timeEntries: TimeEntry[];
  isWorker: boolean;
  onAddEntry: () => void;
  onEditEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (entryId: number) => void;
}

export default function HoursTab({
  timeEntries, isWorker, onAddEntry, onEditEntry, onDeleteEntry,
}: HoursTabProps) {
  const t = useTranslations("hours");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
        <Button onClick={onAddEntry} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("addEntry")}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("order")}</TableHead>
              <TableHead>{t("service")}</TableHead>
              <TableHead>{t("worker")}</TableHead>
              <TableHead>{t("day")}</TableHead>
              <TableHead>{t("startTime")}</TableHead>
              <TableHead>{t("endTime")}</TableHead>
              <TableHead>{t("observations")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  OP #{entry.production_order_id}
                  {entry.production_order?.product && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      ({entry.production_order.product.name})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {entry.service?.name || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {entry.user?.name || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{entry.day}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{entry.start_time}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{entry.end_time}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                  {entry.observations || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onEditEntry(entry)} className="flex items-center gap-1">
                      <Edit className="w-3 h-3" />
                      {tc("edit")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDeleteEntry(entry.id)} className="flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      {tc("delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
