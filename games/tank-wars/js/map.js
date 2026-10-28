/**
 * Map Generator and Collision Renderer for Tank Wars.
 * Features 5 distinct playable maps: Desert Outpost, Snow Base, Jungle Arena, Factory Zone, and Lava Core.
 */
function rand(min, max) {
  return min + Math.random() * (max - min);
}

class ArenaMap {
  static MAP_CONFIGS = {
    desert: {
      id: 'desert',
      name: 'Desert Outpost',
      icon: '🏜️',
      bgColor: '#dfc498',
      gridColor: 'rgba(180, 150, 110, 0.25)',
      wallColor: '#687278',
      crateColor: '#a8733b',
      barrelColor: '#cc0000',
      bushColor: 'rgba(46, 125, 50, 0.85)',
      description: 'Arid military outpost with sand cover and oil barrels.'
    },
    snow: {
      id: 'snow',
      name: 'Snow Base',
      icon: '❄️',
      bgColor: '#d4e6f1',
      gridColor: 'rgba(160, 200, 230, 0.3)',
      wallColor: '#5d6d7e',
      crateColor: '#85929e',
      barrelColor: '#0088cc',
      bushColor: 'rgba(214, 234, 248, 0.9)',
      description: 'Frozen arctic bunker with icy obstacles and cryo barrels.'
    },
    jungle: {
      id: 'jungle',
      name: 'Jungle Arena',
      icon: '🌿',
      bgColor: '#2d4a27',
      gridColor: 'rgba(70, 110, 60, 0.3)',
      wallColor: '#4a3b32',
      crateColor: '#8c6d46',
      barrelColor: '#8800cc',
      bushColor: 'rgba(30, 140, 45, 0.9)',
      description: 'Dense rainforest with destructible foliage and toxic barrels.'
    },
    factory: {
      id: 'factory',
      name: 'Factory Zone',
      icon: '🏭',
      bgColor: '#1c232a',
      gridColor: 'rgba(0, 210, 255, 0.15)',
      wallColor: '#34495e',
      crateColor: '#7f8c8d',
      barrelColor: '#76ff03',
      bushColor: 'rgba(0, 230, 118, 0.4)',
      description: 'High-tech industrial steel grid with radioactive barrels.'
    },
    lava: {
      id: 'lava',
      name: 'Lava Core',
      icon: '🌋',
      bgColor: '#1a0c0c',
      gridColor: 'rgba(255, 60, 0, 0.2)',
      wallColor: '#2c1e21',
      crateColor: '#4a2c2a',
      barrelColor: '#ff6d00',
      bushColor: 'rgba(255, 109, 0, 0.3)',
      description: 'Volcanic ash cavern with magma pools and explosive barrels.'
    }
  };

  constructor(mapId = 'desert', width = 1200, height = 750) {
    this.mapId = mapId;
    this.config = ArenaMap.MAP_CONFIGS[mapId] || ArenaMap.MAP_CONFIGS.desert;
    this.width = width;
    this.height = height;

    this.walls = [];
    this.crates = [];
    this.barrels = [];
    this.trees = [];
    this.sandbags = [];
    this.bushes = [];
    this.decorations = [];

    this.generateMap();
    this._generateTerrainCanvas();
  }

  generateMap() {
    this.walls = [];
    this.crates = [];
    this.barrels = [];
    this.trees = [];
    this.sandbags = [];
    this.bushes = [];
    this.decorations = [];

    const wallThickness = 24;

    // Boundary Outer Walls
    this.walls.push({ x: 0, y: 0, w: this.width, h: wallThickness, type: 'stone' });
    this.walls.push({ x: 0, y: this.height - wallThickness, w: this.width, h: wallThickness, type: 'stone' });
    this.walls.push({ x: 0, y: 0, w: wallThickness, h: this.height, type: 'stone' });
    this.walls.push({ x: this.width - wallThickness, y: 0, w: wallThickness, h: this.height, type: 'stone' });

    // Interior Layout based on selected Map
    if (this.mapId === 'desert') {
      this.buildDesertLayout();
    } else if (this.mapId === 'snow') {
      this.buildSnowLayout();
    } else if (this.mapId === 'jungle') {
      this.buildJungleLayout();
    } else if (this.mapId === 'factory') {
      this.buildFactoryLayout();
    } else {
      this.buildLavaLayout();
    }
  }

  buildDesertLayout() {
    this.walls.push(
      { x: 540, y: 220, w: 120, h: 24, type: 'stone' },
      { x: 540, y: 506, w: 120, h: 24, type: 'stone' },
      { x: 220, y: 150, w: 24, h: 140, type: 'steel' },
      { x: 220, y: 150, w: 120, h: 24, type: 'steel' },
      { x: 956, y: 460, w: 24, h: 140, type: 'steel' },
      { x: 860, y: 576, w: 120, h: 24, type: 'steel' }
    );
    this.crates.push(
      { x: 260, y: 360, w: 40, h: 40, hp: 35, maxHp: 35 },
      { x: 900, y: 340, w: 40, h: 40, hp: 35, maxHp: 35 },
      { x: 580, y: 355, w: 40, h: 40, hp: 35, maxHp: 35 }
    );
    this.barrels.push(
      { x: 600, y: 160, radius: 18, hp: 20 },
      { x: 600, y: 590, radius: 18, hp: 20 },
      { x: 300, y: 240, radius: 18, hp: 20 },
      { x: 880, y: 500, radius: 18, hp: 20 }
    );
    this.bushes.push(
      { x: 180, y: 520, radius: 32 },
      { x: 980, y: 200, radius: 32 }
    );
  }

