
import { SETTINGS, worldX, worldY, setWorldPosition } from "../engine/movement.js";
import { units, selectUnits } from "../engine/units.js";
import { showTooltipAdventurer } from "./menu-selection.js";
import { displayAdventurerAttributes } from "./adventurer-stats-box.js";



const renderer = document.getElementById('renderer');

let currentActiveUnit = null;
const activeUnitImage = document.getElementById('unit-portrait');

activeUnitImage.addEventListener('mousedown', () => {
    if (currentActiveUnit != null) {
        const x = currentActiveUnit.x;
        const y = currentActiveUnit.y;
        setWorldPosition(x, y);
    }
});



export class SelectionSquare {
    constructor() {
        this.element = document.getElementById('selection-square');
        this.startX = 0;
        this.startY = 0;
        this.isSelecting = false;
    }

    startSelection(screenX, screenY) {
        this.isSelecting = true;
        
        // Store the initial click position for all directions
        this.startScreenX = screenX;
        this.startScreenY = screenY;
        this.startWorldX = this.screenToWorldX(screenX);
        this.startWorldY = this.screenToWorldY(screenY);
        
        // Initialize screen position
        this.element.style.left = `${screenX}px`;
        this.element.style.top = `${screenY}px`;
        this.element.style.width = '0px';
        this.element.style.height = '0px';
        this.element.classList.add('visible');
    }

    updateSelection(currentScreenX, currentScreenY) {
        if (!this.isSelecting) return;

        // Calculate the rectangle boundaries
        const left = Math.min(this.startScreenX, currentScreenX);
        const top = Math.min(this.startScreenY, currentScreenY);
        const right = Math.max(this.startScreenX, currentScreenX);
        const bottom = Math.max(this.startScreenY, currentScreenY);
        
        // Update the selection square position and size
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
        this.element.style.width = `${right - left}px`;
        this.element.style.height = `${bottom - top}px`;
    }

    endSelection(currentScreenX, currentScreenY, isEnd) {
        if (isEnd === true) {
            this.isSelecting = false;
            this.element.classList.remove('visible');
        }
        
        // Calculate world coordinates for both corners
        const startWorld = {
            x: this.startWorldX,
            y: this.startWorldY
        };
        
        const endWorld = {
            x: this.screenToWorldX(currentScreenX) - 0.1,
            y: this.screenToWorldY(currentScreenY)
        };
        
        return {
            minX: Math.min(startWorld.x, endWorld.x),
            minY: Math.min(startWorld.y, endWorld.y),
            maxX: Math.max(startWorld.x, endWorld.x),
            maxY: Math.max(startWorld.y, endWorld.y)
        };
    }

    screenToWorldX(screenX) {
        const rect = renderer.getBoundingClientRect();
        const mouseX = screenX - rect.left;
        const normX = mouseX / rect.width;
        
        const perspectiveOffsetX = (normX - 0.5) * 2;
        const perspectiveInfluence = (0.5 - 0.5) * 2; // Using center Y for consistency
        const dynamicOffsetX = perspectiveOffsetX * perspectiveInfluence * 0.1 * SETTINGS.sightRange;
        
        return (normX * SETTINGS.sightRange * 2.25) + 
               (worldX - SETTINGS.sightRange - 1.15 - dynamicOffsetX) - 0.3;
    }

    screenToWorldY(screenY) {
        const rect = renderer.getBoundingClientRect();
        const mouseY = screenY - rect.top;
        const normY = mouseY / rect.height;
        
        const centerCompensation = 2.0;
        const yCenterBias = Math.abs(normY - 0.5) * 2;
        const yAdjustment = centerCompensation * (1 - yCenterBias);
        
        return (normY * SETTINGS.sightRange * 1.9) + 
               (worldY - SETTINGS.sightRange + 1 + (yAdjustment / 2)) - 0.4;
    }
}

let selectionStartScreenX = 0;
let selectionStartScreenY = 0;






export let selectionSquare = new SelectionSquare();





let isMouseDown = false;



// Mouse down - start selection
renderer.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        selectionStartScreenX = e.clientX;
        selectionStartScreenY = e.clientY;
        selectionSquare.startSelection(e.clientX, e.clientY);
    }
});

// Mouse move - update selection
renderer.addEventListener('mousemove', (e) => {
    if (selectionSquare.isSelecting) {
        selectionSquare.updateSelection(e.clientX, e.clientY);
        const isEnd = false;
        const selectionArea = selectionSquare.endSelection(e.clientX, e.clientY, isEnd);
        const selected = selectUnitsInArea(selectionArea);

        selected.forEach(unit => {
            const selectedUnit = units.get(unit.id);
            selectUnits.add(selectedUnit.id); // add selected unit to the set
            if (selectedUnit) {
                console.log(selectedUnit);
                selectedUnit.element.classList.add('hovered'); // apply selected class to the unit element
            }
            
        });
    }
});

// Mouse up - end selection
renderer.addEventListener('mouseup', (e) => {
    if (e.button === 0 && selectionSquare.isSelecting) {
        const isEnd = true;
        const selectionArea = selectionSquare.endSelection(e.clientX, e.clientY, isEnd);
        const selected = selectUnitsInArea(selectionArea);

        selected.forEach(unit => {
            const selectedUnit = units.get(unit.id);
            selectUnits.add(selectedUnit.id); // add selected unit to the set
            if (selectedUnit) {
                console.log(selectedUnit);
                selectedUnit.element.classList.add('selected'); // apply selected class to the unit element
                selectedUnit.element.classList.remove('hovered'); // remove hovered class if it was applied
            }
            
        });


        console.log(selectUnits);
        updateSelectionMenu(selectUnits);

    }
});



