import { Button } from "@mui/material";
import { Save, Upload, Download, Undo, Redo, Straighten } from "@mui/icons-material";

const DesignerMainToolbarControls = ({
  onUploadFloorPlan,
  onSave,
  onExport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onMeasure,
}) => [
  <Button key="upload" variant="outlined" startIcon={<Upload />} size="small" onClick={onUploadFloorPlan}>
    Upload Floor Plan
  </Button>,
  <Button key="save" variant="contained" startIcon={<Save />} size="small" onClick={onSave}>
    Save Project
  </Button>,
  <Button key="export" variant="outlined" startIcon={<Download />} size="small" onClick={onExport}>
    Export
  </Button>,
  <Button key="undo" variant="outlined" size="small" onClick={onUndo} disabled={!canUndo}>
    <Undo />
  </Button>,
  <Button key="redo" variant="outlined" size="small" onClick={onRedo} disabled={!canRedo}>
    <Redo />
  </Button>,
  <Button key="measure" variant="outlined" startIcon={<Straighten />} size="small" onClick={onMeasure}>
    Measure
  </Button>
];

export default DesignerMainToolbarControls;
