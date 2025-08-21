import { SETTINGS, PLAYER_STATE, togglePointerLock, worldX, worldY } from "./movement.js";
import { cellPool, ctx, drawFloor } from './renderer.js';
import { uniqueTextures, vegetationData, textureData, worldData } from "../init/world-data.js";

import { processAdventurers } from "../init/adventurers-init.js";

import { gameData } from "../init/gamedata.js";

import { clearSelectionMenu } from "../ui/menu-selection.js";

import { updateSelectionMenu } from "../ui/selection-square.js";


// units.js
export const units = new Map(); // key: unitId, value: unitData

export const selectUnits = new Set(); // Set of selected unit IDs

const renderer = document.getElementById('renderer');

const floor = document.getElementById('floor');
const engineWrapper = document.getElementById('engine-wrapper');

const cursorIndicator = document.createElement('div');
cursorIndicator.className = 'cursor-indicator';
renderer.appendChild(cursorIndicator);

let worldClickX;
let worldClickY;

let worldHoverX;
let worldHoverY;

export class Unit {
  constructor(x, y, type, player) {
    this.id = Math.random().toString(36).substring(2, 15);
    this.x = x;
    this.y = y;
    this.type = type;
    this.player = player;
    this.element = null;
    this.data = {
      elevation: 0,
      movementSpeed: 0.05,
      adventurer: null // created later
    };
  }

  findCorrespondingAdventurer() {
    return gameData.adventurers.find(
      adv => adv.Title.toLowerCase() === this.type.toLowerCase()
    );
  }

  async initAdventurer() {
    const adventurer = this.findCorrespondingAdventurer();
    await processAdventurers(adventurer);
    this.data.adventurer = adventurer;
    this.data.movementSpeed = this.data.movementSpeed + (this.data.adventurer.Speed / 100);
  }
}



export async function createInitialUnits() {
  const caravaner = new Unit(852, 284.8, 'caravaner', 1);
  units.set(caravaner.id, caravaner);

  // after the Unit exists, initialize its adventurer
  await caravaner.initAdventurer();
}

const createButton = document.getElementById('createRandomAdventurer');

createButton.addEventListener('click', (e) => {
  addNewUnit(worldX, worldY);
});

export async function addNewUnit(x, y) {
  const randomUnitType = gameData.adventurers[Math.floor(Math.random() * gameData.adventurers.length)].Title.toLowerCase();
  const newUnit = new Unit(x, y, randomUnitType, 1);
  await newUnit.initAdventurer();
  units.set(newUnit.id, newUnit);
  console.log(`New unit created: ${newUnit.type} at (${x}, ${y})`);

}




// rendering.js
export function updateUnits() {
  const rendererWidth = renderer.clientWidth;
  const rendererHeight = renderer.clientHeight;
  const cellSize = Math.min(
    rendererWidth / (SETTINGS.sightRange * 2),
    rendererHeight / (SETTINGS.sightRange * 2)
  );

  units.forEach(unit => {
    // Create element if doesn't exist
    if (!unit.element) {
      unit.element = createUnitElement(unit);
      renderer.appendChild(unit.element);
    }

    // Calculate screen position
    const dx = unit.x - worldX;
    const dy = unit.y - worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only render if within extended view range
    if (distance <= SETTINGS.sightRange * 1.5) {
      const posX = (rendererWidth / 2) + (dx * cellSize);
      const posY = (rendererHeight / 2) + (dy * cellSize);
      
      unit.element.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
      unit.element.style.zIndex = Math.floor(unit.y);
      unit.element.style.display = 'block';
    } else {
      unit.element.style.display = 'none';
    }
  });
}

function createUnitElement(unit) {
  const element = document.createElement('div');
  element.className = `unit ${unit.type} player-${unit.player}`;
  element.dataset.unitId = unit.id;
  element.dataset.unitType = unit.type;
  element.dataset.unitPlayer = unit.player;

  const sprite = document.createElement('div');
    sprite.className = 'unit-sprite';
    sprite.style.backgroundImage = `url(/art/adventurers/sprites/${unit.type}.png)` || `url(/art/adventurers/sprites/anchorite.png)`;
    element.appendChild(sprite);

  
  return element;
}

