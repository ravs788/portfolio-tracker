import type { PlanInput, YearResult, PlanOutput } from './schemas';
import { addMonths, endOfYear, startOfYear, eachMonthOfInterval } from 'date-fns';

export function calculatePlan(input: PlanInput, includeTentative: boolean): PlanOutput {
  const { settings, incomes, monthlyExpenses, bigExpenses, investment, loans } = input;
  const { startYear, horizonYears, inflationRate } = settings;
  const endYear = startYear + horizonYears - 1;
  const results: YearResult[] = [];

  // Precompute loan amortizations
  const yearlyLoans = calculateYearlyLoans(loans, startYear, endYear);

  // Precompute investment projections
  const yearlyInvestments = calculateYearlyInvestments(investment, startYear, horizonYears);

  // Precompute home loan amortization if exists
  const homeLoan = loans.find(l => l.name.toLowerCase().includes('home'));
  let homeAmortization: MonthlyAmortization[] = [];
  if (homeLoan) {
    homeAmortization = amortizeLoan(homeLoan);
  }

  for (let y = startYear; y <= endYear; y++) {
    const i = y - startYear;

    // Incomes
    const incomeYou = calculateIncome(incomes.find(inc => inc.person === 'you'), i);
    const incomeWife = calculateIncome(incomes.find(inc => inc.person === 'wife'), i);
    const totalIncome = incomeYou + incomeWife;

    // Expenses
    const fixedAnnual = calculateAnnualExpenses(monthlyExpenses.filter(exp => !exp.tentative), i, inflationRate);
    const tentativeAnnual = includeTentative ? calculateAnnualExpenses(monthlyExpenses.filter(exp => exp.tentative), i, inflationRate) : 0;
    const bigAnnual = calculateBigExpenses(bigExpenses, y, startYear, inflationRate);

    // Loans
    const { loanInterest, loanPrincipal } = yearlyLoans[y] || { loanInterest: 0, loanPrincipal: 0 };
    const loansTotal = loanInterest + loanPrincipal;

    // Investments
    const { investmentContrib, corpusEnd } = yearlyInvestments[i];

    // Taxes and final incomes (old regime)
    const taxYou = calculateTaxOldRegime(incomeYou);
    const taxWife = calculateTaxOldRegime(incomeWife);
    const totalTax = taxYou + taxWife;
    const finalIncomeYou = incomeYou - taxYou;
    const finalIncomeWife = incomeWife - taxWife;
    const totalFinalIncome = finalIncomeYou + finalIncomeWife;

    // Net (after tax)
    const netSavings = totalFinalIncome - (fixedAnnual + tentativeAnnual + bigAnnual + loansTotal + investmentContrib);

    // Home loan specifics
    let homeLoanEMI = 0;
    let homeLoanPendingPrincipal = 0;
    if (homeAmortization.length > 0) {
      const yearMonths = homeAmortization.filter(m => m.year === y);
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

function calculateIncome(inc: PlanInput['incomes'][0] | undefined, i: number): number {
  if (!inc) return 0;
  const baseAnnual = inc.baseIsMonthly ? inc.baseAmount * 12 : inc.baseAmount;
  const factor = Math.pow(1 + inc.annualGrowthRate / 100, i);
  const salary = baseAnnual * factor;
  const bonus = ((inc as any).bonusAnnual || 0) * factor;
  const stocks = ((inc as any).stocksAnnual || 0) * factor;
  const rsus = ((inc as any).rsusAnnual || 0) * factor;
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
  // Standard deduction (salaried individuals)
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

  // Rebate u/s 87A if taxable income up to ₹5,00,000
  if (taxable <= 500000) {
    tax = 0;
  }

  // Health & Education Cess @ 4%
  const cess = tax * 0.04;
  return tax + cess;
}

function calculateBigExpenses(bigExps: PlanInput['bigExpenses'], year: number, startYear: number, inflationRate: number): number {
  // Interpret exp.year as absolute calendar year if it looks like a real year (>= 1900),
  // otherwise treat it as an offset from startYear.
  return bigExps.reduce((sum, exp) => {
    const firstYear = exp.year >= 1900 ? exp.year : startYear + exp.year;
    if (year < firstYear) return sum;
    const occurs = exp.recurrenceYears
      ? (year - firstYear) % exp.recurrenceYears === 0
      : year === firstYear;
    if (!occurs) return sum;
    const yearsSinceFirst = year - firstYear;
    const adjusted = exp.inflationLinked ? exp.amount * Math.pow(1 + inflationRate / 100, yearsSinceFirst) : exp.amount;
    return sum + adjusted;
  }, 0);
}

function calculateYearlyLoans(loans: PlanInput['loans'], startYear: number, endYear: number): Record<number, { loanInterest: number; loanPrincipal: number }> {
  const yearly: Record<number, { loanInterest: number; loanPrincipal: number }> = {};
  loans.forEach(loan => {
    const amortization = amortizeLoan(loan);
    for (let y = startYear; y <= endYear; y++) {
      if (!yearly[y]) yearly[y] = { loanInterest: 0, loanPrincipal: 0 };
      const yearMonths = amortization.filter(m => m.year === y);
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

function amortizeLoan(loan: PlanInput['loans'][0]): MonthlyAmortization[] {
  const { principal, apr, tenureMonths, startYear, startMonth } = loan;
  const monthlyRate = apr / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  let balance = principal;
  const amortization: MonthlyAmortization[] = [];
  let currentDate = new Date(startYear, startMonth - 1, 1);

  for (let m = 1; m <= tenureMonths && balance > 0; m++) {
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
  const { currentCorpus, monthlyContribution, expectedAnnualReturn } = invest;
  const sipMonthly = Array.isArray((invest as any).sips) ? (invest as any).sips.reduce((sum: number, s: any) => sum + (s?.amountMonthly || 0), 0) : 0;
  const totalMonthlyContribution = monthlyContribution + sipMonthly;
  const monthlyRate = expectedAnnualReturn / 12 / 100;
  let corpus = currentCorpus;
  const yearly = [];
  let currentDate = new Date(startYear, 0, 1); // January of startYear

  for (let y = 0; y < horizonYears; y++) {
    let contribThisYear = 0;
    const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
    months.forEach(() => {
      corpus += totalMonthlyContribution;
      contribThisYear += totalMonthlyContribution;
      corpus *= (1 + monthlyRate);
    });
    yearly.push({ investmentContrib: contribThisYear, corpusEnd: corpus });
    currentDate = addMonths(currentDate, 12);
  }
  return yearly;
}
