'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor, formatStatus } from '@/lib/utils';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingDeliveries: number;
  todayOrders: number;
  todayRevenue: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user: { name: string; email: string };
    _count: { items: number };
  }>;
  ordersByStatus: Record<string, number>;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/analytics', { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Error loading dashboard</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <Button onClick={fetchAnalytics} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
        
        {/* Still show Quick Actions */}
        <QuickActionsCard />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: analytics?.totalOrders ?? 0,
      icon: FileText,
      color: 'bg-blue-500',
      subtext: `+${analytics?.todayOrders ?? 0} today`,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'bg-green-500',
      subtext: `+${formatCurrency(analytics?.todayRevenue ?? 0)} today`,
    },
    {
      title: 'Pending Orders',
      value: analytics?.pendingOrders ?? 0,
      icon: Clock,
      color: 'bg-yellow-500',
      subtext: 'Need attention',
    },
    {
      title: 'Ready to Deliver',
      value: analytics?.pendingDeliveries ?? 0,
      icon: Truck,
      color: 'bg-purple-500',
      subtext: 'For dispatch',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color} text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest incoming orders</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : analytics?.recentOrders?.length ? (
            <div className="space-y-2">
              {analytics.recentOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">#{order.orderNumber}</span>
                      <Badge className={getStatusColor(order.status)} variant="secondary">
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.user?.name || 'Unknown'} • {order._count?.items || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>

      <QuickActionsCard />
    </div>
  );
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link href="/admin/orders">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-xs">All Orders</span>
            </Button>
          </Link>
          <Link href="/admin/orders?status=PENDING">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-xs">Pending</span>
            </Button>
          </Link>
          <Link href="/admin/deliveries">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Truck className="h-5 w-5 text-purple-500" />
              <span className="text-xs">Deliveries</span>
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              <span className="text-xs">Daily Reports</span>
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <span className="text-xs">Analytics</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
