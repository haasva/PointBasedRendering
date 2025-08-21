import { applyNeoTransforms, drawFloor, updateAllPositions, updateVisibleArea, updateAllCardboardRotations } from "./renderer.js";
import { unitManager, updateUnits } from "./units.js";


import { updateMinimap } from "../ui/minimap.js"

import { worldData } from "../init/world-data.js"

export let PLAYER_STATE = {
    coordinate: {
        x: 852,
        y: 284
    },
    terrain: ''
}

export let worldX = 852;
export let worldY = 284;

let _worldX = 852;
let _worldY = 284;

let lastFrameTime = 0;
let lastMinimapUpdate = 0;
const MINIMAP_UPDATE_INTERVAL = 200; // ms

let facingDirection = 0;

export let SETTINGS = {
    firstPerson: false,
    sightRange: 10,
    pointerLock: false,
    run: false,
    moveSpeed: 1.5,
    yaw: 0,   // z rotation
    pitch: 15,  // angle
    translateZ: 705,
    translateX: -13,
    translateY: 800,
    zoom: 1,
    maxTerrainHeight: 22,
    fov: 90,
    debug: false
}




const keys = { w: false, a: false, s: false, d: false, shift: false };
let needsGridUpdate = false;


const baseSpeed = 2.5;
const sprintSpeed = 40;
let currentSpeed = keys.shift ? sprintSpeed : baseSpeed;

let moveForward = 0;
let moveRight = 0;

// introduce edge screen mouse movement 
const renderer = document.getElementById('renderer');
renderer.addEventListener('mousemove', (event) => {

    const edgeThreshold = 20; // pixels from the edge
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (event.clientX < edgeThreshold) {
        moveRight -= 1; // Move left
    } else if (event.clientX > screenWidth - edgeThreshold) {
        moveRight += 1; // Move right
        console.log('move right: ', moveRight);
    } else {
      moveRight = 0; // Reset horizontal movement
    }
    if (event.clientY < edgeThreshold) {
        moveForward -= 1; // Move up
    } else if (event.clientY > screenHeight - edgeThreshold) {
        moveForward += 1; // Move down
    } else {
      moveForward = 0; // Reset vertical movement
    }


    // include corners 
    if (event.clientX < edgeThreshold && event.clientY < edgeThreshold) {
        moveForward -= 1; // Move up-left
    } else if (event.clientX > screenWidth - edgeThreshold && event.clientY < edgeThreshold) {
        moveForward -= 1; // Move up-right
    } else if (event.clientX < edgeThreshold && event.clientY > screenHeight - edgeThreshold) {
        moveForward += 1; // Move down-left
    } else if (event.clientX > screenWidth - edgeThreshold && event.clientY > screenHeight - edgeThreshold) {
        moveForward += 1; // Move down-right
    }
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) keys[key] = true;
    if (e.code === 'ShiftLeft') keys.shift = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) keys[key] = false;
    
    moveForward = 0;
    moveRight = 0;
    if (e.code === 'ShiftLeft') keys.shift = false;
});

document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyQ') {
        SETTINGS.firstPerson = !SETTINGS.firstPerson;

        if (SETTINGS.firstPerson === false) {
              SETTINGS.translateZ = -8;

        } else {
              SETTINGS.translateZ = -0.4;
              SETTINGS.translateY = -0;
        }
      }
});

document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        //togglePointerLock();
      }
});


//document.addEventListener('mousemove', updateCameraRotation);

