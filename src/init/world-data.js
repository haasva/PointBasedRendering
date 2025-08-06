const vegetationImage = new Image();
let vegetationLoaded = false;
const DATA_SIZE = 1000;
export const vegetationData = Array(DATA_SIZE).fill().map(() => Array(DATA_SIZE).fill(false));

const textureImage = new Image();
export let textureData = Array(DATA_SIZE).fill().map(() => Array(DATA_SIZE).fill(false));

export const uniqueTextures = new Set();


async function loadTextureData() {
    // Load the texture color mapping from JSON
    const textureMap = await fetch('textures.json').then(res => res.json());

    // Create a lookup function to match RGB to texture name
    function getTextureFromRGB(r, g, b) {
        for (const entry of textureMap) {
            const [er, eg, eb] = entry.color;
            if (r === er && g === eg && b === eb) {
                return entry.name + '.jpg'; // or .png if you're using PNG
            }
        }
        return 'default.jpg'; // fallback if no match
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
                    textureData[y][x] = textureName;
                }
            }

            resolve(); // Signal that it's done
        };

        textureImage.src = 'texture.bmp'; // Load your texture image
    });
}



function loadVegetationData() {
    function checkIfLoaded() {
        if (vegetationLoaded) {
            const canvas = document.createElement('canvas');
            canvas.width = vegetationImage.width;
            canvas.height = vegetationImage.height;
            const context = canvas.getContext('2d');
            context.drawImage(vegetationImage, 0, 0);
            
            // Get image data as a flat array
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
            
            // Process the image data
            for (let y = 0; y < DATA_SIZE; y++) {
                for (let x = 0; x < DATA_SIZE; x++) {
                    // Calculate position in flat array
                    const pos = (y * canvas.width + x) * 4;
                    // Check if pixel is black (RGB all 0)
                    const isVegetation = imageData[pos] === 0 && 
                                      imageData[pos + 1] === 0 && 
                                      imageData[pos + 2] === 0;
                                      
                                      if (isVegetation) {
                                        vegetationData[y][x] = generateData();
                                      } else {
                                        vegetationData[y][x] = null;
                                      }
                    
                }
            }
        }
    }

    vegetationImage.onload = function() {
        vegetationLoaded = true;
        checkIfLoaded();
    };
    vegetationImage.src = 'landmass.bmp';
}



function generateData() {

    let data = {
        vegetation: {
            size: 0,
            variation: 0
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

    return data;
}







export function generateWorldData() {
    loadVegetationData();
    loadTextureData();

    for (let row of textureData) {
    for (let texture of row) {
        if (texture) uniqueTextures.add(texture);
    }
}
}