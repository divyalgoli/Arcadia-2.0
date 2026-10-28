// collision.js
// Pure, reusable collision-resolution functions. No player/game state is
// stored here — everything operates on the rects/players passed in.

// Uses rectsIntersect, rectOverlap, clamp from utils.js (loaded earlier as a
// plain script, so these are already available in the shared global scope).

/**
 * Resolves collision between a moving player and the arena's outer bounds,
 * clamping the player's position to stay inside.
 */
function resolveArenaBounds(player, arena) {
  player.x = clamp(player.x, 0, arena.width - player.width);
  player.y = clamp(player.y, 0, arena.height - player.height);
}

/**
 * Resolves collision between a player and a list of static wall/obstacle
 * rects. Uses minimum-translation-vector push-out so the player slides
 * along walls instead of stopping dead.
 */
function resolveStaticCollisions(player, staticRects) {
  const playerBounds = player.getBounds();

  for (const rect of staticRects) {
    if (!rectsIntersect(playerBounds, rect)) continue;

    const { overlapX, overlapY } = rectOverlap(playerBounds, rect);

    // Push out along the axis with the smaller overlap — this produces
    // natural "sliding" behavior along walls instead of a hard stop.
    if (overlapX < overlapY) {
      const pushDir = playerBounds.x < rect.x ? -1 : 1;
      player.x += overlapX * pushDir;
      player.velocity.x = 0;
    } else {
      const pushDir = playerBounds.y < rect.y ? -1 : 1;
      player.y += overlapY * pushDir;
      player.velocity.y = 0;
    }

    // Keep bounds in sync for subsequent rects in this same pass.
    playerBounds.x = player.x;
    playerBounds.y = player.y;
  }
}

/**
 * Resolves collision between two players by pushing them apart evenly
 * along the axis of least overlap, preventing clipping through each other.
 */
function resolvePlayerCollision(playerA, playerB) {
  const a = playerA.getBounds();
  const b = playerB.getBounds();

  if (!rectsIntersect(a, b)) return;

  const { overlapX, overlapY } = rectOverlap(a, b);

  if (overlapX < overlapY) {
    const pushAmount = overlapX / 2;
    const dir = a.x < b.x ? -1 : 1;
    playerA.x += pushAmount * dir;
    playerB.x -= pushAmount * dir;
  } else {
    const pushAmount = overlapY / 2;
    const dir = a.y < b.y ? -1 : 1;
    playerA.y += pushAmount * dir;
    playerB.y -= pushAmount * dir;
  }
}

/**
 * Runs the full collision pipeline for a single player against the arena,
 * static geometry, and the other player. Call once per player per frame,
 * after movement integration.
 */
function resolveAllCollisions(player, otherPlayer, arena, staticRects) {
  resolveStaticCollisions(player, staticRects);
  resolveArenaBounds(player, arena);
  resolvePlayerCollision(player, otherPlayer);
  // Re-clamp to arena bounds in case the player-vs-player push moved us
  // outside the arena (can happen near corners).
  resolveArenaBounds(player, arena);
}

/**
 * Resolves ONLY environment collisions (walls, obstacles, arena bounds) for
 * a single player — no player-vs-player push-apart. Used by game.js so it
 * can check for a tag while the two players are still allowed to overlap,
 * before physically separating them.
 */
function resolveEnvironmentCollisions(player, arena, staticRects) {
  resolveStaticCollisions(player, staticRects);
  resolveArenaBounds(player, arena);
}

/**
 * Checks whether the current tagger has tagged the current runner.
 * Returns the runner-catching boolean via player.checkTag, but centralizes
 * the "who is tagger / who is runner" lookup here so game.js stays simple.
 */
function checkTagCollision(playerA, playerB, safeZones) {
  if (playerA.checkTag(playerB, safeZones)) return { tagger: playerA, runner: playerB };
  if (playerB.checkTag(playerA, safeZones)) return { tagger: playerB, runner: playerA };
  return null;
}

/**
 * Returns true if the given point falls within any safe zone's radius.
 * Safe zones sit over spawn points and protect a freshly-spawned player
 * from being tagged the instant the round starts.
 */
function isInsideSafeZone(x, y, safeZones) {
  if (!safeZones || safeZones.length === 0) return false;
  return safeZones.some((zone) => distance(x, y, zone.x, zone.y) < zone.radius);
}

/**
 * Checks a player's center against every teleport pad's "from" point; if
 * they're standing on one, moves them to its paired "to" point and returns
 * true. Callers should skip this while the player's own teleportCooldown is
 * still ticking, so a two-way portal pair can't bounce them straight back.
 */
function resolveTeleports(player, teleports) {
  if (!teleports || teleports.length === 0) return false;
  const TELEPORT_RADIUS = 28;
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;

  for (const tp of teleports) {
    if (distance(cx, cy, tp.fromX, tp.fromY) < TELEPORT_RADIUS) {
      player.x = tp.toX - player.width / 2;
      player.y = tp.toY - player.height / 2;
      return true;
    }
  }
  return false;
}

/**
 * Checks whether a player's bounds overlap a power-up's circular pickup
 * radius. Used by game.js when scanning for power-up collection.
 */
function checkPowerupCollision(player, powerup) {
  const bounds = player.getBounds();
  const closestX = clamp(powerup.x, bounds.x, bounds.x + bounds.width);
  const closestY = clamp(powerup.y, bounds.y, bounds.y + bounds.height);
  const dx = powerup.x - closestX;
  const dy = powerup.y - closestY;
  return dx * dx + dy * dy < powerup.radius * powerup.radius;
}
