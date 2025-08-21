import { initRenderer } from "../engine/renderer.js";
import { gameLoop } from "../engine/movement.js";
import { generateWorldData } from "./world-data.js";
import { createInitialUnits } from "../engine/units.js";
import { gameData, loadAllData } from './gamedata.js';





async function startGame() {
    await loadAllData();
    await generateWorldData();
    initRenderer();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', async () => {
    await startGame();
    console.log(gameData);
    createInitialUnits();
});




