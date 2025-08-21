import { uniqueTextures, vegetationData, textureData, worldData } from "../init/world-data.js";
import { SETTINGS, PLAYER_STATE, togglePointerLock, worldX, worldY } from "./movement.js";
import { updateUnits } from './units.js';



const renderer = document.getElementById('renderer');
export const cellPool = new Map();
const cardboardMap = new Map();

export const canvas = document.getElementById('floor');
export const ctx = canvas.getContext('2d');
let lastWorldX = worldX;
let lastWorldY = worldY;


// Double buffering
export const bufferCanvas = document.createElement('canvas');
export const bufferCtx = bufferCanvas.getContext('2d');

ctx.imageSmoothingEnabled = false;
bufferCtx.imageSmoothingEnabled = false;
canvas.style.imageRendering = 'pixelated';
bufferCanvas.style.imageRendering = 'pixelated';

async function initFloorCanvas() {
    canvas.width = renderer.clientWidth;
    canvas.height = renderer.clientHeight;
    canvas.style.transformStyle = 'preserve-3d';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = 2;

    canvas.style.imageRendering = 'pixelated';
    canvas.style.msInterpolationMode = 'nearest-neighbor';

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    bufferCanvas.style.imageRendering = 'pixelated';
    bufferCanvas.style.msInterpolationMode = 'nearest-neighbor';

    bufferCanvas.imageSmoothingEnabled = false;
    bufferCanvas.mozImageSmoothingEnabled = false;
    bufferCanvas.webkitImageSmoothingEnabled = false;
    bufferCanvas.msImageSmoothingEnabled = false;

    bufferCtx.imageSmoothingEnabled = false;
    bufferCtx.mozImageSmoothingEnabled = false;
    bufferCtx.webkitImageSmoothingEnabled = false;
    bufferCtx.msImageSmoothingEnabled = false;

    bufferCanvas.width = renderer.clientWidth * 4; 
    bufferCanvas.height = renderer.clientHeight * 2;

    canvas.width = renderer.clientWidth * 4; 
    canvas.height = renderer.clientHeight * 2;

    await Promise.all(
        [...uniqueTextures].map(loadTexture)
    );
        
}


const textureCache = new Map(); // Cache loaded images

async function loadTexture(name) {
    if (textureCache.has(name)) return textureCache.get(name);
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            textureCache.set(name, img);
            resolve(img);
        };
        img.src = `./art/textures/${name}`; // fixed
    });
}

export async function drawDebugGrid() {

    if (SETTINGS.debug === false) {
        drawFloor();
        return;
    }


    const cellSize = 250 / 5; // Match the cell size used in drawFloor()
    const startX = Math.floor(worldX - SETTINGS.sightRange - 5);
    const endX = Math.ceil(worldX + SETTINGS.sightRange + 5);
    const startY = Math.floor(worldY - SETTINGS.sightRange);
    const endY = Math.ceil(worldY + SETTINGS.sightRange);



    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (y < 0 || y >= textureData.length || x < 0 || x >= textureData[0].length) continue;
            
            const screenX = (x - worldX + SETTINGS.sightRange + 5) * cellSize;
            const screenY = (y - worldY + SETTINGS.sightRange) * cellSize;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            if (SETTINGS.debug === true) {
                ctx.lineWidth = 1;
            } else {
                ctx.lineWidth = 0;
            }
            
            ctx.strokeRect(screenX, screenY, cellSize, cellSize);
        }
    }
}


