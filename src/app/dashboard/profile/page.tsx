'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit,
  Building,
  Home,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const ROLE_ICONS = {
  STUDENT: GraduationCap,
  FACULTY: Briefcase,
  OTHERS: Users,
  ADMIN: User,
};

const addressSchema = z.object({
  type: z.enum(['Hostel', 'Department', 'Custom']),
  hostelName: z.string().optional(),
  roomNumber: z.string().optional(),
  departmentName: z.string().optional(),
  cabinNumber: z.string().optional(),
  buildingName: z.string().optional(),
  floorNumber: z.string().optional(),
  landmark: z.string().optional(),
  notes: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  address?: {
    id: string;
    type: string;
    hostelName?: string;
    roomNumber?: string;
    departmentName?: string;
    cabinNumber?: string;
    buildingName?: string;
    floorNumber?: string;
    landmark?: string;
    notes?: string;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressType, setAddressType] = useState<'Hostel' | 'Department' | 'Custom'>('Hostel');
  const [addressData, setAddressData] = useState<any>({});

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
      });
      if (profile.address) {
        setAddressType(profile.address.type as any);
        setAddressData(profile.address);
      }
    }
  }, [profile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: 'Profile Updated', description: 'Your profile has been updated successfully.' });
      setIsEditingProfile(false);
    },
    onError: () => {
      toast({ title: 'Update Failed', description: 'Failed to update profile.', variant: 'destructive' });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/profile/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addressType, ...data }),
      });
      if (!response.ok) throw new Error('Failed to update address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: 'Address Updated', description: 'Your delivery address has been updated.' });
      setIsEditingAddress(false);
    },
    onError: () => {
      toast({ title: 'Update Failed', description: 'Failed to update address.', variant: 'destructive' });
    },
  });

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitAddress = () => {
    updateAddressMutation.mutate(addressData);
  };

  const RoleIcon = ROLE_ICONS[profile?.role as keyof typeof ROLE_ICONS] || User;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Manage your account details</CardDescription>
          </div>
          {!isEditingProfile && (
            <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{profile?.name || 'No Name'}</h3>
                  <Badge className="gap-1">
                    <RoleIcon className="h-3 w-3" />
                    {profile?.role}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
            <CardDescription>Your default delivery location</CardDescription>
          </div>
          {!isEditingAddress && (
            <Button variant="outline" onClick={() => setIsEditingAddress(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {profile?.address ? 'Edit' : 'Add'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingAddress ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Address Type</Label>
                <RadioGroup
                  value={addressType}
                  onValueChange={(value) => {
                    setAddressType(value as any);
                    setAddressData({});
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Hostel" id="hostel" />
                    <Label htmlFor="hostel" className="flex items-center gap-1 cursor-pointer">
                      <Home className="h-4 w-4" /> Hostel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Department" id="department" />
                    <Label htmlFor="department" className="flex items-center gap-1 cursor-pointer">
                      <Building className="h-4 w-4" /> Department
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Custom" id="custom" />
                    <Label htmlFor="custom" className="flex items-center gap-1 cursor-pointer">
                      <MapPin className="h-4 w-4" /> Custom
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {addressType === 'Hostel' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hostel Name</Label>
                    <Input
                      value={addressData.hostelName || ''}
                      onChange={(e) => setAddressData({ ...addressData, hostelName: e.target.value })}
                      placeholder="e.g., Boys Hostel A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input
                      value={addressData.roomNumber || ''}
                      onChange={(e) => setAddressData({ ...addressData, roomNumber: e.target.value })}
                      placeholder="e.g., 301"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Landmark (Optional)</Label>
                    <Input
                      value={addressData.landmark || ''}
                      onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
                      placeholder="e.g., Near canteen"
                    />
                  </div>
                </div>
              )}

              {addressType === 'Department' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department Name</Label>
                    <Input
                      value={addressData.departmentName || ''}
                      onChange={(e) => setAddressData({ ...addressData, departmentName: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cabin/Office Number</Label>
                    <Input
                      value={addressData.cabinNumber || ''}
                      onChange={(e) => setAddressData({ ...addressData, cabinNumber: e.target.value })}
                      placeholder="e.g., 204"
                    />
                  </div>
                </div>
              )}

              {addressType === 'Custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Building Name</Label>
                    <Input
                      value={addressData.buildingName || ''}
                      onChange={(e) => setAddressData({ ...addressData, buildingName: e.target.value })}
                      placeholder="e.g., Library Block"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Floor Number</Label>
                    <Input
                      value={addressData.floorNumber || ''}
                      onChange={(e) => setAddressData({ ...addressData, floorNumber: e.target.value })}
                      placeholder="e.g., 2nd Floor"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Landmark</Label>
                    <Input
                      value={addressData.landmark || ''}
                      onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
                      placeholder="e.g., Near main entrance"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={onSubmitAddress} disabled={updateAddressMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditingAddress(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : profile?.address ? (
            <div className="space-y-2">
              <Badge variant="outline">{profile.address.type}</Badge>
              <div className="text-sm">
                {profile.address.type === 'Hostel' && (
                  <>
                    <p className="font-medium">
                      {profile.address.hostelName}, Room {profile.address.roomNumber}
                    </p>
                    {profile.address.landmark && (
                      <p className="text-muted-foreground">Near: {profile.address.landmark}</p>
                    )}
                  </>
                )}
                {profile.address.type === 'Department' && (
                  <>
                    <p className="font-medium">{profile.address.departmentName}</p>
                    {profile.address.cabinNumber && (
                      <p className="text-muted-foreground">Cabin: {profile.address.cabinNumber}</p>
                    )}
                  </>
                )}
                {profile.address.type === 'Custom' && (
                  <>
                    <p className="font-medium">
                      {profile.address.buildingName}
                      {profile.address.floorNumber && `, ${profile.address.floorNumber}`}
                    </p>
                    {profile.address.landmark && (
                      <p className="text-muted-foreground">Near: {profile.address.landmark}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No delivery address set. Click "Add" to add one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
