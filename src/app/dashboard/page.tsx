
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { IncomeModal } from '@/components/IncomeModal';
import { ExpenseList } from '@/components/dashboard/ExpenseList';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart';
import RecentTransactionsList from '@/components/dashboard/RecentTransactionsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, IndianRupee, WalletCards, Hourglass } from 'lucide-react'; // Added WalletCards, Hourglass

export default function DashboardPage() {
  const { 
    allTransactions, 
    expenses, // This is the derived list of Expense objects from AppContext
    totalIncome, 
    totalExpenses, 
    availableBalance,
    isLoading // Added isLoading
  } = useAppContext();
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const router = useRouter();

  const hasIncomeAdded = React.useMemo(() => {
    return allTransactions.some(t => t.type === 'income');
  }, [allTransactions]);

  useEffect(() => {
    // Only redirect if data is loaded and no income has been added
    if (!isLoading && !hasIncomeAdded) {
      router.push('/');
    }
  }, [isLoading, hasIncomeAdded, router]);
  
  // Show loading or a redirecting message if data is loading or no income entries
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Hourglass className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading your financial data...</p>
      </div>
    );
  }

  if (!hasIncomeAdded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <WalletCards className="h-12 w-12 text-primary mb-4" />
        <p className="text-xl text-muted-foreground">No income added yet. Redirecting...</p>
        <p className="text-sm text-muted-foreground">(If redirection takes too long, please click <a href="/" className="underline text-primary hover:text-primary/80">here</a> to go to the landing page)</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader 
        onAddExpenseClick={() => setIsAddExpenseModalOpen(true)} 
        onAddMoneyClick={() => setIsIncomeModalOpen(true)}
      />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Total Income</CardTitle>
              <IndianRupee className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">Total accumulated income</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Total Expenses</CardTitle>
              <TrendingUp className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl bg-green-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <IndianRupee className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(availableBalance)}</div>
              <p className="text-xs opacity-80">Your current financial standing</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ExpenseDonutChart expenses={expenses} />
          </div>
          <div className="lg:col-span-3">
            <RecentTransactionsList expenses={expenses} />
          </div>
        </div>

        <h2 className="text-3xl font-semibold mb-6 text-center sm:text-left text-foreground">
          Spending Categories
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseList title="Essential Expenses" expenses={expenses} type="essential" />
          <ExpenseList title="Variable Expenses" expenses={expenses} type="variable" />
        </div>
      </main>
      
      <AddExpenseModal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} />
      <IncomeModal 
        isOpen={isIncomeModalOpen} 
        onClose={() => setIsIncomeModalOpen(false)}
        navigateToDashboardOnSubmit={false} 
      />
    </div>
  );
}
