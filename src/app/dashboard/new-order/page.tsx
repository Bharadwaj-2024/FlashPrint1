'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  FileText,
  X,
  Loader2,
  Printer,
  Copy,
  Palette,
  FileStack,
  AlertCircle,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { formatFileSize, formatCurrency, calculatePrintCost } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  copies: number;
  printType: 'BW' | 'COLOR';
  paperSize: 'A4' | 'A3';
  printSide: 'SINGLE' | 'DOUBLE';
  pageRange: string;
  uploading: boolean;
  error?: string;
}

const printOptionsSchema = z.object({
  copies: z.number().min(1).max(100),
  printType: z.enum(['BW', 'COLOR']),
  paperSize: z.enum(['A4', 'A3']),
  printSide: z.enum(['SINGLE', 'DOUBLE']),
  pageRange: z.string().optional(),
});

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a PDF file.`,
        });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds the 50MB limit.`,
        });
        continue;
      }

      // Get page count
      const pageCount = await getPageCount(file);

      newFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        pageCount,
        copies: 1,
        printType: 'BW',
        paperSize: 'A4',
        printSide: 'SINGLE',
        pageRange: '',
        uploading: false,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024,
  });

  const getPageCount = async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await import('pdf-lib').then((m) => m.PDFDocument.load(arrayBuffer));
      return pdf.getPageCount();
    } catch (error) {
      console.error('Error getting page count:', error);
      return 1;
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileOption = (id: string, updates: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const calculateTotal = () => {
    return files.reduce((total, file) => {
      const pages = file.pageRange
        ? parsePageRange(file.pageRange, file.pageCount).length
        : file.pageCount;
      return total + calculatePrintCost(pages, file.copies, file.printType, file.printSide);
    }, 0);
  };

  const parsePageRange = (range: string, total: number): number[] => {
    if (!range.trim()) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    range.split(',').forEach((part) => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= Math.min(end, total); i++) pages.push(i);
      } else {
        const page = parseInt(part);
        if (page <= total) pages.push(page);
      }
    });
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No files selected',
        description: 'Please upload at least one PDF file.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file-${index}`, file.file);
        formData.append(
          `options-${index}`,
          JSON.stringify({
            copies: file.copies,
            printType: file.printType,
            paperSize: file.paperSize,
            printSide: file.printSide,
            pageRange: file.pageRange,
            pageCount: file.pageCount,
          })
        );
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();

      toast({
        title: 'Order created!',
        description: 'Redirecting to payment...',
      });

      router.push(`/dashboard/orders/${order.id}/payment`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[
          { num: 1, label: 'Upload Files' },
          { num: 2, label: 'Print Options' },
          { num: 3, label: 'Review & Pay' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= s.num ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s.num ? <Check className="h-5 w-5" /> : s.num}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                step >= s.num ? 'text-primary' : 'text-gray-500'
              }`}
            >
              {s.label}
            </span>
            {i < 2 && <ChevronRight className="mx-4 h-5 w-5 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload Files */}
      {step === 1 && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload PDF Files
              </CardTitle>
              <CardDescription>
                Drag and drop your PDF files or click to browse. Max 50MB per file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload
                  className={`h-12 w-12 mx-auto mb-4 ${
                    isDragActive ? 'text-primary' : 'text-gray-400'
                  }`}
                />
                {isDragActive ? (
                  <p className="text-lg text-primary">Drop the files here...</p>
                ) : (
                  <>
                    <p className="text-lg text-gray-600">
                      Drag & drop PDF files here, or click to select
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports multiple files up to 50MB each
                    </p>
                  </>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                  <div
                    className="mt-6 space-y-3"
                  >
                    <h4 className="font-medium text-gray-700">Uploaded Files ({files.length})</h4>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded">
                            <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                              {file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {file.pageCount} page
                              {file.pageCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

              {files.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep(2)}>
                    Next: Print Options
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Print Options */}
      {step === 2 && (
        <div
          className="space-y-4"
        >
          {files.map((file, index) => (
            <Card key={file.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-red-600" />
                  {file.name}
                </CardTitle>
                <CardDescription>
                  {file.pageCount} pages • {formatFileSize(file.size)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Print Type */}
                <div className="space-y-3">
                  <Label>Print Type</Label>
                  <RadioGroup
                    value={file.printType}
                    onValueChange={(value: 'BW' | 'COLOR') =>
                      updateFileOption(file.id, { printType: value })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BW" id={`bw-${file.id}`} />
                      <Label htmlFor={`bw-${file.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Printer className="h-4 w-4" />
                        Black & White (₹3/page)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="COLOR" id={`color-${file.id}`} />
                      <Label htmlFor={`color-${file.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Palette className="h-4 w-4" />
                        Color (₹12/page)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Copies & Paper Size */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`copies-${file.id}`}>Number of Copies</Label>
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-gray-500" />
                      <Input
                        id={`copies-${file.id}`}
                        type="number"
                        min="1"
                        max="100"
                        value={file.copies}
                        onChange={(e) =>
                          updateFileOption(file.id, { copies: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Paper Size</Label>
                    <Select
                      value={file.paperSize}
                      onValueChange={(value: 'A4' | 'A3') =>
                        updateFileOption(file.id, { paperSize: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (Standard)</SelectItem>
                        <SelectItem value="A3">A3 (Large)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Print Side</Label>
                    <Select
                      value={file.printSide}
                      onValueChange={(value: 'SINGLE' | 'DOUBLE') =>
                        updateFileOption(file.id, { printSide: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single Sided</SelectItem>
                        <SelectItem value="DOUBLE">Double Sided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Page Range */}
                <div className="space-y-2">
                  <Label htmlFor={`range-${file.id}`}>Page Range (Optional)</Label>
                  <Input
                    id={`range-${file.id}`}
                    placeholder="e.g., 1-5, 8, 10-12 (leave empty for all pages)"
                    value={file.pageRange}
                    onChange={(e) => updateFileOption(file.id, { pageRange: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to print all {file.pageCount} pages
                  </p>
                </div>

                {/* Cost for this file */}
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Cost for this file</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(
                        calculatePrintCost(
                          file.pageRange
                            ? parsePageRange(file.pageRange, file.pageCount).length
                            : file.pageCount,
                          file.copies,
                          file.printType,
                          file.printSide
                        )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to Upload
            </Button>
            <Button onClick={() => setStep(3)}>
              Review Order
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Pay */}
      {step === 3 && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileStack className="h-5 w-5" />
                Order Summary
              </CardTitle>
              <CardDescription>Review your order before proceeding to payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => {
                  const pages = file.pageRange
                    ? parsePageRange(file.pageRange, file.pageCount).length
                    : file.pageCount;
                  const cost = calculatePrintCost(pages, file.copies, file.printType, file.printSide);

                  return (
                    <div
                      key={file.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <div className="text-sm text-gray-500 space-y-1 mt-1">
                            <p>{pages} pages × {file.copies} copies</p>
                            <p>
                              {file.printType === 'BW' ? 'B&W' : 'Color'} •{' '}
                              {file.paperSize} •{' '}
                              {file.printSide === 'SINGLE' ? 'Single-sided' : 'Double-sided'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(cost)}</p>
                    </div>
                  );
                })}

                <Separator />

                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Payment via UPI</p>
                    <p>You'll be redirected to complete payment using any UPI app (GPay, PhonePe, Paytm, etc.)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back to Options
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