function selectUnit(unitId) {
  const unit = units.get(unitId);
    if (!unit) return;
    if (selectUnits.has(unitId)) {
        selectUnits.delete(unitId);
        unit.element.classList.remove('selected');
    } else {
        selectUnits.add(unitId);
        unit.element.classList.add('selected');

        console.log(unit);
        console.log(selectUnits);
        //displayAdventurerInfo(unit.data.adventurer);
    }
    updateSelectionMenu(selectUnits);
}

//select all units of the same type 
document.body.addEventListener('dblclick', (e) => {
  if (e.button === 0) {
    if (e.target.classList.contains('unit')) {
      const unitId = e.target.dataset.unitId;
      const unit = units.get(unitId);
      if (unit) {
        selectUnits.clear();
        document.querySelectorAll('.unit').forEach(el => el.classList.remove('selected'));
        // Select all units of the same type
        units.forEach(u => {
          if (u.type === unit.type && u.player === unit.player) {
            selectUnits.add(u.id);
            u.element.classList.add('selected');
          }
        });
      }
    } else if (e.target.classList.contains('unit-sprite')) {
      const unitId = e.target.parentElement.dataset.unitId;
      const unit = units.get(unitId);
      if (unit) {
        selectUnits.clear();
        document.querySelectorAll('.unit').forEach(el => el.classList.remove('selected'));
        // Select all units of the same type
        units.forEach(u => {
          if (u.type === unit.type && u.player === unit.player) {
            selectUnits.add(u.id);
            u.element.classList.add('selected');
          }
        });
      }
    }
    updateSelectionMenu(selectUnits);
  }
});




document.body.addEventListener('click', (e) => {
    // if left click
if (e.button === 0) {
    if (e.target.classList.contains('unit')) {
        selectUnits.clear();
        document.querySelectorAll('.unit').forEach(el => el.classList.remove('selected'));
        const unitId = e.target.dataset.unitId;
        selectUnit(unitId);
    } else if (e.target.classList.contains('unit-sprite')) {
        selectUnits.clear();
        document.querySelectorAll('.unit').forEach(el => el.classList.remove('selected'));
        const unitId = e.target.parentElement.dataset.unitId;
        selectUnit(unitId);
    }
}

});

export function drawHoverSquare(x, y) {
    // Clear previous hover square



    const cellSize = 250 / 5;
    const xPadding = 5;
    
    // Snap to grid
    const snappedX = Math.floor(x);
    const snappedY = Math.floor(y);
    
    // Calculate screen position for the snapped grid cell
    const screenX = (snappedX - worldX + SETTINGS.sightRange + xPadding) * cellSize;
    const screenY = (snappedY - worldY + SETTINGS.sightRange) * cellSize;
    
    // // Draw the snapped grid square
    // ctx.strokeStyle = '#00ff00';
    // ctx.lineWidth = 2;
    // ctx.strokeRect(screenX, screenY, cellSize, cellSize);
    
    // // Optional: Show sub-cell position indicator
    const subX = (x - snappedX) * cellSize;
    const subY = (y - snappedY) * cellSize;
    
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(screenX + subX, screenY + subY, 3, 0, Math.PI * 2);
    ctx.fill();

}

let lastHoveredCell = null;

// Clear highlight when mouse leaves
renderer.addEventListener('mouseleave', () => {
    if (currentCellHighlight) {
        currentCellHighlight.remove();
        currentCellHighlight = null;
    }
});

