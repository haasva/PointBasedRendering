import { uniqueTextures, vegetationData, textureData } from "../init/world-data.js";
import { SETTINGS, PLAYER_STATE, togglePointerLock, worldX, worldY } from "./movement.js";


let sightRange = 20;



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

    bufferCanvas.width = renderer.clientWidth * 10; 
    bufferCanvas.height = renderer.clientHeight * 10;

    canvas.width = renderer.clientWidth * 10; 
    canvas.height = renderer.clientHeight * 10;

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
        img.src = `./textures/${name}`; // fixed
    });
}


export async function drawFloor() {
    const cellSize = 125;
    const fractionalX = Math.floor(worldX % 0.5);
    const fractionalY = Math.floor(worldY % 0.5);
    
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

const screenX = (x - worldX + sightRange) * cellSize;
const screenY = (y - worldY + sightRange) * cellSize;

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
    cardboard.style.backgroundImage = `url("../../vegetation/arid-montane/${data.vegetation.size}/${data.vegetation.variation}.png")`;
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
    scale3d(800, 800, 800) 
    translate3d(0px, 0px, ${SETTINGS.translateZ}dvh) 
    `;
}



export function initRenderer() {
    cellPool.clear();
    togglePointerLock();
    applyNeoTransforms();
    updateVisibleArea();
    initFloorCanvas();
}