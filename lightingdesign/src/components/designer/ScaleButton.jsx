import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

export function ScaleButton({ open, onClose, onScale, defaultValue = 1, label = "Scale" }) {
  const [scaleValue, setScaleValue] = useState(defaultValue);

  const handleConfirm = () => {
    onScale(Number(scaleValue));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Set Scale</DialogTitle>
      <DialogContent>
        <TextField
          label={label}
          type="number"
          value={scaleValue}
          onChange={e => setScaleValue(e.target.value)}
          fullWidth
          inputProps={{ min: 0.001, step: 0.001 }}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}