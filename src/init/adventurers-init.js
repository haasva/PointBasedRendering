import { gameData } from './gamedata.js';
import { randomizeWeaponQuality } from './items-init.js';
import { generateAdventurerAffixes } from '../affixes/adv-affixes.js';

const attributeMap = {
  Strength: {
    default: "Sturdy",
    Education: "Mighty",
    Dexterity: "Athletic",
    Cunning: "Charismatic",
    Artisanship: "Seasoned"
  },
  Dexterity: {
    default: "Nimble",
    Strength: "Athletic",
    Cunning: "Deft",
    Artisanship: "Habile",
    Education: "Skilled"
  },
  Cunning: {
    default: "Sly",
    Strength: "Charismatic",
    Dexterity: "Deft",
    Artisanship: "Artful",
    Education: "Astute"
  },
  Artisanship: {
    default: "Competent",
    Strength: "Seasoned",
    Dexterity: "Habile",
    Cunning: "Artful",
    Education: "Ingenious"
  },
  Education: {
    default: "Erudite",
    Strength: "Mighty",
    Dexterity: "Skilled",
    Cunning: "Astute",
    Artisanship: "Ingenious"
  }
};

export async function processAdventurers(adventurer) {
    generateNewAdventurer(adventurer);
    //gameData.adventurersMap = new Map(gameData.adventurers.map(adventurer => [adventurer.Title, adventurer]));
}


export async function generateNewAdventurer(adventurer) {
        await resetAdventurer(adventurer);
        await setStats(adventurer);
          adventurer.Affixes = [];
          adventurer.uID = Math.floor(Math.random() * 99999) + 1;
        await generateAdventurerAffixes(adventurer);
        adventurer.Price = setAdventurerPrice(adventurer);
}

function setAdventurerPrice(a) {
  
  let rarityValue = 1
  if (a.Rarity === 'Legendary') {
    rarityValue = 1.5;
  } else if (a.Rarity === 'Rare') {
    rarityValue = 1.35;
  } else if (a.Rarity === 'Uncommon') {
    rarityValue = 1.2;
  } else if (a.Rarity === 'Normal') {
    rarityValue = 1;
  }

  let attrSum = Math.round(((a.Attributes.Strength + a.Attributes.Cunning + a.Attributes.Artisanship + a.Attributes.Education) / 4));

  let price = Math.round(((((attrSum + a.Speed + (a.Slots.length * 2))) * (getRarityMultiplier(a.BaseRarity) * (a.Level / 2))) * rarityValue) / 1.5);

  const types = a.Type.split(',').map(type => type.trim());

  if (types.includes('Slave')) {
    price = Math.round(price / 2);
  }
  if (types.includes('Commoner')) {
    price = Math.round(price / 1.5);
  }
  if (types.includes('Noble')) {
    price = Math.round(price * 1.2);
  }

  if(types.length === 2) {
    price = Math.round(price * 1.1);
  }

  return price;
}







async function resetAdventurer(adventurer) {
  adventurer.Attributes = [];
  adventurer.Attributes.Strength = 0;
  adventurer.Attributes.Cunning = 0;
  adventurer.Attributes.Artisanship = 0;
  adventurer.Attributes.Education = 0;
  adventurer.Attributes.Dexterity = 0;

  adventurer.Attack = 0;

  adventurer.RangedResist = Math.round(adventurer.Attributes.Dexterity * 2);
  adventurer.HandResist = Math.round(adventurer.Attributes.Strength * 2);
  
  const types = adventurer.Type.split(',').map(s => s.trim());
  adventurer.Types = types;

  const cultures = adventurer.Culture.split(',').map(s => s.trim());
  adventurer.Cultures = cultures;

  adventurer.Skills = [];

  adventurer.upgrades = [
    adventurer.Upgrade1,
    adventurer.Upgrade2,
    adventurer.Upgrade3
  ].filter(upgrade => upgrade !== "");

  console.log(adventurer.Equipment.Weapon);

  if (typeof (adventurer.Equipment.Weapon) === 'string') {
    const weaponName = adventurer.Equipment.Weapon;
    const foundWeapon = gameData.weapons.find((item) => item.Title === weaponName);
    if (foundWeapon != null) {
      adventurer.Equipment.Weapon = {... foundWeapon };
    } else {
      adventurer.Equipment.Weapon = null;
    }
  }

}



