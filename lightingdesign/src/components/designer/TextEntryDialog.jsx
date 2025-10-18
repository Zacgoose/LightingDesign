import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

/**
 * Multi-line text entry dialog for text boxes
 */
export const TextEntryDialog = ({ open, onClose, onConfirm, title = "Enter Text", defaultValue = "" }) => {
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      value: defaultValue,
    },
  });

  // Reset form with new defaultValue when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ value: defaultValue });
    }
  }, [open, defaultValue, form]);

  const onSubmit = (data) => {
    onConfirm(data.value || "");
    onClose();
    form.reset({ value: "" });
  };

  const handleClose = () => {
    // Save on close even without submitting
    const value = form.getValues("value");
    onConfirm(value || "");
    onClose();
    form.reset({ value: "" });
  };

  const handleKeyDown = (e) => {
    // Allow Shift+Enter for new lines, but Enter alone submits
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            {...form.register("value")}
            fullWidth
            label="Text"
            margin="normal"
            multiline
            rows={4}
            autoFocus
            onKeyDown={handleKeyDown}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            OK
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TextEntryDialog;
