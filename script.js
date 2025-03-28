document.addEventListener("DOMContentLoaded", () => {
  let grid = [];
  let gridWidth = 0, gridHeight = 0;
  const gridContainer = document.getElementById("grid-container");

  // Global array to store exit coordinates
  let exitPositions = [];

  // Form to set grid size
  const gridSizeForm = document.getElementById("grid-size-form");
  gridSizeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    gridWidth = parseInt(document.getElementById("grid-width").value);
    gridHeight = parseInt(document.getElementById("grid-height").value);
    generateGrid();
  });

  // Generate grid data and DOM elements
  function generateGrid() {
    grid = [];
    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
    // Clear any prior exit positions when generating a new grid.
    exitPositions = [];
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        grid[y][x] = {
          walls: { top: false, right: false, bottom: false, left: false },
          type: "" // can be "P", "G", "Exit", or ""
        };

        const cellDiv = document.createElement("div");
        cellDiv.classList.add("cell");
        cellDiv.dataset.x = x;
        cellDiv.dataset.y = y;
        cellDiv.addEventListener("click", () => openConfig(x, y));
        gridContainer.appendChild(cellDiv);
      }
    }
    renderGrid();
  }

  // Render grid based on current grid data.
  // This now overlays exit styling if the cell's coordinates are in exitPositions.
  function renderGrid() {
    document.querySelectorAll(".cell").forEach((cellDiv) => {
      const x = parseInt(cellDiv.dataset.x);
      const y = parseInt(cellDiv.dataset.y);
      const cell = grid[y][x];
      cellDiv.className = "cell"; // Reset classes

      if (cell.walls.top) cellDiv.classList.add("wall-top");
      if (cell.walls.right) cellDiv.classList.add("wall-right");
      if (cell.walls.bottom) cellDiv.classList.add("wall-bottom");
      if (cell.walls.left) cellDiv.classList.add("wall-left");

      // Set simulation markers (P, G) if present; otherwise use cell.type.
      cellDiv.textContent = cell.type;

      // Apply special classes.
      if (cell.type === "P") cellDiv.classList.add("prisoner");
      if (cell.type === "G") cellDiv.classList.add("guard");

      // If the cell is an exit—either because it was configured as one
      // or its coordinates are recorded in exitPositions—add the exit class.
      if (cell.type === "Exit" || exitPositions.some(pos => pos.x === x && pos.y === y)) {
        cellDiv.classList.add("exit");
        // If the cell doesn't already display a simulation marker,
        // show the "Exit" label.
        if (!cell.type) cellDiv.textContent = "Exit";
      }
    });
  }

  // Modal elements for configuration
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("close");
  const cellCoordinates = document.getElementById("cell-coordinates");
  const saveButton = document.getElementById("save");

  let selectedX, selectedY;
  function openConfig(x, y) {
    selectedX = x;
    selectedY = y;
    const cell = grid[y][x];

    cellCoordinates.textContent = `Editing Cell: (Row ${y}, Column ${x})`;
    document.getElementById("wall-top").checked = cell.walls.top;
    document.getElementById("wall-right").checked = cell.walls.right;
    document.getElementById("wall-bottom").checked = cell.walls.bottom;
    document.getElementById("wall-left").checked = cell.walls.left;

    // Set radio buttons for cell type.
    document.getElementById("prisoner").checked = cell.type === "P";
    document.getElementById("guard").checked = cell.type === "G";
    document.getElementById("exit").checked = cell.type === "Exit";
    document.getElementById("none").checked = (cell.type === "" || cell.type === undefined);

    modal.classList.add("show");
  }

  // Save configuration and update shared walls.
  saveButton.addEventListener("click", () => {
    const cell = grid[selectedY][selectedX];
    const newWalls = {
      top: document.getElementById("wall-top").checked,
      right: document.getElementById("wall-right").checked,
      bottom: document.getElementById("wall-bottom").checked,
      left: document.getElementById("wall-left").checked
    };

    cell.walls = { ...newWalls };

    // Shared wall updates:
    if (selectedY > 0) {
      grid[selectedY - 1][selectedX].walls.bottom = newWalls.top;
    }
    if (selectedX < gridWidth - 1) {
      grid[selectedY][selectedX + 1].walls.left = newWalls.right;
    }
    if (selectedY < gridHeight - 1) {
      grid[selectedY + 1][selectedX].walls.top = newWalls.bottom;
    }
    if (selectedX > 0) {
      grid[selectedY][selectedX - 1].walls.right = newWalls.left;
    }

    // Set cell type based on radio selection.
    if (document.getElementById("prisoner").checked) {
      cell.type = "P";
      // Remove from exit positions if it was previously marked.
      exitPositions = exitPositions.filter(pos => pos.x !== selectedX || pos.y !== selectedY);
    } else if (document.getElementById("guard").checked) {
      cell.type = "G";
      exitPositions = exitPositions.filter(pos => pos.x !== selectedX || pos.y !== selectedY);
    } else if (document.getElementById("exit").checked) {
      cell.type = "Exit";
      // Add to exitPositions if not already present.
      if (!exitPositions.some(pos => pos.x === selectedX && pos.y === selectedY)) {
        exitPositions.push({ x: selectedX, y: selectedY });
      }
    } else {
      cell.type = "";
      // If removing exit status, ensure it's removed from exitPositions.
      exitPositions = exitPositions.filter(pos => pos.x !== selectedX || pos.y !== selectedY);
    }

    modal.classList.remove("show");
    renderGrid();
  });

  closeModal.addEventListener("click", () => {
    modal.classList.remove("show");
  });
  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.remove("show");
  });

  /********************
   * BFS Solver for Shortest Path and Simulation Setup
   ********************/

  // (canMove, movePos, guardMove, isExit, manhattanDistance, findNearestExit remain unchanged)

  function canMove(x, y, direction) {
    if (direction === "up") {
      if (y === 0) return false;
      if (grid[y][x].walls.top) return false;
      if (grid[y - 1][x].walls.bottom) return false;
      return true;
    }
    if (direction === "down") {
      if (y === gridHeight - 1) return false;
      if (grid[y][x].walls.bottom) return false;
      if (grid[y + 1][x].walls.top) return false;
      return true;
    }
    if (direction === "left") {
      if (x === 0) return false;
      if (grid[y][x].walls.left) return false;
      if (grid[y][x - 1].walls.right) return false;
      return true;
    }
    if (direction === "right") {
      if (x === gridWidth - 1) return false;
      if (grid[y][x].walls.right) return false;
      if (grid[y][x + 1].walls.left) return false;
      return true;
    }
    return false;
  }

  function movePos(pos, direction) {
    if (!canMove(pos.x, pos.y, direction)) return null;
    let newPos = { ...pos };
    if (direction === "up") newPos.y--;
    if (direction === "down") newPos.y++;
    if (direction === "left") newPos.x--;
    if (direction === "right") newPos.x++;
    return newPos;
  }

  function guardMove(guardPos, prisonerPos) {
    let newGuard = { ...guardPos };
    if (newGuard.x < prisonerPos.x) {
      let candidate = movePos(newGuard, "right");
      if (candidate) return candidate;
    } else if (newGuard.x > prisonerPos.x) {
      let candidate = movePos(newGuard, "left");
      if (candidate) return candidate;
    }
    if (newGuard.y < prisonerPos.y) {
      let candidate = movePos(newGuard, "down");
      if (candidate) return candidate;
    } else if (newGuard.y > prisonerPos.y) {
      let candidate = movePos(newGuard, "up");
      if (candidate) return candidate;
    }
    return newGuard;
  }

  function isExit(pos) {
    return grid[pos.y][pos.x].type === "Exit";
  }

  function manhattanDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  function findNearestExit(pos) {
    let minDist = Infinity;
    let nearestExit = null;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y][x].type === "Exit" || exitPositions.some(pos => pos.x === x && pos.y === y)) {
          const dist = manhattanDistance(pos, { x, y });
          if (dist < minDist) {
            minDist = dist;
            nearestExit = { x, y };
          }
        }
      }
    }
    return nearestExit;
  }

  // Simulation state variables.
  let simulationSteps = [];
  let simulationIndex = 0;

  function createSimulationControls() {
    const solutionContainer = document.getElementById("solution");
    solutionContainer.innerHTML = "";
    const controlDiv = document.createElement("div");
    controlDiv.id = "simulation-controls";

    const backBtn = document.createElement("button");
    backBtn.id = "back-btn";
    backBtn.textContent = "Backward";
    backBtn.classList.add("btn");

    const forwardBtn = document.createElement("button");
    forwardBtn.id = "forward-btn";
    forwardBtn.textContent = "Forward";
    forwardBtn.classList.add("btn");

    const stepInfo = document.createElement("div");
    stepInfo.id = "step-info";
    stepInfo.style.marginTop = "10px";
    stepInfo.textContent = `Step: 0/${simulationSteps.length - 1}`;

    controlDiv.appendChild(backBtn);
    controlDiv.appendChild(forwardBtn);
    controlDiv.appendChild(stepInfo);
    solutionContainer.appendChild(controlDiv);

    backBtn.addEventListener("click", () => {
      if (simulationIndex > 0) {
        simulationIndex--;
        updateSimulationState();
        stepInfo.textContent = `Step: ${simulationIndex}/${simulationSteps.length - 1}`;
      }
    });
    forwardBtn.addEventListener("click", () => {
      if (simulationIndex < simulationSteps.length - 1) {
        simulationIndex++;
        updateSimulationState();
        stepInfo.textContent = `Step: ${simulationIndex}/${simulationSteps.length - 1}`;
      }
    });
  }

  // Update simulation state without removing exit markers.
  function updateSimulationState() {
    // Clear prisoner/guard markers but leave exit state intact.
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        // Only clear if this cell isn't an exit by configuration.
        if (!exitPositions.some(pos => pos.x === x && pos.y === y)) {
          grid[y][x].type = "";
        } else {
          // For exit cells, keep the label unless a simulation marker (P or G) will override.
          grid[y][x].type = "Exit";
        }
      }
    }
    // Set prisoner and guard based on the simulation step.
    const state = simulationSteps[simulationIndex];
    grid[state.prisoner.y][state.prisoner.x].type = "P";
    grid[state.guard.y][state.guard.x].type = "G";
    renderGrid();
  }

  // A* search to find the optimal escape route and prepare simulation steps.
  document.getElementById("solve-btn").addEventListener("click", () => {
    let prisonerPos = null, guardPos = null;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y][x].type === "P") prisonerPos = { x, y };
        if (grid[y][x].type === "G") guardPos = { x, y };
      }
    }
    if (!prisonerPos || !guardPos) {
      document.getElementById("solution").textContent = "Please set both a prisoner and a guard.";
      return;
    }

    const nearestExit = findNearestExit(prisonerPos);
    if (!nearestExit) {
      document.getElementById("solution").textContent = "No exit found on the grid.";
      return;
    }

    const directions = ["up", "down", "left", "right"];
    const openSet = new Set();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startState = JSON.stringify({ prisoner: prisonerPos, guard: guardPos });
    openSet.add(startState);
    gScore.set(startState, 0);
    fScore.set(startState, manhattanDistance(prisonerPos, nearestExit));

    const getLowestFScore = () => {
      let lowest = Infinity;
      let lowestState = null;
      for (const state of openSet) {
        const score = fScore.get(state);
        if (score < lowest) {
          lowest = score;
          lowestState = state;
        }
      }
      return lowestState;
    };

    const reconstructPath = (currentState) => {
      const path = [];
      let current = currentState;
      while (cameFrom.has(current)) {
        const [prev, move] = cameFrom.get(current);
        path.unshift(move);
        current = prev;
      }
      return path;
    };

    while (openSet.size > 0) {
      const currentState = getLowestFScore();
      const current = JSON.parse(currentState);

      if (isExit(current.prisoner)) {
        // Reconstruct solution moves.
        const solution = reconstructPath(currentState);
        simulationSteps = [];
        simulationSteps.push({ prisoner: prisonerPos, guard: guardPos });
        let currentSimState = { prisoner: { ...prisonerPos }, guard: { ...guardPos } };
        solution.forEach((move) => {
          const nextPrisoner = movePos(currentSimState.prisoner, move);
          if (!nextPrisoner) return;
          let newGuard = { ...currentSimState.guard };
          for (let i = 0; i < 2; i++) {
            newGuard = guardMove(newGuard, nextPrisoner);
          }
          currentSimState = { prisoner: nextPrisoner, guard: newGuard };
          simulationSteps.push({ prisoner: { ...nextPrisoner }, guard: { ...newGuard } });
        });
        simulationIndex = 0;
        createSimulationControls();
        updateSimulationState();
        return;
      }

      openSet.delete(currentState);
      closedSet.add(currentState);

      for (const direction of directions) {
        const nextPrisoner = movePos(current.prisoner, direction);
        if (!nextPrisoner) continue;

        let newGuard = { ...current.guard };
        let caught = false;
        for (let i = 0; i < 2; i++) {
          newGuard = guardMove(newGuard, nextPrisoner);
          if (newGuard.x === nextPrisoner.x && newGuard.y === nextPrisoner.y) {
            caught = true;
            break;
          }
        }
        if (caught) continue;

        const neighborState = JSON.stringify({
          prisoner: nextPrisoner,
          guard: newGuard
        });

        if (closedSet.has(neighborState)) continue;

        const tentativeGScore = gScore.get(currentState) + 1;

        if (!openSet.has(neighborState)) {
          openSet.add(neighborState);
        } else if (tentativeGScore >= gScore.get(neighborState)) {
          continue;
        }

        cameFrom.set(neighborState, [currentState, direction]);
        gScore.set(neighborState, tentativeGScore);
        fScore.set(neighborState, tentativeGScore + manhattanDistance(nextPrisoner, nearestExit));
      }
    }

    document.getElementById("solution").textContent = "No solution found.";
  });
});