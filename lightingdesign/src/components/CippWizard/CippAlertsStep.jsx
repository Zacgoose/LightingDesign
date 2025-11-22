import { Alert, Stack, Typography } from "@mui/material";
import { CippWizardStepButtons } from "./CippWizardStepButtons";

export const CippAlertsStep = (props) => {
  const { formControl, onPreviousStep, onNextStep, currentStep } = props;

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Typography variant="h6">Almost done</Typography>
        <Alert severity="info">
          <Typography variant="body1" gutterBottom>
            There's a couple more things that you can configure outside of the wizard, let's list
            some of them;
          </Typography>
          <ul>
            <li>
              Adding more users to CIPP? you can do this via CIPP &gt; Advanced &gt; Super Admin.
            </li>
          </ul>
        </Alert>
      </Stack>

      <CippWizardStepButtons
        currentStep={currentStep}
        onPreviousStep={onPreviousStep}
        onNextStep={onNextStep}
        formControl={formControl}
        noSubmitButton={true}
      />
    </Stack>
  );
};

export default CippAlertsStep;