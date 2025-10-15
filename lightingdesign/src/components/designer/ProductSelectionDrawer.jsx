import { Add, Close, Language } from "@mui/icons-material";
import { IconButton, Box } from "@mui/material";
import { CippOffCanvas } from "../CippComponents/CippOffCanvas";
import { CippTablePage } from "../CippComponents/CippTablePage";
import { useMemo, useCallback } from "react";

export const ProductSelectionDrawer = ({ onProductSelect, visible = false, onClose, onOpen }) => {
  const filterList = [
    {
      filterName: "Pendants",
      value: [{ id: "product_type_unigram", value: "pendant" }],
      type: "column",
    },
    {
      filterName: "Downlights",
      value: [{ id: "product_type_unigram", value: "downlight" }],
      type: "column",
    },
    {
      filterName: "Wall Lights",
      value: [{ id: "product_type_unigram", value: "wall" }],
      type: "column",
    },
    {
      filterName: "Fans",
      value: [{ id: "product_type_unigram", value: "fan" }],
      type: "column",
    },
  ];

  const simpleColumns = ["thumbnailImageUrl", "name"];

  const handleAddToCanvas = useCallback((row) => {
    if (onProductSelect) {
      onProductSelect(row);
    }
    if (onClose) {
      onClose();
    }
  }, [onProductSelect, onClose]);

  const actions = useMemo(() => [
    {
      label: "Add to Canvas",
      icon: <Add />,
      color: "primary",
      noConfirm: true,
      customFunction: handleAddToCanvas,
    },
    {
      label: "Website",
      icon: <Language />,
      link: "[url]",
      external: true,
      noConfirm: true,
    },
  ], [handleAddToCanvas]);

  return (
    <>
      <CippOffCanvas
        hideTitle={true}
        visible={visible}
        onClose={onClose}
        size="xl"
        contentPadding={0}
      >
        <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <CippTablePage
          title="Products List"
          hideTitle={true}
          apiUrl="/api/ExecListBeaconProducts"
          simpleColumns={simpleColumns}
          filters={filterList}
          cardButton={null}
          actions={actions}
          tenantInTitle={false}
          enableRowSelection={false}
          imageColumn="thumbnailImageUrl"
          exportEnabled={false}
          sx={{ flexGrow: 1, py: 0 }}
          containerSx={{ px: 1, py: 1 }}
          positionActionsColumn= 'start'
          disableAutoLink={true}
        />
      </CippOffCanvas>
    </>
  );
};
