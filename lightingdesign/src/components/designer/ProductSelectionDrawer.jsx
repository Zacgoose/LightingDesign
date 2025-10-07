import { Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import { CippOffCanvas } from "../CippComponents/CippOffCanvas";
import { CippTablePage } from "../CippComponents/CippTablePage";

export const ProductSelectionDrawer = ({ onProductSelect, visible = false, onClose, onOpen }) => {
  // Filter options
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
  
  // Columns to display
  const simpleColumns = [
    "name",
    "sku",
    "product_type_unigram",
  ];
  
  // Actions - use customFunction with noConfirm for immediate execution
  const actions = [
    {
      label: "Add to Canvas",
      icon: <Add />,
      color: "primary",
      noConfirm: true,
      customFunction: (row) => {
        if (onProductSelect) {
          onProductSelect(row);
        }
        if (onClose) {
          onClose();
        }
      },
    },
  ];
  
  return (
    <>
      <CippOffCanvas
        title="Product Catalog - Use row actions menu to add to canvas"
        visible={visible}
        onClose={onClose}
        size="xl"
      >
        <CippTablePage
          title="Products"
          apiUrl="/api/ExecListBeaconProducts"
          simpleColumns={simpleColumns}
          filters={filterList}
          cardButton={null}
          actions={actions}
          tenantInTitle={false}
        />
      </CippOffCanvas>
    </>
  );
};