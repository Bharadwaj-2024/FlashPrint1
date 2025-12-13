# FlashPrint - College Printing Service

A modern, scalable web application for college printing/xerox services built with Next.js 14.

![FlashPrint](https://via.placeholder.com/800x400?text=FlashPrint+Banner)

## 🎯 Features

### For Students/Faculty
- **Easy PDF Upload** - Drag & drop or click to upload multiple PDFs
- **Print Options** - Choose B&W/Color, paper size, single/double-sided, copies
- **Real-time Pricing** - See costs instantly as you configure
- **UPI Payment** - Pay via any UPI app with QR code
- **Order Tracking** - Track your order from placement to delivery
- **Delivery to Location** - Hostel room, department cabin, or custom location

### For Administrators
- **Dashboard Overview** - Key metrics at a glance
- **Order Management** - View, filter, and manage all orders
- **Status Updates** - Update order status with one click
- **Delivery Management** - Track ready and out-for-delivery orders
- **Analytics** - Revenue tracking and order statistics
- **User Management** - View all registered users

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js (Google OAuth + Credentials)
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **PDF Processing:** pdf-lib
- **QR Code:** qrcode
- **Animations:** Framer Motion

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (optional, for Google sign-in)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flashprint.git
   cd flashprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/flashprint"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with test data (optional)
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Test Accounts

After running the seed script:

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@flashprint.com    | admin123    |
| Student  | student@college.edu     | student123  |
| Faculty  | faculty@college.edu     | faculty123  |

## 📁 Project Structure

```
flashprint/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── public/                # Static assets
├── src/
│   ├── app/
│   │   ├── admin/         # Admin pages
│   │   ├── api/           # API routes
│   │   ├── auth/          # Auth pages
│   │   ├── dashboard/     # User dashboard
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   └── ui/            # UI components
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilities
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 💰 Pricing Configuration

Default pricing:
- **Black & White:** ₹3 per page
- **Color:** ₹12 per page
- **Double-sided:** No additional discount (configurable)

## 🔄 Order Flow

1. **Upload PDFs** - User uploads one or more PDF files
2. **Configure Options** - Select print type, paper size, sides, copies
3. **Review & Confirm** - Review order and total cost
4. **Payment** - Pay via UPI QR code
5. **Processing** - Admin confirms payment, starts printing
6. **Delivery** - Order delivered to specified location

## 📊 Admin Dashboard

Access the admin dashboard at `/admin` (requires admin role).

Features:
- Real-time order statistics
- Revenue tracking
- Order management with filters
- Bulk status updates
- Delivery management
- User overview

## 🛡️ Security

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- Role-based access control
- CSRF protection via NextAuth

## 📝 Environment Variables

| Variable               | Description                    | Required |
|------------------------|--------------------------------|----------|
| DATABASE_URL           | PostgreSQL connection string   | Yes      |
| NEXTAUTH_URL           | Application URL               | Yes      |
| NEXTAUTH_SECRET        | JWT secret key                | Yes      |
| GOOGLE_CLIENT_ID       | Google OAuth client ID        | No       |
| GOOGLE_CLIENT_SECRET   | Google OAuth client secret    | No       |
| UPI_ID                 | UPI ID for payments           | No       |
| UPI_NAME               | Name shown on UPI payment     | No       |

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
# Build
docker build -t flashprint .

# Run
docker run -p 3000:3000 flashprint
```

## 📈 Future Enhancements

- [ ] Email notifications
- [ ] SMS updates
- [ ] Bulk order discounts
- [ ] Scheduled printing
- [ ] Print history analytics
- [ ] Mobile app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

Built with ❤️ for college printing services.
