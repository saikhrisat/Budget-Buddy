
"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { addTransactionDb, getAllTransactionsDb, deleteTransactionDb, type DBTransaction } from '@/app/services/transactionService';
import { useToast } from "@/hooks/use-toast";

// Define Income Categories
export type IncomeCategory = 
  | "Earned Income" 
  | "Business Income" 
  | "Investment Income" 
  | "Government Support" 
  | "Borrowed Money" 
  | "Gifted or Windfall Money" 
  | "Sales / Resale Income";

export const incomeCategories: IncomeCategory[] = [
  "Earned Income", 
  "Business Income", 
  "Investment Income", 
  "Government Support", 
  "Borrowed Money", 
  "Gifted or Windfall Money", 
  "Sales / Resale Income"
];

// This type is now for client-side representation if needed, DBTransaction is source of truth
export type Expense = {
  id: string; // From DBTransaction.id
  name: string; // From DBTransaction.description
  amount: number; // From DBTransaction.amount
  date: string; // From DBTransaction.date (ISO string)
  type: 'essential' | 'variable'; // This info isn't in DB, needs to be derived or simplified.
                                   // For now, all DB 'expense' type will be considered for general expense lists.
                                   // The specific 'essential'/'variable' breakdown logic might need revisiting if this distinction
                                   // is critical and not inferable from DB's 'category'.
                                   // Let's assume for now that the 'category' in DB implies this.
  category: string; // From DBTransaction.category (detailed category)
  notes?: string | null; // From DBTransaction.notes
};

export interface ExpenseCategoryGroup {
  name: string; 
  options: string[]; 
}

