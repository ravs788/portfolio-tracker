import { useFormContext } from 'react-hook-form';
import type { PlanInput } from '../../schemas';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { useAppStore } from '../../store';
import { formatCurrencyIndian } from '../../utils/format';
import InlineFormattedInput from '../inputs/InlineFormattedInput';

const ReviewStep = ({ onGoToStart }: { onGoToStart?: () => void }) => {
  const { watch } = useFormContext<PlanInput>();
  const formData = watch();

  const { growthRatesYou, growthRatesWife, setGrowthRatesYou, setGrowthRatesWife, homeLoanPrepay, setHomeLoanPrepayAt } = useAppStore();

  const currencyCode = formData.settings.currency || 'INR';

  const formatCurrency = (value: number) => formatCurrencyIndian(value, currencyCode);

  const formatPercent = (value: number) => `${value}%`;
  const pad2 = (n: number) => n.toString().padStart(2, '0');

  const renderEmptyRow = (colSpan: number) => (
    <TableRow>
      <TableCell colSpan={colSpan} align="center">None</TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Review Your Inputs</Typography>
        {onGoToStart && (
          <Button variant="outlined" onClick={onGoToStart}>
            Go to Start
          </Button>
        )}
      </Box>

      {/* Settings */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Settings</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell width="40%">Start Year</TableCell>
                <TableCell>{formData.settings.startYear}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizon Years</TableCell>
                <TableCell>{formData.settings.horizonYears}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>{currencyCode}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Inflation Rate</TableCell>
                <TableCell>{formatPercent(formData.settings.inflationRate)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Incomes */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Incomes</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Person</TableCell>
                    <TableCell align="right">Base Amount</TableCell>
                    <TableCell>Base Unit</TableCell>
                    <TableCell align="right">Annual Growth</TableCell>
                    <TableCell align="right">Bonus (Annual)</TableCell>
                    <TableCell align="right">Stocks (Annual)</TableCell>
                    <TableCell align="right">RSUs (Annual)</TableCell>
                  </TableRow>
                </TableHead>
            <TableBody>
              {formData.incomes && formData.incomes.length > 0
                ? formData.incomes.map((inc, idx) => (
                    <>
                      <TableRow key={idx}>
                        <TableCell>
                          {inc.person.charAt(0).toUpperCase() + inc.person.slice(1)}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(inc.baseAmount)}</TableCell>
                        <TableCell>{inc.baseIsMonthly ? 'Monthly' : 'Annual'}</TableCell>
                        <TableCell align="right">{formatPercent(inc.annualGrowthRate)}</TableCell>
                        <TableCell align="right">{formatCurrency((inc as any).bonusAnnual || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency((inc as any).stocksAnnual || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency((inc as any).rsusAnnual || 0)}</TableCell>
                      </TableRow>
                      <TableRow key={`${idx}-growth`}>
                        <TableCell colSpan={7}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Per-year Growth Rates (%)</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {Array.from({ length: Math.max(0, formData.settings.horizonYears - 1) }).map((_, gyIdx) => {
                              const year = formData.settings.startYear + gyIdx + 1;
                              const isYou = inc.person === 'you';
                              const arr = isYou ? growthRatesYou : growthRatesWife;
                              const setter = isYou ? setGrowthRatesYou : setGrowthRatesWife;
                              const value = arr[gyIdx] ?? (isYou ? formData.incomes.find(i => i.person === 'you')?.annualGrowthRate ?? 7 : formData.incomes.find(i => i.person === 'wife')?.annualGrowthRate ?? 7);
                              return (
                                <label key={gyIdx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span>{year}</span>
                                  <InlineFormattedInput
                                    value={value}
                                    onValueChange={(v) => {
                                      const copy = [...arr];
                                      copy[gyIdx] = v;
                                      setter(copy);
                                    }}
                                    mode="percent"
                                    fractionDigits={2}
                                    textFieldProps={{ style: { width: 80 } }}
                                  />
                                </label>
                              );
                            })}
                            {formData.settings.horizonYears - 1 <= 0 && <span>No growth years</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  ))
                : renderEmptyRow(7)}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>



      {/* Monthly Expenses */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Monthly Expenses</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Amount (Monthly)</TableCell>
                <TableCell>Inflation Linked</TableCell>
                <TableCell>Tentative</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.monthlyExpenses && formData.monthlyExpenses.length > 0
                ? formData.monthlyExpenses.map((exp, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{exp.name}</TableCell>
                      <TableCell align="right">{formatCurrency(exp.amountMonthly)}</TableCell>
                      <TableCell>{exp.inflationLinked ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{exp.tentative ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))
                : renderEmptyRow(4)}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Big Expenses */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Big Expenses</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Year</TableCell>
                <TableCell>Recurs Every</TableCell>
                <TableCell>Inflation Linked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.bigExpenses && formData.bigExpenses.length > 0
                ? formData.bigExpenses.map((exp, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{exp.name}</TableCell>
                      <TableCell align="right">{formatCurrency(exp.amount)}</TableCell>
                      <TableCell align="right">{exp.year}</TableCell>
                      <TableCell>{exp.recurrenceYears ? `${exp.recurrenceYears} years` : 'N/A'}</TableCell>
                      <TableCell>{exp.inflationLinked ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))
                : renderEmptyRow(5)}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Investment Summary */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Investment</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell width="40%">Current Corpus</TableCell>
                <TableCell>{formatCurrency(formData.investment.currentCorpus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Monthly Contribution</TableCell>
                <TableCell>{formatCurrency(formData.investment.monthlyContribution)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Expected Annual Return</TableCell>
                <TableCell>{formatPercent(formData.investment.expectedAnnualReturn)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {formData.investment.sips && formData.investment.sips.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>SIPs</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Amount (Monthly)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.investment.sips.map((sip, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{sip.name}</TableCell>
                      <TableCell align="right">{formatCurrency(sip.amountMonthly)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>

      {/* Loans */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Loans</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Principal</TableCell>
                <TableCell align="right">APR</TableCell>
                <TableCell align="right">Tenure (months)</TableCell>
                <TableCell>Start (MM/YYYY)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.loans && formData.loans.length > 0
                ? (
                  <>
                    {formData.loans.map((loan, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{loan.name}</TableCell>
                        <TableCell align="right">{formatCurrency(loan.principal)}</TableCell>
                        <TableCell align="right">{formatPercent(loan.apr)}</TableCell>
                        <TableCell align="right">{loan.tenureMonths}</TableCell>
                        <TableCell>{pad2(loan.startMonth)}/{loan.startYear}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Home Loan Prepayment (per year)</div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {Array.from({ length: formData.settings.horizonYears }).map((_, idx) => {
                            const year = formData.settings.startYear + idx;
                            const value = homeLoanPrepay[idx] || 0;
                            return (
                              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{year}</span>
                                <InlineFormattedInput
                                  value={value}
                                  onValueChange={(val) => {
                                    setHomeLoanPrepayAt(idx, val);
                                  }}
                                  mode="currency"
                                  fractionDigits={2}
                                  textFieldProps={{ style: { width: 140 } }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )
                : renderEmptyRow(5)}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ReviewStep;
