const vegetationImage = new Image();
let vegetationLoaded = false;
const DATA_SIZE = 2000;
export let vegetationData = Array(DATA_SIZE).fill().map(() => Array(DATA_SIZE).fill(false));

const textureImage = new Image();
export let textureData = Array(DATA_SIZE).fill().map(() => Array(DATA_SIZE).fill(false));

export const uniqueTextures = new Set();

export let worldData = {
    map: Array(DATA_SIZE).fill().map(() => Array(DATA_SIZE).fill().map(() => ({}))),
    region: {}
}


async function loadTextureData() {
    // Load the texture color mapping from JSON
    const textureMap = await fetch('textures.json').then(res => res.json());

    // Create a lookup function to match RGB to texture name
    function getTextureFromRGB(r, g, b) {
        for (const entry of textureMap) {
            const [er, eg, eb] = entry.color;
            if (r === er && g === eg && b === eb) {
                return entry.name; // or .png if you're using PNG
            }
        }
        return 'default'; // fallback if no match
    }

    return new Promise((resolve) => {

        textureImage.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = textureImage.width;
            canvas.height = textureImage.height;
            const context = canvas.getContext('2d');
            context.drawImage(textureImage, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;

            // Ensure textureData is initialized
            const height = textureImage.height;
            const width = textureImage.width;
            textureData = new Array(height).fill(null).map(() => new Array(width).fill(null));

            // Loop over each pixel
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pos = (y * width + x) * 4;
                    const r = imageData[pos];
                    const g = imageData[pos + 1];
                    const b = imageData[pos + 2];

                    const textureName = getTextureFromRGB(r, g, b);
                    if (textureName !== 'baren') {
                      textureData[y][x] = `${textureName}.jpg`;
                      worldData.map[y][x].texture = `${textureName}.jpg`;
                      worldData.map[y][x].terrain = textureName;
                      worldData.map[y][x].terrainFromImage = true;
                    } else if (textureName === 'baren') {
                      worldData.map[y][x].terrainFromImage = false;
                    }

                }
            }

            resolve(); // Signal that it's done
        };

        textureImage.src = 'texture.bmp'; // Load your texture image
    });
}



class WorldDataLoader {
  constructor(dataSize) {
    this.DATA_SIZE = dataSize;
    this.loadedCount = 0;
    this.requiredLoads = 0;
    this.worldData = null;
  }

  async loadFromImage(source, type, processorFn) {
    this.requiredLoads++;
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2000;
        canvas.height = 2000;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        for (let y = 0; y < this.DATA_SIZE; y++) {
          for (let x = 0; x < this.DATA_SIZE; x++) {
            const pos = (y * canvas.width + x) * 4;
            processorFn(x, y, imageData, pos);
          }
        }
        
        this.loadedCount++;
        if (this.loadedCount === this.requiredLoads) {
          resolve(this.worldData);
        }
      };
      
      img.src = source;
    });
  }

  async loadAll(worldData) {
    this.worldData = worldData;
    await this.loadClimate(); 
    await this.loadMountains();
    await this.loadHeightmap();
    await this.loadDeserts(),
    await this.loadVegetation(); 
    return this.worldData;
}

  async loadVegetation() {
    return this.loadFromImage(
      'vegetation.bmp',
      'vegetation',
      (x, y, imageData, pos) => {
        const isVegetation = imageData[pos];
        
        if (isVegetation === 0 
          && this.worldData.map[y][x].terrain !== 'water' 
          && this.worldData.map[y][x].terrain !== 'road'
          && this.worldData.map[y][x].terrain !== 'farm'
            ) {
            const climate = this.worldData.map[y][x].climate;
            const height = this.worldData.map[y][x].height;

          const vegetation = this.generateVegetationData(climate, height);
          this.worldData.map[y][x].vegetation = vegetation;
        }
      }
    );
  }

async loadHeightmap() {
    return this.loadFromImage(
      'heightmap.bmp',
      'desert',
      (x, y, imageData, pos) => {
        // Extract grayscale value (0-255)
        const grayValue = imageData[pos]; // R channel (assuming grayscale)
        this.worldData.map[y][x].height = (255 - grayValue) / 10;
      }
    );
}

async loadDeserts() {
    return this.loadFromImage(
      'desert.bmp',
      'desert',
      (x, y, imageData, pos) => {
        // Extract grayscale value (0-255)
        const grayValue = imageData[pos]; // R channel (assuming grayscale)
        
        // Classify climate based on grayscale
        if (grayValue === 255) {
          this.worldData.map[y][x].desert = true;
          this.worldData.map[y][x].texture = 'desertic.jpg';
        } else {
          this.worldData.map[y][x].desert = false;
        }
      }
    );
}

