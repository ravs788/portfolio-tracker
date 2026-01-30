import { z } from 'zod';

// Settings Schema
export const SettingsSchema = z.object({
  startYear: z.number().int().min(new Date().getFullYear()).default(new Date().getFullYear()),
  horizonYears: z.number().int().min(1).max(50).default(10),
  currency: z.string().min(1).default('INR'),
  inflationRate: z.number().min(0).max(100).default(5), // percentage
});

// Income Schema
export const IncomeSchema = z.object({
  person: z.enum(['you', 'wife']),
  baseAmount: z.number().min(0),
  baseIsMonthly: z.boolean().default(true),
  annualGrowthRate: z.number().min(0).max(100).default(7), // percentage
  // Additional income components (annual) that follow the same growth rate as salary
  bonusAnnual: z.number().min(0).default(0),
  stocksAnnual: z.number().min(0).default(0),
  rsusAnnual: z.number().min(0).default(0),
});

// MonthlyExpense Schema
export const MonthlyExpenseSchema = z.object({
  name: z.string().min(1),
  amountMonthly: z.number().min(0),
  inflationLinked: z.boolean().default(true),
  tentative: z.boolean().default(false),
});

// BigExpense Schema
export const BigExpenseSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  year: z.number().int().min(0), // relative or absolute?
  recurrenceYears: z.number().int().min(0).optional(),
  inflationLinked: z.boolean().default(true),
});

 // InvestmentPlan Schema
export const SIPSchema = z.object({
  name: z.string().min(1),
  amountMonthly: z.number().min(0),
});

export const InvestmentPlanSchema = z.object({
  currentCorpus: z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).default(0),
  expectedAnnualReturn: z.number().min(0).max(100).default(8), // percentage
  contributionGrowthRate: z.number().min(0).max(100).default(0), // percentage increase of contributions per year
  sips: z.array(SIPSchema).default([]).optional(),
});

// Loan Schema
export const LoanSchema = z.object({
  name: z.string().min(1),
  principal: z.number().min(0),
  apr: z.number().min(0).max(100), // percentage
  tenureMonths: z.number().int().min(1),
  startYear: z.number().int(),
  startMonth: z.number().int().min(1).max(12).default(1),
});

// PlanInput Schema (overall)
export const PlanInputSchema = z.object({
  settings: SettingsSchema,
  incomes: z.array(IncomeSchema).min(1).max(2), // you and/or wife
  monthlyExpenses: z.array(MonthlyExpenseSchema),
  bigExpenses: z.array(BigExpenseSchema),
  investment: InvestmentPlanSchema,
  loans: z.array(LoanSchema),
});

// YearResult type (for output)
export type YearResult = {
  year: number;
  // Gross income (pre-tax)
  incomeYou: number;
  incomeWife: number;
  totalIncome: number;
  // Taxes (old regime) and final incomes
  taxYou: number;
  taxWife: number;
  totalTax: number;
  finalIncomeYou: number;
  finalIncomeWife: number;
  totalFinalIncome: number;
  // Expenses
  fixedAnnual: number;
  tentativeAnnual: number;
  bigAnnual: number;
  // Loans
  loanInterest: number;
  loanPrincipal: number;
  loansTotal: number;
  // Investments and net
  investmentContrib: number;
  netSavings: number;
  corpusEnd: number;
  // Home loan details
  homeLoanEMI: number;
  homeLoanPendingPrincipal: number;
};

export type PlanOutput = {
  results: YearResult[];
};

// Inferred types
export type Settings = z.infer<typeof SettingsSchema>;
export type Income = z.infer<typeof IncomeSchema>;
export type MonthlyExpense = z.infer<typeof MonthlyExpenseSchema>;
export type BigExpense = z.infer<typeof BigExpenseSchema>;
export type SIP = z.infer<typeof SIPSchema>;
export type InvestmentPlan = z.infer<typeof InvestmentPlanSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type PlanInput = z.infer<typeof PlanInputSchema>;
