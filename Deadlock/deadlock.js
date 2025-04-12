document.addEventListener('DOMContentLoaded', init);

let processes = [];
let resources = [];
let available = [];
let maxDemand = [];
let allocation = [];
let need = [];

function init() {
  console.log("Initializing deadlock simulator");
  
  const addProcessBtn = document.getElementById('add-process');
  const addResourceBtn = document.getElementById('add-resource');
  const resetBtn = document.getElementById('reset');
  const checkSafeBtn = document.getElementById('check-safe');
  const detectDeadlockBtn = document.getElementById('detect-deadlock');
  const resourceAllocationTable = document.getElementById('resource-allocation-table');
  const requestForm = document.getElementById('request-form');
  const resultArea = document.getElementById('result-area');
  const visualizationArea = document.getElementById('visualization');
  
  const startSimulationBtn = document.getElementById('start-simulation');
  const processCountInput = document.getElementById('process-count');
  const resourceCountInput = document.getElementById('resource-count');
  const initialSetupForm = document.getElementById('initial-setup-form');
  const simulatorContainer = document.getElementById('simulator-container');
  
  if (addProcessBtn) addProcessBtn.addEventListener('click', addProcess);
  if (addResourceBtn) addResourceBtn.addEventListener('click', addResource);
  if (resetBtn) resetBtn.addEventListener('click', resetSimulator);
  if (checkSafeBtn) checkSafeBtn.addEventListener('click', runBankersAlgorithm);
  if (detectDeadlockBtn) detectDeadlockBtn.addEventListener('click', detectDeadlock);
  
  if (startSimulationBtn) {
    startSimulationBtn.addEventListener('click', startSimulation);
  }
  
  function startSimulation() {
    console.log("Starting simulation");
    
    const processCount = parseInt(processCountInput.value) || 3;
    const resourceCount = parseInt(resourceCountInput.value) || 3;
    
    if (processCount <= 0 || resourceCount <= 0) {
      alert('Please enter valid positive numbers for processes and resources');
      return;
    }
    
    if (initialSetupForm) initialSetupForm.style.display = 'none';
    if (simulatorContainer) simulatorContainer.style.display = 'block';
    
    setupInitialState(processCount, resourceCount);
  }
  
  function setupInitialState(processCount = 3, resourceCount = 3) {
    console.log(`Setting up initial state with ${processCount} processes and ${resourceCount} resources`);
    
    processes = [];
    resources = [];
    available = [];
    maxDemand = [];
    allocation = [];
    need = [];
    
    for (let i = 0; i < processCount; i++) {
      addProcess(false);
    }
    
    for (let i = 0; i < resourceCount; i++) {
      addResource(false);
    }
    
    calculateNeed();
    updateAllocationTable();
    visualizeAllocation();
    showMessage("System initialized. Set resource allocations and check if the system is in a safe state.", "info");
  }
  
  function addProcess(updateUI = true) {
    const processId = processes.length;
    processes.push({
      id: processId,
      name: `P${processId}`
    });
    
    if (!allocation[processId]) {
      allocation[processId] = [];
      maxDemand[processId] = [];
      need[processId] = [];
      
      for (let i = 0; i < resources.length; i++) {
        allocation[processId][i] = 0;
        maxDemand[processId][i] = Math.floor(Math.random() * 10) + 1;
        need[processId][i] = maxDemand[processId][i];
      }
    }
    
    if (updateUI) {
      calculateNeed();
      updateAllocationTable();
      visualizeAllocation();
    }
  }
  
  function addResource(updateUI = true) {
    const resourceId = resources.length;
    const instancesValue = Math.floor(Math.random() * 10) + 5;
    
    resources.push({
      id: resourceId,
      name: `R${resourceId}`,
      instances: instancesValue
    });
    
    for (let i = 0; i < processes.length; i++) {
      if (!allocation[i]) {
        allocation[i] = [];
        maxDemand[i] = [];
        need[i] = [];
      }
      allocation[i][resourceId] = 0;
      maxDemand[i][resourceId] = Math.floor(Math.random() * instancesValue);
      need[i][resourceId] = maxDemand[i][resourceId];
    }
    
    if (updateUI) {
      calculateNeed();
      updateAllocationTable();
      visualizeAllocation();
    }
  }
  
  function updateAllocationTable() {
    if (!resourceAllocationTable) return;
    
    resourceAllocationTable.innerHTML = '';
    
    if (processes.length === 0 || resources.length === 0) {
      return;
    }
    
    let tableHTML = '<table class="allocation-table"><thead><tr><th>Process</th>';
    
    resources.forEach(resource => {
      tableHTML += `<th colspan="3">${resource.name}</th>`;
    });
    
    tableHTML += '</tr><tr><th></th>';
    
    resources.forEach(() => {
      tableHTML += '<th>Max</th><th>Alloc</th><th>Need</th>';
    });
    
    tableHTML += '</tr></thead><tbody>';
    
    processes.forEach((process, pIndex) => {
      tableHTML += `<tr><td>${process.name}</td>`;
      
      resources.forEach((resource, rIndex) => {
        tableHTML += `<td>
            <input type="number" min="0" class="resource-input max-input" 
            data-process="${pIndex}" data-resource="${rIndex}" 
            value="${maxDemand[pIndex][rIndex] || 0}">
        </td>`;
        
        tableHTML += `<td>
            <input type="number" min="0" class="resource-input alloc-input" 
            data-process="${pIndex}" data-resource="${rIndex}" 
            value="${allocation[pIndex][rIndex] || 0}">
        </td>`;
        
        tableHTML += `<td>${need[pIndex][rIndex] || 0}</td>`;
      });
      
      tableHTML += '</tr>';
    });
    
    tableHTML += '<tr class="resource-row"><td>Total Resources</td>';
    
    resources.forEach((resource, rIndex) => {
      tableHTML += `<td colspan="3">
            <input type="number" min="1" class="resource-input resource-total" 
            data-resource="${rIndex}" 
            value="${resource.instances}">
        </td>`;
    });
    
    tableHTML += '</tr>';
    
    tableHTML += '<tr class="available-row"><td>Available</td>';
    
    calculateAvailable();
    
    resources.forEach((resource, rIndex) => {
      tableHTML += `<td colspan="3" class="available-cell">${available[rIndex]}</td>`;
    });
    
    tableHTML += '</tr></tbody></table>';
    
    resourceAllocationTable.innerHTML = tableHTML;
    
    attachInputEventListeners();
    
    updateRequestForm();
  }
  
  function attachInputEventListeners() {
    console.log("Attaching input event listeners");
    
    document.querySelectorAll('.max-input').forEach(input => {
      input.addEventListener('change', function() {
        const pIdx = parseInt(this.dataset.process);
        const rIdx = parseInt(this.dataset.resource);
        const value = parseInt(this.value) || 0;
        
        maxDemand[pIdx][rIdx] = value;
        calculateNeed();
        updateAllocationTable();
        visualizeAllocation();
      });
    });
    
    document.querySelectorAll('.alloc-input').forEach(input => {
      input.addEventListener('change', function() {
        const pIdx = parseInt(this.dataset.process);
        const rIdx = parseInt(this.dataset.resource);
        const value = parseInt(this.value) || 0;
        
        if (value > maxDemand[pIdx][rIdx]) {
          showMessage(`Allocation cannot exceed maximum claim (${maxDemand[pIdx][rIdx]})`, 'error');
          this.value = allocation[pIdx][rIdx];
          return;
        }
        
        calculateAvailable();
        const oldValue = allocation[pIdx][rIdx] || 0;
        const availableAfterChange = available[rIdx] + oldValue - value;
        
        if (availableAfterChange < 0) {
          showMessage(`Not enough resources available. Current available: ${available[rIdx]}`, 'error');
          this.value = allocation[pIdx][rIdx];
          return;
        }
        
        allocation[pIdx][rIdx] = value;
        calculateNeed();
        updateAllocationTable();
        visualizeAllocation();
      });
    });
    
    document.querySelectorAll('.resource-total').forEach(input => {
      input.addEventListener('change', function() {
        const rIdx = parseInt(this.dataset.resource);
        const value = parseInt(this.value) || 0;
        
        let totalAllocated = 0;
        for (let i = 0; i < processes.length; i++) {
          totalAllocated += allocation[i][rIdx] || 0;
        }
        
        if (value < totalAllocated) {
          showMessage(`Cannot reduce resource instances below current allocations (${totalAllocated})`, 'error');
          this.value = resources[rIdx].instances;
          return;
        }
        
        resources[rIdx].instances = value;
        calculateNeed();
        updateAllocationTable();
        visualizeAllocation();
        showMessage(`Updated ${resources[rIdx].name} to ${value} instances`, 'info');
      });
    });
  }
  
  function updateRequestForm() {
    if (!requestForm) return;
    
    if (processes.length === 0 || resources.length === 0) {
      requestForm.innerHTML = '';
      return;
    }
    
    let processOptions = '';
    processes.forEach(process => {
      processOptions += `<option value="${process.id}">${process.name}</option>`;
    });
    
    calculateAvailable();
    
    let resourceOptions = '';
    resources.forEach(resource => {
      resourceOptions += `<option value="${resource.id}">${resource.name} (${available[resource.id]} available)</option>`;
    });
    
    requestForm.innerHTML = `
      <div class="request-form-container">
        <h3>Request Resources</h3>
        <div class="form-group">
          <label for="request-process">Process:</label>
          <select id="request-process">${processOptions}</select>
        </div>
        <div class="form-group">
          <label for="request-resource">Resource:</label>
          <select id="request-resource">${resourceOptions}</select>
        </div>
        <div class="form-group">
          <label for="request-amount">Amount:</label>
          <input type="number" id="request-amount" min="1" value="1">
        </div>
        <button id="request-resource-btn" class="btn btn-primary">Request Resources</button>
      </div>
    `;
    
    document.getElementById('request-resource-btn').addEventListener('click', handleResourceRequest);
  }
  
  function calculateAvailable() {
    available = [];
    
    for (let j = 0; j < resources.length; j++) {
      let totalAllocated = 0;
      for (let i = 0; i < processes.length; i++) {
        totalAllocated += allocation[i][j] || 0;
      }
      available[j] = resources[j].instances - totalAllocated;
    }
    
    return available;
  }
  
  function calculateNeed() {
    for (let i = 0; i < processes.length; i++) {
      for (let j = 0; j < resources.length; j++) {
        need[i][j] = Math.max(0, maxDemand[i][j] - allocation[i][j]);
      }
    }
    
    calculateAvailable();
  }
  
  function handleResourceRequest() {
    const processSelect = document.getElementById('request-process');
    const resourceSelect = document.getElementById('request-resource');
    const amountInput = document.getElementById('request-amount');
    
    if (!processSelect || !resourceSelect || !amountInput) return;
    
    const processId = parseInt(processSelect.value);
    const resourceId = parseInt(resourceSelect.value);
    const requestAmount = parseInt(amountInput.value);
    
    if (isNaN(requestAmount) || requestAmount <= 0) {
      showMessage('Request amount must be a positive number.', 'error');
      return;
    }
    
    if (requestAmount + allocation[processId][resourceId] > maxDemand[processId][resourceId]) {
      showMessage(`Request denied: Exceeds maximum claim for ${processes[processId].name}.`, 'error');
      return;
    }
    
    if (requestAmount > available[resourceId]) {
      showMessage(`Request denied: Not enough ${resources[resourceId].name} available.`, 'error');
      return;
    }
    
    const originalAllocation = allocation[processId][resourceId];
    
    allocation[processId][resourceId] += requestAmount;
    calculateNeed();
    
    const safe = runBankersAlgorithm(true);
    
    if (!safe) {
      allocation[processId][resourceId] = originalAllocation;
      calculateNeed();
      
      showMessage(`Request denied: Would lead to unsafe state with potential deadlock.`, 'error');
      updateAllocationTable();
      visualizeAllocation();
    } else {
      showMessage(`Request granted for ${processes[processId].name}: ${requestAmount} instances of ${resources[resourceId].name}.`, 'success');
      updateAllocationTable();
      visualizeAllocation();
    }
  }
  
  function runBankersAlgorithm(silentMode = false) {
    console.log("Running Banker's Algorithm");
    calculateNeed();
    
    const processCount = processes.length;
    const resourceCount = resources.length;
    
    const work = [...available];
    
    const finish = Array(processCount).fill(false);
    
    const safeSeq = [];
    
    let progress = true;
    while (finish.includes(false) && progress) {
      progress = false;
      
      for (let i = 0; i < processCount; i++) {
        if (finish[i]) continue;
        
        let canAllocate = true;
        for (let j = 0; j < resourceCount; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }
        
        if (canAllocate) {
          for (let j = 0; j < resourceCount; j++) {
            work[j] += allocation[i][j];
          }
          
          finish[i] = true;
          safeSeq.push(i);
          progress = true;
        }
      }
    }
    
    const isSafe = !finish.includes(false);
    
    if (!silentMode) {
      if (isSafe) {
        showMessage(`System is in a SAFE state.<br>Safe sequence: ${safeSeq.map(p => processes[p].name).join(' → ')}`, 'success');
      } else {
        const deadlocked = processes
          .filter((_, idx) => !finish[idx])
          .map(p => p.name)
          .join(', ');
        
        showMessage(`System is in an UNSAFE state!<br>Potential deadlock detected with processes: ${deadlocked}`, 'error');
      }
    }
    
    return isSafe;
  }
  
  function detectDeadlock() {
    console.log("Detecting deadlock");
    calculateNeed();
    
    const processCount = processes.length;
    const resourceCount = resources.length;
    
    const work = [...available];
    
    const finish = Array(processCount).fill(false);
    
    let progress = true;
    while (finish.includes(false) && progress) {
      progress = false;
      
      for (let i = 0; i < processCount; i++) {
        if (finish[i]) continue;
        
        let canProceed = true;
        for (let j = 0; j < resourceCount; j++) {
          if (need[i][j] > work[j]) {
            canProceed = false;
            break;
          }
        }
        
        if (canProceed) {
          for (let j = 0; j < resourceCount; j++) {
            work[j] += allocation[i][j];
          }
          
          finish[i] = true;
          progress = true;
        }
      }
    }
    
    const deadlocked = processes
      .filter((_, idx) => !finish[idx])
      .map(p => p.name);
    
    if (deadlocked.length > 0) {
      showMessage(`Deadlock detected!<br>Processes in deadlock: ${deadlocked.join(', ')}`, 'error');
    } else {
      showMessage(`No deadlock detected. All processes can complete.`, 'success');
    }
  }
  
  function visualizeAllocation() {
    if (!visualizationArea) return;
    
    visualizationArea.innerHTML = '';
    
    processes.forEach((process, pIndex) => {
      const processDiv = document.createElement('div');
      processDiv.className = 'process-container';
      processDiv.innerHTML = `<h3>${process.name}</h3>`;
      
      const resourcesDiv = document.createElement('div');
      resourcesDiv.className = 'resources-row';
      
      resources.forEach((resource, rIndex) => {
        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'resource-block';
        
        const maxClaim = maxDemand[pIndex][rIndex];
        const allocatedAmount = allocation[pIndex][rIndex];
        const needAmount = need[pIndex][rIndex];
        
        if (maxClaim > 0) {
          resourceDiv.innerHTML = `
            <div class="resource-name">${resource.name}</div>
            <div class="resource-bar">
              <div class="allocated" style="width: ${(allocatedAmount / maxClaim) * 100}%"></div>
              <div class="needed" style="width: ${(needAmount / maxClaim) * 100}%"></div>
            </div>
            <div class="resource-label">${allocatedAmount}/${maxClaim}</div>
          `;
          resourcesDiv.appendChild(resourceDiv);
        }
      });
      
      processDiv.appendChild(resourcesDiv);
      visualizationArea.appendChild(processDiv);
    });
    
    const availableDiv = document.createElement('div');
    availableDiv.className = 'available-container';
    availableDiv.innerHTML = '<h3>Available Resources</h3>';
    
    const availableResourcesDiv = document.createElement('div');
    availableResourcesDiv.className = 'resources-row';
    
    resources.forEach((resource, rIndex) => {
      const resourceDiv = document.createElement('div');
      resourceDiv.className = 'resource-block';
      
      const availableAmount = available[rIndex];
      const totalAmount = resource.instances;
      
      resourceDiv.innerHTML = `
        <div class="resource-name">${resource.name}</div>
        <div class="resource-bar">
          <div class="available" style="width: ${(availableAmount / totalAmount) * 100}%"></div>
        </div>
        <div class="resource-label">${availableAmount}/${totalAmount}</div>
      `;
      
      availableResourcesDiv.appendChild(resourceDiv);
    });
    
    availableDiv.appendChild(availableResourcesDiv);
    visualizationArea.appendChild(availableDiv);
  }
  
  function showMessage(message, type) {
    if (!resultArea) return;
    
    resultArea.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    resultArea.scrollIntoView({ behavior: 'smooth' });
  }
  
  function resetSimulator() {
    console.log("Resetting simulator");
    
    processes = [];
    resources = [];
    available = [];
    maxDemand = [];
    allocation = [];
    need = [];
    
    if (resourceAllocationTable) resourceAllocationTable.innerHTML = '';
    if (requestForm) requestForm.innerHTML = '';
    if (resultArea) resultArea.innerHTML = '';
    if (visualizationArea) visualizationArea.innerHTML = '';
    
    if (initialSetupForm && simulatorContainer) {
      initialSetupForm.style.display = 'block';
      simulatorContainer.style.display = 'none';
    } else {
      setupInitialState();
    }
  }

  window.runBankersAlgorithmGlobal = runBankersAlgorithm;
  window.detectDeadlockGlobal = detectDeadlock;
  window.resetSimulatorGlobal = resetSimulator;
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded, checking for buttons...");
  
  const checkSafeBtn = document.getElementById('check-safe');
  if (checkSafeBtn) {
    console.log("Check Safe State button found, attaching event listener");
    checkSafeBtn.addEventListener('click', function() {
      console.log("Check Safe State button clicked");
      if (typeof window.runBankersAlgorithmGlobal === 'function') {
        window.runBankersAlgorithmGlobal();
      } else {
        console.error("runBankersAlgorithmGlobal function not found");
        const resultArea = document.getElementById('result-area');
        if (resultArea) {
          resultArea.innerHTML = '<div class="message error">Error: Banker\'s Algorithm function not available. Check the console for errors.</div>';
        }
      }
    });
  }
  
  const detectDeadlockBtn = document.getElementById('detect-deadlock');
  if (detectDeadlockBtn) {
    console.log("Detect Deadlock button found, attaching event listener");
    detectDeadlockBtn.addEventListener('click', function() {
      console.log("Detect Deadlock button clicked");
      if (typeof window.detectDeadlockGlobal === 'function') {
        window.detectDeadlockGlobal();
      } else {
        console.error("detectDeadlockGlobal function not found");
        const resultArea = document.getElementById('result-area');
        if (resultArea) {
          resultArea.innerHTML = '<div class="message error">Error: Deadlock Detection function not available. Check the console for errors.</div>';
        }
      }
    });
  }
});
