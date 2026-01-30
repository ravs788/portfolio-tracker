import { useFormContext, Controller } from 'react-hook-form';
import type { PlanInput } from '../../schemas';
import { useFieldArray } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import FormattedTextField from '../inputs/FormattedTextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const LoansStep = () => {
  const { control, register, formState: { errors } } = useFormContext<PlanInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'loans',
  });

  const addLoan = () => {
    append({ name: '', principal: 0, apr: 0, tenureMonths: 0, startYear: new Date().getFullYear(), startMonth: 1 });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">Loans</Typography>
      </Grid>
      {fields.map((field, index) => (
        <Grid item xs={12} key={field.id}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Name"
                {...register(`loans.${index}.name`)}
                error={!!errors.loans?.[index]?.name}
                helperText={errors.loans?.[index]?.name?.message}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormattedTextField
                name={`loans.${index}.principal`}
                label="Principal"
                mode="currency"
                fractionDigits={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormattedTextField
                name={`loans.${index}.apr`}
                label="APR (%)"
                mode="percent"
                fractionDigits={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormattedTextField
                name={`loans.${index}.tenureMonths`}
                label="Tenure (Months)"
                mode="integer"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <FormattedTextField
                name={`loans.${index}.startYear`}
                label="Start Year"
                mode="integer"
                groupThousands={false}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Controller
                name={`loans.${index}.startMonth`}
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Start Month</InputLabel>
                    <Select
                      label="Start Month"
                      value={field.value ?? 1}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {[...Array(12)].map((_, m) => (
                        <MenuItem key={m + 1} value={m + 1}>{m + 1}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
        <Button variant="outlined" onClick={addLoan}>
          Add Loan
        </Button>
      </Grid>
    </Grid>
  );
};

export default LoansStep;
