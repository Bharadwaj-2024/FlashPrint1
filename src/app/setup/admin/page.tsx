'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function AdminSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  
  const [formData, setFormData] = useState({
    email: 'admin@flashprint.com',
    password: 'admin123',
    name: 'Admin',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setCredentials(data.credentials);
      } else {
        setError(data.error || 'Failed to create admin');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success && credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Admin Created!</CardTitle>
            <CardDescription>Your admin account has been set up successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Login Credentials:</h3>
              <p><strong>Email:</strong> {credentials.email}</p>
              <p><strong>Password:</strong> {credentials.password}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href="/auth/signin">Go to Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/admin">Go to Admin Panel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Printer className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-primary">FlashPrint</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Admin Setup</CardTitle>
          </div>
          <CardDescription>Create your admin account to manage FlashPrint</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Admin Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Admin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@flashprint.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Create Admin Account
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
