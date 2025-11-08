import { useState } from "react";
import { Box, Container, Button, Typography, Stack, ThemeProvider, CssBaseline } from "@mui/material";
import { ImageEditorDialog } from "/src/components/ImageEditorDialog";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

const Page = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [editedImage, setEditedImage] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrl(ev.target.result);
        setEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (dataUrl) => {
    setEditedImage(dataUrl);
    setEditorOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Stack spacing={3} sx={{ py: 4 }}>
          <Typography variant="h4">Image Editor Test</Typography>
          
          <Box>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: "none" }}
              id="upload-input"
            />
            <label htmlFor="upload-input">
              <Button variant="contained" component="span">
                Upload Image to Edit
              </Button>
            </label>
          </Box>

          {imageUrl && !editedImage && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Original Image:
              </Typography>
              <img
                src={imageUrl}
                alt="Original"
                style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
              />
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => setEditorOpen(true)}>
                  Open Editor
                </Button>
              </Box>
            </Box>
          )}

          {editedImage && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Edited Image:
              </Typography>
              <img
                src={editedImage}
                alt="Edited"
                style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
              />
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => setEditorOpen(true)}>
                  Edit Again
                </Button>
              </Box>
            </Box>
          )}

          <ImageEditorDialog
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
            onSave={handleSave}
            imageUrl={imageUrl}
          />
        </Stack>
      </Container>
    </ThemeProvider>
  );
};

export default Page;
