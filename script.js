const vegetationImage = new Image();
let vegetationLoaded = false;
const vegetationData = Array(1000).fill().map(() => Array(1000).fill(false));

const textureImage = new Image();
let textureLoaded = false;
const textureData = Array(1000).fill().map(() => Array(1000).fill(false));

let sightRange = 20;
let worldX = 250;
let worldY = 250;
let renderOffsetX = 0;
let renderOffsetY = 0;
const renderer = document.getElementById('renderer');
const cellPool = new Map();
const cardboardMap = new Map();


const canvas = document.getElementById('floor');
const ctx = canvas.getContext('2d');
let lastWorldX = worldX;
let lastWorldY = worldY;

// Double buffering
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d');

const textureCache = new Map(); // Cache loaded images
const chunkSize = 20; // Cells per chunk (8x8 grid)
const dirtyChunks = new Set(); // Track changed areas

async function loadTexture(name) {
    if (textureCache.has(name)) return textureCache.get(name);
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            textureCache.set(name, img);
            resolve(img);
        };
        img.src = `/textures/${name}`;
    });
}

// Preload common textures



async function initFloorCanvas() {
    canvas.width = renderer.clientWidth;
    canvas.height = renderer.clientHeight;
    canvas.style.transformStyle = 'preserve-3d';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = 2;

canvas.style.imageRendering = 'pixelated';
canvas.style.msInterpolationMode = 'nearest-neighbor';

// Configure canvas context
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

bufferCanvas.style.imageRendering = 'pixelated';
bufferCanvas.style.msInterpolationMode = 'nearest-neighbor';

// Configure canvas context
bufferCanvas.imageSmoothingEnabled = false;
bufferCanvas.mozImageSmoothingEnabled = false;
bufferCanvas.webkitImageSmoothingEnabled = false;
bufferCanvas.msImageSmoothingEnabled = false;


        // Larger viewport to accommodate sub-cell movement
    bufferCanvas.width = renderer.clientWidth * 1; 
    bufferCanvas.height = renderer.clientHeight * 1;

       let scale = Math.min(
          renderer.clientWidth / canvas.width,
          renderer.clientHeight / canvas.height
        );

          scale = Math.floor(scale);
        
        canvas.width = Math.round(scale * canvas.width);
        canvas.height = Math.round(scale * canvas.height);
        bufferCanvas.width = Math.round(scale * canvas.width);
        bufferCanvas.height = Math.round(scale * canvas.height);

          const preloadTextures = ['montane.jog', 'steppe.jpg'];
        await Promise.all(preloadTextures.map(loadTexture));
      
}




let lastFrameTime = 0;

let facingDirection = 0;
let SETTINGS = {
    pointerLock: false,
    run: false,
    moveSpeed: 2.5,
    yaw: 0,   // z rotation
    pitch: 90,  // angle
    translateZ: -0.5
}


function loadTextureData() {
    function checkIfLoaded() {
        if (textureLoaded) {
            const canvas = document.createElement('canvas');
            canvas.width = textureImage.width;
            canvas.height = textureImage.height;
            const context = canvas.getContext('2d');
            context.drawImage(textureImage, 0, 0);
            
            // Get image data as a flat array
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
            
            // Process the image data
            for (let y = 0; y < 1000; y++) {
                for (let x = 0; x < 1000; x++) {
                    // Calculate position in flat array
                    const pos = (y * canvas.width + x) * 4;
                    // Check if pixel is black (RGB all 0)
                    const isTexture = imageData[pos] === 0 && 
                                      imageData[pos + 1] === 0 && 
                                      imageData[pos + 2] === 0;
                                      
                                      if (isTexture) {
                                        textureData[y][x] = "montane.jpg";
                                      } else {
                                        textureData[y][x] = "steppe.jpg";
                                      }
                    
                }
            }
        }
    }

    textureImage.onload = function() {
        textureLoaded = true;
        checkIfLoaded();
    };
    textureImage.src = 'texture.bmp';
}


