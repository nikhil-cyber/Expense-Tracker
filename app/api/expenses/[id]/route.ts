import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { amount, category, description, date } = await request.json();

  const expense = await prisma.expense.findFirst({ where: { id, userId: session.userId } });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const expense = await prisma.expense.findFirst({ where: { id, userId: session.userId } });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
