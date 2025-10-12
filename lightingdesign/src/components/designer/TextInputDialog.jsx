import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

/**
 * Simple text input dialog for getting user input
 */
export const TextInputDialog = ({ open, onClose, onConfirm, title, label, defaultValue = "" }) => {
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      value: defaultValue
    }
  });

  const onSubmit = (data) => {
    if (data.value && data.value.trim()) {
      onConfirm(data.value.trim());
      onClose();
      form.reset({ value: "" });
    }
  };

  const handleClose = () => {
    onClose();
    form.reset({ value: "" });
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            {...form.register("value", { required: true })}
            fullWidth
            label={label}
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            Confirm
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TextInputDialog;