function loadVegetationData() {
    function checkIfLoaded() {
        if (vegetationLoaded) {
            const canvas = document.createElement('canvas');
            canvas.width = vegetationImage.width;
            canvas.height = vegetationImage.height;
            const context = canvas.getContext('2d');
            context.drawImage(vegetationImage, 0, 0);
            
            // Get image data as a flat array
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
            
            // Process the image data
            for (let y = 0; y < 1000; y++) {
                for (let x = 0; x < 1000; x++) {
                    // Calculate position in flat array
                    const pos = (y * canvas.width + x) * 4;
                    // Check if pixel is black (RGB all 0)
                    const isVegetation = imageData[pos] === 0 && 
                                      imageData[pos + 1] === 0 && 
                                      imageData[pos + 2] === 0;
                                      
                                      if (isVegetation) {
                                        vegetationData[y][x] = generateData();
                                      } else {
                                        vegetationData[y][x] = null;
                                      }
                    
                }
            }
        }
    }

    vegetationImage.onload = function() {
        vegetationLoaded = true;
        checkIfLoaded();
    };
    vegetationImage.src = 'landmass.bmp';
}

function generateData() {

    let data = {
        vegetation: {
            size: 0,
            variation: 0
        }
    };

    const sizeChance = Math.floor(Math.random() * 10) + 1;
    if (sizeChance > 4) {
        data.vegetation.size = 'Big';
        data.vegetation.variation = Math.floor(Math.random() * 5) + 1;

        const animTime = Math.floor(Math.random() * 6) + 3;
        data.vegetation.animation = `treeMove ${animTime}s ease-in-out infinite`;

    } else {
        data.vegetation.size = 'Small';
        data.vegetation.variation = Math.floor(Math.random() * 13) + 1;
    }

    return data;
}



loadVegetationData();
loadTextureData();

function initRenderer() {

    // const player = document.createElement('div');
    // player.id = "player";
    // renderer.appendChild(player);
    cellPool.clear();
    togglePointerLock();
    applyNeoTransforms();
    updateVisibleArea();
    initFloorCanvas();
}

function removeCell(key) {
    const cellData = cellPool.get(key);
    if (cellData) {
        cellData.cardboards.forEach(cardboard => {
            cardboardMap.delete(cardboard);
        });
        cellData.element.remove();
        cellPool.delete(key);
    }
}



function updateVisibleArea() {
    const centerX = Math.round(worldX);
    const centerY = Math.round(worldY);
    
    const minX = Math.max(0, centerX - sightRange);
    const maxX = Math.min(999, centerX + sightRange);
    const minY = Math.max(0, centerY - sightRange);
    const maxY = Math.min(999, centerY + sightRange);
    
    cellPool.forEach((cell, key) => {
        const [x, y] = key.split(',').map(Number);
        const distance = Math.sqrt(
            Math.pow(x - worldX, 2) + 
            Math.pow(y - worldY, 2)
        );
        
        if (distance > sightRange) {
            removeCell(key, cell);
        }
    });
    

    const rendererWidth = renderer.clientWidth;
    const rendererHeight = renderer.clientHeight;
    const cellSize = Math.min(
        rendererWidth / (sightRange * 2), 
        rendererHeight / (sightRange * 2)
    );
    
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const distance = Math.sqrt(
                Math.pow(x - worldX, 2) + 
                Math.pow(y - worldY, 2)
            );
            
            if (distance > sightRange) continue;
            
            const key = `${x},${y}`;
            if (!cellPool.has(key) && vegetationData[y][x]) {
                const data = vegetationData[y][x];
                const cellData = createCell(x, y, cellSize, data);
                cellData.element.style.setProperty('--rotation-z', `${SETTINGS.yaw}deg`);
                renderer.appendChild(cellData.element);
            }
        }
    }
    
    updateAllPositions();
}