async function setStats(adventurer) {
  const rarityMultiplier = getRarityMultiplier(adventurer.Rarity);
  const randomness = Math.floor(Math.random() * 2) + 1;

    adventurer.Attributes = {
        Strength: 0,
        Cunning: 0,
        Artisanship: 0,
        Education: 0,
        Dexterity: 0
    };

  applyAdventurerTypeBonuses(adventurer, rarityMultiplier);

  setAdventurerRange(adventurer);

  setAdventurerMainAttribute(adventurer);

  distributeRandomPoints(adventurer);
  
  adventurer.RangedResist = Math.round(adventurer.Attributes.Dexterity);
  adventurer.HandResist = Math.round(adventurer.Attributes.Strength);

  const advStr = adventurer.Attributes.Strength;
  adventurer.Life = (advStr * 2) + 10;
  if (isNaN(adventurer.Life)) {
    adventurer.Life = Math.round(adventurer.Life);
  }
  adventurer.MaxLife = adventurer.Life;

  adventurer.Speed = Math.round(((2 + randomness + (adventurer.Attributes.Dexterity / 2)) * rarityMultiplier));

  if (adventurer.Mounted === 'Mounted') {
    adventurer.Speed = adventurer.Speed + 4;
  }

  const advTypes = adventurer.Type.split(',').map(type => type.trim());
  if (advTypes.includes("Intellectual") || advTypes.includes("Religious")) {
    adventurer.Speed = adventurer.Speed - 1;
  }

  adventurer.Level = 1;

  adventurer.totalAttributes = calculateIndividualAttributesTotal(adventurer);

  adventurer.upkeep = Math.round(adventurer.upkeep + (adventurer.totalAttributes / 3));

  if (adventurer.Equipment.Weapon != null) {
      randomizeWeaponQuality(adventurer.Equipment.Weapon);
      adventurer.Equipment.Weapon.iID = Math.floor(Math.random() * 9999);
      adventurer.Attack = calculateAdventurerAttackPoints(adventurer);
  }
}



function getRarityMultiplier(rarity) {
    switch (rarity) {
      case "Legendary":
        return 1.2;
      case "Rare":
        return 1.1;
      case "Common":
      default:
        return 1;
    }
}


function calculateAdventurerAttackPoints(adventurer) {
  const weapon = adventurer.Equipment.Weapon;

  const attributes = ["Strength", "Dexterity", "Cunning", "Education"];
  const dagger = [0, 3, 1, 0];
  const sword = [2, 1, 0, 0];
  const polearm = [3, 1, 0, 0];
  const axe = [4, 0, 0, 0];
  const handgun = [0, 2, 2, 0];
  const longgun = [1, 1, 2, 0];
  const bow = [1, 1, 1, 1];
  const crossbow = [2, 2, 0, 0];

  if (!weapon || !weapon.category) {
    adventurer.Attack = 0;
    return 0;
  }

  const weaponWeights = {
    dagger,
    sword,
    polearm,
    axe,
    handgun,
    longgun,
    bow,
    crossbow
  };

  const weights = weaponWeights[weapon.category.toLowerCase()];
  if (!weights) {
    adventurer.Attack = 0;
    return;
  }

  let attackPoints = weapon.baseDmg || 0;

  attributes.forEach((attribute, index) => {
    attackPoints += adventurer.Attributes[attribute] * weights[index];
  });

  attackPoints = Math.round((attackPoints / 4) + weapon.baseDmg);

  if (adventurer.Equipment.Weapon === null) {
    attackPoints = 0;
  }

  return attackPoints || 0;
}

function calculateIndividualAttributesTotal(adventurer) {
  return Object.values(adventurer.Attributes).reduce((sum, value) => sum + value, 0);
}

function distributeRandomPoints(adventurer, points = 4) {
  const attributes = Object.keys(adventurer.Attributes); // Get all attribute names

  for (let i = 0; i < points; i++) {
      const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
      adventurer.Attributes[randomAttribute]++; // Increase a random attribute by 1
  }
}

function setAdventurerMainAttribute(adventurer) {
  const types = adventurer.Type.split(',').map(type => type.trim());
  const mainType = types;
  let mainAttrs = [];
  let upkeep = 1;

  if (mainType.includes('Slave')) {
    const possibleAttributes = ['Cunning', 'Strength', 'Artisanship'];
    const randomAttribute = possibleAttributes[Math.floor(Math.random() * possibleAttributes.length)];
    mainAttrs.push(randomAttribute);
  }
  if (mainType.includes('Outlaw')) {
    const possibleAttributes = ['Cunning', 'Dexterity'];
    const randomAttribute = possibleAttributes[Math.floor(Math.random() * possibleAttributes.length)];
    mainAttrs.push(randomAttribute);
    upkeep = upkeep + 1;
  }
  if (mainType.includes('Soldier')) {
    mainAttrs.push('Strength');
    upkeep = upkeep + 2;
  }
  if (mainType.includes('Explorer')) {
    const possibleAttributes = ['Strength', 'Dexterity', 'Education', 'Artisanship', 'Cunning'];
    const randomAttribute = possibleAttributes[Math.floor(Math.random() * possibleAttributes.length)];
    mainAttrs.push(randomAttribute);
    upkeep = upkeep + 1;
  }
  if (mainType.includes('Noble')) {
    const possibleAttributes = ['Education', 'Cunning'];
    const randomAttribute = possibleAttributes[Math.floor(Math.random() * possibleAttributes.length)];
    mainAttrs.push(randomAttribute);
    upkeep = upkeep + 3;
}
  if (mainType.includes('Intellectual')) {
    mainAttrs.push('Education');
    upkeep = upkeep + 2;
  }
  if (mainType.includes('Religious')) {
    const possibleAttributes = ['Education', 'Artisanship'];
    const randomAttribute = possibleAttributes[Math.floor(Math.random() * possibleAttributes.length)];
    mainAttrs.push(randomAttribute);
    upkeep = 2;
  }
  if (mainType.includes('Commoner')) {
    mainAttrs.push('Artisanship');
    upkeep = 1;
  }

  adventurer.mainAttr = mainAttrs;

  function removeDuplicates(array) {
    return array.filter((item, index) => array.indexOf(item) === index);
  }

    if (mainAttrs.length > 2) {
        // Remove duplicates
        mainAttrs = removeDuplicates(mainAttrs);
        
        // If still more than 2, remove extra attributes
        while (mainAttrs.length > 2) {
            // Remove a random attribute
            mainAttrs.splice(Math.floor(Math.random() * mainAttrs.length), 1);
        }
    }

// Assign to adventurer.mainAttr
adventurer.mainAttr = mainAttrs;

adventurer.prefix = getAttributeCombination(mainAttrs);


let rarityValue = 1
if (adventurer.Rarity === 'Legendary') {
  rarityValue = 1.5;
} else if (adventurer.Rarity === 'Rare') {
  rarityValue = 1.35;
} else if (adventurer.Rarity === 'Uncommon') {
  rarityValue = 1.2;
} else if (adventurer.Rarity === 'Normal') {
  rarityValue = 1;
}


  adventurer.upkeep = Math.round(upkeep * (rarityValue * 2));
}

