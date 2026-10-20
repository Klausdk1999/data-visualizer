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
import type { User, Company } from "@/types";

interface UsersTabProps {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: number) => void;
  companies?: Company[];
  canDelete?: boolean;
}

export default function UsersTab({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  companies = [],
  canDelete = true,
}: UsersTabProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");

  const companyMap = React.useMemo(() => {
    const map = new Map<number, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [companies]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "superadmin":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            {t("superadmin")}
          </span>
        );
      case "admin":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {t("admin")}
          </span>
        );
      case "manager":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {t("manager")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {t("worker")}
          </span>
        );
    }
  };

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
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("company")}</TableHead>
              <TableHead>{t("rfid")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.id}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100 font-medium">{u.name}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.email || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{getRoleBadge(u.type)}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {u.company_id ? companyMap.get(u.company_id) || `#${u.company_id}` : "-"}
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
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteUser(u.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        {tc("delete")}
                      </Button>
                    )}
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
