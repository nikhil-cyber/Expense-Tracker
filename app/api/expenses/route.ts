import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const category = searchParams.get('category');

  const where: Record<string, unknown> = { userId: session.userId };

  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  if (category) {
    where.category = category;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, category, description, date, paymentSourceType, paymentSourceId, fromAccountId } = await request.json();

  if (!amount || !category || !date) {
    return NextResponse.json({ error: 'Amount, category, and date required' }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);

  const expense = await prisma.expense.create({
    data: {
      amount: parsedAmount,
      category,
      description,
      date: new Date(date),
      paymentSourceType: paymentSourceType || null,
      paymentSourceId: paymentSourceId || null,
      fromAccountId: fromAccountId || null,
      userId: session.userId,
    },
  });

  // Adjust balance of the payment source
  if (paymentSourceType && paymentSourceId) {
    if (paymentSourceType === 'account') {
      await prisma.account.updateMany({
        where: { id: paymentSourceId, userId: session.userId },
        data: { balance: { decrement: parsedAmount } },
      });
    } else if (paymentSourceType === 'creditCard') {
      // Credit Card Payment category = paying down debt (decrease balance)
      // Any other category = charging to card (increase balance)
      const isCreditCardPayment = category === 'Credit Card Payment';
      await prisma.creditCard.updateMany({
        where: { id: paymentSourceId, userId: session.userId },
        data: { balance: isCreditCardPayment ? { decrement: parsedAmount } : { increment: parsedAmount } },
      });
    }
  }

  // For Credit Card Payment, also deduct from the source bank account
  if (category === 'Credit Card Payment' && fromAccountId) {
    await prisma.account.updateMany({
      where: { id: fromAccountId, userId: session.userId },
      data: { balance: { decrement: parsedAmount } },
    });
  }

  return NextResponse.json(expense, { status: 201 });
}
