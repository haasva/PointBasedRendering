import { applyNeoTransforms, drawFloor, updateAllPositions, updateVisibleArea, updateAllCardboardRotations } from "./renderer.js";

import { updateMinimap } from "../ui/minimap.js"

export let PLAYER_STATE = {
    coordinate: {
        x: 20,
        y: 20
    }
}

export let worldX = 20;
export let worldY = 20;

let _worldX = 20;
let _worldY = 20;

let lastFrameTime = 0;
let lastMinimapUpdate = 0;
const MINIMAP_UPDATE_INTERVAL = 200; // ms

let facingDirection = 0;

export let SETTINGS = {
    sightRange: 20,
    pointerLock: false,
    run: false,
    moveSpeed: 1.5,
    yaw: 0,   // z rotation
    pitch: 90,  // angle
    translateZ: -0.5,
    translateX: 0,
    translateY: 0
}




const keys = { w: false, a: false, s: false, d: false, shift: false };
let needsGridUpdate = false;


const baseSpeed = 2.5;
const sprintSpeed = 40;
let currentSpeed = keys.shift ? sprintSpeed : baseSpeed;

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) keys[key] = true;
    if (e.code === 'ShiftLeft') keys.shift = true;
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) keys[key] = false;
    if (e.code === 'ShiftLeft') keys.shift = false;
});

document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyQ') {
        SETTINGS.translateZ = -12;
      }
});

document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePointerLock();
      }
});


document.addEventListener('mousemove', updateCameraRotation);

export function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    let moveForward = 0;
    let moveRight = 0;
    
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

        const yawRad = SETTINGS.yaw * (Math.PI / 180);
        
        const forwardX = Math.sin(yawRad);
        const forwardY = Math.cos(yawRad);
        const rightX = Math.sin(yawRad + Math.PI / 2);
        const rightY = Math.cos(yawRad + Math.PI / 2);
        
        const dx = (forwardX * moveForward + rightX * moveRight) * currentSpeed * deltaTime;
        const dy = (forwardY * moveForward + rightY * moveRight) * currentSpeed * deltaTime;

        const prevCellX = Math.round(worldX);
        const prevCellY = Math.round(worldY);

        worldX = Math.max(0, Math.min(1000, worldX + dx));
        worldY = Math.max(0, Math.min(1000, worldY + dy));

        const newCellX = Math.round(worldX);
        const newCellY = Math.round(worldY);

        if (newCellX !== prevCellX || newCellY !== prevCellY) {
            needsGridUpdate = true;
        }

        PLAYER_STATE.coordinate.x = worldX;
        PLAYER_STATE.coordinate.y = worldY;

        headBobbing();
        updateAllPositions();
        drawFloor();
        updatePositionInfo(worldX.toFixed(2), worldY.toFixed(2));
    }

    if (needsGridUpdate) {
        updateVisibleArea();
        needsGridUpdate = false;
        updateMinimap();
    }



    requestAnimationFrame(gameLoop);
}

export function getWorldPosition() {
    return { x: _worldX, y: _worldY };
}

export function setWorldPosition(x, y) {
    _worldX = Math.max(0, Math.min(1000, x));
    _worldY = Math.max(0, Math.min(1000, y));

    worldX = _worldX;
    worldY = _worldY;

    updateAllPositions();
    drawFloor();
    updateMinimap();
    updateVisibleArea();
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
    document.getElementById('fps').textContent = fps;
    refreshLoop();
  });
}

refreshLoop();

export function updatePositionInfo(x, y) {
    const tip = document.querySelector('#position-info');
    tip.querySelector('#pos-x').textContent = `X: ${x}`;
    tip.querySelector('#pos-y').textContent = `Y: ${y}`;
}





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
  const bobbingSpeed = 0.75;
  const angleAmount = 0.05;
  const time = performance.now() * bobbingSpeed * 0.01;
  const ran = Math.floor(Math.random() * 2) + 0;
  // if (ran === 0) {
  //   SETTINGS.yaw = SETTINGS.yaw + Math.sin(time * 2) * angleAmount;
  // } else {
  //   SETTINGS.yaw = SETTINGS.yaw - Math.sin(time * 2) * angleAmount;
  // }
  SETTINGS.pitch = SETTINGS.pitch - Math.sin(time * 2) * angleAmount / 2;
  SETTINGS.translateZ = SETTINGS.translateZ - Math.cos(time * 2) * angleAmount / 15;
  SETTINGS.translateX = SETTINGS.translateX + Math.cos(time) * angleAmount * 1;
  SETTINGS.translateY = SETTINGS.translateY - Math.cos(time) * angleAmount * 1;

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

