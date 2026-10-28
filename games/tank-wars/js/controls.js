/**
 * Keyboard and Touch Virtual Joystick Controller for Tank Wars.
 * Features simultaneous multi-touch handling for P1 (Left) and P2 (Right).
 */
class InputManager {
  constructor() {
    this.keys = {};
    this.isTouch = false;

    this.p1Stick = { x: 0, y: 0, active: false, touchId: null };
    this.p1Fire = false;

    this.p2Stick = { x: 0, y: 0, active: false, touchId: null };
    this.p2Fire = false;

    this.setupKeyboard();
    this.setupTouchControls();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const isInteractiveElement = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A';
      if (isInteractiveElement) return; // let normal typing / form / button behavior happen

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupTouchControls() {
    const enableTouch = () => {
      this.isTouch = true;
      const overlay = document.getElementById('mobile-controls-overlay');
      if (overlay) {
        overlay.style.display = 'block';
      }
    };

    window.addEventListener('touchstart', enableTouch, { once: true });

    const p1Base = document.getElementById('p1-joystick-base');
    const p1StickEl = document.getElementById('p1-joystick-stick');
    const p1FireBtn = document.getElementById('p1-fire-btn');

    const p2Base = document.getElementById('p2-joystick-base');
    const p2StickEl = document.getElementById('p2-joystick-stick');
    const p2FireBtn = document.getElementById('p2-fire-btn');

    const bindJoystick = (baseEl, stickEl, stateObj) => {
      if (!baseEl || !stickEl) return;

      const maxRadius = 45;

      const handleStart = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const rect = baseEl.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const dist = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
          if (dist <= rect.width * 0.8 && stateObj.touchId === null) {
            stateObj.touchId = touch.identifier;
            stateObj.active = true;
            updateStick(touch.clientX, touch.clientY);
          }
        }
      };

      const handleMove = (e) => {
        if (!stateObj.active) return;
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.identifier === stateObj.touchId) {
            updateStick(touch.clientX, touch.clientY);
            break;
          }
        }
      };

      const handleEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === stateObj.touchId) {
            stateObj.active = false;
            stateObj.touchId = null;
            stateObj.x = 0;
            stateObj.y = 0;
            stickEl.style.transform = 'translate(0px, 0px)';
            break;
          }
        }
      };

      const updateStick = (clientX, clientY) => {
        const rect = baseEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }

        stickEl.style.transform = `translate(${dx}px, ${dy}px)`;
        stateObj.x = dx / maxRadius;
        stateObj.y = dy / maxRadius;
      };

      baseEl.addEventListener('touchstart', handleStart, { passive: false });
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    };

    bindJoystick(p1Base, p1StickEl, this.p1Stick);
    bindJoystick(p2Base, p2StickEl, this.p2Stick);

    const bindFireBtn = (btnEl, setterFn) => {
      if (!btnEl) return;
      btnEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btnEl.classList.add('pressed');
        setterFn(true);
      }, { passive: false });

      const release = (e) => {
        btnEl.classList.remove('pressed');
        setterFn(false);
      };

      btnEl.addEventListener('touchend', release);
      btnEl.addEventListener('touchcancel', release);
    };

    bindFireBtn(p1FireBtn, (val) => { this.p1Fire = val; });
    bindFireBtn(p2FireBtn, (val) => { this.p2Fire = val; });
  }

  getP1Input() {
    let move = 0;
    let turn = 0;

    if (this.keys['KeyW']) move += 1;
    if (this.keys['KeyS']) move -= 1;
    if (this.keys['KeyA']) turn -= 1;
    if (this.keys['KeyD']) turn += 1;

    let shoot = !!this.keys['Space'] || this.p1Fire;

    if (this.p1Stick.active) {
      move = -this.p1Stick.y;
      turn = this.p1Stick.x;
    }

    return { move, turn, shoot, stickActive: this.p1Stick.active, stickVector: this.p1Stick };
  }

  getP2Input() {
    let move = 0;
    let turn = 0;

    if (this.keys['ArrowUp']) move += 1;
    if (this.keys['ArrowDown']) move -= 1;
    if (this.keys['ArrowLeft']) turn -= 1;
    if (this.keys['ArrowRight']) turn += 1;

    let shoot = !!this.keys['Enter'] || this.p2Fire;

    if (this.p2Stick.active) {
      move = -this.p2Stick.y;
      turn = this.p2Stick.x;
    }

    return { move, turn, shoot, stickActive: this.p2Stick.active, stickVector: this.p2Stick };
  }
}

function initInputManager() {
  if (!window.inputManager) {
    window.inputManager = new InputManager();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initInputManager);
} else {
  initInputManager();
}
