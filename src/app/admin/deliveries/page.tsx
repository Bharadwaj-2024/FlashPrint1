'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Package,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Clock,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, formatStatus } from '@/lib/utils';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryAddress: any;
  user: {
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  _count: {
    items: number;
  };
}

export default function AdminDeliveriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: readyOrders, isLoading: loadingReady } = useQuery({
    queryKey: ['admin-deliveries-ready'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders?status=READY_FOR_DELIVERY&limit=50');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const { data: outForDeliveryOrders, isLoading: loadingOut } = useQuery({
    queryKey: ['admin-deliveries-out'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders?status=OUT_FOR_DELIVERY&limit=50');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deliveries-ready'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deliveries-out'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast({
        title: 'Status Updated',
        description: 'Delivery status has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update delivery status.',
        variant: 'destructive',
      });
    },
  });

  const DeliveryCard = ({ order, showOutButton = false }: { order: DeliveryOrder; showOutButton?: boolean }) => {
    const address = order.deliveryAddress;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">#{order.orderNumber}</span>
                <Badge variant="outline">{order._count.items} item(s)</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ordered {formatDate(order.createdAt)}
              </p>
            </div>
            <span className="font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{order.user.name}</span>
              <Badge variant="secondary" className="text-xs">{order.user.role}</Badge>
            </div>
            
            {order.user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${order.user.phone}`} className="text-primary hover:underline">
                  {order.user.phone}
                </a>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                {address ? (
                  <>
                    <p className="font-medium">{address.type}</p>
                    {address.type === 'Hostel' && (
                      <p className="text-muted-foreground">
                        {address.hostelName}, Room {address.roomNumber}
                      </p>
                    )}
                    {address.type === 'Department' && (
                      <p className="text-muted-foreground">
                        {address.departmentName}
                        {address.cabinNumber && `, Cabin ${address.cabinNumber}`}
                      </p>
                    )}
                    {address.type === 'Custom' && (
                      <p className="text-muted-foreground">{address.buildingName}</p>
                    )}
                    {address.landmark && (
                      <p className="text-xs text-muted-foreground">Near: {address.landmark}</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No address</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {showOutButton ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => updateStatusMutation.mutate({
                    orderId: order.id,
                    status: 'OUT_FOR_DELIVERY'
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Out for Delivery
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => updateStatusMutation.mutate({
                    orderId: order.id,
                    status: 'DELIVERED'
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Delivered
                </Button>
              </>
            )}
            <Link href={`/admin/orders/${order.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyOrders?.pagination?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Ready for Pickup</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outForDeliveryOrders?.pagination?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Out for Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(readyOrders?.pagination?.total || 0) + (outForDeliveryOrders?.pagination?.total || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Tabs */}
      <Tabs defaultValue="ready" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ready" className="gap-2">
            <Package className="h-4 w-4" />
            Ready for Delivery
            {readyOrders?.pagination?.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {readyOrders.pagination.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="out" className="gap-2">
            <Truck className="h-4 w-4" />
            Out for Delivery
            {outForDeliveryOrders?.pagination?.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {outForDeliveryOrders.pagination.total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready">
          {loadingReady ? (
            <LoadingSkeleton />
          ) : readyOrders?.orders?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.orders.map((order: DeliveryOrder) => (
                <DeliveryCard key={order.id} order={order} showOutButton />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No orders ready for delivery</p>
                <p className="text-muted-foreground">
                  Orders will appear here once they're printed and ready.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="out">
          {loadingOut ? (
            <LoadingSkeleton />
          ) : outForDeliveryOrders?.orders?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outForDeliveryOrders.orders.map((order: DeliveryOrder) => (
                <DeliveryCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No orders out for delivery</p>
                <p className="text-muted-foreground">
                  Mark orders as "Out for Delivery" when they leave for delivery.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
