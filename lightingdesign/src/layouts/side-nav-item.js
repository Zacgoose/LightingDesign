import { useCallback, useState } from "react";
import NextLink from "next/link";
import PropTypes from "prop-types";
import ChevronRightIcon from "@heroicons/react/24/outline/ChevronRightIcon";
import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/outline/ArrowTopRightOnSquareIcon";
import { Box, ButtonBase, Collapse, SvgIcon, Stack, Tooltip } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useSettings } from "../hooks/use-settings";

export const SideNavItem = (props) => {
  const {
    active = false,
    children,
    collapse = false,
    depth = 0,
    external = false,
    icon,
    openImmediately = false,
    path,
    title,
  } = props;

  const [open, setOpen] = useState(openImmediately);
  const [hovered, setHovered] = useState(false);
  const { handleUpdate, bookmarks = [] } = useSettings();
  const isBookmarked = bookmarks.some((bookmark) => bookmark.path === path);

  const handleToggle = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const handleBookmarkToggle = useCallback(
    (event) => {
      event.stopPropagation();
      handleUpdate({
        bookmarks: isBookmarked
          ? bookmarks.filter((bookmark) => bookmark.path !== path)
          : [...bookmarks, { label: title, path }],
      });
    },
    [isBookmarked, bookmarks, handleUpdate, path, title]
  );

  // Dynamic spacing and font sizing based on depth
  const indent = depth > 0 ? depth * 1.5 : 0.5;
  const fontSize = depth === 0 ? 14 : 13;
  
  // Use consistent 16px padding to keep icons aligned
  // This centers icons in collapsed state (56px width) and keeps them at same position when expanded
  const horizontalPadding = "16px";

  if (children) {
    return (
      <li>
        <Stack
          direction="row"
          alignItems="center"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          sx={{
            px: depth === 0 ? horizontalPadding : `${(depth * 1.5 + 0.5) * 6}px`, // Nested items get more indent when expanded
          }}
        >
          <Tooltip title={collapse ? title : ""} placement="right" arrow>
            <ButtonBase
              onClick={handleToggle}
              sx={{
                alignItems: "center",
                borderRadius: 1,
                display: "flex",
                fontFamily: (theme) => theme.typography.fontFamily,
                fontSize: fontSize,
                fontWeight: 500,
                justifyContent: "flex-start",
                py: "10px",
                textAlign: "left",
                whiteSpace: "nowrap",
                width: "100%",
                minWidth: "24px",
              }}
            >
              {collapse ? (
                // When collapsed, ONLY render the icon
                <Box
                  component="span"
                  sx={{
                    alignItems: "center",
                    color: active ? "primary.main" : "neutral.400",
                    display: "inline-flex",
                    height: 24,
                    justifyContent: "center",
                    width: 24,
                  }}
                >
                  {icon}
                </Box>
              ) : (
                // When expanded, render icon + text + chevron
                <>
                  <Box
                    component="span"
                    sx={{
                      alignItems: "center",
                      color: active ? "primary.main" : "neutral.400",
                      display: "inline-flex",
                      flexGrow: 0,
                      flexShrink: 0,
                      height: 24,
                      justifyContent: "center",
                      width: 24,
                    }}
                  >
                    {icon}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      color: depth === 0 ? "text.primary" : "text.secondary",
                      flexGrow: 1,
                      fontSize: fontSize,
                      mx: "10px",
                      ...(active && {
                        color: "primary.main",
                      }),
                    }}
                  >
                    {title}
                  </Box>
                  <SvgIcon
                    sx={{
                      color: "neutral.500",
                      fontSize: 16,
                    }}
                  >
                    {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </SvgIcon>
                </>
              )}
            </ButtonBase>
          </Tooltip>
        </Stack>
        <Collapse in={!collapse && open} unmountOnExit>
          {!collapse && children}
        </Collapse>
      </li>
    );
  }

  // Leaf
  const linkProps = path
    ? external
      ? {
          component: "a",
          href: path,
          target: "_blank",
        }
      : {
          component: NextLink,
          href: path,
        }
    : {};

  return (
    <li>
      <Stack
        direction="row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          px: depth === 0 ? horizontalPadding : `${(depth * 1.5 + 0.5) * 6}px`, // Nested items get more indent when expanded
        }}
      >
        <Tooltip title={collapse ? title : ""} placement="right" arrow>
          <ButtonBase
            sx={{
              alignItems: "center",
              borderRadius: 1,
              display: "flex",
              fontFamily: (theme) => theme.typography.fontFamily,
              fontSize: fontSize,
              fontWeight: 500,
              justifyContent: "flex-start",
              textAlign: "left",
              whiteSpace: "nowrap",
              width: collapse ? "100%" : "calc(100% - 20px)",
              py: "10px",
              minWidth: "24px",
            }}
            {...linkProps}
          >
            {collapse ? (
              // When collapsed, ONLY render the icon
              <Box
                component="span"
                sx={{
                  alignItems: "center",
                  color: active ? "primary.main" : "neutral.400",
                  display: "inline-flex",
                  height: 24,
                  justifyContent: "center",
                  width: 24,
                }}
              >
                {icon}
              </Box>
            ) : (
              // When expanded, render icon + text + external icon if applicable
              <>
                <Box
                  component="span"
                  sx={{
                    alignItems: "center",
                    color: active ? "primary.main" : "neutral.400",
                    display: "inline-flex",
                    flexGrow: 0,
                    flexShrink: 0,
                    height: 24,
                    justifyContent: "center",
                    width: 24,
                  }}
                >
                  {icon}
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: depth === 0 ? "text.primary" : "text.secondary",
                    flexGrow: 1,
                    mx: "10px",
                    whiteSpace: "nowrap",
                    ...(hovered && {
                      maxWidth: "calc(100% - 45px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }),
                    ...(active && {
                      color: "primary.main",
                    }),
                  }}
                >
                  {title}
                </Box>
                {external && (
                  <SvgIcon
                    sx={{
                      color: "neutral.500",
                      fontSize: 18,
                    }}
                  >
                    <ArrowTopRightOnSquareIcon />
                  </SvgIcon>
                )}
              </>
            )}
          </ButtonBase>
        </Tooltip>
        {!collapse && (
          <SvgIcon
            onClick={handleBookmarkToggle}
            sx={{
              color: "neutral.500",
              fontSize: 16,
              cursor: "pointer",
              mr: 1,
              display: hovered ? "block" : "none",
            }}
          >
            {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </SvgIcon>
        )}
      </Stack>
    </li>
  );
};

SideNavItem.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.any,
  collapse: PropTypes.bool,
  depth: PropTypes.number,
  external: PropTypes.bool,
  icon: PropTypes.any,
  openImmediately: PropTypes.bool,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};