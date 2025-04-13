document.addEventListener('DOMContentLoaded', init);

let processes = [];
let resources = [];
let available = [];
let maxDemand = [];
let allocation = [];
let need = [];
let request = [];

// RAG data structures
let ragProcesses = [];
let ragResources = [];
let ragEdges = {
    claim: [],     // Process -> Resource (claim edges)
    request: [],   // Process -> Resource (request edges)
    allocation: [] // Resource -> Process (allocation edges)
};

function init() {
    console.log("Initializing deadlock simulator");
    
    // Get DOM elements
    const algorithmSelect = document.getElementById('algorithm-type');
    const startSimulationBtn = document.getElementById('start-simulation');
    const initialSetupForm = document.getElementById('initial-setup-form');
    const processCountInput = document.getElementById('process-count');
    const resourceCountInput = document.getElementById('resource-count');
    const simulatorContainer = document.getElementById('simulator-container');
    const ragContainer = document.getElementById('rag-container');
    
    // Get buttons
    const addProcessBtn = document.getElementById('add-process');
    const addResourceBtn = document.getElementById('add-resource');
    const checkSafeBtn = document.getElementById('check-safe');
    const detectDeadlockBtn = document.getElementById('detect-deadlock');
    const resetBtn = document.getElementById('reset');
    
    const addRagProcessBtn = document.getElementById('add-rag-process');
    const addRagResourceBtn = document.getElementById('add-rag-resource');
    const addClaimEdgeBtn = document.getElementById('add-claim-edge');
    const addRequestEdgeBtn = document.getElementById('add-request-edge');
    const addAllocationEdgeBtn = document.getElementById('add-allocation-edge');
    const checkRagSafeBtn = document.getElementById('check-rag-safe');
    const detectRagDeadlockBtn = document.getElementById('detect-rag-deadlock');
    const resetRagBtn = document.getElementById('reset-rag');
    
    // Get tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Attach event listeners
    if (startSimulationBtn) {
        startSimulationBtn.addEventListener('click', startSimulation);
    }
    
    if (addProcessBtn) addProcessBtn.addEventListener('click', addProcess);
    if (addResourceBtn) addResourceBtn.addEventListener('click', addResource);
    if (checkSafeBtn) checkSafeBtn.addEventListener('click', runBankersAlgorithm);
    if (detectDeadlockBtn) detectDeadlockBtn.addEventListener('click', detectDeadlock);
    if (resetBtn) resetBtn.addEventListener('click', resetSimulator);
    
    if (addRagProcessBtn) addRagProcessBtn.addEventListener('click', addRagProcess);
    if (addRagResourceBtn) addRagResourceBtn.addEventListener('click', addRagResource);
    if (addClaimEdgeBtn) addClaimEdgeBtn.addEventListener('click', addClaimEdge);
    if (addRequestEdgeBtn) addRequestEdgeBtn.addEventListener('click', addRequestEdge);
    if (addAllocationEdgeBtn) addAllocationEdgeBtn.addEventListener('click', addAllocationEdge);
    if (checkRagSafeBtn) checkRagSafeBtn.addEventListener('click', checkRagSafe);
    if (detectRagDeadlockBtn) detectRagDeadlockBtn.addEventListener('click', detectRagDeadlock);
    if (resetRagBtn) resetRagBtn.addEventListener('click', resetRag);
    
    tabButtons.forEach(button => {
        button.addEventListener('click', switchTab);
    });
    
    function startSimulation() {
        console.log("Starting simulation");
        
        const processCount = parseInt(processCountInput.value) || 3;
        const resourceCount = parseInt(resourceCountInput.value) || 3;
        const algorithmType = algorithmSelect.value;
        
        if (processCount <= 0 || resourceCount <= 0) {
            alert('Please enter valid positive numbers for processes and resources');
            return;
        }
        
        initialSetupForm.style.display = 'none';
        
        if (algorithmType === 'bankers') {
            simulatorContainer.style.display = 'block';
            ragContainer.style.display = 'none';
            setupBankersAlgorithm(processCount, resourceCount);
        } else {
            simulatorContainer.style.display = 'none';
            ragContainer.style.display = 'block';
            setupRag(processCount, resourceCount);
        }
    }
    
    function setupBankersAlgorithm(processCount, resourceCount) {
        console.log(`Setting up Banker's Algorithm with ${processCount} processes and ${resourceCount} resources`);
        
        // Initialize data structures
        processes = [];
        resources = [];
        available = [];
        maxDemand = [];
        allocation = [];
        need = [];
        request = [];
        
        // Create processes and resources
        for (let i = 0; i < processCount; i++) {
            addProcess(false);
        }
        
        for (let i = 0; i < resourceCount; i++) {
            addResource(false);
        }
        
        // Initialize request matrix
        for (let i = 0; i < processCount; i++) {
            request[i] = [];
            for (let j = 0; j < resourceCount; j++) {
                request[i][j] = 0;
            }
        }
        
        calculateNeed();
        updateAllocationTable();
        visualizeAllocation();
        showMessage("Banker's Algorithm initialized. Set resource allocations and check if the system is in a safe state.", "info", 'result-area');
    }
    
    function setupRag(processCount, resourceCount) {
        console.log(`Setting up RAG with ${processCount} processes and ${resourceCount} resources`);
        
        // Initialize RAG data structures
        ragProcesses = [];
        ragResources = [];
        ragEdges = {
            claim: [],
            request: [],
            allocation: []
        };
        
        // Create processes and resources
        for (let i = 0; i < processCount; i++) {
            addRagProcess(false);
        }
        
        for (let i = 0; i < resourceCount; i++) {
            addRagResource(false);
        }
        
        drawRag();
        updateEdgeList();
        showMessage("Resource Allocation Graph initialized. Add edges to model the system state.", "info", 'rag-result-area');
    }
    
    function switchTab() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        tabContents.forEach(content => content.classList.add('hidden'));
        
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId + '-tab').classList.remove('hidden');
        
        // Show/hide appropriate buttons based on the active tab
        if (tabId === 'avoidance') {
            document.getElementById('check-safe').style.display = 'inline-block';
            document.getElementById('detect-deadlock').style.display = 'none';
        } else if (tabId === 'detection') {
            document.getElementById('check-safe').style.display = 'none';
            document.getElementById('detect-deadlock').style.display = 'inline-block';
        } else if (tabId === 'rag-avoidance') {
            document.getElementById('check-rag-safe').style.display = 'inline-block';
            document.getElementById('detect-rag-deadlock').style.display = 'none';
        } else if (tabId === 'rag-detection') {
            document.getElementById('check-rag-safe').style.display = 'none';
            document.getElementById('detect-rag-deadlock').style.display = 'inline-block';
        }
    }
    
    function showMessage(message, type, targetId = 'result-area') {
        const resultArea = document.getElementById(targetId);
        if (!resultArea) return;
        
        resultArea.innerHTML = `<div class="message ${type}">${message}</div>`;
        resultArea.scrollIntoView({ behavior: 'smooth' });
    }
}

