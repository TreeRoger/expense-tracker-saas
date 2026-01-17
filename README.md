# Expense Tracker Platform

A full-stack expense tracking application built with TypeScript, Next.js, tRPC, Prisma, and PostgreSQL.

## Features

- Multi-user authentication with role-based access control (Admin/User)
- Transaction management (income and expenses)
- Monthly budget tracking per category
- Recurring transactions for subscriptions and regular payments
- Custom categories with colors and icons
- Dashboard with spending analytics

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **API:** tRPC v10
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker

### Setup

```bash
# Install dependencies
npm install

# Start the database
docker compose up db -d

# Configure environment
cp .env.example .env

# Run migrations
npm run prisma:migrate

# Seed demo data (optional)
npm run db:seed

# Start dev server
npm run dev
```

Open http://localhost:3000

### Demo Credentials

- **User:** demo@example.com / demo1234
- **Admin:** admin@example.com / admin123

## Docker Deployment

```bash
docker compose up --build
```

## Project Structure

```
src/
├── components/        # React components
├── pages/
│   ├── api/trpc/     # tRPC API routes
│   │   └── routers/  # budget, category, recurrence, transaction, user
│   ├── index.tsx     # Dashboard
│   ├── login.tsx
│   ├── transactions.tsx
│   ├── budgets.tsx
│   ├── recurrences.tsx
│   ├── categories.tsx
│   └── settings.tsx
├── server/
│   └── db.ts         # Prisma client
└── utils/
    └── trpc.ts       # tRPC client
```

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run db:seed          # Seed database
```

## License

MIT
