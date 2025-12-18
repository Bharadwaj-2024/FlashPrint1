'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import {
  FileSpreadsheet,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Copy,
  DollarSign,
  Receipt,
  PlusCircle,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DailyReportData {
  date: string;
  summary: {
    totalOrders: number;
    totalCopies: number;
    totalPages: number;
    bwPages: number;
    colorPages: number;
    grossRevenue: number;
    productionCost: number;
    otherExpenses: number;
    netProfit: number;
  };
  orders: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    copies: number;
    pages: number;
    bwPages: number;
    colorPages: number;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  expenses: Array<{
    id: string;
    category: string;
    description: string | null;
    amount: number;
  }>;
  pricing: {
    bwPrice: number;
    colorPrice: number;
    bwCost: number;
    colorCost: number;
  };
}

const expenseCategories = [
  { value: 'paper', label: 'Paper' },
  { value: 'ink', label: 'Ink/Toner' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'salary', label: 'Salary' },
  { value: 'rent', label: 'Rent' },
  { value: 'other', label: 'Other' },
];

export default function OwnerReportsPage() {
  const { data: session, status } = useSession();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        toast.error('Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchReport();
    }
  }, [selectedDate, session]);

  // Download Excel report
  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/admin/reports/export?date=${selectedDate}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FlashPrint_DailyReport_${selectedDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Report downloaded successfully');
      } else {
        toast.error('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Error downloading report');
    } finally {
      setDownloading(false);
    }
  };

  // Regenerate daily Excel report
  const regenerateExcel = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/admin/reports/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });
      
      if (response.ok) {
        toast.success('Daily Excel report regenerated successfully');
      } else {
        toast.error('Failed to regenerate report');
      }
    } catch (error) {
      console.error('Error regenerating report:', error);
      toast.error('Error regenerating report');
    } finally {
      setRegenerating(false);
    }
  };

  // Download saved Excel file
  const downloadSavedExcel = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/admin/reports/excel?date=${selectedDate}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FlashPrint_Orders_${selectedDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Excel file downloaded successfully');
      } else {
        toast.error('Failed to download Excel file');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Error downloading Excel file');
    } finally {
      setDownloading(false);
    }
  };

  // Add expense
  const addExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description || null
        })
      });

      if (response.ok) {
        toast.success('Expense added successfully');
        setNewExpense({ category: '', amount: '', description: '' });
        setAddExpenseOpen(false);
        fetchReport();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Error adding expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense
  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reports?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Expense deleted');
        fetchReport();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error deleting expense');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="text-gray-500 mt-2">This page is only for owners and administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = reportData?.summary || {
    totalOrders: 0,
    totalCopies: 0,
    totalPages: 0,
    bwPages: 0,
    colorPages: 0,
    grossRevenue: 0,
    productionCost: 0,
    otherExpenses: 0,
    netProfit: 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-500">View daily earnings, expenses, and profit</p>
          <p className="text-xs text-green-600 mt-1">
            ✓ Orders are automatically saved to Excel files daily
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={regenerateExcel} 
            disabled={regenerating || loading}
            title="Regenerate daily Excel file"
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Regenerate
          </Button>
          <Button onClick={downloadSavedExcel} disabled={downloading || loading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-3xl font-bold">{summary.totalOrders}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Pages</p>
                    <p className="text-3xl font-bold">{summary.totalPages}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      B&W: {summary.bwPages} | Color: {summary.colorPages}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Gross Revenue</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{summary.grossRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={summary.netProfit >= 0 ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{summary.netProfit.toFixed(2)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${summary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {summary.netProfit >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Production Cost</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{summary.productionCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Paper + Ink cost</p>
                  </div>
                  <Printer className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Other Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{summary.otherExpenses.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Daily added expenses</p>
                  </div>
                  <Receipt className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Copies</p>
                    <p className="text-2xl font-bold">{summary.totalCopies}</p>
                    <p className="text-xs text-gray-400 mt-1">Documents printed</p>
                  </div>
                  <Copy className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>All orders for {format(parseISO(selectedDate), 'dd MMMM yyyy')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {reportData?.orders && reportData.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Copies</TableHead>
                        <TableHead className="text-center">Pages</TableHead>
                        <TableHead className="text-center">B&W</TableHead>
                        <TableHead className="text-center">Color</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.orders.map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-gray-500">{order.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{order.copies}</TableCell>
                          <TableCell className="text-center">{order.pages}</TableCell>
                          <TableCell className="text-center">{order.bwPages}</TableCell>
                          <TableCell className="text-center">{order.colorPages}</TableCell>
                          <TableCell className="text-right font-medium">₹{order.amount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No orders for this date</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Expenses</CardTitle>
                <CardDescription>Additional expenses for this day</CardDescription>
              </div>
              <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Daily Expense</DialogTitle>
                    <DialogDescription>
                      Add an expense for {format(parseISO(selectedDate), 'dd MMMM yyyy')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Category *</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="Optional description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={addExpense} disabled={submitting} className="w-full">
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Add Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {reportData?.expenses && reportData.expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="capitalize font-medium">{expense.category}</TableCell>
                        <TableCell className="text-gray-500">{expense.description || '-'}</TableCell>
                        <TableCell className="text-right font-medium">₹{expense.amount}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpense(expense.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No expenses added for this date</p>
                  <Button variant="link" onClick={() => setAddExpenseOpen(true)}>
                    Add your first expense
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
