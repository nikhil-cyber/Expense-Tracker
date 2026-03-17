import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const payment = await prisma.recurringPayment.findFirst({ where: { id, userId: session.userId } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.recurringPayment.update({
    where: { id },
    data: {
      name: body.name,
      amount: parseFloat(body.amount),
      category: body.category,
      dueDay: parseInt(body.dueDay),
      isActive: body.isActive ?? payment.isActive,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const payment = await prisma.recurringPayment.findFirst({ where: { id, userId: session.userId } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.recurringPayment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
