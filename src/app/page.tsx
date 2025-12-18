import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Printer,
  Upload,
  CreditCard,
  Truck,
  CheckCircle,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load Star icon since it's used multiple times in testimonials
const Star = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Star })), {
  ssr: true,
  loading: () => <span className="h-4 w-4" />,
});

// Static data - no client-side JS needed
const stats = [
  { value: '10K+', label: 'Documents Printed' },
  { value: '2K+', label: 'Happy Users' },
  { value: '30min', label: 'Avg Delivery' },
  { value: '4.9★', label: 'User Rating' },
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Upload and print in minutes. Same-day delivery for most orders.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your documents are encrypted and deleted after printing.',
  },
  {
    icon: CreditCard,
    title: 'Easy Payments',
    description: 'Pay via UPI, GPay, PhonePe. Instant confirmation.',
  },
  {
    icon: Truck,
    title: 'Door Delivery',
    description: 'Delivered to your classroom, hostel, or office.',
  },
];

const steps = [
  { step: '01', icon: Upload, title: 'Upload PDFs', description: 'Drag and drop your PDF files.' },
  { step: '02', icon: Printer, title: 'Choose Options', description: 'Select B&W or color, copies.' },
  { step: '03', icon: CreditCard, title: 'Pay via UPI', description: 'Quick and secure payment.' },
  { step: '04', icon: Truck, title: 'Get Delivery', description: 'Track and receive your prints.' },
];

const testimonials = [
  {
    name: 'Priya S.',
    role: 'B.Tech Student',
    content: 'FlashPrint saved me during exams! Got notes delivered in 30 minutes.',
  },
  {
    name: 'Dr. Rajesh K.',
    role: 'Professor',
    content: 'Excellent service for course materials. High quality and on time.',
  },
  {
    name: 'Amit P.',
    role: 'MBA Student',
    content: 'No more xerox queues. Upload and pay from my phone.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation - optimized with will-change */}
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b will-change-transform">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" prefetch={false}>
            <Printer className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-primary">FlashPrint</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-primary text-sm">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-primary text-sm">Pricing</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-primary text-sm">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" prefetch={true}>
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup" prefetch={true}>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Critical above-the-fold content */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Fast & Reliable Printing
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Print Documents
            <br />
            <span className="text-primary">Delivered to You</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">
            Upload PDFs, choose options, get delivered to your classroom or hostel. Fast & affordable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-6">
                Start Printing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-6">How It Works</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Why FlashPrint?</h2>
          <p className="text-gray-600 text-center mb-10 max-w-lg mx-auto">
            Designed for students and faculty
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Lazy rendered */}
      <section id="pricing" className="py-16 px-4 bg-gray-50 content-auto">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Simple Pricing</h2>
          <p className="text-gray-600 text-center mb-10">No hidden fees</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* B&W Card */}
            <Card className="border-2">
              <CardHeader className="text-center pb-4">
                <Printer className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                <CardTitle>Black & White</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">₹3</span>
                  <span className="text-gray-600">/page</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {['A4 Paper', 'Single/Double-sided', 'Multiple Copies', 'Fast Processing'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Color Card */}
            <Card className="border-2 border-primary relative">
              <div className="absolute top-3 right-3 bg-primary text-white px-2 py-0.5 rounded text-xs">Popular</div>
              <CardHeader className="text-center pb-4">
                <Printer className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle>Color Print</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-primary">₹12</span>
                  <span className="text-gray-600">/page</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {['Vibrant Colors', 'A4 & A3 Sizes', 'High Quality', 'Perfect for Presentations'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">How It Works</h2>
          <p className="text-gray-600 text-center mb-10">4 simple steps</p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">What Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-sm font-semibold">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Start?</h2>
          <p className="text-blue-100 mb-6">Join thousands of happy users</p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary">
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Printer className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-white">FlashPrint</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
            <p className="text-sm">© 2025 FlashPrint</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
