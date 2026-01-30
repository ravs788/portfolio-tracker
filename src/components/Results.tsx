import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import React from 'react';
import { formatCurrencyIndian, formatNumberIndian } from '../utils/format';
import type { PlanInput, PlanOutput, YearResult } from '../schemas';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnDef,
  CellContext,
} from '@tanstack/react-table';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Typography from '@mui/material/Typography';
import { addMonths, endOfYear, startOfYear, eachMonthOfInterval } from 'date-fns';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import InlineFormattedInput from './inputs/InlineFormattedInput';

const Results = () => {
  const { plan, includeTentative, setIncludeTentative, growthRatesYou, growthRatesWife, setGrowthRatesYou, setGrowthRatesWife, homeLoanPrepay } = useAppStore();
  const currencyCode = plan.settings.currency || 'INR';
  const [output, setOutput] = useState<PlanOutput>({ results: [] });
  const [sorting, setSorting] = useState<SortingState>([]);

  const [collapsed, setCollapsed] = useState({
    income: false,
    expenses: false,
    expensesHome: false,
    investment: false,
    totalExpenses: false,
    totalSavings: false,
    corpus: false,
  });
  const toggleGroup = (key: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };


  useEffect(() => {
    const customOutput = calculatePlan(plan, includeTentative, growthRatesYou, growthRatesWife, homeLoanPrepay);
    setOutput(customOutput);
  }, [plan, includeTentative, growthRatesYou, growthRatesWife, homeLoanPrepay]);

  const calculatePlan = (input: PlanInput, includeTentative: boolean, growthYou: number[], growthWife: number[], homeLoanPrepayArr: number[]): PlanOutput => {
    const { settings, incomes, monthlyExpenses, bigExpenses, investment, loans } = input;
    const { startYear, horizonYears, inflationRate } = settings;
    const endYear = startYear + horizonYears - 1;
    const results: YearResult[] = [];

    // Precompute loan amortizations
    const yearlyLoans = calculateYearlyLoans(loans, startYear, endYear, homeLoanPrepayArr);

    // Precompute investment projections
    const yearlyInvestments = calculateYearlyInvestments(investment, startYear, horizonYears);

    // Precompute home loan amortization if exists
    const homeLoan = loans.find(l => l.name.toLowerCase().includes('home'));
    let homeAmortization: MonthlyAmortization[] = [];
    if (homeLoan) {
      homeAmortization = amortizeLoan(homeLoan, startYear, homeLoanPrepayArr);
    }

    for (let i = 0; i < horizonYears; i++) {
      const y = startYear + i;

      // Incomes with per-year growth
      const incomeYou = calculateIncome(incomes.find(inc => inc.person === 'you'), growthYou, i);
      const incomeWife = calculateIncome(incomes.find(inc => inc.person === 'wife'), growthWife, i);
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

      // Home loan specific
      let homeLoanEMI = 0;
      let homeLoanPendingPrincipal = 0;
      if (homeLoan) {
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
  };

  const calculateIncome = (inc: PlanInput['incomes'][0] | undefined, growthRates: number[], yearIndex: number): number => {
    if (!inc) return 0;
    const baseAnnual = inc.baseIsMonthly ? inc.baseAmount * 12 : inc.baseAmount;
    // Compound factor from per-year growth rates
    let factor = 1;
    for (let j = 0; j < yearIndex; j++) {
      const raw = growthRates[j];
      const rate = (raw === undefined || raw === null || isNaN(Number(raw))) ? 0 : Number(raw) / 100;
      factor *= (1 + rate);
    }
    const salary = baseAnnual * factor;
    const bonus = (inc.bonusAnnual || 0) * factor;
    const stocks = (inc.stocksAnnual || 0) * factor;
    const rsus = (inc.rsusAnnual || 0) * factor;
    return salary + bonus + stocks + rsus;
  };

  const calculateAnnualExpenses = (exps: PlanInput['monthlyExpenses'], i: number, inflationRate: number): number => {
    return exps.reduce((sum, exp) => {
      const annual = exp.amountMonthly * 12;
      const adjusted = exp.inflationLinked ? annual * Math.pow(1 + inflationRate / 100, i) : annual;
      return sum + adjusted;
    }, 0);
  };

  const calculateTaxOldRegime = (grossIncome: number): number => {
    // Standard deduction (salaried)
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

    // Rebate u/s 87A up to ₹5L
    if (taxable <= 500000) {
      tax = 0;
    }

    // Health & Education Cess @ 4%
    const cess = tax * 0.04;
    return tax + cess;
  };

  const calculateBigExpenses = (bigExps: PlanInput['bigExpenses'], year: number, startYear: number, inflationRate: number): number => {
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
  };

  const calculateYearlyLoans = (loans: PlanInput['loans'], startYear: number, endYear: number, homeLoanPrepayArr: number[]): Record<number, { loanInterest: number; loanPrincipal: number }> => {
    const yearly: Record<number, { loanInterest: number; loanPrincipal: number }> = {};
    loans.forEach(loan => {
      const isHome = loan.name.toLowerCase().includes('home');
      const amortization = isHome ? amortizeLoan(loan, startYear, homeLoanPrepayArr) : amortizeLoan(loan);
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
  };

  type MonthlyAmortization = {
    month: number;
    year: number;
    interest: number;
    principal: number;
    balance: number;
  };

  const amortizeLoan = (loan: PlanInput['loans'][0], planStartYear?: number, prepayArr?: number[]): MonthlyAmortization[] => {
    const { principal, apr, tenureMonths, startYear, startMonth } = loan;
    const monthlyRate = apr / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    let balance = principal;
    const amortization: MonthlyAmortization[] = [];
    let currentDate = new Date(startYear, startMonth - 1, 1);

    for (let m = 1; m <= tenureMonths && balance > 0; m++) {
      // Apply prepayment at the start of each calendar year (January) if provided
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
  };

  const calculateYearlyInvestments = (invest: PlanInput['investment'], startYear: number, horizonYears: number): { investmentContrib: number; corpusEnd: number }[] => {
    const { currentCorpus, monthlyContribution, expectedAnnualReturn, contributionGrowthRate, sips } = invest;
    const sipMonthly = Array.isArray(sips) ? sips.reduce((sum, s) => sum + (s?.amountMonthly || 0), 0) : 0;
    const baseMonthly = monthlyContribution + sipMonthly;

    const monthlyRate = expectedAnnualReturn / 12 / 100;
    const growth = (contributionGrowthRate || 0) / 100;

    let corpus = currentCorpus;
    const yearly = [];
    let currentDate = new Date(startYear, 0, 1); // January of startYear

    for (let y = 0; y < horizonYears; y++) {
      // Apply yearly growth to monthly contributions at the start of each calendar year
      const effectiveMonthly = baseMonthly * Math.pow(1 + growth, y);
      let contribThisYear = 0;
      const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
      months.forEach(() => {
        corpus += effectiveMonthly;
        contribThisYear += effectiveMonthly;
        corpus *= (1 + monthlyRate);
      });
      yearly.push({ investmentContrib: contribThisYear, corpusEnd: corpus });
      currentDate = addMonths(currentDate, 12);
    }
    return yearly;
  };

  type TransposedRow = { metric: string; [key: string]: number | string };

  const transformedData = React.useMemo<TransposedRow[]>(() => {
    if (output.results.length === 0) return [];

    const rows: TransposedRow[] = [];
    const years = output.results.map(r => r.year);
    const lookup: Record<number, YearResult> = Object.fromEntries(
      years.map(y => [y, output.results.find(r => r.year === y)!])
    );

    const mkRow = (label: string, get: (r: YearResult) => number): TransposedRow => {
      const row: TransposedRow = { metric: label, __type: 'row' };
      years.forEach(y => {
        row[`year${y}`] = get(lookup[y]);
      });
      return row;
    };

    // 1. Income (with tax and final income after that) + growth rates
    rows.push({ metric: '1. Income', __type: 'group', __key: 'income' } as unknown as TransposedRow);
    if (!collapsed.income) {
      rows.push(
        mkRow('Income - You (Gross)', r => r.incomeYou),
        mkRow('Income - Wife (Gross)', r => r.incomeWife),
        mkRow('Total Income (Gross)', r => r.totalIncome),
        mkRow('Tax - You (Old Regime)', r => r.taxYou),
        mkRow('Tax - Wife (Old Regime)', r => r.taxWife),
        mkRow('Total Tax', r => r.totalTax),
        mkRow('Final Income - You (After Tax)', r => r.finalIncomeYou),
        mkRow('Final Income - Wife (After Tax)', r => r.finalIncomeWife),
        mkRow('Total Final Income (After Tax)', r => r.totalFinalIncome),
      );
      // Growth Rate rows (editable)
      const growthYouRow: TransposedRow = { metric: 'Growth Rate - You (%)', __type: 'row' } as TransposedRow;
      for (let idx = 0; idx < growthRatesYou.length; idx++) {
        const y = plan.settings.startYear + idx + 1;
        growthYouRow[`year${y}`] = growthRatesYou[idx];
      }
      const growthWifeRow: TransposedRow = { metric: 'Growth Rate - Wife (%)', __type: 'row' } as TransposedRow;
      for (let idx = 0; idx < growthRatesWife.length; idx++) {
        const y = plan.settings.startYear + idx + 1;
        growthWifeRow[`year${y}`] = growthRatesWife[idx];
      }
      rows.push(growthYouRow, growthWifeRow);
    }

    // 2. All Expenses with nested 2.a Home Loan
    rows.push({ metric: '2. All Expenses', __type: 'group', __key: 'expenses' } as unknown as TransposedRow);
    if (!collapsed.expenses) {
      rows.push(
        mkRow('Fixed Annual Expenses', r => r.fixedAnnual),
        mkRow('Tentative Annual Expenses', r => r.tentativeAnnual),
        mkRow('Big Annual Expenses', r => r.bigAnnual),
        mkRow('Loan Interest', r => r.loanInterest),
        mkRow('Loan Principal', r => r.loanPrincipal),
        mkRow('Total Loans', r => r.loansTotal),
      );

      rows.push({ metric: '2.a Home Loan', __type: 'subgroup', __key: 'expensesHome' } as unknown as TransposedRow);
      if (!collapsed.expensesHome) {
        rows.push(
          mkRow('Home Loan Yearly EMI', r => r.homeLoanEMI),
          mkRow('Home Loan Pending Principal', r => r.homeLoanPendingPrincipal),
        );
      }
    }

    // 3. Investment
    rows.push({ metric: '3. Investment', __type: 'group', __key: 'investment' } as unknown as TransposedRow);
    if (!collapsed.investment) {
      rows.push(
        mkRow('Investment Contribution', r => r.investmentContrib),
        mkRow('Investment Corpus (End of Year)', r => r.corpusEnd),
      );
    }

    // 4. Total Expenses (computed)
    rows.push({ metric: '4. Total Expenses', __type: 'group', __key: 'totalExpenses' } as unknown as TransposedRow);
    if (!collapsed.totalExpenses) {
      rows.push(mkRow('Total Expenses', r => r.fixedAnnual + r.tentativeAnnual + r.bigAnnual + r.loansTotal));
    }

    // 5. Total Savings
    rows.push({ metric: '5. Total Savings', __type: 'group', __key: 'totalSavings' } as unknown as TransposedRow);
    if (!collapsed.totalSavings) {
      rows.push(mkRow('Total Savings (Net Savings)', r => r.netSavings));
    }

    // 6. Corpus at the end of the year
    rows.push({ metric: '6. Corpus at the end of the year', __type: 'group', __key: 'corpus' } as unknown as TransposedRow);
    if (!collapsed.corpus) {
      rows.push(mkRow('Corpus at End of Year', r => r.corpusEnd));
    }

    return rows;
  }, [output.results, collapsed, growthRatesYou, growthRatesWife, plan.settings.startYear]);

  const columns = React.useMemo<ColumnDef<TransposedRow>[]>(
    () => [
      {
        accessorKey: 'metric',
        header: 'Metric',
        minSize: 220,
        cell: (info: CellContext<TransposedRow, unknown>) => {
          const row = info.row.original as any;
          const type = row.__type;
          // Group/subgroup header with toggle
          if (type === 'group' || type === 'subgroup') {
            const key = row.__key as keyof typeof collapsed;
            const isCollapsed = collapsed[key];
            const indent = type === 'subgroup' ? 16 : 0;
            return (
              <span
                onClick={() => toggleGroup(key)}
                style={{ cursor: 'pointer', fontWeight: 600, paddingLeft: indent }}
              >
                {isCollapsed ? '▸' : '▾'} {row.metric}
              </span>
            );
          }
          // Regular metric row
          return row.metric as string;
        },
      },
      ...output.results.map((result) => ({
        accessorKey: `year${result.year}`,
        header: result.year.toString(),
        cell: (info: CellContext<TransposedRow, unknown>) => {
          const row = info.row.original as any;
          const metric = row.metric as string;
          const type = row.__type as string | undefined;

          // No values for group headers
          if (type === 'group' || type === 'subgroup') return '';

          // Editable growth rate inputs
          if (metric.startsWith('Growth Rate')) {
            const yearStr = info.column.id.replace('year', '');
            const year = parseInt(yearStr);
            const index = year - plan.settings.startYear - 1;
            if (index < 0) return '';
            const value = (info.getValue() as number) ?? 0;
            return (
              <InlineFormattedInput
                value={isNaN(value) ? 0 : value}
                onValueChange={(newValue) => {
                  if (metric === 'Growth Rate - You (%)') {
                    const newRates = [...growthRatesYou];
                    newRates[index] = newValue;
                    setGrowthRatesYou(newRates);
                  } else {
                    const newRates = [...growthRatesWife];
                    newRates[index] = newValue;
                    setGrowthRatesWife(newRates);
                  }
                }}
                mode="percent"
                fractionDigits={2}
                textFieldProps={{ style: { width: 80 } }}
              />
            );
          }

          const value = info.getValue() as number | undefined;
          if (value === undefined || Number.isNaN(value)) return '';
          return formatCurrencyIndian(value, currencyCode);
        },
      })),
    ],
    [output.results, growthRatesYou, growthRatesWife, plan.settings.startYear, collapsed]
  );

  const table = useReactTable({
    data: transformedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleToggleTentative = () => {
    setIncludeTentative(!includeTentative);
  };

  const exportCSV = () => {
    const yearHeaders = output.results.map(r => r.year.toString());
    const headers = ['Metric', ...yearHeaders];
    const csvRows = transformedData.map((rowAny) => {
      const row = rowAny as any;
      return headers.map(header => {
        if (header === 'Metric') return row.metric as string;
        // No values for group/subgroup header rows
        if (row.__type === 'group' || row.__type === 'subgroup') return '';
        const key = `year${header}`;
        const val = row[key];
        if (typeof val === 'number') {
          const metric = row.metric as string;
          if (metric.startsWith('Growth Rate')) return String(val);
          return formatNumberIndian(val, 2);
        }
        if (val === undefined || val === null || val === '') return '';
        return String(val);
      }).join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_plan_transposed.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const json = JSON.stringify(output, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_plan.json';
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <Paper sx={{ p: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6">Yearly Projection</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControlLabel
          control={<Switch checked={includeTentative} onChange={handleToggleTentative} />}
          label="Include Tentative Expenses"
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" component={Link} to="/charts">
            View Charts
          </Button>
          <Button variant="outlined" component={Link} to="/">
            Back to Start
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ flex: 1, width: '100%', overflow: 'auto', boxShadow: 3, borderRadius: 2, mt: 1 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell key={header.id} sortDirection={header.column.getIsSorted() || false} sx={{ backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
<Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 1, flexWrap: 'nowrap' }}>
  <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={exportCSV}>
    Export CSV
  </Button>
  <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={exportJSON}>
    Export JSON
  </Button>
  <Button variant="contained" component={Link} to="/wizard">
    Back to Planner
  </Button>
      </Box>
    </Paper>
  );
};

export default Results;
