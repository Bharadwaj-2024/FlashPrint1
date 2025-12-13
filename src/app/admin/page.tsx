'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusColor, formatStatus } from '@/lib/utils';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingDeliveries: number;
  todayOrders: number;
  todayRevenue: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
      role: string;
    };
    _count: {
      items: number;
    };
  }[];
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; amount: number }[];
}

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statCards: Array<{
    title: string;
    value: string | number;
    icon: typeof FileText;
    color: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  }> = [
    {
      title: 'Total Orders',
      value: analytics?.totalOrders || 0,
      icon: FileText,
      color: 'bg-blue-500',
      change: `+${analytics?.todayOrders || 0} today`,
      changeType: 'positive',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
      change: `+${formatCurrency(analytics?.todayRevenue || 0)} today`,
      changeType: 'positive',
    },
    {
      title: 'Pending Orders',
      value: analytics?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      change: 'Awaiting action',
      changeType: 'neutral',
    },
    {
      title: 'Pending Deliveries',
      value: analytics?.pendingDeliveries || 0,
      icon: Truck,
      color: 'bg-purple-500',
      change: 'Ready for pickup',
      changeType: 'neutral',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p
                    className={`text-xs mt-1 ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {stat.changeType === 'positive' && <TrendingUp className="inline h-3 w-3 mr-1" />}
                    {stat.changeType === 'negative' && <TrendingDown className="inline h-3 w-3 mr-1" />}
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Current order distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics?.ordersByStatus &&
              Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === 'PENDING'
                          ? 'bg-yellow-500'
                          : status === 'PAYMENT_CONFIRMED'
                          ? 'bg-blue-500'
                          : status === 'PRINTING'
                          ? 'bg-purple-500'
                          : status === 'READY_FOR_DELIVERY'
                          ? 'bg-orange-500'
                          : status === 'OUT_FOR_DELIVERY'
                          ? 'bg-indigo-500'
                          : status === 'DELIVERED'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium">{formatStatus(status)}</span>
                  </div>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ))}
            {(!analytics?.ordersByStatus ||
              Object.keys(analytics.ordersByStatus).length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest incoming orders</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recentOrders?.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">#{order.orderNumber}</p>
                      <Badge className={getStatusColor(order.status)}>
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.user.name} • {order.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order._count.items} item(s) • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                      <Badge
                        variant={order.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {order.paymentStatus === 'COMPLETED' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {(!analytics?.recentOrders || analytics.recentOrders.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No orders yet. Orders will appear here as they come in.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/orders?status=PENDING">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Clock className="h-6 w-6 text-yellow-500" />
                <span>Pending Orders</span>
              </Button>
            </Link>
            <Link href="/admin/orders?status=READY_FOR_DELIVERY">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Truck className="h-6 w-6 text-orange-500" />
                <span>Ready for Delivery</span>
              </Button>
            </Link>
            <Link href="/admin/deliveries">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span>Manage Deliveries</span>
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6 text-blue-500" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
