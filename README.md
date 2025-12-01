# 💰 Expense Tracker Platform

A full-stack multi-user expense tracking application built with TypeScript, Next.js, tRPC, Prisma, and PostgreSQL.

## ✨ Features

- **Multi-user Support** - Secure user registration and authentication
- **Role-Based Access Control** - Admin and User roles with protected routes
- **Transaction Management** - Full CRUD operations for income and expenses
- **Budget Tracking** - Set monthly budgets per category with progress tracking
- **Recurring Transactions** - Automate regular income/expenses (subscriptions, salary, etc.)
- **Category Management** - Custom categories with colors and icons
- **Dashboard Analytics** - Visual overview of spending patterns
- **ACID-Safe Transactions** - All financial operations wrapped in database transactions

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **API**: tRPC v10 (type-safe RPC)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Custom CSS with CSS Variables
- **Deployment**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for database)

### Development Setup

1. **Clone and install dependencies**
   ```bash
   cd expense-tracker-saas
   npm install
   ```

2. **Start the database**
   ```bash
   docker compose up db -d
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

4. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding:
- **Demo User**: demo@example.com / demo1234
- **Admin User**: admin@example.com / admin123

## 🐳 Docker Deployment

Run the entire stack with Docker:

```bash
docker compose up --build
```

This will:
- Build the Next.js application
- Start PostgreSQL database
- Run database migrations
- Expose the app on port 3000

## 📁 Project Structure

```
expense-tracker-saas/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── components/        # React components
│   │   └── Layout.tsx     # App layout with sidebar
│   ├── pages/
│   │   ├── api/trpc/      # tRPC API routes
│   │   │   ├── routers/   # API routers
│   │   │   │   ├── budget.ts
│   │   │   │   ├── category.ts
│   │   │   │   ├── recurrence.ts
│   │   │   │   ├── transaction.ts
│   │   │   │   └── user.ts
│   │   │   ├── context.ts
│   │   │   ├── router.ts
│   │   │   └── trpc.ts
│   │   ├── index.tsx      # Dashboard
│   │   ├── login.tsx      # Auth page
│   │   ├── transactions.tsx
│   │   ├── budgets.tsx
│   │   ├── recurrences.tsx
│   │   ├── categories.tsx
│   │   └── settings.tsx
│   ├── server/
│   │   └── db.ts          # Prisma client
│   ├── styles/
│   │   └── globals.css    # Global styles
│   └── utils/
│       └── trpc.ts        # tRPC client
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 🔒 API Security

The API implements role-based access control:

- **Public procedures** - Registration, login
- **Protected procedures** - Require authentication (user's own data)
- **Admin procedures** - Require admin role (user management)

All financial operations use Prisma transactions to ensure ACID compliance.

## 📊 Database Schema

### Models

- **User** - Authentication and profile
- **Category** - Transaction categorization
- **Transaction** - Income/expense records
- **Budget** - Monthly spending limits per category
- **Recurrence** - Recurring transaction templates

### Key Features

- Decimal precision for monetary values
- Cascading deletes for data integrity
- Composite unique constraints
- Efficient indexing for queries

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run start        # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:push      # Push schema changes
npm run prisma:studio    # Open Prisma Studio
npm run db:seed          # Seed database
```

## 🎨 UI Features

- Dark theme with cyan/purple accent gradient
- Responsive sidebar navigation
- Modal forms for CRUD operations
- Progress bars for budget tracking
- Loading skeletons for better UX
- Toast-style notifications

## 📝 Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/expense_tracker"
NODE_ENV="development"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.
