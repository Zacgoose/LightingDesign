import { Card, Box, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import DesignerMainToolbarControls from "./DesignerMainToolbarControls";
import DesignerToolsToolbarControls from "./DesignerToolsToolbarControls";
import DesignerViewToolbarControls from "./DesignerViewToolbarControls";

export const DesignerToolbarRow = ({ mainProps, toolsProps, viewProps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isWrapped, setIsWrapped] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const checkWrapping = () => {
      if (contentRef.current) {
        const children = Array.from(contentRef.current.children);
        if (children.length < 2) {
          setIsWrapped(false);
          return;
        }
        
        // Check if any child is on a different line than the first child
        const firstChildTop = children[0].offsetTop;
        const hasWrapped = children.some(child => child.offsetTop !== firstChildTop);
        setIsWrapped(hasWrapped);
      }
    };

    checkWrapping();
    window.addEventListener('resize', checkWrapping);
    // Use a small delay to ensure layout is complete
    const timeoutId = setTimeout(checkWrapping, 100);

    return () => {
      window.removeEventListener('resize', checkWrapping);
      clearTimeout(timeoutId);
    };
  }, [mainProps, toolsProps, viewProps]);

  return (
    <Card sx={{ px: 1, py: 0, mb: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box
          ref={contentRef}
          sx={{
            display: 'flex',
            flexWrap: isExpanded ? 'wrap' : 'nowrap',
            gap: 1,
            alignItems: 'center',
            py: 0.5,
            flex: 1,
            overflow: isExpanded ? 'visible' : 'hidden',
          }}
        >
          <DesignerMainToolbarControls {...mainProps} />
          <DesignerToolsToolbarControls {...toolsProps} />
          <DesignerViewToolbarControls {...viewProps} />
        </Box>
        {isWrapped && (
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ ml: 1, my: 0.5 }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
    </Card>
  );
};

export default DesignerToolbarRow;
