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
  Info,
  AddCircleOutline,
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
  onShowProperties,
  onInsertCustomObject,
  sublayers = [],
  selectedProductsCount = 0,
}) => {
  const [sublayerMenuAnchor, setSublayerMenuAnchor] = useState(null);
  const [customObjectMenuAnchor, setCustomObjectMenuAnchor] = useState(null);
  const sublayerMenuItemRef = useRef(null);
  const customObjectMenuItemRef = useRef(null);

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

  const handleCustomObjectMenuOpen = (event) => {
    setCustomObjectMenuAnchor(event.currentTarget);
  };

  const handleCustomObjectMenuClose = () => {
    setCustomObjectMenuAnchor(null);
  };

  const handleCustomObjectSelect = (shapeName) => {
    if (onInsertCustomObject) {
      onInsertCustomObject(shapeName);
    }
    handleCustomObjectMenuClose();
  };

  // Wrapper to ensure submenus close when any menu item is clicked
  const handleMenuItemClick = (handler) => {
    return (e) => {
      handleSublayerMenuClose();
      handleCustomObjectMenuClose();
      if (handler) {
        handler(e);
      }
    };
  };

  const handleMainMenuClose = () => {
    handleSublayerMenuClose();
    handleCustomObjectMenuClose();
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
            {selectedProductsCount === 1 && onShowProperties && (
              <MenuItem onClick={handleMenuItemClick(onShowProperties)}>
                <ListItemIcon>
                  <Info fontSize="small" />
                </ListItemIcon>
                <ListItemText>Properties</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleMenuItemClick(onDuplicate)}>
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuItemClick(onOpenColorPicker)}>
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
            <MenuItem onClick={handleMenuItemClick(onSwapProduct)}>
              <ListItemIcon>
                <SwapHoriz fontSize="small" />
              </ListItemIcon>
              <ListItemText>Swap Product...</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuItemClick(onScale)}>
              <ListItemIcon>
                <SettingsBackupRestore fontSize="small" />
              </ListItemIcon>
              <ListItemText>Scale...</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuItemClick(onResetScale)}>
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
            <MenuItem onClick={handleMenuItemClick(onDelete)}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === "connector" && (
          <>
            <MenuItem onClick={handleMenuItemClick(onOpenColorPicker)}>
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
            <MenuItem onClick={handleMenuItemClick(onDelete)}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Connection</ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === "canvas" && (
          <>
            <MenuItem onClick={handleMenuItemClick(onInsertProduct)}>
              <ListItemIcon>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText>Add Product...</ListItemText>
            </MenuItem>
            {onInsertCustomObject && (
              <MenuItem
                ref={customObjectMenuItemRef}
                onMouseEnter={handleCustomObjectMenuOpen}
              >
                <ListItemIcon>
                  <AddCircleOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText>Insert Custom Object</ListItemText>
                <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
            )}
          </>
        )}

        {contextMenu?.type === "placement" && (
          <MenuItem onClick={handleMenuItemClick(onSwapPlacementProduct)}>
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

      {/* Custom Object submenu */}
      <Popover
        open={Boolean(customObjectMenuAnchor)}
        anchorEl={customObjectMenuAnchor}
        onClose={handleCustomObjectMenuClose}
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
          onMouseLeave: handleCustomObjectMenuClose,
          sx: {
            pointerEvents: "auto",
            maxHeight: "400px",
            overflow: "auto",
          },
        }}
      >
        <Box
          sx={{
            minWidth: 200,
          }}
        >
          <MenuItem onClick={() => handleCustomObjectSelect("pendant")}>
            <ListItemText>Pendant</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("downlight")}>
            <ListItemText>Downlight</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("spotlight")}>
            <ListItemText>Spotlight</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("wall")}>
            <ListItemText>Wall Light</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("ceiling")}>
            <ListItemText>Ceiling Light</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("floor")}>
            <ListItemText>Floor Lamp</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("table")}>
            <ListItemText>Table Lamp</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("lamp")}>
            <ListItemText>Lamp</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("strip")}>
            <ListItemText>Strip Light</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("fan")}>
            <ListItemText>Fan</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("track")}>
            <ListItemText>Track Light</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("chandelier")}>
            <ListItemText>Chandelier</ListItemText>
          </MenuItem>
        </Box>
      </Popover>
    </Box>
  );
};
