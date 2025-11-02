import { useRouter } from "next/router";
import { useState, useCallback, useRef } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { Download, ArrowBack } from "@mui/icons-material";
import { ApiGetCall } from "/src/api/ApiCall";
import Link from "next/link";
import ExportDocumentLayout from "/src/components/ExportDocumentLayout";
import productTypesConfig from "/src/data/productTypes.json";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  // Export settings state
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [selectedSublayers, setSelectedSublayers] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");

  // Load design data to get layers and sublayers
  const designData = ApiGetCall({
    url: "/api/ExecGetDesign",
    data: { jobId: id },
    queryKey: `Design-${id}`,
    waiting: !!id,
  });

  // Load job details for title block
  const jobData = ApiGetCall({
    url: "/api/ExecGetJob",
    data: { jobId: id },
    queryKey: `Job-${id}`,
    waiting: !!id,
  });

  // Initialize selected layers when design data loads
  const layers = designData.data?.designData?.layers || [];

  // Initialize selections on first load
  useState(() => {
    if (layers.length > 0 && selectedLayers.length === 0) {
      // Select all layers by default
      const layerIds = layers.map((l) => l.id);
      setSelectedLayers(layerIds);

      // Select all sublayers by default
      const sublayerSelections = {};
      layers.forEach((layer) => {
        sublayerSelections[layer.id] = layer.sublayers?.map((s) => s.id) || [];
      });
      setSelectedSublayers(sublayerSelections);
    }
  }, [layers]);

  const handleLayerToggle = useCallback(
    (layerId) => {
      setSelectedLayers((prev) => {
        if (prev.includes(layerId)) {
          // Deselecting layer - also deselect all its sublayers
          setSelectedSublayers((sublayers) => {
            const updated = { ...sublayers };
            delete updated[layerId];
            return updated;
          });
          return prev.filter((id) => id !== layerId);
        } else {
          // Selecting layer - also select all its sublayers
          const layer = layers.find((l) => l.id === layerId);
          if (layer) {
            setSelectedSublayers((sublayers) => ({
              ...sublayers,
              [layerId]: layer.sublayers?.map((s) => s.id) || [],
            }));
          }
          return [...prev, layerId];
        }
      });
    },
    [layers],
  );

  const handleSublayerToggle = useCallback((layerId, sublayerId) => {
    setSelectedSublayers((prev) => {
      const layerSublayers = prev[layerId] || [];
      if (layerSublayers.includes(sublayerId)) {
        return {
          ...prev,
          [layerId]: layerSublayers.filter((id) => id !== sublayerId),
        };
      } else {
        return {
          ...prev,
          [layerId]: [...layerSublayers, sublayerId],
        };
      }
    });
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus("Preparing export...");

    try {
      setExportProgress(50);
      setExportStatus("Generating export...");

      // Trigger browser print dialog
      window.print();

      setExportProgress(100);
      setExportStatus("Export complete!");

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 1000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus(`Export failed: ${error.message}`);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 3000);
    }
  }, []);

  // Prepare data for ExportDocumentLayout
  const prepareExportData = useCallback(() => {
    // Get job information
    const jobInfo = jobData.data || {};
    const jobNumber = jobInfo.jobNumber || "N/A";
    const customerName = jobInfo.customerName?.label || jobInfo.customerName || "N/A";
    const designer = jobInfo.designer || "N/A";
    const builderName = jobInfo.builder || "N/A";

    // Prepare logos (placeholder - can be customized)
    const logos = [
      // Add logo URLs here if available
    ];

    // Prepare info rows
    const infoRows = [
      [
        { label: "Designer", value: designer },
        { label: "Job #", value: jobNumber },
        { label: "Client", value: customerName },
      ],
      [
        { label: "Builder", value: builderName },
        { label: "Date", value: new Date().toLocaleDateString() },
      ],
    ];

    // Prepare company details (placeholder - can be customized)
    const companyDetails = {
      store: jobInfo.address || "",
      headOffice: "Head Office Address", // Placeholder
    };

    // Collect all products from selected layers
    const productGrid = [];
    selectedLayers.forEach((layerId) => {
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      const selectedSublayerIds = selectedSublayers[layerId] || [];
      const filteredProducts = (layer.products || []).filter((product) => {
        if (!product.sublayerId) return true;
        return selectedSublayerIds.includes(product.sublayerId);
      });

      filteredProducts.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || "default";
        const config = productTypesConfig[productType] || productTypesConfig.default;

        productGrid.push({
          thumbnail: product.thumbnail || "", // Product image if available
          icon: config.icon || "", // Product type icon
          name: product.name || "Unnamed Product",
          sku: product.sku || "N/A",
          quantity: product.quantity || 1,
          text: product.brand || "", // Additional text
        });
      });
    });

    return {
      logos,
      infoRows,
      companyDetails,
      productGrid,
    };
  }, [jobData.data, selectedLayers, selectedSublayers, layers]);

  const exportData = prepareExportData();
  const canExport = selectedLayers.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          href={`/jobs/design?id=${id}`}
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Design
        </Button>
        <Typography variant="h4" gutterBottom>
          Export Design
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure export settings and preview your document layout
        </Typography>
      </Box>

      {designData.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!designData.isLoading && (
        <Grid container spacing={3}>
          {/* Layer Selection */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Floors and Layers
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select which floors and sublayers to include
                </Typography>

                {layers.length === 0 && (
                  <Alert severity="info">
                    No floors available to export. Please add floors to your design first.
                  </Alert>
                )}

                <FormGroup>
                  {layers.map((layer) => (
                    <Box key={layer.id} sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedLayers.includes(layer.id)}
                            onChange={() => handleLayerToggle(layer.id)}
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight="medium">
                            {layer.name}
                          </Typography>
                        }
                      />

                      {/* Sublayers */}
                      {selectedLayers.includes(layer.id) && layer.sublayers && (
                        <Box sx={{ ml: 4 }}>
                          {layer.sublayers.map((sublayer) => (
                            <FormControlLabel
                              key={sublayer.id}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={(selectedSublayers[layer.id] || []).includes(
                                    sublayer.id,
                                  )}
                                  onChange={() => handleSublayerToggle(layer.id, sublayer.id)}
                                />
                              }
                              label={
                                <Typography variant="body2" color="text.secondary">
                                  {sublayer.name}
                                </Typography>
                              }
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview and Export */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Document Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedLayers.length} floor(s) selected • {exportData.productGrid.length}{" "}
                  product(s)
                </Typography>

                {!canExport && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Please select at least one floor to export
                  </Alert>
                )}

                {canExport && (
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                      bgcolor: "background.paper",
                      minHeight: 400,
                      mb: 2,
                    }}
                  >
                    <ExportDocumentLayout
                      logos={exportData.logos}
                      infoRows={exportData.infoRows}
                      companyDetails={exportData.companyDetails}
                      productGrid={exportData.productGrid}
                      maxCols={5}
                      maxRows={4}
                    />
                  </Box>
                )}

                {isExporting && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {exportStatus}
                    </Typography>
                    <LinearProgress variant="determinate" value={exportProgress} />
                  </Box>
                )}

                <Button
                  variant="contained"
                  startIcon={isExporting ? <CircularProgress size={20} /> : <Download />}
                  onClick={handleExport}
                  disabled={!canExport || isExporting}
                  size="large"
                >
                  {isExporting ? "Exporting..." : "Print / Export to PDF"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;

export default Page;