interface AppContextType {
  allTransactions: DBTransaction[];
  expenses: Expense[]; // Derived list of Expense objects for components
  fetchTransactions: () => Promise<void>; 
  addIncomeEntry: (newEntryData: { date: Date; sourceName: string; amount: number; note?: string; category: IncomeCategory }) => Promise<void>;
  addExpenseToList: (expenseData: { name: string; amount: number; date: Date | string; type: 'essential' | 'variable'; category: string; notes?: string }) => Promise<void>;
  deleteExpenseById: (id: string) => Promise<void>; 
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  userName: string;
  setUserName: Dispatch<SetStateAction<string>>;
  fixedCategoryGroups: ExpenseCategoryGroup[];
  variableCategoryGroups: ExpenseCategoryGroup[];
  allCategoryOptions: string[];
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Existing category definitions
const housingOptions = ['Rent / Mortgage', 'Property Taxes', 'Homeowners/Renters Insurance', 'HOA Fees', 'Home Maintenance / Repairs', 'Other Housing'];
const utilitiesOptions = ['Electricity / Gas', 'Water / Sewer', 'Internet / Cable TV', 'Mobile Phone', 'Trash / Recycling', 'Other Utilities'];
const transportationOptions = ['Car Payment', 'Car Insurance', 'Fuel (Gas/Petrol)', 'Public Transportation (Bus, Train, Metro)', 'Ride Sharing (Uber, Lyft, Ola, etc.)', 'Vehicle Maintenance / Repairs', 'Parking Fees / Tolls', 'Other Transportation'];
const debtPaymentsOptions = ['Credit Card Payments', 'Student Loans', 'Personal Loans', 'Other Loan Payments'];
const foodOptions = ['Groceries', 'Dining Out / Restaurants', 'Coffee Shops', 'Takeaway / Delivery', 'Other Food'];
const personalCareOptions = ['Haircuts / Salon', 'Toiletries / Personal Hygiene Products', 'Gym / Fitness', 'Clothing / Shoes', 'Dry Cleaning / Laundry', 'Other Personal Care'];
const entertainmentOptions = ['Streaming Services (Netflix, Spotify, etc.)', 'Movies / Cinema', 'Concerts / Events', 'Hobbies', 'Books / Music', 'Video Games', 'Other Entertainment'];
const shoppingOptions = ['General Shopping', 'Electronics', 'Home Goods', 'Gifts', 'Other Shopping'];

const defaultFixedCategoryGroups: ExpenseCategoryGroup[] = [
  { name: "Housing", options: housingOptions },
  { name: "Utilities", options: utilitiesOptions },
  { name: "Transportation", options: transportationOptions },
  { name: "Debt Payments", options: debtPaymentsOptions },
];

const defaultVariableCategoryGroups: ExpenseCategoryGroup[] = [
  { name: "Food", options: foodOptions },
  { name: "Personal Care", options: personalCareOptions },
  { name: "Entertainment", options: entertainmentOptions },
  { name: "Shopping", options: shoppingOptions },
];

const allOptions = [...defaultFixedCategoryGroups, ...defaultVariableCategoryGroups]
                    .flatMap(group => group.options);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [allTransactions, setAllTransactions] = useState<DBTransaction[]>([]);
  const [userName, setUserName] = useState<string>('Guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const transactions = await getAllTransactionsDb();
      setAllTransactions(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({ title: "Error", description: "Could not load transaction data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addIncomeEntry = async (newEntryData: { date: Date; sourceName: string; amount: number; note?: string; category: IncomeCategory }) => {
    try {
      const payload = {
        type: 'income' as 'income',
        date: newEntryData.date.toISOString(),
        amount: newEntryData.amount,
        description: newEntryData.sourceName,
        category: newEntryData.category, // This is the income category e.g. "Earned Income"
        notes: newEntryData.note || null,
      };
      await addTransactionDb(payload);
      await fetchTransactions(); 
    } catch (error) {
      console.error("Failed to add income entry:", error);
      toast({ title: "Error Adding Income", description: "Could not save income details. " + (error instanceof Error ? error.message : ""), variant: "destructive" });
      throw error; 
    }
  };
  
  const addExpenseToList = async (expenseData: { name: string; amount: number; date: Date | string; type: 'essential' | 'variable'; category: string; notes?: string }) => {
    let definitiveDateString: string;
    
    if (typeof expenseData.date === 'string') {
      const parsedDate = new Date(expenseData.date);
      if (!isNaN(parsedDate.getTime())) {
        definitiveDateString = parsedDate.toISOString();
      } else {
        console.warn(`Invalid date string received in addExpenseToList: "${expenseData.date}". Defaulting to current date.`);
        definitiveDateString = new Date().toISOString(); 
      }
    } else if (expenseData.date instanceof Date && !isNaN(expenseData.date.getTime())) {
      definitiveDateString = expenseData.date.toISOString();
    } else {
      console.warn(`Invalid date object received in addExpenseToList. Defaulting to current date.`);
      definitiveDateString = new Date().toISOString();
    }

    try {
      const payload = {
        type: 'expense' as 'expense',
        date: definitiveDateString,
        amount: expenseData.amount,
        description: expenseData.name,
        category: expenseData.category, // This is the detailed expense category e.g. "Monthly Rent"
        notes: expenseData.notes || null,
      };
      await addTransactionDb(payload);
      await fetchTransactions(); 
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({ title: "Error Adding Expense", description: "Could not save expense details. " + (error instanceof Error ? error.message : ""), variant: "destructive" });
      throw error;
    }
  };

  const deleteExpenseById = async (id: string) => { 
    try {
      await deleteTransactionDb(id);
      await fetchTransactions(); 
      toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast({ title: "Error Deleting Transaction", description: "Could not remove the transaction.", variant: "destructive" });
    }
  };

  const totalIncome = useMemo(() => {
    return allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [allTransactions]);

  const totalExpenses = useMemo(() => {
    return allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [allTransactions]);

  const availableBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  // This will be used by components like ExpenseList to show only expenses
  const expensesList: Expense[] = useMemo(() => {
    return allTransactions
      .filter(t => t.type === 'expense')
      .map(t => {
        let expenseListType: 'essential' | 'variable' = 'variable'; 
        if (defaultFixedCategoryGroups.some(group => group.options.includes(t.category))) {
            expenseListType = 'essential';
        }
        
        return {
          id: t.id,
          name: t.description,
          amount: t.amount,
          date: t.date,
          type: expenseListType, 
          category: t.category, // detailed category
          notes: t.notes,
        };
      });
  }, [allTransactions]);

  // Expose income entries derived from allTransactions for components that might specifically need them.
  const incomeEntriesList = useMemo(() => {
      return allTransactions.filter(t => t.type === 'income');
  }, [allTransactions]);


  return (
    <AppContext.Provider value={{
      allTransactions,
      expenses: expensesList, 
      fetchTransactions,
      addIncomeEntry,
      addExpenseToList,
      deleteExpenseById,
      totalIncome,
      totalExpenses,
      availableBalance,
      userName,
      setUserName,
      fixedCategoryGroups: defaultFixedCategoryGroups,
      variableCategoryGroups: defaultVariableCategoryGroups,
      allCategoryOptions: allOptions,
      isLoading,
      // incomeEntries: incomeEntriesList, // Provide if a component specifically needs only income entries.
                                         // For most cases, 'totalIncome' and 'allTransactions' should suffice.
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Removed previous Income interface as income is now part of DBTransaction
// The income-specific fields (like sourceName) are now part of the `description` and `category` in DBTransaction for income types.
