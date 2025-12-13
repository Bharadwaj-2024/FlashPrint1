'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Printer,
  Upload,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Printer className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">FlashPrint</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-primary transition">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary transition">
              Pricing
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition">
              How It Works
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-blue-100 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Fast & Reliable Printing Service
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Print Documents
              <br />
              <span className="text-primary">Delivered to You</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Upload your PDFs, choose your print options, and get them delivered right to your
              classroom, office, or hostel. Fast, affordable, and hassle-free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Printing Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  See How It Works
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              { value: '10K+', label: 'Documents Printed' },
              { value: '2K+', label: 'Happy Users' },
              { value: '30min', label: 'Avg Delivery' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose FlashPrint?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've designed every aspect of our service with students and faculty in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Upload and print in minutes. Same-day delivery for most orders.',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description:
                  'Your documents are encrypted and deleted after printing. We value your privacy.',
              },
              {
                icon: CreditCard,
                title: 'Easy Payments',
                description:
                  'Pay via UPI, GPay, PhonePe, or any UPI app. Instant payment confirmation.',
              },
              {
                icon: Truck,
                title: 'Door Delivery',
                description:
                  'Get prints delivered to your classroom, hostel room, or office.',
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">No hidden fees. Pay only for what you print.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 hover:shadow-lg transition">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Printer className="h-8 w-8 text-gray-600" />
                </div>
                <CardTitle className="text-2xl">Black & White</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">₹3</span>
                  <span className="text-gray-600">/page</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'A4 Paper Size',
                    'Single or Double-sided',
                    'Multiple Copies',
                    'Page Range Selection',
                    'Fast Processing',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary hover:shadow-lg transition relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Printer className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Color Print</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">₹12</span>
                  <span className="text-gray-600">/page</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'Vibrant Color Output',
                    'A4 & A3 Paper Sizes',
                    'Single or Double-sided',
                    'High Quality Prints',
                    'Perfect for Presentations',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
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
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get your prints in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload PDFs',
                description: 'Drag and drop your PDF files. We support batch uploads.',
              },
              {
                step: '02',
                icon: Printer,
                title: 'Choose Options',
                description: 'Select B&W or color, copies, page range, and more.',
              },
              {
                step: '03',
                icon: CreditCard,
                title: 'Pay via UPI',
                description: 'Quick and secure payment with any UPI app.',
              },
              {
                step: '04',
                icon: Truck,
                title: 'Get Delivery',
                description: 'Track your order and receive at your location.',
              },
            ].map((item, index) => (
              <div key={item.step} className="text-center relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200" />
                )}
                <div className="relative z-10 w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <item.icon className="h-10 w-10 text-primary" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Trusted by thousands of students and faculty</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'B.Tech Student',
                content:
                  'FlashPrint saved me during exam season! Got all my notes printed and delivered to my hostel room in just 30 minutes.',
                rating: 5,
              },
              {
                name: 'Dr. Rajesh Kumar',
                role: 'Professor, CSE Dept',
                content:
                  'Excellent service for printing course materials. The color prints are high quality and delivery is always on time.',
                rating: 5,
              },
              {
                name: 'Amit Patel',
                role: 'MBA Student',
                content:
                  'Super convenient! No more standing in long queues at the xerox shop. Just upload and pay from my phone.',
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Printing?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and faculty who trust FlashPrint for their printing needs.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Printer className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-white">FlashPrint</span>
              </Link>
              <p className="text-sm">
                Fast, reliable, and affordable printing service for your college campus.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-white transition">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="hover:text-white transition">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-white transition">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} FlashPrint. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