export function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    unitManager.updateUnitPositions();



    
    if (keys.w) moveForward -= 1;
    if (keys.s) moveForward += 1;
    if (keys.a) moveRight -= 1;
    if (keys.d) moveRight += 1;


    const inputMagnitude = Math.hypot(moveForward, moveRight);
    if (inputMagnitude > 1) {
        moveForward /= inputMagnitude;
        moveRight /= inputMagnitude;
    }

    if (moveForward !== 0 || moveRight !== 0) {
          
        currentSpeed = keys.shift ? sprintSpeed : baseSpeed;

        if (SETTINGS.firstPerson === true) {
          if (worldData.map[PLAYER_STATE.coordinate.y][PLAYER_STATE.coordinate.x].terrain === 'road') {
            currentSpeed = baseSpeed * 2;
            // SETTINGS.translateZ = -0.4;
          } else if (worldData.map[PLAYER_STATE.coordinate.y][PLAYER_STATE.coordinate.x].terrain === 'water') {
            currentSpeed = baseSpeed / 5;
            SETTINGS.translateZ = -0.1;
          } else {
            // SETTINGS.translateZ = -0.4;
            currentSpeed = baseSpeed;
          }
        } else {
          currentSpeed = sprintSpeed / 2;
        }



        
        const yawRad = SETTINGS.yaw * (Math.PI / 180);
        
        const forwardX = Math.sin(yawRad);
        const forwardY = Math.cos(yawRad);
        const rightX = Math.sin(yawRad + Math.PI / 2);
        const rightY = Math.cos(yawRad + Math.PI / 2);
        
        const dx = (forwardX * moveForward + rightX * moveRight) * currentSpeed * deltaTime;
        const dy = (forwardY * moveForward + rightY * moveRight) * currentSpeed * deltaTime;

        const prevCellX = Math.round(worldX);
        const prevCellY = Math.round(worldY);

        worldX = Math.max(0, Math.min(2000, worldX + dx));
        worldY = Math.max(0, Math.min(2000, worldY + dy));

        updatePlayerStateTerrain();

        const newCellX = Math.round(worldX);
        const newCellY = Math.round(worldY);

        if (newCellX !== prevCellX || newCellY !== prevCellY) {
            needsGridUpdate = true;
        }

        headBobbing();
        updateAllPositions();
        drawFloor();

// silhouette.update();
        
    }

    if (needsGridUpdate) {
        updateVisibleArea();
        needsGridUpdate = false;
        updateMinimap();
    }



    requestAnimationFrame(gameLoop);
}






























function updatePlayerStateTerrain() {
        const cellX = Math.min(
            worldData.map[0].length - 1, // Max X bound
            Math.max(0, Math.floor(worldX)) // Min X bound
        );
        const cellY = Math.min(
            worldData.map.length - 1, // Max Y bound
            Math.max(0, Math.floor(worldY)) // Min Y bound
        );

        PLAYER_STATE.coordinate.x = cellX;
        PLAYER_STATE.coordinate.y = cellY;
        PLAYER_STATE.terrain = worldData.map[PLAYER_STATE.coordinate.y][PLAYER_STATE.coordinate.x];

        
}

export function getWorldPosition() {
    return { x: _worldX, y: _worldY };
}

export function setWorldPosition(x, y) {
    _worldX = Math.max(0, Math.min(2000, x));
    _worldY = Math.max(0, Math.min(2000, y));

    worldX = _worldX;
    worldY = _worldY;
    
    SETTINGS.yaw = 0;
    
    updatePlayerStateTerrain();
    updateAllPositions();
    drawFloor();

    updateVisibleArea();


    updateHorizon();
    updateAllCardboardRotations();
    applyNeoTransforms();

        updateMinimap();
}


const times = [];
let fps;

function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    document.getElementById('fps').textContent = 'FPS: ' + fps;
    updateUnits();
    refreshLoop();
  });
}

refreshLoop();







