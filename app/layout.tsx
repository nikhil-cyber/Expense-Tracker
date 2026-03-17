import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinanceIQ - Personal Finance Tracker',
  description: 'Track expenses, manage savings, optimize credit cards, and get AI-powered financial insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="mesh-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
