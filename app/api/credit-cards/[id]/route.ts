import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.userId } });
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.creditCard.update({
    where: { id },
    data: {
      name: body.name ?? card.name,
      bank: body.bank ?? card.bank,
      balance: body.balance !== undefined ? parseFloat(body.balance) : card.balance,
      creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : card.creditLimit,
      apr: body.apr ? parseFloat(body.apr) : card.apr,
      minimumPayment: body.minimumPayment ? parseFloat(body.minimumPayment) : card.minimumPayment,
      dueDay: body.dueDay ? parseInt(body.dueDay) : card.dueDay,
      color: body.color ?? card.color,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.userId } });
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.creditCard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
