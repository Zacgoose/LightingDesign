import { Menu, MenuItem, ListItemIcon, ListItemText, Box } from "@mui/material";
import { Delete, ContentCopy, Link as LinkIcon, SettingsBackupRestore, Add, SwapHoriz } from "@mui/icons-material";

export const ContextMenus = ({
  contextMenu,
  onClose,
  onDuplicate,
  onOpenColorPicker,
  onStartConnect,
  onResetScale,
  onDelete,
  onInsertProduct,
  onSwapPlacementProduct,
  onScale,
}) => {
  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.y, left: contextMenu.x }
          : undefined
      }
    >
      {contextMenu?.type === 'product' && (
        <>
          <MenuItem onClick={onDuplicate}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem onClick={onOpenColorPicker}>
            <ListItemIcon>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', border: '1px solid', borderColor: 'divider' }} />
            </ListItemIcon>
            <ListItemText>Change Color...</ListItemText>
          </MenuItem>
          <MenuItem onClick={onStartConnect}>
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Connect to...</ListItemText>
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
          <MenuItem onClick={onDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </>
      )}
      
      {contextMenu?.type === 'connector' && (
        <>
          <MenuItem onClick={onOpenColorPicker}>
            <ListItemIcon>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', border: '1px solid', borderColor: 'divider' }} />
            </ListItemIcon>
            <ListItemText>Change Color...</ListItemText>
          </MenuItem>
          <MenuItem onClick={onDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Connection</ListItemText>
          </MenuItem>
        </>
      )}

      {contextMenu?.type === 'canvas' && (
        <MenuItem onClick={onInsertProduct}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Product...</ListItemText>
        </MenuItem>
      )}

      {contextMenu?.type === 'placement' && (
        <MenuItem onClick={onSwapPlacementProduct}>
          <ListItemIcon>
            <SwapHoriz fontSize="small" />
          </ListItemIcon>
          <ListItemText>Swap Product...</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};