renderer.addEventListener('mousemove', (e) => {
    e.preventDefault();
    
    // 1. Get renderer dimensions and mouse position
    const rect = renderer.getBoundingClientRect();
    const rendererWidth = rect.width;
    const rendererHeight = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    
    // Base calibration values
    const xScale = 2.25;
    const yScale = 1.9;
    const xOffset = -1.15;
    const yOffset = 1;
    
    const normX = mouseX / rendererWidth;
    const normY = mouseY / rendererHeight;
    
    const perspectiveFactor = 0.1;
    
    const perspectiveOffsetX = (normX - 0.5) * 2;
    const perspectiveInfluence = (normY - 0.5) * 2;
    
    // Apply perspective correction
    const dynamicOffsetX = perspectiveOffsetX * perspectiveInfluence * perspectiveFactor * SETTINGS.sightRange;
    
    worldClickX = (normX * SETTINGS.sightRange * xScale) + 
                       (worldX - SETTINGS.sightRange + xOffset - dynamicOffsetX) - 0.3;

const centerCompensation = 2.0;
const yCenterBias = Math.abs(normY - 0.5) * 2;
const yAdjustment = centerCompensation * (1 - yCenterBias);

  worldClickY = (normY * SETTINGS.sightRange * yScale) + 
                   (worldY - SETTINGS.sightRange + yOffset + (yAdjustment / 2)) - 0.4;

    
    e.stopPropagation();

    const hoveredCell = getHoveredCellData(worldClickX + 0.2, worldClickY + 0.5);
    
    if (hoveredCell && (!lastHoveredCell || 
        hoveredCell.coordinates.cellX !== lastHoveredCell.coordinates.cellX || 
        hoveredCell.coordinates.cellY !== lastHoveredCell.coordinates.cellY)) {
        
        // Cell changed - update UI
        updateCellInfo(hoveredCell);
        lastHoveredCell = hoveredCell;
        highlightHoveredCell(lastHoveredCell);
        
        
    }
});

let currentCellHighlight = null;

function highlightHoveredCell(cellData) {
    // Remove previous highlight
    if (currentCellHighlight) {
        currentCellHighlight.remove();
        currentCellHighlight = null;
    }
    
    if (!cellData) return;
    
    // Create new highlight
    currentCellHighlight = document.createElement('div');
    currentCellHighlight.className = 'cell-highlight';
    
    // Calculate screen position using the same method as units/flags
    const rendererWidth = renderer.clientWidth;
    const rendererHeight = renderer.clientHeight;
    const cellSize = Math.min(
        rendererWidth / (SETTINGS.sightRange * 2),
        rendererHeight / (SETTINGS.sightRange * 2)
    );
    
    const dx = cellData.coordinates.cellX - worldX;
    const dy = cellData.coordinates.cellY - worldY;
    const posX = (rendererWidth / 2) + (dx * cellSize);
    const posY = (rendererHeight / 2) + (dy * cellSize);
    
    // Position the highlight
    currentCellHighlight.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
    currentCellHighlight.style.width = `${cellSize}px`;
    currentCellHighlight.style.height = `${cellSize}px`;
    
    // Add to renderer
    renderer.appendChild(currentCellHighlight);

    // update worldHoverX to center of the cell position
    worldHoverX = cellData.coordinates.cellX;
    worldHoverY = cellData.coordinates.cellY;
    

}

function updateCellInfo(cellData) {
  const x = cellData.coordinates.cellX;
  const y = cellData.coordinates.cellY;

    const tip = document.querySelector('#position-info');
    tip.querySelector('#pos-x').textContent = `X: ${x}`;
    tip.querySelector('#pos-y').textContent = `Y: ${y}`;
    tip.querySelector('#cell-data').textContent = `${cellData.terrain}`;
}


function getHoveredCellData(worldX, worldY) {
    const cellX = Math.floor(worldX);
    const cellY = Math.floor(worldY);
    if (cellX < 0 || cellX >= worldData.map[0].length || 
        cellY < 0 || cellY >= worldData.map.length) {
        return null;
    }
    const cellData = worldData.map[cellY][cellX];
    
    return {
        ...cellData,
        coordinates: {
            cellX,
            cellY,
            subX: worldX - cellX, // 0.0 to 1.0
            subY: worldY - cellY  // 0.0 to 1.0
        },
        worldX,
        worldY
    };
}





