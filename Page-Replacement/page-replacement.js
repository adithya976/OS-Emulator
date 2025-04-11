document.addEventListener('DOMContentLoaded', init);

function init() {
    const algorithmSelect = document.getElementById('algorithm');
    const framesInput = document.getElementById('frames');
    const referenceStringInput = document.getElementById('reference-string');
    const randomRefBtn = document.getElementById('random-ref');
    const runSimulationBtn = document.getElementById('run-simulation');
    const stepSimulationBtn = document.getElementById('step-simulation');
    const resetSimulationBtn = document.getElementById('reset-simulation');
    const visualizationContainer = document.getElementById('visualization-container');
    const statsContainer = document.getElementById('stats-container');
    const detailsContainer = document.getElementById('details-container');
    
    let currentStep = 0;
    let simulationData = null;
    let isStepping = false;
    
    // Initialize event listeners
    randomRefBtn.addEventListener('click', generateRandomReferenceString);
    runSimulationBtn.addEventListener('click', runSimulation);
    stepSimulationBtn.addEventListener('click', stepSimulation);
    resetSimulationBtn.addEventListener('click', resetSimulation);
    
    function generateRandomReferenceString() {
        const length = Math.floor(Math.random() * 15) + 10; // 10-24 references
        const maxPage = Math.floor(Math.random() * 8) + 3; // Pages 3-10
        let refString = [];
        
        for (let i = 0; i < length; i++) {
            refString.push(Math.floor(Math.random() * maxPage));
        }
        
        referenceStringInput.value = refString.join(',');
    }
    
    function runSimulation() {
        resetSimulation();
        const referenceString = referenceStringInput.value.split(',').map(Number);
        const frames = parseInt(framesInput.value);
        const algorithm = algorithmSelect.value;
        
        if (referenceString.some(isNaN)) {
            alert('Please enter a valid reference string (comma-separated numbers)');
            return;
        }
        
        if (isNaN(frames)) {
            alert('Please enter a valid number of frames');
            return;
        }
        
        // Run the selected algorithm
        switch (algorithm) {
            case 'fifo':
                simulationData = fifoAlgorithm(referenceString, frames);
                break;
            case 'optimal':
                simulationData = optimalAlgorithm(referenceString, frames);
                break;
            case 'lru':
                simulationData = lruAlgorithm(referenceString, frames);
                break;
            case 'lfu':
                simulationData = lfuAlgorithm(referenceString, frames);
                break;
            case 'mfu':
                simulationData = mfuAlgorithm(referenceString, frames);
                break;
            case 'clock':
                simulationData = clockAlgorithm(referenceString, frames);
                break;
        }
        
        // Display the first step
        displayStep(0);
    }
    
    function stepSimulation() {
        if (!simulationData) {
            runSimulation();
            isStepping = true;
            return;
        }
        
        if (currentStep < simulationData.steps.length - 1) {
            currentStep++;
            displayStep(currentStep);
        } else {
            isStepping = false;
        }
    }
    
    function resetSimulation() {
        currentStep = 0;
        simulationData = null;
        isStepping = false;
        visualizationContainer.innerHTML = '';
        statsContainer.innerHTML = '';
        detailsContainer.innerHTML = '';
    }
    
    function displayStep(stepIndex) {
        if (!simulationData || stepIndex >= simulationData.steps.length) return;
        
        const step = simulationData.steps[stepIndex];
        const algorithm = algorithmSelect.value;
        
        // Display the visualization table
        let tableHtml = `<table class="algorithm-table">
            <thead>
                <tr>
                    <th>Reference</th>`;
        
        // Add columns for each frame
        for (let i = 0; i < simulationData.frames; i++) {
            tableHtml += `<th>Frame ${i+1}</th>`;
        }
        
        if (algorithm === 'clock') {
            tableHtml += `<th>Clock Pointer</th>`;
        }
        
        tableHtml += `<th>Page Fault?</th></tr></thead><tbody>`;
        
        // Add rows for each step up to the current one
        for (let i = 0; i <= stepIndex; i++) {
            const currentStep = simulationData.steps[i];
            tableHtml += `<tr${i === stepIndex ? ' class="current"' : ''}>
                <td>${currentStep.reference}</td>`;
            
            // Add frame contents
            for (let j = 0; j < simulationData.frames; j++) {
                const page = currentStep.frames[j] !== undefined ? currentStep.frames[j] : '';
                const refBit = currentStep.referenceBits ? currentStep.referenceBits[j] : null;
                
                tableHtml += `<td>${page}`;
                if (refBit !== null) {
                    tableHtml += `<span class="reference-bit"> (${refBit})</span>`;
                }
                tableHtml += `</td>`;
            }
            
            // Add clock pointer if applicable
            if (algorithm === 'clock') {
                tableHtml += `<td class="clock-pointer">${currentStep.clockPointer + 1}</td>`;
            }
            
            // Add page fault info
            tableHtml += `<td class="${currentStep.pageFault ? 'page-fault' : 'page-hit'}">`;
            tableHtml += currentStep.pageFault ? 'Fault' : 'Hit';
            tableHtml += `</td></tr>`;
        }
        
        tableHtml += `</tbody></table>`;
        visualizationContainer.innerHTML = tableHtml;
        
        // Display statistics
        let faults = 0;
        let hits = 0;
        
        for (let i = 0; i <= stepIndex; i++) {
            if (simulationData.steps[i].pageFault) {
                faults++;
            } else {
                hits++;
            }
        }
        
        const faultRate = (faults / (stepIndex + 1)) * 100;
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Page Faults</div>
                    <div class="stat-value">${faults}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Page Hits</div>
                    <div class="stat-value">${hits}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Fault Rate</div>
                    <div class="stat-value">${faultRate.toFixed(1)}%</div>
                </div>
            </div>
        `;
        
        // Display detailed information
        if (stepIndex === 0) {
            detailsContainer.innerHTML = '';
        }
        
        const detailItem = document.createElement('div');
        detailItem.className = 'detail-item';
        
        let actionText = '';
        if (step.pageFault) {
            if (step.evictPage !== null) {
                actionText = `Page ${step.evictPage} was evicted. `;
            }
            actionText += `Page ${step.reference} was loaded into frame ${step.loadedFrame + 1}.`;
        } else {
            actionText = `Page ${step.reference} was already in memory.`;
        }
        
        detailItem.innerHTML = `
            <div class="detail-step">Step ${stepIndex + 1}: Reference ${step.reference}</div>
            <div class="detail-action">${actionText}</div>
            <div class="${step.pageFault ? 'detail-fault' : 'detail-hit'}">
                ${step.pageFault ? 'PAGE FAULT' : 'PAGE HIT'}
            </div>
        `;
        
        detailsContainer.appendChild(detailItem);
        detailsContainer.scrollTop = detailsContainer.scrollHeight;
    }
    
    // FIFO Algorithm Implementation
    function fifoAlgorithm(referenceString, frames) {
        const steps = [];
        const frameContents = Array(frames).fill(null);
        const queue = []; // To track the order of page insertion
        
        for (let i = 0; i < referenceString.length; i++) {
            const page = referenceString[i];
            const step = {
                reference: page,
                frames: [...frameContents],
                pageFault: false,
                evictPage: null,
                loadedFrame: null
            };
            
            // Check if page is already in a frame
            const frameIndex = frameContents.indexOf(page);
            
            if (frameIndex === -1) {
                // Page fault occurred
                step.pageFault = true;
                
                if (queue.length < frames) {
                    // There are empty frames
                    const emptyFrame = frameContents.indexOf(null);
                    frameContents[emptyFrame] = page;
                    queue.push(emptyFrame);
                    step.loadedFrame = emptyFrame;
                } else {
                    // Need to replace the oldest page
                    const oldestFrame = queue.shift();
                    step.evictPage = frameContents[oldestFrame];
                    frameContents[oldestFrame] = page;
                    queue.push(oldestFrame);
                    step.loadedFrame = oldestFrame;
                }
            }
            
            steps.push(step);
        }
        
        return {
            algorithm: 'FIFO',
            frames: frames,
            steps: steps,
            totalFaults: steps.filter(step => step.pageFault).length
        };
    }
    
    // Optimal Algorithm Implementation
    function optimalAlgorithm(referenceString, frames) {
        const steps = [];
        const frameContents = Array(frames).fill(null);
        
        for (let i = 0; i < referenceString.length; i++) {
            const page = referenceString[i];
            const step = {
                reference: page,
                frames: [...frameContents],
                pageFault: false,
                evictPage: null,
                loadedFrame: null
            };
            
            // Check if page is already in a frame
            const frameIndex = frameContents.indexOf(page);
            
            if (frameIndex === -1) {
                // Page fault occurred
                step.pageFault = true;
                
                if (frameContents.includes(null)) {
                    // There are empty frames
                    const emptyFrame = frameContents.indexOf(null);
                    frameContents[emptyFrame] = page;
                    step.loadedFrame = emptyFrame;
                } else {
                    // Find the page that won't be used for the longest time
                    let farthest = -1;
                    let replaceIndex = 0;
                    
                    for (let j = 0; j < frameContents.length; j++) {
                        const currentPage = frameContents[j];
                        let nextUse = referenceString.slice(i + 1).indexOf(currentPage);
                        
                        if (nextUse === -1) {
                            replaceIndex = j;
                            break;
                        }
                        
                        if (nextUse > farthest) {
                            farthest = nextUse;
                            replaceIndex = j;
                        }
                    }
                    
                    step.evictPage = frameContents[replaceIndex];
                    frameContents[replaceIndex] = page;
                    step.loadedFrame = replaceIndex;
                }
            }
            
            steps.push(step);
        }
        
        return {
            algorithm: 'Optimal',
            frames: frames,
            steps: steps,
            totalFaults: steps.filter(step => step.pageFault).length
        };
    }
    
    // LRU Algorithm Implementation
    function lruAlgorithm(referenceString, frames) {
        const steps = [];
        const frameContents = Array(frames).fill(null);
        const lastUsed = {}; // To track when each page was last used
        
        for (let i = 0; i < referenceString.length; i++) {
            const page = referenceString[i];
            const step = {
                reference: page,
                frames: [...frameContents],
                pageFault: false,
                evictPage: null,
                loadedFrame: null
            };
            
            // Check if page is already in a frame
            const frameIndex = frameContents.indexOf(page);
            
            if (frameIndex === -1) {
                // Page fault occurred
                step.pageFault = true;
                
                if (frameContents.includes(null)) {
                    // There are empty frames
                    const emptyFrame = frameContents.indexOf(null);
                    frameContents[emptyFrame] = page;
                    step.loadedFrame = emptyFrame;
                } else {
                    // Find the least recently used page
                    let lruPage = null;
                    let lruTime = Infinity;
                    let replaceIndex = 0;
                    
                    for (let j = 0; j < frameContents.length; j++) {
                        const currentPage = frameContents[j];
                        if (lastUsed[currentPage] < lruTime) {
                            lruTime = lastUsed[currentPage];
                            lruPage = currentPage;
                            replaceIndex = j;
                        }
                    }
                    
                    step.evictPage = lruPage;
                    frameContents[replaceIndex] = page;
                    step.loadedFrame = replaceIndex;
                }
            }
            
            // Update last used time for this page
            lastUsed[page] = i;
            steps.push(step);
        }
        
        return {
            algorithm: 'LRU',
            frames: frames,
            steps: steps,
            totalFaults: steps.filter(step => step.pageFault).length
        };
    }
    
    // LFU Algorithm Implementation
    function lfuAlgorithm(referenceString, frames) {
        const steps = [];
        const frameContents = Array(frames).fill(null);
        const frequency = {}; // To track how often each page is used
        const lastUsed = {}; // To break ties (LRU)
        
        for (let i = 0; i < referenceString.length; i++) {
            const page = referenceString[i];
            const step = {
                reference: page,
                frames: [...frameContents],
                pageFault: false,
                evictPage: null,
                loadedFrame: null
            };
            
            // Initialize frequency and lastUsed if needed
            if (frequency[page] === undefined) {
                frequency[page] = 0;
            }
            if (lastUsed[page] === undefined) {
                lastUsed[page] = i;
            }
            
            // Check if page is already in a frame
            const frameIndex = frameContents.indexOf(page);
            
            if (frameIndex === -1) {
                // Page fault occurred
                step.pageFault = true;
                
                if (frameContents.includes(null)) {
                    // There are empty frames
                    const emptyFrame = frameContents.indexOf(null);
                    frameContents[emptyFrame] = page;
                    step.loadedFrame = emptyFrame;
                } else {
                    // Find the least frequently used page (with LRU as tie-breaker)
                    let lfuPage = null;
                    let lfuCount = Infinity;
                    let lfuTime = Infinity;
                    let replaceIndex = 0;
                    
                    for (let j = 0; j < frameContents.length; j++) {
                        const currentPage = frameContents[j];
                        if (frequency[currentPage] < lfuCount || 
                            (frequency[currentPage] === lfuCount && lastUsed[currentPage] < lfuTime)) {
                            lfuCount = frequency[currentPage];
                            lfuTime = lastUsed[currentPage];
                            lfuPage = currentPage;
                            replaceIndex = j;
                        }
                    }
                    
                    step.evictPage = lfuPage;
                    frameContents[replaceIndex] = page;
                    step.loadedFrame = replaceIndex;
                }
            }
            
            // Update frequency and last used time for this page
            frequency[page]++;
            lastUsed[page] = i;
            steps.push(step);
        }
        
        return {
            algorithm: 'LFU',
            frames: frames,
            steps: steps,
            totalFaults: steps.filter(step => step.pageFault).length
        };
    }
    
    // MFU Algorithm Implementation
    function mfuAlgorithm(referenceString, frames) {
        const steps = [];
        const frameContents = Array(frames).fill(null);
        const frequency = {}; // To track how often each page is used
        const lastUsed = {}; // To break ties (LRU)
        
        for (let i = 0; i < referenceString.length; i++) {
            const page = referenceString[i];
            const step = {
                reference: page,
                frames: [...frameContents],
                pageFault: false,
                evictPage: null,
                loadedFrame: null
            };
            
            // Initialize frequency and lastUsed if needed
            if (frequency[page] === undefined) {
                frequency[page] = 0;
            }
            if (lastUsed[page] === undefined) {
                lastUsed[page] = i;
            }
            
            // Check if page is already in a frame
            const frameIndex = frameContents.indexOf(page);
            
            if (frameIndex === -1) {
                // Page fault occurred
                step.pageFault = true;
                
                if (frameContents.includes(null)) {
                    // There are empty frames
                    const emptyFrame = frameContents.indexOf(null);
                    frameContents[emptyFrame] = page;
                    step.loadedFrame = emptyFrame;
                } else {
                    // Find the most frequently used page (with LRU as tie-breaker)
                    let mfuPage = null;
                    let mfuCount = -1;
                    let mfuTime = Infinity;
                    let replaceIndex = 0;
                    
                    for (let j = 0; j < frameContents.length; j++) {
                        const currentPage = frameContents[j];
                        if (frequency[currentPage] > mfuCount || 
                            (frequency[currentPage] === mfuCount && lastUsed[currentPage] < mfuTime)) {
                            mfuCount = frequency[currentPage];
                            mfuTime = lastUsed[currentPage];
                            mfuPage = currentPage;
                            replaceIndex = j;
                        }
                    }
                    
                    step.evictPage = mfuPage;
                    frameContents[replaceIndex] = page;
                    step.loadedFrame = replaceIndex;
                }
            }
            
            // Update frequency and last used time for this page
            frequency[page]++;
            lastUsed[page] = i;
            steps.push(step);
        }
        
        return {
            algorithm: 'MFU',
            frames: frames,
            steps: steps,
            totalFaults: steps.filter(step => step.pageFault).length
        };
    }
    
    // Clock (Second Chance) Algorithm Implementation
    function clockAlgorithm(referenceString, frames) {
        const steps = [];
        const frameContents = Array(frames).fill(null);
        const referenceBits = Array(frames).fill(0); // Reference bits for each frame
        let clockPointer = 0; // Points to the next frame to examine
        
        for (let i = 0; i < referenceString.length; i++) {
            const page = referenceString[i];
            const step = {
                reference: page,
                frames: [...frameContents],
                referenceBits: [...referenceBits],
                clockPointer: clockPointer,
                pageFault: false,
                evictPage: null,
                loadedFrame: null
            };
            
            // Check if page is already in a frame
            const frameIndex = frameContents.indexOf(page);
            
            if (frameIndex === -1) {
                // Page fault occurred
                step.pageFault = true;
                
                if (frameContents.includes(null)) {
                    // There are empty frames
                    const emptyFrame = frameContents.indexOf(null);
                    frameContents[emptyFrame] = page;
                    referenceBits[emptyFrame] = 1;
                    step.loadedFrame = emptyFrame;
                    clockPointer = (emptyFrame + 1) % frames;
                } else {
                    // Find a page to replace using the clock algorithm
                    let replaced = false;
                    let attempts = 0;
                    
                    while (!replaced && attempts < frames * 2) {
                        if (referenceBits[clockPointer] === 0) {
                            // This page hasn't been referenced, replace it
                            step.evictPage = frameContents[clockPointer];
                            frameContents[clockPointer] = page;
                            referenceBits[clockPointer] = 1;
                            step.loadedFrame = clockPointer;
                            clockPointer = (clockPointer + 1) % frames;
                            replaced = true;
                        } else {
                            // Give this page a second chance
                            referenceBits[clockPointer] = 0;
                            clockPointer = (clockPointer + 1) % frames;
                        }
                        attempts++;
                    }
                    
                    if (!replaced) {
                        // Shouldn't happen, but just in case
                        step.evictPage = frameContents[clockPointer];
                        frameContents[clockPointer] = page;
                        referenceBits[clockPointer] = 1;
                        step.loadedFrame = clockPointer;
                        clockPointer = (clockPointer + 1) % frames;
                    }
                }
            } else {
                // Page is already in memory, set its reference bit
                referenceBits[frameIndex] = 1;
            }
            
            steps.push(step);
        }
        
        return {
            algorithm: 'Clock',
            frames: frames,
            steps: steps,
            totalFaults: steps.filter(step => step.pageFault).length
        };
    }
}