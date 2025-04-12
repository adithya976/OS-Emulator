function allocate() {
    const blocksInput = document.getElementById("blocks").value;
    const processesInput = document.getElementById("processes").value;
    const algorithm = document.getElementById("algorithm").value;
  
    const blocks = blocksInput.split(",").map(Number);
    const processes = processesInput.split(",").map(Number);
  
    if (blocks.some(isNaN) || processes.some(isNaN)) {
      alert("Please enter valid numeric values.");
      return;
    }
  
    let allocation;
    switch (algorithm) {
      case "first":
        allocation = firstFit([...blocks], processes);
        break;
      case "best":
        allocation = bestFit([...blocks], processes);
        break;
      case "worst":
        allocation = worstFit([...blocks], processes);
        break;
      case "next":
        allocation = nextFit([...blocks], processes);
        break;
    }
  
    displayTable(processes, allocation, algorithm);
  }
  
  function firstFit(blocks, processes) {
    const alloc = Array(processes.length).fill(-1);
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
    const alloc = Array(processes.length).fill(-1);
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
    const alloc = Array(processes.length).fill(-1);
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
    const alloc = Array(processes.length).fill(-1);
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
  
  function displayTable(processes, allocation, algorithmName) {
    let nameMap = {
      first: "First Fit",
      best: "Best Fit",
      worst: "Worst Fit",
      next: "Next Fit"
    };
  
    let html = `<h2>${nameMap[algorithmName]} Allocation Result</h2>`;
    html += `<table><tr><th>Process No.</th><th>Size</th><th>Block No.</th></tr>`;
    for (let i = 0; i < processes.length; i++) {
      html += `<tr><td>${i + 1}</td><td>${processes[i]}</td><td>${allocation[i] !== -1 ? allocation[i] + 1 : "Not Allocated"}</td></tr>`;
    }
    html += `</table>`;
    document.getElementById("output").innerHTML = html;
  }
  