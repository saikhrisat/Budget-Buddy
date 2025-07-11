
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';

// GeistSans and GeistMono are imported as objects, not functions to be called.
// Their .variable property provides the CSS variable name (e.g., '--font-geist-sans').
// Next.js uses these in the <html> className to set up the font-face and CSS variables.

export const metadata: Metadata = {
  title: 'Budget Buddy',
  description: 'Automated Expense Tracker with Predictive Analytics by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased"> {/* Use Tailwind's font-sans, configured to use Geist Sans via CSS variable */}
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
