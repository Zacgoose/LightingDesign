import { Button, Stack, Box } from "@mui/material";
import { Save, Upload, Download, Undo, Redo, Straighten } from "@mui/icons-material";

const DesignerMainToolbarControls = ({
  onUploadFloorPlan,
  onSave,
  onExport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onMeasure
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Button
      variant="outlined"
      startIcon={<Upload />}
      size="small"
      onClick={onUploadFloorPlan}
    >
      Upload Floor Plan
    </Button>
    <Button
      variant="contained"
      startIcon={<Save />}
      size="small"
      onClick={onSave}
    >
      Save Project
    </Button>
    <Button
      variant="outlined"
      startIcon={<Download />}
      size="small"
      onClick={onExport}
    >
      Export
    </Button>
    <Button
      variant="outlined"
      size="small"
      onClick={onUndo}
      disabled={!canUndo}
    >
      <Undo />
    </Button>
    <Button
      variant="outlined"
      size="small"
      onClick={onRedo}
      disabled={!canRedo}
    >
      <Redo />
    </Button>
    <Button
      variant="outlined"
      startIcon={<Straighten />}
      size="small"
      onClick={onMeasure}
    >
      Measure
    </Button>
  </Stack>
);

export default DesignerMainToolbarControls;