document.body.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

document.body.addEventListener('mousedown', (e) => {
if (e.button === 2 && e.target.id === 'floor') {
    e.preventDefault();
    if (lastHoveredCell.terrain === 'water' || lastHoveredCell.terrain === 'mountain') {
      return;
    } else {
        unitManager.moveSelectedUnits(worldHoverX, worldHoverY);
        createMoveFlag(worldHoverX, worldHoverY);
    }

    
    console.log(`Moving to: X ${worldClickX.toFixed(1)}, Y ${worldClickY.toFixed(1)}`);
}
});


function createMoveFlag(x, y) {
const rendererWidth = renderer.clientWidth;
  const rendererHeight = renderer.clientHeight;
  const cellSize = Math.min(
    rendererWidth / (SETTINGS.sightRange * 2),
    rendererHeight / (SETTINGS.sightRange * 2)
  );
    const dx = x - worldX;
    const dy = y - worldY;
    const posX = (rendererWidth / 2) + (dx * cellSize);
    const posY = (rendererHeight / 2) + (dy * cellSize);
      
    const flag = document.createElement('div');
    flag.className = 'move-flag';

    flag.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;

    renderer.appendChild(flag);
    
    // Remove after a short delay
    setTimeout(() => {
        if (flag.parentNode) {
            flag.parentNode.removeChild(flag);
        }
    }, 200);
}

const unitPositionCache = new Map();


export class UnitManager {
    constructor() {}

    moveSelectedUnits(targetX, targetY) {
        selectUnits.forEach(unitId => {
            const unit = units.get(unitId);
            if (unit) {
                unit.target = { x: targetX, y: targetY };
                unit.path = this.calculatePath(unit.x, unit.y, targetX, targetY);
                unit.isMoving = true;
                const sprite = unit.element.querySelector('.unit-sprite');

                if (unit.target.x > unit.x) {
                  sprite.classList.add('right');
                  sprite.classList.remove('left');
                } else if (unit.target.x < unit.x) {
                  sprite.classList.add('left');
                  sprite.classList.remove('right');
                } else {
                  sprite.classList.remove('left');
                  sprite.classList.remove('right');
                }
            }
        });
    }

updateUnitPositions() {
    units.forEach(unit => {
        if (!unit.target) return;

        // Check if target cell will be occupied when we arrive
        const targetCellX = Math.round(unit.target.x);
        const targetCellY = Math.round(unit.target.y);
      

        const dx = unit.target.x - unit.x;
        const dy = unit.target.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.1) {
            const ratio = unit.data.movementSpeed / distance;
            unit.x += dx * ratio;
            unit.y += dy * ratio;
        } else {
            this.snapUnitToGrid(unit);

            unit.target = null;
            unit.path = null;
            this.updateUnitVisualPosition(unit, true);
        }
    });
}

willCellBeOccupied(cellX, cellY, excludingUnitId = null) {
    return Array.from(units.values()).some(otherUnit => {
        if (otherUnit.id === excludingUnitId || !otherUnit.target) return false;
        
        const otherTargetX = Math.round(otherUnit.target.x);
        const otherTargetY = Math.round(otherUnit.target.y);
        
        return otherTargetX === cellX && otherTargetY === cellY;
    });
}

snapUnitToGrid(unit) {
    // Snap to nearest grid cell
    const targetCellX = Math.round(unit.target.x);
    const targetCellY = Math.round(unit.target.y);
    
    // Check if target cell is occupied
    if (!this.isCellOccupied(targetCellX, targetCellY, unit.id)) {
        // Cell is free - snap to center
        unit.x = targetCellX + 0.1;
        unit.y = targetCellY + 0.1;
        return;
    }
    
    // Cell occupied - find nearest empty cell
    const emptyCell = this.findNearestEmptyCell(targetCellX, targetCellY, unit.id);
    if (emptyCell) {

        unit.x = emptyCell.x + 0.1;
        unit.y = emptyCell.y + 0.1;
        
    } else {
        // No empty cells nearby - stay at current position
        unit.x = Math.round(unit.x);
        unit.y = Math.round(unit.y);
    }
    
    
}

