import { Card, Box, IconButton } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import DesignerMainToolbarControls from "./DesignerMainToolbarControls";
import DesignerToolsToolbarControls from "./DesignerToolsToolbarControls";
import DesignerViewToolbarControls from "./DesignerViewToolbarControls";

export const DesignerToolbarRow = ({ mainProps, toolsProps, viewProps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkIfWrapped = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const children = Array.from(container.children);
      
      if (children.length < 2) {
        setShowCollapseButton(false);
        return;
      }

      // Check if any child wraps to a new line
      const firstTop = children[0].offsetTop;
      const hasWrapped = children.some(child => child.offsetTop > firstTop);
      
      setShowCollapseButton(hasWrapped);
    };

    // Initial check
    checkIfWrapped();

    // Check on resize
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkIfWrapped, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Delayed check for initial render
    const timer = setTimeout(checkIfWrapped, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <Card sx={{ px: 1, py: 0, mb: 0 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Box
          ref={containerRef}
          sx={{
            display: "flex",
            flexWrap: isExpanded ? "wrap" : "nowrap",
            overflow: isExpanded ? "visible" : "hidden",
            gap: 1,
            alignItems: "center",
            py: 0.5,
            flex: 1,
          }}
        >
          <DesignerMainToolbarControls {...mainProps} />
          <DesignerToolsToolbarControls {...toolsProps} />
          <DesignerViewToolbarControls {...viewProps} />
        </Box>
        {showCollapseButton && (
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ ml: 1, my: 0.5, flexShrink: 0 }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
    </Card>
  );
};

export default DesignerToolbarRow;
