# ARCADIA 2.0 — Phase 3D: Comprehensive Manual QA Checklist

**Document Version:** 1.0  
**Target Release:** ARCADIA 2.0 Platform (Phases 1, 2A–2C, 3A–3C)  
**Execution Date:** ____________________  
**Tester Name / Device:** ____________________  
**Browser(s) Tested:** [ ] Chrome / Edge  [ ] Firefox  [ ] Safari / iOS  [ ] Android Chrome  

---

## 0. Automated vs. Manual Testing Status

Before starting manual verification, note the distinction between what has been automated and what requires human browser testing:

| Test Category | Automated Tests Status | Manual QA Status |
| :--- | :---: | :---: |
| **Phase 2C Leaderboards** | **6 / 6 Passed** (`test_phase2c.js`) | Pending Manual Verification |
| **Phase 3A Progression Engine** | **62 / 62 Passed** (`test_phase3a.js`) | Pending Manual Verification |
| **Phase 3B Profile Modal & Badges** | **49 / 49 Passed** (`test_phase3b.js`) | Pending Manual Verification |
| **Phase 3B Integration Audit** | **30 / 30 Passed** (`test_phase3b_integration_audit.js`) | Pending Manual Verification |
| **Phase 3C Cloud Sync & Storage** | **13 / 13 Passed** (`test_phase3c.js`) | Pending Manual Verification |
| **Phase 3C Security Rule Simulation** | **20 / 20 Passed** (`test_security_review.js`) | Pending Manual Verification |
| **10 Real Canvas Gameplays** | *N/A (Browser event loop required)* | **Pending Manual Verification** |
| **Visual Layout & Mobile Touch** | *N/A (Visual/hardware rendering)* | **Pending Manual Verification** |
| **Live Network Disconnect/Reconnect** | *N/A (Physical network stack)* | **Pending Manual Verification** |

> [!IMPORTANT]
> **Strict Rule**: Automated test passes do **not** replace real human manual interaction. Do not check off any item in this document until you have actually performed the steps in a live browser.

---

## Preflight: Local Test Environment Setup

1. **Start Local HTTP Server**:  
   Do not open files via `file:///` protocol (which restricts `localStorage` and module/script origins in some browsers). Run a local server from the project root:
   ```bash
   # From C:\Users\Admin\Desktop\Arcadia
   npx serve public -p 8000
   # OR using Python
   python -m http.server 8000 --directory public
   ```
2. **Open Browser DevTools**:
   - Press `F12` or `Ctrl+Shift+I`.
   - Keep the **Console** tab visible to monitor for runtime errors or warnings.
   - Keep the **Application > Local Storage** tab visible to inspect keys (`arcadia_guest_progression`, `arcadia_user_cache_*`, `arcadia_sync_queue_*`).

---

## Section 1: All 10 Games Manual Gameplay & Exit Testing

For each game, verify:
- Page loads cleanly without 404s or console errors.
- Game canvas / board renders properly.
- Gameplay controls respond (keyboard, mouse, or touch).
- Reaching a game over, win, or match completion triggers scoring and XP awards.
- "Back to ARCADIA" button is visible, clickable, and does not interfere with game inputs.

---

### Game 1: Ping Pong
- **Route:** `games/ping-pong/index.html` (starts match in `ping-pong.html` or inline)
- **Primary Mechanic:** 2-player local table tennis showdown.
- **Scoring / Metric:** Winning score margin (`Math.abs(p1 - p2)`).
- **Target Achievements:** `first_steps` (1st session), `pp_shutout` (margin >= 7).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1.1 | Open `http://localhost:8000/games/ping-pong/index.html` | Start menu loads with light/dark table controls. No console errors. | | [ ] Pass<br>[ ] Fail |
| 1.2 | Start match; play with `W/S` and `Up/Down` keys | Paddles move fluidly, ball bounces with sound effects. | | [ ] Pass<br>[ ] Fail |
| 1.3 | Win match with a margin of at least 7 points (e.g. 7-0) | In-game notification toast displays: `Achievement Unlocked! Shutout Showdown (+100 XP)` followed by XP award. | | [ ] Pass<br>[ ] Fail |
| 1.4 | Click "Back to ARCADIA" button (bottom-right) | Returns immediately to arcade portal (`index.html`). | | [ ] Pass<br>[ ] Fail |

