/**
 * Arcadia Mobile Utilities
 * Shared utilities for mobile-friendly game controls, orientation handling, and responsive canvas sizing
 */

const MobileUtils = {
  /**
   * Detect if device is mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Get current orientation (portrait, landscape, or natural)
   */
  getOrientation() {
    return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  },

  /**
   * Show orientation lock prompt (only works on certain mobile browsers)
   */
  requestLockOrientation(orientation = 'landscape') {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock(orientation).catch(err => {
        console.log('[v0] Orientation lock not supported:', err);
      });
    }
  },

  /**
   * Unlock orientation
   */
  requestUnlockOrientation() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  },

  /**
   * Create responsive canvas container with proper scaling
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {number} desiredWidth - Desired canvas width (logical pixels)
   * @param {number} desiredHeight - Desired canvas height (logical pixels)
   * @param {Object} options - Additional options
   */
  resizeCanvasForDisplay(canvas, desiredWidth, desiredHeight, options = {}) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Physical pixel dimensions
    canvas.width = desiredWidth * dpr;
    canvas.height = desiredHeight * dpr;
    
    // CSS display size
    canvas.style.width = desiredWidth + 'px';
    canvas.style.height = desiredHeight + 'px';
    
    // Get canvas context and scale it
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    return { width: desiredWidth, height: desiredHeight, dpr };
  },

  /**
   * Calculate responsive canvas size based on viewport
   */
  getResponsiveCanvasSize(maxWidth, maxHeight, minWidth = 200, minHeight = 150) {
    const vw = Math.min(window.innerWidth - 32, maxWidth); // 32px padding
    const vh = Math.min(window.innerHeight - 120, maxHeight); // account for UI
    
    const width = Math.max(minWidth, Math.floor(vw));
    const height = Math.max(minHeight, Math.floor(vh));
    
    return { width, height };
  },

  /**
   * Setup touch input for mobile paddle/directional control
   * Returns object with current input state
   */
  createTouchInputController() {
    const input = {
      up: false,
      down: false,
      left: false,
      right: false,
      tap: false,
      lastTouchX: 0,
      lastTouchY: 0,
    };

    const controller = {
      input,
      
      // Attach to canvas or element
      attach(element) {
        element.addEventListener('touchstart', (e) => this._handleTouchStart(e));
        element.addEventListener('touchmove', (e) => this._handleTouchMove(e));
        element.addEventListener('touchend', (e) => this._handleTouchEnd(e));
        element.addEventListener('touchcancel', (e) => this._handleTouchEnd(e));
        
        // Also support mouse for testing on desktop
        element.addEventListener('mousedown', (e) => this._handleMouseDown(e));
        element.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        element.addEventListener('mouseup', (e) => this._handleMouseUp(e));
      },

      _handleTouchStart(e) {
        if (e.touches.length === 0) return;
        const touch = e.touches[0];
        input.lastTouchX = touch.clientX;
        input.lastTouchY = touch.clientY;
        input.tap = true;
      },

      _handleTouchMove(e) {
        if (e.touches.length === 0) return;
        e.preventDefault();
        const touch = e.touches[0];
        input.lastTouchX = touch.clientX;
        input.lastTouchY = touch.clientY;
      },

      _handleTouchEnd(e) {
        input.tap = false;
      },

      _handleMouseDown(e) {
        input.lastTouchX = e.clientX;
        input.lastTouchY = e.clientY;
        input.tap = true;
      },

      _handleMouseMove(e) {
        input.lastTouchX = e.clientX;
        input.lastTouchY = e.clientY;
      },

      _handleMouseUp(e) {
        input.tap = false;
      },

      // Get direction from touch position (left/right side of canvas)
      getHorizontalInput(canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        
        if (input.lastTouchX < centerX - 20) {
          return 'left';
        } else if (input.lastTouchX > centerX + 20) {
          return 'right';
        }
        return 'none';
      },

      // Get vertical direction (top/bottom)
      getVerticalInput(canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        
        if (input.lastTouchY < centerY - 20) {
          return 'up';
        } else if (input.lastTouchY > centerY + 20) {
          return 'down';
        }
        return 'none';
      },
    };

    return controller;
  },

  /**
   * Create four-way touch input (up/down/left/right)
   */
  createDirectionalPad(element, size = 100) {
    const pad = document.createElement('div');
    pad.className = 'touch-dpad';
    pad.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: ${size}px;
      height: ${size}px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      z-index: 100;
    `;
    
    const input = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    const handleStart = (e) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      updateFromTouch(touch);
    };

    const handleMove = (e) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateFromTouch(touch);
    };

    const handleEnd = (e) => {
      input.up = input.down = input.left = input.right = false;
    };

    const updateFromTouch = (touch) => {
      const rect = pad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      input.up = input.down = input.left = input.right = false;
      
      if (distance > 20) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        if (angle > -45 && angle < 45) input.right = true;
        else if (angle >= 45 && angle < 135) input.down = true;
        else if (angle >= 135 || angle < -135) input.left = true;
        else input.up = true;
      }
    };

    pad.addEventListener('touchstart', handleStart);
    pad.addEventListener('touchmove', handleMove);
    pad.addEventListener('touchend', handleEnd);
    pad.addEventListener('touchcancel', handleEnd);
    
    pad.innerHTML = '⬆️';
    
    element.appendChild(pad);
    
    return { element: pad, input, remove: () => pad.remove() };
  },

  /**
   * Create action buttons for mobile
   */
  createActionButton(label = 'JUMP', x = 'right', y = 'bottom') {
    const btn = document.createElement('button');
    btn.className = 'mobile-action-btn';
    btn.textContent = label;
    btn.style.cssText = `
      position: fixed;
      ${y}: 20px;
      ${x}: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(79, 140, 255, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      z-index: 101;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      active: {
        transform: scale(0.95);
      }
    `;
    
    let isPressed = false;
    
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isPressed = true;
      btn.style.transform = 'scale(0.95)';
    });
    
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      isPressed = false;
      btn.style.transform = 'scale(1)';
    });
    
    btn.addEventListener('touchcancel', (e) => {
      isPressed = false;
      btn.style.transform = 'scale(1)';
    });
    
    return { element: btn, isPressed: () => isPressed, remove: () => btn.remove() };
  },

  /**
   * Show orientation hint overlay for mobile
   */
  showOrientationHint(callback) {
    const hint = document.createElement('div');
    hint.className = 'orientation-hint';
    hint.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      z-index: 9999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
      text-align: center;
      padding: 20px;
    `;
    
    hint.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📱 ⟹ 📱</div>
      <h2 style="margin: 0 0 10px 0; font-size: 24px;">Turn Your Device</h2>
      <p style="margin: 0; font-size: 16px; opacity: 0.9;">This game is best played in landscape mode</p>
    `;
    
    document.body.appendChild(hint);
    
    const checkOrientation = () => {
      if (MobileUtils.getOrientation() === 'landscape') {
        hint.remove();
        window.removeEventListener('orientationchange', checkOrientation);
        if (callback) callback();
      }
    };
    
    window.addEventListener('orientationchange', checkOrientation);
    
    // Also check on touch if user taps
    hint.addEventListener('touchstart', checkOrientation);
  },

  /**
   * Safe area insets for notched devices
   */
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseFloat(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseFloat(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseFloat(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseFloat(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
    };
  },

  /**
   * Initialize keyboard + touch fallback for games
   */
  setupHybridInput(element) {
    const input = {
      keys: {},
      touches: {},
    };

    window.addEventListener('keydown', (e) => {
      input.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      input.keys[e.key.toLowerCase()] = false;
    });

    element.addEventListener('touchstart', (e) => {
      for (let touch of e.touches) {
        input.touches[touch.identifier] = { x: touch.clientX, y: touch.clientY };
      }
    });

    element.addEventListener('touchmove', (e) => {
      for (let touch of e.touches) {
        input.touches[touch.identifier] = { x: touch.clientX, y: touch.clientY };
      }
    });

    element.addEventListener('touchend', (e) => {
      for (let touch of e.changedTouches) {
        delete input.touches[touch.identifier];
      }
    });

    return input;
  },
};

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileUtils;
}