function createCell(x, y, cellSize, data) {
    const element = document.createElement('div');
    element.className = 'land-cell';
    element.dataset.x = x;
    element.dataset.y = y;
    element.style.width = `${cellSize}px`;
    element.style.height = `${cellSize}px`;
    
    const cardboard = document.createElement('div');
    cardboard.className = 'tree';
    cardboard.classList.add('cardboard');
    cardboard.classList.add(`${data.vegetation.size}`);
    cardboard.style.animation = data.vegetation.animation;
    cardboard.style.backgroundImage = `url("savanna/${data.vegetation.size}/${data.vegetation.variation}.png")`;
    element.appendChild(cardboard);
    
    const cellData = {
        element,
        x,
        y,
        cardboards: [cardboard]
    };
    

    const key = `${x},${y}`;
    cellPool.set(key, cellData);
    cardboardMap.set(cardboard, { cellKey: key, element: cardboard });
    
    return cellData;
}

function processElement(cell) {

}



function updateAllPositions() {
    const rendererWidth = renderer.clientWidth;
    const rendererHeight = renderer.clientHeight;
    const cellSize = Math.min(
        rendererWidth / (sightRange * 2), 
        rendererHeight / (sightRange * 2)
    );
    
    cellPool.forEach(cell => {

        const dx = cell.x - worldX;
        const dy = cell.y - worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const posX = (rendererWidth / 2) + (dx * cellSize);
        const posY = (rendererHeight / 2) + (dy * cellSize);

        const scale = 0.8 + (0.2 * (1 - distance * 2 / sightRange));
cell.element.style.transform = `
    translate3d(${posX}px, ${posY}px, 0)
    scale3d(${scale}, ${scale}, ${scale})
`;



        // cell.element.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;

    });
}


const keys = { w: false, a: false, s: false, d: false };
let needsGridUpdate = false;

document.addEventListener('keydown', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key)) keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    if (['w', 'a', 's', 'd'].includes(e.key)) keys[e.key] = false;
});

function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    
    let moveForward = 0;
    let moveRight = 0;
    
    if (keys.w) moveForward -= 1;
    if (keys.s) moveForward += 1;
    if (keys.a) moveRight -= 1;
    if (keys.d) moveRight += 1;

    const inputMagnitude = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
    if (inputMagnitude > 1) {
        moveForward /= inputMagnitude;
        moveRight /= inputMagnitude;
    }
    
    if (moveForward !== 0 || moveRight !== 0) {
        const yawRad = SETTINGS.yaw * (Math.PI / 180);
        
        const forwardX = Math.sin(yawRad);
        const forwardY = Math.cos(yawRad);
        const rightX = Math.sin(yawRad + Math.PI/2);
        const rightY = Math.cos(yawRad + Math.PI/2);
        
        const dx = (forwardX * moveForward + rightX * moveRight) * SETTINGS.moveSpeed * deltaTime;
        const dy = (forwardY * moveForward + rightY * moveRight) * SETTINGS.moveSpeed * deltaTime;
        
        const prevCellX = Math.round(worldX);
        const prevCellY = Math.round(worldY);
        
        worldX += dx;
        worldY += dy;
        
        worldX = Math.max(0, Math.min(1000, worldX));
        worldY = Math.max(0, Math.min(1000, worldY));
        
        const newCellX = Math.round(worldX);
        const newCellY = Math.round(worldY);
        
        if (newCellX !== prevCellX || newCellY !== prevCellY) {
            needsGridUpdate = true;
        }
        
        headBobbing();
        updateAllPositions();
        //updateBackgroundPosition();
        updateFloor();
        updatePositionInfo(worldX, worldY);
         
    }
    
    if (needsGridUpdate) {
        updateVisibleArea();
        
        needsGridUpdate = false;
    }
    
    requestAnimationFrame(gameLoop);
}

function updatePositionInfo(x, y) {
    const tip = document.querySelector('#position-info');
    tip.innerHTML = `<div>PosX: ${x}</div>
                     <div>PosY: ${y}</div>`;
}

// Initialize
initRenderer();
requestAnimationFrame(gameLoop);

const textureScale = 12;
let bgOffsetX = 0;
let bgOffsetY = 0;

