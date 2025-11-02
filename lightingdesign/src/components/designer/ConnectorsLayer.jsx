import { ConnectorLine } from "/src/components/designer/ConnectorLine";

export const ConnectorsLayer = ({
  connectors,
  products,
  selectedConnectorId,
  selectedTool,
  theme,
  onConnectorSelect,
  onConnectorChange,
  onConnectorContextMenu,
}) => {
  // Separate connectors into selected and unselected for proper z-index ordering
  const unselectedConnectors = connectors.filter((c) => c.id !== selectedConnectorId);
  const selectedConnector = connectors.find((c) => c.id === selectedConnectorId);

  // Helper function to render a connector with common logic
  const renderConnector = (connector, isSelected) => {
    const fromProduct = products.find((p) => p.id === connector.from);
    const toProduct = products.find((p) => p.id === connector.to);
    if (!fromProduct || !toProduct) return null;

    return (
      <ConnectorLine
        key={connector.id}
        connector={connector}
        fromProduct={fromProduct}
        toProduct={toProduct}
        isSelected={isSelected}
        onSelect={onConnectorSelect}
        onChange={(updatedConnector) => {
          const newConnectors = connectors.map((c) =>
            c.id === connector.id ? updatedConnector : c,
          );
          onConnectorChange(newConnectors);
        }}
        onContextMenu={(e) => onConnectorContextMenu(e, connector.id)}
        theme={theme}
        selectedTool={selectedTool}
      />
    );
  };

  return (
    <>
      {/* Render unselected connectors first (behind) */}
      {unselectedConnectors.map((connector) => renderConnector(connector, false))}
      
      {/* Render selected connector last (on top) */}
      {selectedConnector && renderConnector(selectedConnector, true)}
    </>
  );
};
