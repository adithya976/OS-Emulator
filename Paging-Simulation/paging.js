// Variables to store page table information
let pageTables = [];
let memoryBlocks = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners
  document.getElementById('submit-button').addEventListener('click', handleSubmit);
  document.getElementById('numProcesses').addEventListener('change', updateProcessInputs);
  
  // Initialize the animation speed
  document.getElementById('animationSpeed').addEventListener('input', function() {
    // Animation speed functionality can be implemented here
  });
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
      <label for="process${i + 1}Pages" class="form-label">Pages for Process ${i + 1} (space-separated):</label>
      <input type="text" class="form-control" id="process${i + 1}Pages" name="process${i + 1}Pages" placeholder="e.g., 0 1 2 3" required />
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
  
  // Initialize memory blocks visualization
  const numFrames = Math.floor(memorySize / pageSize);
  memoryBlocks = new Array(numFrames).fill(null);
  
  // Create memory block visualization
  updateMemoryVisualization();
  
  // Add execution step
  addExecutionStep(`Memory initialized with ${numFrames} frames of ${pageSize} bytes each.`);
  
  // Store process page information
  pageTables = [];
  for (let i = 0; i < numProcesses; i++) {
    const inputField = document.getElementById(`process${i + 1}Pages`);
    if (inputField) {
      const pagesString = inputField.value.trim();
      const pages = pagesString.split(/\s+/).map(Number);
      
      // Validate pages
      if (pages.some(isNaN)) {
        alert(`Invalid page numbers for Process ${i + 1}. Please enter valid numbers.`);
        return;
      }
      
      pageTables.push(pages);
      addExecutionStep(`Process ${i + 1} pages registered: ${pages.join(', ')}`);
    }
  }
  
  // Show address form after setup
  document.getElementById('addressForm').style.display = 'block';
}

// Calculate physical address from logical address
function calculatePhysicalAddress() {
  const processNo = parseInt(document.getElementById('processNumber').value);
  const pageNo = parseInt(document.getElementById('pageNumber').value);
  const offset = parseInt(document.getElementById('offset').value);
  const pageSize = parseInt(document.getElementById('pageSize').value);

  // Validation
  if (!processNo || !pageNo || offset === undefined || !pageSize) {
    alert('Please fill all required fields.');
    return false;
  }

  // Check if process number is valid
  if (processNo <= 0 || processNo > pageTables.length) {
    alert(`Invalid process number. Please enter a value between 1 and ${pageTables.length}.`);
    return false;
  }

  const processIndex = processNo - 1;
  const processPages = pageTables[processIndex];

  // Check if page number is valid for this process
  if (pageNo >= processPages.length) {
    alert(`Invalid page number for Process ${processNo}. Maximum page number is ${processPages.length - 1}.`);
    return false;
  }

  // Check for common pages between processes (invalid allocation)
  for (let i = 0; i < pageTables.length; i++) {
    if (i !== processIndex) {
      const otherProcessPages = pageTables[i];
      const commonPages = processPages.filter(page => otherProcessPages.includes(page));
      if (commonPages.length > 0) {
        alert(`Invalid page numbers! Page ${commonPages[0]} is allocated to multiple processes.`);
        return false;
      }
    }
  }

  // Get frame number from page table
  const frameNumber = processPages[pageNo];
  
  // Calculate physical address
  const physicalAddress = (frameNumber * pageSize) + offset;

  // Update result display
  const result = document.getElementById('result');
  result.innerHTML = `
    <strong>Process ${processNo}, Page ${pageNo}, Offset ${offset}</strong><br>
    Frame number: ${frameNumber}<br>
    Physical address: ${physicalAddress}
  `;
  result.style.display = 'block';
  
  // Add execution step
  addExecutionStep(`Address translation: Process ${processNo}, Page ${pageNo}, Offset ${offset} → Frame ${frameNumber}, Physical Address ${physicalAddress}`);
  
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
  
  // Add scale markers
  const scale = document.createElement('div');
  scale.classList.add('scale');
  for (let i = 0; i <= 4; i++) {
    const marker = document.createElement('div');
    marker.classList.add('scale-marker');
    marker.textContent = Math.floor(i * (memorySize / 4));
    scale.appendChild(marker);
  }
  container.parentNode.appendChild(scale);
}

// Highlight a frame in the visualization
function highlightFrame(frameNumber) {
  // Reset all frames
  const frames = document.querySelectorAll('.memory-block');
  frames.forEach(frame => {
    frame.classList.remove('allocated');
  });
  
  // Highlight the selected frame
  const frame = document.getElementById(`frame-${frameNumber}`);
  if (frame) {
    frame.classList.add('allocated');
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
}