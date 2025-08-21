import * as UI from "./general.js";

export function displayAdventurerAttributes(adventurer) {
    const bottom = document.createElement('div');
    bottom.classList.add('bottom');

    const attributeContainer = document.createElement('div');
    attributeContainer.className = 'attribute-container';

    const attributesOrder = ['Strength', 'Dexterity', 'Artisanship', 'Cunning', 'Education'];
    attributesOrder.forEach(attr => {
      const attribute = document.createElement('div');
      attribute.classList.add('attribute');
      attribute.setAttribute('id', `${attr}`);
      attribute.innerText = `${adventurer.Attributes[attr]}`;
      if (adventurer.mainAttr[0] === attr || adventurer.mainAttr[1] === attr) {
        attribute.classList.add('main-attribute'); 
      }
      attribute.style.setProperty('color', `var(--${attr.substring(0, 3).toLowerCase()}-color)`);
      attribute.setAttribute('infos', `${attr}`);
      UI.addGenericTooltip(attribute, `${attr}`);
      attributeContainer.appendChild(attribute);
    });


    const weapon = document.createElement('div');
    weapon.className = 'weapon-data';
    if (adventurer.Equipment.Weapon != null) {
        weapon.textContent = `${adventurer.Equipment.Weapon.name} (${adventurer.Attack})`;
    } else {
        weapon.textContent = `No weapon (${adventurer.Attack})`;
    }
    

    bottom.appendChild(attributeContainer);
    bottom.appendChild(weapon);
    return bottom;
}

export function createAdvStatsBox(adventurer) {
  const advBox = document.createElement('div');
  advBox.classList.add('adv-box');
  advBox.setAttribute('uid', `${adventurer.uID}`)
  advBox.setAttribute('index', adventurer.index);

  advBox.style.backgroundImage = `url('/Art/Adventurers/${adventurer.Title}.png')`;

  const header = document.createElement('div');
  header.classList.add('header');

  header.setAttribute('uid', adventurer.uID);




  const types = document.createElement('div');
  types.classList.add('types');

  const type1 = document.createElement('div');
  type1.classList.add('type');
  type1.style.backgroundImage = `url('/Art/Categories/Types/${adventurer.Types[0]}.png')`;
  types.appendChild(type1);
  if (adventurer.Types.length === 2) {
    const type2 = document.createElement('div');
    type2.classList.add('type');
    type2.style.backgroundImage = `url('/Art/Categories/Types/${adventurer.Types[1]}.png')`;
    types.appendChild(type2);
  }

  advBox.appendChild(types);

  const title = document.createElement('div');
  title.classList.add('title');
  title.classList.add(`${adventurer.Rarity}`)
  title.innerText = `${adventurer.Title}`;

  const level = document.createElement('div');
  level.classList.add('level');
  level.innerText = `${adventurer.Level}`;

  const upkeep = document.createElement('div');
  upkeep.classList.add('upkeep');
  upkeep.innerText = `${adventurer.upkeep}`;
  UI.addGenericTooltip(upkeep, 'Daily upkeep');
  title.appendChild(upkeep);

  header.appendChild(title);
  header.appendChild(level);



  const infos = document.createElement('div');
  infos.classList.add('infos');


  const left = document.createElement('div');
  left.classList.add('left');

  const advPic = document.createElement('div');
  advPic.classList.add('pic');
  advPic.classList.add('item');
  advPic.setAttribute('uid', `${adventurer.uID}`)
  advPic.style.backgroundImage = `url('/Art/Adventurers/${adventurer.Title}.png')`;





  if (adventurer.Rarity === "Legendary") {
    advPic.classList.add("legendary-adv-slot");
  }
  if (adventurer.Rarity === "Rare") {
    advPic.classList.add("rare-adv-slot");
  }
  if (adventurer.Rarity === "Normal") {
    advPic.classList.add("normal-adv-slot");
  }
  if (adventurer.Rarity === "Uncommon") {
    advPic.classList.add("uncommon-adv-slot");
  }

  const groupLeaderMark = document.createElement('div');
  groupLeaderMark.className = 'group-leader-mark';
  groupLeaderMark.style.display = 'none';
  advPic.appendChild(groupLeaderMark);





  const right = document.createElement('div');
  right.classList.add('right');

  const lifeBarBox = document.createElement('div');
  lifeBarBox.classList.add('adv-combat-info');

  const lifeBar = document.createElement('progress');
  lifeBar.classList.add('lifebar');
  lifeBar.setAttribute('value', `${adventurer.Life}`);
  lifeBar.setAttribute('max', `${adventurer.MaxLife}`);

  right.appendChild(lifeBar);


  infos.appendChild(right);

  const bottom = document.createElement('div');
  bottom.classList.add('bottom');

  const attributesOrder = ['Strength', 'Dexterity', 'Artisanship', 'Cunning', 'Education'];
    attributesOrder.forEach(attr => {
      const attribute = document.createElement('div');
      attribute.classList.add('attribute');
      attribute.setAttribute('id', `${attr}`);
      attribute.innerText = `${adventurer.Attributes[attr]}`;
      if (adventurer.mainAttr[0] === attr || adventurer.mainAttr[1] === attr) {
        attribute.classList.add('main-attribute'); 
      }
      attribute.style.setProperty('color', `var(--${attr.substring(0, 3).toLowerCase()}-color)`);
      attribute.setAttribute('infos', `${attr}`);
      UI.addGenericTooltip(attribute, `${attr}`);
      bottom.appendChild(attribute);
    });

    right.appendChild(bottom);
  
  const content = document.createElement('div');
  content.classList.add('content');



  content.append(advPic, infos, right);
  //content.append(advPic, infos, right, appendSkillSlots(adventurer));
    // appendEquipmentInfo(adventurer).then(equipmentInfo => {
    //   content.appendChild(equipmentInfo);

    // });
  advBox.appendChild(header);
  advBox.appendChild(content);


//   header.addEventListener('mouseover', showTooltip);

//   advBox.addEventListener('contextmenu', function (event) {
//   event.preventDefault();
//     if (!event.target.classList.contains('adv-box')) { return; }
//       if (event.button === 2) {
//         displayAdventurerOption(adventurer, advBox, event);
//       }
//   });

//   advBox.addEventListener('click', function (event) {
//       if (event.button === 0) {
//         document.querySelector('#adventurer-option-container')?.remove();
//         const index = parseInt(event.currentTarget.getAttribute('index')) - 1;
//         selectAdventurer(index, null, adventurer);
//       }
//   });

//   Inventory.prototype.initDragAndDropAdvOption(advBox);
  return advBox;
}




