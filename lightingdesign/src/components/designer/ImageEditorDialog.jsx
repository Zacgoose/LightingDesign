import { Dialog, DialogContent, DialogTitle, Box, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { ImageEditor } from "./ImageEditor";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";

export const ImageEditorDialog = ({ open, onClose, imageUrl, onSave }) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.min(window.innerWidth * 0.9, 1200);
      const height = Math.min(window.innerHeight * 0.8, 800);
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleSave = (editedImageUrl) => {
    onSave(editedImageUrl);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: dimensions.width + 48,
          height: dimensions.height + 100,
          maxWidth: "95vw",
          maxHeight: "95vh",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Edit Image
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, height: "100%" }}>
        {imageUrl && (
          <ImageEditor
            imageUrl={imageUrl}
            onSave={handleSave}
            onCancel={onClose}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

ImageEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  onSave: PropTypes.func.isRequired,
};
