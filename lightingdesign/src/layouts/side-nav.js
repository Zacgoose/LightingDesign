import { useState, useEffect, memo } from "react";
import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { Box, Divider, Drawer, Stack, IconButton, Tooltip } from "@mui/material";
import Bars3Icon from "@heroicons/react/24/outline/Bars3Icon";
import { Scrollbar } from "../components/scrollbar";
import { SideNavItem } from "./side-nav-item";
import { ApiGetCall } from "../api/ApiCall.jsx";

const SIDE_NAV_WIDTH = 200;
const SIDE_NAV_COLLAPSED_WIDTH = 56;
const TOP_NAV_HEIGHT = 64;

const markOpenItems = (items, pathname) => {
  return items.map((item) => {
    const checkPath = !!(item.path && pathname);
    const exactMatch = checkPath ? pathname === item.path : false;
    const partialMatch = checkPath ? pathname.startsWith(item.path) : false;

    let openImmediately = exactMatch;
    let newItems = item.items || [];

    if (newItems.length > 0) {
      newItems = markOpenItems(newItems, pathname);
      const childOpen = newItems.some((child) => child.openImmediately);
      openImmediately = openImmediately || childOpen || exactMatch;
    } else {
      openImmediately = openImmediately || partialMatch;
    }

    return {
      ...item,
      items: newItems,
      openImmediately,
    };
  });
};

const renderItems = ({ collapse = false, depth = 0, items, pathname }) =>
  items.reduce((acc, item) => reduceChildRoutes({ acc, collapse, depth, item, pathname }), []);

const reduceChildRoutes = ({ acc, collapse, depth, item, pathname }) => {
  const checkPath = !!(item.path && pathname);
  const exactMatch = checkPath && pathname === item.path;
  const partialMatch = checkPath && pathname.startsWith(item.path);

  const hasChildren = item.items && item.items.length > 0;
  const isActive = exactMatch || (partialMatch && !hasChildren);

  if (hasChildren) {
    acc.push(
      <SideNavItem
        active={isActive}
        collapse={collapse}
        depth={depth}
        external={item.external}
        icon={item.icon}
        key={item.title}
        openImmediately={item.openImmediately}
        path={item.path}
        title={item.title}
        type={item.type}
      >
        <Stack
          component="ul"
          spacing={0.5}
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
          }}
        >
          {renderItems({
            collapse,
            depth: depth + 1,
            items: item.items,
            pathname,
          })}
        </Stack>
      </SideNavItem>,
    );
  } else {
    acc.push(
      <SideNavItem
        active={isActive}
        collapse={collapse}
        depth={depth}
        external={item.external}
        icon={item.icon}
        key={item.title}
        path={item.path}
        title={item.title}
      />,
    );
  }

  return acc;
};

const SideNavComponent = (props) => {
  const { items, onPin, pinned = false } = props;
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [localPinned, setLocalPinned] = useState(pinned);

  // Update local state when prop changes
  useEffect(() => {
    setLocalPinned(pinned);
  }, [pinned]);

  // Simple collapse logic: collapse only when NOT pinned AND NOT hovered
  const collapse = !localPinned && !hovered;
  const { data: profile } = ApiGetCall({ url: "/api/me", queryKey: "authmecipp" });

  // Preprocess items to mark which should be open
  const processedItems = markOpenItems(items, pathname);

  const handleTogglePin = () => {
    const newPinned = !localPinned;
    setLocalPinned(newPinned);

    if (onPin) {
      onPin();
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <>
      {profile?.clientPrincipal && profile?.clientPrincipal?.userRoles?.length > 2 && (
        <Drawer
          open
          variant="permanent"
          PaperProps={{
            onMouseEnter: () => {
              setHovered(true);
            },
            onMouseLeave: handleMouseLeave,
            sx: {
              backgroundColor: "background.default",
              height: `calc(100% - ${TOP_NAV_HEIGHT}px)`,
              overflowX: "hidden",
              top: TOP_NAV_HEIGHT,
              transition: "width 250ms ease-in-out",
              width: collapse ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_WIDTH,
              zIndex: (theme) => theme.zIndex.appBar - 100,
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          <Scrollbar
            sx={{
              height: "100%",
              overflowX: "hidden",
              "& .simplebar-content": {
                height: "100%",
              },
            }}
          >
            <Box
              component="nav"
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                p: 0, // Remove padding for tighter spacing
              }}
            >
              {/* Hamburger Button */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  mb: 1,
                  mt: 1, // Add top margin
                  px: "16px", // Match icon positioning - always 16px
                }}
              >
                <Tooltip
                  title={localPinned ? "Unpin sidebar" : "Pin sidebar"}
                  placement="right"
                  arrow
                >
                  <IconButton
                    onClick={handleTogglePin}
                    size="small"
                    sx={{
                      color: "neutral.500",
                      transition: "opacity 250ms ease-in-out",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                      p: 0,
                      width: 24,
                      height: 24,
                    }}
                  >
                    <Bars3Icon style={{ width: 24, height: 24 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Divider sx={{ mb: 2, mx: 1 }} />

              <Box
                component="ul"
                sx={{
                  flexGrow: 1,
                  listStyle: "none",
                  m: 0,
                  p: 0,
                }}
              >
                {renderItems({
                  collapse,
                  depth: 0,
                  items: processedItems,
                  pathname,
                })}
              </Box>
            </Box>
          </Scrollbar>
        </Drawer>
      )}
    </>
  );
};

SideNavComponent.propTypes = {
  onPin: PropTypes.func,
  pinned: PropTypes.bool,
};

// Memoize SideNav to prevent unnecessary re-renders when parent components update
// This is especially important for pages like the designer where frequent state changes
// (e.g., canvas panning) should not trigger navigation re-renders
export const SideNav = memo(SideNavComponent);
