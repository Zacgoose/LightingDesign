import { Stack, ToggleButtonGroup, ToggleButton, Divider, Box, Typography, Button } from "@mui/material";
import { NearMe, PanTool, Close } from "@mui/icons-material";

const DesignerToolsToolbarControls = ({
  selectedTool,
  onToolChange,
  placementMode,
  onStopPlacement
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    {placementMode ? (
      <>
        <Typography variant="body2" color="success.main" fontWeight={600}>
          Placing: {placementMode.template.name}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Close />}
          onClick={onStopPlacement}
          size="small"
        >
          Stop Placing (ESC)
        </Button>
      </>
    ) : (
      <ToggleButtonGroup
        value={selectedTool}
        exclusive
        onChange={(e, newTool) => {
          if (newTool !== null) {
            onToolChange(newTool);
          }
        }}
        size="small"
      >
        <ToggleButton value="select">
          <NearMe fontSize="small" />
        </ToggleButton>
        <ToggleButton value="pan">
          <PanTool fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>
    )}
    <Box sx={{ flex: 1 }} />
    {selectedTool && selectedTool !== 'select' && selectedTool !== 'pan' && !placementMode && (
      <Typography variant="body2" color="primary">
        Click on canvas to place {selectedTool}
      </Typography>
    )}
    {placementMode && (
      <Typography variant="body2" color="text.secondary">
        Click on canvas to place items
      </Typography>
    )}
  </Stack>
);

export default DesignerToolsToolbarControls;