function updateCameraRotation(event) {
    if (SETTINGS.pointerLock === false) return;
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
  
    SETTINGS.yaw += -(movementX / window.innerWidth) * 180;
    SETTINGS.pitch += -(movementY / window.innerHeight) * 60;
    SETTINGS.pitch = Math.max(10, Math.min(180, SETTINGS.pitch));
    
    if (SETTINGS.yaw > 360) {
      SETTINGS.yaw = 0;
    }
    if (SETTINGS.yaw < 0) {
      SETTINGS.yaw = 360;
    }

    if (SETTINGS.yaw > 315 || SETTINGS.yaw <= 45) {
      facingDirection = 0; // Front
    } else if (SETTINGS.yaw > 45 && SETTINGS.yaw <= 135) {
      facingDirection = 270; // Left
    } else if (SETTINGS.yaw > 135 && SETTINGS.yaw <= 225) {
      facingDirection = 180; // Back
    } else if (SETTINGS.yaw > 225 && SETTINGS.yaw <= 315) {
      facingDirection = 90; // Right
    }

    if (renderer) {
      renderer.style.setProperty(
        "--rotateZ",
        `${facingDirection}deg`
      );
     }

    applyNeoTransforms();
    updateHorizon();
    updateAllCardboardRotations();



}

function headBobbing() {
  if (SETTINGS.firstPerson != true) return;
  const bobbingSpeed = 0.75;
  const angleAmount = 0.05;
  const time = performance.now() * bobbingSpeed * 0.01;
  const ran = Math.floor(Math.random() * 2) + 0;
  // if (ran === 0) {
  //   SETTINGS.yaw = SETTINGS.yaw + Math.sin(time * 2) * angleAmount;
  // } else {
  //   SETTINGS.yaw = SETTINGS.yaw - Math.sin(time * 2) * angleAmount;
  // }
  // SETTINGS.pitch = SETTINGS.pitch - Math.sin(time * 2) * angleAmount / 2;
  SETTINGS.translateZ = SETTINGS.translateZ - Math.cos(time * 2) * angleAmount / 4;
  // SETTINGS.translateX = SETTINGS.translateX + Math.cos(time) * angleAmount * 1;
  // SETTINGS.translateY = SETTINGS.translateY - Math.cos(time) * angleAmount * 1;

    updateHorizon();
//   if (PLAYER_STATE.horse === true) {
//     updateHorseBobbing(Math.sin(time * 2) * angleAmount);
//   } 
    applyNeoTransforms();
}




export function togglePointerLock() {
  const engineWrapper = document.getElementById('engine-wrapper');
  const requestPointerLock = engineWrapper.requestPointerLock 
  || engineWrapper.mozRequestPointerLock 
  || engineWrapper.webkitRequestPointerLock;
  if (document.pointerLockElement === engineWrapper) {
    SETTINGS.pointerLock = false;
    document.exitPointerLock();
  } else {
    SETTINGS.pointerLock = true;
    requestPointerLock.call(engineWrapper);
  }
}

  const horizon = document.getElementById("horizon");
  const compass = document.getElementById("compass-container");


function updateHorizon() {
  const angleZ = SETTINGS.yaw;
  const angleX = SETTINGS.pitch;
  const normalizedAngleZ = ((angleZ % 360) + 360) % 360;
  const normalizedAngleX = ((angleX)) % 360;
  const backgroundY = (normalizedAngleX * (5000 / 360));
  const backgroundXHorizon = (normalizedAngleZ * (2048 / 180));
  horizon.style.backgroundPositionX = `${backgroundXHorizon}px`;
  horizon.style.backgroundPositionY = `${(backgroundY - 410) + (SETTINGS.translateZ * 75)}px`;

  const normalizedAngle = ((angleZ % 360) + 360) % 360;
  const backgroundX = -(normalizedAngle * (800 / 360));
  compass.style.backgroundPosition = `${backgroundX}px 0`;
}




