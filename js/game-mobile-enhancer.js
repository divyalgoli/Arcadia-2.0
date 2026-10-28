/**
 * Universal Game Mobile Enhancer
 * Automatically applies mobile optimizations to any game in Arcadia
 * Features: Responsive canvas, touch controls, orientation hints, safe area support
 */

class GameMobileEnhancer {
  constructor() {
    this.canvas = null;
    this.originalCanvasWidth = 0;
    this.originalCanvasHeight = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.touchController = null;
    this.isMobile = this.detectMobile();
  }

  /**
   * Initialize all mobile enhancements for a game
   */
  init(canvasSelector = 'canvas', options = {}) {
    this.canvas = document.querySelector(canvasSelector);
    if (!this.canvas) {
      console.log('[v0] No canvas found for mobile enhancement');
      return;
    }

    // Store original dimensions
    this.originalCanvasWidth = this.canvas.width;
    this.originalCanvasHeight = this.canvas.height;

    // Apply enhancements
    this.addViewportMeta();
    this.makeCanvasResponsive();
    this.setupOrientationHandling(options.requireLandscape === false);
    this.setupTouchEvents();
    this.addSafeAreaPadding();
    this.handleDevicePixelRatio();

    // Listen for resize/orientation changes
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => this.onOrientationChange());

    if (this.isMobile) {
      console.log('[v0] Mobile enhancements initialized');
    }

    return this;
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Ensure correct viewport meta tag
   */
  addViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    // Update viewport to ensure mobile optimization
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content');
  }

  /**
   * Make canvas responsive to screen size
   */
  makeCanvasResponsive() {
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxWidth = '100vw';
    this.canvas.style.maxHeight = '100vh';
    this.canvas.style.userSelect = 'none';
    
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.onResize();
  }

  /**
   * Handle device pixel ratio for crisp rendering
   */
  handleDevicePixelRatio() {
    this.dpr = window.devicePixelRatio || 1;
    // Cap at 2 to avoid performance issues
    if (this.dpr > 2) this.dpr = 2;
  }

  /**
   * Resize canvas for optimal display
   */
  resizeCanvas(width, height) {
    if (!this.canvas) return;

    this.dpr = window.devicePixelRatio || 1;
    if (this.dpr > 2) this.dpr = 2;

    // Physical pixels
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);

    // Get context and scale
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.scale(this.dpr, this.dpr);
    }
  }

  /**
   * Handle resize events
   */
  onResize() {
    if (!this.canvas) return;

    const rect = this.canvas.parentElement.getBoundingClientRect();
    let width = rect.width || window.innerWidth;
    let height = rect.height || window.innerHeight;

    // Account for browser UI on mobile
    if (this.isMobile && window.innerHeight < window.innerWidth) {
      // Landscape mode - account for browser bottom bar
      height = Math.max(height, window.innerHeight * 0.9);
    }

    // Ensure minimum playable size
    width = Math.max(width, 240);
    height = Math.max(height, 160);

    this.resizeCanvas(width, height);

    // Dispatch custom event for game to listen to
    window.dispatchEvent(new CustomEvent('gameCanvasResized', { 
      detail: { width: width, height: height, dpr: this.dpr }
    }));
  }

  onOrientationChange() {
    setTimeout(() => this.onResize(), 100);
  }

  /**
   * Setup orientation handling
   */
  setupOrientationHandling(allowPortrait = true) {
    if (!this.isMobile) return;

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;

      if (isPortrait && !allowPortrait) {
        this.showRotateHint();
      } else {
        this.hideRotateHint();
      }
    };

    window.addEventListener('orientationchange', checkOrientation);
    // Check initial orientation
    setTimeout(checkOrientation, 100);
  }

  showRotateHint() {
    let hint = document.getElementById('mobile-rotate-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'mobile-rotate-hint';
      hint.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 99999;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        text-align: center;
        padding: 20px;
      `;
      hint.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 20px;">📱</div>
        <h2 style="margin: 0 0 12px 0; font-size: 24px;">Rotate Your Device</h2>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">This game plays best in landscape mode</p>
      `;
      document.body.appendChild(hint);
    }
    hint.style.display = 'flex';
  }

  hideRotateHint() {
    const hint = document.getElementById('mobile-rotate-hint');
    if (hint) hint.style.display = 'none';
  }

  /**
   * Setup touch event listeners
   */
  setupTouchEvents() {
    if (!this.isMobile) return;

    const touchInput = {
      x: 0,
      y: 0,
      isActive: false,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchInput.x = touch.clientX;
      touchInput.y = touch.clientY;
      touchInput.startX = touch.clientX;
      touchInput.startY = touch.clientY;
      touchInput.isActive = true;
      this.dispatchTouchEvent('touchstart', touchInput);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchInput.x = touch.clientX;
      touchInput.y = touch.clientY;
      touchInput.deltaX = touch.clientX - touchInput.startX;
      touchInput.deltaY = touch.clientY - touchInput.startY;
      this.dispatchTouchEvent('touchmove', touchInput);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchInput.isActive = false;
      this.dispatchTouchEvent('touchend', touchInput);
    });

    // Store on window for easy access
    window.__gameTouch = touchInput;
  }

  dispatchTouchEvent(type, data) {
    window.dispatchEvent(new CustomEvent(`gameTouchEvent:${type}`, { detail: data }));
  }

  /**
   * Add safe area padding for notched devices
   */
  addSafeAreaPadding() {
    const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) || 0;
    const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0;
    const safeLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left)')) || 0;
    const safeRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)')) || 0;

    window.__safAreas = { top: safeTop, bottom: safeBottom, left: safeLeft, right: safeRight };
  }

  /**
   * Get current canvas dimensions
   */
  getCanvasDimensions() {
    if (!this.canvas) return { width: 800, height: 600 };
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height, dpr: this.dpr };
  }

  /**
   * Get safe area insets
   */
  getSafeAreas() {
    return window.__safAreas || { top: 0, bottom: 0, left: 0, right: 0 };
  }

  /**
   * Get touch input state
   */
  getTouchInput() {
    return window.__gameTouch || { x: 0, y: 0, isActive: false, deltaX: 0, deltaY: 0 };
  }
}

// Export for use
window.GameMobileEnhancer = GameMobileEnhancer;