function getAttributeCombination(attributes) {
  if (!attributes.length) return null;

  if (attributes.length === 1) {
    return attributeMap[attributes[0]]?.default || null;
  }

  const [attr1, attr2] = attributes;
  return attributeMap[attr1]?.[attr2] || attributeMap[attr2]?.[attr1] || attributeMap[attr1]?.default || null;
}

function setAdventurerRange(adventurer) {

  const specialties = adventurer.Specialty.split(',').map(s => s.trim());
  
  if (specialties.includes('Archery')) {
    adventurer.Range = 7;
  }

  if (specialties.includes('Melee')) {
    adventurer.Range = 1;
  }

  if (specialties.includes('Unarmed')) {
    adventurer.Range = 1;
  }

  if (specialties.includes('Gunpowder')) {
    adventurer.Range = 7;
  }

  if (specialties.includes('Non-fighting')) {
    adventurer.Range = 1;
  }
}

function applyAdventurerTypeBonuses(adventurer, rarityMultiplier) {



  adventurer.Attributes.Strength = parseFloat(adventurer.Attributes.Strength) + 0;
  adventurer.Attributes.Cunning = parseFloat(adventurer.Attributes.Cunning) + 0;
  adventurer.Attributes.Artisanship = parseFloat(adventurer.Attributes.Artisanship) + 0;
  adventurer.Attributes.Education = parseFloat(adventurer.Attributes.Education) + 0;
  adventurer.Attributes.Dexterity = parseFloat(adventurer.Attributes.Dexterity) + 0;

  // Apply additional bonuses based on adventurer.Types
  if (adventurer.Type) {
    const types = adventurer.Type.split(',').map(type => type.trim());

    const typeBonuses = {
      'Soldier': { Strength: 6, Dexterity: 4 },
      'Outlaw': { Strength: 1, Dexterity: 4, Cunning: 5 },
      'Explorer': { Strength: 2, Dexterity: 2, Cunning: 2, Artisanship: 2, Education: 2 },
      'Commoner': { Strength: 2, Dexterity: 2, Artisanship: 6 },
      'Slave': { Strength: 1, Dexterity: 2, Cunning: 2, Artisanship: 3, Education: 1 },
      'Intellectual': { Cunning: 3, Artisanship: 1, Education: 6 },
      'Religious': { Strength: 1, Cunning: 1, Artisanship: 3, Education: 5 },
      'Noble': { Strength: 3, Cunning: 3, Education: 4 }
    };
    

    // Initialize bonuses
    let typeBonusesSum = {
      Strength: 0,
      Cunning: 0,
      Artisanship: 0,
      Education: 0,
      Dexterity: 0
    };

    types.forEach(type => {
      const typeBonus = typeBonuses[type];
      if (typeBonus) {
        Object.keys(typeBonus).forEach(attribute => {
          typeBonusesSum[attribute] += typeBonus[attribute];
        });
      }
    });

    // Distribute bonuses according to the rules
    if (types.length === 1) {
      Object.keys(typeBonusesSum).forEach(attribute => {
        adventurer.Attributes[attribute] += typeBonusesSum[attribute];
      });
    } else if (types.length === 2) {
      Object.keys(typeBonusesSum).forEach(attribute => {
        if (typeBonusesSum[attribute] > 4) {
          adventurer.Attributes[attribute] += 4;
        } else {
          adventurer.Attributes[attribute] += typeBonusesSum[attribute] / 2;
        }
      });
    }
  }

  // Ensure that the total bonus doesn't exceed +8 for each attribute
  Object.keys(adventurer.Attributes).forEach(attribute => {
    adventurer.Attributes[attribute] = Math.round((adventurer.Attributes[attribute] + 1 ) * rarityMultiplier);
  });


}




