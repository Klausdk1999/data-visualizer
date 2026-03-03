"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { User } from "@/types";

interface UsersTabProps {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: number) => void;
}

export default function UsersTab({ users, onAddUser, onEditUser, onDeleteUser }: UsersTabProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
        <Button onClick={onAddUser} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("addUser")}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("id")}</TableHead>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("matricula")}</TableHead>
              <TableHead>{t("rfid")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.id}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.name}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.email || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {u.categoria || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {u.matricula || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.rfid || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {u.is_active ? tc("active") : tc("inactive")}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditUser(u)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      {tc("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteUser(u.id)}
                      className="flex items-center gap-1"
                    >
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
