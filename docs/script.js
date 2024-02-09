// script.js
let currentOption = 'begin'; // begin default
let startSelected = false;
let endSelected = false;
let startX, startY, endX, endY; // coord start end xy
let myModule; // Use this to store the initialized module

document.addEventListener('DOMContentLoaded', () => {
  createModule().then(function(my_module) { // Adjust 'createModule' based on your EXPORT_NAME
    myModule = my_module; // Store the initialized module for later use
    wasmReady = true;
  });

  document.querySelector('input[type="radio"][value="begin"]').checked = true;

  document.getElementById('runAlgo').addEventListener('click', () => {
    console.log('Run button clicked');
    if (!wasmReady) {
      console.log('WASM module not ready');
      return;
    }
    if (!startSelected || !endSelected) {
      console.log('start or end point not set.');
      return;
    }
    const COL = parseInt(document.getElementById('xValue').value);
    const ROW = parseInt(document.getElementById('yValue').value);
    let obstacleCoords = [];
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
      if (cell.classList.contains('obstacle')) {
        obstacleCoords.push(parseInt(cell.dataset.x), parseInt(cell.dataset.y));
      }
    });

    // Prepare the obstacle coordinates for WASM
    // Note: This assumes your C++ function can handle a flat array for obstacles
    let obstaclesPtr = myModule._malloc(obstacleCoords.length * Int32Array.BYTES_PER_ELEMENT);
    myModule.HEAP32.set(new Int32Array(obstacleCoords), obstaclesPtr / Int32Array.BYTES_PER_ELEMENT);

    console.log('Start:', startX, startY);
    console.log('End:', endX, endY);
    console.log('Obstacles:', obstacleCoords);
    // Assuming 'Run' is the correct function name and it's properly exported
    myModule.AStar(COL, ROW, startX, startY, endX, endY, obstaclesPtr);

    // Free the allocated memory for obstacles (if necessary)
    myModule._free(obstaclesPtr);
  });
});

document.querySelectorAll('.mydict input[type="radio"]').forEach(input => {
  input.addEventListener('change', () => {
    currentOption = input.value;
  });
});

document.getElementById('xValue').oninput = function() {
  document.getElementById('xSize').textContent = this.value;
  drawMap();
};
document.getElementById('yValue').oninput = function() {
  document.getElementById('ySize').textContent = this.value;
  drawMap();
};

const map = document.getElementById('map');
function drawMap() {
  map.innerHTML = ''; // clear map
  const xSize = document.getElementById('xValue').value;
  const ySize = document.getElementById('yValue').value;
  for (let y = 0; y < ySize; y++) {
    const row = document.createElement('div');
    row.className = 'row'; // styling class
    for (let x = 0; x < xSize; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell'; // cell styling class
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', function() {
        // toggle cell if contains current sel
        if (this.classList.contains(currentOption)) {
          this.classList.remove(currentOption);
          if (currentOption === 'begin') {
            startSelected = false;
            startX = undefined;
            startY = undefined;
          } else if (currentOption === 'end') {
            endSelected = false;
            endX = undefined;
            endY = undefined;
          }
          return;
        }
        // else do nothing
        if ((currentOption === 'begin' && startSelected) || (currentOption === 'end' && endSelected)) {
          return;
        }
        if (!this.classList.contains('begin') && !this.classList.contains('end') && !this.classList.contains('obstacle')) {
          clearCell(this);
          if (currentOption === 'begin') {
            this.classList.add('begin');
            startSelected = true;
            startX = x;
            startY = y;
          } else if (currentOption === 'end') {
            this.classList.add('end');
            endSelected = true;
            endX = x;
            endY = y;
          } else if (currentOption === 'obstacle') {
            this.classList.add('obstacle');
          }
        }
      });
      row.appendChild(cell);
    }
    map.appendChild(row);
  }
}

function clearCell(cell) {
  cell.classList.remove('begin', 'end', 'obstacle');
}

function removeExisting(className) {
  const existing = map.querySelector('.' + className);
  if (existing) {
    existing.classList.remove(className);
  }
  if (className === 'begin') {
    startSelected = false;
    startX = startY = undefined;
  }
  if (className === 'end') {
    endSelected = false;
    endX = endY = undefined;
  }
}

drawMap(); //init draw
