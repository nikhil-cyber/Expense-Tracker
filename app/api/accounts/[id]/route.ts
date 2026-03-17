import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const account = await prisma.account.findFirst({ where: { id, userId: session.userId } });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.account.update({
    where: { id },
    data: {
      name: body.name ?? account.name,
      type: body.type ?? account.type,
      balance: body.balance !== undefined ? parseFloat(body.balance) : account.balance,
      bank: body.bank ?? account.bank,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const account = await prisma.account.findFirst({ where: { id, userId: session.userId } });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
