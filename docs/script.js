// script.js
let currentOption = 'begin'; // begin default
let startSelected = false;
let endSelected = false;
let startX, startY, endX, endY; // coord start end xy

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('input[type="radio"][value="begin"]').checked = true;
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
