import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function generateExpenseReduction(
  expenses: { category: string; amount: number }[],
  recurring: { name: string; amount: number; category: string }[],
  totalExpenses: number,
  categoryBreakdown: Record<string, number>
): string {
  const tips: string[] = [];
  const sorted = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  tips.push('## Expense Reduction Recommendations\n');
  tips.push(`Your total monthly spending is **$${totalExpenses.toFixed(2)}**. Here are targeted ways to cut costs:\n`);

  // Food & Dining
  const foodSpend = categoryBreakdown['Food & Dining'] || 0;
  if (foodSpend > 400) {
    const savings = (foodSpend * 0.3).toFixed(0);
    tips.push(`### 1. Food & Dining — Save ~$${savings}/month\nYou're spending **$${foodSpend.toFixed(0)}/month** on food. The average American spends $300–$400. Meal prepping 3x/week, using grocery apps (Ibotta, Fetch), and limiting takeout to 2x/week could save you roughly 30%.`);
  }

  // Subscriptions
  const subSpend = categoryBreakdown['Subscriptions'] || 0;
  const subRecurring = recurring.filter(r => r.category === 'Subscriptions');
  if (subSpend > 50 || subRecurring.length > 3) {
    tips.push(`### ${tips.length}. Subscriptions Audit\nYou have **${subRecurring.length} recurring subscriptions** totaling **$${subRecurring.reduce((s, r) => s + r.amount, 0).toFixed(0)}/month**. Review each one: cancel unused services, share family plans (Netflix, Spotify, Apple One), and rotate streaming services instead of running them simultaneously. Potential savings: **$${(subRecurring.reduce((s, r) => s + r.amount, 0) * 0.35).toFixed(0)}/month**.`);
  }

  // Entertainment
  const entSpend = categoryBreakdown['Entertainment'] || 0;
  if (entSpend > 150) {
    tips.push(`### ${tips.length}. Entertainment — Save ~$${(entSpend * 0.4).toFixed(0)}/month\nYou're spending **$${entSpend.toFixed(0)}/month** on entertainment. Look for free community events, use your library card for movies/books/audiobooks, and set a weekly entertainment budget of $${(entSpend * 0.6 / 4).toFixed(0)}.`);
  }

  // Transportation
  const transSpend = categoryBreakdown['Transportation'] || 0;
  if (transSpend > 300) {
    tips.push(`### ${tips.length}. Transportation — Save ~$${(transSpend * 0.2).toFixed(0)}/month\nYour transportation costs are **$${transSpend.toFixed(0)}/month**. Consider carpooling, combining errands into one trip, refinancing your auto loan if APR > 6%, and comparing insurance providers annually.`);
  }

  // Shopping
  const shopSpend = categoryBreakdown['Shopping'] || 0;
  if (shopSpend > 200) {
    tips.push(`### ${tips.length}. Shopping — Save ~$${(shopSpend * 0.35).toFixed(0)}/month\nYou spent **$${shopSpend.toFixed(0)}** on shopping this month. Apply the **48-hour rule**: wait 48 hours before any non-essential purchase. Use browser extensions like Honey or Capital One Shopping for automatic discounts.`);
  }

  // Top category catch-all
  if (sorted.length > 0 && tips.length < 5) {
    const [topCat, topAmt] = sorted[0];
    tips.push(`### ${tips.length}. Your Biggest Category: ${topCat}\nAt **$${topAmt.toFixed(0)}/month**, ${topCat} is your largest expense. Set a strict monthly budget cap and track it weekly. Even a 20% reduction saves you **$${(topAmt * 0.2).toFixed(0)}/month**.`);
  }

  // 50/30/20 rule
  const estimatedIncome = totalExpenses / 0.7;
  const needs = estimatedIncome * 0.50;
  const wants = estimatedIncome * 0.30;
  const savingsTarget = estimatedIncome * 0.20;
  tips.push(`\n---\n### The 50/30/20 Rule (Based on your spending)\nEstimated monthly income: ~**$${estimatedIncome.toFixed(0)}**\n- **Needs (50%):** $${needs.toFixed(0)} — housing, utilities, groceries, transportation\n- **Wants (30%):** $${wants.toFixed(0)} — dining, entertainment, shopping\n- **Savings/Debt (20%):** $${savingsTarget.toFixed(0)} — emergency fund, investments, extra debt payments`);

  return tips.join('\n\n');
}

