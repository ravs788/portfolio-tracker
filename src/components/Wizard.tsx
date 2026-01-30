import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlanInput, PlanInputSchema } from '../schemas';
import { calculatePlan } from '../calculationEngine';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Import step components (we'll create these)
import GeneralStep from './steps/GeneralStep';
import IncomesStep from './steps/IncomesStep.tsx';
import MonthlyExpensesStep from './steps/MonthlyExpensesStep.tsx';
import BigExpensesStep from './steps/BigExpensesStep.tsx';
import InvestmentsStep from './steps/InvestmentsStep.tsx';
import LoansStep from './steps/LoansStep.tsx';
import ReviewStep from './steps/ReviewStep.tsx';

const steps = [
  'General',
  'Incomes',
  'Monthly Expenses',
  'Big Expenses',
  'Investments',
  'Loans',
  'Review',
];

const Wizard = () => {
const { plan, updatePlan, reset } = useAppStore();
  const methods = useForm<PlanInput>({
    resolver: zodResolver(PlanInputSchema),
    defaultValues: plan,
    // Ensure imported plan values populate all fields/arrays across steps
    // when plan changes (e.g., after CSV/JSON import).
    // RHF will re-sync form state with these values.
    values: plan,
  });

  // Keep form values in sync with imported plan
  useEffect(() => {
    methods.reset(plan);
  }, [plan, methods]);

  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const navigate = useNavigate();
  const handleSubmit = (data: PlanInput) => {
    console.log('Form submitted with data:', data);
    updatePlan(data);
    const output = calculatePlan(data, useAppStore.getState().includeTentative);
    console.log('Calculated output:', output);
    useAppStore.getState().setCalculated(output);
    navigate('/results');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0: return <GeneralStep />;
      case 1: return <IncomesStep />;
      case 2: return <MonthlyExpensesStep />;
      case 3: return <BigExpensesStep />;
      case 4: return <InvestmentsStep />;
      case 5: return <LoansStep />;
      case 6: return <ReviewStep onGoToStart={() => setActiveStep(0)} />;
      default: return <Typography>Unknown step</Typography>;
    }
  };

const handleClear = () => {
  reset();
  methods.reset(useAppStore.getState().plan);
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={methods.handleSubmit(handleSubmit, (errors) => console.error('Validation errors:', errors))}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={handleClear}>
            Clear All Data
          </Button>
          <Button variant="outlined" component={Link} to="/">
            Home
          </Button>
        </Box>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ mt: 4 }}>
          {getStepContent(activeStep)}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep === steps.length - 1 && (
              <Button variant="outlined" color="primary" onClick={() => setActiveStep(0)}>
                Go to Start
              </Button>
            )}
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
          </Box>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? undefined : handleNext}
            type={activeStep === steps.length - 1 ? 'submit' : 'button'}
          >
            {activeStep === steps.length - 1 ? 'Calculate' : 'Next'}
          </Button>
        </Box>
      </Box>
    </FormProvider>
  );
};

export default Wizard;
