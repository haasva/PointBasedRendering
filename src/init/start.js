import { initRenderer } from "../engine/renderer.js";
import { gameLoop } from "../engine/movement.js";
import { generateWorldData } from "./world-data.js";

async function startGame() {
    await generateWorldData();
    initRenderer();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', async () => {
    await startGame();
});

