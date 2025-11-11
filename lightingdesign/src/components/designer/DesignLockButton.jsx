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
import RefreshIcon from "@mui/icons-material/Refresh";
import { format } from "date-fns";

export const DesignLockButton = ({ isLocked, isOwner, lockInfo, onLock, onUnlock, onRefresh, disabled }) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "", lockInfo: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLockClick = async () => {
    if (isOwner) {
      // User owns the lock, unlock directly without confirmation
      setIsLocking(true);
      await onUnlock();
      setIsLocking(false);
    } else if (isLocked) {
      // Someone else has the lock, show info
      setConfirmDialogOpen(true);
    } else {
      // Not locked, acquire lock
      setIsLocking(true);
      const result = await onLock();
      setIsLocking(false);

      // Handle errors (including 409 conflicts)
      if (!result?.success) {
        if (result?.isConflict && result?.lockInfo) {
          // Show conflict dialog with lock info
          setErrorDialog({
            open: true,
            message: result.error,
            lockInfo: result.lockInfo,
          });
        } else {
          // Show general error dialog
          setErrorDialog({
            open: true,
            message: result?.error || "Failed to lock design",
            lockInfo: null,
          });
        }
      }
    }
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({ open: false, message: "", lockInfo: null });
  };

  const handleRefreshStatus = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
  };

  const getButtonText = () => {
    if (isLocking) return "Processing...";
    if (isOwner) return "Finish Editing";
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
      return "Click to finish editing and save your changes.";
    }
    if (isLocked && lockInfo) {
      return `Locked by ${lockInfo.LockedBy}. Cannot edit until unlocked.`;
    }
    return "Click to enable editing mode";
  };

  const getDialogContent = () => {
    // Only show dialog when locked by someone else
    if (isLocked && !isOwner && lockInfo) {
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
            {/* Show "Check Status" button when locked by someone else */}
            {isLocked && !isOwner && (
              <Button 
                onClick={handleRefreshStatus} 
                color="primary"
                startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Checking..." : "Check Status"}
              </Button>
            )}
            <Button onClick={handleCloseDialog} color="primary" variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Error dialog for lock conflicts and other errors */}
      <Dialog open={errorDialog.open} onClose={handleCloseErrorDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cannot Lock Design</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {errorDialog.message}
          </Typography>
          {errorDialog.lockInfo && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Locked by:</strong> {errorDialog.lockInfo.LockedBy}
              </Typography>
              {errorDialog.lockInfo.LockedAt && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Locked at:</strong>{" "}
                  {format(new Date(errorDialog.lockInfo.LockedAt), "MMM dd, yyyy HH:mm:ss")}
                </Typography>
              )}
              {errorDialog.lockInfo.ExpiresAt && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Expires at:</strong>{" "}
                  {format(new Date(errorDialog.lockInfo.ExpiresAt), "MMM dd, yyyy HH:mm:ss")}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog} color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
