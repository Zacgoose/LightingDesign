import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatColorText,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

/**
 * Multi-line text entry dialog for text boxes with rich text formatting
 */
export const TextEntryDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Enter Text", 
  defaultValue = "",
  defaultFormatting = {}
}) => {
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      value: defaultValue,
    },
  });

  // Formatting state
  const [fontSize, setFontSize] = useState(defaultFormatting.fontSize || 24);
  const [fontFamily, setFontFamily] = useState(defaultFormatting.fontFamily || "Arial");
  const [formats, setFormats] = useState(() => {
    const initial = [];
    if (defaultFormatting.fontStyle?.includes("bold")) initial.push("bold");
    if (defaultFormatting.fontStyle?.includes("italic")) initial.push("italic");
    if (defaultFormatting.textDecoration?.includes("underline")) initial.push("underline");
    return initial;
  });
  const [textColor, setTextColor] = useState(defaultFormatting.color || "#000000");

  // Reset form and formatting with new defaults when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ value: defaultValue });
      setFontSize(defaultFormatting.fontSize || 24);
      setFontFamily(defaultFormatting.fontFamily || "Arial");
      setTextColor(defaultFormatting.color || "#000000");
      const initial = [];
      if (defaultFormatting.fontStyle?.includes("bold")) initial.push("bold");
      if (defaultFormatting.fontStyle?.includes("italic")) initial.push("italic");
      if (defaultFormatting.textDecoration?.includes("underline")) initial.push("underline");
      setFormats(initial);
    }
  }, [open, defaultValue, defaultFormatting, form]);

  const onSubmit = (data) => {
    const value = data.value || "";
    
    // Build fontStyle string
    let fontStyle = "normal";
    if (formats.includes("bold") && formats.includes("italic")) {
      fontStyle = "bold italic";
    } else if (formats.includes("bold")) {
      fontStyle = "bold";
    } else if (formats.includes("italic")) {
      fontStyle = "italic";
    }
    
    // Build textDecoration string
    const textDecoration = formats.includes("underline") ? "underline" : "";
    
    const formatting = {
      text: value,
      fontSize,
      fontFamily,
      fontStyle,
      textDecoration,
      color: textColor,
    };
    
    onConfirm(formatting);
    form.reset({ value: "" });
  };

  const handleClose = () => {
    onClose();
    form.reset({ value: "" });
  };

  const handleKeyDown = (e) => {
    // Allow Shift+Enter for new lines, but Enter alone submits
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              {...form.register("value")}
              fullWidth
              label="Text"
              margin="normal"
              multiline
              rows={4}
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </Box>
          
          {/* Text Preview */}
          <Box 
            sx={{ 
              mb: 2, 
              p: 2, 
              border: "1px solid rgba(0, 0, 0, 0.23)", 
              borderRadius: 1,
              minHeight: 60,
              backgroundColor: "background.paper",
            }}
          >
            <Box sx={{ mb: 1, fontSize: "0.75rem", color: "text.secondary" }}>
              Preview:
            </Box>
            <Box
              sx={{
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily,
                fontWeight: formats.includes("bold") ? "bold" : "normal",
                fontStyle: formats.includes("italic") ? "italic" : "normal",
                textDecoration: formats.includes("underline") ? "underline" : "none",
                color: textColor,
                wordWrap: "break-word",
              }}
            >
              {form.watch("value") || "Type text above to see preview..."}
            </Box>
          </Box>
          
          {/* Formatting Controls */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            {/* Font Size */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Size</InputLabel>
              <Select
                value={fontSize}
                label="Size"
                onChange={(e) => setFontSize(e.target.value)}
              >
                <MenuItem value={12}>12</MenuItem>
                <MenuItem value={14}>14</MenuItem>
                <MenuItem value={16}>16</MenuItem>
                <MenuItem value={18}>18</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={24}>24</MenuItem>
                <MenuItem value={28}>28</MenuItem>
                <MenuItem value={32}>32</MenuItem>
                <MenuItem value={36}>36</MenuItem>
                <MenuItem value={48}>48</MenuItem>
                <MenuItem value={64}>64</MenuItem>
              </Select>
            </FormControl>
            
            {/* Font Family */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Font</InputLabel>
              <Select
                value={fontFamily}
                label="Font"
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                <MenuItem value="Courier New">Courier New</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Verdana">Verdana</MenuItem>
                <MenuItem value="Comic Sans MS">Comic Sans MS</MenuItem>
              </Select>
            </FormControl>
            
            {/* Text Formatting */}
            <ToggleButtonGroup
              size="small"
              value={formats}
              onChange={(e, newFormats) => setFormats(newFormats)}
              aria-label="text formatting"
            >
              <ToggleButton value="bold" aria-label="bold">
                <FormatBold />
              </ToggleButton>
              <ToggleButton value="italic" aria-label="italic">
                <FormatItalic />
              </ToggleButton>
              <ToggleButton value="underline" aria-label="underlined">
                <FormatUnderlined />
              </ToggleButton>
            </ToggleButtonGroup>
            
            {/* Text Color */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FormatColorText />
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{
                  width: "40px",
                  height: "32px",
                  border: "1px solid rgba(0, 0, 0, 0.23)",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            OK
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TextEntryDialog;