  buildSnowLayout() {
    this.walls.push(
      { x: 400, y: 180, w: 400, h: 24, type: 'steel' },
      { x: 400, y: 546, w: 400, h: 24, type: 'steel' },
      { x: 300, y: 300, w: 24, h: 150, type: 'stone' },
      { x: 876, y: 300, w: 24, h: 150, type: 'stone' }
    );
    this.crates.push(
      { x: 580, y: 280, w: 40, h: 40, hp: 35, maxHp: 35 },
      { x: 580, y: 430, w: 40, h: 40, hp: 35, maxHp: 35 }
    );
    this.barrels.push(
      { x: 450, y: 375, radius: 18, hp: 20 },
      { x: 750, y: 375, radius: 18, hp: 20 }
    );
    this.trees.push(
      { x: 200, y: 200, radius: 24, hp: 25, maxHp: 25 },
      { x: 1000, y: 550, radius: 24, hp: 25, maxHp: 25 }
    );
  }

  buildJungleLayout() {
    this.walls.push(
      { x: 350, y: 200, w: 24, h: 350, type: 'stone' },
      { x: 826, y: 200, w: 24, h: 350, type: 'stone' },
      { x: 500, y: 360, w: 200, h: 24, type: 'stone' }
    );
    this.trees.push(
      { x: 250, y: 150, radius: 28, hp: 25, maxHp: 25 },
      { x: 950, y: 600, radius: 28, hp: 25, maxHp: 25 },
      { x: 600, y: 220, radius: 28, hp: 25, maxHp: 25 },
      { x: 600, y: 520, radius: 28, hp: 25, maxHp: 25 }
    );
    this.barrels.push(
      { x: 420, y: 375, radius: 18, hp: 20 },
      { x: 780, y: 375, radius: 18, hp: 20 }
    );
    this.bushes.push(
      { x: 200, y: 400, radius: 36 },
      { x: 1000, y: 350, radius: 36 }
    );
  }

  buildFactoryLayout() {
    this.walls.push(
      { x: 280, y: 160, w: 200, h: 24, type: 'steel' },
      { x: 720, y: 160, w: 200, h: 24, type: 'steel' },
      { x: 280, y: 566, w: 200, h: 24, type: 'steel' },
      { x: 720, y: 566, w: 200, h: 24, type: 'steel' },
      { x: 588, y: 300, w: 24, h: 150, type: 'steel' }
    );
    this.crates.push(
      { x: 400, y: 360, w: 40, h: 40, hp: 35, maxHp: 35 },
      { x: 760, y: 360, w: 40, h: 40, hp: 35, maxHp: 35 }
    );
    this.barrels.push(
      { x: 500, y: 220, radius: 18, hp: 20 },
      { x: 700, y: 530, radius: 18, hp: 20 }
    );
  }

  buildLavaLayout() {
    this.walls.push(
      { x: 450, y: 150, w: 300, h: 24, type: 'stone' },
      { x: 450, y: 576, w: 300, h: 24, type: 'stone' },
      { x: 250, y: 350, w: 150, h: 24, type: 'stone' },
      { x: 800, y: 350, w: 150, h: 24, type: 'stone' }
    );
    this.barrels.push(
      { x: 600, y: 375, radius: 20, hp: 20 },
      { x: 350, y: 200, radius: 18, hp: 20 },
      { x: 850, y: 550, radius: 18, hp: 20 }
    );
  }

