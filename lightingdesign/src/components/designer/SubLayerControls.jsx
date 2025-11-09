import React, { useState, memo, useCallback } from "react";
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
 * Memoized sublayer item component to prevent unnecessary re-renders
 */
const SublayerItem = memo(
  ({
    sublayer,
    defaultSublayerId,
    editingSublayerId,
    editingName,
    onToggle,
    onContextMenu,
    onEditingNameChange,
    onFinishRename,
    onEditKeyDown,
  }) => {
    const handleToggle = useCallback(() => {
      onToggle(sublayer.id);
    }, [sublayer.id, onToggle]);

    const handleContextMenuClick = useCallback(
      (e) => {
        onContextMenu(e, sublayer);
      },
      [sublayer, onContextMenu],
    );

    const handleNameChange = useCallback(
      (e) => {
        onEditingNameChange(e.target.value);
      },
      [onEditingNameChange],
    );

    const handleFinishRename = useCallback(() => {
      onFinishRename(sublayer.id);
    }, [sublayer.id, onFinishRename]);

    const isEditing = editingSublayerId === sublayer.id;
    const isDefault = defaultSublayerId === sublayer.id;

    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        onContextMenu={handleContextMenuClick}
      >
        {isEditing ? (
          <TextField
            size="small"
            value={editingName}
            onChange={handleNameChange}
            onBlur={handleFinishRename}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={onEditKeyDown}
            autoFocus
            fullWidth
            sx={{ my: 0.5 }}
          />
        ) : (
          <>
            <FormControlLabel
              control={<Checkbox checked={sublayer.visible} onChange={handleToggle} size="small" />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                    {sublayer.name}
                  </Typography>
                  {isDefault && (
                    <Tooltip title="Default sublayer for new objects">
                      <StarIcon fontSize="small" color="primary" sx={{ fontSize: 14 }} />
                    </Tooltip>
                  )}
                </Box>
              }
              sx={{ flex: 1 }}
            />
            <IconButton size="small" onClick={handleContextMenuClick}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if sublayer properties or editing state changes
    return (
      prevProps.sublayer.id === nextProps.sublayer.id &&
      prevProps.sublayer.name === nextProps.sublayer.name &&
      prevProps.sublayer.visible === nextProps.sublayer.visible &&
      prevProps.defaultSublayerId === nextProps.defaultSublayerId &&
      prevProps.editingSublayerId === nextProps.editingSublayerId &&
      prevProps.editingName === nextProps.editingName
    );
  },
);

SublayerItem.displayName = "SublayerItem";

/**
 * SubLayerControls - UI component for showing/hiding sublayers within a floor
 */
export const SubLayerControls = memo(
  React.forwardRef(
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
        top = 200,
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

      const handleFinishRename = useCallback(
        (sublayerId) => {
          if (editingName.trim()) {
            onSublayerRename(layerId, sublayerId, editingName.trim());
          }
          // Always reset editing state, even if name is empty
          setEditingSublayerId(null);
          setEditingName("");
        },
        [editingName, layerId, onSublayerRename],
      );

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

      const handleSublayerToggle = useCallback(
        (sublayerId) => {
          onSublayerToggle(layerId, sublayerId);
        },
        [layerId, onSublayerToggle],
      );

      const handleEditingNameChange = useCallback((value) => {
        setEditingName(value);
      }, []);

      const handleEditKeyDown = useCallback(
        (e) => {
          if (e.key === "Enter") {
            const sublayerId = editingSublayerId;
            if (sublayerId) {
              handleFinishRename(sublayerId);
            }
          } else if (e.key === "Escape") {
            setEditingSublayerId(null);
            setEditingName("");
          }
        },
        [editingSublayerId, handleFinishRename],
      );

      return (
        <>
          <Paper
            ref={ref}
            elevation={2}
            sx={{
              position: "absolute",
              top: top,
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
                  <SublayerItem
                    key={sublayer.id}
                    sublayer={sublayer}
                    defaultSublayerId={defaultSublayerId}
                    editingSublayerId={editingSublayerId}
                    editingName={editingName}
                    onToggle={handleSublayerToggle}
                    onContextMenu={handleContextMenu}
                    onEditingNameChange={handleEditingNameChange}
                    onFinishRename={handleFinishRename}
                    onEditKeyDown={handleEditKeyDown}
                  />
                ))}
              </FormGroup>
            </Box>
          </Paper>

          <Menu
            open={contextMenu !== null}
            onClose={handleCloseContextMenu}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
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
  ),
  (prevProps, nextProps) => {
    // Custom comparison for SubLayerControls props
    // Only re-render if sublayers, layerId, defaultSublayerId, or top changes

    if (
      prevProps.layerId !== nextProps.layerId ||
      prevProps.defaultSublayerId !== nextProps.defaultSublayerId ||
      prevProps.top !== nextProps.top ||
      prevProps.sublayers.length !== nextProps.sublayers.length
    ) {
      return false; // Props changed, should re-render
    }

    // Quick check: if arrays are the same reference, no need to re-render
    if (prevProps.sublayers === nextProps.sublayers) {
      return true;
    }

    // Efficient comparison: check only display-relevant properties directly
    for (let i = 0; i < prevProps.sublayers.length; i++) {
      const prev = prevProps.sublayers[i];
      const next = nextProps.sublayers[i];

      if (prev.id !== next.id || prev.name !== next.name || prev.visible !== next.visible) {
        return false; // Found a difference, should re-render
      }
    }

    return true; // No differences found, skip re-render
  },
);

SubLayerControls.displayName = "SubLayerControls";

export default SubLayerControls;
