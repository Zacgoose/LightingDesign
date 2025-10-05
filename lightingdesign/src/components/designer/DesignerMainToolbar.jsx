import { Card, CardContent, Button, Stack, Box } from "@mui/material";
import { Save, Upload, Download, Undo, Redo } from "@mui/icons-material";

export const DesignerMainToolbar = ({ 
  onUploadFloorPlan, 
  onSave, 
  onExport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* File Operations */}
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

          {/* Spacer */}
          <Box sx={{ width: 16 }} />

          {/* Undo/Redo */}
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

          {/* Spacer to push remaining items to the right */}
          <Box sx={{ flex: 1 }} />
        </Stack>
      </CardContent>
    </Card>
  );
};