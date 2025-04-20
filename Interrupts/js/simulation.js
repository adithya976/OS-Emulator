import { highlightIVTEntry, getISRAddress } from './ivt.js';
import { resetInterruptButtons } from './interrupts.js';

// Simulation state
let simulationActive = false;
let currentStep = 0;
let currentInterruptType = null;
let isrCode = null;
let interruptDescription = null;

// Original CPU register values (to be restored later)
const originalState = {
  process: 'Calculator App',
  pc: '0x1A3F',
  sp: '0xFFE8',
  status: 'Running'
};

// CPU state during simulation
let cpuState = { ...originalState };

// Simulation steps
const simulationSteps = [
  {
    name: 'interruptReceived',
    action: receiveInterrupt,
    description: 'CPU receives interrupt signal'
  },
  {
    name: 'lookupIVT',
    action: lookupIVT,
    description: 'CPU looks up the ISR address in the Interrupt Vector Table'
  },
  {
    name: 'saveContext',
    action: saveContext,
    description: 'Current process state is saved to the Process Control Block'
  },
  {
    name: 'executeISR',
    action: executeISR,
    description: 'CPU executes the Interrupt Service Routine'
  },
  {
    name: 'restoreContext',
    action: restoreContext,
    description: 'Process state is restored from the Process Control Block'
  },
  {
    name: 'resumeProcess',
    action: resumeProcess,
    description: 'Original process resumes execution'
  }
];

// Initialize the simulation UI
export function initSimulation() {
  const nextStepButton = document.getElementById('next-step');
  const resetButton = document.getElementById('reset-sim');
  
  // Next Step button click event
  nextStepButton.addEventListener('click', () => {
    if (simulationActive && currentStep < simulationSteps.length) {
      // Execute the current step
      const step = simulationSteps[currentStep];
      step.action();
      
      // Log the step
      logEvent('info', `Step ${currentStep + 1}: ${step.description}`);
      
      // Increment step counter
      currentStep++;
      
      // Check if simulation is complete
      if (currentStep >= simulationSteps.length) {
        nextStepButton.disabled = true;
        logEvent('success', 'Simulation complete.');
        simulationActive = false;
        currentStep = 0;
        
        // Re-enable interrupt buttons
        setTimeout(() => {
          resetInterruptButtons();
        }, 1000);
      }
    }
  });
  
  // Reset button click event
  resetButton.addEventListener('click', () => {
    resetSimulation();
  });
}

// Start a new simulation
export function startSimulation(interruptType, isrCodeTemplate, description) {
  // Reset any previous simulation
  resetSimulation(false);
  
  // Set simulation parameters
  currentInterruptType = interruptType;
  isrCode = isrCodeTemplate;
  interruptDescription = description;
  simulationActive = true;
  currentStep = 0;
  
  // Log the start of the simulation
  logEvent('info', `Simulation started: ${interruptDescription}`);
  
  // Enable the Next Step button
  document.getElementById('next-step').disabled = false;
  
  // Reset the ISR code display
  document.getElementById('isr-code').textContent = '// Waiting for interrupt...';
}

// Reset the simulation state
function resetSimulation(resetButtons = true) {
  // Reset simulation variables
  simulationActive = false;
  currentStep = 0;
  
  // Reset UI
  document.getElementById('next-step').disabled = true;
  document.getElementById('isr-code').textContent = '// Waiting for interrupt...';
  
  // Reset CPU display
  document.getElementById('current-process').textContent = originalState.process;
  document.getElementById('program-counter').textContent = originalState.pc;
  document.getElementById('stack-pointer').textContent = originalState.sp;
  document.getElementById('cpu-status').textContent = originalState.status;
  
  // Reset PCB display
  document.getElementById('pcb-state').textContent = 'Running';
  document.getElementById('pcb-pc').textContent = originalState.pc;
  document.getElementById('pcb-sp').textContent = originalState.sp;
  
  // Reset the IVT highlighting
  const entries = document.querySelectorAll('.ivt-entry');
  entries.forEach(entry => entry.classList.remove('active'));
  
  // Reset CPU state
  cpuState = { ...originalState };
  
  // Clear the log
  if (resetButtons) {
    document.getElementById('log-content').innerHTML = '';
    resetInterruptButtons();
  } else {
    logEvent('info', 'Simulation reset.');
  }
}

