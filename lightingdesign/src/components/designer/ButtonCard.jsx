import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Skeleton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

export default function CippButtonCard({
  title,
  CardButton,
  children,
  isFetching = false,
  cardSx,
  cardActions,
  variant,
  component = "card",
  accordionExpanded = false,
  onAccordionChange,
  cardActionsAlign = "right",
  cardHeaderActionsAlign = "right",
}) {
  const [cardExpanded, setCardExpanded] = useState(accordionExpanded);
  useEffect(() => {
    if (accordionExpanded !== cardExpanded) {
      setCardExpanded(accordionExpanded);
    }
  }, [accordionExpanded]);

  useEffect(() => {
    if (onAccordionChange) {
      onAccordionChange(cardExpanded);
    }
  }, [cardExpanded]);

  const hasContent = !!children || isFetching;
  return (
    <Card variant={variant} sx={cardSx}>
      {component === "card" && (
        <>
          <CardHeader
            action={cardActions}
            title={title}
            sx={{
              width: "100%",
              '& .MuiCardHeader-action': {
                justifyContent: cardHeaderActionsAlign === "left" ? "flex-start" : "flex-end",
                display: "flex",
                width: "100%",
              },
            }}
          />
          {hasContent && (
            <CardContent sx={{ p: 0, m: 0, minHeight: 0, height: 0 }}>
              {isFetching ? <Skeleton /> : children}
            </CardContent>
          )}
          {CardButton && (
            <CardActions
              sx={cardActionsAlign === "left" ? { justifyContent: "flex-start" } : {}}
            >
              {CardButton}
            </CardActions>
          )}
        </>
      )}
      {component === "accordion" && (
        <Accordion expanded={cardExpanded}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            onClick={() => setCardExpanded(!cardExpanded)}
          >
            <CardHeader
              action={cardActions}
              title={title}
              sx={{
                pl: 1,
                py: 0,
                width: "100%",
                '& .MuiCardHeader-action': {
                  justifyContent: cardHeaderActionsAlign === "left" ? "flex-start" : "flex-end",
                  display: "flex",
                  width: "100%",
                },
              }}
            />
          </AccordionSummary>
          <Divider />
          <AccordionDetails sx={{ p: 0 }}>
            {hasContent && (
              <CardContent sx={{ p: 0, m: 0, minHeight: 0, height: 0 }}>
                {isFetching ? <Skeleton /> : children}
              </CardContent>
            )}
            {CardButton && (
              <CardActions
                sx={cardActionsAlign === "left" ? { justifyContent: "flex-start" } : {}}
              >
                {CardButton}
              </CardActions>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Card>
  );
}
