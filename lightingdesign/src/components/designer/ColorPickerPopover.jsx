import { Popover, Box, Button } from "@mui/material";

const PRESET_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000',
];

export const ColorPickerPopover = ({
  anchorEl,
  onClose,
  onColorChange,
}) => {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 1 }}>
          {PRESET_COLORS.map(color => (
            <Box
              key={color}
              onClick={() => onColorChange(color)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: color,
                borderRadius: 1,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                }
              }}
            />
          ))}
        </Box>
        <Button
          fullWidth
          size="small"
          onClick={() => onColorChange(null)}
        >
          Reset to Default
        </Button>
      </Box>
    </Popover>
  );
};