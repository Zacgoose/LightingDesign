import { ToggleButtonGroup, ToggleButton, Box, Typography, Button } from "@mui/material";
import { NearMe, PanTool, Close, Cable } from "@mui/icons-material";

const DesignerToolsToolbarControls = ({
  selectedTool,
  onToolChange,
  placementMode,
  onStopPlacement,
  onDisconnectCable,
}) => {
  const tools = [];

  if (placementMode) {
    tools.push(
      <Typography key="placing-text" variant="body2" color="success.main" fontWeight={600}>
        Placing: {placementMode.template.name}
      </Typography>
    );
    tools.push(
      <Button
        key="stop-placing"
        variant="outlined"
        color="error"
        startIcon={<Close />}
        onClick={onStopPlacement}
        size="small"
      >
        Stop Placing (ESC)
      </Button>
    );
  } else {
    tools.push(
      <ToggleButtonGroup
        key="tool-selector"
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
    );
    
    if (selectedTool === "connect") {
      tools.push(
        <Button
          key="disconnect"
          variant="outlined"
          color="primary"
          startIcon={<Cable />}
          onClick={onDisconnectCable}
          size="small"
        >
          Disconnect Cable
        </Button>
      );
    }
  }

  if (selectedTool &&
    selectedTool !== "select" &&
    selectedTool !== "pan" &&
    selectedTool !== "connect" &&
    !placementMode) {
    tools.push(
      <Typography key="place-text" variant="body2" color="primary">
        Click on canvas to place {selectedTool}
      </Typography>
    );
  }

  if (placementMode) {
    tools.push(
      <Typography key="placement-text" variant="body2" color="text.secondary">
        Click on canvas to place items
      </Typography>
    );
  }

  return tools;
};

export default DesignerToolsToolbarControls;
