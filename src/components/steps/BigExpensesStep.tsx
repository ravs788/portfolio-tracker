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

const BigExpensesStep = () => {
  const { control, register, formState: { errors } } = useFormContext<PlanInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bigExpenses',
  });

  const addExpense = () => {
    append({ name: '', amount: 0, year: 0, recurrenceYears: undefined, inflationLinked: true });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">Big Expenses</Typography>
      </Grid>
      {fields.map((field, index) => (
        <Grid item xs={12} key={field.id}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Name"
                {...register(`bigExpenses.${index}.name`)}
                error={!!errors.bigExpenses?.[index]?.name}
                helperText={errors.bigExpenses?.[index]?.name?.message}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormattedTextField
                name={`bigExpenses.${index}.amount`}
                label="Amount"
                mode="currency"
                fractionDigits={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormattedTextField
                name={`bigExpenses.${index}.year`}
                label="Year"
                mode="integer"
                groupThousands={false}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormattedTextField
                name={`bigExpenses.${index}.recurrenceYears`}
                label="Recurrence Years (optional)"
                mode="integer"
                allowUndefinedEmpty={true}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={1}>
              <Controller
                name={`bigExpenses.${index}.inflationLinked`}
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
            <Grid item xs={6} sm={1}>
              <IconButton onClick={() => remove(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Button variant="outlined" onClick={addExpense}>
          Add Big Expense
        </Button>
      </Grid>
    </Grid>
  );
};

export default BigExpensesStep;
