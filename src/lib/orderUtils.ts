import type { ProductionOrder } from "@/types";

/**
 * Retorna true se a ordem está atrasada:
 * - Status ativo (planned ou in_progress)
 * - Tem data prevista de entrega
 * - A data prevista já passou
 */
export function isOrderOverdue(order: ProductionOrder): boolean {
  if (order.status === "completed" || order.status === "cancelled") return false;
  if (!order.planned_delivery_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(order.planned_delivery_date) < today;
}

/**
 * Retorna quantos dias de atraso a ordem tem.
 * Retorna 0 se não estiver atrasada.
 */
export function orderOverdueDays(order: ProductionOrder): number {
  if (!isOrderOverdue(order)) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(order.planned_delivery_date!);

  return Math.floor((today.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24));
}