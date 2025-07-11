
import React from 'react';
import SavingsPageClient from '@/components/SavingsPageClient';
import { DashboardHeader } from '@/components/DashboardHeader'; // Assuming a shared header or make specific one

// Placeholder for onAddExpenseClick if DashboardHeader expects it and is used here.
// For simplicity, this page might not need the "Add Expense" directly in its header.
// A simpler header or just the client component might be sufficient.
const placeholderAddExpense = () => { /* For header prop if needed */ };


export default function PersonalizedSavingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
       {/* You might want a simpler header here or reuse DashboardHeader if appropriate */}
       {/* For now, let's assume it's part of a layout that might provide a header, or none needed for this page. */}
       {/* If DashboardHeader is used, it needs its props. */}
       {/* <DashboardHeader onAddExpenseClick={placeholderAddExpense} /> */}
      <main className="flex-grow">
        <SavingsPageClient />
      </main>
    </div>
  );
}

export const metadata = {
  title: "Personalized Savings | Budget Buddy",
  description: "Get AI-powered savings suggestions tailored to your finances.",
};
