'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Printer, MapPin, Loader2, Building, Home, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const studentSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  branch: z.string().min(1, 'Branch/Department is required'),
  semester: z.string().min(1, 'Semester is required'),
  classNumber: z.string().min(1, 'Class number is required'),
  block: z.string().min(1, 'Block is required'),
  roomLocation: z.string().min(1, 'Room/Location is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
});

const facultySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  department: z.string().min(1, 'Department is required'),
  officeNumber: z.string().min(1, 'Office number is required'),
  block: z.string().min(1, 'Block is required'),
  roomLocation: z.string().min(1, 'Room/Location is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
});

const othersSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  block: z.string().min(1, 'Block is required'),
  roomLocation: z.string().min(1, 'Delivery location is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
});

type StudentFormData = z.infer<typeof studentSchema>;
type FacultyFormData = z.infer<typeof facultySchema>;
type OthersFormData = z.infer<typeof othersSchema>;

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('STUDENT');

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: '',
      branch: '',
      semester: '',
      classNumber: '',
      block: '',
      roomLocation: '',
      phoneNumber: '',
    },
  });

  const facultyForm = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      fullName: '',
      department: '',
      officeNumber: '',
      block: '',
      roomLocation: '',
      phoneNumber: '',
    },
  });

  const othersForm = useForm<OthersFormData>({
    resolver: zodResolver(othersSchema),
    defaultValues: {
      fullName: '',
      block: '',
      roomLocation: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (session?.user) {
      setUserRole(session.user.role || 'STUDENT');
      const name = session.user.name || '';
      studentForm.setValue('fullName', name);
      facultyForm.setValue('fullName', name);
      othersForm.setValue('fullName', name);
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = async (data: StudentFormData | FacultyFormData | OthersFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: userRole,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to save address');
      }

      toast({
        title: 'Success',
        description: 'Your delivery address has been saved!',
      });

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStudentForm = () => (
    <form onSubmit={studentForm.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            {...studentForm.register('fullName')}
          />
          {studentForm.formState.errors.fullName && (
            <p className="text-sm text-destructive">
              {studentForm.formState.errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            placeholder="+91 9876543210"
            {...studentForm.register('phoneNumber')}
          />
          {studentForm.formState.errors.phoneNumber && (
            <p className="text-sm text-destructive">
              {studentForm.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branch">Branch/Department</Label>
          <Select onValueChange={(value) => studentForm.setValue('branch', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
              <SelectItem value="ECE">Electronics & Communication</SelectItem>
              <SelectItem value="EEE">Electrical & Electronics</SelectItem>
              <SelectItem value="ME">Mechanical Engineering</SelectItem>
              <SelectItem value="CE">Civil Engineering</SelectItem>
              <SelectItem value="IT">Information Technology</SelectItem>
              <SelectItem value="MBA">MBA</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {studentForm.formState.errors.branch && (
            <p className="text-sm text-destructive">
              {studentForm.formState.errors.branch.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Select onValueChange={(value) => studentForm.setValue('semester', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <SelectItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {studentForm.formState.errors.semester && (
            <p className="text-sm text-destructive">
              {studentForm.formState.errors.semester.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="classNumber">Class Number</Label>
          <Input
            id="classNumber"
            placeholder="e.g., CSE-A"
            {...studentForm.register('classNumber')}
          />
          {studentForm.formState.errors.classNumber && (
            <p className="text-sm text-destructive">
              {studentForm.formState.errors.classNumber.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="block">Block in College</Label>
          <Select onValueChange={(value) => studentForm.setValue('block', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Main Block">Main Block</SelectItem>
              <SelectItem value="Block A">Block A</SelectItem>
              <SelectItem value="Block B">Block B</SelectItem>
              <SelectItem value="Block C">Block C</SelectItem>
              <SelectItem value="Library">Library</SelectItem>
              <SelectItem value="Hostel A">Hostel A</SelectItem>
              <SelectItem value="Hostel B">Hostel B</SelectItem>
              <SelectItem value="Hostel C">Hostel C</SelectItem>
            </SelectContent>
          </Select>
          {studentForm.formState.errors.block && (
            <p className="text-sm text-destructive">
              {studentForm.formState.errors.block.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roomLocation">Room/Location Details</Label>
        <Input
          id="roomLocation"
          placeholder="e.g., Room 305, 3rd Floor or Classroom 201"
          {...studentForm.register('roomLocation')}
        />
        {studentForm.formState.errors.roomLocation && (
          <p className="text-sm text-destructive">
            {studentForm.formState.errors.roomLocation.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Address & Continue
      </Button>
    </form>
  );

  const renderFacultyForm = () => (
    <form onSubmit={facultyForm.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Dr. John Doe"
            {...facultyForm.register('fullName')}
          />
          {facultyForm.formState.errors.fullName && (
            <p className="text-sm text-destructive">
              {facultyForm.formState.errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            placeholder="+91 9876543210"
            {...facultyForm.register('phoneNumber')}
          />
          {facultyForm.formState.errors.phoneNumber && (
            <p className="text-sm text-destructive">
              {facultyForm.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select onValueChange={(value) => facultyForm.setValue('department', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
              <SelectItem value="ECE">Electronics & Communication</SelectItem>
              <SelectItem value="EEE">Electrical & Electronics</SelectItem>
              <SelectItem value="ME">Mechanical Engineering</SelectItem>
              <SelectItem value="CE">Civil Engineering</SelectItem>
              <SelectItem value="IT">Information Technology</SelectItem>
              <SelectItem value="MBA">MBA</SelectItem>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Chemistry">Chemistry</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Admin">Administration</SelectItem>
            </SelectContent>
          </Select>
          {facultyForm.formState.errors.department && (
            <p className="text-sm text-destructive">
              {facultyForm.formState.errors.department.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="officeNumber">Office/Cabin Number</Label>
          <Input
            id="officeNumber"
            placeholder="e.g., Office 12"
            {...facultyForm.register('officeNumber')}
          />
          {facultyForm.formState.errors.officeNumber && (
            <p className="text-sm text-destructive">
              {facultyForm.formState.errors.officeNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="block">Block in College</Label>
          <Select onValueChange={(value) => facultyForm.setValue('block', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Main Block">Main Block</SelectItem>
              <SelectItem value="Block A">Block A</SelectItem>
              <SelectItem value="Block B">Block B</SelectItem>
              <SelectItem value="Block C">Block C</SelectItem>
              <SelectItem value="Admin Block">Admin Block</SelectItem>
            </SelectContent>
          </Select>
          {facultyForm.formState.errors.block && (
            <p className="text-sm text-destructive">
              {facultyForm.formState.errors.block.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomLocation">Room Details</Label>
          <Input
            id="roomLocation"
            placeholder="e.g., Staff Room, 2nd Floor"
            {...facultyForm.register('roomLocation')}
          />
          {facultyForm.formState.errors.roomLocation && (
            <p className="text-sm text-destructive">
              {facultyForm.formState.errors.roomLocation.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Address & Continue
      </Button>
    </form>
  );

  const renderOthersForm = () => (
    <form onSubmit={othersForm.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            {...othersForm.register('fullName')}
          />
          {othersForm.formState.errors.fullName && (
            <p className="text-sm text-destructive">
              {othersForm.formState.errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            placeholder="+91 9876543210"
            {...othersForm.register('phoneNumber')}
          />
          {othersForm.formState.errors.phoneNumber && (
            <p className="text-sm text-destructive">
              {othersForm.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="block">Block in College</Label>
        <Select onValueChange={(value) => othersForm.setValue('block', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Main Block">Main Block</SelectItem>
            <SelectItem value="Block A">Block A</SelectItem>
            <SelectItem value="Block B">Block B</SelectItem>
            <SelectItem value="Block C">Block C</SelectItem>
            <SelectItem value="Admin Block">Admin Block</SelectItem>
            <SelectItem value="Library">Library</SelectItem>
            <SelectItem value="Cafeteria">Cafeteria</SelectItem>
            <SelectItem value="Main Gate">Main Gate</SelectItem>
          </SelectContent>
        </Select>
        {othersForm.formState.errors.block && (
          <p className="text-sm text-destructive">
            {othersForm.formState.errors.block.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roomLocation">Delivery Location Details</Label>
        <Input
          id="roomLocation"
          placeholder="Describe where you want the delivery"
          {...othersForm.register('roomLocation')}
        />
        {othersForm.formState.errors.roomLocation && (
          <p className="text-sm text-destructive">
            {othersForm.formState.errors.roomLocation.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Address & Continue
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Printer className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-primary">FlashPrint</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Delivery Address</h1>
          <p className="text-gray-600 mt-2">
            This will be used for delivering your printed documents
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Delivery Address</CardTitle>
            </div>
            <CardDescription>
              {userRole === 'STUDENT' && 'Enter your hostel or classroom details for delivery'}
              {userRole === 'FACULTY' && 'Enter your office or cabin details for delivery'}
              {userRole === 'OTHERS' && 'Enter your preferred delivery location'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userRole === 'STUDENT' && renderStudentForm()}
            {userRole === 'FACULTY' && renderFacultyForm()}
            {userRole === 'OTHERS' && renderOthersForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
