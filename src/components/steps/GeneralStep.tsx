import { useFormContext } from 'react-hook-form';
import { PlanInput } from '../../schemas';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import FormattedTextField from '../inputs/FormattedTextField';

const GeneralStep = () => {
  const { register, formState: { errors } } = useFormContext<PlanInput>();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormattedTextField
          name="settings.startYear"
          label="Start Year"
          mode="integer"
          groupThousands={false}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormattedTextField
          name="settings.horizonYears"
          label="Horizon Years"
          mode="integer"
          groupThousands={false}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Currency"
          {...register('settings.currency')}
          error={!!errors.settings?.currency}
          helperText={errors.settings?.currency?.message}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormattedTextField
          name="settings.inflationRate"
          label="Inflation Rate (%)"
          mode="percent"
          fractionDigits={2}
          fullWidth
        />
      </Grid>
    </Grid>
  );
};

export default GeneralStep;