// Banker's Algorithm Functions
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
        request[processId] = [];
        
        for (let i = 0; i < resources.length; i++) {
            allocation[processId][i] = 0;
            maxDemand[processId][i] = Math.floor(Math.random() * 10) + 1;
            need[processId][i] = maxDemand[processId][i];
            request[processId][i] = 0;
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
            request[i] = [];
        }
        allocation[i][resourceId] = 0;
        maxDemand[i][resourceId] = Math.floor(Math.random() * instancesValue);
        need[i][resourceId] = maxDemand[i][resourceId];
        request[i][resourceId] = 0;
    }
    
    if (updateUI) {
        calculateNeed();
        updateAllocationTable();
        visualizeAllocation();
    }
}

function updateAllocationTable() {
    const resourceAllocationTable = document.getElementById('resource-allocation-table');
    if (!resourceAllocationTable) return;
    
    resourceAllocationTable.innerHTML = '';
    
    if (processes.length === 0 || resources.length === 0) {
        return;
    }
    
    // Create table header
    let tableHTML = '<table class="allocation-table"><thead><tr><th>Process</th>';
    
    resources.forEach(resource => {
        tableHTML += `<th colspan="3">${resource.name}</th>`;
    });
    
    tableHTML += '</tr><tr><th></th>';
    
    resources.forEach(() => {
        tableHTML += '<th>Max</th><th>Alloc</th><th>Need</th>';
    });
    
    tableHTML += '</tr></thead><tbody>';
    
    // Create rows for each process
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
    
    // Add row for total resources
    tableHTML += '<tr class="resource-row"><td>Total Resources</td>';
    
    resources.forEach((resource, rIndex) => {
        tableHTML += `<td colspan="3">
                <input type="number" min="1" class="resource-input resource-total" 
                data-resource="${rIndex}" 
                value="${resource.instances}">
            </td>`;
    });
    
    tableHTML += '</tr>';
    
    // Add row for available resources
    tableHTML += '<tr class="available-row"><td>Available</td>';
    
    calculateAvailable();
    
    resources.forEach((resource, rIndex) => {
        tableHTML += `<td colspan="3" class="available-cell">${available[rIndex]}</td>`;
    });
    
    tableHTML += '</tr></tbody></table>';
    
    resourceAllocationTable.innerHTML = tableHTML;
    
    // Attach event listeners to inputs
    attachInputEventListeners();
    
    // Update request form
    updateRequestForm();
}

