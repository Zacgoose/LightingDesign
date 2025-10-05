import { Card, CardContent, Stack, ToggleButtonGroup, ToggleButton, Divider, Box, Typography } from "@mui/material";
import { 
  LightbulbOutlined, 
  ToggleOnOutlined, 
  WindPowerOutlined,
  PowerOutlined,
  NearMe,
  PanTool
} from "@mui/icons-material";

export const DesignerToolsToolbar = ({ 
  selectedTool,
  onToolChange
}) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" fontWeight={600}>
            Tools:
          </Typography>

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

          <Divider orientation="vertical" flexItem />

          <Box sx={{ flex: 1 }} />

          {selectedTool && selectedTool !== 'select' && selectedTool !== 'pan' && (
            <Typography variant="body2" color="primary">
              Click on canvas to place {selectedTool}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};