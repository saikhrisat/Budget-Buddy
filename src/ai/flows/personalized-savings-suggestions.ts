'use server';

/**
 * @fileOverview Provides personalized savings suggestions based on spending habits.
 *
 * - personalizedSavingsSuggestions - A function that generates personalized savings suggestions.
 * - PersonalizedSavingsSuggestionsInput - The input type for the personalizedSavingsSuggestions function.
 * - PersonalizedSavingsSuggestionsOutput - The return type for the personalizedSavingsSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedSavingsSuggestionsInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A detailed breakdown of the user\'s spending habits, including categories and amounts spent in each category.'
    ),
  financialGoals: z
    .string()
    .describe('The user\'s stated financial goals, such as saving for a down payment or paying off debt.'),
});
export type PersonalizedSavingsSuggestionsInput = z.infer<typeof PersonalizedSavingsSuggestionsInputSchema>;

const PersonalizedSavingsSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of personalized savings suggestions.'),
});
export type PersonalizedSavingsSuggestionsOutput = z.infer<typeof PersonalizedSavingsSuggestionsOutputSchema>;

export async function personalizedSavingsSuggestions(input: PersonalizedSavingsSuggestionsInput): Promise<PersonalizedSavingsSuggestionsOutput> {
  return personalizedSavingsSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedSavingsSuggestionsPrompt',
  input: {schema: PersonalizedSavingsSuggestionsInputSchema},
  output: {schema: PersonalizedSavingsSuggestionsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's spending habits and financial goals to provide personalized savings suggestions.

Spending Data: {{{spendingData}}}
Financial Goals: {{{financialGoals}}}

Provide specific, actionable advice to help the user save money and achieve their goals. List the suggestions in bullet points.
`, // Ensure bullet points are used
});

const personalizedSavingsSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedSavingsSuggestionsFlow',
    inputSchema: PersonalizedSavingsSuggestionsInputSchema,
    outputSchema: PersonalizedSavingsSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
