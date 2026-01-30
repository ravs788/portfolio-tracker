import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import type { PlanInput } from '../../schemas';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormattedTextField from '../inputs/FormattedTextField';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';

const MonthlyExpensesStep = () => {
  const { control, register, formState: { errors } } = useFormContext<PlanInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'monthlyExpenses',
  });

  const addExpense = () => {
    append({ name: '', amountMonthly: 0, inflationLinked: true, tentative: false });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">Monthly Expenses</Typography>
      </Grid>
      {fields.map((field, index) => (
        <Grid item xs={12} key={field.id}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Name"
                {...register(`monthlyExpenses.${index}.name`)}
                error={!!errors.monthlyExpenses?.[index]?.name}
                helperText={errors.monthlyExpenses?.[index]?.name?.message}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormattedTextField
                name={`monthlyExpenses.${index}.amountMonthly`}
                label="Amount (Monthly)"
                mode="currency"
                fractionDigits={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <Controller
                name={`monthlyExpenses.${index}.inflationLinked`}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Inflation Linked"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <Controller
                name={`monthlyExpenses.${index}.tentative`}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Tentative"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton onClick={() => remove(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Button variant="outlined" onClick={addExpense}>
          Add Expense
        </Button>
      </Grid>
    </Grid>
  );
};

export default MonthlyExpensesStep;