---

### Game 2: Balloon Blast
- **Route:** `games/balloon-blast/index.html` -> `game.html`
- **Primary Mechanic:** Pop rising balloons, dodge bombs, take down boss.
- **Scoring / Metric:** High score based on pops and combos.
- **Target Achievements:** `first_steps`, `bb_popper` (score >= 500), `bb_master` (score >= 2500).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 2.1 | Open `http://localhost:8000/games/balloon-blast/index.html` and click Play | `game.html` loads cleanly. Canvas renders balloon spawner and timer. | | [ ] Pass<br>[ ] Fail |
| 2.2 | Click/tap balloons to pop them; score points until game over | Sound effects trigger on pop; score updates in real-time. | | [ ] Pass<br>[ ] Fail |
| 2.3 | Trigger Game Over with score > 500 | In-game notification appears: `+40 XP Earned` (or higher) and badge unlock if score >= 500. | | [ ] Pass<br>[ ] Fail |
| 2.4 | Click "Back to ARCADIA" button | Navigates back to portal homepage cleanly. | | [ ] Pass<br>[ ] Fail |

---

### Game 3: Memory Card
- **Route:** `games/memory-card/index.html` -> `game.html`
- **Primary Mechanic:** Card flipping and pair matching.
- **Scoring / Metric:** Completion score (speed + accuracy).
- **Target Achievements:** `mc_fast` / `mc_memory` (score >= 1200).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 3.1 | Open `http://localhost:8000/games/memory-card/index.html` | Menu options render (Play, Friends Mode, Settings, Rules). | | [ ] Pass<br>[ ] Fail |
| 3.2 | Start game; click cards to reveal and match pairs | Cards flip smoothly; matches remain face up; mismatches flip back. | | [ ] Pass<br>[ ] Fail |
| 3.3 | Complete the grid of cards | Win screen appears; score submitted; progression toast appears with XP. | | [ ] Pass<br>[ ] Fail |
| 3.4 | Click "Back to ARCADIA" button | Returns to arcade hub. | | [ ] Pass<br>[ ] Fail |

---

### Game 4: Paint Tag Arena
- **Route:** `games/paint-tag-arena/index.html`
- **Primary Mechanic:** Dash, shield, and splatter arena chase.
- **Scoring / Metric:** Number of tags completed in round.
- **Target Achievements:** `pta_tagger` (tag count >= 5).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 4.1 | Open `http://localhost:8000/games/paint-tag-arena/index.html` | Arena canvas initializes with player and bot entities. | | [ ] Pass<br>[ ] Fail |
| 4.2 | Use arrow/WASD keys to tag bots; use Space to dash | Dash cooldown works; paint splatters appear on contact. | | [ ] Pass<br>[ ] Fail |
| 4.3 | Complete match with at least 1 tag | Match summary displays; in-game toast shows `+20 XP` or higher. | | [ ] Pass<br>[ ] Fail |
| 4.4 | Click "Back to ARCADIA" button | Returns to portal homepage without residual sound or canvas loops. | | [ ] Pass<br>[ ] Fail |

---

