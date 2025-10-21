import { useRouter } from "next/router";
import React, { useState, useCallback, useRef } from "react";
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
import { getShapeFunction } from "/src/components/designer/productShapes";
import Konva from 'konva';
import 'svg2pdf.js';
import productTypesConfig from "/src/data/productTypes.json";
import { ProductShapes } from "/src/components/designer/productShapes";

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
    
    // Create ONE Konva stage for the entire layer (not per product!)
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.width = `${Math.max(1, Math.round(exportWidth))}px`;
    container.style.height = `${Math.max(1, Math.round(exportHeight))}px`;
    document.body.appendChild(container);

    const stage = new Konva.Stage({ 
      container, 
      width: Math.max(1, Math.round(exportWidth)), 
      height: Math.max(1, Math.round(exportHeight)), 
      listening: false 
    });
    const layer = new Konva.Layer();
    stage.add(layer);

    // Add background if present (once per layer)
    if (backgroundImage && backgroundImageNaturalSize) {
      try {
        const normalizedDataUrl = await new Promise((resolve, reject) => {
          try {
            const img = new window.Image();
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(exportWidth));
                canvas.height = Math.max(1, Math.round(exportHeight));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
              } catch (err) { reject(err); }
            };
            img.onerror = (err) => reject(err);
            img.src = backgroundImage;
          } catch (err) { reject(err); }
        });

        const bgImg = new window.Image();
        await new Promise((resolve, reject) => { 
          bgImg.onload = resolve; 
          bgImg.onerror = reject; 
          bgImg.src = normalizedDataUrl; 
        });
        const konvaBg = new Konva.Image({ 
          image: bgImg, 
          x: 0, 
          y: 0, 
          width: exportWidth, 
          height: exportHeight, 
          listening: false 
        });
        layer.add(konvaBg);
      } catch (err) {
        console.warn('Failed to load background for export:', err);
      }
    }

    // Add connectors (once per layer)
    connectors.forEach((connector) => {
      const fromProduct = products.find((p) => p.id === connector.from);
      const toProduct = products.find((p) => p.id === connector.to);
      if (!fromProduct || !toProduct) return;
      const x1 = fromProduct.x - contentOffsetX;
      const y1 = fromProduct.y - contentOffsetY;
      const x2 = toProduct.x - contentOffsetX;
      const y2 = toProduct.y - contentOffsetY;
      const line = new Konva.Line({ 
        points: [x1, y1, x2, y2], 
        stroke: connector.strokeColor || '#6495ed', 
        strokeWidth: 2, 
        listening: false 
      });
      layer.add(line);
    });

    // Add ALL products to the stage
    for (let pIndex = 0; pIndex < products.length; pIndex++) {
      const prod = products[pIndex];
      const productType = prod.product_type?.toLowerCase() || 'default';
      const configP = productTypesConfig[productType] || productTypesConfig.default;
      const scaleFactorP = prod.scaleFactor || scaleFactor;
      const realWorldSizeP = prod.realWorldSize || configP.realWorldSize;
      const realWorldWidthP = prod.realWorldWidth || configP.realWorldWidth;
      const realWorldHeightP = prod.realWorldHeight || configP.realWorldHeight;

      let renderedWidth, renderedHeight;
      if (realWorldSizeP) {
        renderedWidth = renderedHeight = realWorldSizeP * scaleFactorP;
      } else if (realWorldWidthP && realWorldHeightP) {
        renderedWidth = realWorldWidthP * scaleFactorP;
        renderedHeight = realWorldHeightP * scaleFactorP;
      } else {
        renderedWidth = configP.width || 30;
        renderedHeight = configP.height || 30;
      }

      const groupX = prod.x - contentOffsetX;
      const groupY = prod.y - contentOffsetY;
      const group = new Konva.Group({ 
        x: groupX, 
        y: groupY, 
        rotation: prod.rotation || 0, 
        scaleX: prod.scaleX || 1, 
        scaleY: prod.scaleY || 1, 
        listening: false 
      });

      const shapeFn = getShapeFunction(productType);
      const shape = new Konva.Shape({
        sceneFunc: (context, shapeNode) => shapeFn(context, shapeNode),
        fill: prod.color || configP.fill,
        stroke: prod.strokeColor || configP.stroke,
        strokeWidth: (configP.strokeWidth || 1) + 1,
        width: renderedWidth,
        height: renderedHeight,
        listening: false,
      });
      shape.setAttr('scaleFactor', renderedWidth / (realWorldSizeP || realWorldWidthP || 1));
      shape.setAttr('realWorldSize', realWorldSizeP);
      shape.setAttr('realWorldWidth', realWorldWidthP);
      shape.setAttr('realWorldHeight', realWorldHeightP);

      group.add(shape);

      // Text labels
      const maxDimensionP = Math.max(renderedWidth, renderedHeight);
      const baselineDimensionP = 50;
      const textScaleP = maxDimensionP / baselineDimensionP;
      const skuFontSize = Math.max(11 * textScaleP, 8);
      const nameFontSize = Math.max(10 * textScaleP, 7);
      const textWidth = 120 * textScaleP;
      const skuYOffset = -(maxDimensionP / 2 + 20 * textScaleP);
      const textYOffset = maxDimensionP / 2 + 10 * textScaleP;

      if (prod.sku) {
        const skuText = new Konva.Text({ 
          text: prod.sku, 
          fontSize: skuFontSize, 
          fill: '#000', 
          fontStyle: 'bold', 
          align: 'center', 
          width: textWidth, 
          x: -textWidth / 2, 
          y: skuYOffset, 
          listening: false 
        });
        group.add(skuText);
      }
      
      const label = prod.customLabel || prod.name;
      if (label) {
        const labelText = new Konva.Text({ 
          text: label, 
          fontSize: nameFontSize, 
          fill: '#666', 
          align: 'center', 
          width: textWidth, 
          x: -textWidth / 2, 
          y: textYOffset, 
          listening: false 
        });
        group.add(labelText);
      }

      // Quantity badge
      if (prod.quantity > 1) {
        const badgeRadius = 12 * textScaleP;
        const badgeX = maxDimensionP * 0.6;
        const badgeY = -maxDimensionP * 0.4;
        const badge = new Konva.Circle({ 
          x: badgeX, 
          y: badgeY, 
          radius: badgeRadius, 
          fill: '#d32f2f', 
          stroke: '#fff', 
          strokeWidth: 2, 
          listening: false 
        });
        const qText = new Konva.Text({ 
          x: badgeX - 6 * textScaleP, 
          y: badgeY - 5 * textScaleP, 
          text: `${prod.quantity}`, 
          fontSize: Math.max(10 * textScaleP, 8), 
          fill: '#fff', 
          listening: false 
        });
        group.add(badge);
        group.add(qText);
      }

      layer.add(group);
    }

    // Draw the layer
    layer.draw();

    // Debug: Check if toSVG is available
    console.log('Konva version:', Konva.version);
    console.log('Stage prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(stage)).filter(m => m.includes('SVG') || m.includes('svg')));
    console.log('Has toSVG?', typeof stage.toSVG === 'function');

    // Check if toSVG is available
    if (typeof stage.toSVG !== 'function') {
      stage.destroy();
      container.parentNode && container.parentNode.removeChild(container);
      throw new Error(
        `Konva Stage does not support toSVG(). ` +
        `Konva version: ${Konva.version || 'unknown'}. ` +
        `Try reinstalling: npm uninstall konva && npm install konva@latest`
      );
    }

    // Convert stage to SVG (ONCE per layer, not per product!)
    const svgStr = stage.toSVG();
    console.log('SVG generated successfully, length:', svgStr.length);

    // Verify pdf.svg is available
    if (typeof pdf.svg !== 'function') {
      stage.destroy();
      container.parentNode && container.parentNode.removeChild(container);
      throw new Error(
        'jsPDF SVG plugin not loaded. ' +
        'svg2pdf.js is installed but not being used by jsPDF. ' +
        'Make sure you have: import "svg2pdf.js"; at the top of your file.'
      );
    }

    // Render SVG to PDF as vectors
    try {
      await pdf.svg(svgStr, { 
        x: offsetX, 
        y: offsetY, 
        width: scaledWidth, 
        height: scaledHeight 
      });
      console.log('SVG rendered to PDF successfully');
    } catch (err) {
      console.error('Failed to render SVG to PDF:', err);
      stage.destroy();
      container.parentNode && container.parentNode.removeChild(container);
      throw err;
    }

    // Cleanup
    stage.destroy();
    container.parentNode && container.parentNode.removeChild(container);

    console.log(`Rendered ${products.length} products and ${connectors.length} connectors to PDF as vectors`);
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
      entry.layers.add(product.layerName || "");
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
