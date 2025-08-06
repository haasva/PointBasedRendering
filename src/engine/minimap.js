import { canvas } from "./renderer.js";
import { PLAYER_STATE, SETTINGS } from "./movement.js";

const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');
const minimapPlayer = document.getElementById('minimap-player');

// Set minimap dimensions (smaller than main canvas)
minimap.width = 200;
minimap.height = 200;

export function updateMinimap() {

    const worldX = PLAYER_STATE.coordinate.x; 
    const worldY = PLAYER_STATE.coordinate.y; 
    // 1. Copy and scale main canvas
    minimapCtx.imageSmoothingEnabled = true;
    minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
    minimapCtx.drawImage(
        canvas, // Your main floor canvas
        0, 0, canvas.width, canvas.height,
        0, 0, minimap.width, minimap.height
    );
    
    // 2. Update player position
    // const playerX = (worldX / 500) * minimap.width;
    // const playerY = (worldY / 500) * minimap.height;
    // minimapPlayer.style.left = `${playerX}px`;
    // minimapPlayer.style.top = `${playerY}px`;
    
    // // 3. Draw viewport rectangle (optional)
    // minimapCtx.strokeStyle = 'red';
    // minimapCtx.lineWidth = 1;
    // minimapCtx.strokeRect(
    //     (worldX - SETTINGS.sightRange) / 500 * minimap.width,
    //     (worldY - SETTINGS.sightRange) / 500 * minimap.height,
    //     (SETTINGS.sightRange * 2) / 500 * minimap.width,
    //     (SETTINGS.sightRange * 2) / 500 * minimap.height
    // );
}