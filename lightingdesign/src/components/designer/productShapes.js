export const ProductShapes = {
  pendant: (context, shape) => {
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 50;
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 40;
    const radius = width / 2;

    // Main circle
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(shape);

    // Light rays (8 rays)
    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const startX = Math.cos(angle) * (radius + 1);
      const startY = Math.sin(angle) * (radius + 1);
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 40;
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 30;
    const height = shape.height() || 40;
    
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 40;
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 25;
    const height = shape.height() || 50;
    
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 60;
    const height = shape.height() || 10;
    
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 60;
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
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 30;
    const height = shape.height() || 30;
    context.beginPath();
    context.rect(-width / 2, -height / 2, width, height);
    context.fillStrokeShape(shape);
  },

  arrow: (context, shape) => {
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 80;
    const height = shape.height() || 40;
    
    // Draw arrow pointing right
    const headWidth = width * 0.3;
    const shaftHeight = height * 0.4;
    
    context.beginPath();
    // Start at left of shaft
    context.moveTo(-width / 2, -shaftHeight / 2);
    // Top of shaft
    context.lineTo(width / 2 - headWidth, -shaftHeight / 2);
    // Top of arrow head
    context.lineTo(width / 2 - headWidth, -height / 2);
    // Arrow point
    context.lineTo(width / 2, 0);
    // Bottom of arrow head
    context.lineTo(width / 2 - headWidth, height / 2);
    // Bottom of shaft
    context.lineTo(width / 2 - headWidth, shaftHeight / 2);
    // Complete shaft
    context.lineTo(-width / 2, shaftHeight / 2);
    context.closePath();
    context.fillStrokeShape(shape);
  },

  boxoutline: (context, shape) => {
    // Use pre-calculated dimensions from ProductShape component
    const width = shape.width() || 50;
    const height = shape.height() || 50;
    
    // Draw box outline (no fill)
    context.save();
    context.strokeStyle = shape.getAttr("stroke");
    context.lineWidth = shape.getAttr("strokeWidth") || 2;
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
