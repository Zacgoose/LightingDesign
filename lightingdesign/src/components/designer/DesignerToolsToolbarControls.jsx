import { Stack, ToggleButtonGroup, ToggleButton, Box, Typography, Button } from "@mui/material";
import { NearMe, PanTool, Close, Cable } from "@mui/icons-material";

const DesignerToolsToolbarControls = ({
  selectedTool,
  onToolChange,
  placementMode,
  onStopPlacement,
  onDisconnectCable,
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
      <>
        <ToggleButtonGroup
          value={selectedTool}
          exclusive
          onChange={(e, newTool) => {
            if (newTool !== null) {
              onToolChange(newTool);
            }
          }}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              padding: "1px",
              minWidth: "30px",
              minHeight: "30px",
            },
          }}
        >
          <ToggleButton value="select">
            <NearMe fontSize="small" />
          </ToggleButton>
          <ToggleButton value="pan">
            <PanTool fontSize="small" />
          </ToggleButton>
          <ToggleButton value="connect">
            <Cable fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        {selectedTool === "connect" && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Cable />}
            onClick={onDisconnectCable}
            size="small"
            sx={{ ml: 2 }}
          >
            Disconnect Cable
          </Button>
        )}
      </>
    )}
    {selectedTool &&
      selectedTool !== "select" &&
      selectedTool !== "pan" &&
      selectedTool !== "connect" &&
      !placementMode && (
        <Typography variant="body2" color="primary">
          Click on canvas to place {selectedTool}
        </Typography>
      )}
    {selectedTool === "connect" && (
      <Typography variant="body2" color="info.main">
        Click objects to string together, right-click to split
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
