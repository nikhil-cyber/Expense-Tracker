import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    currentExpenses, lastExpenses, recurringPayments, savingsGoals,
    creditCards, accounts, recentExpenses
  ] = await Promise.all([
    prisma.expense.findMany({ where: { userId: session.userId, date: { gte: startOfMonth } } }),
    prisma.expense.findMany({ where: { userId: session.userId, date: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.recurringPayment.findMany({ where: { userId: session.userId, isActive: true } }),
    prisma.savingsGoal.findMany({ where: { userId: session.userId } }),
    prisma.creditCard.findMany({ where: { userId: session.userId } }),
    prisma.account.findMany({ where: { userId: session.userId } }),
    prisma.expense.findMany({ where: { userId: session.userId }, orderBy: { date: 'desc' }, take: 5 }),
  ]);

  const totalExpenses = currentExpenses.reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = lastExpenses.reduce((s, e) => s + e.amount, 0);
  const expenseDiff = lastMonthTotal > 0 ? ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const totalRecurring = recurringPayments.reduce((s, p) => s + p.amount, 0);
  const totalDebt = creditCards.reduce((s, c) => s + c.balance, 0);
  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const netWorth = totalAssets - totalDebt;

  const categoryBreakdown = currentExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Last 6 months chart data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const mExpenses = await prisma.expense.findMany({
      where: { userId: session.userId, date: { gte: d, lte: mEnd } },
    });
    monthlyData.push({
      month: d.toLocaleString('default', { month: 'short' }),
      amount: mExpenses.reduce((s, e) => s + e.amount, 0),
    });
  }

  const stats = [
    {
      label: 'Monthly Spending',
      value: formatCurrency(totalExpenses),
      sub: expenseDiff !== 0 ? `${expenseDiff > 0 ? '+' : ''}${expenseDiff.toFixed(1)}% vs last month` : 'No data for comparison',
      up: expenseDiff > 0,
      color: 'purple',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Total Assets',
      value: formatCurrency(totalAssets),
      sub: `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
      color: 'green',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Credit Card Debt',
      value: formatCurrency(totalDebt),
      sub: `${creditCards.length} card${creditCards.length !== 1 ? 's' : ''} • ${formatCurrency(totalDebt * 0.02).replace('.00', '')}/mo min`,
      color: 'red',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: 'Net Worth',
      value: formatCurrency(netWorth),
      sub: `$${totalSaved.toFixed(0)} in savings goals`,
      color: netWorth >= 0 ? 'blue' : 'red',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/20 to-violet-500/10 border-purple-500/20',
    green: 'from-emerald-500/20 to-green-500/10 border-emerald-500/20',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
  };
  const iconColorMap: Record<string, string> = {
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/expenses" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className={`glass-card p-5 bg-gradient-to-br ${colorMap[stat.color]} border`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColorMap[stat.color]}`}>
                {stat.icon}
              </div>
            </div>
            <p className="stat-number text-slate-100">{stat.value}</p>
            <p className={`text-xs mt-1.5 ${stat.up ? 'text-red-400' : 'text-slate-500'}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts monthlyData={monthlyData} categoryBreakdown={categoryBreakdown} />
        </div>

        {/* Recent Expenses */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Recent Expenses</h3>
            <Link href="/dashboard/expenses" className="text-xs text-purple-400 hover:text-purple-300">View all</Link>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No expenses yet</p>
              <Link href="/dashboard/expenses" className="text-purple-400 text-sm hover:text-purple-300 mt-1 block">Add your first expense</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{expense.description || expense.category}</p>
                    <p className="text-xs text-slate-500">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400 ml-2 flex-shrink-0">-{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Savings & Recurring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Goals */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Savings Goals</h3>
            <Link href="/dashboard/savings" className="text-xs text-purple-400 hover:text-purple-300">Manage</Link>
          </div>
          {savingsGoals.length === 0 ? (
            <p className="text-slate-500 text-sm">No savings goals set up</p>
          ) : (
            <div className="space-y-4">
              {savingsGoals.slice(0, 3).map(goal => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300 font-medium">{goal.name}</span>
                      <span className="text-slate-400">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pct.toFixed(0)}% funded</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recurring Payments */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Recurring Payments</h3>
            <Link href="/dashboard/recurring" className="text-xs text-purple-400 hover:text-purple-300">Manage</Link>
          </div>
          {recurringPayments.length === 0 ? (
            <p className="text-slate-500 text-sm">No recurring payments</p>
          ) : (
            <>
              <div className="space-y-2">
                {recurringPayments.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">Due day {p.dueDay} • {p.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between">
                <span className="text-sm text-slate-400">Total/month</span>
                <span className="text-sm font-bold text-slate-200">{formatCurrency(totalRecurring)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
