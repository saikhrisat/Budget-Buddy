
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppContext, incomeCategories, type IncomeCategory } from '@/contexts/AppContext'; // Import incomeCategories
import { useToast } from "@/hooks/use-toast";

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigateToDashboardOnSubmit?: boolean;
}

// Use the imported incomeCategories for the enum
const incomeSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  sourceName: z.string().min(1, { message: "Source name is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  note: z.string().optional(),
  category: z.enum(incomeCategories as [IncomeCategory, ...IncomeCategory[]], { // Zod enum needs a non-empty array
    required_error: "Please select a category." 
  }),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export function IncomeModal({ isOpen, onClose, navigateToDashboardOnSubmit = true }: IncomeModalProps) {
  const router = useRouter();
  const { addIncomeEntry } = useAppContext();
  const { toast } = useToast();
  
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date(),
      sourceName: "",
      amount: undefined,
      note: "",
      category: undefined,
    },
  });

  const onSubmit = (data: IncomeFormValues) => {
    // The date from the form is already a Date object.
    // addIncomeEntry will handle converting it to ISO string.
    addIncomeEntry({ 
      date: data.date, 
      sourceName: data.sourceName,
      amount: data.amount,
      note: data.note || "", // Ensure note is a string
      category: data.category 
    });
    toast({
      title: "Money Added",
      description: `${data.sourceName} (₹${data.amount.toFixed(2)}) has been successfully added to your income.`,
      variant: "default", 
    });
    form.reset();
    onClose();
    if (navigateToDashboardOnSubmit) {
      router.push('/dashboard');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-primary">Add New Income</DialogTitle>
          <DialogDescription>
            Enter the details of the money received.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[75vh] overflow-y-auto pr-2">
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
            <Label htmlFor="sourceName">Source Name</Label>
            <Input id="sourceName" {...form.register("sourceName")} placeholder="e.g., Monthly Salary, Client X" />
            {form.formState.errors.sourceName && <p className="text-sm text-destructive">{form.formState.errors.sourceName.message}</p>}
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" type="number" step="0.01" {...form.register("amount")} placeholder="e.g., 5000.00" />
            {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {incomeCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
          </div>

          <div>
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea id="note" {...form.register("note")} placeholder="e.g., Bonus for Q2, Reimbursement for travel" />
            {form.formState.errors.note && <p className="text-sm text-destructive">{form.formState.errors.note.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => {form.reset(); onClose();}}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Add Income</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
