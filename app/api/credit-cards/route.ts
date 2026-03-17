import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cards = await prisma.creditCard.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, bank, balance, creditLimit, apr, minimumPayment, dueDay, color } = await request.json();

  const card = await prisma.creditCard.create({
    data: {
      name,
      bank,
      balance: parseFloat(balance),
      creditLimit: parseFloat(creditLimit),
      apr: parseFloat(apr),
      minimumPayment: parseFloat(minimumPayment),
      dueDay: parseInt(dueDay),
      color: color || '#6c63ff',
      userId: session.userId,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