class TerrainSilhouette {
    constructor(worldData, playerState, settings, element) {
        this.worldData = worldData;
        this.playerState = playerState;
        this.settings = settings;
        this.element = element;
            this.debugCanvas = document.getElementById('terrain-debug-visualizer');
            this.debugCtx = this.debugCanvas.getContext('2d');
    }

update() {
    const { points, debugPoints } = this.computeVisibleTerrain();
    this.applyClipPath(this.pointsToClipPath(points));
    this.drawDebugVisualizer(debugPoints);
}

computeVisibleTerrain() {
    const halfCanvas = this.debugCanvas.width / 2;
    const scale = halfCanvas / SETTINGS.sightRange;
    const yawRad = SETTINGS.yaw * -Math.PI / 180;
    const cosYaw = Math.cos(-yawRad);
    const sinYaw = Math.sin(-yawRad);

    const points = [];       // For silhouette
    const debugPoints = [];  // For visualizer

    for (let dy = -SETTINGS.sightRange; dy <= SETTINGS.sightRange; dy++) {
        for (let dx = -SETTINGS.sightRange; dx <= SETTINGS.sightRange; dx++) {
            const worldX = PLAYER_STATE.coordinate.x + dx;
            const worldY = PLAYER_STATE.coordinate.y + dy;

            if (!worldData.map[worldY] || !worldData.map[worldY][worldX]) continue;

            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > SETTINGS.sightRange) continue;

            // Rotate so player faces up
            const rx = dx * cosYaw - dy * sinYaw;
            const ry = dx * sinYaw + dy * cosYaw;

            // Angle in original space
            let angle = Math.atan2(dy, dx);
            let relAngle = normalizeAngle(angle - yawRad);
            if (Math.abs(relAngle) > SETTINGS.fov / 2) continue;

            // Heightmap value
            const h = worldData.map[worldY][worldX].height || 0;

            // --- For silhouette ---
            // Map relAngle to horizontal % in FOV
            const anglePct = (relAngle + SETTINGS.fov / 2) / SETTINGS.fov; // 0..1
            const screenX = anglePct * 100;
            // Map height to vertical %
            const heightPct = 100 - (h / SETTINGS.maxTerrainHeight) * 100;
            points.push(`${screenX}% ${heightPct}%`);

            // --- For debug visualizer ---
            const brightness = Math.min(255, (h / SETTINGS.maxTerrainHeight) * 255);
            debugPoints.push({
                x: halfCanvas + rx * scale - scale/2,
                y: halfCanvas + ry * scale - scale/2,
                brightness
            });
        }
    }

    return { points, debugPoints };

    function normalizeAngle(a) {
        a = a % (Math.PI * 2);
        if (a > Math.PI) a -= Math.PI * 2;
        if (a < -Math.PI) a += Math.PI * 2;
        return a;
    }
}

pointsToClipPath(points) {
    if (points.length === 0) return '';
    // Sort points left-to-right by X percentage
    points.sort((a, b) => parseFloat(a) - parseFloat(b));
    return `polygon(${points.join(', ')})`;
}

drawDebugVisualizer(debugPoints) {
    const ctx = this.debugCtx;
    const size = this.debugCanvas.width;
    ctx.clearRect(0, 0, size, size);

    // Draw visible terrain
    for (const p of debugPoints) {
        ctx.fillStyle = `rgb(${p.brightness}, ${p.brightness}, ${p.brightness})`;
        ctx.fillRect(p.x, p.y, size / SETTINGS.sightRange / 2, size / SETTINGS.sightRange / 2);
    }

    // Draw FOV lines
    const half = size / 2;
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.lineTo(
        half + Math.sin(SETTINGS.fov / 2) * SETTINGS.sightRange * (size / 2 / SETTINGS.sightRange),
        half - Math.cos(SETTINGS.fov / 2) * SETTINGS.sightRange * (size / 2 / SETTINGS.sightRange)
    );
    ctx.moveTo(half, half);
    ctx.lineTo(
        half - Math.sin(SETTINGS.fov / 2) * SETTINGS.sightRange * (size / 2 / SETTINGS.sightRange),
        half - Math.cos(SETTINGS.fov / 2) * SETTINGS.sightRange * (size / 2 / SETTINGS.sightRange)
    );
    ctx.stroke();

    // Player marker
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(half, half, 4, 0, Math.PI * 2);
    ctx.fill();
}


    applyClipPath(polygonStr) {
        this.element.offsetHeight; // forces reflow
        this.element.style.clipPath = polygonStr;
    }

    degToRad(deg) {
        return deg * Math.PI / 180;
    }
}