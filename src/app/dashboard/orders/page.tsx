'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/utils';

async function fetchOrders(page: number, status?: string) {
  const params = new URLSearchParams({ page: page.toString() });
  if (status && status !== 'all') params.append('status', status);
  const response = await fetch(`/api/orders?${params}`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, status],
    queryFn: () => fetchOrders(page, status),
  });

  const filteredOrders = data?.orders?.filter((order: any) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track and manage your print orders</p>
        </div>
        <Link href="/dashboard/new-order">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="ORDER_RECEIVED">Order Received</SelectItem>
                <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
                <SelectItem value="PAYMENT_CONFIRMED">Payment Confirmed</SelectItem>
                <SelectItem value="PRINTING_IN_PROGRESS">Printing</SelectItem>
                <SelectItem value="READY_FOR_DELIVERY">Ready for Delivery</SelectItem>
                <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders?.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order: any, index: number) => (
            <div key={order.id}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-primary/10 rounded-full hidden md:flex">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.orderNumber}</h3>
                          <Badge className={ORDER_STATUS_COLORS[order.status]}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(order.createdAt)} • {order.items.length} file
                          {order.items.length > 1 ? 's' : ''} • {order.totalPages} pages
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Pagination */}
          {data?.pagination?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "We couldn't find any orders matching your search."
                : "You haven't placed any orders yet."}
            </p>
            <Link href="/dashboard/new-order">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
