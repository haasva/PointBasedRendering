import { initializeItems } from "./items-init.js"

export let gameData = new Object();
let areas = new Map(); // Initialize areas as a Map


export async function loadAllData() {
    gameData = {
        settlements: await loadJSONData('settlements'),
        buildings: await loadJSONData('buildings'),
        animals: await loadJSONData('animals'),
        overworld_locations: await loadJSONData('overworld_locations'),
        adventurers_by_area: await loadJSONData('adventurers_by_area'),
        adventurers: await loadJSONData('adventurers'),
        affixes: await loadJSONData('affixes'),
        class_combination: await loadJSONData('class-combination'),
        weapons: await loadJSONData('weapons'),
        factions: await loadJSONData('factions'),
        areas: await fetchAreasData(),
        vegetation: await loadJSONData('vegetation'),
    };

    await initializeItems();

    gameData.adventurersMap = new Map();

    window.gameData = gameData;

}






export async function fetchAreasData() {
  return fetch('/JSONData/areas.json')
    .then(response => response.json())
    .then(data => {
      // Assuming 'data' is an array of objects in 'areas.json'
      data.forEach(area => {
        const areaName = area.Name;
        areas[areaName] = {
          name: areaName,
          row: area.Row,
          col: area.Col,
          headerpic: area.Header,
          climate: area.Climate,
          posX: area.PosX,
          posY: area.PosY,
          connections: area.Connections,
          size: area.Size,
          cultures: area.Cultures,
          terrains: area.Terrains,
          faction: area.Faction,
          continent: area.Continent,
          color: getRandomColor()
        };
      });
      return areas;
    })
    .catch(error => {
      console.error('Error fetching areas data:', error);
      return null;
    });
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function loadJSONData(filename) {
    try {
    const response = await fetch(`/JSONData/${filename}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}