### Game 5: Candyland Tic-Tac-Toe
- **Route:** `games/tic-tac-toe-candyland/index.html` -> `game.html`
- **Primary Mechanic:** Turn-based 3x3 candy-themed grid against AI or friend.
- **Scoring / Metric:** Consecutive win streak.
- **Target Achievements:** `ttt_sweet` (win streak >= 3).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 5.1 | Open `http://localhost:8000/games/tic-tac-toe-candyland/index.html` | Candy theme assets load; Mode selection (vs AI / 2 Player) displays. | | [ ] Pass<br>[ ] Fail |
| 5.2 | Play rounds against Easy AI; win 3 games in a row | Consecutive win streak reaches 3; win sound plays. | | [ ] Pass<br>[ ] Fail |
| 5.3 | Observe progression toast on 3rd win | Toast appears: `Achievement Unlocked! Sweet Victory (+70 XP)`. | | [ ] Pass<br>[ ] Fail |
| 5.4 | Click "Back to ARCADIA" button | Returns to portal. | | [ ] Pass<br>[ ] Fail |

---

### Game 6: Fruit Slash
- **Route:** `games/fruit-slash/index.html`
- **Primary Mechanic:** Fruit slicing mouse/finger drag in Survival or Time Attack mode.
- **Scoring / Metric:** Fruits sliced / combos (Survival vs Time Attack).
- **Target Achievements:** `fs_survivor` (score >= 200), `fs_timecut` (score >= 150).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 6.1 | Open `http://localhost:8000/games/fruit-slash/index.html` | Start screen displays with Mode selector (Classic/Survival, Time Attack). | | [ ] Pass<br>[ ] Fail |
| 6.2 | Select Survival Mode; drag/swipe cursor to slice fruits | Blade trail renders smoothly; combo counter increments. | | [ ] Pass<br>[ ] Fail |
| 6.3 | Reach Game Over (hit 3 bombs or drop 3 fruits) | Game Over screen displays; verifies score submitted to `fruit-slash-survival`. | | [ ] Pass<br>[ ] Fail |
| 6.4 | Play Time Attack Mode; reach time expiration with score > 150 | Verifies score submitted to `fruit-slash-time-attack`; toast appears for `fs_timecut`. | | [ ] Pass<br>[ ] Fail |
| 6.5 | Click "Back to ARCADIA" button | Returns to portal homepage cleanly. | | [ ] Pass<br>[ ] Fail |

---

### Game 7: Superman Swing
- **Route:** `games/superman-swing/index.html`
- **Primary Mechanic:** Physics grapple-and-swing momentum game.
- **Scoring / Metric:** Distance / obstacles cleared.
- **Target Achievements:** `ss_flyer` (score >= 15).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 7.1 | Open `http://localhost:8000/games/superman-swing/index.html` | Physics canvas initializes with skyline background. | | [ ] Pass<br>[ ] Fail |
| 7.2 | Click/tap to shoot grapple rope; release to launch | Momentum physics and swing arc work correctly. | | [ ] Pass<br>[ ] Fail |
| 7.3 | Crash or land with score > 3 | Game over screen shows score; progression toast shows earned XP. | | [ ] Pass<br>[ ] Fail |
| 7.4 | Click "Back to ARCADIA" button | Returns to portal homepage. | | [ ] Pass<br>[ ] Fail |

---

### Game 8: Outbound
- **Route:** `games/outbound/index.html` -> `game.html`
- **Primary Mechanic:** Asteroid navigation and shield dodging.
- **Scoring / Metric:** Wave/distance survived.
- **Target Achievements:** `ob_pilot` (score >= 5).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 8.1 | Open `http://localhost:8000/games/outbound/index.html` and launch game | Space field canvas renders; ship responds to mouse/touch/keys. | | [ ] Pass<br>[ ] Fail |
| 8.2 | Dodge obstacles and survive at least 5 waves | Wave counter updates; ship shield effects trigger. | | [ ] Pass<br>[ ] Fail |
| 8.3 | Trigger Game Over (deplete hull shields) | Score submitted; in-game toast displays `ob_pilot` unlock or XP. | | [ ] Pass<br>[ ] Fail |
| 8.4 | Click "Back to ARCADIA" button | Returns to arcade portal. | | [ ] Pass<br>[ ] Fail |

---

