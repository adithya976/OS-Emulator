// Variables to store segmentation information
let segmentTables = []; // Segment tables for each process
let memoryMap = []; // Track memory allocations
let totalMemorySize = 0;
let processColors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#d35400', '#34495e'];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners
  document.getElementById('submit-button').addEventListener('click', handleSubmit);
  document.getElementById('numProcesses').addEventListener('change', updateProcessInputs);
  document.getElementById('segmentTableProcessSelect').addEventListener('change', showSegmentTable);
  
  // Initially hide the address form
  document.getElementById('addressForm').style.display = 'none';
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
      <h6>Process ${i + 1} Segments</h6>
      <div class="input-group mb-2">
        <span class="input-group-text">Code</span>
        <input type="number" class="form-control" id="process${i}_segment0" placeholder="Size" required />
      </div>
      <div class="input-group mb-2">
        <span class="input-group-text">Data</span>
        <input type="number" class="form-control" id="process${i}_segment1" placeholder="Size" required />
      </div>
      <div class="input-group mb-2">
        <span class="input-group-text">Stack</span>
        <input type="number" class="form-control" id="process${i}_segment2" placeholder="Size" required />
      </div>
      <div class="input-group mb-2">
        <span class="input-group-text">Heap</span>
        <input type="number" class="form-control" id="process${i}_segment3" placeholder="Size" required />
      </div>
    `;
    processInputs.appendChild(processDiv);
  }
}

// Handle submit button click
function handleSubmit() {
  // Get form inputs
  const memorySize = parseInt(document.getElementById('memorySize').value);
  const numProcesses = parseInt(document.getElementById('numProcesses').value);

  // Validation
  if (!memorySize || !numProcesses) {
    alert('Please fill all required fields.');
    return;
  }

  // Clear previous visualizations
  document.getElementById('memory-visualization').innerHTML = '';
  document.getElementById('execution-steps').innerHTML = '';
  document.getElementById('result').style.display = 'none';
  
  // Initialize memory
  totalMemorySize = memorySize;
  memoryMap = [{
    start: 0,
    end: memorySize - 1,
    size: memorySize,
    type: 'free',
    process: null,
    segment: null
  }];
  
  // Initialize segment tables
  segmentTables = [];
  
  // Set up memory visualization
  createMemoryVisualization();
  
  // Add execution step
  addExecutionStep(`Memory initialized with size ${memorySize} bytes.`);
  
  // Collect segment sizes for each process
  const processList = [];
  
  for (let i = 0; i < numProcesses; i++) {
    const segments = [];
    const segmentNames = ['Code', 'Data', 'Stack', 'Heap'];
    
    for (let j = 0; j < 4; j++) {
      const segmentSize = parseInt(document.getElementById(`process${i}_segment${j}`).value);
      
      // Validate input
      if (isNaN(segmentSize) || segmentSize <= 0) {
        alert(`Invalid segment size for Process ${i + 1}, ${segmentNames[j]}. Please enter a positive number.`);
        return;
      }
      
      segments.push({
        name: segmentNames[j],
        size: segmentSize
      });
    }
    
    processList.push({
      id: i,
      segments: segments
    });
  }
  
  // Allocate memory for each process
  for (const process of processList) {
    const segmentTable = allocateMemoryForProcess(process);
    
    if (segmentTable) {
      segmentTables[process.id] = segmentTable;
      addExecutionStep(`Process ${process.id + 1} segments allocated successfully.`);
    } else {
      addExecutionStep(`Failed to allocate memory for Process ${process.id + 1} (not enough contiguous space).`);
    }
  }
  
  // Update segment table dropdown
  updateSegmentTableDropdown();
  
  // Show address form
  document.getElementById('addressForm').style.display = 'block';
  
  // Update visualization
  updateMemoryVisualization();
}

// Create the initial memory visualization
function createMemoryVisualization() {
  const container = document.getElementById('memory-visualization');
  container.innerHTML = '';
  
  // Add memory markers every 20% of memory
  for (let i = 0; i <= 100; i += 20) {
    const position = i * totalMemorySize / 100;
    const marker = document.createElement('div');
    marker.classList.add('memory-marker');
    marker.style.top = `${i}%`;
    
    const label = document.createElement('div');
    label.classList.add('memory-marker-label');
    label.style.top = `${i}%`;
    label.textContent = position;
    
    container.appendChild(marker);
    container.appendChild(label);
  }
}

// Update memory visualization based on current memory map
function updateMemoryVisualization() {
  const container = document.getElementById('memory-visualization');
  
  // Remove previous segments (but keep markers)
  const segments = container.querySelectorAll('.memory-segment');
  segments.forEach(segment => segment.remove());
  
  // Add segments based on memory map
  for (const block of memoryMap) {
    const segment = document.createElement('div');
    segment.classList.add('memory-segment');
    
    // Position and size
    const topPercentage = (block.start / totalMemorySize) * 100;
    const heightPercentage = (block.size / totalMemorySize) * 100;
    
    segment.style.top = `${topPercentage}%`;
    segment.style.height = `${heightPercentage}%`;
    
    if (block.type === 'free') {
      segment.classList.add('free');
      segment.textContent = `Free (${block.size} bytes)`;
    } else {
      segment.classList.add(`process-${block.process % 8}`);
      segment.textContent = `P${block.process + 1}: ${block.segmentName} (${block.size} bytes)`;
      segment.id = `segment-p${block.process}-s${block.segment}`;
    }
    
    container.appendChild(segment);
  }
  
  // Add legend
  addMemoryLegend();
}

// Add memory legend
function addMemoryLegend() {
  // Remove existing legend if any
  const oldLegend = document.querySelector('.segment-legend');
  if (oldLegend) {
    oldLegend.remove();
  }
  
  const container = document.getElementById('visualization');
  const legend = document.createElement('div');
  legend.classList.add('segment-legend');
  
  // Add free space to legend
  const freeItem = document.createElement('div');
  freeItem.classList.add('segment-legend-item');
  freeItem.innerHTML = `
    <div class="segment-legend-color" style="background-color: #ecf0f1;"></div>
    <span>Free Space</span>
  `;
  legend.appendChild(freeItem);
  
  // Add process colors to legend
  const processesInUse = new Set();
  memoryMap.forEach(block => {
    if (block.type !== 'free') {
      processesInUse.add(block.process);
    }
  });
  
  processesInUse.forEach(processId => {
    const processItem = document.createElement('div');
    processItem.classList.add('segment-legend-item');
    processItem.innerHTML = `
      <div class="segment-legend-color process-${processId % 8}"></div>
      <span>Process ${processId + 1}</span>
    `;
    legend.appendChild(processItem);
  });
  
  container.appendChild(legend);
}

// Allocate memory for a process using first fit algorithm
function allocateMemoryForProcess(process) {
  const segmentTable = {};
  
  for (let i = 0; i < process.segments.length; i++) {
    const segment = process.segments[i];
    const allocation = allocateSegment(segment.size);
    
    if (!allocation) {
      // If allocation fails for any segment, roll back previous allocations
      rollbackAllocations(process.id);
      return null;
    }
    
    // Update memory map
    const index = memoryMap.indexOf(allocation.block);
    
    // Remove the allocated block
    memoryMap.splice(index, 1);
    
    // Update segment table
    segmentTable[i] = {
      name: segment.name,
      size: segment.size,
      base: allocation.start,
      limit: segment.size
    };
    
    // Add allocated block
    memoryMap.push({
      start: allocation.start,
      end: allocation.start + segment.size - 1,
      size: segment.size,
      type: 'allocated',
      process: process.id,
      segment: i,
      segmentName: segment.name
    });
    
    // If there's remaining free space, add it back
    if (allocation.remainingSize > 0) {
      memoryMap.push({
        start: allocation.start + segment.size,
        end: allocation.start + segment.size + allocation.remainingSize - 1,
        size: allocation.remainingSize,
        type: 'free',
        process: null,
        segment: null
      });
    }
    
    // Add execution step
    addExecutionStep(`Allocated ${segment.size} bytes for Process ${process.id + 1} ${segment.name} segment at address ${allocation.start}.`);
  }
  
  // Sort memory map by start address
  memoryMap.sort((a, b) => a.start - b.start);
  
  return segmentTable;
}

// Allocate a single segment using first fit algorithm
function allocateSegment(size) {
  // Get free blocks
  const freeBlocks = memoryMap.filter(block => block.type === 'free' && block.size >= size);
  
  if (freeBlocks.length === 0) {
    return null; // No suitable block found
  }
  
  // First fit: select the first block that fits
  const selectedBlock = freeBlocks[0];
  
  return {
    block: selectedBlock,
    start: selectedBlock.start,
    remainingSize: selectedBlock.size - size
  };
}

// Roll back allocations for a process
function rollbackAllocations(processId) {
  // Find all blocks allocated to this process
  const allocatedBlocks = memoryMap.filter(block => 
    block.type === 'allocated' && block.process === processId);
  
  if (allocatedBlocks.length === 0) {
    return; // No allocations to roll back
  }
  
  // Remove allocated blocks
  for (const block of allocatedBlocks) {
    const index = memoryMap.indexOf(block);
    if (index !== -1) {
      memoryMap.splice(index, 1);
    }
  }
  
  // Add execution step
  addExecutionStep(`Rolled back allocations for Process ${processId + 1} due to insufficient memory.`);
  
  // Merge adjacent free blocks after removal
  mergeAdjacentFreeBlocks();
}

// Merge adjacent free blocks in memory map
function mergeAdjacentFreeBlocks() {
  // Sort by start address
  memoryMap.sort((a, b) => a.start - b.start);
  
  let i = 0;
  while (i < memoryMap.length - 1) {
    if (memoryMap[i].type === 'free' && memoryMap[i+1].type === 'free') {
      // Merge blocks
      memoryMap[i].end = memoryMap[i+1].end;
      memoryMap[i].size = memoryMap[i].end - memoryMap[i].start + 1;
      
      // Remove the second block
      memoryMap.splice(i+1, 1);
    } else {
      i++;
    }
  }
}

// Update segment table dropdown
function updateSegmentTableDropdown() {
  const select = document.getElementById('segmentTableProcessSelect');
  select.innerHTML = '<option value="">Select a process</option>';
  
  for (let i = 0; i < segmentTables.length; i++) {
    if (segmentTables[i]) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Process ${i + 1}`;
      select.appendChild(option);
    }
  }
}

