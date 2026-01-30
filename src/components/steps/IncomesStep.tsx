import { useFormContext } from 'react-hook-form';
import type { PlanInput } from '../../schemas';
import Grid from '@mui/material/Grid';
import FormattedTextField from '../inputs/FormattedTextField';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';

const IncomesStep = () => {
  const { watch, setValue } = useFormContext<PlanInput>();

  const incomes = watch('incomes') || [];
  const youIndex = incomes.findIndex((i: PlanInput['incomes'][0]) => i.person === 'you');
  const wifeIndex = incomes.findIndex((i: PlanInput['incomes'][0]) => i.person === 'wife');

  const addIncome = (person: 'you' | 'wife') => {
    const next = [
      ...incomes,
      {
        person,
        baseAmount: 0,
        baseIsMonthly: true,
        annualGrowthRate: 7,
        bonusAnnual: 0,
        stocksAnnual: 0,
        rsusAnnual: 0,
      },
    ];
    setValue('incomes', next, { shouldDirty: true });
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant="h6">Your Income</Typography>
      </Grid>

      {youIndex === -1 ? (
        <Grid item xs={12}>
          <Button variant="outlined" onClick={() => addIncome('you')}>Add Your Income</Button>
        </Grid>
      ) : (
        <>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${youIndex}.baseAmount`}
              label="Base Amount"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                label="Frequency"
                value={watch(`incomes.${youIndex}.baseIsMonthly`) ? 'true' : 'false'}
                onChange={(e) => setValue(`incomes.${youIndex}.baseIsMonthly`, e.target.value === 'true', { shouldDirty: true })}
              >
                <MenuItem value="true">Monthly</MenuItem>
                <MenuItem value="false">Annual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${youIndex}.annualGrowthRate`}
              label="Annual Growth Rate (%)"
              mode="percent"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${youIndex}.bonusAnnual`}
              label="Bonus (Annual)"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${youIndex}.stocksAnnual`}
              label="Stocks (Annual)"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${youIndex}.rsusAnnual`}
              label="RSUs (Annual)"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Typography variant="h6">Wife's Income</Typography>
      </Grid>

      {wifeIndex === -1 ? (
        <Grid item xs={12}>
          <Button variant="outlined" onClick={() => addIncome('wife')}>Add Wife's Income</Button>
        </Grid>
      ) : (
        <>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${wifeIndex}.baseAmount`}
              label="Base Amount"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                label="Frequency"
                value={watch(`incomes.${wifeIndex}.baseIsMonthly`) ? 'true' : 'false'}
                onChange={(e) => setValue(`incomes.${wifeIndex}.baseIsMonthly`, e.target.value === 'true', { shouldDirty: true })}
              >
                <MenuItem value="true">Monthly</MenuItem>
                <MenuItem value="false">Annual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${wifeIndex}.annualGrowthRate`}
              label="Annual Growth Rate (%)"
              mode="percent"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${wifeIndex}.bonusAnnual`}
              label="Bonus (Annual)"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${wifeIndex}.stocksAnnual`}
              label="Stocks (Annual)"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormattedTextField
              name={`incomes.${wifeIndex}.rsusAnnual`}
              label="RSUs (Annual)"
              mode="currency"
              fractionDigits={2}
              fullWidth
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default IncomesStep;