  checkRectCollision(cx, cy, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  renderTerrain(ctx) {
    // Terrain Base Background — a cached procedural texture per biome
    // (snow drifts, lava glow, jungle canopy, etc.) instead of a flat fill.
    if (this.terrainCanvas) {
      ctx.drawImage(this.terrainCanvas, 0, 0);
    } else {
      ctx.fillStyle = this.config.bgColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Terrain Grid Lines
    ctx.strokeStyle = this.config.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  /** Builds the offscreen, biome-specific ground texture once per match (cheap to reuse every frame after). */
  _generateTerrainCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');

    switch (this.mapId) {
      case 'snow':
        this._paintSnowTerrain(ctx);
        break;
      case 'lava':
        this._paintLavaTerrain(ctx);
        break;
      case 'jungle':
        this._paintJungleTerrain(ctx);
        break;
      case 'factory':
        this._paintFactoryTerrain(ctx);
        break;
      default:
        this._paintDesertTerrain(ctx);
        break;
    }

    this.terrainCanvas = canvas;
  }

  _paintDesertTerrain(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#e9d3a3');
    grad.addColorStop(1, '#c9a868');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Sandy dune patches
    for (let i = 0; i < 26; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      const r = rand(40, 130);
      const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
      const shade = Math.random() > 0.5 ? 'rgba(178,143,88,0.35)' : 'rgba(240,222,178,0.35)';
      patch.addColorStop(0, shade);
      patch.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, rand(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }

    // Pebble speckles
    ctx.fillStyle = 'rgba(120, 90, 55, 0.25)';
    for (let i = 0; i < 220; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      ctx.beginPath();
      ctx.arc(x, y, rand(1, 2.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _paintSnowTerrain(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#f4fafd');
    grad.addColorStop(1, '#cfe4f2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Soft snow drifts
    for (let i = 0; i < 22; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      const r = rand(50, 150);
      const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
      patch.addColorStop(0, 'rgba(255,255,255,0.6)');
      patch.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.55, rand(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }

    // Icy cracks
    ctx.strokeStyle = 'rgba(140, 190, 220, 0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      let x = rand(0, this.width);
      let y = rand(0, this.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segments = 3 + Math.floor(rand(0, 3));
      for (let s = 0; s < segments; s++) {
        x += rand(-40, 40);
        y += rand(-40, 40);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Sparkle speckles
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 160; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      ctx.beginPath();
      ctx.arc(x, y, rand(0.8, 1.8), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _paintJungleTerrain(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#2a4e22');
    grad.addColorStop(1, '#193015');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Canopy foliage clusters (lighter and darker green blotches)
    for (let i = 0; i < 34; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      const r = rand(30, 90);
      const light = Math.random() > 0.5;
      const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
      patch.addColorStop(0, light ? 'rgba(95,155,60,0.4)' : 'rgba(14,38,14,0.45)');
      patch.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bare dirt patches
    for (let i = 0; i < 8; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      const r = rand(25, 60);
      const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
      patch.addColorStop(0, 'rgba(92,66,35,0.35)');
      patch.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, rand(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }

    // Grass blade speckles
    ctx.fillStyle = 'rgba(150, 205, 105, 0.3)';
    for (let i = 0; i < 260; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      ctx.fillRect(x, y, 1.5, rand(3, 6));
    }
  }

  _paintFactoryTerrain(ctx) {
    const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, '#1c232a');
    grad.addColorStop(1, '#262f38');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Steel floor panels with riveted corners
    const panel = 100;
    for (let x = 0; x < this.width; x += panel) {
      for (let y = 0; y < this.height; y += panel) {
        ctx.strokeStyle = 'rgba(125, 150, 165, 0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, panel - 6, panel - 6);

        ctx.fillStyle = 'rgba(155, 180, 195, 0.35)';
        const corners = [[x + 8, y + 8], [x + panel - 8, y + 8], [x + 8, y + panel - 8], [x + panel - 8, y + panel - 8]];
        for (const [rx, ry] of corners) {
          if (rx < this.width && ry < this.height) {
            ctx.beginPath();
            ctx.arc(rx, ry, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Faded hazard-stripe patches
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#f5c400';
    for (let i = 0; i < 4; i++) {
      const cx = rand(0, this.width);
      const cy = rand(0, this.height);
      ctx.setTransform(1, 0, 0, 1, cx, cy);
      ctx.rotate(Math.PI / 4);
      for (let s = -60; s < 60; s += 16) {
        ctx.fillRect(s, -40, 6, 80);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }

  _paintLavaTerrain(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#241010');
    grad.addColorStop(1, '#140808');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Ash/rock speckles
    ctx.fillStyle = 'rgba(75, 45, 38, 0.4)';
    for (let i = 0; i < 200; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      ctx.beginPath();
      ctx.arc(x, y, rand(1, 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing lava pools
    for (let i = 0; i < 10; i++) {
      const x = rand(0, this.width);
      const y = rand(0, this.height);
      const r = rand(25, 70);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, 'rgba(255, 210, 90, 0.9)');
      glow.addColorStop(0.4, 'rgba(255, 110, 20, 0.7)');
      glow.addColorStop(1, 'rgba(255, 60, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.65, rand(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing cracks branching across the rock
    ctx.strokeStyle = 'rgba(255, 140, 40, 0.55)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 16; i++) {
      let x = rand(0, this.width);
      let y = rand(0, this.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segments = 3 + Math.floor(rand(0, 4));
      for (let s = 0; s < segments; s++) {
        x += rand(-35, 35);
        y += rand(-35, 35);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  renderObstacles(ctx) {
    // 1. Render Indestructible Walls
    for (const w of this.walls) {
      ctx.save();
      ctx.fillStyle = w.type === 'stone' ? this.config.wallColor : '#3a444a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
      ctx.restore();
    }

    // 2. Render Wooden Crates
    for (const c of this.crates) {
      ctx.save();
      ctx.fillStyle = this.config.crateColor;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#4a2e12';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.restore();
    }

    // 3. Render Destructible Trees
    for (const t of this.trees) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.fillStyle = 'rgba(20, 80, 20, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a400a';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Explosive Barrels
    for (const b of this.barrels) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = this.config.barrelColor;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', 0, 1);
      ctx.restore();
    }
  }

  renderBushes(ctx) {
    for (const b of this.bushes) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = this.config.bushColor;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.ArenaMap = ArenaMap;
