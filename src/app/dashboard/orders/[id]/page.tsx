'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  CreditCard,
  Printer,
  Truck,
  CheckCircle2,
  Package,
  Download,
  Phone,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/utils';

async function fetchOrder(id: string) {
  const response = await fetch(`/api/orders/${id}`);
  if (!response.ok) throw new Error('Failed to fetch order');
  return response.json();
}

const statusTimeline = [
  { status: 'ORDER_RECEIVED', icon: FileText, label: 'Order Received' },
  { status: 'PAYMENT_CONFIRMED', icon: CreditCard, label: 'Payment Confirmed' },
  { status: 'PRINTING_IN_PROGRESS', icon: Printer, label: 'Printing' },
  { status: 'READY_FOR_DELIVERY', icon: Package, label: 'Ready' },
  { status: 'OUT_FOR_DELIVERY', icon: Truck, label: 'Out for Delivery' },
  { status: 'DELIVERED', icon: CheckCircle2, label: 'Delivered' },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <Link href="/dashboard/orders">
          <Button>View All Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusTimeline.findIndex((s) => s.status === order.status);
  const deliveryAddress = order.deliveryAddress as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
              <Badge className={ORDER_STATUS_COLORS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {order.paymentStatus === 'PENDING' && (
          <Link href={`/dashboard/orders/${order.id}/payment`}>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
          </Link>
        )}
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
          <CardDescription>Track your order progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between relative">
            {/* Progress line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${(currentStatusIndex / (statusTimeline.length - 1)) * 100}%`,
                }}
              />
            </div>

            {statusTimeline.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const StatusIcon = step.icon;

              return (
                <div key={step.status} className="flex flex-col items-center z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    } ${isCurrent ? 'scale-110' : ''}`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 text-center max-w-[80px] ${
                      isCompleted ? 'text-primary font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {order.estimatedDelivery && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Estimated Delivery</p>
                <p className="text-sm text-blue-700">
                  {formatDate(order.estimatedDelivery)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[180px]">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.pageCount} pages × {item.copies} copies
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.printType === 'BLACK_WHITE' ? 'B&W' : 'Color'} •{' '}
                      {item.paperSize} • {item.printSide === 'SINGLE' ? '1-sided' : '2-sided'}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-sm">
                  {formatCurrency(item.itemTotal)}
                </span>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Pages</span>
                <span>{order.totalPages}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address & Payment */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{deliveryAddress?.fullName}</p>
                <p className="text-gray-600">
                  {deliveryAddress?.block}, {deliveryAddress?.roomLocation}
                </p>
                {deliveryAddress?.department && (
                  <p className="text-gray-600">{deliveryAddress.department}</p>
                )}
                {deliveryAddress?.branch && (
                  <p className="text-gray-600">
                    {deliveryAddress.branch} - Semester {deliveryAddress.semester}
                  </p>
                )}
                {deliveryAddress?.phoneNumber && (
                  <div className="flex items-center gap-2 mt-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{deliveryAddress.phoneNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge
                    variant={order.paymentStatus === 'COMPLETED' ? 'success' : 'warning'}
                  >
                    {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm">{order.paymentId}</span>
                  </div>
                )}
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid On</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span>UPI</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.statusHistory.map((history: any, index: number) => (
                <div key={history.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                    {index < order.statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{ORDER_STATUS_LABELS[history.status]}</p>
                    {history.note && (
                      <p className="text-sm text-gray-600">{history.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(history.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
