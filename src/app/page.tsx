
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { IncomeModal } from "@/components/IncomeModal";
import Logo from "@/components/Logo";
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const { allTransactions, isLoading } = useAppContext(); 
  const router = useRouter();
  const { toast } = useToast();

  const hasIncomeAdded = React.useMemo(() => {
    return allTransactions.some(t => t.type === 'income');
  }, [allTransactions]);

  const handleAddMoneyClick = () => {
    if (isLoading) {
        toast({ title: "Loading data...", description: "Please wait a moment."});
        return;
    }
    if (hasIncomeAdded) { 
      toast({
        title: "Income Already Added",
        description: "Please go to the dashboard to add more money.",
        variant: "default",
      });
    } else { 
      setIsIncomeModalOpen(true);
    }
  };

  const handleSeeDashboardClick = () => {
    if (isLoading) {
        toast({ title: "Loading data...", description: "Please wait a moment."});
        return;
    }
    if (hasIncomeAdded) { 
      router.push('/dashboard');
    } else {
      toast({
        title: "Dashboard Access",
        description: "Please add your income first to see the dashboard.",
        variant: "default", 
      });
    }
  };

  return (
    <>
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
        <header className="absolute top-0 left-0 w-full p-6">
          <Logo className="text-primary" />
        </header>
        
        <main className="z-10 flex flex-col items-center text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-foreground drop-shadow-sm">
            Welcome to <span className="text-primary">Budget Buddy</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Take control of your finances with smart tracking and personalized insights. Let Budget Buddy be your guide to financial freedom.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md sm:max-w-lg md:max-w-2xl px-4">
            <Button
              onClick={handleAddMoneyClick}
              className="group inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-6 text-lg font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transform hover:scale-105"
              aria-label="Add Money"
            >
              Add Money
              <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
            </Button>
            <Button
              onClick={handleSeeDashboardClick}
              variant="outline"
              className="group inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-6 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform hover:scale-105"
              aria-label="See Dashboard"
            >
              See Dashboard
              <LayoutDashboard className="ml-3 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:rotate-6" />
            </Button>
          </div>
        </main>

        <footer className="absolute bottom-0 w-full p-6 text-center text-muted-foreground text-sm z-10">
          © {new Date().getFullYear()} Budget Buddy. All rights reserved.
        </footer>
      </div>
      <IncomeModal 
        isOpen={isIncomeModalOpen} 
        onClose={() => setIsIncomeModalOpen(false)}
        navigateToDashboardOnSubmit={true} 
      />
    </>
  );
}
