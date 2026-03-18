import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { amount, fromAccountId } = await request.json();

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'Payment amount required' }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);

  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.userId } });
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Decrease the credit card balance (paying off debt)
  const updatedCard = await prisma.creditCard.update({
    where: { id },
    data: { balance: { decrement: parsedAmount } },
  });

  // If paying from a bank account, decrease that account's balance too
  if (fromAccountId) {
    await prisma.account.updateMany({
      where: { id: fromAccountId, userId: session.userId },
      data: { balance: { decrement: parsedAmount } },
    });
  }

  return NextResponse.json(updatedCard);
}
