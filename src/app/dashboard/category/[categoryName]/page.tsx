
"use client";

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppContext, type Expense, type ExpenseCategoryGroup } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Download, BarChart3, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

// Helper function to find the main category group details
const findMainCategoryGroup = (categoryNameSlug: string, type: string | null, fixedGroups: ExpenseCategoryGroup[], variableGroups: ExpenseCategoryGroup[]): ExpenseCategoryGroup | undefined => {
    const groups = type === 'essential' ? fixedGroups : variableGroups;
    return groups.find(g => g.name.toLowerCase().replace(/\s+/g, '-') === categoryNameSlug);
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export default function CategoryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const categoryNameSlug = params.categoryName as string;
    const expenseType = searchParams.get('type'); // 'essential' or 'variable'

    const {
        expenses,
        deleteExpenseById,
        fixedCategoryGroups,
        variableCategoryGroups,
        userName
    } = useAppContext();

    const mainCategoryGroup = findMainCategoryGroup(categoryNameSlug, expenseType, fixedCategoryGroups, variableCategoryGroups);

    if (!mainCategoryGroup) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <Info className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-semibold text-destructive mb-2">Category Not Found</h1>
                <p className="text-muted-foreground mb-6">The category details you are looking for could not be found.</p>
                <Button onClick={() => router.push('/dashboard')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>
        );
    }

    const categoryExpenses = expenses.filter(
        exp => exp.type === expenseType && mainCategoryGroup.options.includes(exp.category)
    );

    const totalForCategory = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const handleDelete = (id: string, name: string) => {
        deleteExpenseById(id);
        toast({
            title: "Expense Deleted",
            description: `${name} has been removed from your expenses.`,
        });
    };

    const handleDownloadReceipt = () => {
        const receiptTitle = `${mainCategoryGroup.name} Expenses Receipt`;
        let receiptContent = `${receiptTitle}
`;
        receiptContent += `User: ${userName}
`;
        receiptContent += `Date Generated: ${format(new Date(), 'PPP p')}
`;
        receiptContent += `--------------------------------------------------
`;
        receiptContent += `Date       | Expense Name         | Detailed Category    | Amount (₹)
`;
        receiptContent += `--------------------------------------------------
`;

        categoryExpenses.forEach(exp => {
            const dateStr = format(new Date(exp.date), 'yyyy-MM-dd').padEnd(10);
            const nameStr = exp.name.padEnd(20);
            const detailCatStr = exp.category.padEnd(20);
            const amountStr = formatCurrency(exp.amount).padStart(12);
            receiptContent += `${dateStr} | ${nameStr} | ${detailCatStr} | ${amountStr}
`;
        });
        receiptContent += `--------------------------------------------------
`;
        receiptContent += `Total for ${mainCategoryGroup.name}: ${formatCurrency(totalForCategory).padStart(40)}
`;

        // **Limitation**: Actual PDF generation and download requires client-side libraries (e.g., jspdf)
        // or a backend service. This tool environment cannot directly execute such browser-specific actions.
        // For now, we will log the receipt content to the console and show a toast.
        console.log("--- RECEIPT CONTENT ---");
        console.log(receiptContent);
        // navigator.clipboard.writeText(receiptContent); // Alternative: copy to clipboard
        
        toast({
            title: "Download Receipt Initiated (Simulated)",
            description: "Receipt content has been prepared. Check console for details. Actual PDF download requires browser capabilities not available in this environment.",
            duration: 7000,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-background p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="mb-4 hover:bg-muted/50">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="bg-card p-6 rounded-xl shadow-xl border border-border/50">
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1">{mainCategoryGroup.name} Expenses</h1>
                    <p className="text-muted-foreground text-lg">Total Spent in {mainCategoryGroup.name}: <span className="font-semibold text-foreground">{formatCurrency(totalForCategory)}</span></p>
                </div>
            </header>

            <Card className="shadow-xl border border-border/50">
                <CardHeader>
                    <CardTitle>Expense Entries</CardTitle>
                    <CardDescription>All recorded expenses for {mainCategoryGroup.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {categoryExpenses.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <Info className="mx-auto h-10 w-10 mb-2" />
                            <p>No expenses recorded in {mainCategoryGroup.name} yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Expense Name</TableHead>
                                    <TableHead>Detailed Category</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoryExpenses.map((expense) => (
                                    <TableRow key={expense.id} className="hover:bg-muted/30">
                                        <TableCell>{format(new Date(expense.date), 'PP')}</TableCell>
                                        <TableCell className="font-medium">{expense.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{expense.category}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the expense "{expense.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(expense.id, expense.name)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Download className="mr-2 h-5 w-5 text-primary" />
                            Download Receipt
                        </CardTitle>
                        <CardDescription>Download a summary of your {mainCategoryGroup.name} expenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleDownloadReceipt} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            Download as PDF (Simulated)
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">Note: Actual PDF download is simulated in this environment. Receipt content will be logged to the console.</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 h-5 w-5 text-accent" />
                            Next Month Spending Prediction
                        </CardTitle>
                        <CardDescription>Estimated spending for {mainCategoryGroup.name} next month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <p className="text-2xl font-bold text-accent">₹X,XXX.XX</p>
                            <p className="text-sm text-muted-foreground">(Prediction feature coming soon!)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
