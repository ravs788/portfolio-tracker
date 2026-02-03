import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { PlanInputSchema, type PlanInput } from '../schemas';

type StartMethod = 'manual' | 'csv' | 'json';

const currentYear = new Date().getFullYear();

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const {
    setPlan,
    setGrowthRatesYou,
    setGrowthRatesWife,
    setHomeLoanPrepay,
  } = useAppStore();

  const [method, setMethod] = useState<StartMethod>('manual');
  const [error, setError] = useState<string>('');

  const handleMethodChange = (e: SelectChangeEvent) => {
    setMethod(e.target.value as StartMethod);
    setError('');
  };

  const headers = useMemo(() => [
    'type', // settings | income | monthlyExpense | bigExpense | loan | investment | sip
    'name',
    'person', // you | wife
    'baseAmount',
    'baseIsMonthly',
    'annualGrowthRate',
    'bonusAnnual',
    'stocksAnnual',
    'rsusAnnual',
    'amountMonthly',
    'inflationLinked',
    'tentative',
    'amount',
    'year',
    'recurrenceYears',
    'principal',
    'apr',
    'tenureMonths',
    'startYear',
    'startMonth',
    'currentCorpus',
    'monthlyContribution',
    'expectedAnnualReturn',
    'contributionGrowthRate',
    'currency',
    'startYearSettings',
    'horizonYears',
    'sipName',
    'sipAmountMonthly',
    'inflationRate'
  ], []);

  const buildCsvTemplate = () => {
    const sampleRows: Array<Record<string, string | number | boolean>> = [
      // Settings
      {
        type: 'settings',
        currency: 'INR',
        startYearSettings: String(currentYear),
        horizonYears: '10',
        inflationRate: '5',
      },
      // Incomes
      {
        type: 'income',
        person: 'you',
        baseAmount: '150000',
        baseIsMonthly: 'true',
        annualGrowthRate: '7',
        bonusAnnual: '100000',
        stocksAnnual: '0',
        rsusAnnual: '0',
      },
      {
        type: 'income',
        person: 'wife',
        baseAmount: '100000',
        baseIsMonthly: 'true',
        annualGrowthRate: '7',
        bonusAnnual: '50000',
        stocksAnnual: '0',
        rsusAnnual: '0',
      },
      // Monthly Expenses
      {
        type: 'monthlyExpense',
        name: 'Grocery + Food',
        amountMonthly: '30000',
        inflationLinked: 'true',
        tentative: 'false',
      },
      {
        type: 'monthlyExpense',
        name: 'Gas + Travel',
        amountMonthly: '15000',
        inflationLinked: 'true',
        tentative: 'false',
      },
      // Big Expense
      {
        type: 'bigExpense',
        name: 'School Fees',
        amount: '200000',
        year: String(currentYear + 1),
        recurrenceYears: '1',
        inflationLinked: 'true',
      },
      // Loan
      {
        type: 'loan',
        name: 'Home Loan',
        principal: '5000000',
        apr: '8',
        tenureMonths: '240',
        startYear: String(currentYear),
        startMonth: '1',
      },
      // Investment
      {
        type: 'investment',
        currentCorpus: '0',
        monthlyContribution: '50000',
        expectedAnnualReturn: '10',
        contributionGrowthRate: '0',
      },
      // SIPs
      {
        type: 'sip',
        sipName: 'SIP (you)',
        sipAmountMonthly: '25000',
      },
      {
        type: 'sip',
        sipName: 'SIP (wife)',
        sipAmountMonthly: '25000',
      },
    ];

    const csvLines = [
      headers.join(','),
      ...sampleRows.map((row) =>
        headers
          .map((h) => {
            const v = row[h];
            // Basic escaping for commas/quotes
            if (v === undefined || v === null) return '';
            const s = String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(',')
      ),
    ];
    return csvLines.join('\n');
  };

  const downloadCsvTemplate = () => {
    const csv = buildCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_plan_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const splitCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  };

  const parseBool = (v: any): boolean => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    const s = String(v).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  };


  const parseCsvToPlan = (csv: string): PlanInput => {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('CSV is empty');
    }
    const headerLine = lines[0];
    const fileHeaders = splitCsvLine(headerLine).map((h) => h.trim());

    // header helpers with alias support (case-insensitive)
    const indexOfCI = (key: string) => fileHeaders.findIndex((h) => h.toLowerCase() === key.toLowerCase());
    const getVal = (row: string[], key: string) => {
      const idx = indexOfCI(key);
      return idx >= 0 ? row[idx] : '';
    };
    const getFirstVal = (row: string[], keys: string[]) => {
      for (const k of keys) {
        const v = getVal(row, k);
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
      return '';
    };
    const str = (row: string[], keys: string[] | string, def = '') => {
      const raw = Array.isArray(keys) ? getFirstVal(row, keys) : getVal(row, keys);
      const s = String(raw ?? '').trim();
      return s.length ? s : def;
    };
    const num = (row: string[], keys: string[] | string, def = 0) => {
      const v = str(row, keys, '');
      if (!v) return def;
      const n = parseFloat(v);
      return isNaN(n) ? def : n;
    };
    const int = (row: string[], keys: string[] | string, def = 0) => {
      const v = str(row, keys, '');
      if (!v) return def;
      const n = parseInt(v, 10);
      return isNaN(n) ? def : n;
    };
    const boolDefault = (row: string[], keys: string[] | string, def: boolean) => {
      const v = str(row, keys, '');
      if (!v) return def;
      return parseBool(v);
    };

    const basePlan: PlanInput = {
      settings: {
        startYear: currentYear,
        horizonYears: 10,
        currency: 'INR',
        inflationRate: 5,
      },
      incomes: [],
      monthlyExpenses: [],
      bigExpenses: [],
      investment: {
        currentCorpus: 0,
        monthlyContribution: 0,
        expectedAnnualReturn: 8,
        contributionGrowthRate: 0,
        sips: [],
      },
      loans: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const rowVals = splitCsvLine(lines[i]);
      if (rowVals.length === 0) continue;
      const type = String(str(rowVals, ['type'], '')).trim().toLowerCase();
      if (!type) continue;

      switch (type) {
        case 'settings': {
          basePlan.settings.startYear = int(rowVals, ['startYearSettings', 'startYear'], currentYear);
          basePlan.settings.horizonYears = Math.max(1, int(rowVals, ['horizonYears', 'horizon', 'years'], 10));
          basePlan.settings.currency = str(rowVals, ['currency'], 'INR');
          basePlan.settings.inflationRate = num(rowVals, ['inflationRate', 'inflation'], 5);
          break;
        }
        case 'income': {
          const personStr = str(rowVals, ['person'], 'you').toLowerCase();
          const person = personStr === 'wife' ? 'wife' : 'you';
          const baseAmount = num(rowVals, ['baseAmount', 'base', 'amount'], 0);
          // baseIsMonthly supports multiple ways: boolean column or a 'frequency' textual column
          let baseIsMonthly = boolDefault(rowVals, ['baseIsMonthly', 'isMonthly', 'frequencyMonthly'], true);
          const freq = str(rowVals, ['frequency'], '').toLowerCase();
          if (freq === 'monthly') baseIsMonthly = true;
          if (freq === 'annual' || freq === 'yearly') baseIsMonthly = false;
          const annualGrowthRate = num(rowVals, ['annualGrowthRate', 'growth', 'growthRate'], 7);
          const bonusAnnual = num(rowVals, ['bonusAnnual', 'bonus'], 0);
          const stocksAnnual = num(rowVals, ['stocksAnnual', 'stocks'], 0);
          const rsusAnnual = num(rowVals, ['rsusAnnual', 'rsus'], 0);
          basePlan.incomes.push({
            person,
            baseAmount,
            baseIsMonthly,
            annualGrowthRate,
            bonusAnnual,
            stocksAnnual,
            rsusAnnual,
          });
          break;
        }
        case 'monthlyexpense': {
          const name = str(rowVals, ['name'], 'Expense');
          const amountMonthly = num(rowVals, ['amountMonthly', 'amount'], 0);
          const inflationLinked = boolDefault(rowVals, ['inflationLinked'], true);
          const tentative = boolDefault(rowVals, ['tentative'], false);
          basePlan.monthlyExpenses.push({
            name,
            amountMonthly,
            inflationLinked,
            tentative,
          });
          break;
        }
        case 'bigexpense': {
          const name = str(rowVals, ['name'], 'Big Expense');
          const amount = num(rowVals, ['amount'], 0);
          const year = Math.max(0, int(rowVals, ['year'], 0));
          const inflationLinked = boolDefault(rowVals, ['inflationLinked'], true);
          const recRaw = str(rowVals, ['recurrenceYears', 'recurrence', 'repeatEveryYears'], '');
          const rowObj: any = { name, amount, year, inflationLinked };
          const ry = parseInt(recRaw || '', 10);
          if (!isNaN(ry) && ry > 0) rowObj.recurrenceYears = ry;
          basePlan.bigExpenses.push(rowObj);
          break;
        }
        case 'loan': {
          const name = str(rowVals, ['name'], 'Loan');
          const principal = num(rowVals, ['principal', 'amount'], 0);
          const apr = num(rowVals, ['apr', 'interestRate', 'roi'], 0);
          const tenureMonths = Math.max(0, int(rowVals, ['tenureMonths', 'months', 'tenure'], 0));
          const startYear = Math.max(0, int(rowVals, ['startYear', 'loanStartYear'], currentYear));
          const startMonth = Math.max(1, Math.min(12, int(rowVals, ['startMonth', 'loanStartMonth'], 1)));
          basePlan.loans.push({
            name,
            principal,
            apr,
            tenureMonths,
            startYear,
            startMonth,
          });
          break;
        }
        case 'investment': {
          basePlan.investment.currentCorpus = num(rowVals, ['currentCorpus', 'corpus'], 0);
          basePlan.investment.monthlyContribution = num(rowVals, ['monthlyContribution', 'monthlyInvest', 'otherMonthly'], 0);
          basePlan.investment.expectedAnnualReturn = num(rowVals, ['expectedAnnualReturn', 'expectedReturn', 'return'], 8);
          basePlan.investment.contributionGrowthRate = num(rowVals, ['contributionGrowthRate', 'investGrowth', 'contributionGrowth'], 0);
          break;
        }
        case 'sip': {
          const sipName = str(rowVals, ['sipName', 'name'], 'SIP');
          const sipAmountMonthly = num(rowVals, ['sipAmountMonthly', 'amountMonthly', 'amount'], 0);
          if (!basePlan.investment.sips) basePlan.investment.sips = [];
          basePlan.investment.sips.push({ name: sipName, amountMonthly: sipAmountMonthly });
          break;
        }
        default:
          // ignore unknown rows
          break;
      }
    }

    // If incomes > 2, keep only one for 'you' and one for 'wife' (first occurrences).
    // If none provided, create a default 'you' income so schema min(1) passes.
    const you = basePlan.incomes.find((i) => i.person === 'you');
    const wife = basePlan.incomes.find((i) => i.person === 'wife');
    let normalizedIncomes: any[] = [];
    if (you) normalizedIncomes.push(you);
    if (wife) normalizedIncomes.push(wife);
    if (normalizedIncomes.length === 0) {
      normalizedIncomes = [{
        person: 'you',
        baseAmount: 0,
        baseIsMonthly: true,
        annualGrowthRate: 7,
        bonusAnnual: 0,
        stocksAnnual: 0,
        rsusAnnual: 0,
      }];
    }
    basePlan.incomes = normalizedIncomes;

    // Validate against schema
    const validated = PlanInputSchema.parse(basePlan);
    return validated;
  };

  const afterSetPlanAdjustAuxiliaryState = (plan: PlanInput) => {
    const yrs = plan.settings.horizonYears;
    const youRate = plan.incomes.find((i) => i.person === 'you')?.annualGrowthRate ?? 0;
    const wifeRate = plan.incomes.find((i) => i.person === 'wife')?.annualGrowthRate ?? 0;
    setGrowthRatesYou(Array(Math.max(yrs - 1, 0)).fill(youRate));
    setGrowthRatesWife(Array(Math.max(yrs - 1, 0)).fill(wifeRate));
    setHomeLoanPrepay(Array(Math.max(yrs, 0)).fill(0));
  };

  const handleContinueManual = () => {
    navigate('/wizard');
  };

  const onCsvSelected = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const plan = parseCsvToPlan(text);
        setPlan(plan);
        afterSetPlanAdjustAuxiliaryState(plan);
        navigate('/wizard');
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to parse CSV. Ensure it matches the template.');
      }
    };
    reader.onerror = () => setError('Failed to read CSV file.');
    reader.readAsText(file);
  };

  const onJsonSelected = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const objRaw = JSON.parse(String(reader.result || '{}'));
        const obj = (objRaw && typeof objRaw === 'object') ? objRaw : {};
        if (!Array.isArray((obj as any).incomes) || (obj as any).incomes.length === 0) {
          (obj as any).incomes = [{
            person: 'you',
            baseAmount: 0,
            baseIsMonthly: true,
            annualGrowthRate: 7,
            bonusAnnual: 0,
            stocksAnnual: 0,
            rsusAnnual: 0,
          }];
        }
        const plan = PlanInputSchema.parse(obj as any);
        setPlan(plan);
        afterSetPlanAdjustAuxiliaryState(plan);
        navigate('/wizard');
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Invalid JSON. Ensure it matches PlanInput schema.');
      }
    };
    reader.onerror = () => setError('Failed to read JSON file.');
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 3, maxWidth: 900, width: '100%' }} elevation={3}>
        <Typography variant="h5" gutterBottom>
          Start Your Plan
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Choose how you want to begin: fill data manually in the planner, or import a template (CSV/JSON).
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="start-method-label">Start With</InputLabel>
            <Select
              labelId="start-method-label"
              label="Start With"
              value={method}
              onChange={handleMethodChange}
            >
              <MenuItem value="manual">Fill Manually</MenuItem>
              <MenuItem value="csv">Import CSV</MenuItem>
              <MenuItem value="json">Import JSON</MenuItem>
            </Select>
          </FormControl>

          {method === 'manual' && (
            <Button variant="contained" onClick={handleContinueManual}>
              Continue
            </Button>
          )}

          {method === 'csv' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <Button variant="outlined" onClick={downloadCsvTemplate}>
                Download CSV Template
              </Button>
              <Button
                variant="contained"
                component="label"
              >
                Choose CSV File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onCsvSelected(f);
                  }}
                />
              </Button>
            </Stack>
          )}

          {method === 'json' && (
            <Button variant="contained" component="label">
              Choose JSON File
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onJsonSelected(f);
                }}
              />
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">CSV Columns (Template)</Typography>
          <Typography variant="body2" color="text.secondary">
            The CSV supports multiple row types with a "type" column: settings, income, monthlyExpense, bigExpense, loan, investment, sip.
            Only relevant columns are required per row. Download the template for examples.
          </Typography>
        </Box>

        {/* ---------- HOW TO USE GUIDE ---------- */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How to Use This Application
          </Typography>

          {/* Visual workflow with steppers */}
          <Box sx={{ mt: 2 }}>
            {/* Central steppers could be rendered here if desired; each accordion also contains its own flow now. */}
          </Box>

          {/* Fill Manually */}
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} id="manual-header" aria-controls="manual-content">
              <Typography variant="subtitle1">1. Fill Manually</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper orientation="vertical" activeStep={-1} sx={{ mb: 1 }}>
                {['Choose “Fill Manually”', 'Click Continue to open wizard', 'Complete all wizard steps', 'Press Calculate to view results'].map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Typography variant="body2" color="text.secondary">Open the wizard, complete steps, then Calculate to view results.</Typography>
            </AccordionDetails>
          </Accordion>

          {/* Import CSV */}
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} id="csv-header" aria-controls="csv-content">
              <Typography variant="subtitle1">2. Import CSV</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper orientation="vertical" activeStep={-1} sx={{ mb: 1 }}>
                {['Download CSV Template', 'Edit in spreadsheet', 'Save as UTF-8 CSV', 'Choose CSV File to upload', 'View results'].map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Typography variant="body2" color="text.secondary">Download template, edit and save as CSV, then upload to auto‑fill and view results.</Typography>
            </AccordionDetails>
          </Accordion>

          {/* Import JSON */}
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} id="json-header" aria-controls="json-content">
              <Typography variant="subtitle1">3. Import JSON</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper orientation="vertical" activeStep={-1} sx={{ mb: 1 }}>
                {['Export or prepare JSON', 'Choose JSON File', 'View results'].map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Typography variant="body2" color="text.secondary">Import a previously exported JSON to instantly load your plan.</Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Paper>
    </Box>
  );
};

export default Landing;
