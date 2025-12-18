'use client';

import { ReactNode, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Printer,
  LayoutDashboard,
  FileText,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Lazy load dialog and dropdown for better initial load
const DropdownMenu = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenu), { ssr: false });
const DropdownMenuContent = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuContent), { ssr: false });
const DropdownMenuItem = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuItem), { ssr: false });
const DropdownMenuLabel = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuLabel), { ssr: false });
const DropdownMenuSeparator = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuSeparator), { ssr: false });
const DropdownMenuTrigger = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuTrigger), { ssr: false });

const Dialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });

const Input = dynamic(() => import('@/components/ui/input').then(mod => mod.Input), { ssr: false });
const Label = dynamic(() => import('@/components/ui/label').then(mod => mod.Label), { ssr: false });

// Lazy load icons that are not immediately visible
const Bell = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Bell })), { ssr: false });
const Settings = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false });
const Lock = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Lock })), { ssr: false });

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/new-order', label: 'New Order', icon: PlusCircle },
  { href: '/dashboard/orders', label: 'My Orders', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

// Admin password - change this to your secret password
const ADMIN_PASSWORD = 'flash@admin2025';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle admin panel access with password
  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPasswordDialog(true);
    setAdminPassword('');
    setPasswordError('');
  };

  const handlePasswordSubmit = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setShowPasswordDialog(false);
      setSidebarOpen(false);
      router.push('/admin');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  // Secret admin access - click logo 5 times
  const handleLogoClick = useCallback(() => {
    if (session?.user?.role !== 'ADMIN') return;
    
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount >= 5) {
      setShowPasswordDialog(true);
      setAdminPassword('');
      setPasswordError('');
      setLogoClickCount(0);
    }
    
    // Reset after 2 seconds of no clicks
    setTimeout(() => setLogoClickCount(0), 2000);
  }, [logoClickCount, session?.user?.role]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleLogoClick}
          >
            <Printer className={cn(
              "h-8 w-8 text-primary transition-transform",
              logoClickCount > 0 && "scale-110"
            )} />
            <span className="text-xl font-bold text-primary">FlashPrint</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                pathname === item.href
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Secret Admin Button - only visible to admins */}
        {session?.user?.role === 'ADMIN' && (
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors w-full"
            >
              <Lock className="h-5 w-5" />
              <span className="font-medium text-sm">Admin Panel</span>
            </button>
          </div>
        )}
      </aside>

      {/* Admin Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Access
            </DialogTitle>
            <DialogDescription>
              Enter the admin password to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePasswordSubmit();
                }}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Access Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-800">
                {navItems.find((item) => item.href === pathname)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders">
                      <FileText className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
