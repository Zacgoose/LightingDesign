# Testing Plan for Coordinate System Refactor

## Manual Testing Scenarios

### 1. Window Resize Testing
**Objective**: Verify objects maintain their position when window is resized

**Steps**:
1. Open the designer page
2. Place several products at different positions on the canvas
3. Note the positions of the objects relative to grid lines
4. Resize the browser window (both larger and smaller)
5. Verify that objects maintain their position relative to grid lines
6. Verify that the grid spacing remains consistent
7. Verify that zoom level is maintained

**Expected Result**: 
- Objects should not move relative to the grid
- Grid spacing should remain the same
- Zoom level should be preserved
- Panning should work smoothly after resize

### 2. Background Image Testing
**Objective**: Verify background images scale correctly with window resize

**Steps**:
1. Upload a background image to the canvas
2. Use the measurement tool to set the scale
3. Place objects relative to the background image
4. Resize the browser window
5. Verify the background image maintains correct scale
6. Verify objects remain aligned with background features

**Expected Result**:
- Background image should maintain its aspect ratio
- Scale factor should remain accurate
- Objects should stay aligned with background features

### 3. Measurement Tool Testing
**Objective**: Verify measurement tool provides accurate readings

**Steps**:
1. Place two measurement points on the canvas
2. Enter a known real-world distance
3. Place objects using the established scale
4. Resize the window
5. Take another measurement in the same area
6. Verify the measurement is still accurate

**Expected Result**:
- Measurements should be consistent before and after resize
- Scale factor should remain accurate
- Object sizes should match real-world dimensions

### 4. Product Placement Testing
**Objective**: Verify products can be placed correctly in all scenarios

**Steps**:
1. Select a product from the drawer
2. Click to place it on the canvas
3. Resize the window
4. Place another product at the same relative position
5. Verify both products are aligned
6. Test placement at various zoom levels
7. Test placement after panning

**Expected Result**:
- Products should place at the cursor position accurately
- Placement should work correctly after window resize
- Placement should work at all zoom levels
- Ghost preview should appear at correct position

### 5. Drag and Transform Testing
**Objective**: Verify object manipulation works correctly

**Steps**:
1. Place several products on the canvas
2. Test dragging products to new positions
3. Resize the window
4. Drag products again to verify smooth operation
5. Test rotation and scaling
6. Test group selection and transformation

**Expected Result**:
- Dragging should be smooth and accurate
- Rotation should snap correctly
- Scaling should maintain aspect ratio when appropriate
- Group transformations should work correctly

### 6. Grid and Zoom Testing
**Objective**: Verify grid and zoom functionality

**Steps**:
1. Toggle grid visibility on/off
2. Zoom in and out using mouse wheel
3. Resize the window at different zoom levels
4. Pan around the canvas
5. Reset view and verify objects return to correct position
6. Verify grid lines align correctly at all zoom levels

**Expected Result**:
- Grid should toggle visibility correctly
- Zoom should center on mouse position
- Grid lines should remain aligned
- Reset view should center the canvas correctly

### 7. Save and Load Testing
**Objective**: Verify designs save and load correctly

**Steps**:
1. Create a design with multiple objects
2. Set a background image and scale
3. Save the design
4. Resize the browser window
5. Reload the page
6. Verify all objects load at correct positions
7. Verify background image and scale are preserved

**Expected Result**:
- All objects should load at correct positions
- Background image should load correctly
- Scale factor should be preserved
- Zoom and pan state should be restored (if saved)

### 8. Layer System Testing
**Objective**: Verify layer system works with new coordinate system

**Steps**:
1. Create multiple layers
2. Place objects on different layers
3. Upload different background images to each layer
4. Switch between layers
5. Resize the window
6. Switch layers again
7. Verify objects and backgrounds are correct on each layer

**Expected Result**:
- Layer switching should be smooth
- Objects should appear in correct positions on each layer
- Background images should be layer-specific
- Scale factor can be different per layer

### 9. Connection Tool Testing
**Objective**: Verify connector lines work correctly

**Steps**:
1. Place two products on the canvas
2. Use the connection tool to connect them
3. Drag products to new positions
4. Resize the window
5. Drag products again
6. Verify connection lines update correctly

**Expected Result**:
- Connection lines should stay attached to products
- Lines should update when products move
- Lines should remain correct after window resize

### 10. Performance Testing
**Objective**: Verify performance is acceptable

**Steps**:
1. Place 50+ products on the canvas
2. Resize the window multiple times
3. Zoom in and out
4. Pan around the canvas
5. Monitor for any lag or freezing

**Expected Result**:
- No significant lag during window resize
- Smooth zooming and panning
- No freezing or stuttering
- Grid render performance is acceptable

## Automated Testing (if applicable)

### Unit Tests
- Test coordinate transformation functions
- Test viewport resize calculations
- Test stage position adjustments

### Integration Tests
- Test product placement coordinates
- Test measurement tool calculations
- Test save/load coordinate preservation

## Known Issues to Watch For

1. **Initial Load**: Verify canvas initializes with correct dimensions
2. **Race Conditions**: Check that layer loading doesn't interfere with resize
3. **Zoom Limits**: Ensure zoom stays within bounds (0.01 to 100)
4. **Grid Density**: Verify grid doesn't become too dense at high zoom
5. **Memory Leaks**: Watch for memory issues with frequent resize

## Regression Testing

Test the following existing features to ensure they still work:
- [ ] Copy/paste products
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts
- [ ] Context menus
- [ ] Product properties editing
- [ ] Export functionality
- [ ] Multi-select operations
- [ ] Alignment tools (if any)
- [ ] Snap to grid (if applicable)

## Browser Compatibility

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Acceptance Criteria

All of the following must be true:
- ✅ Objects maintain position during window resize
- ✅ Grid scale remains consistent
- ✅ Background images scale correctly
- ✅ Measurement tool provides accurate readings
- ✅ Product placement works in all scenarios
- ✅ Drag and transform operations work smoothly
- ✅ Save/load preserves all positions correctly
- ✅ No performance degradation
- ✅ Backward compatible with existing designs
- ✅ No visual glitches or artifacts
