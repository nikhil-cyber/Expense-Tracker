import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { amount, category, description, date, paymentSourceType, paymentSourceId, fromAccountId } = await request.json();

  const expense = await prisma.expense.findFirst({ where: { id, userId: session.userId } });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsedAmount = parseFloat(amount);

  // Reverse the old payment source balance change
  if (expense.paymentSourceType && expense.paymentSourceId) {
    if (expense.paymentSourceType === 'account') {
      await prisma.account.updateMany({
        where: { id: expense.paymentSourceId, userId: session.userId },
        data: { balance: { increment: expense.amount } },
      });
    } else if (expense.paymentSourceType === 'creditCard') {
      const wasPayment = expense.category === 'Credit Card Payment';
      await prisma.creditCard.updateMany({
        where: { id: expense.paymentSourceId, userId: session.userId },
        data: { balance: wasPayment ? { increment: expense.amount } : { decrement: expense.amount } },
      });
    }
  }
  // Reverse old fromAccount deduction if it was a credit card payment
  if (expense.category === 'Credit Card Payment' && expense.fromAccountId) {
    await prisma.account.updateMany({
      where: { id: expense.fromAccountId, userId: session.userId },
      data: { balance: { increment: expense.amount } },
    });
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      amount: parsedAmount,
      category,
      description,
      date: new Date(date),
      paymentSourceType: paymentSourceType || null,
      paymentSourceId: paymentSourceId || null,
      fromAccountId: fromAccountId || null,
    },
  });

  // Apply the new payment source balance change
  if (paymentSourceType && paymentSourceId) {
    if (paymentSourceType === 'account') {
      await prisma.account.updateMany({
        where: { id: paymentSourceId, userId: session.userId },
        data: { balance: { decrement: parsedAmount } },
      });
    } else if (paymentSourceType === 'creditCard') {
      const isCreditCardPayment = category === 'Credit Card Payment';
      await prisma.creditCard.updateMany({
        where: { id: paymentSourceId, userId: session.userId },
        data: { balance: isCreditCardPayment ? { decrement: parsedAmount } : { increment: parsedAmount } },
      });
    }
  }
  // Apply new fromAccount deduction for credit card payment
  if (category === 'Credit Card Payment' && fromAccountId) {
    await prisma.account.updateMany({
      where: { id: fromAccountId, userId: session.userId },
      data: { balance: { decrement: parsedAmount } },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const expense = await prisma.expense.findFirst({ where: { id, userId: session.userId } });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Reverse the payment source balance change before deleting
  if (expense.paymentSourceType && expense.paymentSourceId) {
    if (expense.paymentSourceType === 'account') {
      await prisma.account.updateMany({
        where: { id: expense.paymentSourceId, userId: session.userId },
        data: { balance: { increment: expense.amount } },
      });
    } else if (expense.paymentSourceType === 'creditCard') {
      const wasPayment = expense.category === 'Credit Card Payment';
      await prisma.creditCard.updateMany({
        where: { id: expense.paymentSourceId, userId: session.userId },
        data: { balance: wasPayment ? { increment: expense.amount } : { decrement: expense.amount } },
      });
    }
  }
  // Reverse fromAccount deduction if it was a credit card payment
  if (expense.category === 'Credit Card Payment' && expense.fromAccountId) {
    await prisma.account.updateMany({
      where: { id: expense.fromAccountId, userId: session.userId },
      data: { balance: { increment: expense.amount } },
    });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
