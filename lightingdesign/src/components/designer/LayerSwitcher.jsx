import React, { useState, memo, useMemo, useCallback, forwardRef } from "react";
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
 * LayerItem - Memoized list item for individual layers
 */
const LayerItem = memo(({ layer, isActive, canDelete, onSelect, onDelete, listItemButtonSx }) => {
  const handleSelect = useCallback(() => {
    onSelect(layer.id);
  }, [onSelect, layer.id]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      onDelete(layer.id, layer.name);
    },
    [onDelete, layer.id, layer.name],
  );

  const primaryTypographyProps = useMemo(
    () => ({
      fontWeight: isActive ? 600 : 400,
      variant: "h6",
      fontSize: "0.8rem",
    }),
    [isActive],
  );

  return (
    <ListItem
      key={layer.id}
      disablePadding
      secondaryAction={
        canDelete && (
          <Tooltip title="Delete Layer">
            <IconButton edge="end" size="small" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
    >
      <ListItemButton selected={isActive} onClick={handleSelect} sx={listItemButtonSx}>
        <ListItemText
          primary={layer.name}
          secondary={`${layer.products?.length || 0} objects`}
          primaryTypographyProps={primaryTypographyProps}
        />
      </ListItemButton>
    </ListItem>
  );
});

LayerItem.displayName = "LayerItem";

/**
 * LayerSwitcher - UI component for managing and switching between floor layers
 */
export const LayerSwitcher = memo(
  forwardRef(
    (
      {
        layers = [],
        activeLayerId,
        onLayerSelect,
        onLayerAdd,
        onLayerDelete,
        onClose,
        subLayerControlsRef,
        top = 16,
      },
      ref,
    ) => {
      const [addDialogOpen, setAddDialogOpen] = useState(false);
      const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
      const [layerToDelete, setLayerToDelete] = useState(null);

      // Memoize stable sx objects to prevent re-renders
      const paperSx = useMemo(
        () => ({
          position: "absolute",
          top: top,
          right: 16,
          width: 240,
          maxHeight: "180px",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }),
        [top],
      );

      const headerBoxSx = useMemo(
        () => ({
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }),
        [],
      );

      const titleSx = useMemo(() => ({ fontWeight: 500, fontSize: "0.8rem" }), []);

      const listSx = useMemo(
        () => ({
          flex: 1,
          overflow: "auto",
          py: 0,
        }),
        [],
      );

      const listItemButtonSx = useMemo(() => ({ py: 0 }), []);

      const handleAddLayer = useCallback(() => {
        setAddDialogOpen(true);
      }, []);

      const handleConfirmAdd = useCallback(
        (name) => {
          onLayerAdd(name);
        },
        [onLayerAdd],
      );

      const handleDeleteLayer = useCallback((layerId, layerName) => {
        setLayerToDelete({ id: layerId, name: layerName });
        setDeleteDialogOpen(true);
      }, []);

      const handleConfirmDelete = useCallback(() => {
        if (layerToDelete) {
          onLayerDelete(layerToDelete.id);
          setLayerToDelete(null);
        }
      }, [layerToDelete, onLayerDelete]);

      const handleCloseAdd = useCallback(() => setAddDialogOpen(false), []);
      const handleCloseDelete = useCallback(() => {
        setDeleteDialogOpen(false);
        setLayerToDelete(null);
      }, []);

      return (
        <Paper ref={ref} elevation={2} sx={paperSx}>
          <Box sx={headerBoxSx}>
            <Typography variant="h6" sx={titleSx}>
              Layers
            </Typography>
            <Tooltip title="Add New Layer">
              <IconButton size="small" onClick={handleAddLayer} color="primary">
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />
          <List sx={listSx}>
            {layers.map((layer) => {
              const isActive = layer.id === activeLayerId;
              return (
                <LayerItem
                  key={layer.id}
                  layer={layer}
                  isActive={isActive}
                  canDelete={layers.length > 1}
                  onSelect={onLayerSelect}
                  onDelete={handleDeleteLayer}
                  listItemButtonSx={listItemButtonSx}
                />
              );
            })}
          </List>

          <TextInputDialog
            open={addDialogOpen}
            onClose={handleCloseAdd}
            onConfirm={handleConfirmAdd}
            title="Add Layer"
            label="Layer Name"
            defaultValue={`Floor ${layers.length + 1}`}
          />

          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={handleCloseDelete}
            onConfirm={handleConfirmDelete}
            title="Delete Layer"
            message={`Delete layer "${layerToDelete?.name}"?`}
          />
        </Paper>
      );
    },
  ),
);

LayerSwitcher.displayName = "LayerSwitcher";

export default LayerSwitcher;
