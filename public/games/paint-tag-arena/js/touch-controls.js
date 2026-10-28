/**
 * Touch Controls — dual on-screen joysticks + dash buttons
 * ------------------------------------------------------------------
 * Paint Tag Arena's movement is keyboard-only (WASD / Shift for
 * Player 1, IJKL / U for Player 2), read in game.js via a Set of
 * currently-held e.code values. Rather than reach into the Game
 * instance, this module stays fully decoupled: it dispatches real
 * KeyboardEvents on window with the matching `code`, so the existing
 * `_bindInput()` listeners pick them up exactly as if a keyboard
 * were pressed. Nothing in game.js needs to change.
 *
 * Only active on coarse-pointer (touch) devices — see the
 * `.touch-controls` display rule in css/responsive.css. On desktop
 * this file still runs but the controls are invisible and the
 * zones report no pointer events, so it's a no-op.
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  var DEADZONE = 0.28; // fraction of stick radius before a direction "engages"

  var STICKS = [
    {
      zoneId: "stick-zone-p1",
      thumbId: "stick-thumb-p1",
      dashBtnId: "dash-btn-p1",
      keys: { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", dash: "ShiftLeft" },
    },
    {
      zoneId: "stick-zone-p2",
      thumbId: "stick-thumb-p2",
      dashBtnId: "dash-btn-p2",
      keys: { up: "KeyI", down: "KeyK", left: "KeyJ", right: "KeyL", dash: "KeyU" },
    },
  ];

  function fireKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code: code, bubbles: true }));
  }

  function setupStick(cfg) {
    var zone = document.getElementById(cfg.zoneId);
    var thumb = document.getElementById(cfg.thumbId);
    var dashBtn = document.getElementById(cfg.dashBtnId);
    if (!zone || !thumb) return;

    var activePointerId = null;
    var center = { x: 0, y: 0 };
    var radius = 1;
    var active = { up: false, down: false, left: false, right: false };

    function setDirection(dir, on) {
      if (active[dir] === on) return;
      active[dir] = on;
      fireKey(on ? "keydown" : "keyup", cfg.keys[dir]);
    }

    function resetAll() {
      setDirection("up", false);
      setDirection("down", false);
      setDirection("left", false);
      setDirection("right", false);
      thumb.style.transform = "translate(-50%, -50%)";
    }

    function updateFromPoint(clientX, clientY) {
      var dx = clientX - center.x;
      var dy = clientY - center.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var clamped = Math.min(dist, radius);
      var angle = Math.atan2(dy, dx);
      var thumbX = Math.cos(angle) * clamped;
      var thumbY = Math.sin(angle) * clamped;
      thumb.style.transform =
        "translate(calc(-50% + " + thumbX + "px), calc(-50% + " + thumbY + "px))";

      var nx = dx / radius;
      var ny = dy / radius;
      setDirection("left", nx < -DEADZONE);
      setDirection("right", nx > DEADZONE);
      setDirection("up", ny < -DEADZONE);
      setDirection("down", ny > DEADZONE);
    }

    zone.addEventListener("pointerdown", function (e) {
      if (activePointerId !== null) return; // one finger per stick
      activePointerId = e.pointerId;
      var rect = zone.getBoundingClientRect();
      center.x = rect.left + rect.width / 2;
      center.y = rect.top + rect.height / 2;
      radius = rect.width / 2;
      zone.setPointerCapture(e.pointerId);
      updateFromPoint(e.clientX, e.clientY);
      e.preventDefault();
    });

    zone.addEventListener("pointermove", function (e) {
      if (e.pointerId !== activePointerId) return;
      updateFromPoint(e.clientX, e.clientY);
      e.preventDefault();
    });

    function endTouch(e) {
      if (e.pointerId !== activePointerId) return;
      activePointerId = null;
      resetAll();
    }
    zone.addEventListener("pointerup", endTouch);
    zone.addEventListener("pointercancel", endTouch);

    if (dashBtn) {
      dashBtn.addEventListener("pointerdown", function (e) {
        fireKey("keydown", cfg.keys.dash);
        e.preventDefault();
      });
      var releaseDash = function () {
        fireKey("keyup", cfg.keys.dash);
      };
      dashBtn.addEventListener("pointerup", releaseDash);
      dashBtn.addEventListener("pointercancel", releaseDash);
      dashBtn.addEventListener("pointerleave", releaseDash);
    }

    // If the game window loses focus mid-touch (pause overlay, etc.),
    // release every held key so movement doesn't stick.
    window.addEventListener("blur", resetAll);
  }

  document.addEventListener("DOMContentLoaded", function () {
    STICKS.forEach(setupStick);
  });
})();
