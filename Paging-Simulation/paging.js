// Variables to store page table information
let pageTables = []; // Will store page tables for each process
let freeFrames = []; // Will track which frames are available
let allocatedFrames = {}; // Will track which frames are allocated to which process and page

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners
  document.getElementById('submit-button').addEventListener('click', handleSubmit);
  document.getElementById('numProcesses').addEventListener('change', updateProcessInputs);
  
  // Remove the animation speed event listener since we're removing this feature
});

// Update process inputs based on number of processes
function updateProcessInputs() {
  const numProcesses = parseInt(document.getElementById('numProcesses').value) || 0;
  const processInputs = document.getElementById('processInputs');
  processInputs.innerHTML = '';

  for (let i = 0; i < numProcesses; i++) {
    const processDiv = document.createElement('div');
    processDiv.classList.add('mb-3');
    processDiv.innerHTML = `
      <label for="process${i + 1}Size" class="form-label">Size of Process ${i + 1} (in pages):</label>
      <input type="number" class="form-control" id="process${i + 1}Size" name="process${i + 1}Size" placeholder="e.g., 4" required />
    `;
    processInputs.appendChild(processDiv);
  }
}

// Handle submit button click
function handleSubmit() {
  // Get form inputs
  const memorySize = parseInt(document.getElementById('memorySize').value);
  const pageSize = parseInt(document.getElementById('pageSize').value);
  const numProcesses = parseInt(document.getElementById('numProcesses').value);

  // Validation
  if (!memorySize || !pageSize || !numProcesses) {
    alert('Please fill all required fields.');
    return;
  }

  // Clear previous visualizations
  document.getElementById('memory-visualization').innerHTML = '';
  document.getElementById('execution-steps').innerHTML = '';
  
  // Calculate total number of frames in physical memory
  const numFrames = Math.floor(memorySize / pageSize);
  
  // Initialize free frames array (all frames are initially free)
  freeFrames = Array.from({ length: numFrames }, (_, i) => i);
  allocatedFrames = {};
  
  // Create memory block visualization
  updateMemoryVisualization();
  
  // Add execution step
  addExecutionStep(`Memory initialized with ${numFrames} frames of ${pageSize} bytes each.`);
  
  // Initialize page tables for each process
  pageTables = [];
  let totalRequestedPages = 0;
  
  // Collect process sizes
  const processSizes = [];
  for (let i = 0; i < numProcesses; i++) {
    const inputField = document.getElementById(`process${i + 1}Size`);
    if (inputField) {
      const pageCount = parseInt(inputField.value);
      
      // Validate input
      if (isNaN(pageCount) || pageCount <= 0) {
        alert(`Invalid page count for Process ${i + 1}. Please enter a positive number.`);
        return;
      }
      
      processSizes.push(pageCount);
      totalRequestedPages += pageCount;
    }
  }
  
  // Check if we have enough memory for all processes
  if (totalRequestedPages > numFrames) {
    alert(`Not enough memory! You need ${totalRequestedPages} frames but only have ${numFrames} frames available.`);
    return;
  }
  
  // Allocate memory for each process
  for (let i = 0; i < numProcesses; i++) {
    const processSize = processSizes[i];
    const pageTable = allocateMemoryForProcess(i, processSize);
    pageTables.push(pageTable);
    
    // Log allocation
    const allocatedFramesList = Object.values(pageTable).join(', ');
    addExecutionStep(`Process ${i + 1} allocated ${processSize} pages to frames: ${allocatedFramesList}`);
  }
  
  // Show address form after setup
  document.getElementById('addressForm').style.display = 'block';
  
  // Show result area
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').innerHTML = 'Enter an address to translate';
}

// Allocate memory frames for a process
function allocateMemoryForProcess(processIndex, numPages) {
  const pageTable = {};
  
  // Allocate frames for each page
  for (let page = 0; page < numPages; page++) {
    if (freeFrames.length === 0) {
      alert("Error: No free frames available!");
      return pageTable;
    }
    
    // Get the next free frame
    const frame = freeFrames.shift();
    
    // Update page table
    pageTable[page] = frame;
    
    // Mark frame as allocated
    allocatedFrames[frame] = {
      process: processIndex,
      page: page
    };
    
    // Update visualization
    const frameElement = document.getElementById(`frame-${frame}`);
    if (frameElement) {
      frameElement.classList.add('allocated');
      frameElement.textContent = `Frame ${frame} (P${processIndex + 1}, Pg ${page})`;
    }
  }
  
  return pageTable;
}

