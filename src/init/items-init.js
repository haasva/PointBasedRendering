import { gameData } from './gamedata.js';

export async function initializeItems() {
    initializeWeapons();
}

function initializeWeapons() {
  gameData.weapons.forEach(weapon => {
    weapon.name = weapon.Title.toLowerCase();
    weapon.category = weapon.Type;
    weapon.unique = weapon.Unique;
    weapon.baseRarity = weapon.BaseRarity;
    weapon.specialty = weapon.Specialty;
    weapon.baseDmg = weapon.BaseDamage;
    weapon.baseCrit = weapon.BaseCritChance;
    weapon.quality = 'Common';
    weapon.culture = weapon.Culture;
  });
}

export function randomizeWeaponQuality(weapon) {
  const baseRarity = weapon.baseRarity;
  const qualities = ['Poor', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

  const rarityWeights = {
    Common: [82, 10,	5, 2, 1, 0],
    Uncommon: [60, 20, 10, 6, 3, 1],
    Rare: [40, 30, 15, 8, 5, 2]
  };

  const weights = rarityWeights[baseRarity] || [82, 10,	5, 2, 1, 0]; // Default weights
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const randomWeight = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (randomWeight <= cumulativeWeight) {
      weapon.quality = qualities[i];
      break;
    }
  }

  if (weapon.unique === true) {
    weapon.quality = 'Legendary';
  }

  const qualityMultiplier = {
    Poor: 0.75,
    Common: 1,
    Uncommon: 1.25,
    Rare: 1.5,
    Epic: 2,
    Legendary: 2.5
  };

  weapon.baseDmg = Math.round(weapon.baseDmg * qualityMultiplier[weapon.quality]);
}