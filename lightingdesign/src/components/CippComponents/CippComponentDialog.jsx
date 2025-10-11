import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

export const CippComponentDialog = (props) => {
  const { children, createDialog, title, ...other } = props;
  const formHook = createDialog.form;

  const onSubmit = async (data) => {
    await createDialog.handleSubmit(data);
    createDialog.handleClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={createDialog.handleClose} open={createDialog.open}>
      <form onSubmit={formHook.handleSubmit(onSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={createDialog.handleClose}>
            Close
          </Button>
          <Button variant="contained" type="submit">
            Confirm
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CippComponentDialog;
