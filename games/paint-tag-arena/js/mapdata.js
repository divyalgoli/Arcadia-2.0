// mapdata.js
// Arena map data embedded directly as JS so the game works when opened
// straight from disk (file://) as well as from a web server, without
// relying on fetch() of the JSON files in maps/ (blocked by CORS on file://).
// Mirrors maps/arena1.json, arena2.json, arena3.json exactly.

const MAP_DATA = {
  "arena1": {
    "name": "Training Grounds",
    "description": "A beginner-friendly arena with an open center, minimal obstacles, and gentle sightlines to help new players learn movement and dashing.",
    "width": 1600,
    "height": 900,
    "spawnPoints": [
      {
        "id": 1,
        "x": 100,
        "y": 100
      },
      {
        "id": 2,
        "x": 1500,
        "y": 100
      },
      {
        "id": 3,
        "x": 100,
        "y": 800
      },
      {
        "id": 4,
        "x": 1500,
        "y": 800
      }
    ],
    "walls": [
      {
        "x": 0,
        "y": 0,
        "width": 1600,
        "height": 20
      },
      {
        "x": 0,
        "y": 880,
        "width": 1600,
        "height": 20
      },
      {
        "x": 0,
        "y": 0,
        "width": 20,
        "height": 900
      },
      {
        "x": 1580,
        "y": 0,
        "width": 20,
        "height": 900
      },
      {
        "x": 300,
        "y": 200,
        "width": 200,
        "height": 20
      },
      {
        "x": 1100,
        "y": 200,
        "width": 200,
        "height": 20
      },
      {
        "x": 300,
        "y": 680,
        "width": 200,
        "height": 20
      },
      {
        "x": 1100,
        "y": 680,
        "width": 200,
        "height": 20
      },
      {
        "x": 750,
        "y": 100,
        "width": 20,
        "height": 150
      },
      {
        "x": 750,
        "y": 650,
        "width": 20,
        "height": 150
      },
      {
        "x": 500,
        "y": 430,
        "width": 150,
        "height": 20
      },
      {
        "x": 950,
        "y": 430,
        "width": 150,
        "height": 20
      }
    ],
    "obstacles": [
      {
        "type": "box",
        "x": 400,
        "y": 400,
        "width": 60,
        "height": 60
      },
      {
        "type": "box",
        "x": 1140,
        "y": 400,
        "width": 60,
        "height": 60
      },
      {
        "type": "pillar",
        "x": 800,
        "y": 250,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 800,
        "y": 600,
        "width": 40,
        "height": 40
      },
      {
        "type": "barrier",
        "x": 600,
        "y": 150,
        "width": 100,
        "height": 20
      },
      {
        "type": "barrier",
        "x": 900,
        "y": 730,
        "width": 100,
        "height": 20
      },
      {
        "type": "box",
        "x": 250,
        "y": 450,
        "width": 60,
        "height": 60
      },
      {
        "type": "box",
        "x": 1290,
        "y": 450,
        "width": 60,
        "height": 60
      }
    ],
    "powerUpSpawns": [
      {
        "type": "speed",
        "x": 800,
        "y": 450
      },
      {
        "type": "shield",
        "x": 400,
        "y": 250
      },
      {
        "type": "doubleDash",
        "x": 1200,
        "y": 250
      },
      {
        "type": "freeze",
        "x": 800,
        "y": 750
      }
    ],
    "safeZones": [
      {
        "x": 100,
        "y": 100,
        "radius": 50
      },
      {
        "x": 1500,
        "y": 100,
        "radius": 50
      },
      {
        "x": 100,
        "y": 800,
        "radius": 50
      },
      {
        "x": 1500,
        "y": 800,
        "radius": 50
      }
    ],
    "teleports": []
  },
  "arena2": {
    "name": "Cyber Maze",
    "description": "A medium-sized maze with narrow corridors, multiple escape routes, and a contested power-up zone at its center.",
    "width": 1600,
    "height": 900,
    "spawnPoints": [
      {
        "id": 1,
        "x": 100,
        "y": 100
      },
      {
        "id": 2,
        "x": 1500,
        "y": 100
      },
      {
        "id": 3,
        "x": 100,
        "y": 800
      },
      {
        "id": 4,
        "x": 1500,
        "y": 800
      }
    ],
    "walls": [
      {
        "x": 0,
        "y": 0,
        "width": 1600,
        "height": 20
      },
      {
        "x": 0,
        "y": 880,
        "width": 1600,
        "height": 20
      },
      {
        "x": 0,
        "y": 0,
        "width": 20,
        "height": 900
      },
      {
        "x": 1580,
        "y": 0,
        "width": 20,
        "height": 900
      },
      {
        "x": 200,
        "y": 150,
        "width": 20,
        "height": 300
      },
      {
        "x": 200,
        "y": 550,
        "width": 20,
        "height": 250
      },
      {
        "x": 400,
        "y": 100,
        "width": 250,
        "height": 20
      },
      {
        "x": 400,
        "y": 400,
        "width": 20,
        "height": 200
      },
      {
        "x": 600,
        "y": 400,
        "width": 250,
        "height": 20
      },
      {
        "x": 850,
        "y": 150,
        "width": 20,
        "height": 300
      },
      {
        "x": 850,
        "y": 550,
        "width": 20,
        "height": 250
      },
      {
        "x": 1000,
        "y": 250,
        "width": 250,
        "height": 20
      },
      {
        "x": 1200,
        "y": 250,
        "width": 20,
        "height": 250
      },
      {
        "x": 1000,
        "y": 650,
        "width": 300,
        "height": 20
      },
      {
        "x": 1380,
        "y": 150,
        "width": 20,
        "height": 350
      },
      {
        "x": 550,
        "y": 650,
        "width": 250,
        "height": 20
      },
      {
        "x": 300,
        "y": 750,
        "width": 200,
        "height": 20
      },
      {
        "x": 700,
        "y": 200,
        "width": 20,
        "height": 150
      }
    ],
    "obstacles": [
      {
        "type": "pillar",
        "x": 750,
        "y": 430,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 850,
        "y": 430,
        "width": 40,
        "height": 40
      },
      {
        "type": "box",
        "x": 300,
        "y": 300,
        "width": 60,
        "height": 60
      },
      {
        "type": "box",
        "x": 1300,
        "y": 300,
        "width": 60,
        "height": 60
      },
      {
        "type": "barrier",
        "x": 500,
        "y": 550,
        "width": 100,
        "height": 20
      },
      {
        "type": "barrier",
        "x": 1000,
        "y": 550,
        "width": 100,
        "height": 20
      },
      {
        "type": "box",
        "x": 150,
        "y": 650,
        "width": 60,
        "height": 60
      },
      {
        "type": "box",
        "x": 1450,
        "y": 650,
        "width": 60,
        "height": 60
      },
      {
        "type": "pillar",
        "x": 700,
        "y": 750,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 900,
        "y": 750,
        "width": 40,
        "height": 40
      }
    ],
    "powerUpSpawns": [
      {
        "type": "speed",
        "x": 800,
        "y": 450
      },
      {
        "type": "shield",
        "x": 800,
        "y": 350
      },
      {
        "type": "doubleDash",
        "x": 800,
        "y": 550
      },
      {
        "type": "freeze",
        "x": 250,
        "y": 200
      },
      {
        "type": "speed",
        "x": 1350,
        "y": 700
      }
    ],
    "safeZones": [
      {
        "x": 450,
        "y": 250,
        "radius": 45
      },
      {
        "x": 1150,
        "y": 650,
        "radius": 45
      }
    ],
    "teleports": [
      {
        "id": 1,
        "fromX": 50,
        "fromY": 450,
        "toX": 1550,
        "toY": 450
      }
    ]
  },
  "arena3": {
    "name": "Reactor Core",
    "description": "A symmetrical, circular-feeling arena built around a high-risk pillar-ringed reactor core, with long chase paths around the edges and teleport pads linking opposite sides.",
    "width": 1600,
    "height": 900,
    "spawnPoints": [
      {
        "id": 1,
        "x": 150,
        "y": 150
      },
      {
        "id": 2,
        "x": 1450,
        "y": 150
      },
      {
        "id": 3,
        "x": 150,
        "y": 750
      },
      {
        "id": 4,
        "x": 1450,
        "y": 750
      }
    ],
    "walls": [
      {
        "x": 100,
        "y": 0,
        "width": 1400,
        "height": 20
      },
      {
        "x": 100,
        "y": 880,
        "width": 1400,
        "height": 20
      },
      {
        "x": 0,
        "y": 100,
        "width": 20,
        "height": 700
      },
      {
        "x": 1580,
        "y": 100,
        "width": 20,
        "height": 700
      },
      {
        "x": 20,
        "y": 20,
        "width": 80,
        "height": 20
      },
      {
        "x": 20,
        "y": 20,
        "width": 20,
        "height": 80
      },
      {
        "x": 1500,
        "y": 20,
        "width": 80,
        "height": 20
      },
      {
        "x": 1560,
        "y": 20,
        "width": 20,
        "height": 80
      },
      {
        "x": 20,
        "y": 800,
        "width": 80,
        "height": 20
      },
      {
        "x": 20,
        "y": 720,
        "width": 20,
        "height": 80
      },
      {
        "x": 1500,
        "y": 800,
        "width": 80,
        "height": 20
      },
      {
        "x": 1560,
        "y": 720,
        "width": 20,
        "height": 80
      },
      {
        "x": 350,
        "y": 200,
        "width": 350,
        "height": 20
      },
      {
        "x": 900,
        "y": 200,
        "width": 350,
        "height": 20
      },
      {
        "x": 350,
        "y": 680,
        "width": 350,
        "height": 20
      },
      {
        "x": 900,
        "y": 680,
        "width": 350,
        "height": 20
      }
    ],
    "obstacles": [
      {
        "type": "pillar",
        "x": 780,
        "y": 430,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 900,
        "y": 430,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 840,
        "y": 326,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 720,
        "y": 326,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 660,
        "y": 430,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 720,
        "y": 534,
        "width": 40,
        "height": 40
      },
      {
        "type": "pillar",
        "x": 840,
        "y": 534,
        "width": 40,
        "height": 40
      },
      {
        "type": "box",
        "x": 150,
        "y": 450,
        "width": 60,
        "height": 60
      },
      {
        "type": "box",
        "x": 1390,
        "y": 450,
        "width": 60,
        "height": 60
      },
      {
        "type": "barrier",
        "x": 700,
        "y": 100,
        "width": 200,
        "height": 20
      },
      {
        "type": "barrier",
        "x": 700,
        "y": 780,
        "width": 200,
        "height": 20
      }
    ],
    "powerUpSpawns": [
      {
        "type": "speed",
        "x": 800,
        "y": 150
      },
      {
        "type": "shield",
        "x": 800,
        "y": 750
      },
      {
        "type": "doubleDash",
        "x": 150,
        "y": 450
      },
      {
        "type": "freeze",
        "x": 1450,
        "y": 450
      },
      {
        "type": "speed",
        "x": 800,
        "y": 450
      },
      {
        "type": "shield",
        "x": 400,
        "y": 300
      }
    ],
    "safeZones": [
      {
        "x": 150,
        "y": 150,
        "radius": 50
      },
      {
        "x": 1450,
        "y": 150,
        "radius": 50
      },
      {
        "x": 150,
        "y": 750,
        "radius": 50
      },
      {
        "x": 1450,
        "y": 750,
        "radius": 50
      }
    ],
    "teleports": [
      {
        "id": 1,
        "fromX": 50,
        "fromY": 450,
        "toX": 1550,
        "toY": 450
      },
      {
        "id": 2,
        "fromX": 1550,
        "fromY": 450,
        "toX": 50,
        "toY": 450
      },
      {
        "id": 3,
        "fromX": 800,
        "fromY": 50,
        "toX": 800,
        "toY": 850
      },
      {
        "id": 4,
        "fromX": 800,
        "fromY": 850,
        "toX": 800,
        "toY": 50
      }
    ]
  }
};
