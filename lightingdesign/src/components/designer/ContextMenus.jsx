import React, { useState, useRef } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText, Box, Popover } from "@mui/material";
import {
  Delete,
  ContentCopy,
  SettingsBackupRestore,
  Add,
  SwapHoriz,
  Layers,
  ChevronRight,
} from "@mui/icons-material";

export const ContextMenus = ({
  contextMenu,
  onClose,
  onDuplicate,
  onOpenColorPicker,
  onResetScale,
  onDelete,
  onInsertProduct,
  onSwapPlacementProduct,
  onSwapProduct,
  onScale,
  onAssignToSublayer,
  sublayers = [],
}) => {
  const [sublayerMenuAnchor, setSublayerMenuAnchor] = useState(null);
  const sublayerMenuItemRef = useRef(null);

  // Prevent right-click on the menu itself - just close it
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleSublayerMenuOpen = (event) => {
    setSublayerMenuAnchor(event.currentTarget);
  };

  const handleSublayerMenuClose = () => {
    setSublayerMenuAnchor(null);
  };

  const handleSublayerSelect = (sublayerId) => {
    onAssignToSublayer(sublayerId);
    handleSublayerMenuClose();
  };

  const handleMainMenuClose = () => {
    handleSublayerMenuClose();
    onClose();
  };

  return (
    <Box
      onContextMenu={handleContextMenu}
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: contextMenu ? "auto" : "none",
      }}
    >
      <Menu
        key={contextMenu ? `${contextMenu.x},${contextMenu.y}` : "none"}
        open={contextMenu !== null}
        onClose={handleMainMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
      >
        {contextMenu?.type === "product" && (
          <>
            <MenuItem onClick={onDuplicate}>
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            <MenuItem onClick={onOpenColorPicker}>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              </ListItemIcon>
              <ListItemText>Change Color...</ListItemText>
            </MenuItem>
            <MenuItem onClick={onSwapProduct}>
              <ListItemIcon>
                <SwapHoriz fontSize="small" />
              </ListItemIcon>
              <ListItemText>Swap Product...</ListItemText>
            </MenuItem>
            <MenuItem onClick={onScale}>
              <ListItemIcon>
                <SettingsBackupRestore fontSize="small" />
              </ListItemIcon>
              <ListItemText>Scale...</ListItemText>
            </MenuItem>
            <MenuItem onClick={onResetScale}>
              <ListItemIcon>
                <SettingsBackupRestore fontSize="small" />
              </ListItemIcon>
              <ListItemText>Reset Scale</ListItemText>
            </MenuItem>
            {sublayers && sublayers.length > 0 && (
              <MenuItem
                ref={sublayerMenuItemRef}
                onMouseEnter={handleSublayerMenuOpen}
              >
                <ListItemIcon>
                  <Layers fontSize="small" />
                </ListItemIcon>
                <ListItemText>Assign to Sublayer</ListItemText>
                <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
            )}
            <MenuItem onClick={onDelete}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === "connector" && (
          <>
            <MenuItem onClick={onOpenColorPicker}>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              </ListItemIcon>
              <ListItemText>Change Color...</ListItemText>
            </MenuItem>
            {sublayers && sublayers.length > 0 && (
              <MenuItem
                ref={sublayerMenuItemRef}
                onMouseEnter={handleSublayerMenuOpen}
              >
                <ListItemIcon>
                  <Layers fontSize="small" />
                </ListItemIcon>
                <ListItemText>Assign to Sublayer</ListItemText>
                <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
            )}
            <MenuItem onClick={onDelete}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Connection</ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === "canvas" && (
          <MenuItem onClick={onInsertProduct}>
            <ListItemIcon>
              <Add fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Product...</ListItemText>
          </MenuItem>
        )}

        {contextMenu?.type === "placement" && (
          <MenuItem onClick={onSwapPlacementProduct}>
            <ListItemIcon>
              <SwapHoriz fontSize="small" />
            </ListItemIcon>
            <ListItemText>Swap Product...</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Sublayer submenu */}
      <Popover
        open={Boolean(sublayerMenuAnchor)}
        anchorEl={sublayerMenuAnchor}
        onClose={handleSublayerMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableRestoreFocus
        sx={{
          pointerEvents: "none",
        }}
        PaperProps={{
          onMouseEnter: () => {},
          onMouseLeave: handleSublayerMenuClose,
          sx: {
            pointerEvents: "auto",
            maxHeight: "240px", // 5 items * ~48px per item
            overflow: "auto",
          },
        }}
      >
        <Box
          sx={{
            minWidth: 200,
          }}
        >
          {sublayers.map((sublayer) => (
            <MenuItem
              key={sublayer.id}
              onClick={() => handleSublayerSelect(sublayer.id)}
            >
              <ListItemText>{sublayer.name}</ListItemText>
            </MenuItem>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};
