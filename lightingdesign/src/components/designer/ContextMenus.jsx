import { Menu, MenuItem, ListItemIcon, ListItemText, Box } from "@mui/material";
import {
  Delete,
  ContentCopy,
  SettingsBackupRestore,
  Add,
  SwapHoriz,
  Layers,
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
  onScale,
  onAssignToSublayer,
  sublayers = [],
}) => {
  // Prevent right-click on the menu itself - just close it
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        onClose={onClose}
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
              <MenuItem>
                <ListItemIcon>
                  <Layers fontSize="small" />
                </ListItemIcon>
                <ListItemText>Assign to Sublayer</ListItemText>
              </MenuItem>
            )}
            {sublayers &&
              sublayers.length > 0 &&
              sublayers.map((sublayer) => (
                <MenuItem
                  key={sublayer.id}
                  onClick={() => onAssignToSublayer(sublayer.id)}
                  sx={{ pl: 5 }}
                >
                  <ListItemText inset>{sublayer.name}</ListItemText>
                </MenuItem>
              ))}
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
              <MenuItem>
                <ListItemIcon>
                  <Layers fontSize="small" />
                </ListItemIcon>
                <ListItemText>Assign to Sublayer</ListItemText>
              </MenuItem>
            )}
            {sublayers &&
              sublayers.length > 0 &&
              sublayers.map((sublayer) => (
                <MenuItem
                  key={sublayer.id}
                  onClick={() => onAssignToSublayer(sublayer.id)}
                  sx={{ pl: 5 }}
                >
                  <ListItemText inset>{sublayer.name}</ListItemText>
                </MenuItem>
              ))}
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
    </Box>
  );
};
