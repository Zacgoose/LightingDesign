import React from 'react';
import {
  Box,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from '@mui/material';

/**
 * SubLayerControls - UI component for showing/hiding sublayers within a floor
 */
export const SubLayerControls = ({
  sublayers = [],
  layerId,
  onSublayerToggle,
}) => {
  if (!sublayers || sublayers.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 80,
        right: 312,
        width: 200,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
          Object Layers
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2, pt: 1 }}>
        <FormGroup>
          {sublayers.map((sublayer) => (
            <FormControlLabel
              key={sublayer.id}
              control={
                <Checkbox
                  checked={sublayer.visible}
                  onChange={() => onSublayerToggle(layerId, sublayer.id)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {sublayer.name}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </Box>
    </Paper>
  );
};

export default SubLayerControls;
