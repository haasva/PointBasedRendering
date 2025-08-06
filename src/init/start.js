import { initRenderer } from "../engine/renderer.js";
import { gameLoop } from "../engine/movement.js";
import { generateWorldData } from "./world-data.js";

function startGame() {
    generateWorldData();
    initRenderer();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("DOMContentLoaded", startGame);



