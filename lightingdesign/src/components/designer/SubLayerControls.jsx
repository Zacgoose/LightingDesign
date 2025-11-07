import React, { useState } from "react";
import {
  Box,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Radio,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { TextInputDialog } from "/src/components/designer/TextInputDialog";
import { ConfirmDialog } from "/src/components/designer/ConfirmDialog";

/**
 * SubLayerControls - UI component for showing/hiding sublayers within a floor
 */
export const SubLayerControls = React.forwardRef(
  (
    {
      sublayers = [],
      layerId,
      defaultSublayerId,
      onSublayerToggle,
      onSublayerAdd,
      onSublayerRemove,
      onSublayerRename,
      onSetDefaultSublayer,
      onClose,
    },
    ref,
  ) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [editingSublayerId, setEditingSublayerId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sublayerToDelete, setSublayerToDelete] = useState(null);

    if (!sublayers || sublayers.length === 0) {
      return null;
    }

    const handleContextMenu = (e, sublayer) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        mouseX: e.clientX,
        mouseY: e.clientY,
        sublayer,
      });
    };

    const handleCloseContextMenu = () => {
      setContextMenu(null);
    };

    const handleStartRename = (sublayer) => {
      handleCloseContextMenu();
      // Use setTimeout to ensure the context menu is closed before setting editing state
      // This prevents the TextField from being blurred immediately
      setTimeout(() => {
        setEditingSublayerId(sublayer.id);
        setEditingName(sublayer.name);
      }, 0);
    };

    const handleFinishRename = (sublayerId) => {
      if (editingName.trim()) {
        onSublayerRename(layerId, sublayerId, editingName.trim());
      }
      // Always reset editing state, even if name is empty
      setEditingSublayerId(null);
      setEditingName("");
    };

    const handleDelete = (sublayerId) => {
      setSublayerToDelete(sublayerId);
      setDeleteDialogOpen(true);
      handleCloseContextMenu();
    };

    const handleConfirmDelete = () => {
      if (sublayerToDelete) {
        onSublayerRemove(layerId, sublayerToDelete);
        setSublayerToDelete(null);
      }
    };

    const handleSetDefault = (sublayerId) => {
      onSetDefaultSublayer(layerId, sublayerId);
      handleCloseContextMenu();
    };

    const handleAddSublayer = () => {
      setAddDialogOpen(true);
    };

    const handleConfirmAdd = (name) => {
      onSublayerAdd(layerId, name);
    };

    return (
      <>
        <Paper
          ref={ref}
          elevation={2}
          sx={{
            position: "absolute",
            top: 200,
            right: 16,
            width: 240,
            display: "flex",
            flexDirection: "column",
            maxHeight: "180px",
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
              Sublayers
            </Typography>
            <Tooltip title="Add Sublayer">
              <IconButton size="small" onClick={handleAddSublayer} color="primary">
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />
          <Box sx={{ px: 1.5, py: 1, overflow: "auto", flex: 1 }}>
            <FormGroup>
              {sublayers.map((sublayer) => (
                <Box
                  key={sublayer.id}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  onContextMenu={(e) => handleContextMenu(e, sublayer)}
                >
                  {editingSublayerId === sublayer.id ? (
                    <TextField
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleFinishRename(sublayer.id)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleFinishRename(sublayer.id);
                        } else if (e.key === "Escape") {
                          setEditingSublayerId(null);
                          setEditingName("");
                        }
                      }}
                      autoFocus
                      fullWidth
                      sx={{ my: 0.5 }}
                    />
                  ) : (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sublayer.visible}
                            onChange={() => onSublayerToggle(layerId, sublayer.id)}
                            size="small"
                          />
                        }
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>{sublayer.name}</Typography>
                            {defaultSublayerId === sublayer.id && (
                              <Tooltip title="Default sublayer for new objects">
                                <StarIcon fontSize="small" color="primary" sx={{ fontSize: 14 }} />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                      <IconButton size="small" onClick={(e) => handleContextMenu(e, sublayer)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              ))}
            </FormGroup>
          </Box>
        </Paper>

        <Menu
          open={contextMenu !== null}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
          }
        >
          <MenuItem onClick={() => handleSetDefault(contextMenu?.sublayer.id)}>
            <ListItemIcon>
              {defaultSublayerId === contextMenu?.sublayer.id ? (
                <StarIcon fontSize="small" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>Set as Default</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStartRename(contextMenu?.sublayer)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          {sublayers.length > 1 && (
            <MenuItem onClick={() => handleDelete(contextMenu?.sublayer.id)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>

        <TextInputDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onConfirm={handleConfirmAdd}
          title="Add Sublayer"
          label="Sublayer Name"
          defaultValue={`Layer ${sublayers.length + 1}`}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSublayerToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Sublayer"
          message="Delete this sublayer? Objects in this layer will remain visible."
        />
      </>
    );
  },
);

SubLayerControls.displayName = "SubLayerControls";

export default SubLayerControls;
