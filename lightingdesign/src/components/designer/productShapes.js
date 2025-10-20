export const ProductShapes = {
  pendant: (context, shape) => {
    // Use realWorldSize (meters) and scaleFactor (pixels per meter)
    const scaleFactor = shape.getAttr("scaleFactor") || 50; // fallback if not set
    const realWorldSize =
      shape.getAttr("realWorldSize") || (shape.width() ? shape.width() / scaleFactor : 1); // meters
    const width = realWorldSize * scaleFactor;
    const radius = width / 2;

    // Hanging wire
    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, -radius * 1.5);
    context.lineTo(0, -radius);
    context.stroke();
    context.restore();

    // Pendant body (circle)
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);
  },

  downlight: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldSize =
      shape.getAttr("realWorldSize") || (shape.width() ? shape.width() / scaleFactor : 0.8);
    const width = realWorldSize * scaleFactor;
    const radius = width / 2;

    // Main circle
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);

    // Light rays (8 rays)
    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const startX = Math.cos(angle) * (radius + 2);
      const startY = Math.sin(angle) * (radius + 2);
      const endX = Math.cos(angle) * (radius + 8);
      const endY = Math.sin(angle) * (radius + 8);

      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
    }
    context.restore();
  },

  spotlight: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldSize =
      shape.getAttr("realWorldSize") || (shape.width() ? shape.width() / scaleFactor : 0.8);
    const width = realWorldSize * scaleFactor;
    const radius = width / 2;

    // Mounting bracket
    context.beginPath();
    context.rect(-radius / 2, -radius * 1.2, radius, radius * 0.4);
    context.fillStrokeShape(shape);

    // Light body (cone-ish shape)
    context.beginPath();
    context.moveTo(-radius * 0.6, -radius);
    context.lineTo(radius * 0.6, -radius);
    context.lineTo(radius * 0.8, radius);
    context.lineTo(-radius * 0.8, radius);
    context.closePath();
    context.fillStrokeShape(shape);
  },

  wall: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldWidth =
      shape.getAttr("realWorldWidth") || (shape.width() ? shape.width() / scaleFactor : 0.3);
    const realWorldHeight =
      shape.getAttr("realWorldHeight") || (shape.height() ? shape.height() / scaleFactor : 0.4);
    const width = realWorldWidth * scaleFactor;
    const height = realWorldHeight * scaleFactor;
    // Wall mount (rectangle)
    context.beginPath();
    context.rect(-width / 4, -height / 2, width / 2, height * 0.3);
    context.fillStrokeShape(shape);

    // Light fixture (semi-circle)
    context.beginPath();
    context.arc(0, 0, width / 2, 0, Math.PI, false);
    context.closePath();
    context.fillStrokeShape(shape);
  },

  fan: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldSize =
      shape.getAttr("realWorldSize") || (shape.width() ? shape.width() / scaleFactor : 1.4);
    const width = realWorldSize * scaleFactor;
    const radius = width / 2;

    // Center circle
    context.beginPath();
    context.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);

    // Fan blades (4 blades)
    for (let i = 0; i < 4; i++) {
      context.save();
      context.rotate((i * Math.PI * 2) / 4);

      // Blade shape
      context.beginPath();
      context.ellipse(radius * 0.6, 0, radius * 0.4, radius * 0.15, 0, 0, Math.PI * 2);
      context.fillStrokeShape(shape);

      context.restore();
    }
  },

  lamp: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldWidth =
      shape.getAttr("realWorldWidth") || (shape.width() ? shape.width() / scaleFactor : 0.25);
    const realWorldHeight =
      shape.getAttr("realWorldHeight") || (shape.height() ? shape.height() / scaleFactor : 0.5);
    const width = realWorldWidth * scaleFactor;
    const height = realWorldHeight * scaleFactor;
    // Base
    context.beginPath();
    context.rect(-width / 3, height / 2 - 8, width * 0.66, 8);
    context.fillStrokeShape(shape);

    // Pole
    context.beginPath();
    context.rect(-width / 8, -height / 2 + 10, width / 4, height - 18);
    context.fillStrokeShape(shape);

    // Lampshade
    context.beginPath();
    context.moveTo(-width / 2, -height / 2 + 10);
    context.lineTo(width / 2, -height / 2 + 10);
    context.lineTo(width / 3, -height / 2);
    context.lineTo(-width / 3, -height / 2);
    context.closePath();
    context.fillStrokeShape(shape);
  },

  strip: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldWidth =
      shape.getAttr("realWorldWidth") || (shape.width() ? shape.width() / scaleFactor : 0.6);
    const realWorldHeight =
      shape.getAttr("realWorldHeight") || (shape.height() ? shape.height() / scaleFactor : 0.1);
    const width = realWorldWidth * scaleFactor;
    const height = realWorldHeight * scaleFactor;
    // Main strip
    context.beginPath();
    context.roundRect(-width / 2, -height / 2, width, height, height / 2);
    context.closePath();
    context.fillStrokeShape(shape);

    // LED indicators (small circles along the strip)
    context.save();
    context.fillStyle = "rgba(255, 255, 255, 0.6)";
    const ledCount = 5;
    for (let i = 0; i < ledCount; i++) {
      const x = -width / 2 + (width / (ledCount + 1)) * (i + 1);
      context.beginPath();
      context.arc(x, 0, height / 4, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  },

  ceiling: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldSize =
      shape.getAttr("realWorldSize") || (shape.width() ? shape.width() / scaleFactor : 1.2);
    const width = realWorldSize * scaleFactor;
    const radius = width / 2;

    // Outer circle
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);

    // Inner decorative ring
    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.lineWidth = 1;
    context.beginPath();
    context.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    // Center dot
    context.save();
    context.fillStyle = shape.getAttr("stroke");
    context.beginPath();
    context.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  },

  circle: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldSize =
      shape.getAttr("realWorldSize") || (shape.width() ? shape.width() / scaleFactor : 1);
    const width = realWorldSize * scaleFactor;
    const radius = width / 2;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);
  },

  rect: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldWidth =
      shape.getAttr("realWorldWidth") || (shape.width() ? shape.width() / scaleFactor : 0.3);
    const realWorldHeight =
      shape.getAttr("realWorldHeight") || (shape.height() ? shape.height() / scaleFactor : 0.3);
    const width = realWorldWidth * scaleFactor;
    const height = realWorldHeight * scaleFactor;
    context.beginPath();
    context.rect(-width / 2, -height / 2, width, height);
    context.fillStrokeShape(shape);
  },

  arrow: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldWidth =
      shape.getAttr("realWorldWidth") || (shape.width() ? shape.width() / scaleFactor : 1.0);
    const realWorldHeight =
      shape.getAttr("realWorldHeight") || (shape.height() ? shape.height() / scaleFactor : 0.3);
    const width = realWorldWidth * scaleFactor;
    const height = realWorldHeight * scaleFactor;

    // Draw a simple arrow line with arrowhead - more like a design/annotation tool
    const headLength = height * 1.5; // Arrow head length
    const headWidth = height; // Arrow head width
    const strokeWidth = shape.getAttr("strokeWidth") || 3;

    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.fillStyle = shape.getAttr("stroke");
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    // Draw the arrow shaft (line)
    context.beginPath();
    context.moveTo(-width / 2, 0);
    context.lineTo(width / 2 - headLength, 0);
    context.stroke();

    // Draw the arrow head (filled triangle)
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2 - headLength, -headWidth / 2);
    context.lineTo(width / 2 - headLength, headWidth / 2);
    context.closePath();
    context.fill();

    context.restore();
  },

  boxoutline: (context, shape) => {
    const scaleFactor = shape.getAttr("scaleFactor") || 50;
    const realWorldWidth =
      shape.getAttr("realWorldWidth") || (shape.width() ? shape.width() / scaleFactor : 1.0);
    const realWorldHeight =
      shape.getAttr("realWorldHeight") || (shape.height() ? shape.height() / scaleFactor : 1.0);
    const width = realWorldWidth * scaleFactor;
    const height = realWorldHeight * scaleFactor;
    const strokeWidth = shape.getAttr("strokeWidth") || 3;

    // Draw a simple box outline for annotations/highlighting
    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.rect(-width / 2, -height / 2, width, height);
    context.stroke();
    context.restore();
  },
};

// Helper function to get shape function by name
export const getShapeFunction = (shapeName) => {
  return ProductShapes[shapeName] || ProductShapes.rect;
};
