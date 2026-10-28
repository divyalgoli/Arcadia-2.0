/**
 * ARCADIA 2.0 — Shared Navigation Shell
 * Provides a consistent, accessible "Back to ARCADIA" button across all games.
 * Dependency-free, self-contained, and safe for desktop and mobile viewports.
 */
(function () {
  'use strict';

  var BUTTON_ID = 'arcadia-shell-btn';
  var STYLE_ID = 'arcadia-shell-style';

  function init() {
    // Idempotency: avoid injecting duplicate button if script is loaded multiple times
    if (document.getElementById(BUTTON_ID)) return;

    // Inject inline styles
    if (!document.getElementById(STYLE_ID)) {
      var CSS = [
        '#' + BUTTON_ID + ' {',
        '  position: fixed;',
        '  bottom: 16px;',
        '  right: 16px;',
        '  z-index: 99999;',
        '  display: inline-flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  gap: 6px;',
        '  padding: 8px 14px;',
        '  border-radius: 24px;',
        '  background: rgba(18, 22, 34, 0.85);',
        '  color: #ffffff;',
        '  border: 1px solid rgba(255, 255, 255, 0.22);',
        '  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
        '  font-size: 13px;',
        '  font-weight: 600;',
        '  line-height: 1;',
        '  text-decoration: none;',
        '  letter-spacing: 0.04em;',
        '  opacity: 0.85;',
        '  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;',
        '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);',
        '  min-width: 44px;',
        '  min-height: 44px;', /* WCAG 2.5.5 recommended minimum touch target */
        '  box-sizing: border-box;',
        '  pointer-events: auto;',
        '  cursor: pointer;',
        '  user-select: none;',
        '  -webkit-user-select: none;',
        '  backdrop-filter: blur(6px);',
        '  -webkit-backdrop-filter: blur(6px);',
        '}',
        '#' + BUTTON_ID + ':hover, #' + BUTTON_ID + ':focus-visible {',
        '  opacity: 1;',
        '  background: rgba(26, 32, 48, 0.95);',
        '  transform: translateY(-1px);',
        '  outline: 2px solid #ffffff;',
        '  outline-offset: 2px;',
        '}',
        '#' + BUTTON_ID + ':active {',
        '  transform: translateY(1px);',
        '}',
        '@media (max-width: 480px) {',
        '  #' + BUTTON_ID + ' {',
        '    bottom: 12px;',
        '    right: 12px;',
        '    padding: 8px 12px;',
        '    font-size: 12px;',
        '  }',
        '}',
        '@media (prefers-reduced-motion: reduce) {',
        '  #' + BUTTON_ID + ' { transition: none; }',
        '}'
      ].join('\n');

      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    var btn = document.createElement('a');
    btn.id = BUTTON_ID;
    btn.href = (window.ARCADIA_PORTAL_URL || '../../index.html');
    btn.setAttribute('aria-label', 'Return to Arcadia');
    btn.setAttribute('title', 'Return to Arcadia');
    btn.innerHTML = '<span aria-hidden="true" style="font-size:14px;line-height:1;">🏠</span> ARCADIA';

    // Prevent interactions on this button from propagating to underlying game canvases/listeners
    var stopProp = function (e) {
      e.stopPropagation();
    };
    btn.addEventListener('pointerdown', stopProp);
    btn.addEventListener('touchstart', stopProp, { passive: true });
    btn.addEventListener('mousedown', stopProp);
    btn.addEventListener('click', stopProp);

    document.body.appendChild(btn);

    // Setup in-game progression notification listener
    setupProgressionNotifications();
  }

  function showInGameToast(icon, title, sub) {
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position: fixed;',
      'top: 16px;',
      'left: 50%;',
      'transform: translateX(-50%);',
      'z-index: 999999;',
      'background: rgba(18, 24, 38, 0.92);',
      'border: 1px solid rgba(255, 255, 255, 0.25);',
      'border-radius: 999px;',
      'box-shadow: 0 8px 24px rgba(0,0,0,0.45);',
      'color: #ffffff;',
      'padding: 8px 18px;',
      'display: flex;',
      'align-items: center;',
      'gap: 10px;',
      'font-family: system-ui, -apple-system, sans-serif;',
      'font-size: 13px;',
      'pointer-events: none;',
      'opacity: 0;',
      'transition: opacity 0.25s ease, transform 0.25s ease;',
      'backdrop-filter: blur(8px);'
    ].join('');

    toast.innerHTML = '<span style="font-size:18px;line-height:1;">' + icon + '</span>' +
      '<div><strong style="color:#69B9FF;display:block;line-height:1.2;">' + title + '</strong>' +
      '<span style="font-size:11.5px;color:rgba(255,255,255,0.75);line-height:1.2;">' + sub + '</span></div>';

    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(4px)';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-6px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  function setupProgressionNotifications() {
    function tryAttach() {
      if (window.ArcadiaProgression && typeof window.ArcadiaProgression.onProgressionChange === 'function') {
        window.ArcadiaProgression.onProgressionChange(function (evt) {
          if (!evt) return;
          var title = '';
          var sub = '';
          var icon = '⚡';

          if (evt.isLevelUp) {
            icon = '⭐';
            title = 'LEVEL UP! Level ' + evt.level;
            sub = 'Keep playing to reach higher ranks!';
          } else if (Array.isArray(evt.unlockedAchievements) && evt.unlockedAchievements.length > 0) {
            icon = evt.unlockedAchievements[0].icon || '🏆';
            title = 'Achievement Unlocked!';
            sub = evt.unlockedAchievements[0].title + ' (+' + (evt.unlockedAchievements[0].xpReward || 0) + ' XP)';
          } else if (evt.xpEarned > 0) {
            icon = '⚡';
            title = '+' + evt.xpEarned + ' XP Earned';
            sub = 'Total: ' + (evt.newTotalXp || 0) + ' XP';
          } else {
            return;
          }

          showInGameToast(icon, title, sub);
        });
        return true;
      }
      return false;
    }

    if (!tryAttach()) {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (tryAttach() || attempts >= 30) {
          clearInterval(interval);
        }
      }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
