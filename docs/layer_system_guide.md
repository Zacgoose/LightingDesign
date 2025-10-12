# Layer System Guide

## Overview

The layer system allows you to work with multiple floorplans and organize objects by type. This guide explains how to use the layer features in the LightingDesign canvas.

## Concepts

### Main Layers (Floors)
- Represent different floors or separate floorplans
- Only one main layer is active at a time
- Each layer has its own background image, products, and connectors
- Switching layers doesn't affect other layers

### Sublayers (Object Types)
- Within each main layer, objects are organized into sublayers by type
- Default sublayers: Lights, Power Points, Switches, Other
- Multiple sublayers can be visible at once
- Hiding a sublayer hides all objects of that type

## Using Layers

### Opening the Layer Panel

1. Click the **Layers** button in the view toolbar
2. Two panels will appear on the right side:
   - **Layers Panel:** Manage main layers (floors)
   - **Object Layers Panel:** Toggle sublayer visibility

### Creating a New Layer

1. Click the **Layers** button to show the layer panel
2. Click the **+** (plus) button in the Layers panel
3. Enter a name for the new layer (e.g., "Floor 2", "Ground Floor")
4. The new layer becomes active and is ready to use

### Switching Between Layers

1. Open the Layers panel
2. Click on any layer to make it active
3. The canvas will show that layer's objects and background

### Managing Layer Visibility

Each layer has visibility controls:
- **Eye Icon:** Show/hide layer (useful for reference without switching)
- **Lock Icon:** Lock/unlock layer (prevents editing)

**Note:** Hidden layers are not rendered, improving performance.

### Deleting a Layer

1. Open the Layers panel
2. Click the **trash** icon next to the layer you want to delete
3. Confirm the deletion
4. If you delete the active layer, the first remaining layer becomes active

**Important:** There must always be at least one layer. You cannot delete the last layer.

## Working with Sublayers

### Showing/Hiding Object Types

1. Open the Layers panel
2. In the **Object Layers** panel, you'll see checkboxes for:
   - Lights
   - Power Points
   - Switches
   - Other

3. Uncheck a sublayer to hide all objects of that type
4. Check a sublayer to show all objects of that type

### Use Cases for Sublayers

**During Design:**
- Hide power points to focus on light placement
- Show only switches to review switch locations
- Hide all but lights to check lighting coverage

**For Presentations:**
- Show different views for different stakeholders
- Display electrical layout separately from lighting
- Create progressive reveals (add layers incrementally)

**For Exports:**
- Export lighting plan without power points
- Create separate drawings for different trades
- Generate specialized views for documentation

## Working with Multiple Floors

### Setting Up Multiple Floors

1. Create a layer for each floor:
   - Click **+** to add Layer
   - Name it "Ground Floor"
   - Upload the ground floor plan
   - Add objects for ground floor

2. Create second floor:
   - Click **+** again
   - Name it "First Floor"
   - Upload the first floor plan
   - Add objects for first floor

3. Switch between floors by clicking them in the layer panel

### Best Practices for Multiple Floors

1. **Consistent Naming:** Use clear names like "Ground Floor", "First Floor", etc.
2. **Complete One Floor at a Time:** Finish one floor before moving to the next
3. **Align Floor Plans:** Try to align floor plans so walls line up when possible
4. **Use Reference Images:** Upload architect's plans as background images
5. **Save Regularly:** Save after completing each floor

## Layer Data Management

### What's Stored in Each Layer

Each layer independently stores:
- Background image (floor plan)
- All products (lights, power points, switches, etc.)
- All connectors (cables between products)
- Sublayer visibility settings

### Switching Layers

When you switch to a different layer:
- Current layer's state is automatically saved
- New layer's state is loaded
- Canvas updates to show new layer's content
- Undo/redo history is layer-specific

### Background Images

Each layer can have its own background image:
1. Switch to the layer you want to add a background to
2. Click "Upload Floor Plan" in the main toolbar
3. Select the image file
4. The image is associated with the current layer only

## Tips and Tricks

### Performance

- **Hide Unused Layers:** Improve performance by hiding layers you're not referencing
- **Use Sublayers:** Hide object types you're not working with
- **Lock Completed Layers:** Lock layers to prevent accidental changes

### Organization

- **Name Layers Clearly:** Use descriptive names that match your building
- **Group Similar Work:** Complete all work on one floor before moving to next
- **Use Sublayers for Review:** Hide non-essential object types during review

### Workflow

**Recommended workflow for multi-floor buildings:**

1. **Setup Phase:**
   - Create all floor layers
   - Upload all background images
   - Set up consistent naming

2. **Design Phase:**
   - Work on one floor at a time
   - Use sublayers to focus on specific object types
   - Save after completing each floor

3. **Review Phase:**
   - Switch between floors to check consistency
   - Use sublayers to create different views
   - Lock completed layers

4. **Export Phase:**
   - Switch to each floor and export
   - Create specialized views using sublayers
   - Save different configurations

## Keyboard Shortcuts

While the layer panel is open:
- **Arrow Keys:** Navigate between layers (future feature)
- **Delete:** Delete selected layer (future feature)
- **Ctrl/Cmd + N:** New layer (future feature)

## Troubleshooting

### Layer Panel Not Showing
- Click the **Layers** button in the view toolbar
- Ensure browser window is wide enough (panels appear on right side)

### Objects Disappearing
- Check if the correct layer is active
- Check if sublayer visibility is enabled
- Check if layer visibility is enabled (eye icon)

### Can't Edit Objects
- Check if layer is locked (lock icon)
- Ensure you're on the correct layer

### Performance Issues
- Hide unused layers
- Hide unused sublayers
- Reduce number of objects in view

## Technical Details

### Layer State Structure

For developers, each layer is structured as:
```javascript
{
  id: 'layer-1',
  name: 'Floor 1',
  visible: true,
  locked: false,
  backgroundImage: 'data:image/...',
  backgroundImageNaturalSize: { width: 1920, height: 1080 },
  products: [...],
  connectors: [...],
  sublayers: [
    { id: 'layer-1-lights', name: 'Lights', visible: true, type: 'light' },
    { id: 'layer-1-power', name: 'Power Points', visible: true, type: 'power' },
    { id: 'layer-1-switches', name: 'Switches', visible: true, type: 'switch' },
    { id: 'layer-1-other', name: 'Other', visible: true, type: 'other' },
  ],
}
```

### Object Type Mapping

Objects are automatically categorized into sublayers based on their product type:
- **Lights:** Any product type containing "light"
- **Power Points:** Product types containing "power" or "outlet"
- **Switches:** Product types containing "switch"
- **Other:** All other product types

## Future Enhancements

Planned features for future releases:
- Drag-and-drop layer reordering
- Layer groups/folders
- Copy objects between layers
- Layer templates
- Custom sublayer types
- Layer blending/reference modes
- Export all layers at once

## Support

For issues or questions about the layer system:
1. Check this documentation
2. Review the canvas_performance_tips.md guide
3. Open an issue on GitHub
4. Contact the development team

---

Last Updated: 2025-10-12
Version: 1.0
