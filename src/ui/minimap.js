import { bufferCanvas, ctx } from "../engine/renderer.js";
import { PLAYER_STATE, SETTINGS } from "../engine/movement.js";
import { worldData } from "../init/world-data.js";

const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');
const minimapPlayer = document.getElementById('minimap-player');

// Set minimap dimensions (smaller than main canvas)
const MINIMAP_SCALE = 4;

minimap.width = 10 * 2 * MINIMAP_SCALE;
minimap.height = 10 * 2 * MINIMAP_SCALE;

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT  = 2000;

export function updateMinimap() {
    const { x: worldX, y: worldY } = PLAYER_STATE.coordinate;
    const cellSize = 1; // 1 pixel per world unit on minimap
    const viewSize = SETTINGS.sightRange * 2;
    
    // Clear minimap
    minimapCtx.fillStyle = '#111';
    minimapCtx.fillRect(0, 0, minimap.width, minimap.height);
    
    // Calculate drawing bounds (2x sightRange in all directions)
    const startX = Math.max(0, worldX - SETTINGS.sightRange * MINIMAP_SCALE);
    const endX = Math.min(WORLD_WIDTH, worldX + SETTINGS.sightRange * MINIMAP_SCALE);
    const startY = Math.max(0, worldY - SETTINGS.sightRange * MINIMAP_SCALE);
    const endY = Math.min(WORLD_HEIGHT, worldY + SETTINGS.sightRange * MINIMAP_SCALE);
    
    // Draw world tiles
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = worldData.map[y][x];
            if (!tile) continue;
            
            // Convert world coords to minimap coords
            const mapX = x - (worldX - SETTINGS.sightRange * MINIMAP_SCALE);
            const mapY = y - (worldY - SETTINGS.sightRange * MINIMAP_SCALE);
            
            // Draw terrain
            minimapCtx.fillStyle = getTerrainColor(tile.terrain);
            minimapCtx.fillRect(mapX, mapY, 1, 1);
        }
    }
    
    // // Draw viewport rectangle (what's visible in main game)
    // const viewportX = SETTINGS.sightRange * (MINIMAP_SCALE - 1);
    // const viewportY = SETTINGS.sightRange * (MINIMAP_SCALE - 1);
    
    // minimapCtx.strokeStyle = '#fdfdfd93';
    // minimapCtx.lineWidth = 1;
    // minimapCtx.strokeRect(
    //     viewportX,
    //     viewportY,
    //     viewSize,
    //     viewSize
    // );
    
    // Draw player position
    // const playerX = SETTINGS.sightRange * MINIMAP_SCALE;
    // const playerY = SETTINGS.sightRange * MINIMAP_SCALE;
    
    // minimapCtx.fillStyle = '#ffff00';
    // minimapCtx.beginPath();
    // minimapCtx.arc(playerX, playerY, 2, 0, Math.PI * 2);
    // minimapCtx.fill();
}

// Helper function - define your terrain colors
function getTerrainColor(terrainType) {
    const colors = {
        water: '#1a5cb0',
        grass: '#3a7a3a',
        road: '#888888',
        farm: '#d4b16a'
    };
    return colors[terrainType] || '#3a7a3a';
}