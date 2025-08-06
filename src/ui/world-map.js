import { updatePositionInfo, PLAYER_STATE, SETTINGS, worldX, worldY } from "../engine/movement.js";
import { applyNeoTransforms, drawFloor, updateAllPositions, updateVisibleArea, updateAllCardboardRotations } from "../engine/renderer.js";
import { updateMinimap } from "./minimap.js";
import { togglePointerLock } from "../engine/movement.js"

import { setWorldPosition } from "../engine/movement.js";

 
const worldMap = document.getElementById('world-map');
console.log(worldMap);

let menuVisible = false;
const menu = document.getElementById('menu');

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

worldMap.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = worldMap.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / 1500 * 1000;
    const clickY = (e.clientY - rect.top) / 1500 * 1000;
    
    setWorldPosition(clickX, clickY);
    console.log('teleported to: ', clickX, clickY);
});