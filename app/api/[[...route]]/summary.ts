import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { subDays, parse, differenceInDays, format } from "date-fns";
import { db } from "@/db/drizzle";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { accounts, categories, transactions } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";
import { chatSession } from "@/config/aiModel";

const analysisSchema = z.object({
  remainingAmount: z.number().nullable(),
  remainingChange: z.number().nullable(),
  incomeAmount: z.number().nullable(),
  incomeChange: z.number().nullable(),
  expenseAmount: z.number().nullable(),
  expensesChange: z.number().nullable(),
  categories: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    })
  ),
  days: z.array(
    z.object({
      date: z.string(),
      income: z.number(),
      expenses: z.number(),
    })
  ),
  accountName: z.string(),
});
interface Category {
  name: string;
  value: number;
}

interface Day {
  date: string;
  income: number;
  expenses: number;
}

interface FinancialSummary {
  accountName: string;
  remainingAmount: number | null;
  incomeAmount: number | null;
  expenseAmount: number | null;
  remainingChange: number | null;
  incomeChange: number | null;
  expensesChange: number | null;
  categories: Category[];
  days: Day[];
}
const app = new Hono()
  .get(
    "/",
    clerkMiddleware(),
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!auth?.userId) return c.json({ error: "Unauthorized" }, 401);

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30);

      const startDate = from
        ? parse(from, "yyyy-MM-dd", new Date())
        : defaultFrom;
      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

      const periodLength = differenceInDays(endDate, startDate) + 1;
      const lastPeriodStart = subDays(startDate, periodLength);
      const lastPeriodEnd = subDays(endDate, periodLength);

      async function fetchFinancialData(
        userId: string,
        startDate: Date,
        endDate: Date
      ) {
        return await db
          .select({
            income:
              sql`SUM(CASE WHEN ${transactions.amount}>=0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                Number
              ),
            expenses:
              sql`SUM(CASE WHEN ${transactions.amount}<0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                Number
              ),
            remianing: sum(transactions.amount).mapWith(Number),
          })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(
              accountId ? eq(transactions.accountId, accountId) : undefined,
              eq(accounts.userId, userId),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          );
      }

      const [currentPeriod] = await fetchFinancialData(
        auth.userId,
        startDate,
        endDate
      );

      const [lastPeriod] = await fetchFinancialData(
        auth.userId,
        lastPeriodStart,
        lastPeriodEnd
      );

      const incomeChange = calculatePercentageChange(
        currentPeriod.income,
        lastPeriod.income
      );
      const expensesChange = calculatePercentageChange(
        currentPeriod.expenses,
        lastPeriod.expenses
      );
      const remainingChange = calculatePercentageChange(
        currentPeriod.remianing,
        lastPeriod.remianing
      );

      const category = await db
        .select({
          name: categories.name,
          value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
            lt(transactions.amount, 0),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        )
        .groupBy(categories.name)
        .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

      const topCategories = category.slice(0, 3);
      const otherCategories = category.slice(3);
      const otherSum = otherCategories.reduce(
        (sum, current) => sum + current.value,
        0
      );

      const finalCategories = topCategories;
      if (otherCategories.length > 0) {
        finalCategories.push({
          name: "Other",
          value: otherSum,
        });
      }

      const activeDays = await db
        .select({
          date: transactions.date,
          income:
            sql`SUM(CASE WHEN ${transactions.amount}>=0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          expenses:
            sql`SUM(CASE WHEN ${transactions.amount}<0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(
              Number
            ),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        )
        .groupBy(transactions.date)
        .orderBy(transactions.date);

      const days = fillMissingDays(activeDays, startDate, endDate);
      let accountName = "All Accounts";
      if (accountId) {
        const accountData = await db
          .select({ name: accounts.name })
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1);
        if (accountData.length > 0) accountName = accountData[0].name;
      }
      return c.json({
        data: {
          remainingAmount: currentPeriod.remianing,
          remainingChange,
          incomeAmount: currentPeriod.income,
          incomeChange,
          expenseAmount: currentPeriod.expenses,
          expensesChange,
          categories: finalCategories,
          days,
          accountName,
        },
      });
    }
  )
  .post(
    "/generateAnalysis",
    clerkMiddleware(),
    zValidator("json", analysisSchema),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const analysisData = c.req.valid("json");
      const prompt = generatePrompt(analysisData);
      try {
        const response = await chatSession.sendMessage(prompt);

        return c.json({
          message: "Analysis generated successfully.",
          analysisResult: response,
        });
      } catch (error) {
        console.error("Error generating analysis:", error);
        return c.json({ error: "Failed to generate analysis" }, 500);
      }
    }
  );
function generatePrompt(data: FinancialSummary): string {
  const {
    accountName,
    remainingAmount,
    incomeAmount,
    expenseAmount,
    categories,
    days,
  } = data;

  const categoryInfo = categories
    .map((category) => `${category.name}: ${category.value}`)
    .join(", ");

  const dayInfo = days
    .map((day) => {
      const formattedDate = format(new Date(day.date), "dd MMMM, yyyy");
      return `${formattedDate} - Income: ${day.income}, Expenses: ${day.expenses}`;
    })
    .join("; ");

  return `
      Here is the financial summary:
      - Account Name: ${accountName}
      - Remaining Amount or Balance: ${remainingAmount}
      - Income Amount: ${incomeAmount}
      - Expense Amount: ${expenseAmount}
      - Categories: ${categoryInfo}
      - Daily Breakdown: ${dayInfo}
      
      Please provide a detailed analysis based on this summary in json format. Response must be in folowing format: {
      analysis:string
      key_points:array of string
      rating:string (poor/bad/average/good/excellent)
      suggested_improvements:array of string
      }
      Alos remember all transactions are in INR
    `;
}
export default app;
