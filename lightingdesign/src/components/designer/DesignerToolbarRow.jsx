import { Card, Box, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import DesignerMainToolbarControls from "./DesignerMainToolbarControls";
import DesignerToolsToolbarControls from "./DesignerToolsToolbarControls";
import DesignerViewToolbarControls from "./DesignerViewToolbarControls";

export const DesignerToolbarRow = ({ mainProps, toolsProps, viewProps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isWrapped, setIsWrapped] = useState(false);
  const [visibleCount, setVisibleCount] = useState(null);
  const contentRef = useRef(null);

  // Get all toolbar items as a flat array
  const mainItems = DesignerMainToolbarControls(mainProps || {});
  const toolsItems = DesignerToolsToolbarControls(toolsProps || {});
  const viewItems = DesignerViewToolbarControls(viewProps || {});
  const allItems = [...mainItems, ...toolsItems, ...viewItems];

  // Check wrapping on mount, resize, and when items change
  useEffect(() => {
    const checkWrapping = () => {
      if (contentRef.current) {
        const children = Array.from(contentRef.current.children);
        if (children.length < 2) {
          setIsWrapped(false);
          setVisibleCount(null);
          return;
        }
        
        // Check if any child is on a different line than the first child
        const firstChildTop = children[0].offsetTop;
        let lastVisibleIndex = 0;
        
        for (let i = 0; i < children.length; i++) {
          if (children[i].offsetTop === firstChildTop) {
            lastVisibleIndex = i;
          } else {
            break;
          }
        }
        
        const hasWrapped = children.some(child => child.offsetTop !== firstChildTop);
        setIsWrapped(hasWrapped);
        
        // Store how many items fit in the first row
        if (hasWrapped) {
          setVisibleCount(lastVisibleIndex + 1);
        } else {
          setVisibleCount(null);
        }
      }
    };

    // Initial check
    checkWrapping();
    
    // Add resize listener
    window.addEventListener('resize', checkWrapping);
    
    // Delayed check to ensure layout is complete
    const timeoutId = setTimeout(checkWrapping, 100);

    return () => {
      window.removeEventListener('resize', checkWrapping);
      clearTimeout(timeoutId);
    };
  }, [allItems.length]);

  // Determine which items to render based on collapsed state
  const itemsToRender = !isExpanded && isWrapped && visibleCount !== null
    ? allItems.slice(0, visibleCount)
    : allItems;

  return (
    <Card sx={{ px: 1, py: 0, mb: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box
          ref={contentRef}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            py: 0.5,
            flex: 1,
          }}
        >
          {itemsToRender}
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
