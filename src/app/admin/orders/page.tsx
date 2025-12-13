'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusColor, formatStatus } from '@/lib/utils';

const ORDER_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { value: 'PRINTING', label: 'Printing' },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Payments' },
  { value: 'PENDING', label: 'Unpaid' },
  { value: 'COMPLETED', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
];

const USER_ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'OTHERS', label: 'Others' },
];

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  deliveryAddress: any;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  items: Array<{
    id: string;
    fileName: string;
    printType: string;
    copies: number;
    pageCount: number;
    price: number;
  }>;
  _count: {
    items: number;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || 'all');
  const [userRole, setUserRole] = useState(searchParams.get('userRole') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    if (paymentStatus && paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
    if (userRole && userRole !== 'all') params.set('userRole', userRole);
    return params.toString();
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', page, search, status, paymentStatus, userRole],
    queryFn: async () => {
      const response = await fetch(`/api/admin/orders?${buildQueryString()}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentStatus}
              onValueChange={(value) => {
                setPaymentStatus(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={userRole}
              onValueChange={(value) => {
                setUserRole(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {data?.pagination?.total || 0} orders found
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Order</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Items</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Payment</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                    </tr>
                  ))
                ) : data?.orders?.length > 0 ? (
                  data.orders.map((order: Order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold">#{order.orderNumber}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.user.name}</p>
                          <p className="text-sm text-muted-foreground">{order.user.email}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {order.user.role}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{order._count.items} file(s)</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={order.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                          {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No orders found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