export async function drawFloor() {
    const cellSize = 250 / 5;
    const fractionalX = Math.floor(worldX % 1);
    const fractionalY = Math.floor(worldY % 1);
    
    const xPadding = 5; // Extra cells in X direction
    const startX = Math.floor(worldX - SETTINGS.sightRange - xPadding);
    const endX = Math.ceil(worldX + SETTINGS.sightRange + xPadding);
    const startY = Math.floor(worldY - SETTINGS.sightRange);
    const endY = Math.ceil(worldY + SETTINGS.sightRange);

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
            
            const texture = worldData.map[y][x].texture;
            if (!texture) continue;

            const screenX = (x - worldX + SETTINGS.sightRange + xPadding) * cellSize;

            const screenY = (y - worldY + SETTINGS.sightRange) * cellSize;

            const elevation = worldData.map[y][x].height; // 0-25 range

            // Apply elevation-based brightness
            const adjustedTexture = await loadElevationAdjustedTexture(
                texture,
                worldData.map[y][x].height
            );
            bufferCtx.drawImage(adjustedTexture, screenX, screenY, cellSize, cellSize);

            // display grid lines
            if (SETTINGS.debug === true) {
            bufferCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            bufferCtx.lineWidth = 1;
            bufferCtx.strokeRect(screenX, screenY, cellSize, cellSize);
            }


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

const elevationCache = new Map();

async function loadElevationAdjustedTexture(name, elevation) {
    const cacheKey = `${name}_${elevation}`;
    if (elevationCache.has(cacheKey)) return elevationCache.get(cacheKey);
    
    const original = await loadTexture(name);
    const canvas = document.createElement('canvas');
    canvas.width = original.naturalWidth;
    canvas.height = original.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    // Apply brightness adjustment
    ctx.filter = `brightness(${getElevationBrightness(elevation)})`;
    ctx.drawImage(original, 0, 0);
    
    elevationCache.set(cacheKey, canvas);
    return canvas;
}

function getElevationBrightness(elevation) {
    // Convert 0-25 range to 70%-130% brightness (adjust as needed)
    return 0.8 + (elevation / 20) * 0.8;
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



export function updateVisibleArea() {
    const centerX = Math.round(worldX);
    const centerY = Math.round(worldY);
    
    const minX = Math.max(0, centerX - SETTINGS.sightRange - 5);
    const maxX = Math.min(1999, centerX + SETTINGS.sightRange + 5);
    const minY = Math.max(0, centerY - SETTINGS.sightRange);
    const maxY = Math.min(1999, centerY + SETTINGS.sightRange);
    
    // Remove out-of-view cells
    cellPool.forEach((cell, key) => {
        const [x, y] = key.split(',').map(Number);
        if (x < minX || x >= maxX || y < minY || y > maxY) {
            removeCell(key, cell)
        }
    });
    

    const rendererWidth = renderer.clientWidth;
    const rendererHeight = renderer.clientHeight;
    const cellSize = Math.min(
        rendererWidth / (SETTINGS.sightRange * 2), 
        rendererHeight / (SETTINGS.sightRange * 2)
    );
    
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x < maxX; x++) {
            const key = `${x},${y}`;
            if (!cellPool.has(key) && worldData.map[y][x].vegetation) {
                const data = worldData.map[y][x].vegetation;
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
    element.dataset.worldX = x;
    element.dataset.worldY = y;
    element.style.width = `${cellSize}px`;
    element.style.height = `${cellSize}px`;

    element.dataset.elevation = data.vegetation.elevation;
    
    const cardboard = document.createElement('div');
    cardboard.className = 'tree';
    cardboard.classList.add('cardboard');
    cardboard.classList.add(`${data.vegetation.size}`);
    //cardboard.style.animation = data.vegetation.animation;
    cardboard.style.backgroundImage = `url("../art/vegetation/${data.vegetation.type}/${data.vegetation.size}/${data.vegetation.variation}.png")`;
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

export function updateAllPositions() {
    const rendererWidth = renderer.clientWidth;
    const rendererHeight = renderer.clientHeight;
    const cellSize = Math.min(
        rendererWidth / (SETTINGS.sightRange * 2), 
        rendererHeight / (SETTINGS.sightRange * 2)
    );
    
    cellPool.forEach(cell => {

        const dx = cell.x - worldX;
        const dy = cell.y - worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const posX = (rendererWidth / 2) + (dx * cellSize);
        const posY = (rendererHeight / 2) + (dy * cellSize);

        const scale = 20 - (10 * distance * 2 / SETTINGS.sightRange);

        const elevation = cell.element.dataset.elevation;
        cell.element.style.transform = `
            translate3d(${posX}px, ${posY}px, ${0}px)
        `;

    });
}


export function updateAllCardboardRotations() {
    cardboardMap.forEach((_, cardboard) => {
        cardboard.style.setProperty('--rotation-z', `${SETTINGS.yaw}deg`);
    });
}

export function applyNeoTransforms() {
  renderer.style.transform = `
    rotateX(${SETTINGS.pitch}deg)  /* Pitch - applied first */
    rotateZ(${SETTINGS.yaw}deg) /* Yaw - applied second */
    scale3d(${SETTINGS.zoom}, ${SETTINGS.zoom}, ${SETTINGS.zoom}) 
    translate3d(${SETTINGS.translateX}px, ${SETTINGS.translateY}px, ${SETTINGS.translateZ}px) 
    `;
}



export function initRenderer() {
    cellPool.clear();
    //togglePointerLock();
    applyNeoTransforms();
    updateVisibleArea();
    initFloorCanvas();
}