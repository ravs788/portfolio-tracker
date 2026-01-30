import { create } from 'zustand';

import type { PlanInput, PlanOutput } from './schemas';

type AppState = {
  plan: PlanInput;
  calculated: PlanOutput | null;
  setPlan: (plan: PlanInput) => void;
  updatePlan: (partial: Partial<PlanInput>) => void;
  setCalculated: (output: PlanOutput) => void;
  reset: () => void;
  includeTentative: boolean;
  setIncludeTentative: (include: boolean) => void;
  // Per-person per-year growth rates (years after startYear). Length = horizonYears - 1
  growthRatesYou: number[];
  growthRatesWife: number[];
  setGrowthRatesYou: (rates: number[]) => void;
  setGrowthRatesWife: (rates: number[]) => void;
  // Home loan prepayment (calendar years from startYear). Length = horizonYears
  homeLoanPrepay: number[];
  setHomeLoanPrepay: (arr: number[]) => void;
  setHomeLoanPrepayAt: (index: number, amount: number) => void;
};

const defaultPlan: PlanInput = {
  settings: {
    startYear: new Date().getFullYear(),
    horizonYears: 10,
    currency: 'INR',
    inflationRate: 5,
  },
  incomes: [
    { person: 'you', baseAmount: 0, baseIsMonthly: true, annualGrowthRate: 7, bonusAnnual: 0, stocksAnnual: 0, rsusAnnual: 0 },
    { person: 'wife', baseAmount: 0, baseIsMonthly: true, annualGrowthRate: 7, bonusAnnual: 0, stocksAnnual: 0, rsusAnnual: 0 },
  ],
  monthlyExpenses: [
    { name: 'Grocery + Food', amountMonthly: 0, inflationLinked: true, tentative: false },
    { name: 'Gas + Travel', amountMonthly: 0, inflationLinked: true, tentative: false },
    { name: 'Shopping', amountMonthly: 0, inflationLinked: true, tentative: false },
    { name: 'Services', amountMonthly: 0, inflationLinked: true, tentative: false },
  ],
  bigExpenses: [
    { name: 'School Fees', amount: 0, year: 0, inflationLinked: true },
  ],
  investment: {
    currentCorpus: 0,
    monthlyContribution: 0,
    expectedAnnualReturn: 8,
    contributionGrowthRate: 0,
    sips: [
      { name: 'SIP (you)', amountMonthly: 0 },
      { name: 'SIP (wife)', amountMonthly: 0 },
    ],
  },
  loans: [
    { name: 'Home Loan', principal: 0, apr: 0, tenureMonths: 0, startYear: new Date().getFullYear(), startMonth: 1 },
  ],
};

export const useAppStore = create<AppState>((set) => ({
  plan: defaultPlan,
  calculated: null,
  setPlan: (plan: PlanInput) => set({ plan }),
  updatePlan: (partial: Partial<PlanInput>) => set((state: AppState) => ({ plan: { ...state.plan, ...partial } })),
  setCalculated: (output: PlanOutput) => set({ calculated: output }),
  reset: () => set({ plan: defaultPlan, calculated: null }),
  includeTentative: true,
  setIncludeTentative: (include: boolean) => set({ includeTentative: include }),
  growthRatesYou: Array(defaultPlan.settings.horizonYears - 1).fill(defaultPlan.incomes[0].annualGrowthRate),
  growthRatesWife: Array(defaultPlan.settings.horizonYears - 1).fill(defaultPlan.incomes[1].annualGrowthRate),
  setGrowthRatesYou: (rates: number[]) => set({ growthRatesYou: rates }),
  setGrowthRatesWife: (rates: number[]) => set({ growthRatesWife: rates }),
  homeLoanPrepay: Array(defaultPlan.settings.horizonYears).fill(0),
  setHomeLoanPrepay: (arr: number[]) => set({ homeLoanPrepay: arr }),
  setHomeLoanPrepayAt: (index: number, amount: number) => set((state: AppState) => {
    const arr = [...state.homeLoanPrepay];
    arr[index] = amount;
    return { homeLoanPrepay: arr };
  }),
}));
