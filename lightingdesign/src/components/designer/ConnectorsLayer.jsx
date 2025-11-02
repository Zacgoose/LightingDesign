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

  return (
    <>
      {/* Render unselected connectors first (behind) */}
      {unselectedConnectors.map((connector) => {
        const fromProduct = products.find((p) => p.id === connector.from);
        const toProduct = products.find((p) => p.id === connector.to);
        if (!fromProduct || !toProduct) return null;

        return (
          <ConnectorLine
            key={connector.id}
            connector={connector}
            fromProduct={fromProduct}
            toProduct={toProduct}
            isSelected={false}
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
      })}
      
      {/* Render selected connector last (on top) */}
      {selectedConnector && (() => {
        const fromProduct = products.find((p) => p.id === selectedConnector.from);
        const toProduct = products.find((p) => p.id === selectedConnector.to);
        if (!fromProduct || !toProduct) return null;

        return (
          <ConnectorLine
            key={selectedConnector.id}
            connector={selectedConnector}
            fromProduct={fromProduct}
            toProduct={toProduct}
            isSelected={true}
            onSelect={onConnectorSelect}
            onChange={(updatedConnector) => {
              const newConnectors = connectors.map((c) =>
                c.id === selectedConnector.id ? updatedConnector : c,
              );
              onConnectorChange(newConnectors);
            }}
            onContextMenu={(e) => onConnectorContextMenu(e, selectedConnector.id)}
            theme={theme}
            selectedTool={selectedTool}
          />
        );
      })()}
    </>
  );
};