// Log an event to the simulation log
function logEvent(type, message) {
  const logContent = document.getElementById('log-content');
  const logEntry = document.createElement('div');
  
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = message;
  
  logContent.appendChild(logEntry);
  logContent.scrollTop = logContent.scrollHeight;
}

// Simulation Step 1: Receive Interrupt
function receiveInterrupt() {
  // Update CPU status
  document.getElementById('cpu-status').textContent = 'Interrupted';
  cpuState.status = 'Interrupted';
  
  // Flash the CPU to indicate interrupt
  const cpu = document.querySelector('.cpu');
  cpu.classList.add('flash');
  setTimeout(() => {
    cpu.classList.remove('flash');
  }, 800);
  
  // Log event
  logEvent('warning', `Interrupt received: ${interruptDescription}`);
}

// Simulation Step 2: Lookup IVT
function lookupIVT() {
  // Highlight the IVT entry for this interrupt
  highlightIVTEntry(currentInterruptType);
  
  // Get the ISR address
  const isrAddress = getISRAddress(currentInterruptType);
  
  // Flash the IVT table
  const ivtTable = document.querySelector('.memory-ivt');
  ivtTable.classList.add('flash');
  setTimeout(() => {
    ivtTable.classList.remove('flash');
  }, 800);
  
  // Log event
  logEvent('info', `Interrupt Vector Table lookup: ${currentInterruptType} → ${isrAddress}`);
}

// Simulation Step 3: Save Context
function saveContext() {
  // Update PCB with current CPU state
  document.getElementById('pcb-state').textContent = 'Interrupted';
  document.getElementById('pcb-pc').textContent = cpuState.pc;
  document.getElementById('pcb-sp').textContent = cpuState.sp;
  
  // Animation for PCB saving
  const pcbContent = document.querySelector('.pcb-content');
  pcbContent.classList.add('saving');
  setTimeout(() => {
    pcbContent.classList.remove('saving');
  }, 800);
  
  // Log event
  logEvent('info', `Process state saved to PCB. PC: ${cpuState.pc}, SP: ${cpuState.sp}`);
}

// Simulation Step 4: Execute ISR
function executeISR() {
  // Update CPU status and registers
  document.getElementById('cpu-status').textContent = 'Executing ISR';
  document.getElementById('current-process').textContent = `ISR: ${currentInterruptType}`;
  document.getElementById('program-counter').textContent = getISRAddress(currentInterruptType);
  document.getElementById('stack-pointer').textContent = '0xFFF0'; // New stack for ISR
  
  // Update ISR code display
  document.getElementById('isr-code').textContent = isrCode;
  
  // Animation for ISR execution
  const isrContent = document.querySelector('.isr-content');
  isrContent.classList.add('executing');
  setTimeout(() => {
    isrContent.classList.remove('executing');
  }, 2000);
  
  // Log event
  logEvent('info', `Executing ${currentInterruptType} Interrupt Service Routine`);
}

// Simulation Step 5: Restore Context
function restoreContext() {
  // Update CPU with saved PCB state
  document.getElementById('cpu-status').textContent = 'Restoring';
  document.getElementById('program-counter').textContent = document.getElementById('pcb-pc').textContent;
  document.getElementById('stack-pointer').textContent = document.getElementById('pcb-sp').textContent;
  
  // Animation for PCB restoring
  const pcbContent = document.querySelector('.pcb-content');
  pcbContent.classList.add('saving'); // Reuse the same animation
  setTimeout(() => {
    pcbContent.classList.remove('saving');
  }, 800);
  
  // Log event
  logEvent('info', 'Restoring process state from PCB');
}

// Simulation Step 6: Resume Process
function resumeProcess() {
  // Update CPU status back to original
  document.getElementById('cpu-status').textContent = originalState.status;
  document.getElementById('current-process').textContent = originalState.process;
  
  // Reset ISR code display
  document.getElementById('isr-code').textContent = '// Interrupt handled, returned to normal execution';
  
  // Update PCB
  document.getElementById('pcb-state').textContent = 'Running';
  
  // Flash the CPU to indicate resumption
  const cpu = document.querySelector('.cpu');
  cpu.classList.add('flash');
  setTimeout(() => {
    cpu.classList.remove('flash');
  }, 800);
  
  // Log event
  logEvent('success', `Interrupt handling complete. Resumed process: ${originalState.process}`);
}