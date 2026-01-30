import React from 'react';
import { useAppStore } from '../store';
import type { PlanInput, PlanOutput, YearResult } from '../schemas';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { addMonths, endOfYear, startOfYear, eachMonthOfInterval } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrencyIndian } from '../utils/format';

type ChartType = 'line' | 'bar' | 'area';

const Charts: React.FC = () => {
  const {
    plan,
    includeTentative,
    growthRatesYou,
    growthRatesWife,
    homeLoanPrepay,
  } = useAppStore();

  const currencyCode = plan.settings.currency || 'INR';
  const [output, setOutput] = React.useState<PlanOutput>({ results: [] });
  const [chartType, setChartType] = React.useState<ChartType>('line');

  React.useEffect(() => {
    const out = calculatePlan(plan, includeTentative, growthRatesYou, growthRatesWife, homeLoanPrepay);
    setOutput(out);
  }, [plan, includeTentative, growthRatesYou, growthRatesWife, homeLoanPrepay]);

  // Prepare data for each chart
  const totalIncomeData = React.useMemo(
    () => output.results.map((r) => ({ year: r.year, value: r.totalIncome })),
    [output.results]
  );
  const allExpensesData = React.useMemo(
    () =>
      output.results.map((r) => ({
        year: r.year,
        value: r.fixedAnnual + r.tentativeAnnual + r.bigAnnual + r.loansTotal,
      })),
    [output.results]
  );
  const homeLoanPendingPrincipalData = React.useMemo(
    () => output.results.map((r) => ({ year: r.year, value: r.homeLoanPendingPrincipal })),
    [output.results]
  );
  const totalSavingsData = React.useMemo(
    () => output.results.map((r) => ({ year: r.year, value: r.netSavings })),
    [output.results]
  );
  const totalCorpusData = React.useMemo(
    () => output.results.map((r) => ({ year: r.year, value: r.corpusEnd })),
    [output.results]
  );

  const yCurrencyFormatter = (v: number) => formatCurrencyIndian(v, currencyCode, 0);

  return (
    <Paper sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Portfolio Charts</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select
              label="Chart Type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
            >
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
              <MenuItem value="area">Area</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" component={Link} to="/results">
            Back to Results
          </Button>
          <Button variant="outlined" component={Link} to="/">
            Back to Start
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ flex: 1, overflow: 'auto' }}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Total Income" data={totalIncomeData} chartType={chartType} yFormatter={yCurrencyFormatter} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="All Expenses" data={allExpensesData} chartType={chartType} yFormatter={yCurrencyFormatter} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Home Loan - Pending Principal" data={homeLoanPendingPrincipalData} chartType={chartType} yFormatter={yCurrencyFormatter} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Total Savings (Net Savings)" data={totalSavingsData} chartType={chartType} yFormatter={yCurrencyFormatter} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Total Corpus" data={totalCorpusData} chartType={chartType} yFormatter={yCurrencyFormatter} />
        </Grid>
      </Grid>
    </Paper>
  );
};

