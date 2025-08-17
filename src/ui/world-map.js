import { updatePositionInfo, PLAYER_STATE, SETTINGS, worldX, worldY } from "../engine/movement.js";
import { applyNeoTransforms, drawFloor, updateAllPositions, updateVisibleArea, updateAllCardboardRotations } from "../engine/renderer.js";
import { updateMinimap } from "./minimap.js";
import { togglePointerLock } from "../engine/movement.js"

import { setWorldPosition } from "../engine/movement.js";

import { worldData } from "../init/world-data.js";

 
const worldMap = document.getElementById('world-map');
console.log(worldMap);

let menuVisible = false;
const menu = document.getElementById('menu');
const worldinfo = menu.querySelector('#world-info');

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        togglePointerLock();
        menuVisible = !menuVisible;
        if (menu) {
            menu.style.visibility = menuVisible ? 'visible' : 'hidden';
        }
    }
});

worldMap.addEventListener('mousemove', (e) => {

    e.preventDefault();
    const rect = worldMap.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / 1500 * 2000;
    const clickY = (e.clientY - rect.top) / 1500 * 2000;
    
    setWorldPosition(clickX, clickY);
    console.log('teleported to: ', clickX, clickY);
});

worldMap.addEventListener('mousemove', (e) => {

    const rect = worldMap.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / 1500 * 2000;
    const clickY = (e.clientY - rect.top) / 1500 * 2000;
    
    

    const data = getWorldInfo(clickX, clickY);
    if (data.vegetation) {
    console.log(data);
    }


    worldinfo.querySelector('#climate').textContent = `${data.climate}`;
    worldinfo.querySelector('#terrain').textContent = `${data.terrain}`;
    worldinfo.querySelector('#mountain').textContent = `${data.mountain}`;
    worldinfo.querySelector('#desert').textContent = `${data.desert}`;
    
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