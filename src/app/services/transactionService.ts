// src/app/services/transactionService.ts
'use server';

import { getDbConnection } from '@/lib/db';
import type { IncomeCategory } from '@/contexts/AppContext'; // Assuming this might be used for category validation if strict
import { z } from 'zod';

// Define the structure of a transaction for database interaction
export interface DBTransaction {
  id: string;
  userId: string; // For future multi-user support, default for now
  type: 'income' | 'expense';
  date: string; // ISO 8601 string
  amount: number; // Always positive
  description: string; // Source name for income, expense name for expense
  category: string; // Income category or expense category (using the detailed expense categories)
  notes?: string | null; // Optional
  createdAt: string; // ISO 8601 string
}

// Schema for validating new transaction data (excluding server-generated fields like id, userId, createdAt)
const NewTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  date: z.string().datetime(), // Validates ISO 8601 date-time string
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().min(1),
  notes: z.string().optional().nullable(),
});
type NewTransactionPayload = z.infer<typeof NewTransactionSchema>;


export async function addTransactionDb(transactionData: NewTransactionPayload): Promise<DBTransaction> {
  const validatedData = NewTransactionSchema.parse(transactionData); // Validate input
  const db = await getDbConnection();

  const newId = crypto.randomUUID();
  const userId = 'default_user'; // Placeholder for single-user mode
  const createdAt = new Date().toISOString();

  const newDbTransaction: DBTransaction = {
    id: newId,
    userId,
    ...validatedData,
    notes: validatedData.notes ?? null, // Ensure null if undefined
    createdAt,
  };

  await db.run(
    `INSERT INTO transactions (id, userId, type, date, amount, description, category, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newDbTransaction.id,
    newDbTransaction.userId,
    newDbTransaction.type,
    newDbTransaction.date,
    newDbTransaction.amount,
    newDbTransaction.description,
    newDbTransaction.category,
    newDbTransaction.notes,
    newDbTransaction.createdAt
  );

  return newDbTransaction;
}

export async function getAllTransactionsDb(): Promise<DBTransaction[]> {
  const db = await getDbConnection();
  const transactions = await db.all<DBTransaction[]>(
    'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC' // Order by transaction date, then by creation time
  );
  return transactions;
}

export async function deleteTransactionDb(id: string): Promise<{ success: boolean }> {
  const db = await getDbConnection();
  const result = await db.run('DELETE FROM transactions WHERE id = ? AND userId = ?', id, 'default_user');
  
  if (result.changes === 0) {
    // Optional: throw error or return more specific info if delete failed (e.g. ID not found)
    console.warn(`Attempted to delete transaction with id ${id}, but no rows were affected.`);
    return { success: false };
  }
  return { success: true };
}

// Example of a more specific query if needed later
export async function getIncomeTransactionsDb(): Promise<DBTransaction[]> {
  const db = await getDbConnection();
  return db.all<DBTransaction[]>("SELECT * FROM transactions WHERE type = 'income' AND userId = ? ORDER BY date DESC", 'default_user');
}

export async function getExpenseTransactionsDb(): Promise<DBTransaction[]> {
  const db = await getDbConnection();
  return db.all<DBTransaction[]>("SELECT * FROM transactions WHERE type = 'expense' AND userId = ? ORDER BY date DESC", 'default_user');
}
