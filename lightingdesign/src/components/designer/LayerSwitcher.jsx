import React, { useState } from "react";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextInputDialog } from "/src/components/designer/TextInputDialog";
import { ConfirmDialog } from "/src/components/designer/ConfirmDialog";

/**
 * LayerSwitcher - UI component for managing and switching between floor layers
 */
export const LayerSwitcher = ({
  layers = [],
  activeLayerId,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onClose,
  subLayerControlsRef,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [layerToDelete, setLayerToDelete] = useState(null);

  const handleAddLayer = () => {
    setAddDialogOpen(true);
  };

  const handleConfirmAdd = (name) => {
    onLayerAdd(name);
  };

  const handleDeleteLayer = (layerId, layerName) => {
    setLayerToDelete({ id: layerId, name: layerName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (layerToDelete) {
      onLayerDelete(layerToDelete.id);
      setLayerToDelete(null);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 240,
        maxHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
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
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Layers
        </Typography>
        <Tooltip title="Add New Layer">
          <IconButton size="small" onClick={handleAddLayer} color="primary">
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List
        sx={{
          flex: 1,
          overflow: "auto",
          py: 0,
        }}
      >
        {layers.map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          return (
            <ListItem
              key={layer.id}
              disablePadding
              secondaryAction={
                layers.length > 1 && (
                  <Tooltip title="Delete Layer">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayer(layer.id, layer.name);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ListItemButton
                selected={isActive}
                onClick={() => onLayerSelect(layer.id)}
                sx={{
                  py: 1.5,
                }}
              >
                <ListItemText
                  primary={layer.name}
                  secondary={`${layer.products?.length || 0} objects`}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <TextInputDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleConfirmAdd}
        title="Add Layer"
        label="Layer Name"
        defaultValue={`Floor ${layers.length + 1}`}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setLayerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Layer"
        message={`Delete layer "${layerToDelete?.name}"?`}
      />
    </Paper>
  );
};

export default LayerSwitcher;
