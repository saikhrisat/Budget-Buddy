
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppContext, type Expense, type ExpenseCategoryGroup } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const expenseSchema = z.object({
  name: z.string().min(1, { message: "Expense name is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  date: z.date({ required_error: "Please select a date." }),
  type: z.enum(['essential', 'variable'], { required_error: "Please select an expense type." }),
  mainCategory: z.string().min(1, { message: "Please select a main category." }), 
  category: z.string().min(1, { message: "Detailed category is required." }), 
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const { addExpenseToList, fixedCategoryGroups, variableCategoryGroups, availableBalance } = useAppContext(); // Added availableBalance
  const { toast } = useToast();
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      amount: undefined,
      date: new Date(),
      type: undefined,
      mainCategory: "",
      category: "",
    },
  });

  const expenseType = form.watch("type");
  const selectedMainCategory = form.watch("mainCategory");

  const [availableMainCategories, setAvailableMainCategories] = useState<ExpenseCategoryGroup[]>([]);
  const [availableDetailedCategories, setAvailableDetailedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (expenseType === 'essential') {
      setAvailableMainCategories(fixedCategoryGroups);
    } else if (expenseType === 'variable') {
      setAvailableMainCategories(variableCategoryGroups);
    } else {
      setAvailableMainCategories([]);
    }
    form.setValue("mainCategory", "");
    form.setValue("category", ""); 
  }, [expenseType, fixedCategoryGroups, variableCategoryGroups, form]);

  useEffect(() => {
    const mainCatGroup = availableMainCategories.find(group => group.name === selectedMainCategory);
    if (mainCatGroup) {
      setAvailableDetailedCategories(mainCatGroup.options);
    } else {
      setAvailableDetailedCategories([]);
    }
    form.setValue("category", ""); 
  }, [selectedMainCategory, availableMainCategories, form]);

  const onSubmit = (data: ExpenseFormValues) => {
    // Check if the expense amount exceeds the available balance
    if (data.amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `The expense amount of ₹${data.amount.toFixed(2)} exceeds your available balance of ₹${availableBalance.toFixed(2)}.`,
        variant: "destructive",
      });
      return; // Prevent adding expense and closing modal
    }

    // Ensure expenseDataForContext is correctly typed and includes date as Date or string
    const expenseDataForContext: Omit<Expense, 'id'> & { date: Date | string } = {
      name: data.name,
      amount: data.amount,
      date: data.date, // This is already a Date object from react-hook-form
      type: data.type,
      category: data.category,
      // subCategory is optional, so only include if it has a value from the form (if applicable)
      // For now, assuming 'category' holds the detailed category from the last select.
    };
    addExpenseToList(expenseDataForContext);
    toast({
      title: "Expense Added",
      description: `${data.name} for ₹${data.amount.toFixed(2)} (${data.category}) has been recorded.`,
    });
    form.reset(); 
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset(); 
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg bg-card shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-primary">Add New Expense</DialogTitle>
          <DialogDescription>
            Track your spending by adding an expense with its details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[75vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name">Expense Name</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g., Monthly Rent" />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" type="number" step="0.01" {...form.register("amount")} placeholder="e.g., 1200.00" />
            {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card">
                    <Calendar mode="single" selected={field.value} onSelect={(date) => field.onChange(date || new Date())} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.date && <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>}
          </div>
          <div>
            <Label htmlFor="type">Expense Type</Label>
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="essential">Essential Expenses</SelectItem>
                    <SelectItem value="variable">Variable Expenses</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
          </div>

          {expenseType && (
            <div>
              <Label htmlFor="mainCategory">Main Category</Label>
              <Controller
                name="mainCategory"
                control={form.control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select main category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                        {availableMainCategories.map(group => (
                            <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                )}
              />
              {form.formState.errors.mainCategory && <p className="text-sm text-destructive">{form.formState.errors.mainCategory.message}</p>}
            </div>
          )}

          {selectedMainCategory && (
            <div>
              <Label htmlFor="category">Detailed Category</Label>
               <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select detailed category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                        {availableDetailedCategories.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                )}
              />
              {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Add Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

