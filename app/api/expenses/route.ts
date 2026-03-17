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

  const { amount, category, description, date } = await request.json();

  if (!amount || !category || !date) {
    return NextResponse.json({ error: 'Amount, category, and date required' }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
      userId: session.userId,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