### Game 9: Gravity Run
- **Route:** `games/gravity-run/index.html`
- **Primary Mechanic:** Side-scrolling runner with gravity inversion.
- **Scoring / Metric:** Rounds won / distance run.
- **Target Achievements:** `gr_dino` (rounds won >= 2).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 9.1 | Open `http://localhost:8000/games/gravity-run/index.html` | Runner canvas initializes; dinosaur character renders. | | [ ] Pass<br>[ ] Fail |
| 9.2 | Tap Space/screen to invert gravity; dodge obstacles | Dino smoothly switches between ceiling and floor. | | [ ] Pass<br>[ ] Fail |
| 9.3 | Complete at least 2 rounds | Match end screen appears; toast displays `gr_dino` unlock. | | [ ] Pass<br>[ ] Fail |
| 9.4 | Click "Back to ARCADIA" button | Returns to arcade portal. | | [ ] Pass<br>[ ] Fail |

---

### Game 10: Tank Wars
- **Route:** `games/tank-wars/index.html`
- **Primary Mechanic:** 2-player local ballistic tank combat.
- **Scoring / Metric:** Local match victory (isolated from public cloud leaderboard).
- **Target Achievements:** `tw_tactician` (completed battle session).

| Step | Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 10.1 | Open `http://localhost:8000/games/tank-wars/index.html` | Terrain generator builds battle landscape; tanks placed. | | [ ] Pass<br>[ ] Fail |
| 10.2 | Adjust angle and power; fire shells until one tank is destroyed | Explosion effects and damage modeling trigger. | | [ ] Pass<br>[ ] Fail |
| 10.3 | Observe progression toast on match end | Toast displays `+70 XP Earned` and `Tank Wars Tactician` achievement. | | [ ] Pass<br>[ ] Fail |
| 10.4 | Verify no live network request to `/scores/` in DevTools Network tab | Confirmed: Tank Wars is marked `isLocalOnly` and writes strictly to local progression. | | [ ] Pass<br>[ ] Fail |
| 10.5 | Click "Back to ARCADIA" button | Returns to portal homepage. | | [ ] Pass<br>[ ] Fail |

---

## Section 2: Shared Navigation Shell ("Back to ARCADIA" Button)

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 2.1 | Visual Appearance | Open any game on desktop (e.g. `ping-pong`). | Floating pill button `#arcadia-shell-btn` is visible in bottom-right corner with 🏠 icon and "ARCADIA" text. | | [ ] Pass<br>[ ] Fail |
| 2.2 | Mobile Viewport (<480px) | Open DevTools device emulator (iPhone/Pixel); inspect button. | Button scales down slightly (font-size 12px, 8px padding), stays at bottom-right, meets 44x44px minimum touch target. | | [ ] Pass<br>[ ] Fail |
| 2.3 | Input Isolation | Click or tap the "Back to ARCADIA" button while pointer is over an active game canvas. | Button navigates back to portal; does NOT trigger canvas weapon firing, paddle jumps, or game inputs. | | [ ] Pass<br>[ ] Fail |
| 2.4 | Idempotency | Inspect DOM in DevTools Elements tab on any game page. | Exactly one `<a id="arcadia-shell-btn">` and one `<style id="arcadia-shell-style">` exists. No duplicates. | | [ ] Pass<br>[ ] Fail |
| 2.5 | Keyboard Accessibility | In game, press `Tab` until `#arcadia-shell-btn` receives focus. Press `Enter`. | White outline focus ring appears around button; pressing `Enter` returns to portal. | | [ ] Pass<br>[ ] Fail |

---

