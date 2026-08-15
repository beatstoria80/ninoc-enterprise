export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PENDING_PACKING = 'pending_packing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ALLOCATED = 'allocated',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PROCESSING = 'processing'
}

export const ACTION_REQUIRED_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PENDING_PACKING,
];

export const WAITING_PICKUP_STATUSES = [
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.ALLOCATED,
];

export const COMPLETED_STATUSES = [
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];
