import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type, targetAmount, currentAmount, monthlyTarget, color } = await request.json();

  const goal = await prisma.savingsGoal.create({
    data: {
      name,
      type: type || 'custom',
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || 0),
      monthlyTarget: parseFloat(monthlyTarget || 0),
      color: color || '#6c63ff',
      userId: session.userId,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