rerouteUnitToEmptyCell(unit, originalTargetX, originalTargetY) {
    const targetCellX = Math.round(originalTargetX);
    const targetCellY = Math.round(originalTargetY);
    
    // Find nearest empty cell
    const emptyCell = this.findNearestEmptyCell(targetCellX, targetCellY, unit.id);
    
    if (emptyCell) {
        // Create new move order to the empty cell's center
        const newTargetX = emptyCell.x + 0.5;
        const newTargetY = emptyCell.y + 0.5;
        
        // Update unit's target
        unit.target = { x: newTargetX, y: newTargetY };
        unit.path = this.calculatePath(unit.x, unit.y, newTargetX, newTargetY);
        
        // Visual feedback for re-routing
        //this.showRerouteIndicator(unit, newTargetX, newTargetY);
        
        console.log(`Unit ${unit.id} rerouted to ${newTargetX}, ${newTargetY}`);
        unit.x = emptyCell.x;
        unit.y = emptyCell.y;
        
        return true;
    } else {
        // No empty cells found - stop the unit
        unit.target = null;
        unit.path = null;
        console.log(`Unit ${unit.id} cannot find empty cell - stopping`);
        return false;
    }
    
}

isCellOccupied(cellX, cellY, excludingUnitId = null) {
    return Array.from(units.values()).some(otherUnit => {
        if (otherUnit.id === excludingUnitId) return false;
        
        const otherCellX = Math.floor(otherUnit.x);
        const otherCellY = Math.floor(otherUnit.y);
        
        return otherCellX === cellX && otherCellY === cellY;
    });
}

findNearestEmptyCell(startX, startY, excludingUnitId = null, maxRadius = 5) {
    // Spiral search pattern for nearest empty cell
    for (let radius = 1; radius <= maxRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                    const checkX = startX + dx;
                    const checkY = startY + dy;
                    
                    // Check bounds
                    if (checkX < 0 || checkY < 0 || 
                        checkX >= 1999 || checkY >= 1999) {
                        continue;
                    }
                    
                    // Check if cell is empty and accessible
                    if (!this.isCellOccupied(checkX, checkY, excludingUnitId) &&
                        this.isCellAccessible(checkX, checkY)) {
                        return { x: checkX, y: checkY };
                    }
                }
            }
        }
    }
    return null; // No empty cell found
}

isCellAccessible(cellX, cellY) {
    // Check if cell is walkable (not water, mountain, etc.)
    const cellData = worldData.map[cellY]?.[cellX];
    return cellData && 
           cellData.terrain !== 'water' && 
           cellData.terrain !== 'mountain' &&
           cellData.terrain !== 'impassable';
}

    updateUnitVisualPosition(unit, forceUpdate = false) {
        const cacheKey = `${unit.x.toFixed(3)},${unit.y.toFixed(3)}`;

        if (!forceUpdate && unitPositionCache.get(unit.id) === cacheKey) {
            return;
        }

        unitPositionCache.set(unit.id, cacheKey);

        const rendererWidth = renderer.clientWidth;
        const rendererHeight = renderer.clientHeight;
        const cellSize = Math.min(
            rendererWidth / (SETTINGS.sightRange * 2), 
            rendererHeight / (SETTINGS.sightRange * 2)
        );

        const dx = unit.x - worldX;
        const dy = unit.y - worldY;

        const posX = Math.round((rendererWidth / 2) + (dx * cellSize));
        const posY = Math.round((rendererHeight / 2) + (dy * cellSize));

        unit.element.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
        unit.element.style.willChange = unit.target ? 'transform' : 'auto';
    }

    calculatePath(startX, startY, targetX, targetY) {
        return [
            { x: startX, y: startY },
            { x: Math.floor(targetX), y: Math.floor(targetY) }
        ];
    }

}


export const unitManager = new UnitManager();