function ChartCard({
  title,
  data,
  chartType,
  yFormatter,
}: {
  title: string;
  data: { year: number; value: number }[];
  chartType: ChartType;
  yFormatter: (v: number) => string;
}) {
  return (
    <Paper sx={{ p: 2, height: 300, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
      <Box sx={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={yFormatter} />
              <Tooltip formatter={(value: any) => [yFormatter(value as number), title]} labelFormatter={(label) => `Year: ${label}`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1976d2" dot={false} />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={yFormatter} />
              <Tooltip formatter={(value: any) => [yFormatter(value as number), title]} labelFormatter={(label) => `Year: ${label}`} />
              <Legend />
              <Bar dataKey="value" fill="#1976d2" />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={yFormatter} />
              <Tooltip formatter={(value: any) => [yFormatter(value as number), title]} labelFormatter={(label) => `Year: ${label}`} />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#1976d2" fill="#90caf9" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

/**
 * Calculation logic (kept in sync with Results.tsx to reflect per-year growth and prepayments).
 */
function calculatePlan(input: PlanInput, includeTentative: boolean, growthYou: number[], growthWife: number[], homeLoanPrepayArr: number[]): PlanOutput {
  const { settings, incomes, monthlyExpenses, bigExpenses, investment, loans } = input;
  const { startYear, horizonYears, inflationRate } = settings;
  const endYear = startYear + horizonYears - 1;
  const results: YearResult[] = [];

  const yearlyLoans = calculateYearlyLoans(loans, startYear, endYear, homeLoanPrepayArr);
  const yearlyInvestments = calculateYearlyInvestments(investment, startYear, horizonYears);

  const homeLoan = loans.find((l) => l.name.toLowerCase().includes('home'));
  let homeAmortization: MonthlyAmortization[] = [];
  if (homeLoan) {
    homeAmortization = amortizeLoan(homeLoan, startYear, homeLoanPrepayArr);
  }

  for (let i = 0; i < horizonYears; i++) {
    const y = startYear + i;

    const incomeYou = calculateIncome(incomes.find((inc) => inc.person === 'you'), growthYou, i);
    const incomeWife = calculateIncome(incomes.find((inc) => inc.person === 'wife'), growthWife, i);
    const totalIncome = incomeYou + incomeWife;

    const fixedAnnual = calculateAnnualExpenses(monthlyExpenses.filter((exp) => !exp.tentative), i, inflationRate);
    const tentativeAnnual = includeTentative ? calculateAnnualExpenses(monthlyExpenses.filter((exp) => exp.tentative), i, inflationRate) : 0;
    const bigAnnual = calculateBigExpenses(bigExpenses, y, startYear, inflationRate);

    const { loanInterest, loanPrincipal } = yearlyLoans[y] || { loanInterest: 0, loanPrincipal: 0 };
    const loansTotal = loanInterest + loanPrincipal;

    const { investmentContrib, corpusEnd } = yearlyInvestments[i];

    const taxYou = calculateTaxOldRegime(incomeYou);
    const taxWife = calculateTaxOldRegime(incomeWife);
    const totalTax = taxYou + taxWife;
    const finalIncomeYou = incomeYou - taxYou;
    const finalIncomeWife = incomeWife - taxWife;
    const totalFinalIncome = finalIncomeYou + finalIncomeWife;

    const netSavings = totalFinalIncome - (fixedAnnual + tentativeAnnual + bigAnnual + loansTotal + investmentContrib);

    let homeLoanEMI = 0;
    let homeLoanPendingPrincipal = 0;
    if (homeLoan) {
      const yearMonths = homeAmortization.filter((m) => m.year === y);
      if (yearMonths.length > 0) {
        homeLoanEMI = yearMonths.reduce((sum, m) => sum + m.interest + m.principal, 0);
        homeLoanPendingPrincipal = yearMonths[yearMonths.length - 1].balance;
      }
    }

    results.push({
      year: y,
      incomeYou,
      incomeWife,
      totalIncome,
      taxYou,
      taxWife,
      totalTax,
      finalIncomeYou,
      finalIncomeWife,
      totalFinalIncome,
      fixedAnnual,
      tentativeAnnual,
      bigAnnual,
      loanInterest,
      loanPrincipal,
      loansTotal,
      investmentContrib,
      netSavings,
      corpusEnd,
      homeLoanEMI,
      homeLoanPendingPrincipal,
    });
  }

  return { results };
}

function calculateIncome(inc: PlanInput['incomes'][0] | undefined, growthRates: number[], yearIndex: number): number {
  if (!inc) return 0;
  const baseAnnual = inc.baseIsMonthly ? inc.baseAmount * 12 : inc.baseAmount;
  let factor = 1;
  for (let j = 0; j < yearIndex; j++) {
    const raw = growthRates[j];
    const rate = raw === undefined || raw === null || isNaN(Number(raw)) ? 0 : Number(raw) / 100;
    factor *= 1 + rate;
  }
  const salary = baseAnnual * factor;
  const bonus = (inc.bonusAnnual || 0) * factor;
  const stocks = (inc.stocksAnnual || 0) * factor;
  const rsus = (inc.rsusAnnual || 0) * factor;
  return salary + bonus + stocks + rsus;
}

function calculateAnnualExpenses(exps: PlanInput['monthlyExpenses'], i: number, inflationRate: number): number {
  return exps.reduce((sum, exp) => {
    const annual = exp.amountMonthly * 12;
    const adjusted = exp.inflationLinked ? annual * Math.pow(1 + inflationRate / 100, i) : annual;
    return sum + adjusted;
  }, 0);
}

function calculateTaxOldRegime(grossIncome: number): number {
  const standardDeduction = 50000;
  const slab1 = 250000;
  const slab2 = 500000;
  const slab3 = 1000000;

  let taxable = Math.max(0, grossIncome - standardDeduction);
  let tax = 0;

  if (taxable <= slab1) {
    tax = 0;
  } else if (taxable <= slab2) {
    tax = (taxable - slab1) * 0.05;
  } else if (taxable <= slab3) {
    tax = (slab2 - slab1) * 0.05 + (taxable - slab2) * 0.20;
  } else {
    tax = (slab2 - slab1) * 0.05 + (slab3 - slab2) * 0.20 + (taxable - slab3) * 0.30;
  }

  if (taxable <= 500000) {
    tax = 0;
  }

  const cess = tax * 0.04;
  return tax + cess;
}

function calculateBigExpenses(bigExps: PlanInput['bigExpenses'], year: number, startYear: number, inflationRate: number): number {
  return bigExps.reduce((sum, exp) => {
    const firstYear = exp.year >= 1900 ? exp.year : startYear + exp.year;
    if (year < firstYear) return sum;
    const occurs = exp.recurrenceYears ? (year - firstYear) % exp.recurrenceYears === 0 : year === firstYear;
    if (!occurs) return sum;
    const yearsSinceFirst = year - firstYear;
    const adjusted = exp.inflationLinked ? exp.amount * Math.pow(1 + inflationRate / 100, yearsSinceFirst) : exp.amount;
    return sum + adjusted;
  }, 0);
}

function calculateYearlyLoans(loans: PlanInput['loans'], startYear: number, endYear: number, homeLoanPrepayArr: number[]): Record<number, { loanInterest: number; loanPrincipal: number }> {
  const yearly: Record<number, { loanInterest: number; loanPrincipal: number }> = {};
  loans.forEach((loan) => {
    const isHome = loan.name.toLowerCase().includes('home');
    const amortization = isHome ? amortizeLoan(loan, startYear, homeLoanPrepayArr) : amortizeLoan(loan);
    for (let y = startYear; y <= endYear; y++) {
      if (!yearly[y]) yearly[y] = { loanInterest: 0, loanPrincipal: 0 };
      const yearMonths = amortization.filter((m) => m.year === y);
      const interest = yearMonths.reduce((sum, m) => sum + m.interest, 0);
      const principal = yearMonths.reduce((sum, m) => sum + m.principal, 0);
      yearly[y].loanInterest += interest;
      yearly[y].loanPrincipal += principal;
    }
  });
  return yearly;
}

type MonthlyAmortization = {
  month: number;
  year: number;
  interest: number;
  principal: number;
  balance: number;
};

function amortizeLoan(loan: PlanInput['loans'][0], planStartYear?: number, prepayArr?: number[]): MonthlyAmortization[] {
  const { principal, apr, tenureMonths, startYear, startMonth } = loan;
  const monthlyRate = apr / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  let balance = principal;
  const amortization: MonthlyAmortization[] = [];
  let currentDate = new Date(startYear, startMonth - 1, 1);

  for (let m = 1; m <= tenureMonths && balance > 0; m++) {
    if (prepayArr && planStartYear !== undefined && currentDate.getMonth() === 0) {
      const idx = currentDate.getFullYear() - planStartYear;
      const prepay = prepayArr[idx] || 0;
      if (prepay > 0) {
        balance -= prepay;
        if (balance < 0) balance = 0;
      }
    }
    const interest = balance * monthlyRate;
    const principalPay = emi - interest;
    balance -= principalPay;
    if (balance < 0) balance = 0;
    amortization.push({
      month: m,
      year: currentDate.getFullYear(),
      interest,
      principal: principalPay,
      balance,
    });
    currentDate = addMonths(currentDate, 1);
  }
  return amortization;
}

function calculateYearlyInvestments(invest: PlanInput['investment'], startYear: number, horizonYears: number): { investmentContrib: number; corpusEnd: number }[] {
  const { currentCorpus, monthlyContribution, expectedAnnualReturn, contributionGrowthRate, sips } = invest;
  const sipMonthly = Array.isArray(sips) ? sips.reduce((sum, s) => sum + (s?.amountMonthly || 0), 0) : 0;
  const baseMonthly = monthlyContribution + sipMonthly;

  const monthlyRate = expectedAnnualReturn / 12 / 100;
  const growth = (contributionGrowthRate || 0) / 100;

  let corpus = currentCorpus;
  const yearly: { investmentContrib: number; corpusEnd: number }[] = [];
  let currentDate = new Date(startYear, 0, 1);

  for (let y = 0; y < horizonYears; y++) {
    // Apply yearly growth to monthly contributions at the start of each calendar year
    const effectiveMonthly = baseMonthly * Math.pow(1 + growth, y);
    let contribThisYear = 0;
    const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
    months.forEach(() => {
      corpus += effectiveMonthly;
      contribThisYear += effectiveMonthly;
      corpus *= 1 + monthlyRate;
    });
    yearly.push({ investmentContrib: contribThisYear, corpusEnd: corpus });
    currentDate = addMonths(currentDate, 12);
  }
  return yearly;
}

export default Charts;