function generateCreditCardStrategy(
  creditCards: { name: string; bank: string; balance: number; creditLimit: number; apr: number; minimumPayment: number; dueDay: number }[],
  totalAssets: number
): string {
  if (creditCards.length === 0) {
    return '## Credit Card Strategy\n\nNo credit cards found. Add your credit cards to get a personalized payoff plan.';
  }

  const lines: string[] = [];
  const totalDebt = creditCards.reduce((s, c) => s + c.balance, 0);
  const totalMinPayments = creditCards.reduce((s, c) => s + c.minimumPayment, 0);

  lines.push('## Credit Card Payoff Strategy\n');
  lines.push(`You have **${creditCards.length} credit card(s)** with a total balance of **$${totalDebt.toFixed(2)}** across a total limit of **$${creditCards.reduce((s, c) => s + c.creditLimit, 0).toFixed(0)}**.\n`);

  // Utilization
  const utilization = (totalDebt / creditCards.reduce((s, c) => s + c.creditLimit, 0)) * 100;
  const utilizationColor = utilization > 50 ? 'HIGH' : utilization > 30 ? 'MODERATE' : 'GOOD';
  lines.push(`### Credit Utilization: ${utilization.toFixed(0)}% (${utilizationColor})\nIdeal credit utilization is **below 30%**. ${utilization > 30 ? `Reducing to 30% would mean getting your total balance to **$${(creditCards.reduce((s, c) => s + c.creditLimit, 0) * 0.3).toFixed(0)}**.` : 'Great job keeping utilization low!'}\n`);

  // Avalanche method (highest APR first)
  const byApr = [...creditCards].sort((a, b) => b.apr - a.apr);
  lines.push('### Recommended: Avalanche Method (Saves Most Interest)\nPay minimums on all cards, then throw all extra money at the highest APR card first:\n');
  byApr.forEach((c, i) => {
    const monthlyInterest = (c.balance * (c.apr / 100)) / 12;
    lines.push(`**${i + 1}. ${c.name} (${c.bank})** — Balance: $${c.balance.toFixed(0)} | APR: ${c.apr}% | Monthly Interest: ~$${monthlyInterest.toFixed(0)}`);
  });

  // Snowball method (lowest balance first)
  const byBalance = [...creditCards].sort((a, b) => a.balance - b.balance);
  lines.push('\n### Alternative: Snowball Method (Psychological Wins)\nPay minimums on all cards, then attack the smallest balance first for motivation:\n');
  byBalance.forEach((c, i) => {
    lines.push(`**${i + 1}. ${c.name}** — Balance: $${c.balance.toFixed(0)}`);
  });

  // Payoff timeline
  const extraPayment = Math.max(100, totalAssets * 0.05);
  lines.push(`\n### Payoff Timeline\nWith your current minimum payments of **$${totalMinPayments.toFixed(0)}/month**:`);
  byApr.forEach(c => {
    if (c.balance > 0) {
      const monthlyRate = c.apr / 100 / 12;
      const months = monthlyRate > 0
        ? Math.ceil(Math.log(c.minimumPayment / (c.minimumPayment - c.balance * monthlyRate)) / Math.log(1 + monthlyRate))
        : Math.ceil(c.balance / c.minimumPayment);
      const monthsExtra = monthlyRate > 0
        ? Math.ceil(Math.log((c.minimumPayment + extraPayment / creditCards.length) / ((c.minimumPayment + extraPayment / creditCards.length) - c.balance * monthlyRate)) / Math.log(1 + monthlyRate))
        : Math.ceil(c.balance / (c.minimumPayment + extraPayment / creditCards.length));
      lines.push(`- **${c.name}:** ~${isFinite(months) ? months : '?'} months minimum only | ~${isFinite(monthsExtra) ? monthsExtra : '?'} months with +$${(extraPayment / creditCards.length).toFixed(0)} extra`);
    }
  });

  lines.push(`\n### Quick Wins\n- **Balance Transfer:** If you have good credit (700+), consider a 0% APR balance transfer card (12–21 months). This alone could save you hundreds.\n- **Call and negotiate:** Many banks will lower your APR if you ask — especially if you have a good payment history.\n- **Never pay just the minimum** — on a $${byApr[0]?.balance.toFixed(0)} balance at ${byApr[0]?.apr}% APR, paying only minimums could cost you years of interest.`);

  return lines.join('\n');
}

