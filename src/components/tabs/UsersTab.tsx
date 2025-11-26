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
import type { User } from "@/types";

interface UsersTabProps {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: number) => void;
}

export default function UsersTab({ users, onAddUser, onEditUser, onDeleteUser }: UsersTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">Users</CardTitle>
        <Button onClick={onAddUser} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Matricula</TableHead>
              <TableHead>RFID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.id}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.name}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.email || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.categoria || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.matricula || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.rfid || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{u.is_active ? "Active" : "Inactive"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditUser(u)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteUser(u.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
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