// Calculate physical address from logical address
function calculatePhysicalAddress() {
  const processNo = parseInt(document.getElementById('processNumber').value);
  const pageNo = parseInt(document.getElementById('pageNumber').value);
  const offset = parseInt(document.getElementById('offset').value);
  const pageSize = parseInt(document.getElementById('pageSize').value);

  // Validation
  if (!processNo || pageNo === undefined || offset === undefined || !pageSize) {
    alert('Please fill all required fields.');
    return false;
  }

  // Check if process number is valid
  if (processNo <= 0 || processNo > pageTables.length) {
    alert(`Invalid process number. Please enter a value between 1 and ${pageTables.length}.`);
    return false;
  }

  const processIndex = processNo - 1;
  const pageTable = pageTables[processIndex];

  // Check if page number is valid for this process
  if (pageNo < 0 || !(pageNo in pageTable)) {
    alert(`Invalid page number for Process ${processNo}. Valid pages are: ${Object.keys(pageTable).join(', ')}`);
    return false;
  }
  
  // Check if offset is valid
  if (offset < 0 || offset >= pageSize) {
    alert(`Invalid offset. Must be between 0 and ${pageSize - 1}.`);
    return false;
  }

  // Get frame number from page table
  const frameNumber = pageTable[pageNo];
  
  // Calculate physical address
  const physicalAddress = (frameNumber * pageSize) + offset;

  // Update result display
  const result = document.getElementById('result');
  result.innerHTML = `
    <strong>Address Translation</strong><br>
    Process ${processNo}, Page ${pageNo}, Offset ${offset}<br>
    Maps to:<br>
    Frame ${frameNumber}, Physical Address ${physicalAddress}<br>
    <small>Formula: (Frame x Page Size) + Offset = (${frameNumber} x ${pageSize}) + ${offset} = ${physicalAddress}</small>
  `;
  result.style.display = 'block';
  
  // Add execution step
  addExecutionStep(`Address translation: Process ${processNo}, Page ${pageNo}, Offset ${offset} - Frame ${frameNumber}, Physical Address ${physicalAddress}`);
  
  // Highlight the accessed frame in visualization
  highlightFrame(frameNumber);

  // Prevent form submission
  return false;
}

// Update memory visualization
function updateMemoryVisualization() {
  const container = document.getElementById('memory-visualization');
  container.innerHTML = '';
  
  // Create memory blocks
  const memorySize = parseInt(document.getElementById('memorySize').value);
  const pageSize = parseInt(document.getElementById('pageSize').value);
  const numFrames = Math.floor(memorySize / pageSize);
  
  for (let i = 0; i < numFrames; i++) {
    const block = document.createElement('div');
    block.classList.add('memory-block');
    block.id = `frame-${i}`;
    block.textContent = `Frame ${i}`;
    container.appendChild(block);
  }
  
  // We're removing the scale markers as requested
  // No more "0, 256, 512..." text at the bottom
}

// Highlight a frame in the visualization
function highlightFrame(frameNumber) {
  // Reset highlighting on all frames (keep allocation color)
  const frames = document.querySelectorAll('.memory-block');
  frames.forEach(frame => {
    frame.style.border = '1px solid #ddd';
  });
  
  // Highlight the selected frame with a thicker border
  const frame = document.getElementById(`frame-${frameNumber}`);
  if (frame) {
    frame.style.border = '3px solid #e74c3c';
  }
}

// Add execution step to the log
function addExecutionStep(message) {
  const stepsContainer = document.getElementById('execution-steps');
  const stepCount = stepsContainer.children.length + 1;
  
  const step = document.createElement('div');
  step.classList.add('step-item');
  
  const marker = document.createElement('div');
  marker.classList.add('step-marker');
  marker.textContent = stepCount;
  
  const text = document.createElement('div');
  text.textContent = message;
  
  step.appendChild(marker);
  step.appendChild(text);
  stepsContainer.appendChild(step);
  
  // Auto-scroll to the bottom of the steps container
  stepsContainer.scrollTop = stepsContainer.scrollHeight;
}
