"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import type { User, CreateUserRequest } from "@/types";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: User | null;
  onSubmit: (data: CreateUserRequest) => void;
}

export default function UserDialog({ open, onOpenChange, editingItem, onSubmit }: UserDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: CreateUserRequest = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || undefined,
      password: (formData.get("password") as string) || undefined,
      categoria: (formData.get("categoria") as string) || undefined,
      matricula: (formData.get("matricula") as string) || undefined,
      rfid: (formData.get("rfid") as string) || undefined,
    };
    onSubmit(userData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? "Edit User" : "Create User"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-name" className="text-gray-700 dark:text-gray-300">
                Name *
              </Label>
              <Input
                id="user-name"
                name="name"
                required
                defaultValue={editingItem?.name}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="user-email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="user-email"
                name="email"
                type="email"
                defaultValue={editingItem?.email}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="user-password" className="text-gray-700 dark:text-gray-300">
                Password{!editingItem && " *"}
              </Label>
              <Input
                id="user-password"
                name="password"
                type="password"
                required={!editingItem}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="user-categoria" className="text-gray-700 dark:text-gray-300">
                Categoria
              </Label>
              <Input
                id="user-categoria"
                name="categoria"
                defaultValue={editingItem?.categoria}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="user-matricula" className="text-gray-700 dark:text-gray-300">
                Matricula
              </Label>
              <Input
                id="user-matricula"
                name="matricula"
                defaultValue={editingItem?.matricula}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="user-rfid" className="text-gray-700 dark:text-gray-300">
                RFID
              </Label>
              <Input
                id="user-rfid"
                name="rfid"
                defaultValue={editingItem?.rfid}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
