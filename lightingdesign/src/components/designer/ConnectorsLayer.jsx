import { ConnectorLine } from "/src/components/designer/ConnectorLine";
import { memo, useCallback } from "react";

const ConnectorsLayerComponent = ({
  connectors,
  products,
  selectedConnectorId,
  selectedTool,
  theme,
  onConnectorSelect,
  onConnectorChange,
  onConnectorContextMenu,
}) => {
  // Named render function for connector
  const renderConnector = useCallback((connector) => {
    const fromProduct = products.find((p) => p.id === connector.from);
    const toProduct = products.find((p) => p.id === connector.to);
    if (!fromProduct || !toProduct) return null;

    // Named handler for connector change
    const handleConnectorChange = (updatedConnector) => {
      const newConnectors = connectors.map((c) =>
        c.id === connector.id ? updatedConnector : c,
      );
      onConnectorChange(newConnectors);
    };

    // Named handler for context menu
    const handleContextMenu = (e) => {
      onConnectorContextMenu(e, connector.id);
    };

    return (
      <ConnectorLine
        key={connector.id}
        connector={connector}
        fromProduct={fromProduct}
        toProduct={toProduct}
        isSelected={selectedConnectorId === connector.id}
        onSelect={onConnectorSelect}
        onChange={handleConnectorChange}
        onContextMenu={handleContextMenu}
        theme={theme}
        selectedTool={selectedTool}
      />
    );
  }, [connectors, products, selectedConnectorId, selectedTool, theme, onConnectorSelect, onConnectorChange, onConnectorContextMenu]);

  return (
    <>
      {connectors.map(renderConnector)}
    </>
  );
};

export const ConnectorsLayer = memo(ConnectorsLayerComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.connectors === nextProps.connectors &&
    prevProps.products === nextProps.products &&
    prevProps.selectedConnectorId === nextProps.selectedConnectorId &&
    prevProps.selectedTool === nextProps.selectedTool &&
    prevProps.theme === nextProps.theme &&
    prevProps.onConnectorSelect === nextProps.onConnectorSelect &&
    prevProps.onConnectorChange === nextProps.onConnectorChange &&
    prevProps.onConnectorContextMenu === nextProps.onConnectorContextMenu
  );
});

ConnectorsLayer.displayName = "ConnectorsLayer";