function appendSkillSlots(adventurer) {

  const container = document.createElement('div');
  container.classList.add('adv-skills-container');

  let number = 0;
  adventurer.Slots.forEach(slot => {
    // Create a skill-slot element
    const skillSlot = document.createElement('div');
    skillSlot.classList.add('skill-slot', slot.type, slot.status);
    skillSlot.setAttribute('type', `${slot.type}`);
    skillSlot.setAttribute('number', `${number}`);
    skillSlot.style.backgroundImage = `url(/Art/Categories/Types/small/grey/${slot.type}.png)`;
    number++;

    container.appendChild(skillSlot);


    // skillSlot.addEventListener('dragover', dragOverSkill);
    // skillSlot.addEventListener('drop', dropSkill);

    skillSlot.addEventListener('contextmenu', function(event) {
      event.preventDefault();
    });
  });

  let skillsFromSignatures = [];
  if (adventurer.Signature != '') {
    skillsFromSignatures.push(adventurer.Signature);
  }
  skillsFromSignatures.forEach(skillName => {
    const skill = skillsObject[skillName];
    if (skill) {
      const skillSlot = document.createElement('div');
      skillSlot.classList.add('skill-slot');
      container.prepend(skillSlot);

      const skillElement = document.createElement('div');
      skillElement.className = 'skill signature-skill';
      skillElement.classList.add(skill.rarity, skill.type);
      skillElement.setAttribute('type', skill.type);
      skillElement.innerHTML = skill.name;
      skillElement.setAttribute('attached-adventurer', `${adventurer.uID}`);
    
      skillElement.style.backgroundImage = `url('/Art/Skills/${skill.name}.png')`;
      skillElement.style.position = 'relative';
    
      skillElement.addEventListener('mouseover', displaySkillTooltip);
      skillElement.addEventListener('mouseout', removeSkillTooltip);
    
      skillSlot.appendChild(skillElement);
      adventurer.Skills.push(skill);
      updateActiveSkills();
    }
  });

  return container;
}