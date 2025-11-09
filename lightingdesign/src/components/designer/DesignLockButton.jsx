import { useState } from "react";
import {
  Box,
  Button,
  Tooltip,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { format } from "date-fns";

export const DesignLockButton = ({ isLocked, isOwner, lockInfo, onLock, onUnlock, disabled }) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const handleLockClick = async () => {
    if (isOwner) {
      // User owns the lock, show confirmation to unlock
      setConfirmDialogOpen(true);
    } else if (isLocked) {
      // Someone else has the lock, show info
      setConfirmDialogOpen(true);
    } else {
      // Not locked, acquire lock
      setIsLocking(true);
      await onLock();
      setIsLocking(false);
    }
  };

  const handleConfirmUnlock = async () => {
    setConfirmDialogOpen(false);
    setIsLocking(true);
    await onUnlock();
    setIsLocking(false);
  };

  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
  };

  const getButtonText = () => {
    if (isLocking) return "Processing...";
    if (isOwner) return "Unlock Design";
    if (isLocked) return "Locked";
    return "Enable Editing";
  };

  const getButtonColor = () => {
    if (isOwner) return "success";
    if (isLocked) return "error";
    return "primary";
  };

  const getTooltipText = () => {
    if (isOwner) {
      return "You have editing enabled. Click to unlock and save changes.";
    }
    if (isLocked && lockInfo) {
      return `Locked by ${lockInfo.LockedBy}. Cannot edit until unlocked.`;
    }
    return "Click to enable editing mode";
  };

  const getDialogContent = () => {
    if (isOwner) {
      return {
        title: "Unlock Design?",
        content:
          "Are you sure you want to unlock this design? Any unsaved changes will be saved automatically, and the design data will be refreshed to ensure you have the latest version.",
        action: "Unlock & Save",
      };
    } else if (isLocked && lockInfo) {
      return {
        title: "Design Locked",
        content: (
          <>
            <Typography variant="body1" gutterBottom>
              This design is currently locked by <strong>{lockInfo.LockedBy}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Locked at: {format(new Date(lockInfo.LockedAt), "MMM dd, yyyy HH:mm:ss")}
            </Typography>
            {lockInfo.ExpiresAt && (
              <Typography variant="body2" color="text.secondary">
                Expires at: {format(new Date(lockInfo.ExpiresAt), "MMM dd, yyyy HH:mm:ss")}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 2 }}>
              You cannot make changes until the design is unlocked.
            </Typography>
          </>
        ),
        action: null,
      };
    }
    return null;
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <Tooltip title={getTooltipText()}>
        <span>
          <Button
            variant="contained"
            color={getButtonColor()}
            size="small"
            startIcon={
              isLocking ? (
                <CircularProgress size={20} color="inherit" />
              ) : isOwner ? (
                <LockOpenIcon />
              ) : (
                <LockIcon />
              )
            }
            onClick={handleLockClick}
            disabled={disabled || isLocking || (isLocked && !isOwner)}
            sx={{
              minWidth: 140,
              textTransform: "none",
              fontWeight: isOwner ? "bold" : "normal",
            }}
          >
            {getButtonText()}
          </Button>
        </span>
      </Tooltip>

      {dialogContent && (
        <Dialog open={confirmDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{dialogContent.title}</DialogTitle>
          <DialogContent>{dialogContent.content}</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              Close
            </Button>
            {dialogContent.action && (
              <Button onClick={handleConfirmUnlock} color="primary" variant="contained">
                {dialogContent.action}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
