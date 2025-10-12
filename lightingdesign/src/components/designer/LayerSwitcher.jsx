import React from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

/**
 * LayerSwitcher - UI component for managing and switching between floor layers
 */
export const LayerSwitcher = ({
  layers = [],
  activeLayerId,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
  onLayerToggleVisibility,
  onLayerToggleLock,
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 80,
        right: 16,
        width: 280,
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Layers
        </Typography>
        <Tooltip title="Add New Layer">
          <IconButton size="small" onClick={onLayerAdd} color="primary">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
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
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={layer.visible ? 'Hide Layer' : 'Show Layer'}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerToggleVisibility(layer.id);
                      }}
                    >
                      {layer.visible ? (
                        <VisibilityIcon fontSize="small" />
                      ) : (
                        <VisibilityOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerToggleLock(layer.id);
                      }}
                    >
                      {layer.locked ? (
                        <LockIcon fontSize="small" />
                      ) : (
                        <LockOpenIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  {layers.length > 1 && (
                    <Tooltip title="Delete Layer">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete layer "${layer.name}"?`)) {
                            onLayerDelete(layer.id);
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              <ListItemButton
                selected={isActive}
                onClick={() => onLayerSelect(layer.id)}
                sx={{
                  py: 1.5,
                  opacity: layer.visible ? 1 : 0.5,
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
    </Paper>
  );
};

export default LayerSwitcher;
