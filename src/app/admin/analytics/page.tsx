'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface ExtendedAnalytics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingDeliveries: number;
  todayOrders: number;
  todayRevenue: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; amount: number }[];
  totalUsers?: number;
  weeklyGrowth?: number;
}

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<ExtendedAnalytics>({
    queryKey: ['admin-analytics-full'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

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

  const completedOrders = analytics?.ordersByStatus?.DELIVERED || 0;
  const inProgressOrders = (analytics?.ordersByStatus?.PRINTING || 0) + 
    (analytics?.ordersByStatus?.READY_FOR_DELIVERY || 0) + 
    (analytics?.ordersByStatus?.OUT_FOR_DELIVERY || 0);
  const cancelledOrders = analytics?.ordersByStatus?.CANCELLED || 0;

  const completionRate = analytics?.totalOrders 
    ? Math.round((completedOrders / analytics.totalOrders) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(analytics?.totalRevenue || 0)}
                </p>
                <div className="flex items-center text-green-600 text-sm mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>{formatCurrency(analytics?.todayRevenue || 0)} today</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
                <div className="flex items-center text-blue-600 text-sm mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>{analytics?.todayOrders || 0} today</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {completedOrders} delivered
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    analytics?.totalOrders 
                      ? (analytics.totalRevenue / analytics.totalOrders) 
                      : 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Per order
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of orders by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending Payment</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.PENDING || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.PENDING || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Payment Confirmed */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Confirmed</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.PAYMENT_CONFIRMED || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.PAYMENT_CONFIRMED || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Printing */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Printing</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.PRINTING || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.PRINTING || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Ready for Delivery */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ready for Delivery</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.READY_FOR_DELIVERY || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.READY_FOR_DELIVERY || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Out for Delivery */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Out for Delivery</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.OUT_FOR_DELIVERY || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.OUT_FOR_DELIVERY || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Delivered */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Delivered</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.DELIVERED || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.DELIVERED || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cancelled */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cancelled</span>
                  <span className="font-medium">{analytics?.ordersByStatus?.CANCELLED || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${((analytics?.ordersByStatus?.CANCELLED || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            <CardDescription>Daily revenue from completed payments</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.revenueByDay && analytics.revenueByDay.length > 0 ? (
              <div className="space-y-4">
                {analytics.revenueByDay.map((day, index) => {
                  const maxAmount = Math.max(...analytics.revenueByDay.map(d => d.amount));
                  const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={day.date} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-medium">{formatCurrency(day.amount)}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No revenue data available yet</p>
                <p className="text-sm">Revenue will appear as orders are completed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Overall order statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-green-600">{completedOrders}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-blue-600">{inProgressOrders}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-yellow-600">{analytics?.pendingOrders || 0}</p>
              <p className="text-sm text-muted-foreground">Pending Action</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-red-600">{cancelledOrders}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
