import { useFormContext, useFieldArray } from 'react-hook-form';
import type { PlanInput } from '../../schemas';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormattedTextField from '../inputs/FormattedTextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

const InvestmentsStep = () => {
  const { control, register, formState: { errors } } = useFormContext<PlanInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'investment.sips',
  });

  const addSIP = () => {
    append({ name: '', amountMonthly: 0 });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">Investments</Typography>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormattedTextField
          name="investment.currentCorpus"
          label="Current Corpus"
          mode="currency"
          fractionDigits={2}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormattedTextField
          name="investment.monthlyContribution"
          label="Monthly Contribution (Other)"
          mode="currency"
          fractionDigits={2}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormattedTextField
          name="investment.expectedAnnualReturn"
          label="Expected Annual Return (%)"
          mode="percent"
          fractionDigits={2}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormattedTextField
          name="investment.contributionGrowthRate"
          label="Contribution Growth Rate (%)"
          mode="percent"
          fractionDigits={2}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>SIPs</Typography>
      </Grid>

      {fields.map((field, index) => (
        <Grid item xs={12} key={field.id}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="SIP Name"
                {...register(`investment.sips.${index}.name`)}
                error={!!errors.investment?.sips?.[index]?.name}
                helperText={errors.investment?.sips?.[index]?.name?.message}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormattedTextField
                name={`investment.sips.${index}.amountMonthly`}
                label="Amount (Monthly)"
                mode="currency"
                fractionDigits={2}
                fullWidth
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
        <Button variant="outlined" onClick={addSIP}>
          Add SIP
        </Button>
      </Grid>
    </Grid>
  );
};

export default InvestmentsStep;