function updateBackgroundPosition() {
    const rendererWidth = 500;
    const rendererHeight = 500;
    const normX = worldX / 500;
    const normY = worldY / 500;
    const bgX = -normX * rendererWidth * textureScale;
    const bgY = -normY * rendererHeight * textureScale;
    renderer.style.backgroundPosition = `${bgX}px ${bgY}px`;
}


document.addEventListener('mousemove', updateCameraRotation);






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
  if (ran === 0) {
    SETTINGS.yaw = SETTINGS.yaw + Math.sin(time * 2) * angleAmount;
  } else {
    SETTINGS.yaw = SETTINGS.yaw - Math.sin(time * 2) * angleAmount;
  }
  SETTINGS.pitch = SETTINGS.pitch + Math.sin(time * 2) * angleAmount / 2;

    updateHorizon();
//   if (PLAYER_STATE.horse === true) {
//     updateHorseBobbing(Math.sin(time * 2) * angleAmount);
//   } 
}


function updateHorizon() {
  const horizon = document.getElementById("horizon");
  const angleZ = SETTINGS.yaw;
  const angleX = SETTINGS.pitch;
  const normalizedAngleZ = ((angleZ % 360) + 360) % 360;
  const normalizedAngleX = ((angleX)) % 360;
  const backgroundY = (normalizedAngleX * (5000 / 360));
  const backgroundXHorizon = (normalizedAngleZ * (2048 / 180));
  horizon.style.backgroundPositionX = `${backgroundXHorizon}px`;
  horizon.style.backgroundPositionY = `${backgroundY - 450}px`;
}


function updateAllCardboardRotations() {
    cardboardMap.forEach((_, cardboard) => {
        cardboard.style.setProperty('--rotation-z', `${SETTINGS.yaw}deg`);
    });
}

function applyNeoTransforms() {
  renderer.style.transform = `
    rotateX(${SETTINGS.pitch}deg)  /* Pitch - applied first */
    rotateZ(${SETTINGS.yaw}deg) /* Yaw - applied second */
    scale3d(800, 800, 800) 
    translate3d(0px, 0px, ${SETTINGS.translateZ}dvh) 
    `;
}

function togglePointerLock() {
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

document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePointerLock();
      }
});


function toggleRun() {
    SETTINGS.run = !SETTINGS.run;
  if (SETTINGS.run === true) {
    SETTINGS.moveSpeed = 10;
  } else {
    SETTINGS.moveSpeed = 3;
  }
}










function updateFloor() {
drawFloor();
    

}


async function drawFloor() {
    const cellSize = Math.min(
        canvas.width / (sightRange * 2), 
        canvas.height / (sightRange * 2)
    );
    const fractionalX = worldX % 0.5;
    const fractionalY = worldY % 0.5;
    
    // Calculate render bounds with sub-cell precision
    const startX = Math.floor(worldX - sightRange) - 1;
    const endX = Math.ceil(worldX + sightRange) + 1;
    const startY = Math.floor(worldY - sightRange) - 1;
    const endY = Math.ceil(worldY + sightRange) + 1;

    // Clear only the moving portion
    bufferCtx.clearRect(
        (lastWorldX - worldX) * cellSize,
        (lastWorldY - worldY) * cellSize,
        canvas.width,
        canvas.height
    );

    // Draw visible cells with sub-cell offset
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (y < 0 || y >= textureData.length || x < 0 || x >= textureData[0].length) continue;
            
            const texture = textureData[y][x];
            if (!texture) continue;

            const screenX = (x - worldX + sightRange) * cellSize + fractionalX * cellSize;
            const screenY = (y - worldY + sightRange) * cellSize + fractionalY * cellSize;

            bufferCtx.drawImage(
                await loadTexture(texture),
                screenX,
                screenY,
                cellSize,
                cellSize
            );
        }
    }

    // Copy to visible canvas with sub-pixel precision
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
        bufferCanvas,
        -fractionalX * cellSize,
        -fractionalY * cellSize,
        canvas.width,
        canvas.height
    );

    lastWorldX = worldX;
    lastWorldY = worldY;
}