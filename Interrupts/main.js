import { initTheory } from './js/theory.js';
import { setupInterrupts } from './js/interrupts.js';
import { initIVT } from './js/ivt.js';
import { initSimulation } from './js/simulation.js';

// Initialize all modules when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load theory content
  initTheory();
  
  // Setup interrupt buttons
  setupInterrupts();
  
  // Initialize the IVT display
  initIVT();
  
  // Initialize the simulation
  initSimulation();
  
  console.log('CPU Interrupt Simulation initialized');
});