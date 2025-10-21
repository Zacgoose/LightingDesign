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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Stage, Layer, Rect, Circle, Line, Text as KonvaText, Group } from "react-konva";
import productTypesConfig from "/src/data/productTypes.json";

// Paper size definitions (dimensions in mm)
const PAPER_SIZES = [
  { value: "A4", label: "A4 (210 × 297 mm)", width: 210, height: 297 },
  { value: "A3", label: "A3 (297 × 420 mm)", width: 297, height: 420 },
  { value: "A2", label: "A2 (420 × 594 mm)", width: 420, height: 594 },
  { value: "A1", label: "A1 (594 × 841 mm)", width: 594, height: 841 },
  { value: "A0", label: "A0 (841 × 1189 mm)", width: 841, height: 1189 },
];

const Page = () => {
  const router = useRouter();
  const { id } = router.query;

  // Export settings state
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState("landscape");
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

  const handleLayerToggle = useCallback((layerId) => {
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
  }, [layers]);

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
    setExportStatus("Initializing export...");
    
    try {
      const paper = PAPER_SIZES.find((s) => s.value === paperSize);
      const isLandscape = orientation === "landscape";
      
      // PDF dimensions in mm
      const pageWidth = isLandscape ? paper.height : paper.width;
      const pageHeight = isLandscape ? paper.width : paper.height;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: [paper.width, paper.height],
      });
      
      setExportProgress(10);
      setExportStatus("Loading job information...");
      
      // Get job information
      const jobInfo = jobData.data || {};
      const jobNumber = jobInfo.jobNumber || "N/A";
      const customerName = jobInfo.customerName?.label || jobInfo.customerName || "N/A";
      const jobAddress = [jobInfo.address, jobInfo.city, jobInfo.state, jobInfo.postalCode]
        .filter(Boolean)
        .join(", ") || "N/A";
      
      // Collect all products from selected layers
      let allProducts = [];
      const selectedLayerData = selectedLayers.map((layerId) => {
        const layer = layers.find((l) => l.id === layerId);
        if (!layer) return null;
        
        const selectedSublayerIds = selectedSublayers[layerId] || [];
        const filteredProducts = (layer.products || []).filter((product) => {
          if (!product.sublayerId) return true; // Include products without sublayer assignment
          return selectedSublayerIds.includes(product.sublayerId);
        });
        
        allProducts = allProducts.concat(filteredProducts.map(p => ({
          ...p,
          layerName: layer.name
        })));
        
        return {
          layer,
          products: filteredProducts,
          connectors: (layer.connectors || []).filter((connector) => {
            if (!connector.sublayerId) return true;
            return selectedSublayerIds.includes(connector.sublayerId);
          }),
        };
      }).filter(Boolean);
      
      setExportProgress(20);
      
      // Process each layer (one per page for multi-page support)
      for (let i = 0; i < selectedLayerData.length; i++) {
        const { layer, products, connectors } = selectedLayerData[i];
        
        if (i > 0) {
          pdf.addPage();
        }
        
        setExportStatus(`Rendering ${layer.name}...`);
        setExportProgress(20 + (i / selectedLayerData.length) * 50);
        
        // Add title block
        await addTitleBlock(pdf, pageWidth, pageHeight, {
          jobNumber,
          customerName,
          address: jobAddress,
          floorName: layer.name,
          pageNumber: i + 1,
          totalPages: selectedLayerData.length,
          date: new Date().toLocaleDateString(),
        });
        
        // Define drawing area (below title block)
        const titleBlockHeight = 40;
        const drawingAreaY = titleBlockHeight + 5;
        const drawingAreaHeight = pageHeight - titleBlockHeight - 10;
        const drawingAreaWidth = pageWidth - 20;
        
        // Render canvas to PDF
        console.log(`Exporting floor: ${layer.name}`, {
          productsCount: products.length,
          connectorsCount: connectors.length,
          hasBackground: !!layer.backgroundImage,
          backgroundSize: layer.backgroundImageNaturalSize,
          scaleFactor: layer.scaleFactor || 100,
        });
        
        await renderCanvasToPDF(pdf, {
          products,
          connectors,
          backgroundImage: layer.backgroundImage,
          backgroundImageNaturalSize: layer.backgroundImageNaturalSize,
          scaleFactor: layer.scaleFactor || 100,
          drawingArea: {
            x: 10,
            y: drawingAreaY,
            width: drawingAreaWidth,
            height: drawingAreaHeight,
          },
          canvasSize: {
            width: designData.data?.designData?.canvasSettings?.width || 4200,
            height: designData.data?.designData?.canvasSettings?.height || 2970,
          },
        });
      }
      
      setExportProgress(75);
      setExportStatus("Generating product legend...");
      
      // Add legend page
      pdf.addPage();
      await addProductLegend(pdf, pageWidth, pageHeight, allProducts);
      
      setExportProgress(90);
      setExportStatus("Finalizing PDF...");
      
      // Save the PDF
      const fileName = `${jobNumber || 'design'}_export_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setExportProgress(100);
      setExportStatus("Export complete!");
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 2000);
      
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus(`Export failed: ${error.message}`);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 3000);
    }
  }, [paperSize, orientation, selectedLayers, selectedSublayers, layers, jobData.data, designData.data]);
  
  // Helper function to add title block
  const addTitleBlock = async (pdf, pageWidth, pageHeight, info) => {
    const titleBlockHeight = 40;
    
    // Background for title block
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, pageWidth, titleBlockHeight, "F");
    
    // Border
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.5);
    pdf.rect(0, 0, pageWidth, titleBlockHeight);
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Lighting Design Export", 10, 12);
    
    // Job information
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    
    let yPos = 20;
    pdf.text(`Job: ${info.jobNumber}`, 10, yPos);
    yPos += 5;
    pdf.text(`Customer: ${info.customerName}`, 10, yPos);
    yPos += 5;
    pdf.text(`Address: ${info.address}`, 10, yPos);
    
    // Right side info
    yPos = 20;
    pdf.text(`Floor: ${info.floorName}`, pageWidth - 70, yPos);
    yPos += 5;
    pdf.text(`Page: ${info.pageNumber} of ${info.totalPages}`, pageWidth - 70, yPos);
    yPos += 5;
    pdf.text(`Date: ${info.date}`, pageWidth - 70, yPos);
  };
  
  // Helper function to render canvas to PDF
  const renderCanvasToPDF = async (pdf, options) => {
    const { products, connectors, backgroundImage, backgroundImageNaturalSize, scaleFactor, drawingArea, canvasSize } = options;
    
    console.log('renderCanvasToPDF called:', {
      productsCount: products.length,
      connectorsCount: connectors.length,
      scaleFactor,
      canvasSize,
      drawingArea,
      backgroundImageNaturalSize,
    });
    
    // Determine the export region based on content, not the full canvas
    let exportWidth, exportHeight, contentOffsetX, contentOffsetY;
    
  if (backgroundImage && backgroundImageNaturalSize) {
      // If there's a background image, use its displayed size as the export region
      const canvasImgScaleX = canvasSize.width / backgroundImageNaturalSize.width;
      const canvasImgScaleY = canvasSize.height / backgroundImageNaturalSize.height;
      const canvasImgScale = Math.min(canvasImgScaleX, canvasImgScaleY);
      
      // The actual displayed size in canvas coordinates
      exportWidth = backgroundImageNaturalSize.width * canvasImgScale;
      exportHeight = backgroundImageNaturalSize.height * canvasImgScale;
      
  // The background is centered in the canvas so its top-left in canvas coords
  // is at (-exportWidth/2, -exportHeight/2). Use that to map object coordinates
  // consistently with the DesignerCanvas rendering (which centers the image
  // on the canvas by placing it at [-w/2, -h/2]).
  contentOffsetX = -exportWidth / 2;
  contentOffsetY = -exportHeight / 2;
      
      console.log('Export region based on background:', {
        exportSize: { width: exportWidth, height: exportHeight },
        contentOffset: { x: contentOffsetX, y: contentOffsetY },
        backgroundNaturalSize: backgroundImageNaturalSize,
        canvasImgScale,
      });
    } else {
      // No background - calculate bounding box from products
      if (products.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        products.forEach((product) => {
          const productType = product.product_type?.toLowerCase() || "default";
          const config = productTypesConfig[productType] || productTypesConfig.default;
          const productScaleFactor = product.scaleFactor || scaleFactor;
          const realWorldSize = config.realWorldSize || config.realWorldWidth || 1.0;
          const canvasPixelSize = realWorldSize * productScaleFactor * (product.scaleX || 1);
          const halfSize = canvasPixelSize / 2;
          
          minX = Math.min(minX, product.x - halfSize);
          minY = Math.min(minY, product.y - halfSize);
          maxX = Math.max(maxX, product.x + halfSize);
          maxY = Math.max(maxY, product.y + halfSize);
        });
        
        // Add 10% padding
        const padding = Math.max((maxX - minX), (maxY - minY)) * 0.1;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        exportWidth = maxX - minX;
        exportHeight = maxY - minY;
        contentOffsetX = minX;
        contentOffsetY = minY;
        
        console.log('Export region based on products:', {
          exportSize: { width: exportWidth, height: exportHeight },
          contentOffset: { x: contentOffsetX, y: contentOffsetY },
          productBounds: { minX, minY, maxX, maxY },
        });
      } else {
    // Fallback to full canvas if no content - align with DesignerCanvas centre origin
    exportWidth = canvasSize.width;
    exportHeight = canvasSize.height;
    // DesignerCanvas centers the virtual canvas, so the top-left is at -width/2
    contentOffsetX = -exportWidth / 2;
    contentOffsetY = -exportHeight / 2;
      }
    }
    
    // Calculate scale to fit the export region in the drawing area
    const scaleX = drawingArea.width / exportWidth;
    const scaleY = drawingArea.height / exportHeight;
    const scale = Math.min(scaleX, scaleY) * 0.95; // Use 95% to leave small margin
    
    console.log('PDF scale calculation:', { 
      scaleX, 
      scaleY, 
      finalScale: scale,
      exportSize: { width: exportWidth, height: exportHeight }
    });
    
    // Center the scaled export region in the drawing area
    const scaledWidth = exportWidth * scale;
    const scaledHeight = exportHeight * scale;
    const offsetX = drawingArea.x + (drawingArea.width - scaledWidth) / 2;
    const offsetY = drawingArea.y + (drawingArea.height - scaledHeight) / 2;
    
    console.log('PDF positioning:', {
      scaledSize: { width: scaledWidth, height: scaledHeight },
      offset: { x: offsetX, y: offsetY },
    });
    
    // Draw background image if available
    if (backgroundImage && backgroundImageNaturalSize) {
  try {
        // The background fills the entire export region (it IS the export region)
        const pdfImgX = offsetX;
        const pdfImgY = offsetY;
        const pdfImgWidth = scaledWidth;
        const pdfImgHeight = scaledHeight;
        
        console.log('Background image rendering:', {
          naturalSize: backgroundImageNaturalSize,
          pdfPosition: { x: pdfImgX, y: pdfImgY },
          pdfSize: { width: pdfImgWidth, height: pdfImgHeight },
        });
        
        // Normalize image by drawing it onto an offscreen canvas first.
        // This ensures any browser-applied EXIF orientation is preserved and
        // gives us a guaranteed PNG data URL to feed into jsPDF.
        const normalizedDataUrl = await new Promise((resolve, reject) => {
          try {
            const img = new window.Image();
            img.onload = () => {
              try {
                // Create an offscreen canvas sized to the export region (in canvas pixels)
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(exportWidth));
                canvas.height = Math.max(1, Math.round(exportHeight));
                const ctx = canvas.getContext('2d');
                // Draw the image to the canvas scaled to fit the export region
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Convert to PNG data URL
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = (err) => reject(err);
            img.src = backgroundImage;
          } catch (err) {
            reject(err);
          }
        });

        pdf.addImage(normalizedDataUrl, 'PNG', pdfImgX, pdfImgY, pdfImgWidth, pdfImgHeight);
      } catch (err) {
        console.warn("Failed to add background image to PDF:", err);
      }
    }
    
    // Draw border around export area for reference
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.rect(offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Draw connectors (cables)
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(100, 100, 255);
    connectors.forEach((connector) => {
      const fromProduct = products.find((p) => p.id === connector.from);
      const toProduct = products.find((p) => p.id === connector.to);
      
      if (fromProduct && toProduct) {
        // Convert product positions from canvas coordinates to export region coordinates
        const x1 = offsetX + (fromProduct.x - contentOffsetX) * scale;
        const y1 = offsetY + (fromProduct.y - contentOffsetY) * scale;
        const x2 = offsetX + (toProduct.x - contentOffsetX) * scale;
        const y2 = offsetY + (toProduct.y - contentOffsetY) * scale;
        
        pdf.line(x1, y1, x2, y2);
      }
    });
    
    // Draw products
    products.forEach((product, idx) => {
      const productType = product.product_type?.toLowerCase() || "default";
      const config = productTypesConfig[productType] || productTypesConfig.default;
      
      // Convert product position from canvas coordinates to export region coordinates
      const x = offsetX + (product.x - contentOffsetX) * scale;
      const y = offsetY + (product.y - contentOffsetY) * scale;
      
      // Calculate product size
      const productScaleFactor = product.scaleFactor || scaleFactor;
      const realWorldSize = config.realWorldSize || config.realWorldWidth || 1.0;
      
      // Size in canvas pixels (scaleFactor is pixels per meter)
      const canvasPixelSize = realWorldSize * productScaleFactor;
      
      // Apply product's scale and convert to PDF coordinates
      const pdfSize = canvasPixelSize * (product.scaleX || 1) * scale;
      
      // Ensure minimum visible size in PDF (at least 2mm)
      const minSize = 2;
      const size = Math.max(pdfSize, minSize);
      
      if (idx < 3) {
        console.log(`Product ${idx} (${product.name || 'unnamed'}):`, {
          canvasPosition: { x: product.x, y: product.y },
          pdfPosition: { x, y },
          contentOffset: { x: contentOffsetX, y: contentOffsetY },
          realWorldSize,
          productScaleFactor,
          canvasPixelSize,
          pdfSize,
          finalSize: size,
          type: productType,
        });
      }
      
      // Draw based on shape type
      const shapeType = config.shapeType || "circle";
      
      // Set colors
      const strokeColor = product.strokeColor || config.stroke || "#000000";
      const fillColor = product.color || config.fill || "#FFFFFF";
      
      // Parse hex colors to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      
      const stroke = hexToRgb(strokeColor);
      const fill = hexToRgb(fillColor);
      
      pdf.setDrawColor(stroke.r, stroke.g, stroke.b);
      pdf.setFillColor(fill.r, fill.g, fill.b);
      pdf.setLineWidth(0.3);
      
      if (shapeType === "circle" || shapeType === "downlight" || shapeType === "pendant" || shapeType === "spotlight") {
        pdf.circle(x, y, size / 2, "FD");
      } else if (shapeType === "rect" || shapeType === "wall" || shapeType === "ceiling") {
        pdf.rect(x - size / 2, y - size / 2, size, size, "FD");
      } else if (shapeType === "triangle") {
        // Draw triangle using lines
        const height = size * Math.sqrt(3) / 2;
        pdf.setFillColor(fill.r, fill.g, fill.b);
        pdf.setDrawColor(stroke.r, stroke.g, stroke.b);
        
        // Define triangle points
        const points = [
          { x: x, y: y - height / 2 },
          { x: x - size / 2, y: y + height / 2 },
          { x: x + size / 2, y: y + height / 2 }
        ];
        
        // Draw filled triangle
        pdf.lines([[points[1].x - points[0].x, points[1].y - points[0].y], 
                   [points[2].x - points[1].x, points[2].y - points[1].y],
                   [points[0].x - points[2].x, points[0].y - points[2].y]], 
                   points[0].x, points[0].y, [1, 1], 'FD');
      } else {
        // Default to circle
        pdf.circle(x, y, size / 2, "FD");
      }
    });
    
    console.log(`Rendered ${products.length} products and ${connectors.length} connectors to PDF`);
  };

  // DEBUG helper - validates mapping of canvas coords to PDF coordinates
  // Usage: call validateMapping() in dev to check coordinate transforms for a sample product
  const validateMapping = (options) => {
    const { products, drawingArea, canvasSize } = options;
    // Use a fake export region (full canvas fallback)
    const exportWidth = canvasSize.width;
    const exportHeight = canvasSize.height;
    const scale = Math.min(drawingArea.width / exportWidth, drawingArea.height / exportHeight) * 0.95;
    const offsetX = drawingArea.x + (drawingArea.width - exportWidth * scale) / 2;
    const offsetY = drawingArea.y + (drawingArea.height - exportHeight * scale) / 2;
    console.log('[validateMapping] scale, offset', { scale, offsetX, offsetY });
    products.slice(0, 3).forEach((p, idx) => {
      const x = offsetX + (p.x - (-exportWidth / 2)) * scale;
      const y = offsetY + (p.y - (-exportHeight / 2)) * scale;
      console.log(`[validateMapping] prod ${idx}`, { id: p.id, canvas: { x: p.x, y: p.y }, pdf: { x, y } });
    });
  };
  
  // Helper function to add product legend
  const addProductLegend = async (pdf, pageWidth, pageHeight, allProducts) => {
    // Title
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Product Legend", 10, 15);
    
    // Group products by SKU
    const productMap = new Map();
    allProducts.forEach((product) => {
      const sku = product.sku || "N/A";
      if (!productMap.has(sku)) {
        productMap.set(sku, {
          sku,
          name: product.name || "Unnamed Product",
          brand: product.brand || "",
          type: product.product_type || "",
          quantity: 0,
          price: product.price || 0,
          layers: new Set(),
        });
      }
      const entry = productMap.get(sku);
      entry.quantity += product.quantity || 1;
      entry.layers.add(product.layerName);
    });
    
    // Convert to array and sort
    const legendData = Array.from(productMap.values()).map((item) => ({
      ...item,
      layers: Array.from(item.layers).join(", "),
    }));
    
    // Create table
    autoTable(pdf, {
      startY: 25,
      head: [['SKU', 'Product Name', 'Brand', 'Type', 'Qty', 'Price', 'Floors']],
      body: legendData.map((item) => [
        item.sku,
        item.name,
        item.brand,
        item.type,
        item.quantity,
        item.price ? `$${item.price.toFixed(2)}` : "N/A",
        item.layers,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 'auto' },
      },
  });
    
    // Add summary
    const totalQuantity = legendData.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = legendData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
  const finalY = (pdf.lastAutoTable?.finalY) || 25;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total Products: ${totalQuantity}`, 10, finalY + 10);
    pdf.text(`Total Value: $${totalValue.toFixed(2)}`, 10, finalY + 16);
  };

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
          Configure export settings and select which floors and layers to include
        </Typography>
      </Box>

      {designData.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!designData.isLoading && (
        <Grid container spacing={3}>
          {/* Paper Size Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Paper Size
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                  >
                    {PAPER_SIZES.map((size) => (
                      <FormControlLabel
                        key={size.value}
                        value={size.value}
                        control={<Radio />}
                        label={size.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Orientation
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                  >
                    <FormControlLabel
                      value="landscape"
                      control={<Radio />}
                      label="Landscape"
                    />
                    <FormControlLabel
                      value="portrait"
                      control={<Radio />}
                      label="Portrait"
                    />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Layer and Sublayer Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Floors and Layers
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select which floors and sublayers to include in the export
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
                                    sublayer.id
                                  )}
                                  onChange={() =>
                                    handleSublayerToggle(layer.id, sublayer.id)
                                  }
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

          {/* Export Summary and Action */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedLayers.length} floor(s) selected • {paperSize} {orientation}
                </Typography>

                {!canExport && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Please select at least one floor to export
                  </Alert>
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
                  {isExporting ? "Exporting..." : "Export Design"}
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
