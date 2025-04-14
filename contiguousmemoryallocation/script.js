document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("simulator").style.display = "block";
  document.getElementById("startBtn").style.display = "none";
  window.scrollTo({
    top: document.getElementById("simulator").offsetTop,
    behavior: "smooth"
  });
});

function simulate() {
  const blockSizes = document.getElementById("blocks").value.split(",").map(Number);
  const processSizes = document.getElementById("processes").value.split(",").map(Number);
  const strategy = document.getElementById("strategy").value;

  let result = [];
  switch (strategy) {
    case "first": result = firstFit(blockSizes, processSizes); break;
    case "best": result = bestFit(blockSizes, processSizes); break;
    case "worst": result = worstFit(blockSizes, processSizes); break;
    case "next": result = nextFit(blockSizes, processSizes); break;
  }

  displayResult(processSizes, result);
}

function firstFit(blocks, processes) {
  let alloc = Array(processes.length).fill(-1);
  for (let i = 0; i < processes.length; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (blocks[j] >= processes[i]) {
        alloc[i] = j;
        blocks[j] -= processes[i];
        break;
      }
    }
  }
  return alloc;
}

function bestFit(blocks, processes) {
  let alloc = Array(processes.length).fill(-1);
  for (let i = 0; i < processes.length; i++) {
    let bestIdx = -1;
    for (let j = 0; j < blocks.length; j++) {
      if (blocks[j] >= processes[i]) {
        if (bestIdx === -1 || blocks[j] < blocks[bestIdx]) {
          bestIdx = j;
        }
      }
    }
    if (bestIdx !== -1) {
      alloc[i] = bestIdx;
      blocks[bestIdx] -= processes[i];
    }
  }
  return alloc;
}

function worstFit(blocks, processes) {
  let alloc = Array(processes.length).fill(-1);
  for (let i = 0; i < processes.length; i++) {
    let worstIdx = -1;
    for (let j = 0; j < blocks.length; j++) {
      if (blocks[j] >= processes[i]) {
        if (worstIdx === -1 || blocks[j] > blocks[worstIdx]) {
          worstIdx = j;
        }
      }
    }
    if (worstIdx !== -1) {
      alloc[i] = worstIdx;
      blocks[worstIdx] -= processes[i];
    }
  }
  return alloc;
}

function nextFit(blocks, processes) {
  let alloc = Array(processes.length).fill(-1);
  let lastIndex = 0;
  for (let i = 0; i < processes.length; i++) {
    let found = false;
    for (let j = lastIndex; j < blocks.length; j++) {
      if (blocks[j] >= processes[i]) {
        alloc[i] = j;
        blocks[j] -= processes[i];
        lastIndex = j;
        found = true;
        break;
      }
    }
    if (!found) {
      for (let j = 0; j < lastIndex; j++) {
        if (blocks[j] >= processes[i]) {
          alloc[i] = j;
          blocks[j] -= processes[i];
          lastIndex = j;
          break;
        }
      }
    }
  }
  return alloc;
}

function displayResult(processes, alloc) {
  let html = `<h3>📋 Allocation Results</h3><table><tr><th>Process No.</th><th>Size</th><th>Block No.</th></tr>`;
  for (let i = 0; i < processes.length; i++) {
    html += `<tr><td>${i + 1}</td><td>${processes[i]}</td><td>${alloc[i] !== -1 ? alloc[i] + 1 : "Not Allocated"}</td></tr>`;
  }
  html += `</table>`;
  document.getElementById("result").innerHTML = html;
}
