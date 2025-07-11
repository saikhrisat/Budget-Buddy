"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Expense } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface RecentTransactionsListProps {
  expenses: Expense[];
}

const getDateTimestamp = (dateInput: Date | string | undefined | null): number => {
    if (!dateInput) return -Infinity;
    try {
        const date = new Date(dateInput);
        const timestamp = date.getTime();
        if (isNaN(timestamp)) {
            return -Infinity;
        }
        return timestamp;
    } catch (error) {
        console.error("Error parsing date during sorting:", dateInput, error);
        return -Infinity;
    }
};

const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({ expenses }) => {

  const recentTransactions = React.useMemo(() => {
    const validExpenses = Array.isArray(expenses) ? expenses : [];
    const sortedExpenses = [...validExpenses].sort((a, b) => {
        const timestampA = getDateTimestamp(a?.date);
        const timestampB = getDateTimestamp(b?.date);
        return timestampB - timestampA; // Sort descending (newest first)
    });
    return sortedExpenses.slice(0, 9); // Display the latest 9 transactions
  }, [expenses]);

  const formatCurrency = (amount: number | undefined | null): string => {
    const numericAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(numericAmount);
  };

  const formatDate = (date: Date | string | undefined | null): string => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
        console.error("Error formatting date:", date, error);
        return 'Error';
    }
  };

  const getCategoryDisplay = (expense: Expense | undefined | null): string => {
    if (!expense) return 'Uncategorized';
    const subCategory = (expense as any).subCategory;
    return subCategory || expense.category || 'Uncategorized';
  };

  // Updated to use blue for Essential and green for Variable expenses
  const getCategoryClass = (categoryType: string | undefined): string => {
    if (categoryType === "Essential Fixed Expenses") {
      return "text-primary font-medium"; // Uses primary color (blue)
    } else if (categoryType === "Variable Expenses") {
      return "text-accent font-medium"; // Uses accent color (green)
    }
    return "text-slate-600"; // Default color for other categories
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-center text-lg sm:text-xl font-semibold">Recent Transactions</CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm text-muted-foreground">Your latest 9 expense entries</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-3 py-0 overflow-hidden">
        {recentTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            <p>No transactions recorded yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/80 hover:bg-transparent">
                  <TableHead className="w-[90px] h-9 text-muted-foreground font-medium text-xs">Date</TableHead>
                  <TableHead className="h-9 text-muted-foreground font-medium text-xs">Description</TableHead>
                  <TableHead className="h-9 text-muted-foreground font-medium text-xs">Category</TableHead>
                  <TableHead className="h-9 text-right text-muted-foreground font-medium text-xs">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((expense, index) => {
                  if (!expense || typeof expense !== 'object') {
                    return null;
                  }
                  const key = expense.id ?? `expense-${index}`;
                  const categoryDisplay = getCategoryDisplay(expense);
                  const description = expense.name || '-';
                  const amount = expense.amount;
                  const categoryType = (expense as any).categoryType as string | undefined;

                  return (
                    <TableRow key={key} className="border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
                      <TableCell className="py-2.5 px-2 text-xs tabular-nums text-muted-foreground whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                      <TableCell className="py-2.5 px-2 font-medium text-sm truncate max-w-[120px] sm:max-w-none" title={description}>{description}</TableCell>
                      <TableCell 
                        className={cn(
                          "py-2.5 px-2 text-xs truncate max-w-[80px] sm:max-w-[100px]", 
                          getCategoryClass(categoryType)
                        )}
                        title={categoryDisplay}
                      >
                        {categoryDisplay}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right font-semibold text-sm text-destructive tabular-nums whitespace-nowrap">{formatCurrency(amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactionsList;