async loadMountains() {
    return this.loadFromImage(
      'mountains.bmp',
      'mountains',
      (x, y, imageData, pos) => {
        // Extract grayscale value (0-255)
        const grayValue = imageData[pos]; // R channel (assuming grayscale)
        
        // Classify climate based on grayscale
        if (grayValue === 127) {
          this.worldData.map[y][x].mountain = true;
        } else {
          this.worldData.map[y][x].mountain = false;
        }
      }
    );
  }

  async loadClimate() {
    return this.loadFromImage(
      'climate.bmp',
      'climate',
      (x, y, imageData, pos) => {
        // Extract grayscale value (0-255)
        const grayValue = imageData[pos]; // R channel (assuming grayscale)
        
        // Classify climate based on grayscale
        if (grayValue === 255) {
          this.worldData.map[y][x].climate = 'arctic';
        } else if (grayValue === 192) {
          this.worldData.map[y][x].climate = 'temperate';
        } else if (grayValue === 128) {
          this.worldData.map[y][x].climate = 'arid';
        } else {
          this.worldData.map[y][x].climate = 'tropical';
        }

        this.setClimateTexture(this.worldData.map[y][x], this.worldData.map[y][x].climate);
      }
    );
  }

  setClimateTexture(mapData, climate) {
    if (mapData.terrainFromImage === true) return;
    if (climate === 'arctic') {
        mapData.terrain = 'tundra';
        mapData.texture = 'tundra.jpg';
    } else if (climate === 'temperate') {
        mapData.terrain = 'steppe3';
        mapData.texture = 'steppe3.jpg';
    } else if (climate === 'arid') {
        mapData.terrain = 'baren';
        mapData.texture = 'baren.jpg';
    } else if (climate === 'tropical') {
        mapData.terrain = 'jungle';
        mapData.texture = 'jungle.jpg';
    }
  }

  generateVegetationData(climate, height) {
    let data = {
        vegetation: {
            size: 0,
            variation: 0,
            type: '',
            elevation: height
        }
    };

    const sizeChance = Math.floor(Math.random() * 10) + 1;
    if (sizeChance > 4) {
        data.vegetation.size = 'Big';
        data.vegetation.variation = Math.floor(Math.random() * 9) + 1;

        const animTime = Math.floor(Math.random() * 6) + 3;
        data.vegetation.animation = `treeMove ${animTime}s ease-in-out infinite`;

    } else {
        data.vegetation.size = 'Small';
        data.vegetation.variation = Math.floor(Math.random() * 5) + 1;
    }

    switch(climate) {
        case "arctic":
            data.vegetation.type = "montane";
            break;
        case "temperate":
            data.vegetation.type = "savanna";
            break;
        case "arid":
            data.vegetation.type = "tugay";
            break;
        case "tropical":
            data.vegetation.type = "jungle";
            break;
        default:
            data.vegetation.type = "tugay"; // Only as fallback
    }

    return data;
  }
}



function generateData() {


}






const loader = new WorldDataLoader(DATA_SIZE);

export async function generateWorldData() {

    await loadTextureData();
    
        loader.loadAll(worldData).then(() => {
        console.log('All world data loaded!');
        });

    for (let row of textureData) {
        for (let texture of row) {
            if (texture) uniqueTextures.add(texture);
        }
    }
     
}


