import { Card, Stack } from "@mui/material";
import DesignerMainToolbarControls from "./DesignerMainToolbarControls";
import DesignerToolsToolbarControls from "./DesignerToolsToolbarControls";
import DesignerViewToolbarControls from "./DesignerViewToolbarControls";

export const DesignerToolbarRow = ({
  mainProps,
  toolsProps,
  viewProps
}) => (
  <Card sx={{ px: 1, py: 0, mb: 0 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <DesignerMainToolbarControls {...mainProps} />
      <DesignerToolsToolbarControls {...toolsProps} />
      <DesignerViewToolbarControls {...viewProps} />
    </Stack>
  </Card>
);

export default DesignerToolbarRow;
