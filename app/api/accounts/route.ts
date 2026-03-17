import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type, balance, bank } = await request.json();

  const account = await prisma.account.create({
    data: {
      name,
      type,
      balance: parseFloat(balance),
      bank,
      userId: session.userId,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
