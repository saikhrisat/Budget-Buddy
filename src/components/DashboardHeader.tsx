
"use client";

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { CirclePlus, TrendingDown, UserCircle, PiggyBank, Wallet, FileUp } from 'lucide-react'; 
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast"; 

interface DashboardHeaderProps {
  onAddExpenseClick: () => void;
  onAddMoneyClick: () => void; 
}

export function DashboardHeader({ onAddExpenseClick, onAddMoneyClick }: DashboardHeaderProps) {
  const { availableBalance, totalExpenses, userName } = useAppContext();
  const { toast } = useToast(); 

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleAddExpenseAttempt = () => {
    if (availableBalance <= 0) {
      toast({
        title: "Insufficient Balance",
        description: "Oops! Your balance is too low to add an expense. Please top up your account.",
        variant: "destructive",
      });
    } else {
      onAddExpenseClick(); 
    }
  };

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Logo />
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold text-lg text-green-500 flex items-center">
                {formatCurrency(availableBalance)}
              </span>
            </div>

            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-semibold text-lg text-red-500 flex items-center">
                <TrendingDown className="h-5 w-5 mr-1 text-red-500" />
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            
            <Button
              onClick={onAddMoneyClick} 
              variant="default" 
              size="default"
              className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md" 
              aria-label="Add More Money"
            >
              <Wallet className="h-5 w-5 mr-0 sm:mr-2" /> 
              <span className="hidden sm:inline">Add Money</span>
            </Button>

            <Button
              onClick={handleAddExpenseAttempt} 
              variant="default"
              size="default"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              aria-label="Add New Expense"
            >
              <CirclePlus className="h-5 w-5 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Add Expense</span>
            </Button>

            <Link href="/dashboard/import" passHref>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-primary/70 text-primary/70 hover:bg-primary/10 hover:text-primary hover:border-primary"
                aria-label="Import Transactions"
              >
                <FileUp className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/dashboard/savings" passHref>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                aria-label="Savings Suggestions"
              >
                <PiggyBank className="h-5 w-5" />
              </Button>
            </Link>

            <div className="flex items-center space-x-2 text-sm">
              <UserCircle className="h-6 w-6 text-muted-foreground" />
              <span className="text-foreground hidden md:inline">{userName}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
