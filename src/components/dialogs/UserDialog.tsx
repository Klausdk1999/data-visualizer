"use client";

import React, { useRef } from "react";
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
import { useTranslations } from "next-intl";
import ImageUpload from "@/components/ui/image-upload";
import { uploadImage, deleteImage } from "@/lib/requestHandlers";
import type { User, CreateUserRequest } from "@/types";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: User | null;
  onSubmit: (data: CreateUserRequest) => void;
}

export default function UserDialog({ open, onOpenChange, editingItem, onSubmit }: UserDialogProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const selectedImageRef = useRef<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: CreateUserRequest = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || undefined,
      password: (formData.get("password") as string) || undefined,
      type: (formData.get("type") as string) || "worker",
      rfid: (formData.get("rfid") as string) || undefined,
    };
    onSubmit(userData);
    if (selectedImageRef.current && editingItem?.id) {
      try {
        await uploadImage("users", editingItem.id, selectedImageRef.current);
      } catch (err) {
        console.error("Error uploading user image:", err);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editUser") : t("createUser")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-name" className="text-gray-700 dark:text-gray-300">
                {tc("name")} *
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
                {t("email")}
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
                {t("password")}
                {!editingItem && " *"}
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
              <Label htmlFor="user-type" className="text-gray-700 dark:text-gray-300">
                {t("type")}
              </Label>
              <select
                id="user-type"
                name="type"
                defaultValue={editingItem?.type || "worker"}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="worker">{t("worker")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="user-rfid" className="text-gray-700 dark:text-gray-300">
                {t("rfid")}
              </Label>
              <Input id="user-rfid" name="rfid" defaultValue={editingItem?.rfid} className="mt-1" />
            </div>

            {/* Image Upload - shown when editing */}
            {editingItem && (
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  {tc("image")}
                </Label>
                <div className="mt-1">
                  <ImageUpload
                    entity="users"
                    entityId={editingItem.id}
                    onImageChange={(file) => {
                      selectedImageRef.current = file;
                    }}
                    onImageDelete={async () => {
                      try {
                        await deleteImage("users", editingItem.id);
                      } catch (err) {
                        console.error("Error deleting user image:", err);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
