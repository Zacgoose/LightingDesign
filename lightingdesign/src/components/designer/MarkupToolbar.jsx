import {
  Card,
  Box,
  IconButton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Typography,
  Divider,
} from "@mui/material";
import { memo } from "react";
import {
  Crop,
  Rotate90DegreesCcw,
  Brush,
  HighlightOff,
  Check,
  Close,
  NearMe,
} from "@mui/icons-material";

export const MarkupToolbar = memo(
  ({
    markupMode,
    onMarkupModeChange,
    drawingColor,
    onDrawingColorChange,
    brushSize,
    onBrushSizeChange,
    onApply,
    onCancel,
  }) => {
    const handleModeChange = (event, newMode) => {
      if (newMode !== null) {
        onMarkupModeChange(newMode);
      }
    };

    const handleColorChange = (event, newColor) => {
      if (newColor !== null) {
        onDrawingColorChange(newColor);
      }
    };

    const handleBrushSizeChange = (event, newValue) => {
      onBrushSizeChange(newValue);
    };

    return (
      <Card sx={{ px: 2, py: 1, mb: 2, backgroundColor: "warning.light" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="body2" fontWeight={600} color="warning.dark">
            Image Markup Mode
          </Typography>

          <Divider orientation="vertical" flexItem />

          {/* Tool Selection */}
          <ToggleButtonGroup
            value={markupMode}
            exclusive
            onChange={handleModeChange}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                padding: "4px 8px",
                minWidth: "40px",
              },
            }}
          >
            <ToggleButton value="select" title="Select">
              <NearMe fontSize="small" />
            </ToggleButton>
            <ToggleButton value="crop" title="Crop">
              <Crop fontSize="small" />
            </ToggleButton>
            <ToggleButton value="rotate" title="Rotate">
              <Rotate90DegreesCcw fontSize="small" />
            </ToggleButton>
            <ToggleButton value="draw" title="Draw">
              <Brush fontSize="small" />
            </ToggleButton>
            <ToggleButton value="erase" title="Erase">
              <HighlightOff fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Color Selection - only show when draw or erase mode */}
          {(markupMode === "draw" || markupMode === "erase") && (
            <>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption">Color:</Typography>
                <ToggleButtonGroup
                  value={drawingColor}
                  exclusive
                  onChange={handleColorChange}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      padding: "2px 8px",
                      minWidth: "50px",
                      fontSize: "0.75rem",
                    },
                  }}
                >
                  <ToggleButton value="black">Black</ToggleButton>
                  <ToggleButton value="white">White</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Brush Size Slider */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 150 }}>
                <Typography variant="caption">Size:</Typography>
                <Slider
                  value={brushSize}
                  onChange={handleBrushSizeChange}
                  min={1}
                  max={20}
                  step={1}
                  valueLabelDisplay="auto"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" sx={{ minWidth: 20 }}>
                  {brushSize}
                </Typography>
              </Box>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Apply/Cancel Buttons */}
          <Button
            variant="contained"
            color="success"
            startIcon={<Check />}
            size="small"
            onClick={onApply}
          >
            Apply Changes
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Close />}
            size="small"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Box>
      </Card>
    );
  },
);

MarkupToolbar.displayName = "MarkupToolbar";

export default MarkupToolbar;
