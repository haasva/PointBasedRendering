import { PLAYER_STATE, SETTINGS, worldX, worldY } from "../engine/movement.js";
import { drawDebugGrid, applyNeoTransforms, drawFloor, updateAllPositions, updateVisibleArea, updateAllCardboardRotations } from "../engine/renderer.js";
import { updateMinimap } from "./minimap.js";
import { togglePointerLock } from "../engine/movement.js"

import { setWorldPosition } from "../engine/movement.js";

import { worldData } from "../init/world-data.js";

 
const worldMap = document.getElementById('world-map');
console.log(worldMap);

let menuVisible = true;
const menu = document.getElementById('menu');
const worldinfo = menu.querySelector('#world-info');

let isDragging = false;
let lastX = 0;
let lastY = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === 'e') {
        e.preventDefault();
        SETTINGS.debug = !SETTINGS.debug;
        drawDebugGrid();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        //togglePointerLock();
        menuVisible = !menuVisible;
        if (menu) {
            menu.style.visibility = menuVisible ? 'visible' : 'hidden';
        }
    }
});

worldMap.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    const rect = worldMap.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / 300 * 2000;
    const clickY = (e.clientY - rect.top) / 300 * 2000;
    setWorldPosition(clickX, clickY);
    console.log('data to: ', clickX, clickY);
    lastX = clickX;
    lastY = clickY;
});

worldMap.addEventListener('mousemove', (e) => {
    const rect = worldMap.getBoundingClientRect();
    const currentX  = (e.clientX - rect.left) / 300 * 2000;
    const currentY  = (e.clientY - rect.top) / 300 * 2000;
    const data = getWorldInfo(currentX, currentY);
    if (data.vegetation) {
    console.log(data);
    }
    worldinfo.querySelector('#climate').textContent = `${data.climate}`;
    worldinfo.querySelector('#terrain').textContent = `${data.terrain}`;
    worldinfo.querySelector('#mountain').textContent = `${data.mountain}`;
    worldinfo.querySelector('#desert').textContent = `${data.desert}`;
    if (!isDragging) return;
    e.preventDefault();
    setWorldPosition(currentX, currentY);
    lastX = currentX;
    lastY = currentY;
});

worldMap.addEventListener('mouseup', () => {
    isDragging = false;
});

function getWorldInfo(x, y) {

    const cellX = Math.min(
            worldData.map[0].length - 1, // Max X bound
            Math.max(0, Math.floor(x)) // Min X bound
    );
    const cellY = Math.min(
            worldData.map.length - 1, // Max Y bound
            Math.max(0, Math.floor(y)) // Min Y bound
    );
    return worldData.map[cellY][cellX];
}