# Expense Tracker

A full-stack personal finance tracking app built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **SQLite**. Track expenses, manage credit cards, set savings goals, monitor accounts, and get rule-based financial recommendations — all from a clean dashboard.

---

## Features

- **Authentication** — Register/login with JWT-based sessions (httpOnly cookies)
- **Expense Tracking** — Add, edit, and delete categorized expenses with optional payment source tracking
  - Tag each expense as paid from a **bank account** (auto-decrements balance) or charged to a **credit card** (auto-increments card balance)
  - **Credit Card Payment** category — log a payment to a credit card to reduce its balance, and optionally specify which bank account the funds came from (both balances update automatically)
  - Filter expenses by month, year, and category with live totals
- **Recurring Payments** — Track subscriptions and monthly bills
- **Savings Goals** — Set and monitor savings targets with progress tracking
- **Credit Cards** — Manage credit card balances, limits, APR, and due dates
  - Balances automatically reflect charges and payments logged through the Expenses page
  - Visualize utilization per card and overall, with Avalanche and Snowball payoff strategies
- **Accounts** — Track checking, savings, and other bank accounts; balances stay in sync with linked expenses
- **AI Recommendations** — Rule-based financial insights based on your data
- **Charts & Analytics** — Visual spending breakdowns via Recharts
- **Responsive UI** — Mobile-friendly with a collapsible sidebar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (via Prisma ORM) |
| Auth | JWT (`jose`) + `bcryptjs` |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and update the values:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

> **Important:** Use a long, random string for `JWT_SECRET`. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Set up the database

Push the Prisma schema to create your SQLite database:

```bash
npm run db:push
```

This creates `prisma/dev.db` locally (it is gitignored and never committed).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Project Structure

```
Expense-Tracker/
├── app/
│   ├── api/              # API route handlers
│   │   ├── accounts/
│   │   ├── ai/recommendations/
│   │   ├── auth/         # login, logout, register, me
│   │   ├── credit-cards/
│   │   ├── expenses/     # CRUD + balance sync for accounts & credit cards
│   │   ├── recurring/
│   │   └── savings/
│   ├── dashboard/        # Protected dashboard pages
│   │   ├── accounts/
│   │   ├── credit-cards/
│   │   ├── expenses/
│   │   ├── recommendations/
│   │   ├── recurring/
│   │   └── savings/
│   ├── login/
│   ├── register/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/        # Chart components
│   └── layout/           # Sidebar, MobileNav
├── lib/
│   ├── auth.ts           # JWT helpers
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Categories, colors, formatters
├── prisma/
│   └── schema.prisma     # Database schema
├── middleware.ts          # Auth middleware (route protection)
├── .env.example          # Environment variable template
└── package.json
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Path to the SQLite database file | Yes |
| `JWT_SECRET` | Secret key used to sign JWT tokens | Yes |

---

## How Credit Card Payments Work

Credit card payments are tracked as expenses, keeping your card balances and account balances in sync automatically.

1. Go to **Expenses** → **Add Expense**
2. Set the **Category** to `Credit Card Payment`
3. Under **Which Card**, select the credit card you are paying down — its balance will decrease by the expense amount
4. Under **Paid From Account** (optional), select the bank account the money came from — its balance will decrease by the same amount
5. Save — both balances update instantly

Editing or deleting a "Credit Card Payment" expense fully reverses the original balance changes before applying the new ones, so your data always stays consistent.

> **Charging a purchase to a credit card** works differently: select any non-payment category, then choose the card under **Paid With**. This *increases* the card balance (you owe more), which is the expected behavior for a new charge.

---

## Deployment

### Build for production

```bash
npm run build
npm run start
```

### Notes

- The SQLite database file (`prisma/dev.db`) is created locally and is gitignored. On a new deployment, run `npm run db:push` to initialize the database.
- For production deployments, consider switching to a hosted database (PostgreSQL, MySQL) by updating `prisma/schema.prisma` and `DATABASE_URL`.

---

## License

MIT
