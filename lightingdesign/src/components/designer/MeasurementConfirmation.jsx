import React, { useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';

export const MeasurementConfirmation = ({
  open,
  measurePoints,
  stagePosition,
  stageScale,
  onConfirm,
  onCancel,
  calculateDistance,
  scaleFactor,
}) => {
  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      distance: 0
    }
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  if (!open || !measurePoints || measurePoints.length !== 2) return null;

  // Calculate position for the dialog
  // Position it near the midpoint of the measurement line
  const midX = (measurePoints[0].x + measurePoints[1].x) / 2;
  const midY = (measurePoints[0].y + measurePoints[1].y) / 2;
  
  // Convert canvas coordinates to screen coordinates
  const screenX = midX * stageScale + stagePosition.x;
  const screenY = midY * stageScale + stagePosition.y;

  const handleSubmit = (data) => {
    onConfirm(data.distance);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const pixelDistance = calculateDistance(measurePoints[0], measurePoints[1]);
  const displayDistance = scaleFactor ? (pixelDistance / scaleFactor).toFixed(2) : pixelDistance.toFixed(2);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: screenX,
        top: screenY - 100, // Position above the line
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          minWidth: 280,
          backgroundColor: 'background.paper',
        }}
      >
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Stack spacing={2}>
            <TextField
              {...form.register('distance')}
              inputRef={inputRef}
              label="Real-world distance"
              type="number"
              size="small"
              fullWidth
              inputProps={{ 
                min: 0.001, 
                step: 0.001,
              }}
              helperText={`Measured: ${displayDistance} units`}
              onKeyDown={handleKeyDown}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button 
                size="small" 
                onClick={onCancel}
                color="inherit"
              >
                Cancel
              </Button>
              <Button 
                size="small" 
                type="submit"
                variant="contained"
              >
                Confirm
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default MeasurementConfirmation;