## Section 3: Player Profile Modal & Progression UI

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 3.1 | Guest Avatar & Open Modal | On portal homepage as an unauthenticated guest, click the navbar avatar (`#nav-avatar`). | Profile modal `#profile-modal` opens with smooth transition. Focus moves to close button. | | [ ] Pass<br>[ ] Fail |
| 3.2 | Guest Identity Display | Inspect header card in profile modal. | Displays `🎮 Guest Player`, amber status dot with "Local Profile", and "Sign In / Register to Save Progress" button. | | [ ] Pass<br>[ ] Fail |
| 3.3 | XP & Level Progress Bar | Inspect XP card in modal. | Displays Lifetime XP, current Level, Next Level target, and a green progress fill bar matching `aria-valuenow`. | | [ ] Pass<br>[ ] Fail |
| 3.4 | Statistics Grid | Inspect stats card in modal. | Displays accurate counts for: Sessions Played, Games Explored (e.g. `3 / 10`), Favorite Game, and Today's XP earned. | | [ ] Pass<br>[ ] Fail |
| 3.5 | 18 Achievements Gallery | Scroll to bottom of profile modal. | All 18 achievements from the Phase 3A catalog are listed with icons, titles, and descriptions. | | [ ] Pass<br>[ ] Fail |
| 3.6 | Achievement Filter Tabs | Click "Unlocked" tab, then "Locked" tab, then "All" tab. | Counts update correctly (e.g. Unlocked: 2, Locked: 16); list filters dynamically without layout shift. | | [ ] Pass<br>[ ] Fail |
| 3.7 | Close Modal via Escape | Press `Escape` key while profile modal is open. | Modal closes smoothly; focus returns to `#nav-avatar`. | | [ ] Pass<br>[ ] Fail |
| 3.8 | Close Modal via Backdrop | Open modal; click outside panel on `#profile-modal-backdrop`. | Modal closes immediately. | | [ ] Pass<br>[ ] Fail |

---

## Section 4: Progression System, Real Gameplay XP Awards & Notifications

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 4.1 | In-Game Progression Toast | Play any game to completion (e.g. pop balloons in Balloon Blast). | Floating toast appears at top-center of game screen: icon + `+40 XP Earned` + `Total: 40 XP`. Dissolves after 3.5s. | | [ ] Pass<br>[ ] Fail |
| 4.2 | In-Game Level-Up Toast | Earn enough XP to cross 300 XP (Level 2). | Gold star toast appears: `LEVEL UP! Level 2` with subtitle `Keep playing to reach higher ranks!`. | | [ ] Pass<br>[ ] Fail |
| 4.3 | Notification Separation | Check portal homepage after returning from game. | No residual game toasts appear on portal homepage (game toasts are isolated to `arcadia-shell.js` in games). | | [ ] Pass<br>[ ] Fail |
| 4.4 | Cooldown Anti-Abuse Check | Rapidly submit two game sessions within 10 seconds. | Second submission is clamped (awards 0 XP) to prevent automated script spam. | | [ ] Pass<br>[ ] Fail |
| 4.5 | Daily XP Budget Cap | Inspect `daily.remainingXp` in DevTools console via `Arcadia.progression.getProfile()`. | Verifies maximum daily XP limit (2,500 XP) prevents runaway XP farming in a 24-hour period. | | [ ] Pass<br>[ ] Fail |

---

## Section 5: Authentication Lifecycle & Integration

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 5.1 | Unconfigured Warning | Open portal with dummy/unconfigured Firebase keys in `firebase-config.js`. Click "Log In". | Shows friendly note: "Cloud features aren't set up yet" or disabled auth modal. Does not crash website. | | [ ] Pass<br>[ ] Fail |
| 5.2 | Sign Up Flow (Configured) | In Auth Modal, switch to "Sign Up" tab. Enter Display Name, Email, Password (min 6 chars). Submit. | Account created; navbar button updates to "Log Out"; navbar avatar updates to user's first initial. | | [ ] Pass<br>[ ] Fail |
| 5.3 | Profile Modal Authenticated | Open profile modal while signed in. | Header card displays user's Display Name, green status dot ("Cloud Account"), and "Log Out" action. | | [ ] Pass<br>[ ] Fail |
| 5.4 | Log Out Flow | Click "Log Out" in navbar or inside profile modal. | User signed out; navbar button reverts to "Log In"; avatar reverts to `🎮`; profile modal closes. | | [ ] Pass<br>[ ] Fail |
| 5.5 | Guest Progression Preservation on Logout | Check local progression immediately after logout. | Guest progression (`arcadia_guest_progression`) is intact and visible; user cache remains safely separated. | | [ ] Pass<br>[ ] Fail |

