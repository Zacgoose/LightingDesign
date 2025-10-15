import { Card, Divider } from "@mui/material";
import { Box, Container, Stack } from "@mui/system";
import { CippDataTable } from "../CippTable/CippDataTable";
import { useSettings } from "../../hooks/use-settings";
import { CippHead } from "./CippHead";
import { useState } from "react";

export const CippTablePage = (props) => {
  const {
    title,
    cardButton,
    noDataButton,
    actions,
    apiUrl,
    apiData,
    apiDataKey,
    columns,
    columnsFromApi,
    name,
    options,
    onChange,
    offCanvas,
    queryKey,
    tableFilter,
    filters,
    sx = { flexGrow: 1, py: 4 },
    containerSx,
    enableRowSelection,
    disableMaxHeight = false,
    ...other
  } = props;
  const tenant = useSettings().currentTenant;
  const [tableFilters] = useState(filters || []);
  return (
    <>
      <CippHead title={title} />
      <Box sx={sx}>
        <Container maxWidth={false} sx={{ height: "100%", ...containerSx }}>
          <Stack spacing={1} sx={{ height: "100%" }}>
            {tableFilter}
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                minHeight: 0,
              }}
            >
              <Divider />

              <CippDataTable
                queryKey={queryKey}
                cardButton={cardButton}
                title={title}
                noDataButton={noDataButton}
                actions={actions}
                simple={false}
                noCard={true}
                disableMaxHeight={disableMaxHeight}
                api={{
                  url: apiUrl,
                  data: { tenantFilter: tenant, ...apiData },
                  dataKey: apiDataKey,
                }}
                columns={columns}
                columnsFromApi={columnsFromApi}
                offCanvas={offCanvas}
                filters={tableFilters}
                enableRowSelection={enableRowSelection}
                initialState={{
                  columnFilters: filters
                    ? filters.map((filter) => ({
                        id: filter.id || filter.columnId,
                        value: filter.value,
                      }))
                    : [],
                }}
                {...other}
              />
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default CippTablePage;
