import { ConnectorLine } from "/src/components/designer/ConnectorLine";

export const ConnectorsLayer = ({
  connectors,
  products,
  selectedConnectorIds,
  selectedTool,
  theme,
  onConnectorSelect,
  onConnectorChange,
  onConnectorContextMenu,
}) => {
  // Separate connectors into selected and unselected for proper z-index ordering
  const unselectedConnectors = connectors.filter((c) => !selectedConnectorIds.includes(c.id));
  const selectedConnectors = connectors.filter((c) => selectedConnectorIds.includes(c.id));

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
          // Pass the updated connector directly to parent
          // Parent will handle merging it with the full connector list
          onConnectorChange(updatedConnector);
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
      
      {/* Render selected connectors last (on top) */}
      {selectedConnectors.map((connector) => renderConnector(connector, true))}
    </>
  );
};
