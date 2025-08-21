export function addGenericTooltip(element, infos) {
    element.addEventListener('mouseover', function (event) {
      displayGenericTooltip(event, infos);
    });
    element.addEventListener('mouseleave', removeGenericTooltip);
}

export function displayGenericTooltip(event, infos) {
    const hoveredElement = event.target;
  
    const existingTooltip = document.querySelector('.area-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  
      // Create a tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = 'area-tooltip';
      tooltip.setAttribute("id", "area-tooltip");
      tooltip.innerHTML = `
        <div style="color: aqua;">${infos}</div>
      `;
  
      // Set the tooltip position
      const tooltipX = event.clientX;
      const tooltipY = event.clientY + 20;
  
      tooltip.style.position = 'absolute';
  
      // Adjust tooltip position to stay within the window boundaries
      const maxRight = window.innerWidth - tooltip.clientWidth;
      const maxBottom = window.innerHeight - tooltip.clientHeight;
  
      // If tooltip exceeds window boundaries, adjust its position
      const adjustedX = Math.min(tooltipX, maxRight);
      const adjustedY = Math.min(tooltipY, maxBottom);
  
      tooltip.style.left = `${adjustedX}px`;
      tooltip.style.top = `${adjustedY}px`;

      tooltip.style.width = `fit-content`;
  
      document.body.appendChild(tooltip);

      // Set the initial tooltip position
      updateTooltipPosition(event, tooltip);
  
      // Add event listener to update tooltip position on mousemove
      hoveredElement.addEventListener('mousemove', (event) => updateTooltipPosition(event, tooltip));
  }

export function removeGenericTooltip() {
    const existingTooltip = document.querySelector('.area-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
}

export function removeAnyToolTip() {
  const existingTooltip = document.querySelector('.area-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
}

document.addEventListener('click', (event) => {
  removeAnyToolTip();
   document.getElementById('adventurer-info-container')?.remove();
});

export function updateTooltipPosition(event, tooltip, bufferValue) {
  const tooltipWidth = tooltip.clientWidth;
  const tooltipHeight = tooltip.clientHeight;
  const eventElement = event.target;
  const eventRect = eventElement.getBoundingClientRect();
  let buffer = 0; // Space between tooltip and event element
  if ( bufferValue ) { buffer = bufferValue };

  let tooltipX; // Default position to the right of the event element
  let tooltipY; // Default position below the event element

  if (tooltip.id === "rightclick-menu") {
    tooltipX = event.clientX; // Default position to the right of the event element
    tooltipY = event.clientY; // Default position below the event element
  } else {
    tooltipX = event.clientX + 30; // Default position to the right of the event element
    tooltipY = event.clientY + 10; // Default position below the event element
  }


  // Adjust position if the tooltip goes beyond the right edge of the window
  if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = eventRect.left - tooltipWidth - buffer; // Move to the left of the event element
  }

  // Adjust position if the tooltip goes beyond the bottom edge of the window
  if (tooltipY + tooltipHeight > window.innerHeight) {
      tooltipY = eventRect.top - tooltipHeight - buffer; // Move above the event element
  }

  // Ensure tooltip does not go beyond the top of the screen
  if (tooltipY < 0) {
      tooltipY = 0; // Align to the top of the screen
  }

  // Ensure tooltip does not go beyond the left edge of the screen
  if (tooltipX < 0) {
      tooltipX = 0; // Align to the left of the screen
  }

  tooltip.style.left = `${tooltipX}px`;
  tooltip.style.top = `${tooltipY}px`;
  tooltip.style.transformOrigin = 'top right';
}