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
    <Card className="bg-gray-700 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Users</CardTitle>
        <Button onClick={onAddUser} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-white">ID</TableHead>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Categoria</TableHead>
              <TableHead className="text-white">Matricula</TableHead>
              <TableHead className="text-white">RFID</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="border-gray-600 hover:bg-gray-600">
                <TableCell className="text-white">{u.id}</TableCell>
                <TableCell className="text-white">{u.name}</TableCell>
                <TableCell className="text-white">{u.email || "-"}</TableCell>
                <TableCell className="text-white">{u.categoria || "-"}</TableCell>
                <TableCell className="text-white">{u.matricula || "-"}</TableCell>
                <TableCell className="text-white">{u.rfid || "-"}</TableCell>
                <TableCell className="text-white">{u.is_active ? "Active" : "Inactive"}</TableCell>
                <TableCell className="text-white">
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
