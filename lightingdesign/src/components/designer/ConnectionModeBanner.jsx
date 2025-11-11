import { Box } from "@mui/material";

export const ConnectionModeBanner = ({ connectMode }) => {
  if (!connectMode) return null;

  return (
    <Box sx={{ mb: 2, p: 2, bgcolor: "info.main", color: "info.contrastText", borderRadius: 1 }}>
      Connection mode active. Click on another object to connect{" "}
      <strong>
        {connectMode.fromIds?.length || 0} item{connectMode.fromIds?.length !== 1 ? "s" : ""}
      </strong>{" "}
      to it, or press ESC to cancel.
    </Box>
  );
};
