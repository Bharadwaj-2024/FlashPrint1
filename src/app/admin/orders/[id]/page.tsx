'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Printer,
  Truck,
  Package,
  CreditCard,
  User,
  MapPin,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getStatusColor, formatStatus } from '@/lib/utils';

const ORDER_STATUS_FLOW = [
  { value: 'PENDING', label: 'Pending', icon: Clock },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', icon: CreditCard },
  { value: 'PRINTING', label: 'Printing', icon: Printer },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery', icon: Package },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/orders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes: string }) => {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast({
        title: 'Status Updated',
        description: 'Order status has been updated successfully.',
      });
      setStatusDialogOpen(false);
      setSelectedStatus('');
      setStatusNotes('');
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'COMPLETED',
          notes: 'Payment confirmed by admin',
        }),
      });
      if (!response.ok) throw new Error('Failed to confirm payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast({
        title: 'Payment Confirmed',
        description: 'Payment has been confirmed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Confirmation Failed',
        description: 'Failed to confirm payment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    updateStatusMutation.mutate({
      status: selectedStatus,
      notes: statusNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Order not found</p>
        <Link href="/admin/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStatusIndex = ORDER_STATUS_FLOW.findIndex((s) => s.value === order.status);
  const deliveryAddress = order.deliveryAddress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            {formatStatus(order.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline">{order.user.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.fileName}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <span>
                          <strong>Type:</strong> {item.printType === 'BW' ? 'B&W' : 'Color'}
                        </span>
                        <span>
                          <strong>Size:</strong> {item.paperSize}
                        </span>
                        <span>
                          <strong>Sides:</strong> {item.printSide === 'SINGLE' ? 'Single' : 'Double'}
                        </span>
                        <span>
                          <strong>Pages:</strong> {item.pageCount}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        <strong>Copies:</strong> {item.copies}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">{formatCurrency(item.price)}</p>
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-lg">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deliveryAddress ? (
                <div className="space-y-2">
                  <p className="font-medium">{deliveryAddress.type}</p>
                  {deliveryAddress.type === 'Hostel' && (
                    <>
                      <p>
                        Hostel: {deliveryAddress.hostelName}, Room: {deliveryAddress.roomNumber}
                      </p>
                      {deliveryAddress.landmark && <p>Landmark: {deliveryAddress.landmark}</p>}
                    </>
                  )}
                  {deliveryAddress.type === 'Department' && (
                    <>
                      <p>Department: {deliveryAddress.departmentName}</p>
                      {deliveryAddress.cabinNumber && <p>Cabin: {deliveryAddress.cabinNumber}</p>}
                    </>
                  )}
                  {deliveryAddress.type === 'Custom' && (
                    <>
                      <p>
                        {deliveryAddress.buildingName}
                        {deliveryAddress.floorNumber && `, Floor ${deliveryAddress.floorNumber}`}
                      </p>
                      {deliveryAddress.landmark && <p>Landmark: {deliveryAddress.landmark}</p>}
                    </>
                  )}
                  {deliveryAddress.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Notes: {deliveryAddress.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No delivery address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory?.map((history: any, index: number) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      {index < order.statusHistory.length - 1 && (
                        <div className="w-px h-full bg-border flex-1 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          {formatStatus(history.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(history.changedAt)}
                        </span>
                      </div>
                      {history.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!order.statusHistory || order.statusHistory.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No status history available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Confirmation */}
              {order.paymentStatus !== 'COMPLETED' && (
                <Button
                  className="w-full"
                  onClick={() => confirmPaymentMutation.mutate()}
                  disabled={confirmPaymentMutation.isPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                </Button>
              )}

              {/* Status Update */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={order.status}
                  onValueChange={handleStatusChange}
                  disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_FLOW.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Status Buttons */}
              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                <div className="grid grid-cols-1 gap-2">
                  {order.status === 'PAYMENT_CONFIRMED' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('PRINTING')}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Mark as Printing
                    </Button>
                  )}
                  {order.status === 'PRINTING' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('READY_FOR_DELIVERY')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark Ready for Delivery
                    </Button>
                  )}
                  {order.status === 'READY_FOR_DELIVERY' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('OUT_FOR_DELIVERY')}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark Out for Delivery
                    </Button>
                  )}
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('DELIVERED')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-medium">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={order.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                  {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status from "{formatStatus(order.status)}" to "{formatStatus(selectedStatus)}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