function attachInputEventListeners() {
    console.log("Attaching input event listeners");
    
    // Max input listeners
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
    
    // Allocation input listeners
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
    
    // Resource total listeners
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
    const requestForm = document.getElementById('request-form');
    if (!requestForm) return;
    
    if (processes.length === 0 || resources.length === 0) {
        requestForm.innerHTML = '';
        return;
    }
    
    // Create process dropdown options
    let processOptions = '';
    processes.forEach(process => {
        processOptions += `<option value="${process.id}">${process.name}</option>`;
    });
    
    calculateAvailable();
    
    // Create resource dropdown options
    let resourceOptions = '';
    resources.forEach(resource => {
        resourceOptions += `<option value="${resource.id}">${resource.name} (${available[resource.id]} available)</option>`;
    });
    
    // Create the request form
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
    
    // Attach event listener to request button
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
    
    // Save original allocation
    const originalAllocation = allocation[processId][resourceId];
    
    // Try to allocate
    allocation[processId][resourceId] += requestAmount;
    calculateNeed();
    
    // Check if safe
    const safe = runBankersAlgorithm(true);
    
    if (!safe) {
        // Rollback if unsafe
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
    
    // Available resources for the algorithm
    const work = [...available];
    
    // Track which processes have completed
    const finish = Array(processCount).fill(false);
    
    // Safe sequence of processes
    const safeSeq = [];
    
    // Keep going until no more progress can be made or all processes are finished
    let progress = true;
    while (finish.includes(false) && progress) {
        progress = false;
        
        for (let i = 0; i < processCount; i++) {
            if (finish[i]) continue;
            
            // Check if this process can be completed with available resources
            let canAllocate = true;
            for (let j = 0; j < resourceCount; j++) {
                if (need[i][j] > work[j]) {
                    canAllocate = false;
                    break;
                }
            }
            
            if (canAllocate) {
                // If can complete, release its resources
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
    
    // Check which processes can complete with current resources
    let progress = true;
    while (finish.includes(false) && progress) {
        progress = false;
        
        for (let i = 0; i < processCount; i++) {
            if (finish[i]) continue;
            
            let canProceed = true;
            for (let j = 0; j < resourceCount; j++) {
                if (request[i][j] > 0 && request[i][j] > work[j]) {
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
    
    // Any unfinished processes are deadlocked
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
    const visualizationArea = document.getElementById('visualization');
    if (!visualizationArea) return;
    
    visualizationArea.innerHTML = '';
    
    // Visualize each process
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
    
    // Visualize available resources
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

function resetSimulator() {
    console.log("Resetting simulator");
    
    // Reset all data
    processes = [];
    resources = [];
    available = [];
    maxDemand = [];
    allocation = [];
    need = [];
    request = [];
    
    // Clear UI
    const resourceAllocationTable = document.getElementById('resource-allocation-table');
    const requestForm = document.getElementById('request-form');
    const resultArea = document.getElementById('result-area');
    const visualizationArea = document.getElementById('visualization');
    const initialSetupForm = document.getElementById('initial-setup-form');
    const simulatorContainer = document.getElementById('simulator-container');
    
    if (resourceAllocationTable) resourceAllocationTable.innerHTML = '';
    if (requestForm) requestForm.innerHTML = '';
    if (resultArea) resultArea.innerHTML = '';
    if (visualizationArea) visualizationArea.innerHTML = '';
    
    if (initialSetupForm && simulatorContainer) {
        initialSetupForm.style.display = 'block';
        simulatorContainer.style.display = 'none';
    }
}

// RAG Functions
function addRagProcess(updateUI = true) {
    const processId = ragProcesses.length;
    ragProcesses.push({
        id: processId,
        name: `P${processId}`,
        x: 100 + (processId % 3) * 150,
        y: 100 + Math.floor(processId / 3) * 120
    });
    
    if (updateUI) {
        drawRag();
        updateEdgeList();
    }
}

function addRagResource(updateUI = true) {
    const resourceId = ragResources.length;
    ragResources.push({
        id: resourceId,
        name: `R${resourceId}`,
        x: 500 - (resourceId % 3) * 150,
        y: 100 + Math.floor(resourceId / 3) * 120
    });
    
    if (updateUI) {
        drawRag();
        updateEdgeList();
    }
}

function addClaimEdge() {
    const edgeForm = document.getElementById('rag-edge-form');
    
    let processOptions = '';
    ragProcesses.forEach(process => {
        processOptions += `<option value="${process.id}">${process.name}</option>`;
    });
    
    let resourceOptions = '';
    ragResources.forEach(resource => {
        resourceOptions += `<option value="${resource.id}">${resource.name}</option>`;
    });
    
    edgeForm.innerHTML = `
        <div class="form-group">
            <label>Process:</label>
            <select id="claim-process">${processOptions}</select>
        </div>
        <div class="form-group">
            <label>Resource:</label>
            <select id="claim-resource">${resourceOptions}</select>
        </div>
        <button id="add-claim-edge-btn" class="btn btn-primary">Add Claim Edge</button>
    `;
    
    document.getElementById('add-claim-edge-btn').addEventListener('click', function() {
        const processId = parseInt(document.getElementById('claim-process').value);
        const resourceId = parseInt(document.getElementById('claim-resource').value);
        
        const existingClaimEdge = ragEdges.claim.find(edge => 
            edge.from === processId && edge.to === resourceId + ragProcesses.length);
        
        const existingAllocationEdge = ragEdges.allocation.find(edge => 
            edge.from === resourceId + ragProcesses.length && edge.to === processId);
        
        if (existingClaimEdge) {
            showMessage('This claim edge already exists.', 'error', 'rag-result-area');
            return;
        }
        
        if (existingAllocationEdge) {
            showMessage('Cannot add claim edge when resource is already allocated.', 'error', 'rag-result-area');
            return;
        }
        
        ragEdges.claim.push({
            id: `claim-${processId}-${resourceId}`,
            from: processId,
            to: resourceId + ragProcesses.length,
            type: 'claim'
        });
        
        drawRag();
        updateEdgeList();
    });
}

function addRequestEdge() {
    const edgeForm = document.getElementById('rag-edge-form');
    
    let processOptions = '';
    ragProcesses.forEach(process => {
        processOptions += `<option value="${process.id}">${process.name}</option>`;
    });
    
    let resourceOptions = '';
    ragResources.forEach(resource => {
        resourceOptions += `<option value="${resource.id}">${resource.name}</option>`;
    });
    
    edgeForm.innerHTML = `
        <div class="form-group">
            <label>Process:</label>
            <select id="request-process">${processOptions}</select>
        </div>
        <div class="form-group">
            <label>Resource:</label>
            <select id="request-resource">${resourceOptions}</select>
        </div>
        <button id="add-request-edge-btn" class="btn btn-primary">Add Request Edge</button>
    `;
    
    document.getElementById('add-request-edge-btn').addEventListener('click', function() {
        const processId = parseInt(document.getElementById('request-process').value);
        const resourceId = parseInt(document.getElementById('request-resource').value);
        
        const existingRequestEdge = ragEdges.request.find(edge => 
            edge.from === processId && edge.to === resourceId + ragProcesses.length);
        
        const existingAllocationEdge = ragEdges.allocation.find(edge => 
            edge.from === resourceId + ragProcesses.length && edge.to === processId);
        
        if (existingRequestEdge) {
            showMessage('This request edge already exists.', 'error', 'rag-result-area');
            return;
        }
        
        if (existingAllocationEdge) {
            showMessage('Cannot request a resource that is already allocated to this process.', 'error', 'rag-result-area');
            return;
        }
        
        ragEdges.request.push({
            id: `request-${processId}-${resourceId}`,
            from: processId,
            to: resourceId + ragProcesses.length,
            type: 'request'
        });
        
        drawRag();
        updateEdgeList();
    });
}

function addAllocationEdge() {
    const edgeForm = document.getElementById('rag-edge-form');
    
    let resourceOptions = '';
    ragResources.forEach(resource => {
        resourceOptions += `<option value="${resource.id}">${resource.name}</option>`;
    });
    
    let processOptions = '';
    ragProcesses.forEach(process => {
        processOptions += `<option value="${process.id}">${process.name}</option>`;
    });
    
    edgeForm.innerHTML = `
        <div class="form-group">
            <label>Resource:</label>
            <select id="allocation-resource">${resourceOptions}</select>
        </div>
        <div class="form-group">
            <label>Process:</label>
            <select id="allocation-process">${processOptions}</select>
        </div>
        <button id="add-allocation-edge-btn" class="btn btn-primary">Add Allocation Edge</button>
    `;
    
    document.getElementById('add-allocation-edge-btn').addEventListener('click', function() {
        const resourceId = parseInt(document.getElementById('allocation-resource').value);
        const processId = parseInt(document.getElementById('allocation-process').value);
        
        const existingAllocationEdge = ragEdges.allocation.find(edge => 
            edge.from === resourceId + ragProcesses.length && edge.to === processId);
        
        const existingClaimEdge = ragEdges.claim.find(edge => 
            edge.from === processId && edge.to === resourceId + ragProcesses.length);
        
        const existingRequestEdge = ragEdges.request.find(edge => 
            edge.from === processId && edge.to === resourceId + ragProcesses.length);
        
        if (existingAllocationEdge) {
            showMessage('This resource is already allocated to this process.', 'error', 'rag-result-area');
            return;
        }
        
        // If there's a claim edge, remove it when allocating
        if (existingClaimEdge) {
            ragEdges.claim = ragEdges.claim.filter(edge => 
                !(edge.from === processId && edge.to === resourceId + ragProcesses.length));
        }
        
        // If there's a request edge, fulfill it by removing it
        if (existingRequestEdge) {
            ragEdges.request = ragEdges.request.filter(edge => 
                !(edge.from === processId && edge.to === resourceId + ragProcesses.length));
        }
        
        ragEdges.allocation.push({
            id: `allocation-${resourceId}-${processId}`,
            from: resourceId + ragProcesses.length,
            to: processId,
            type: 'allocation'
        });
        
        drawRag();
        updateEdgeList();
    });
}

function updateEdgeList() {
    const edgeList = document.getElementById('rag-edge-list');
    if (!edgeList) return;
    
    let html = '<h3>Edges</h3>';
    
    // List claim edges
    if (ragEdges.claim.length > 0) {
        html += '<div class="edge-category"><h4>Claim Edges</h4>';
        ragEdges.claim.forEach(edge => {
            const process = ragProcesses[edge.from];
            const resource = ragResources[edge.to - ragProcesses.length];
            html += `<div class="edge-item edge-item-claim">
                ${process.name} → ${resource.name}
                <button class="btn btn-danger" data-edge-id="${edge.id}" data-edge-type="claim">Remove</button>
            </div>`;
        });
        html += '</div>';
    }
    
    // List request edges
    if (ragEdges.request.length > 0) {
        html += '<div class="edge-category"><h4>Request Edges</h4>';
        ragEdges.request.forEach(edge => {
            const process = ragProcesses[edge.from];
            const resource = ragResources[edge.to - ragProcesses.length];
            html += `<div class="edge-item edge-item-request">
                ${process.name} → ${resource.name}
                <button class="btn btn-danger" data-edge-id="${edge.id}" data-edge-type="request">Remove</button>
            </div>`;
        });
        html += '</div>';
    }
    
    // List allocation edges
    if (ragEdges.allocation.length > 0) {
        html += '<div class="edge-category"><h4>Allocation Edges</h4>';
        ragEdges.allocation.forEach(edge => {
            const resource = ragResources[edge.from - ragProcesses.length];
            const process = ragProcesses[edge.to];
            html += `<div class="edge-item edge-item-allocation">
                ${resource.name} → ${process.name}
                <button class="btn btn-danger" data-edge-id="${edge.id}" data-edge-type="allocation">Remove</button>
            </div>`;
        });
        html += '</div>';
    }
    
    edgeList.innerHTML = html;
    
    // Attach event listeners to remove buttons
    document.querySelectorAll('#rag-edge-list button').forEach(button => {
        button.addEventListener('click', function() {
            const edgeId = this.dataset.edgeId;
            const edgeType = this.dataset.edgeType;
            
            ragEdges[edgeType] = ragEdges[edgeType].filter(edge => edge.id !== edgeId);
            
            drawRag();
            updateEdgeList();
        });
    });
}

function drawRag() {
    const canvas = document.getElementById('rag-canvas');
    if (!canvas) return;
    
    canvas.innerHTML = '';
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    
    // Add arrow marker definitions
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const arrowMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    arrowMarker.setAttribute("id", "arrowhead");
    arrowMarker.setAttribute("markerWidth", "10");
    arrowMarker.setAttribute("markerHeight", "7");
    arrowMarker.setAttribute("refX", "9");
    arrowMarker.setAttribute("refY", "3.5");
    arrowMarker.setAttribute("orient", "auto");
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    
    arrowMarker.appendChild(polygon);
    defs.appendChild(arrowMarker);
    svg.appendChild(defs);
    
    // Draw edges
    [...ragEdges.claim, ...ragEdges.request, ...ragEdges.allocation].forEach(edge => {
        const fromNode = edge.from < ragProcesses.length ? 
            ragProcesses[edge.from] : 
            ragResources[edge.from - ragProcesses.length];
        
        const toNode = edge.to < ragProcesses.length ? 
            ragProcesses[edge.to] : 
            ragResources[edge.to - ragProcesses.length];
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", fromNode.x + 25);
        line.setAttribute("y1", fromNode.y + 25);
        line.setAttribute("x2", toNode.x + 25);
        line.setAttribute("y2", toNode.y + 25);
        line.setAttribute("class", `rag-edge rag-${edge.type}-edge`);
        line.setAttribute("marker-end", "url(#arrowhead)");
        
        // Make claim edges dashed
        if (edge.type === 'claim') {
            line.setAttribute("stroke-dasharray", "5,5");
        }
        
        svg.appendChild(line);
    });
    
    // Draw process nodes (circles)
    ragProcesses.forEach(process => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "rag-node rag-process");
        g.setAttribute("transform", `translate(${process.x}, ${process.y})`);
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "25");
        circle.setAttribute("cx", "25");
        circle.setAttribute("cy", "25");
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "25");
        text.setAttribute("y", "25");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("text-anchor", "middle");
        text.textContent = process.name;
        
        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
        
        // Make nodes draggable
        g.addEventListener("mousedown", startDrag);
        g.dataset.nodeType = "process";
        g.dataset.nodeId = process.id;
    });
    
    // Draw resource nodes (rectangles)
    ragResources.forEach(resource => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "rag-node rag-resource");
        g.setAttribute("transform", `translate(${resource.x}, ${resource.y})`);
        
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "50");
        rect.setAttribute("height", "50");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "25");
        text.setAttribute("y", "25");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("text-anchor", "middle");
        text.textContent = resource.name;
        
        g.appendChild(rect);
        g.appendChild(text);
        svg.appendChild(g);
        
        // Make nodes draggable
        g.addEventListener("mousedown", startDrag);
        g.dataset.nodeType = "resource";
        g.dataset.nodeId = resource.id;
    });
    
    canvas.appendChild(svg);
}

// Dragging functionality for RAG nodes
let activeNode = null;
let offset = { x: 0, y: 0 };

function startDrag(event) {
    activeNode = this;
    
    const transform = activeNode.getAttribute("transform");
    const match = transform.match(/translate\((\d+), (\d+)\)/);
    const nodeX = parseInt(match[1]);
    const nodeY = parseInt(match[2]);
    
    offset.x = event.clientX - nodeX;
    offset.y = event.clientY - nodeY;
    
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", endDrag);
    
    event.preventDefault();
}

function drag(event) {
    if (!activeNode) return;
    
    const nodeType = activeNode.dataset.nodeType;
    const nodeId = parseInt(activeNode.dataset.nodeId);
    
    let x = event.clientX - offset.x;
    let y = event.clientY - offset.y;
    
    // Keep nodes within bounds of canvas
    x = Math.max(0, Math.min(x, 750));
    y = Math.max(0, Math.min(y, 550));
    
    activeNode.setAttribute("transform", `translate(${x}, ${y})`);
    
    // Update node position in data model
    if (nodeType === "process") {
        ragProcesses[nodeId].x = x;
        ragProcesses[nodeId].y = y;
    } else {
        ragResources[nodeId].x = x;
        ragResources[nodeId].y = y;
    }
    
    // Update edges connected to this node
    const svg = activeNode.ownerSVGElement;
    if (svg) {
        [...ragEdges.claim, ...ragEdges.request, ...ragEdges.allocation].forEach(edge => {
            let needUpdate = false;
            let fromX, fromY, toX, toY;
            
            if (nodeType === "process" && edge.from === nodeId) {
                fromX = x + 25;
                fromY = y + 25;
                needUpdate = true;
            } else if (nodeType === "process" && edge.to === nodeId) {
                toX = x + 25;
                toY = y + 25;
                needUpdate = true;
            } else if (nodeType === "resource" && edge.from === nodeId + ragProcesses.length) {
                fromX = x + 25;
                fromY = y + 25;
                needUpdate = true;
            } else if (nodeType === "resource" && edge.to === nodeId + ragProcesses.length) {
                toX = x + 25;
                toY = y + 25;
                needUpdate = true;
            }
            
            if (needUpdate) {
                // Find and update the corresponding line element
                const lines = svg.querySelectorAll(".rag-edge");
                for (let line of lines) {
                    const lineX1 = parseInt(line.getAttribute("x1"));
                    const lineY1 = parseInt(line.getAttribute("y1"));
                    const lineX2 = parseInt(line.getAttribute("x2"));
                    const lineY2 = parseInt(line.getAttribute("y2"));
                    
                    // Check if this is the line we want to update
                    if (nodeType === "process" && edge.from === nodeId) {
                        const toNode = edge.to < ragProcesses.length ? 
                            ragProcesses[edge.to] : 
                            ragResources[edge.to - ragProcesses.length];
                        toX = toNode.x + 25;
                        toY = toNode.y + 25;
                        
                        if (Math.abs(lineX2 - toX) < 5 && Math.abs(lineY2 - toY) < 5) {
                            line.setAttribute("x1", fromX);
                            line.setAttribute("y1", fromY);
                            break;
                        }
                    } else if (nodeType === "process" && edge.to === nodeId) {
                        const fromNode = edge.from < ragProcesses.length ? 
                            ragProcesses[edge.from] : 
                            ragResources[edge.from - ragProcesses.length];
                        fromX = fromNode.x + 25;
                        fromY = fromNode.y + 25;
                        
                        if (Math.abs(lineX1 - fromX) < 5 && Math.abs(lineY1 - fromY) < 5) {
                            line.setAttribute("x2", toX);
                            line.setAttribute("y2", toY);
                            break;
                        }
                    } else if (nodeType === "resource" && edge.from === nodeId + ragProcesses.length) {
                        const toNode = edge.to < ragProcesses.length ? 
                            ragProcesses[edge.to] : 
                            ragResources[edge.to - ragProcesses.length];
                        toX = toNode.x + 25;
                        toY = toNode.y + 25;
                        
                        if (Math.abs(lineX2 - toX) < 5 && Math.abs(lineY2 - toY) < 5) {
                            line.setAttribute("x1", fromX);
                            line.setAttribute("y1", fromY);
                            break;
                        }
                    } else if (nodeType === "resource" && edge.to === nodeId + ragProcesses.length) {
                        const fromNode = edge.from < ragProcesses.length ? 
                            ragProcesses[edge.from] : 
                            ragResources[edge.from - ragProcesses.length];
                        fromX = fromNode.x + 25;
                        fromY = fromNode.y + 25;
                        
                        if (Math.abs(lineX1 - fromX) < 5 && Math.abs(lineY1 - fromY) < 5) {
                            line.setAttribute("x2", toX);
                            line.setAttribute("y2", toY);
                            break;
                        }
                    }
                }
            }
        });
    }
    
    event.preventDefault();
}

function endDrag(event) {
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", endDrag);
    activeNode = null;
    event.preventDefault();
}

function checkRagSafe() {
    console.log("Checking if RAG is safe");
    
    // Create an adjacency matrix for the graph
    const totalNodes = ragProcesses.length + ragResources.length;
    const adjacencyMatrix = Array(totalNodes).fill().map(() => Array(totalNodes).fill(0));
    
    // Convert edges to adjacency matrix
    [...ragEdges.request, ...ragEdges.allocation].forEach(edge => {
        adjacencyMatrix[edge.from][edge.to] = 1;
    });
    
    // Check for cycles (which indicate deadlock)
    const visited = Array(totalNodes).fill(0);
    const recursionStack = Array(totalNodes).fill(0);
    let hasCycle = false;
    
    function dfs(node) {
        visited[node] = 1;
        recursionStack[node] = 1;
        
        for (let i = 0; i < totalNodes; i++) {
            if (adjacencyMatrix[node][i]) {
                if (!visited[i]) {
                    if (dfs(i)) return true;
                } else if (recursionStack[i]) {
                    return true;
                }
            }
        }
        
        recursionStack[node] = 0;
        return false;
    }
    
    for (let i = 0; i < totalNodes; i++) {
        if (!visited[i]) {
            if (dfs(i)) {
                hasCycle = true;
                break;
            }
        }
    }
    
    if (hasCycle) {
        showMessage("System is UNSAFE. Potential deadlock detected in the resource allocation graph.", "error", "rag-result-area");
    } else {
        showMessage("System is SAFE. No deadlock potential detected in the resource allocation graph.", "success", "rag-result-area");
    }
    
    return !hasCycle;
}

function detectRagDeadlock() {
    console.log("Detecting deadlock in RAG");
    
    // Create an adjacency matrix for the graph
    const totalNodes = ragProcesses.length + ragResources.length;
    const adjacencyMatrix = Array(totalNodes).fill().map(() => Array(totalNodes).fill(0));
    
    // Convert edges to adjacency matrix
    [...ragEdges.request, ...ragEdges.allocation].forEach(edge => {
        adjacencyMatrix[edge.from][edge.to] = 1;
    });
    
    // Check for cycles with tracking the cycle path
    const visited = Array(totalNodes).fill(0);
    const recursionStack = Array(totalNodes).fill(0);
    const cycleNodes = [];
    
    function findCycle(node, path = []) {
        visited[node] = 1;
        recursionStack[node] = 1;
        path.push(node);
        
        for (let i = 0; i < totalNodes; i++) {
            if (adjacencyMatrix[node][i]) {
                if (!visited[i]) {
                    const result = findCycle(i, [...path]);
                    if (result.length > 0) return result;
                } else if (recursionStack[i]) {
                    // Found a cycle, return the nodes in the cycle
                    const cycleStartIndex = path.indexOf(i);
                    return path.slice(cycleStartIndex);
                }
            }
        }
        
        recursionStack[node] = 0;
        return [];
    }
    
    for (let i = 0; i < totalNodes; i++) {
        if (!visited[i]) {
            const cycle = findCycle(i);
            if (cycle.length > 0) {
                cycleNodes.push(...cycle);
                break;
            }
        }
    }
    
    if (cycleNodes.length > 0) {
        const deadlockedProcesses = cycleNodes
            .filter(nodeId => nodeId < ragProcesses.length)
            .map(nodeId => ragProcesses[nodeId].name);
        
        const involvedResources = cycleNodes
            .filter(nodeId => nodeId >= ragProcesses.length)
            .map(nodeId => ragResources[nodeId - ragProcesses.length].name);
        
        showMessage(
            `DEADLOCK DETECTED!<br>Deadlocked processes: ${deadlockedProcesses.join(', ')}<br>` +
            `Involved resources: ${involvedResources.join(', ')}`,
            "error",
            "rag-result-area"
        );
    } else {
        showMessage("No deadlock detected in the resource allocation graph.", "success", "rag-result-area");
    }
}

function resetRag() {
    console.log("Resetting RAG");
    
    ragProcesses = [];
    ragResources = [];
    ragEdges = {
        claim: [],
        request: [],
        allocation: []
    };
    
    const canvas = document.getElementById('rag-canvas');
    const edgeList = document.getElementById('rag-edge-list');
    const edgeForm = document.getElementById('rag-edge-form');
    const resultArea = document.getElementById('rag-result-area');
    const initialSetupForm = document.getElementById('initial-setup-form');
    const ragContainer = document.getElementById('rag-container');
    
    if (canvas) canvas.innerHTML = '';
    if (edgeList) edgeList.innerHTML = '';
    if (edgeForm) edgeForm.innerHTML = '';
    if (resultArea) resultArea.innerHTML = '';
    
    if (initialSetupForm && ragContainer) {
        initialSetupForm.style.display = 'block';
        ragContainer.style.display = 'none';
    }
}

function showMessage(message, type, targetId = 'result-area') {
    const resultArea = document.getElementById(targetId);
    if (!resultArea) return;
    
    resultArea.innerHTML = `<div class="message ${type}">${message}</div>`;
    resultArea.scrollIntoView({ behavior: 'smooth' });
}

// Make sure the checkSafeBtn is properly attached with event listener
document.addEventListener('DOMContentLoaded', function() {
    const checkSafeBtn = document.getElementById('check-safe');
    if (checkSafeBtn) {
        console.log("Check Safe State button found, attaching backup event listener");
        checkSafeBtn.addEventListener('click', function() {
            console.log("Check Safe State button clicked");
            if (typeof runBankersAlgorithm === 'function') {
                runBankersAlgorithm();
            } else {
                console.error("runBankersAlgorithm function not found");
            }
        });
    }
});
