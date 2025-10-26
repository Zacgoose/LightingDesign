import { ConnectorLine } from "/src/components/designer/ConnectorLine";
import { memo } from "react";

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
  return (
    <>
      {connectors.map((connector) => {
        const fromProduct = products.find((p) => p.id === connector.from);
        const toProduct = products.find((p) => p.id === connector.to);
        if (!fromProduct || !toProduct) return null;

        return (
          <ConnectorLine
            key={connector.id}
            connector={connector}
            fromProduct={fromProduct}
            toProduct={toProduct}
            isSelected={selectedConnectorId === connector.id}
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
    </>
  );
};

export const ConnectorsLayer = memo(ConnectorsLayerComponent);

ConnectorsLayer.displayName = "ConnectorsLayer";