export function updateSelectionMenu(selectUnits) {
    const selectionBox = document.getElementById('selections');

    selectionBox.innerHTML = ''; // Clear previous selections

    //find first unit in selectUnits
    const firstUnitId = selectUnits.values().next().value;
    const firstUnit = units.get(firstUnitId);
    if (firstUnit) {
        updateActiveSelectionUnit(firstUnit);
    } else {
        updateActiveSelectionUnit(null);
    }

    selectUnits.forEach(unitId => {
        const unit = units.get(unitId);
        const unitContainer = document.createElement('div');
        unitContainer.className = 'unit-container';
        unitContainer.dataset.unitId = unitId;

        const unitPic = document.createElement('div');
        unitPic.className = 'unit-icon';
        unitPic.style.backgroundImage = `url('/art/adventurers/${unit.data.adventurer.Title}.png')`;
        unitPic.style.border = `2px solid var(--${unit.data.adventurer.Rarity.toLowerCase()}-color)`;

        const unitBars = document.createElement('div');
        unitBars.className = 'unit-bars';

        const unitHealth = document.createElement('progress');
        unitHealth.className = 'unit-health';
        unitHealth.value = unit.data.adventurer.Life;
        unitHealth.max = unit.data.adventurer.MaxLife;

        unitBars.appendChild(unitHealth);

        unitContainer.appendChild(unitPic);
        unitContainer.appendChild(unitBars);

        
        // Add click event to select the unit
        unitContainer.addEventListener('click', () => {
            updateActiveSelectionUnit(unit);
        });
        unitContainer.addEventListener('dblclick', () => {
            const x = unit.x;
            const y = unit.y;
            setWorldPosition(x, y);
            selectUnits.clear(); // Clear previous selections
            selectUnits.add(unit.id); // Select this unit
            units.forEach(u => u.element.classList.remove('selected')); // Remove selected class from all units
            unit.element.classList.add('selected'); // Add selected class to this unit
            unit.element.classList.remove('hovered'); // Remove hovered class if it was applied
            console.log(`Selected unit: ${unit.id}`);
            updateSelectionMenu(selectUnits); // Update the selection menu
        });


        unitContainer.addEventListener('mouseenter', (event) => {
            unit.element.classList.add('hovered'); // Add selected class to this unit
            const adventurer = unit.data.adventurer;
            showTooltipAdventurer(event, adventurer);
        });
        unitContainer.addEventListener('mouseleave', () => {
            unit.element.classList.remove('hovered'); // Add selected class to this unit
        });

        selectionBox.appendChild(unitContainer);
    });
}


function updateActiveSelectionUnit(unit) {
    const activeSelectionUnit = document.getElementById('active-selection-unit');
    const selectionBox = document.getElementById('selections');

    console.log(activeSelectionUnit);
    if (unit) {
        const image = activeSelectionUnit.querySelector('#unit-portrait');
        image.style.backgroundImage = `url('/art/adventurers/${unit.data.adventurer.Title}.png')`;

        const name = activeSelectionUnit.querySelector('#unit-name');
        name.textContent = unit.data.adventurer.Title;

        const unitHealth = activeSelectionUnit.querySelector('.unit-health');
        unitHealth.value = unit.data.adventurer.Life;
        unitHealth.max = unit.data.adventurer.MaxLife;

        currentActiveUnit = unit;

        activeSelectionUnit.querySelector('.bottom')?.remove();
        const attributes = displayAdventurerAttributes(unit.data.adventurer);
        activeSelectionUnit.appendChild(attributes);
    }

    const unitContainers = selectionBox.querySelectorAll('.unit-container');
    unitContainers.forEach(cont => {
        if (cont.dataset.unitId === (unit ? unit.id : null)) {
            cont.classList.add('active');
        } else {
            cont.classList.remove('active');
        }
    });
}


function selectUnitsInArea(area) {
    const selectedUnits = [];
    
    units.forEach(unit => {
        if (isUnitInArea(unit, area)) {
            selectedUnits.push(unit);
            // unit.element.classList.add('selected');
            console.log(`Selected unit at: ${unit.x.toFixed(2)}, ${unit.y.toFixed(2)}`);
        } else {
            // remove unit from selectedUnits
            selectUnits.delete(unit.id);
            unit.element.classList.remove('selected'); // remove selected class if not in area
            unit.element.classList.remove('hovered'); // remove hovered class if not in area
        }
    });
    
    console.log(`Selection area: X[${area.minX.toFixed(2)}-${area.maxX.toFixed(2)}], Y[${area.minY.toFixed(2)}-${area.maxY.toFixed(2)}]`);
    console.log(`Selected ${selectedUnits.length} units`);
    return selectedUnits;
}

function isUnitInArea(unit, area) {
    return unit.x >= area.minX && 
           unit.x <= area.maxX && 
           unit.y >= area.minY && 
           unit.y <= area.maxY;
}

// World to screen conversion (reverse of your formula)
function worldToScreen(worldX, worldY) {
    const rendererWidth = renderer.clientWidth;
    const rendererHeight = renderer.clientHeight;
    const cellSize = Math.min(
        rendererWidth / (SETTINGS.sightRange * 2),
        rendererHeight / (SETTINGS.sightRange * 2)
    );
    
    const dx = worldX - worldX;
    const dy = worldY - worldY;
    
    return {
        x: (rendererWidth / 2) + (dx * cellSize),
        y: (rendererHeight / 2) + (dy * cellSize)
    };
}


