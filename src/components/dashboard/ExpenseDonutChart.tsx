"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription // Import CardDescription if needed
} from '@/components/ui/card';
import { Expense, useAppContext } from '@/contexts/AppContext';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

interface ExpenseDonutChartProps {
  expenses: Expense[];
}

const ALLOWED_CATEGORIES = new Set([
  "Housing", "Utilities", "Transportation", "Debt Payments",
  "Food", "Personal Care", "Entertainment", "Shopping"
]);

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

const buildCategoryMapping = (fixedGroups: any[], variableGroups: any[]) => {
  const mapping: { [key: string]: string } = {};
  const allGroups = [...fixedGroups, ...variableGroups];
  allGroups.forEach(group => {
    if (group && group.name && Array.isArray(group.options)) {
        mapping[group.name] = group.name;
        group.options.forEach((option: string) => {
            if (option) mapping[option] = group.name;
        });
    }
  });
  return mapping;
};

interface LegendEntryPayload { value: number; }
interface LegendEntry { value: string; color: string; payload: LegendEntryPayload; }
interface CustomLegendProps { payload?: LegendEntry[]; }

// Custom Legend Component - Refined Styling
const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  if (!payload || payload.length === 0) return null;
  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  const totalDisplayedValue = payload.reduce((sum: number, entry: LegendEntry) => {
    const value = entry?.payload?.value;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  return (
    // Added padding-bottom to create space below legend
    <div className="mt-3 mb-1 w-full px-3 sm:px-4 pb-2">
      {/* Reduced space-y */}
      <ul className="flex flex-col space-y-1 text-xs sm:text-sm">
        {payload.map((entry: LegendEntry, index: number) => {
          const entryValue = entry?.payload?.value;
          const numericValue = typeof entryValue === 'number' ? entryValue : 0;
          const percentage = totalDisplayedValue === 0 ? 0 : (numericValue / totalDisplayedValue) * 100;
          return (
            // Reduced vertical padding (py-1 -> py-0.5 or py-1), increased gap
            <li key={`item-${index}`} className="flex items-center justify-between py-1 border-b border-dashed border-border/80 last:border-b-0">
              {/* Increased gap between indicator and text */}
              <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color ?? 'hsl(var(--muted))' }}
                />
                {/* Adjusted font size/color */}
                <span className="text-muted-foreground text-[13px] truncate" title={String(entry.value ?? '')}>
                  {String(entry.value ?? 'N/A')} ({percentage.toFixed(1)}%)
                </span>
              </div>
              {/* Adjusted font size/weight */}
              <span className="font-medium text-sm text-right pl-2 tabular-nums">
                {currencyFormatter.format(numericValue)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({ expenses }) => {
  const { fixedCategoryGroups, variableCategoryGroups } = useAppContext();
  const validExpenses = Array.isArray(expenses) ? expenses : [];
  const categoryMap = React.useMemo(
      () => buildCategoryMapping(fixedCategoryGroups, variableCategoryGroups),
      [fixedCategoryGroups, variableCategoryGroups]
  );

  const topCategoriesData = React.useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    validExpenses.forEach(expense => {
      if (expense && typeof expense.amount === 'number') {
        const potentialCat = (expense as any).subCategory || expense.category;
        const mainCategory = potentialCat ? categoryMap[potentialCat] : undefined;
        if (mainCategory && ALLOWED_CATEGORIES.has(mainCategory)) {
          categoryTotals[mainCategory] = (categoryTotals[mainCategory] || 0) + expense.amount;
        }
      }
    });
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [validExpenses, categoryMap]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    topCategoriesData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [topCategoriesData]);

  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  // --- Placeholder for No Data --- START
  if (topCategoriesData.length === 0) {
    return (
      // Use flexbox for vertical centering in placeholder
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-center text-lg sm:text-xl font-semibold">Top 4 Expense Categories</CardTitle>
          {/* Optional: Add description here if needed */}
          {/* <CardDescription className="text-center text-xs sm:text-sm text-muted-foreground">Breakdown of main spending areas</CardDescription> */}
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground italic">No relevant expense data to display.</p>
        </CardContent>
      </Card>
    );
  }
  // --- Placeholder for No Data --- END

  return (
    // Removed fixed height, use flex column, add pb for internal spacing
    <Card className="flex flex-col h-full pb-0">
      {/* Adjust header padding */}
      <CardHeader className="items-center pb-2 pt-4">
        <CardTitle className="text-center text-lg sm:text-xl font-semibold">Top 4 Expense Categories</CardTitle>
        {/* Optional Description */} 
        {/* <CardDescription className="text-center text-xs sm:text-sm text-muted-foreground">Highest spending categories</CardDescription> */}
      </CardHeader>
      {/* Content area: Use flex-1 for chart, prevent shrinking of legend */}
      <CardContent className="flex-1 flex flex-col items-center justify-center px-2 pt-0 pb-1">
        {/* Chart container takes flexible space */} 
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[230px] sm:max-w-[280px] flex-1"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent
                            hideLabel
                            indicator="dot"
                            nameKey="name"
                            formatter={(value, name, props) => {
                                const label = props?.payload?.name ?? 'N/A';
                                const amount = typeof value === 'number' ? value : 0;
                                return `${label}: ${currencyFormatter.format(amount)}`;
                            }}
                         />}
              />
              <Pie
                data={topCategoriesData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="95%" // Slightly adjust radius
                strokeWidth={1}
                stroke="hsl(var(--border))"
              >
                {topCategoriesData.map((entry, index) => {
                  const name = String(entry.name ?? 'N/A');
                  const value = typeof entry.value === 'number' ? entry.value : 0;
                  const formattedValue = currencyFormatter.format(value);
                  return (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                      role="img"
                      aria-label={`${name}: ${formattedValue}`}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Custom Legend takes remaining space, does not shrink */}
        <div className="w-full flex-shrink-0">
            <CustomLegend payload={topCategoriesData.map((entry, index) => ({
                value: String(entry.name ?? 'N/A'),
                color: COLORS[index % COLORS.length],
                payload: { value: typeof entry.value === 'number' ? entry.value : 0 }
            }))} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseDonutChart;