---

## Section 6: Guest Progression, Migration Dialog & Cloud Sync

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 6.1 | Trigger Migration Modal | 1. As guest, play 2 games so local XP > 0.<br>2. Click "Log In" and sign into an existing/new account. | `#migration-modal` automatically appears with "Sync Your Progress" title and side-by-side cards. | | [ ] Pass<br>[ ] Fail |
| 6.2 | Migration Comparison Display | Inspect values in `#migration-modal`. | Guest Card shows local XP & badges; Cloud Card shows account XP; Result Card shows merged outcome. | | [ ] Pass<br>[ ] Fail |
| 6.3 | Option A: "Decide Later" | Click "Decide Later" or close button. | Modal closes; guest data is untouched; user remains signed in with their account profile. | | [ ] Pass<br>[ ] Fail |
| 6.4 | Option B: "Keep Cloud Only" | Re-trigger modal on next login; click "Keep Cloud Only". | Modal closes; sets `arcadia_migration_dismissed_{uid}`; user uses cloud profile; guest data untouched. | | [ ] Pass<br>[ ] Fail |
| 6.5 | Option C: "Merge & Sync to Cloud" | Re-trigger modal; click "Merge & Sync to Cloud". | 1. Creates `arcadia_guest_backup_{timestamp}` in localStorage.<br>2. Merges XP using high-water mark.<br>3. Saves to Firestore `progression/{uid}`.<br>4. Shows success toast and updates profile UI. | | [ ] Pass<br>[ ] Fail |

---

## Section 7: Offline Behavior & Retry Queue

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 7.1 | Offline Gameplay | 1. Sign in.<br>2. In DevTools Network tab, set throttling to **Offline**.<br>3. Play a game session to completion. | Game completes smoothly; in-game toast awards XP locally; no unhandled promise rejections. | | [ ] Pass<br>[ ] Fail |
| 7.2 | Inspect Offline Queue | In DevTools Application > Local Storage, inspect `arcadia_sync_queue_{uid}`. | Contains pending sync payload with updated XP, level, and timestamp. | | [ ] Pass<br>[ ] Fail |
| 7.3 | Reconnect & Auto-Drain | Switch DevTools Network back to **Online**. | `online` event fires; `drainSyncQueue()` executes; queue is emptied; cloud receives latest progression. | | [ ] Pass<br>[ ] Fail |

---

## Section 8: Leaderboards & Per-Game Scoring Flows

| Test ID | Test Description | Steps | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 8.1 | Leaderboard Tab Switching | On portal homepage, scroll to Leaderboard section. Click different game tabs (Ping Pong, Balloon Blast, Fruit Slash, etc.). | Tab highlights; leaderboard panel updates to show scores for selected game without full page reload. | | [ ] Pass<br>[ ] Fail |
| 8.2 | Overall Leaderboard | Click "All Games" / Overall Leaderboard tab. | Displays top scores across all games, tagged with the game slug they were set in. | | [ ] Pass<br>[ ] Fail |
| 8.3 | Score Submission on Win | Sign in; play Ping Pong and win with margin 11. Return to homepage. | Leaderboard panel updates with player's display name, score 11, and "Ping Pong" badge. | | [ ] Pass<br>[ ] Fail |
| 8.4 | Monotonic Score Invariant | Play Ping Pong again, winning with a lower margin of 3. Return to homepage. | Player's recorded score remains at 11; lower score does not overwrite personal best. | | [ ] Pass<br>[ ] Fail |

