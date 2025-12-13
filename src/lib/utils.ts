import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const parsedDate = new Date(date);
  
  // Check if date is valid
  if (isNaN(parsedDate.getTime())) {
    return 'N/A';
  }
  
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FP-${timestamp}-${random}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parsePageRange(pageRange: string, totalPages: number): number[] {
  if (!pageRange || pageRange.trim() === '') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Set<number> = new Set();
  const parts = pageRange.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      for (let i = start; i <= Math.min(end, totalPages); i++) {
        if (i >= 1) pages.add(i);
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function calculatePrintCost(
  pageCount: number,
  copies: number,
  printType: 'BW' | 'COLOR',
  printSide: 'SINGLE' | 'DOUBLE'
): number {
  const pricePerPage = printType === 'BW' ? 3 : 12;
  const sheets = printSide === 'DOUBLE' ? Math.ceil(pageCount / 2) : pageCount;
  return sheets * copies * pricePerPage;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  PRINTING: 'Printing',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-800',
  PRINTING: 'bg-purple-100 text-purple-800',
  READY_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const USER_ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty/Teacher',
  OTHERS: 'Others',
  ADMIN: 'Admin',
};

export function formatStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function getStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
