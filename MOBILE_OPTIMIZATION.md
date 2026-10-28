# Arcadia Mobile Optimization Guide

## Overview

All Arcadia games have been optimized for mobile devices. This document explains the mobile-first improvements made to ensure great gameplay on phones and tablets.

## Core Mobile Features Implemented

### 1. **Responsive Viewport Configuration**
- All games now have proper viewport meta tags
- Support for safe areas on notched devices (iPhone X+, Android with notches)
- Prevents auto-zoom on text input (font-size: 16px requirement)
- Maximum scale set to 1.0 to prevent accidental zoom

### 2. **Mobile-First CSS** (`css/mobile.css`)
- **Responsive Typography**: Uses `clamp()` for fluid font scaling
  - Large screens: full size (h1: 48px)
  - Small screens: scaled down (h1: 24px on mobile)
  - Medium screens: proportional sizing

- **Touch-Friendly Elements**:
  - All buttons: minimum 44x44px (Apple HIG standard)
  - Increased padding on mobile
  - Better spacing between interactive elements

- **Orientation Handling**:
  - Portrait mode optimizations for games
  - Landscape-specific adjustments for canvas-based games
  - Device rotation hints showing automatically

- **Safe Area Support**:
  - Respects `env(safe-area-inset-*)` for notched devices
  - Prevents UI from hiding behind camera notches
  - Proper padding on devices with rounded corners

### 3. **Utility Libraries**

#### `js/mobile-utils.js`
Shared utilities for all games:
- `MobileUtils.isMobile()` - Detect if on mobile device
- `MobileUtils.getOrientation()` - Get current orientation (portrait/landscape)
- `MobileUtils.resizeCanvasForDisplay()` - Properly scale canvas with DPR
- `MobileUtils.createTouchInputController()` - Setup touch controls
- `MobileUtils.createDirectionalPad()` - Add mobile control pad
- `MobileUtils.createActionButton()` - Add action buttons (jump, shoot, etc.)
- `MobileUtils.showOrientationHint()` - Show rotation prompt
- `MobileUtils.getSafeAreaInsets()` - Get safe area insets
- `MobileUtils.setupHybridInput()` - Keyboard + touch fallback

#### `js/game-mobile-enhancer.js`
Automatic mobile enhancements for games:
- Responsive canvas sizing
- Device pixel ratio handling
- Orientation prompts
- Touch event dispatch
- Safe area padding

## Game-Specific Mobile Optimizations

### Canvas-Based Games (Ping Pong, Fruit Slash, Gravity Run, etc.)

**Touch Controls**:
- Drag to aim/move paddles
- Tap to perform actions
- Swipe gestures for special moves
- Visual feedback on touch

**Canvas Responsiveness**:
- Scales to screen size
- Maintains aspect ratio
- Handles device pixel ratio for crisp rendering
- Resizes on orientation change

**Orientation Support**:
- Games detect portrait/landscape
- Auto-resize on device rotation
- Prompts user to rotate if needed for landscape-only games

### DOM-Based Games (Memory Card, Tic Tac Toe, etc.)

**Touch Optimization**:
- Larger tap targets
- Better spacing between cards/buttons
- Touch feedback (visual press state)

**Layout Flexibility**:
- Responsive grid layouts
- Adapts to screen size
- Stacks vertically on small screens
- Multi-column on larger screens

## Usage for Game Developers

### How to Use MobileUtils in Your Game

```javascript
// Setup basic mobile features
const enhancer = new GameMobileEnhancer();
enhancer.init('canvas', { 
  requireLandscape: false  // Set to true if game needs landscape
});

// Get canvas dimensions
const dims = enhancer.getCanvasDimensions();
console.log(`Canvas: ${dims.width}x${dims.height}`);

// Get touch input
const touch = enhancer.getTouchInput();
if (touch.isActive) {
  console.log(`Touch at: ${touch.x}, ${touch.y}`);
}

// Listen to resize events
window.addEventListener('gameCanvasResized', (e) => {
  console.log('Canvas resized to:', e.detail);
});
```

### Adding Touch Controls

```javascript
// Create directional pad
const dpad = MobileUtils.createDirectionalPad(document.body);
setInterval(() => {
  if (dpad.input.up) player.moveUp();
  if (dpad.input.down) player.moveDown();
  if (dpad.input.left) player.moveLeft();
  if (dpad.input.right) player.moveRight();
}, 16);

// Create action button
const jumpBtn = MobileUtils.createActionButton('JUMP', 'right', 'bottom');
window.addEventListener('touchstart', () => {
  if (jumpBtn.isPressed()) player.jump();
});
```

## Responsive Breakpoints

The mobile CSS uses these breakpoints:

- **320px - 480px**: Small phones (portrait)
- **481px - 768px**: Tablets and large phones
- **769px+**: Desktop

## Safe Area Support

For devices with notches, camera cutouts, or rounded corners:

```css
/* Example: adding safe area padding */
.ui-element {
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

## Testing Checklist

### Desktop Testing
- [ ] Game playable at 1920x1080
- [ ] Game playable at 1280x720
- [ ] No console errors
- [ ] Keyboard controls work

### Mobile Testing (Real Device)

**Small Phone (320px - 414px)**
- [ ] Game launches without errors
- [ ] All UI visible and readable
- [ ] Touch controls responsive
- [ ] Playable in portrait OR landscape (as designed)
- [ ] No text zoomed illegibly
- [ ] Safe from notch/rounded corners

**Tablet (768px+)**
- [ ] Responsive layout works
- [ ] Touch controls responsive
- [ ] UI properly scaled
- [ ] Performance acceptable (60 FPS or smooth)

**Browsers to Test**
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Performance Targets
- **Game loads**: < 2 seconds
- **Game runs**: 60 FPS or smooth performance
- **Touch latency**: < 100ms response

## Common Issues & Solutions

### Issue: Canvas is blurry on mobile

**Solution**: The GameMobileEnhancer handles this automatically. Ensure you're using proper device pixel ratio:

```javascript
const enhancer = new GameMobileEnhancer();
enhancer.init('canvas');
// Canvas is now properly scaled!
```

### Issue: Touch controls don't work in portrait

**Solution**: Check if game requires landscape:

```javascript
enhancer.init('canvas', { 
  requireLandscape: true  // Will show rotation hint
});
```

### Issue: Safe areas not respected

**Solution**: Use the CSS variables:

```css
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### Issue: Text zooms when focusing input

**Solution**: Already handled in `mobile.css`. Ensure input font-size is 16px minimum.

## Browser Support

- iOS Safari 11+
- Android Chrome 60+
- Samsung Internet 8+
- Firefox Android 60+
- Edge Mobile 18+

## Future Enhancements

Potential improvements for future versions:
- [ ] PWA support (installable games)
- [ ] Haptic feedback on touch
- [ ] Accelerometer/gyroscope support
- [ ] Fullscreen API with proper iPhone support
- [ ] Game-specific optimizations per platform
- [ ] Mobile-first sound optimizations
- [ ] Offline support with Service Workers

## References

- [Apple Human Interface Guidelines - Touch](https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/gestures/)
- [MDN Web Docs - CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env())
- [Web.dev - Viewport Meta Tag](https://web.dev/viewport-meta-tag/)
- [Responsive Canvas Art](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas)

---

**Last Updated**: August 2026

All Arcadia games are now mobile-optimized and ready for play on any device!
