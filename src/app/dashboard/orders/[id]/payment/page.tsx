'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

async function fetchOrder(id: string) {
  const response = await fetch(`/api/orders/${id}`);
  if (!response.ok) throw new Error('Failed to fetch order');
  return response.json();
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [upiLink, setUpiLink] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending');
  const [transactionId, setTransactionId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  useEffect(() => {
    if (order) {
      generateUpiQr(order.totalAmount, order.orderNumber);
    }
  }, [order]);

  const generateUpiQr = async (amount: number, orderRef: string) => {
    // UPI payment link format
    const upiId = 'flashprint@upi'; // Replace with actual UPI ID
    const merchantName = 'FlashPrint';
    const upi = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order-${orderRef}`;
    
    setUpiLink(upi);

    try {
      const qr = await QRCode.toDataURL(upi, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('QR generation error:', error);
    }
  };

  const handlePaymentVerification = async () => {
    if (!transactionId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your UPI Transaction ID',
      });
      return;
    }

    setIsVerifying(true);
    setPaymentStatus('verifying');

    try {
      // Update order with payment details
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'COMPLETED',
          paymentId: transactionId,
          status: 'PAYMENT_CONFIRMED',
          note: 'Payment confirmed by customer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      setPaymentStatus('success');
      toast({
        title: 'Payment Confirmed!',
        description: 'Your order has been placed successfully.',
      });

      // Redirect to order details after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/orders/${orderId}`);
      }, 2000);
    } catch (error) {
      setPaymentStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to confirm payment. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('flashprint@upi');
    toast({
      title: 'Copied!',
      description: 'UPI ID copied to clipboard',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (order.paymentStatus === 'COMPLETED') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div>
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Completed</h2>
        <p className="text-gray-600 mb-6">This order has already been paid for.</p>
        <Link href={`/dashboard/orders/${orderId}`}>
          <Button>View Order Details</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/new-order">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Complete Payment</h1>
          <p className="text-gray-600">Order #{order.orderNumber}</p>
        </div>
      </div>

      {paymentStatus === 'success' ? (
        <div>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
              <p className="text-green-700 mb-4">
                Your order has been placed and is being processed.
              </p>
              <p className="text-sm text-green-600">Redirecting to order details...</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Scan & Pay
              </CardTitle>
              <CardDescription>
                Scan the QR code with any UPI app to pay
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {qrCodeUrl ? (
                <div className="inline-block p-4 bg-white rounded-lg border">
                  <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64" />
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}

              <div className="mt-6 space-y-3">
                <p className="font-semibold text-lg">
                  Amount: {formatCurrency(order.totalAmount)}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-600">UPI ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">flashprint@upi</code>
                  <Button variant="ghost" size="icon" onClick={copyUpiId}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* UPI Apps */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Supported UPI Apps</p>
                <div className="flex justify-center gap-4">
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                    <div
                      key={app}
                      className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-medium"
                    >
                      {app}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Confirmation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Confirm Payment
              </CardTitle>
              <CardDescription>
                After making the payment, enter your UPI Transaction ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">UPI Transaction ID / Reference Number</Label>
                <Input
                  id="transactionId"
                  placeholder="e.g., 123456789012"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  disabled={isVerifying}
                />
                <p className="text-xs text-gray-500">
                  You can find this in your UPI app's transaction history
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handlePaymentVerification}
                disabled={isVerifying || !transactionId}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm Payment
                  </>
                )}
              </Button>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Order Summary</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items</span>
                    <span>{order.items?.length || 0} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pages</span>
                    <span>{order.totalPages} pages</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {paymentStatus === 'failed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-700">
                    Payment verification failed. Please try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setPaymentStatus('pending')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
