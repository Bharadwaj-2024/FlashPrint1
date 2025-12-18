'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { ShieldCheck, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function UpgradeMePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/setup/upgrade-me', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to upgrade');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Upgraded to ADMIN!</CardTitle>
            <CardDescription>Your account now has admin privileges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-yellow-800 font-medium">⚠️ Important: You must sign out and sign back in for the changes to take effect!</p>
            </div>
            <Button onClick={handleSignOut} className="w-full" variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out Now
            </Button>
            <p className="text-center text-sm text-gray-500">
              After signing back in, go to{' '}
              <Link href="/admin" className="text-primary hover:underline font-medium">
                /admin
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Upgrade to Admin</CardTitle>
          <CardDescription>Make your current account an administrator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
            <p>This will upgrade your currently logged-in account to have ADMIN role.</p>
            <p className="mt-2">After upgrading, you'll need to sign out and sign back in.</p>
          </div>

          <Button onClick={handleUpgrade} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upgrading...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Upgrade My Account to ADMIN
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500">
            <Link href="/dashboard" className="text-primary hover:underline">
              Back to Dashboard
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
