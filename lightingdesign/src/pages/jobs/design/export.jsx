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
import Konva from "konva";
import { Stage, Layer } from "react-konva";
import "svg2pdf.js";
import productTypesConfig from "/src/data/productTypes.json";
import { getShapeFunction } from "/src/components/designer/productShapes";

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
  
  // Helper function to render canvas to PDF using SVG
  const renderCanvasToPDF = async (pdf, options) => {
    const { products, connectors, backgroundImage, backgroundImageNaturalSize, scaleFactor, drawingArea, canvasSize } = options;
    
    console.log('renderCanvasToPDF called (SVG mode):', {
      productsCount: products.length,
      connectorsCount: connectors.length,
      scaleFactor,
      canvasSize,
      drawingArea,
      backgroundImageNaturalSize,
    });
    
    // --- NEW LOGIC: Compute union of background and product/connector bounds ---
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    // Product bounds
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
    // Connector bounds: use product endpoints (connectors may not have x/y themselves)
    connectors.forEach((conn) => {
      const fromP = products.find((p) => p.id === conn.from);
      const toP = products.find((p) => p.id === conn.to);
      if (fromP) {
        minX = Math.min(minX, fromP.x);
        minY = Math.min(minY, fromP.y);
        maxX = Math.max(maxX, fromP.x);
        maxY = Math.max(maxY, fromP.y);
      }
      if (toP) {
        minX = Math.min(minX, toP.x);
        minY = Math.min(minY, toP.y);
        maxX = Math.max(maxX, toP.x);
        maxY = Math.max(maxY, toP.y);
      }
    });
    // Background bounds
    let bgX = 0, bgY = 0, bgWidth = 0, bgHeight = 0;
    if (backgroundImage && backgroundImageNaturalSize) {
      const canvasImgScaleX = canvasSize.width / backgroundImageNaturalSize.width;
      const canvasImgScaleY = canvasSize.height / backgroundImageNaturalSize.height;
      const canvasImgScale = Math.min(canvasImgScaleX, canvasImgScaleY);
  bgWidth = backgroundImageNaturalSize.width * canvasImgScale;
  bgHeight = backgroundImageNaturalSize.height * canvasImgScale;
  // Designer uses centered coordinates (0,0 at center of canvas). Background image
  // is drawn centered on stage: x = -bgWidth/2, y = -bgHeight/2
  bgX = -bgWidth / 2;
  bgY = -bgHeight / 2;
      minX = Math.min(minX, bgX);
      minY = Math.min(minY, bgY);
      maxX = Math.max(maxX, bgX + bgWidth);
      maxY = Math.max(maxY, bgY + bgHeight);
      console.log('Background bounds:', { bgX, bgY, bgWidth, bgHeight });
    }
    // If background exists but product outliers are very far away, prefer background bounds
    if (backgroundImage && backgroundImageNaturalSize) {
      const dLeft = Math.max(0, bgX - minX);
      const dRight = Math.max(0, maxX - (bgX + bgWidth));
      const dTop = Math.max(0, bgY - minY);
      const dBottom = Math.max(0, maxY - (bgY + bgHeight));
      const maxDelta = Math.max(dLeft, dRight, dTop, dBottom);
      const threshold = Math.max(bgWidth, bgHeight) * 0.25; // if outliers >25% of bg size, ignore them
      console.log('Background-outlier deltas:', { dLeft, dRight, dTop, dBottom, maxDelta, threshold });
      if (maxDelta > threshold) {
        console.log('Outliers too large; using background bounds only for export region');
        minX = bgX;
        minY = bgY;
        maxX = bgX + bgWidth;
        maxY = bgY + bgHeight;
      }
    }
    // Fallback if no products/connectors/background
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      minX = 0;
      minY = 0;
      maxX = canvasSize.width;
      maxY = canvasSize.height;
    }
    // Add padding (use no padding when background-only to keep background full-size)
    const usingBackgroundOnly = backgroundImage && backgroundImageNaturalSize &&
      (minX === bgX && minY === bgY && maxX === bgX + bgWidth && maxY === bgY + bgHeight);
    const padding = usingBackgroundOnly ? 0 : Math.max((maxX - minX), (maxY - minY)) * 0.05;
    const exportWidth = (maxX - minX) + 2 * padding;
    const exportHeight = (maxY - minY) + 2 * padding;
    const contentOffsetX = minX - padding;
    const contentOffsetY = minY - padding;
    console.log('Export region (union):', {
      contentOffsetX,
      contentOffsetY,
      exportWidth,
      exportHeight,
    });
    
    // Calculate scale to fit in PDF
    const scaleX = drawingArea.width / exportWidth;
    const scaleY = drawingArea.height / exportHeight;
    const scale = Math.min(scaleX, scaleY) * 0.95;
    
    const scaledWidth = exportWidth * scale;
    const scaledHeight = exportHeight * scale;
    const offsetX = drawingArea.x + (drawingArea.width - scaledWidth) / 2;
    const offsetY = drawingArea.y + (drawingArea.height - scaledHeight) / 2;
    
    console.log('PDF scale and positioning:', {
      scale,
      scaledSize: { width: scaledWidth, height: scaledHeight },
      offset: { x: offsetX, y: offsetY },
    });
    
    // Create Konva stage for SVG export
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    document.body.appendChild(container);
    
    try {
      // No Konva stage required for manual SVG export - keep a hidden container for cleanup
      const stage = null;
      
      // Log product coordinate bounds
      let minProdX = Infinity, minProdY = Infinity, maxProdX = -Infinity, maxProdY = -Infinity;
      products.forEach((p) => {
        minProdX = Math.min(minProdX, p.x);
        minProdY = Math.min(minProdY, p.y);
        maxProdX = Math.max(maxProdX, p.x);
        maxProdY = Math.max(maxProdY, p.y);
      });
      console.log('Product coordinate bounds:', { minProdX, minProdY, maxProdX, maxProdY });
      console.log('Export region:', { contentOffsetX, contentOffsetY, exportWidth, exportHeight });
      const exportProducts = products.filter((p) => {
        const relX = p.x - contentOffsetX;
        const relY = p.y - contentOffsetY;
        return relX >= 0 && relX <= exportWidth && relY >= 0 && relY <= exportHeight;
      });
      console.log('Products in export region:', exportProducts.length, 'of', products.length);

      const exportProductIds = new Set(exportProducts.map((p) => p.id));
      const exportConnectors = connectors.filter(
        (c) => exportProductIds.has(c.from) && exportProductIds.has(c.to),
      );
      console.log('Connectors in export region:', exportConnectors.length, 'of', connectors.length);

  // Add connectors (cables)
      // Connectors will be drawn directly into the SVG
      
  // Add products to Konva layer using custom shapes
      // Products will be drawn directly into the SVG
      // --- Build SVG manually to avoid Konva canvas size limits and ensure primitives ---
      console.log('Building manual SVG for export...');
      const SVG_NS = 'http://www.w3.org/2000/svg';
      const XLINK_NS = 'http://www.w3.org/1999/xlink';
      const svgElement = document.createElementNS(SVG_NS, 'svg');
      svgElement.setAttribute('xmlns', SVG_NS);
      svgElement.setAttribute('xmlns:xlink', XLINK_NS);
  // Use an absolute viewBox that maps to the canvas coordinate system
  svgElement.setAttribute('viewBox', `${contentOffsetX} ${contentOffsetY} ${exportWidth} ${exportHeight}`);
      svgElement.setAttribute('width', String(exportWidth));
      svgElement.setAttribute('height', String(exportHeight));

      // Helpers to map to export coordinates
      const mapX = (v) => v - contentOffsetX;
      const mapY = (v) => v - contentOffsetY;

      // Background image (preserve aspect ratio and natural size)
      if (backgroundImage) {
        const imgEl = document.createElementNS(SVG_NS, 'image');
        imgEl.setAttributeNS(XLINK_NS, 'xlink:href', backgroundImage);
        imgEl.setAttribute('href', backgroundImage);
        // Position image using its calculated background bounds
  // Position image using absolute canvas coordinates
  imgEl.setAttribute('x', String(bgX));
  imgEl.setAttribute('y', String(bgY));
        imgEl.setAttribute('width', String(bgWidth));
        imgEl.setAttribute('height', String(bgHeight));
        imgEl.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        svgElement.appendChild(imgEl);
      }

      console.log('Manual builder: exportProducts=', exportProducts.length, 'exportConnectors=', exportConnectors.length);
      // Draw connectors as lines
      let connectorCount = 0;
      exportConnectors.forEach((connector) => {
        const fromProduct = exportProducts.find((p) => p.id === connector.from);
        const toProduct = exportProducts.find((p) => p.id === connector.to);
        if (fromProduct && toProduct) {
          console.log('Adding connector between', fromProduct.id, 'and', toProduct.id, 'coords', { x1: mapX(fromProduct.x), y1: mapY(fromProduct.y), x2: mapX(toProduct.x), y2: mapY(toProduct.y) });
          const lineEl = document.createElementNS(SVG_NS, 'line');
          // Absolute coordinates (viewBox is contentOffset-based)
          lineEl.setAttribute('x1', String(fromProduct.x));
          lineEl.setAttribute('y1', String(fromProduct.y));
          lineEl.setAttribute('x2', String(toProduct.x));
          lineEl.setAttribute('y2', String(toProduct.y));
          lineEl.setAttribute('stroke', '#6464FF');
          lineEl.setAttribute('stroke-width', '2');
          lineEl.setAttribute('stroke-linecap', 'round');
          svgElement.appendChild(lineEl);
          connectorCount++;
        }
      });
      console.log('Manual builder appended connectors:', connectorCount);

      // Draw products as circles/ellipses
  let productCount = 0;
  exportProducts.forEach((product) => {
        const productType = product.product_type?.toLowerCase() || 'default';
        const config = productTypesConfig[productType] || productTypesConfig.default;
        const productScaleFactor = product.scaleFactor || scaleFactor;
        const realWorldSize = product.realWorldSize || config.realWorldSize;
        const realWorldWidth = product.realWorldWidth || config.realWorldWidth;
        const realWorldHeight = product.realWorldHeight || config.realWorldHeight;
        let width, height;
        if (realWorldSize) {
          width = height = realWorldSize * productScaleFactor;
        } else if (realWorldWidth && realWorldHeight) {
          width = realWorldWidth * productScaleFactor;
          height = realWorldHeight * productScaleFactor;
        } else {
          width = config.width || 30;
          height = config.height || 30;
        }
        const strokeColor = product.strokeColor || config.stroke || '#000000';
        const fillColor = product.color || config.fill || '#FFFFFF';
        const sx = product.scaleX || 1;
        const sy = product.scaleY || 1;
  // Use absolute canvas coordinates
  const cx = product.x;
  const cy = product.y;

  console.log('Adding product', product.id, 'pos', { cx, cy }, 'size', { width, height }, 'scale', { sx, sy });
  if (Math.abs(sx - sy) < 1e-6) {
          const r = (width / 2) * sx;
          const circleEl = document.createElementNS(SVG_NS, 'circle');
          circleEl.setAttribute('cx', String(cx));
          circleEl.setAttribute('cy', String(cy));
          circleEl.setAttribute('r', String(r));
          circleEl.setAttribute('fill', fillColor);
          circleEl.setAttribute('stroke', strokeColor);
          circleEl.setAttribute('stroke-width', String(config.strokeWidth || 2));
          svgElement.appendChild(circleEl);
          productCount++;
        } else {
          const rx = (width / 2) * sx;
          const ry = (height / 2) * sy;
          const ellipseEl = document.createElementNS(SVG_NS, 'ellipse');
          ellipseEl.setAttribute('cx', String(cx));
          ellipseEl.setAttribute('cy', String(cy));
          ellipseEl.setAttribute('rx', String(rx));
          ellipseEl.setAttribute('ry', String(ry));
          ellipseEl.setAttribute('fill', fillColor);
          ellipseEl.setAttribute('stroke', strokeColor);
          ellipseEl.setAttribute('stroke-width', String(config.strokeWidth || 2));
          if (product.rotation) {
            ellipseEl.setAttribute('transform', `rotate(${product.rotation} ${cx} ${cy})`);
          }
          svgElement.appendChild(ellipseEl);
          productCount++;
        }
      });
      console.log('Manual builder appended products:', productCount);

      // Diagnostics
      const primitives = svgElement.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon');
      console.log('SVG primitives count:', primitives.length);
      const imageCount = svgElement.querySelectorAll('image').length;
      console.log('SVG image count:', imageCount);
      console.log('SVG outerHTML length:', svgElement.outerHTML.length);

      // Render SVG to PDF at the calculated position and size
      await pdf.svg(svgElement, {
        x: offsetX,
        y: offsetY,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      console.log(`SVG rendered to PDF at (${offsetX}, ${offsetY}) with size ${scaledWidth}x${scaledHeight}`);
      
    } finally {
      // Cleanup
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }
    
    console.log(`Rendered ${products.length} products and ${connectors.length} connectors as SVG to PDF`);
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