function generateRiverOrRoads(regionContent, river, roadIDCounter, roadIDsArray) {
    const size = regionContent.length;


    // Helper function to check if a position is within bounds
    function inBounds(row, col) {
        return row >= 0 && row < size && col >= 0 && col < size;
    }

    // Helper function to mark a cell as part of the river
    function markRiver(row, col, roadID) {
        console.log('marking...');
      if (inBounds(row, col)) {
          if (river) {
              regionContent.map[row][col].texture = "water.jpg";

              const chanceShipwreck = Math.floor(Math.random() * 20) + 1;
              if (chanceShipwreck === 15) {
                regionContent.map[row][col].shipwreck = true;
              }

              const chanceFish = Math.floor(Math.random() * 10) + 1;
              if (chanceShipwreck === 10) {
                regionContent.map[row][col].fish = true;
              }

              const chanceMoreWater = Math.floor(Math.random() * 12) + 1;
              if (chanceMoreWater > 9 && row > 2 && row < 48 && col > 2 && col < 48) {
                const rowPlus = Math.floor(Math.random() * 3) - 1;
                const colPlus = Math.floor(Math.random() * 3) - 1;
                  if (regionContent[row + rowPlus][col + colPlus].inviwall != true) {
                    regionContent.map[row][col].texture = "water.jpg";
                  }


                const evenMoreChance = Math.floor(Math.random() * 2) + 1;

                for (let i = 0 ; i < evenMoreChance ; i++) {
                  const rowPlus2 = Math.floor(Math.random() * 3) - 1;
                  const colPlus2 = Math.floor(Math.random() * 3) - 1;
                    if (regionContent[row + rowPlus][col + colPlus].inviwall != true) {
                      regionContent.map[row][col].texture = "water.jpg";
                    }
                }
              }

          } else {
              
              regionContent[row][col].impassable = false;

                  // Assign the road ID to the cell
                  if (!regionContent[row][col].road) {
                      regionContent[row][col].roadID = roadID;
                  }
  
                  regionContent[row][col].road = true;
  
                  // Increment road count
                  regionContent[row][col].roadCount = (regionContent[row][col].roadCount || 0) + 1;
  
                  // Mark as crossroad if roadCount is 2 or more
                  if (regionContent[row][col].roadCount >= 2) {
                      if (!regionContent[row][col].crossroad) {
                          regionContent[row][col].crossroad = {
                              roadIDs: []
                          };
                      }

                      
  
                        // Iterate through possible adjacent roads to include their IDs
                          const directions = [
                            [-1, 0], [1, 0], [0, -1], [0, 1]
                        ];
                        directions.forEach(([dRow, dCol]) => {
                            const adjRow = row + dRow;
                            const adjCol = col + dCol;

                            if (inBounds(adjRow, adjCol) && regionContent[adjRow][adjCol].road) {
                                const adjRoadID = regionContent[adjRow][adjCol].roadID;
                                if (!regionContent[row][col].crossroad.roadIDs.includes(adjRoadID)) {
                                    regionContent[row][col].crossroad.roadIDs.push(adjRoadID);
                                }
                            }
                        });

                        if (regionContent[row][col].crossroad.roadIDs.length <= 1) {
                          regionContent[row][col].crossroad = null;
                        }
                  }


  
                  regionContent[row][col].occupied = true;

                  const chanceDestroy = Math.floor(Math.random() * 100);
                  if (chanceDestroy > 93 && !regionContent[row][col].crossroad) {
                    regionContent[row][col].road = false;
                    regionContent[row][col].occupied = true;
                    regionContent[row][col].impassable = false;
                    regionContent[row][col].river = false;
                  }
              
          }
      }
  }

    // Helper function to mark adjacent cells as river shore
    function markRiverShore(row, col) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
        ];
        directions.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (inBounds(newRow, newCol)) {
                // Only mark as shore if it's not already a river cell
                if (!regionContent[newRow][newCol].river) {
                    regionContent.map[row][col].texture = true;
                }
                if (regionContent[newRow][newCol].river === true && regionContent[newRow][newCol].riverShore === true) {
                    regionContent.map[row][col].texture = "water.jpg";
                    regionContent.map[row][col].riverShore = false;
                }
            }
        });
    }

    // Step 1: Choose random starting and ending points on the edges
    let startRow, startCol, endRow, endCol;

    // the start point
    let startSide = Math.floor(Math.random() * 4);
    let endSide = Math.floor(Math.random() * 4);

    while (endSide === startSide) {
        startSide = Math.floor(Math.random() * 4);
        endSide = Math.floor(Math.random() * 4);
    }
    if (startSide === 0) { // Top side
        startRow = 6;
        startCol = Math.floor(Math.random() * size);
    } else if (startSide === 1) { // Bottom side
        startRow = size - 6;
        startCol = Math.floor(Math.random() * size);
    } else if (startSide === 2) { // Left side
        startRow = Math.floor(Math.random() * size);
        startCol = 6;
    } else { // Right side
        startRow = Math.floor(Math.random() * size);
        startCol = size - 6;
    }

    // the end point
    if (endSide === 0) { // Top side
        endRow = 6;
        endCol = Math.floor(Math.random() * size);
    } else if (endSide === 1) { // Bottom side
        endRow = size - 6;
        endCol = Math.floor(Math.random() * size);
    } else if (endSide === 2) { // Left side
        endRow = Math.floor(Math.random() * size);
        endCol = 6;
    } else { // Right side
        endRow = Math.floor(Math.random() * size);
        endCol = size - 6;
    }

    // Step 2: Generate the river path from start to end
    let currentRow = startRow;
    let currentCol = startCol;

    
      markRiver(currentRow, currentCol, roadIDCounter);
    


    while (currentRow !== endRow || currentCol !== endCol) {
        // Calculate the direction to move toward the end point
        const rowDiff = endRow - currentRow;
        const colDiff = endCol - currentCol;

        // Choose randomly whether to move in the row direction or col direction
        let moveRow = Math.random() < Math.abs(rowDiff) / (Math.abs(rowDiff) + Math.abs(colDiff));

        if (moveRow && rowDiff !== 0) {
            const newRow = currentRow + Math.sign(rowDiff);
            if (inBounds(newRow, currentCol)) {
                currentRow = newRow;
            } else {
                moveRow = false; // If out of bounds, try to move in the other direction
            }
        }
        if (!moveRow && colDiff !== 0) {
            const newCol = currentCol + Math.sign(colDiff);
            if (inBounds(currentRow, newCol)) {
                currentCol = newCol;
            }
        }

          markRiver(currentRow, currentCol, roadIDCounter);
        
        
    }

    // Step 3: Mark cells adjacent to the river as river shore
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (regionContent[row][col].river && river) {
                markRiverShore(row, col);
            }
        }
    }
}