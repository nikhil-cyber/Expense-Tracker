import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payments = await prisma.recurringPayment.findMany({
    where: { userId: session.userId },
    orderBy: { dueDay: 'asc' },
  });

  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, amount, category, dueDay } = await request.json();

  if (!name || !amount || !dueDay) {
    return NextResponse.json({ error: 'Name, amount, and due day required' }, { status: 400 });
  }

  const payment = await prisma.recurringPayment.create({
    data: {
      name,
      amount: parseFloat(amount),
      category: category || 'Subscriptions',
      dueDay: parseInt(dueDay),
      userId: session.userId,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
