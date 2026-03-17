import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: session.userId } });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      name: body.name ?? goal.name,
      type: body.type ?? goal.type,
      targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : goal.targetAmount,
      currentAmount: body.currentAmount !== undefined ? parseFloat(body.currentAmount) : goal.currentAmount,
      monthlyTarget: body.monthlyTarget ? parseFloat(body.monthlyTarget) : goal.monthlyTarget,
      color: body.color ?? goal.color,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: session.userId } });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.savingsGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
