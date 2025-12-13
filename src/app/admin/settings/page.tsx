'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  DollarSign,
  Printer,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [bwPrice, setBwPrice] = useState('3');
  const [colorPrice, setColorPrice] = useState('12');
  const [doubleSidedDiscount, setDoubleSidedDiscount] = useState('0');
  const [upiId, setUpiId] = useState('flashprint@upi');
  const [upiName, setUpiName] = useState('FlashPrint Services');

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Pricing configuration has been updated successfully.',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
          <CardDescription>
            Set the base prices for printing services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bw-price">Black & White (per page)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="bw-price"
                  type="number"
                  min="0"
                  step="0.5"
                  value={bwPrice}
                  onChange={(e) => setBwPrice(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-price">Color (per page)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="color-price"
                  type="number"
                  min="0"
                  step="0.5"
                  value={colorPrice}
                  onChange={(e) => setColorPrice(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="double-sided-discount">Double-sided Discount (%)</Label>
            <div className="relative">
              <Input
                id="double-sided-discount"
                type="number"
                min="0"
                max="50"
                value={doubleSidedDiscount}
                onChange={(e) => setDoubleSidedDiscount(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Discount applied when customer selects double-sided printing
            </p>
          </div>
        </CardContent>
      </Card>

      {/* UPI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Payment Configuration
          </CardTitle>
          <CardDescription>
            Configure UPI payment details for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input
              id="upi-id"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi-name">Display Name</Label>
            <Input
              id="upi-name"
              type="text"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              placeholder="Your Business Name"
            />
            <p className="text-xs text-muted-foreground">
              This name will be shown on the payment QR code
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Print Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure general application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Available Paper Sizes</h4>
            <div className="flex flex-wrap gap-2">
              {['A4', 'A3', 'A5', 'Letter', 'Legal'].map((size) => (
                <span
                  key={size}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Print Types</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-sm">
                Black & White
              </span>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 text-white text-sm">
                Color
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Delivery Areas</h4>
            <p className="text-sm text-muted-foreground">
              All hostels, departments, and custom locations within campus are supported.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
