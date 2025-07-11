
"use client";

import type { Expense } from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import Link from 'next/link'; // Import Link
import { Utensils, Home, ShoppingCart, Car, Activity, ShieldCheck, Lightbulb, HandCoins, Clapperboard, Sparkles, Plane } from 'lucide-react';

interface ExpenseListProps {
  title: string;
  expenses: Expense[]; 
  type: 'essential' | 'variable'; 
}

const getCategoryIcon = (mainCategoryName: string) => {
  const catLower = mainCategoryName.toLowerCase();
  if (catLower.includes('housing')) return <Home className="h-5 w-5" />;
  if (catLower.includes('utilities')) return <Lightbulb className="h-5 w-5" />;
  if (catLower.includes('transportation')) return <Car className="h-5 w-5" />;
  if (catLower.includes('debt')) return <ShieldCheck className="h-5 w-5" />;
  if (catLower.includes('food')) return <Utensils className="h-5 w-5" />;
  if (catLower.includes('personal care')) return <Sparkles className="h-5 w-5" />;
  if (catLower.includes('entertainment')) return <Clapperboard className="h-5 w-5" />;
  if (catLower.includes('shopping')) return <ShoppingCart className="h-5 w-5" />;
  if (catLower.includes('insurance')) return <ShieldCheck className="h-5 w-5" />;
  if (catLower.includes('travel')) return <Plane className="h-5 w-5" />;
  if (catLower.includes('hobbies')) return <HandCoins className="h-5 w-5" />;
  return <Activity className="h-5 w-5" />; 
};

export function ExpenseList({ title, expenses, type }: ExpenseListProps) {
  const { fixedCategoryGroups, variableCategoryGroups } = useAppContext();
  const mainCategoryGroupsToDisplay = type === 'essential' ? fixedCategoryGroups : variableCategoryGroups;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const totalForType = expenses
    .filter(exp => {
      if (exp.type !== type) return false;
      return mainCategoryGroupsToDisplay.some(group => group.options.includes(exp.category));
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card className="flex flex-col h-full shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-primary">{title}</CardTitle>
                <CardDescription>Your {type} spending, broken down by category. Total: {formatCurrency(totalForType)}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        {mainCategoryGroupsToDisplay.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No main categories defined for {type} expenses.</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {mainCategoryGroupsToDisplay.map(mainCategoryGroup => {
                const expensesForThisMainGroup = expenses.filter(
                  exp => exp.type === type && mainCategoryGroup.options.includes(exp.category)
                );
                const totalForMainGroup = expensesForThisMainGroup.reduce((sum, exp) => sum + exp.amount, 0);

                return (
                  <Link key={mainCategoryGroup.name} href={`/dashboard/category/${encodeURIComponent(mainCategoryGroup.name.toLowerCase().replace(/\s+/g, '-'))}?type=${type}`} passHref>
                    <div className="rounded-lg p-3 border border-border/70 bg-card hover:bg-secondary/20 transition-colors cursor-pointer shadow-md flex flex-col min-h-[150px]">
                      <div className="flex justify-between items-center mb-2 pb-1 border-b border-border/50">
                          <h3 className="text-base font-semibold text-foreground flex items-center">
                            {getCategoryIcon(mainCategoryGroup.name)} 
                            <span className="ml-2">{mainCategoryGroup.name}</span>
                          </h3>
                          <span className="text-sm font-bold text-muted-foreground">{formatCurrency(totalForMainGroup)}</span>
                      </div>
                      {expensesForThisMainGroup.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                          <p className="text-xs text-muted-foreground py-2">No expenses for {mainCategoryGroup.name} yet.</p>
                        </div>
                      ) : (
                        <ScrollArea className="flex-grow h-[100px] pr-1">
                          <ul className="space-y-1.5">
                            {expensesForThisMainGroup.map(expense => (
                              <li key={expense.id} className="flex items-center justify-between p-1.5 bg-background hover:bg-secondary/50 rounded text-xs">
                                <div className="flex flex-col">
                                  <p className="font-medium text-foreground leading-tight">{expense.name}</p>
                                  <p className="text-muted-foreground text-[11px] leading-tight">
                                    {format(new Date(expense.date), "MMM dd")} - {expense.category} 
                                  </p>
                                </div>
                                <p className={`font-semibold ${type === 'essential' ? 'text-blue-600' : 'text-orange-600'}`}>
                                  {formatCurrency(expense.amount)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {(() => {
                const uncategorizedWithinType = expenses.filter(exp => {
                    if (exp.type !== type) return false;
                    return !mainCategoryGroupsToDisplay.some(group => group.options.includes(exp.category));
                });

                if (uncategorizedWithinType.length > 0) {
                  return (
                    <div className="mt-6 pt-4 border-t">
                      <h3 className="text-md font-semibold text-muted-foreground mb-2">Other/Unmatched {type} expenses</h3>
                      <ul className="space-y-2">
                        {uncategorizedWithinType.map(expense => (
                           <li key={expense.id} className="flex items-center justify-between p-2.5 bg-background hover:bg-secondary/50 rounded-md border border-border/50 text-sm">
                              <div className="flex items-center space-x-2">
                                 <span className="p-1.5 bg-muted/50 text-muted-foreground rounded-full">
                                   {getCategoryIcon(expense.category) || <Activity className="h-4 w-4"/>}
                                 </span>
                                <div>
                                  <p className="font-medium text-foreground">{expense.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(expense.date), "MMM dd, yyyy")} - <span className="capitalize font-medium">{expense.category}</span>
                                  </p>
                                </div>
                              </div>
                              <p className={`font-semibold text-xs ${type === 'essential' ? 'text-blue-500' : 'text-orange-500'}`}>
                                {formatCurrency(expense.amount)}
                              </p>
                            </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
            })()}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
