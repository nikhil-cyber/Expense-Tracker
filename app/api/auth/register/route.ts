import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    // Create default savings goals
    await prisma.savingsGoal.createMany({
      data: [
        { name: 'Emergency Fund', type: 'emergency', targetAmount: 10000, currentAmount: 0, monthlyTarget: 500, color: '#ef4444', userId: user.id },
        { name: 'Vacation Fund', type: 'vacation', targetAmount: 3000, currentAmount: 0, monthlyTarget: 200, color: '#f59e0b', userId: user.id },
        { name: 'General Savings', type: 'savings', targetAmount: 20000, currentAmount: 0, monthlyTarget: 300, color: '#10b981', userId: user.id },
      ],
    });

    const token = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
