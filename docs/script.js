// script.js
let currentOption = 'begin'; //button default set to begin
let startSelected = false;
let endSelected = false;
let startX, startY, endX, endY; // coord start end xy
let myModule; // MODULE STORAGE

document.addEventListener('DOMContentLoaded', async () => {
    myModule = await createModule(); //init module
    //tile select
    document.querySelector('input[type="radio"][value="begin"]').checked = true;
    //reset button
    document.getElementById('resetReset').addEventListener('click', () => { drawMap(); });
    //run button
    document.getElementById('runAlgo').addEventListener('click', () => {
        if(!myModule) {
            console.log('module not ready');
            return;
        }
        if(!startSelected || !endSelected) {
            console.log('s/e unset');
            return;
        }
        //get matrix dimensions
        const COL = parseInt(document.getElementById('xValue').value);
        const ROW = parseInt(document.getElementById('yValue').value);
        //op coords
        let obstacleCoords = [];
        const cells = document.querySelectorAll('.cell');
        //iterate through all cells, upload coords if
        cells.forEach(cell => {
            if(cell.classList.contains('obstacle')) {
                obstacleCoords.push(parseInt(cell.dataset.x), parseInt(cell.dataset.y));
            }
        });
        //VECTORINT CLASS (from emcc)
        let obstacleVector = new myModule.VectorInt();
        obstacleCoords.forEach(coord => obstacleVector.push_back(coord));
        //call astar fxn, get path, convert path
        let resultVector = myModule.AStar(COL, ROW, startX, startY, endX, endY, obstacleVector);
        let pathLength = resultVector.size();
        let pathCoords = [];
            for(let i = 0; i < pathLength; i++) {
            pathCoords.push(resultVector.get(i));
        }
        //remove s/e
        startSelected = false;
        endSelected = false;
        startX = undefined;
        startY = undefined;
        endX = undefined;
        endY = undefined;
        //remove color
        const startCell = document.querySelector('.cell.begin');
        if(startCell) {
            startCell.classList.remove('begin');
            startCell.style.backgroundColor = '';
        }
        const endCell = document.querySelector('.cell.end');
        if(endCell) {
            endCell.classList.remove('end');
            endCell.style.backgroundColor = '';
        }
        //path coords, print path
        for(let i = 0; i < pathCoords.length; i += 2) {
            let x = pathCoords[i];
            let y = pathCoords[i + 1];
            let cellSelector = `.cell[data-y="${y}"][data-x="${x}"]`;
            let cellElement = document.querySelector(cellSelector);
            //set color
            if(cellElement) {
                cellElement.style.backgroundColor = 'aqua';
            }
        }
        //clear for memoy management
        obstacleVector.delete();
    });
});

//tile type sel
document.querySelectorAll('.mydict input[type="radio"]').forEach(input => {
    input.addEventListener('change', () => {
        currentOption = input.value;
    });
});

//change cols
document.getElementById('xValue').oninput = function() {
    document.getElementById('xSize').textContent = this.value;
    drawMap();
};

//change rows
document.getElementById('yValue').oninput = function() {
    document.getElementById('ySize').textContent = this.value;
    drawMap();
};

//map decl
const map = document.getElementById('map');
//draw fxn
function drawMap() {
    // clear map, clear s/e
    map.innerHTML = '';
    startSelected = false;
    endSelected = false;
    startX = undefined;
    startY = undefined;
    endX = undefined;
    endY = undefined;
    //get dimensions
    const xSize = document.getElementById('xValue').value;
    const ySize = document.getElementById('yValue').value;
    //draw matrix
    for(let y = 0; y < ySize; y++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let x = 0; x < xSize; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        //listen for clicks
        cell.addEventListener('click', function() {
            //if clicked matches current option:
            if(this.classList.contains(currentOption)) {
                this.classList.remove(currentOption);
                if(currentOption === 'begin') {
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
            //else do nothing
            if((currentOption === 'begin' && startSelected) || (currentOption === 'end' && endSelected)) {
                return;
            }
            //otherwise if empty:
            if(!this.classList.contains('begin') && !this.classList.contains('end') && !this.classList.contains('obstacle')) {
                clearCell(this);
                if(currentOption === 'begin') {
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
        //add col
        row.appendChild(cell);
        }
        //add row
        map.appendChild(row);
    }
}

//clear cell for 3 sels
function clearCell(cell) {
    cell.classList.remove('begin', 'end', 'obstacle');
}

//toggle off
function removeExisting(className) {
    const existing = map.querySelector('.' + className);
    if(existing) {
        existing.classList.remove(className);
    }
    if(className === 'begin') {
        startSelected = false;
        startX = startY = undefined;
    }
    if(className === 'end') {
        endSelected = false;
        endX = endY = undefined;
    }
}

drawMap(); //init draw
