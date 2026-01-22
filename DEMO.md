# Expense Tracker SaaS - Quick Demo Guide

## Quick Start (5 minutes)

This guide helps recruiters and reviewers quickly explore the project.

### Prerequisites
- Node.js 18+ installed
- Docker installed (for database)

### Setup Steps

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL database
docker compose up db -d

# 3. Set up database
npm run prisma:migrate

# 4. Seed demo data (optional but recommended)
npm run db:seed

# 5. Start development server
npm run dev
```

Open http://localhost:3000

### Demo Credentials

**Regular User:**
- Email: `demo@example.com`
- Password: `demo1234`

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

## What to Explore

### 1. **Dashboard** (`/`)
- Financial overview with income/expenses
- Budget progress indicators
- Recent transactions
- Upcoming recurring expenses
- Spending breakdown by category

### 2. **Transactions** (`/transactions`)
- View all transactions with filtering
- Create new income/expense entries
- Edit or delete transactions
- Search and date range filtering

### 3. **Budgets** (`/budgets`)
- Set monthly budgets per category
- View budget vs actual spending
- Copy budgets from previous month
- Visual progress indicators

### 4. **Recurring Transactions** (`/recurrences`)
- Create recurring patterns (subscriptions, bills)
- Set frequency (daily, weekly, monthly, etc.)
- Process due recurrences (creates transactions)
- View upcoming due dates

### 5. **Categories** (`/categories`)
- Create custom categories
- Set colors and icons
- Organize transactions

### 6. **Settings** (`/settings`)
- Update profile
- View account stats
- Admin panel (if logged in as admin)

## Architecture Highlights

### Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript
- **API:** tRPC v10 (end-to-end type safety)
- **Database:** PostgreSQL with Prisma ORM
- **State Management:** React Query (via tRPC)

### Key Features
- Full-stack TypeScript with type safety
- ACID transactions for data consistency
- Automatic budget tracking
- Role-based access control (Admin/User)
- Recurring transaction automation
- Real-time data with React Query

### Code Quality
- Comprehensive comments explaining architecture
- Type-safe API with tRPC
- Database migrations with Prisma
- Error handling and validation
- Security considerations documented

## Project Structure

```
src/
├── pages/
│   ├── api/trpc/          # tRPC API routes
│   │   ├── routers/       # Feature routers (user, transaction, budget, etc.)
│   │   ├── context.ts     # Request context & auth
│   │   └── trpc.ts        # tRPC setup & middleware
│   ├── index.tsx          # Dashboard
│   ├── transactions.tsx   # Transaction management
│   └── ...
├── components/            # Reusable React components
├── server/                # Database client
└── utils/                 # Utilities (tRPC client)
```

## Code Review Tips

### What to Look For

1. **Type Safety**
   - Check `src/pages/api/trpc/routers/` - all endpoints are fully typed
   - Frontend gets autocomplete for all API calls

2. **Data Consistency**
   - See `transaction.ts` router - uses ACID transactions
   - Budget updates are atomic with transaction creation

3. **Security**
   - Authentication middleware in `trpc.ts`
   - User data isolation (users can only see their own data)
   - Admin-only endpoints clearly marked

4. **Database Design**
   - Check `prisma/schema.prisma` - well-structured relationships
   - Cascade deletes for data integrity
   - Indexes for performance

5. **Error Handling**
   - All routers use tRPC error codes
   - User-friendly error messages
   - Proper validation with Zod

## Troubleshooting

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart db
```

**Migration issues:**
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:migrate reset

# Then re-seed
npm run db:seed
```

**Port already in use:**
```bash
# Change port in package.json or kill process on port 3000
lsof -ti:3000 | xargs kill
```

## Notes for Reviewers

- This is a portfolio project demonstrating full-stack development skills
- Authentication is simplified for demo purposes (header-based)
- Password hashing uses base64 (would use bcrypt in production)
- All production considerations are documented in code comments
- The codebase is well-commented to explain architecture decisions

## Learning Points

This project demonstrates:
- Modern full-stack TypeScript development
- Type-safe APIs with tRPC
- Database design and migrations
- ACID transactions for data consistency
- React Query for efficient data fetching
- Role-based access control
- Recurring job patterns
- Clean code architecture

---

**Questions?** Check the main README.md for more details or review the code comments throughout the codebase.