function generateInvestmentAdvice(
  savingsGoals: { name: string; type: string; currentAmount: number; targetAmount: number }[],
  totalAssets: number,
  totalDebt: number,
  totalExpenses: number
): string {
  const lines: string[] = [];
  const emergencyGoal = savingsGoals.find(g => g.type === 'emergency');
  const emergencyFunded = emergencyGoal ? emergencyGoal.currentAmount : 0;
  const emergencyTarget = emergencyGoal ? emergencyGoal.targetAmount : totalExpenses * 6;
  const estimatedIncome = totalExpenses / 0.7;

  lines.push('## Investment Recommendations\n');

  // Financial health score
  const debtToAsset = totalDebt / Math.max(totalAssets, 1);
  const emergencyRatio = emergencyFunded / Math.max(emergencyTarget, 1);
  let score = 5;
  if (debtToAsset < 0.3) score += 2;
  else if (debtToAsset > 1) score -= 2;
  if (emergencyRatio >= 1) score += 2;
  else if (emergencyRatio < 0.25) score -= 1;
  score = Math.min(10, Math.max(1, score));

  lines.push(`### Financial Health Score: ${score}/10\n`);

  // Baby steps approach
  lines.push('### Investment Priority Order (Dave Ramsey + Modern Approach)\n');
  lines.push(`**Step 1 — Emergency Fund** ${emergencyRatio >= 1 ? '✅' : '🔴 IN PROGRESS'}\nTarget: **$${emergencyTarget.toFixed(0)}** (3–6 months of expenses) | Current: **$${emergencyFunded.toFixed(0)}**\n${emergencyRatio < 1 ? `→ Priority #1. Build this before investing. You need $${(emergencyTarget - emergencyFunded).toFixed(0)} more.` : '→ Fully funded! Great foundation.'}\n`);

  lines.push(`**Step 2 — High-Interest Debt** ${totalDebt < 1000 ? '✅' : '🔴 ACTIVE'}\nTotal debt: **$${totalDebt.toFixed(2)}**\n${totalDebt > 0 ? '→ Pay off credit cards before investing in taxable accounts. Guaranteed return = your APR.' : '→ Debt-free! Full investing power.'}\n`);

  lines.push(`**Step 3 — 401(k) Match (Free Money)**\n→ Contribute at least enough to get your full employer match (typically 3–6% of salary). This is an **instant 50–100% return**.\n`);

  lines.push(`**Step 4 — Roth IRA** ($7,000/year limit for 2024)\n→ Max out your Roth IRA next. Tax-free growth is powerful long-term. Invest in low-cost index funds:\n  - **VTI** (Vanguard Total Stock Market) — 0.03% expense ratio\n  - **VXUS** (International) — for diversification\n  - **BND** (Bonds) — stability\n`);

  lines.push(`**Step 5 — Max 401(k)** ($23,500/year limit for 2024)\n→ After Roth IRA, max your 401(k) for pre-tax growth.\n`);

  lines.push(`**Step 6 — Taxable Brokerage Account**\n→ Invest in low-cost ETFs:\n  - **80% VTI / 20% BND** (conservative)\n  - **90% VTI / 10% VXUS** (growth-focused)\n  - **Three-fund portfolio:** 60% VTI + 30% VXUS + 10% BND\n`);

  const monthlyInvest = estimatedIncome * 0.15;
  lines.push(`### Suggested Monthly Investment: $${monthlyInvest.toFixed(0)} (15% of income)\n- Emergency fund top-up: $${Math.min(monthlyInvest * 0.3, (emergencyTarget - emergencyFunded) / 12).toFixed(0)}/mo\n- 401(k) contribution: $${(monthlyInvest * 0.4).toFixed(0)}/mo\n- Roth IRA: $${(monthlyInvest * 0.3).toFixed(0)}/mo ($${(monthlyInvest * 0.3 * 12).toFixed(0)}/yr)\n- Taxable brokerage: $${(monthlyInvest * 0.3).toFixed(0)}/mo`);

  lines.push(`\n### Long-Term Projection (7% avg annual return)\n- Investing $${monthlyInvest.toFixed(0)}/month:\n  - In 10 years: ~$${(monthlyInvest * 12 * ((Math.pow(1.07, 10) - 1) / 0.07)).toFixed(0)}\n  - In 20 years: ~$${(monthlyInvest * 12 * ((Math.pow(1.07, 20) - 1) / 0.07)).toFixed(0)}\n  - In 30 years: ~$${(monthlyInvest * 12 * ((Math.pow(1.07, 30) - 1) / 0.07)).toFixed(0)}`);

  return lines.join('\n');
}

function generateSavingsAllocation(
  savingsGoals: { name: string; type: string; currentAmount: number; targetAmount: number; monthlyTarget: number }[],
  totalExpenses: number,
  totalRecurring: number,
  totalDebt: number
): string {
  const lines: string[] = [];
  const estimatedIncome = totalExpenses / 0.7;
  const disposable = estimatedIncome - totalExpenses - totalRecurring;

  lines.push('## Savings Allocation Plan\n');
  lines.push(`Based on your spending, your estimated monthly income is ~**$${estimatedIncome.toFixed(0)}** with ~**$${Math.max(0, disposable).toFixed(0)}** available after expenses.\n`);

  // Allocation percentages
  lines.push('### Recommended Monthly Allocation\n');

  const emergency = savingsGoals.find(g => g.type === 'emergency');
  const vacation = savingsGoals.find(g => g.type === 'vacation');
  const savings = savingsGoals.find(g => g.type === 'savings');

  const emergencyNeeded = emergency ? Math.max(0, emergency.targetAmount - emergency.currentAmount) : 0;
  const vacationNeeded = vacation ? Math.max(0, vacation.targetAmount - vacation.currentAmount) : 0;

  const alloc = [
    { name: 'Emergency Fund', pct: emergencyNeeded > 0 ? 40 : 10, goal: emergency },
    { name: 'Retirement (401k/IRA)', pct: 25, goal: null },
    { name: 'General Savings', pct: 15, goal: savings },
    { name: 'Vacation Fund', pct: vacationNeeded > 0 ? 10 : 5, goal: vacation },
    { name: 'Extra Debt Payments', pct: totalDebt > 0 ? 10 : 0, goal: null },
  ].filter(a => a.pct > 0);

  // Normalize to 100%
  const totalPct = alloc.reduce((s, a) => s + a.pct, 0);
  const savingsPool = estimatedIncome * 0.20;

  alloc.forEach(a => {
    const normalized = (a.pct / totalPct) * 100;
    const monthly = (normalized / 100) * savingsPool;
    lines.push(`**${a.name}** — ${normalized.toFixed(0)}% = **$${monthly.toFixed(0)}/month**`);
    if (a.goal && a.goal.targetAmount > 0) {
      const remaining = a.goal.targetAmount - a.goal.currentAmount;
      if (remaining > 0) {
        lines.push(`  → Goal: $${a.goal.targetAmount.toFixed(0)} | Progress: $${a.goal.currentAmount.toFixed(0)} | Remaining: $${remaining.toFixed(0)} | ETA: ~${Math.ceil(remaining / monthly)} months`);
      } else {
        lines.push(`  → Goal achieved! Consider increasing target or redirecting funds.`);
      }
    }
  });

  lines.push('\n### Automation Tips');
  lines.push('- **Automate transfers** on payday — pay yourself first before spending');
  lines.push('- Use **separate high-yield savings accounts** (HYSA) for each goal (Marcus, Ally, SoFi pay 4–5% APY)');
  lines.push('- Set up **round-up savings** with apps like Acorns or your bank\'s round-up feature');
  lines.push(`- Even saving **$${(savingsPool * 0.5).toFixed(0)}/month** instead of the full $${savingsPool.toFixed(0)} still builds significant wealth over time`);

  return lines.join('\n');
}

function generateFullAnalysis(
  accounts: { name: string; type: string; balance: number }[],
  creditCards: { name: string; bank: string; balance: number; creditLimit: number; apr: number }[],
  expenses: { category: string; amount: number }[],
  recurringPayments: { name: string; amount: number }[],
  savingsGoals: { name: string; type: string; currentAmount: number; targetAmount: number }[],
  totalExpenses: number,
  totalAssets: number,
  totalDebt: number
): string {
  const lines: string[] = [];
  const estimatedIncome = totalExpenses / 0.7;
  const netWorth = totalAssets - totalDebt;
  const debtToIncome = (totalDebt / estimatedIncome) * 100;
  const savingsRate = ((estimatedIncome - totalExpenses) / estimatedIncome) * 100;

  // Score
  let score = 5;
  if (netWorth > 0) score += 1;
  if (debtToIncome < 20) score += 2; else if (debtToIncome > 50) score -= 1;
  if (savingsRate > 20) score += 2; else if (savingsRate < 5) score -= 1;
  const creditUtil = totalDebt / Math.max(creditCards.reduce((s, c) => s + c.creditLimit, 0.01), 1) * 100;
  if (creditUtil < 30) score += 1; else if (creditUtil > 70) score -= 1;
  score = Math.min(10, Math.max(1, score));

  lines.push('## Complete Financial Analysis\n');

  lines.push(`### Financial Health Score: ${score}/10\n`);
  lines.push(`| Metric | Value | Status |`);
  lines.push(`|--------|-------|--------|`);
  lines.push(`| Net Worth | $${netWorth.toFixed(0)} | ${netWorth >= 0 ? 'Positive' : 'Negative — focus on debt'} |`);
  lines.push(`| Estimated Monthly Income | $${estimatedIncome.toFixed(0)} | — |`);
  lines.push(`| Monthly Expenses | $${totalExpenses.toFixed(0)} | ${((totalExpenses/estimatedIncome)*100).toFixed(0)}% of income |`);
  lines.push(`| Savings Rate | ${savingsRate.toFixed(0)}% | ${savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'} |`);
  lines.push(`| Credit Utilization | ${creditUtil.toFixed(0)}% | ${creditUtil < 30 ? 'Good' : creditUtil < 50 ? 'Fair' : 'High — reduce ASAP'} |`);
  lines.push(`| Debt-to-Income | ${debtToIncome.toFixed(0)}% | ${debtToIncome < 36 ? 'Healthy' : 'High'} |\n`);

  lines.push('### Strengths');
  if (netWorth > 0) lines.push('- Positive net worth — you own more than you owe');
  if (creditUtil < 30) lines.push('- Credit utilization is healthy (under 30%)');
  if (savingsRate > 15) lines.push('- Strong savings rate — you\'re building wealth effectively');
  if (creditCards.length === 0) lines.push('- No credit card debt — excellent financial position');
  if (lines[lines.length - 1] === '### Strengths') lines.push('- You\'re tracking your finances — that alone puts you ahead of most people');

  lines.push('\n### Priority Improvements');
  if (totalDebt > 0) lines.push(`- **Reduce credit card debt** — $${totalDebt.toFixed(0)} at high APR is costing you ~$${(totalDebt * (creditCards[0]?.apr || 20) / 100 / 12).toFixed(0)}/month in interest`);
  if (creditUtil > 30) lines.push('- **Lower credit utilization** to below 30% for a credit score boost (can improve by 50–100 points)');
  if (savingsRate < 20) lines.push(`- **Increase savings rate** to 20% — currently at ${savingsRate.toFixed(0)}%`);
  const emergency = savingsGoals.find(g => g.type === 'emergency');
  if (emergency && emergency.currentAmount < emergency.targetAmount * 0.5) lines.push(`- **Build emergency fund** — currently at ${((emergency.currentAmount / emergency.targetAmount) * 100).toFixed(0)}% of target`);

  lines.push('\n### 30-60-90 Day Action Plan');
  lines.push('**Next 30 Days:**');
  lines.push('- Audit all subscriptions and cancel unused ones');
  lines.push('- Set up automatic transfers to savings on payday');
  lines.push('- Get credit card interest rates reduced by calling issuers');

  lines.push('\n**60 Days:**');
  lines.push('- Open a high-yield savings account (4–5% APY) for emergency fund');
  lines.push('- Review and optimize your budget using the 50/30/20 framework');
  if (totalDebt > 0) lines.push('- Make first extra payment on highest APR card');

  lines.push('\n**90 Days:**');
  lines.push('- Review insurance policies and shop for better rates');
  lines.push('- Set up 401(k) contributions or increase to get full employer match');
  lines.push('- Review progress and adjust savings goals');

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type } = await request.json();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, recurringPayments, savingsGoals, creditCards, accounts] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: session.userId, date: { gte: startOfMonth } },
    }),
    prisma.recurringPayment.findMany({ where: { userId: session.userId, isActive: true } }),
    prisma.savingsGoal.findMany({ where: { userId: session.userId } }),
    prisma.creditCard.findMany({ where: { userId: session.userId } }),
    prisma.account.findMany({ where: { userId: session.userId } }),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRecurring = recurringPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDebt = creditCards.reduce((sum, c) => sum + c.balance, 0);
  const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);

  const categoryBreakdown = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  let recommendation = '';

  switch (type) {
    case 'expense_reduction':
      recommendation = generateExpenseReduction(expenses, recurringPayments, totalExpenses, categoryBreakdown);
      break;
    case 'credit_cards':
      recommendation = generateCreditCardStrategy(creditCards, totalAssets);
      break;
    case 'investments':
      recommendation = generateInvestmentAdvice(savingsGoals, totalAssets, totalDebt, totalExpenses);
      break;
    case 'savings_allocation':
      recommendation = generateSavingsAllocation(savingsGoals, totalExpenses, totalRecurring, totalDebt);
      break;
    default:
      recommendation = generateFullAnalysis(accounts, creditCards, expenses, recurringPayments, savingsGoals, totalExpenses, totalAssets, totalDebt);
  }

  return NextResponse.json({ recommendation, type });
}
