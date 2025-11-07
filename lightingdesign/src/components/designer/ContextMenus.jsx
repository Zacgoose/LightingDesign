import { useState, useRef } from "react";
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
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  TextFields,
  BorderColor,
  StraightenOutlined,
  VerticalAlignCenter,
  VerticalAlignTop,
  MultipleStop,
  Numbers,
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
  onSwapAllSameProducts,
  onScale,
  onAssignToSublayer,
  onShowProperties,
  onInsertCustomObject,
  onChangeQuantity,
  sublayers = [],
  selectedProductsCount = 0,
  selectedConnectorsCount = 0,
  onTextEdit,
  onTextFormatBold,
  onTextFormatItalic,
  onTextFormatUnderline,
  onTextFontSize,
  onTextToggleBorder,
  onResetConnectorToStraight,
  onAlignHorizontalCenter,
  onAlignVerticalCenter,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onEvenSpacingHorizontal,
  onEvenSpacingVertical,
}) => {
  const [sublayerMenuAnchor, setSublayerMenuAnchor] = useState(null);
  const [customObjectMenuAnchor, setCustomObjectMenuAnchor] = useState(null);
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] = useState(null);
  const [alignmentMenuAnchor, setAlignmentMenuAnchor] = useState(null);
  const [swapMenuAnchor, setSwapMenuAnchor] = useState(null);
  const sublayerMenuItemRef = useRef(null);
  const customObjectMenuItemRef = useRef(null);
  const fontSizeMenuItemRef = useRef(null);
  const alignmentMenuItemRef = useRef(null);
  const swapMenuItemRef = useRef(null);

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

  const handleFontSizeMenuOpen = (event) => {
    setFontSizeMenuAnchor(event.currentTarget);
  };

  const handleFontSizeMenuClose = () => {
    setFontSizeMenuAnchor(null);
  };

  const handleFontSizeSelect = (fontSize) => {
    if (onTextFontSize) {
      onTextFontSize(fontSize);
    }
    handleFontSizeMenuClose();
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

  const handleAlignmentMenuOpen = (event) => {
    setAlignmentMenuAnchor(event.currentTarget);
  };

  const handleAlignmentMenuClose = () => {
    setAlignmentMenuAnchor(null);
  };

  const handleSwapMenuOpen = (event) => {
    setSwapMenuAnchor(event.currentTarget);
  };

  const handleSwapMenuClose = () => {
    setSwapMenuAnchor(null);
  };

  // Wrapper to ensure submenus close when any menu item is clicked
  const handleMenuItemClick = (handler) => {
    return (e) => {
      handleSublayerMenuClose();
      handleCustomObjectMenuClose();
      handleFontSizeMenuClose();
      handleAlignmentMenuClose();
      handleSwapMenuClose();
      if (handler) {
        handler(e);
      }
    };
  };

  // Close submenus when hovering over other menu items
  const handleMenuItemHover = () => {
    handleSublayerMenuClose();
    handleCustomObjectMenuClose();
    handleFontSizeMenuClose();
    handleAlignmentMenuClose();
    handleSwapMenuClose();
  };

  const handleMainMenuClose = () => {
    handleSublayerMenuClose();
    handleCustomObjectMenuClose();
    handleFontSizeMenuClose();
    handleAlignmentMenuClose();
    handleSwapMenuClose();
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
              <MenuItem
                onClick={handleMenuItemClick(onShowProperties)}
                onMouseEnter={handleMenuItemHover}
              >
                <ListItemIcon>
                  <Info fontSize="small" />
                </ListItemIcon>
                <ListItemText>Properties</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleMenuItemClick(onDuplicate)} onMouseEnter={handleMenuItemHover}>
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            {selectedProductsCount > 1 && (
              <MenuItem ref={alignmentMenuItemRef} onMouseEnter={handleAlignmentMenuOpen}>
                <ListItemIcon>
                  <VerticalAlignCenter fontSize="small" />
                </ListItemIcon>
                <ListItemText>Align</ListItemText>
                <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
            )}
            <MenuItem
              onClick={handleMenuItemClick(onOpenColorPicker)}
              onMouseEnter={handleMenuItemHover}
            >
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
            <MenuItem ref={swapMenuItemRef} onMouseEnter={handleSwapMenuOpen}>
              <ListItemIcon>
                <SwapHoriz fontSize="small" />
              </ListItemIcon>
              <ListItemText>Swap Product</ListItemText>
              <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
            </MenuItem>
            <MenuItem onClick={handleMenuItemClick(onScale)} onMouseEnter={handleMenuItemHover}>
              <ListItemIcon>
                <SettingsBackupRestore fontSize="small" />
              </ListItemIcon>
              <ListItemText>Scale...</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onResetScale)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <SettingsBackupRestore fontSize="small" />
              </ListItemIcon>
              <ListItemText>Reset Scale</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onChangeQuantity)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <Numbers fontSize="small" />
              </ListItemIcon>
              <ListItemText>Change Quantity...</ListItemText>
            </MenuItem>
            {sublayers && sublayers.length > 0 && (
              <MenuItem ref={sublayerMenuItemRef} onMouseEnter={handleSublayerMenuOpen}>
                <ListItemIcon>
                  <Layers fontSize="small" />
                </ListItemIcon>
                <ListItemText>Assign to Sublayer</ListItemText>
                <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
            )}
            <MenuItem onClick={handleMenuItemClick(onDelete)} onMouseEnter={handleMenuItemHover}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === "connector" && (
          <>
            <MenuItem
              onClick={handleMenuItemClick(onResetConnectorToStraight)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <StraightenOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Reset to Straight</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onOpenColorPicker)}
              onMouseEnter={handleMenuItemHover}
            >
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
              <MenuItem ref={sublayerMenuItemRef} onMouseEnter={handleSublayerMenuOpen}>
                <ListItemIcon>
                  <Layers fontSize="small" />
                </ListItemIcon>
                <ListItemText>Assign to Sublayer</ListItemText>
                <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
            )}
            <MenuItem onClick={handleMenuItemClick(onDelete)} onMouseEnter={handleMenuItemHover}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {selectedConnectorsCount > 1
                  ? `Delete ${selectedConnectorsCount} Connections`
                  : "Delete Connection"}
              </ListItemText>
            </MenuItem>
          </>
        )}

        {contextMenu?.type === "canvas" && (
          <>
            <MenuItem
              onClick={handleMenuItemClick(onInsertProduct)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText>Add Product...</ListItemText>
            </MenuItem>
            {onInsertCustomObject && (
              <MenuItem ref={customObjectMenuItemRef} onMouseEnter={handleCustomObjectMenuOpen}>
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
          <MenuItem
            onClick={handleMenuItemClick(onSwapPlacementProduct)}
            onMouseEnter={handleMenuItemHover}
          >
            <ListItemIcon>
              <SwapHoriz fontSize="small" />
            </ListItemIcon>
            <ListItemText>Swap Product...</ListItemText>
          </MenuItem>
        )}

        {contextMenu?.type === "text" && (
          <>
            <MenuItem onClick={handleMenuItemClick(onTextEdit)} onMouseEnter={handleMenuItemHover}>
              <ListItemIcon>
                <TextFields fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Text</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onTextFormatBold)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <FormatBold fontSize="small" />
              </ListItemIcon>
              <ListItemText>Bold</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onTextFormatItalic)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <FormatItalic fontSize="small" />
              </ListItemIcon>
              <ListItemText>Italic</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onTextFormatUnderline)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <FormatUnderlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Underline</ListItemText>
            </MenuItem>
            <MenuItem ref={fontSizeMenuItemRef} onMouseEnter={handleFontSizeMenuOpen}>
              <ListItemIcon>
                <TextFields fontSize="small" />
              </ListItemIcon>
              <ListItemText>Font Size</ListItemText>
              <ChevronRight fontSize="small" sx={{ ml: "auto" }} />
            </MenuItem>
            <MenuItem
              onClick={handleMenuItemClick(onTextToggleBorder)}
              onMouseEnter={handleMenuItemHover}
            >
              <ListItemIcon>
                <BorderColor fontSize="small" />
              </ListItemIcon>
              <ListItemText>Toggle Border</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuItemClick(onDelete)} onMouseEnter={handleMenuItemHover}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
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
            <MenuItem key={sublayer.id} onClick={() => handleSublayerSelect(sublayer.id)}>
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
          <MenuItem onClick={() => handleCustomObjectSelect("switch")}>
            <ListItemText>Switch</ListItemText>
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
          <MenuItem onClick={() => handleCustomObjectSelect("arrow")}>
            <ListItemText>Arrow</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleCustomObjectSelect("boxoutline")}>
            <ListItemText>Box Outline</ListItemText>
          </MenuItem>
        </Box>
      </Popover>

      {/* Font Size submenu */}
      <Popover
        open={Boolean(fontSizeMenuAnchor)}
        anchorEl={fontSizeMenuAnchor}
        onClose={handleFontSizeMenuClose}
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
          onMouseLeave: handleFontSizeMenuClose,
          sx: {
            pointerEvents: "auto",
            maxHeight: "300px",
            overflow: "auto",
          },
        }}
      >
        <Box
          sx={{
            minWidth: 120,
          }}
        >
          {[12, 20, 28, 36, 48, 60, 72].map((size) => (
            <MenuItem key={size} onClick={() => handleFontSizeSelect(size)}>
              <ListItemText>{size}px</ListItemText>
            </MenuItem>
          ))}
        </Box>
      </Popover>

      {/* Alignment submenu */}
      <Popover
        open={Boolean(alignmentMenuAnchor)}
        anchorEl={alignmentMenuAnchor}
        onClose={handleAlignmentMenuClose}
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
          onMouseLeave: handleAlignmentMenuClose,
          sx: {
            pointerEvents: "auto",
            maxHeight: "300px",
            overflow: "auto",
          },
        }}
      >
        <Box
          sx={{
            minWidth: 200,
          }}
        >
          {onAlignLeft && (
            <MenuItem onClick={handleMenuItemClick(onAlignLeft)}>
              <ListItemIcon>
                <VerticalAlignTop fontSize="small" sx={{ transform: 'rotate(270deg)' }} />
              </ListItemIcon>
              <ListItemText>Align Left</ListItemText>
            </MenuItem>
          )}
          {onAlignHorizontalCenter && (
            <MenuItem onClick={handleMenuItemClick(onAlignHorizontalCenter)}>
              <ListItemIcon>
                <VerticalAlignCenter fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
              </ListItemIcon>
              <ListItemText>Align Horizontal Centers</ListItemText>
            </MenuItem>
          )}
          {onAlignRight && (
            <MenuItem onClick={handleMenuItemClick(onAlignRight)}>
              <ListItemIcon>
                <VerticalAlignTop fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
              </ListItemIcon>
              <ListItemText>Align Right</ListItemText>
            </MenuItem>
          )}
          {onAlignTop && (
            <MenuItem onClick={handleMenuItemClick(onAlignTop)}>
              <ListItemIcon>
                <VerticalAlignTop fontSize="small" />
              </ListItemIcon>
              <ListItemText>Align Top</ListItemText>
            </MenuItem>
          )}
          {onAlignVerticalCenter && (
            <MenuItem onClick={handleMenuItemClick(onAlignVerticalCenter)}>
              <ListItemIcon>
                <VerticalAlignCenter fontSize="small" />
              </ListItemIcon>
              <ListItemText>Align Vertical Centers</ListItemText>
            </MenuItem>
          )}
          {onAlignBottom && (
            <MenuItem onClick={handleMenuItemClick(onAlignBottom)}>
              <ListItemIcon>
                <VerticalAlignTop fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
              </ListItemIcon>
              <ListItemText>Align Bottom</ListItemText>
            </MenuItem>
          )}
          {selectedProductsCount > 2 && onEvenSpacingHorizontal && (
            <MenuItem onClick={handleMenuItemClick(onEvenSpacingHorizontal)}>
              <ListItemIcon>
                <MultipleStop fontSize="small" />
              </ListItemIcon>
              <ListItemText>Even Spacing Horizontal</ListItemText>
            </MenuItem>
          )}
          {selectedProductsCount > 2 && onEvenSpacingVertical && (
            <MenuItem onClick={handleMenuItemClick(onEvenSpacingVertical)}>
              <ListItemIcon>
                <MultipleStop fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
              </ListItemIcon>
              <ListItemText>Even Spacing Vertical</ListItemText>
            </MenuItem>
          )}
        </Box>
      </Popover>

      {/* Swap Product submenu */}
      <Popover
        open={Boolean(swapMenuAnchor)}
        anchorEl={swapMenuAnchor}
        onClose={handleSwapMenuClose}
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
          onMouseLeave: handleSwapMenuClose,
          sx: {
            pointerEvents: "auto",
          },
        }}
      >
        <Box
          sx={{
            minWidth: 200,
          }}
        >
          <MenuItem onClick={handleMenuItemClick(onSwapProduct)}>
            <ListItemText>Replace Selected</ListItemText>
          </MenuItem>
          {onSwapAllSameProducts && (
            <MenuItem onClick={handleMenuItemClick(onSwapAllSameProducts)}>
              <ListItemText>Replace All Same Products</ListItemText>
            </MenuItem>
          )}
        </Box>
      </Popover>
    </Box>
  );
};