---

## Section 9: Browser Console Errors & Runtime Risk Inspection Matrix

Open DevTools Console on each test and check against this risk matrix:

| Runtime Risk | Root Cause / Warning Sign | Where to Inspect | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **CORS / Module Loading Failure** | Using `file:///` protocol instead of `http://localhost:8000` | Browser Console | No `Access-Control-Allow-Origin` or `Failed to fetch` errors. |
| **Third-Party Firebase Blocked** | Adblocker or strict CSP blocking `gstatic.com/firebasejs/*` | Network Tab | `arcadia-cloud.js` falls back gracefully to `configured = false` without crashing games. |
| **Canvas Input Stealing** | Global `pointerdown` listener intercepting `#arcadia-shell-btn` | Bottom-right button | Clicking the button never causes paddles, tanks, or ships to fire or jump. |
| **Uncaught Promise Rejections** | Firestore offline write rejection without catch | Console errors | Network failure logs a caught warning (`[Arcadia] saveCloudProgression failed: ...`) and queues data locally. |
| **Memory Leak / Interval Accumulation** | Polling loops failing to clear when DOM unloads | Performance Tab | `setupProgressionNotifications()` clears interval after 30 attempts or on successful attach. |
| **Firestore Composite Index Missing** | Querying `scores` by `gameSlug` + `score` without index | Console | If index error occurs, `arcadia-cloud.js` catches it and logs friendly guidance with index URL. |

---

## Section 10: Mirrored Files Parity Verification

ARCADIA maintains strict parity between root files and `public/` files. Run the following PowerShell command in your terminal to verify 100% exact character-level parity before concluding QA:

```powershell
$files = @(
  @('public\css\style.css', 'css\style.css'),
  @('public\js\arcadia-cloud.js', 'js\arcadia-cloud.js'),
  @('public\js\arcadia-progression.js', 'js\arcadia-progression.js'),
  @('public\js\arcadia-profile.js', 'js\arcadia-profile.js'),
  @('public\js\arcadia-sync.js', 'js\arcadia-sync.js'),
  @('public\js\arcadia-shell.js', 'js\arcadia-shell.js'),
  @('public\js\main.js', 'js\main.js'),
  @('public\js\auth-ui.js', 'js\auth-ui.js')
);
foreach ($pair in $files) {
  $f1 = $pair[0]; $f2 = $pair[1];
  $res = & fc.exe $f1 $f2
  if ($LASTEXITCODE -ne 0) {
    Write-Host "MISMATCH: $f1 and $f2" -ForegroundColor Red
  } else {
    Write-Host "OK: $f1 and $f2" -ForegroundColor Green
  }
}
```

**Expected Output:** All 8 pairs report `OK: ...`.

---

## Highest-Priority Issues for Immediate Human Verification

When performing this manual QA, pay immediate attention to these top 3 areas:

1. **In-Game Button Hitboxes vs. Game Canvases (Section 2.3)**:
   - Test `fruit-slash` and `superman-swing` on touch / mobile viewports.
   - Verify swiping or clicking near the bottom-right corner does not accidentally activate the "Back to ARCADIA" button during intense play.
2. **Guest-to-Cloud Migration Confirmation (Section 6.1 - 6.5)**:
   - Verify that logging in with guest progress **never** silently wipes guest data. The modal **must** appear and require user choice.
   - Verify that selecting "Merge & Sync to Cloud" generates an archival snapshot in `localStorage.getItem('arcadia_guest_backup_...')`.
3. **Offline Queue Reconnection (Section 7.1 - 7.3)**:
   - Simulate a network disconnect in DevTools while playing `balloon-blast` or `ping-pong`.
   - Verify XP awards immediately in the local UI, queues in `arcadia_sync_queue_{uid}`, and drains seamlessly to Firestore when the network reconnects.

---

*Checklist prepared by Antigravity Engineering for ARCADIA 2.0 Phase 3D.*