// Show segment table for selected process
function showSegmentTable() {
  const processId = document.getElementById('segmentTableProcessSelect').value;
  const tableContainer = document.getElementById('segment-table');
  
  if (!processId) {
    tableContainer.innerHTML = '<p>No process selected</p>';
    return;
  }
  
  const segmentTable = segmentTables[processId];
  
  if (!segmentTable) {
    tableContainer.innerHTML = '<p>No segment table available for this process</p>';
    return;
  }
  
  // Create table
  let tableHTML = `
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Segment</th>
          <th>Name</th>
          <th>Base</th>
          <th>Limit</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // Add rows
  for (const [segmentId, segment] of Object.entries(segmentTable)) {
    tableHTML += `
      <tr>
        <td>${segmentId}</td>
        <td>${segment.name}</td>
        <td>${segment.base}</td>
        <td>${segment.limit}</td>
      </tr>
    `;
  }
  
  tableHTML += `
      </tbody>
    </table>
  `;
  
  tableContainer.innerHTML = tableHTML;
}

// Calculate physical address from logical address
function calculatePhysicalAddress() {
  const processNo = parseInt(document.getElementById('processNumber').value);
  const segmentNo = parseInt(document.getElementById('segmentNumber').value);
  const offset = parseInt(document.getElementById('offset').value);

  // Validation
  if (isNaN(processNo) || isNaN(segmentNo) || isNaN(offset)) {
    alert('Please fill all fields with valid numbers.');
    return false;
  }

  // Check if process number is valid
  if (processNo <= 0 || processNo > segmentTables.length) {
    alert(`Invalid process number. Please enter a value between 1 and ${segmentTables.length}.`);
    return false;
  }

  const processIndex = processNo - 1;
  const segmentTable = segmentTables[processIndex];

  // Check if segment table exists
  if (!segmentTable) {
    alert(`No segment table found for Process ${processNo}.`);
    return false;
  }

  // Check if segment number is valid
  if (!(segmentNo in segmentTable)) {
    alert(`Invalid segment number for Process ${processNo}. Valid segments are: ${Object.keys(segmentTable).join(', ')}`);
    return false;
  }

  const segment = segmentTable[segmentNo];

  // Check if offset is valid
  if (offset < 0 || offset >= segment.limit) {
    alert(`Memory Trap: Invalid offset. Must be between 0 and ${segment.limit - 1}.`);
    return false;
  }

  // Calculate physical address
  const physicalAddress = segment.base + offset;

  // Update result display
  const result = document.getElementById('result');
  result.innerHTML = `
    <strong>Address Translation</strong><br>
    Process ${processNo}, Segment ${segmentNo} (${segment.name}), Offset ${offset}<br>
    Maps to:<br>
    Physical Address ${physicalAddress}<br>
    <small>Formula: Base + Offset = ${segment.base} + ${offset} = ${physicalAddress}</small>
  `;
  result.style.display = 'block';
  
  // Add execution step
  addExecutionStep(`Address translation: Process ${processNo}, Segment ${segmentNo} (${segment.name}), Offset ${offset} → Physical Address ${physicalAddress}`);
  
  // Highlight the segment in visualization
  highlightSegment(processIndex, segmentNo);

  // Prevent form submission
  return false;
}

// Highlight a segment in the visualization
function highlightSegment(processId, segmentId) {
  // Reset highlighting on all segments
  const segments = document.querySelectorAll('.memory-segment');
  segments.forEach(segment => {
    segment.classList.remove('highlighted');
    segment.classList.remove('pulse');
  });
  
  // Highlight the selected segment
  const segment = document.getElementById(`segment-p${processId}-s${segmentId}`);
  if (segment) {
    segment.classList.add('highlighted');
    segment.classList.add('pulse');
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