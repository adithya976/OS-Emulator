// DOM Elements
const bufferDisplay = document.getElementById('buffer');
const producerButtonsContainer = document.getElementById('producerButtons');
const consumerButtonsContainer = document.getElementById('consumerButtons');
const producerHistoryContainer = document.getElementById('producerHistory');
const consumerHistoryContainer = document.getElementById('consumerHistory');
const statusDisplay = document.getElementById('status');
const numProducersInput = document.getElementById('numProducers');
const numConsumersInput = document.getElementById('numConsumers');
const updateProcessesButton = document.getElementById('updateProcesses');

// Buffer and Limits
const BUFFER_SIZE = 5;
let buffer = Array(BUFFER_SIZE).fill(null);
let blockCounter = 1;

// Processes
let producers = [];
let consumers = [];
let producerHistory = {};
let consumerHistory = {};

// Update Buffer Display
function updateBufferDisplay() {
    bufferDisplay.innerHTML = '';
    buffer.forEach((block, index) => {
        const div = document.createElement('div');
        div.textContent = block ? block : '';
        div.className = block ? 'buffer-item' : 'buffer-item empty';
        bufferDisplay.appendChild(div);
    });
}

// Update Status Display
function updateStatus(message) {
    statusDisplay.textContent = message;
}

// Update History Display
function updateHistoryDisplay() {
    producerHistoryContainer.innerHTML = '';
    consumerHistoryContainer.innerHTML = '';

    Object.keys(producerHistory).forEach(producerId => {
        const div = document.createElement('div');
        div.textContent = `${producerId}: ${producerHistory[producerId].join(', ')}`;
        producerHistoryContainer.appendChild(div);
    });

    Object.keys(consumerHistory).forEach(consumerId => {
        const div = document.createElement('div');
        div.textContent = `${consumerId}: ${consumerHistory[consumerId].join(', ')}`;
        consumerHistoryContainer.appendChild(div);
    });
}

// Producer Function
function produce(producerId) {
    const emptyIndex = buffer.indexOf(null);
    if (emptyIndex !== -1) {
        const block = blockCounter++;
        buffer[emptyIndex] = block;
        if (!producerHistory[producerId]) producerHistory[producerId] = [];
        producerHistory[producerId].push(block);
        updateBufferDisplay();
        updateHistoryDisplay();
        updateStatus(`${producerId} produced: ${block}`);
        toggleButtons();
        setTimeout(() => toggleButtons(), 1000); // Simulate 1 block per second
    } else {
        updateStatus(`${producerId} cannot produce. Buffer is full!`);
    }
}

// Consumer Function
function consume(consumerId) {
    const filledIndex = buffer.findIndex(block => block !== null);
    if (filledIndex !== -1) {
        const block = buffer[filledIndex];
        buffer[filledIndex] = null;
        if (!consumerHistory[consumerId]) consumerHistory[consumerId] = [];
        consumerHistory[consumerId].push(block);
        updateBufferDisplay();
        updateHistoryDisplay();
        updateStatus(`${consumerId} consumed: ${block}`);
        toggleButtons();
        setTimeout(() => toggleButtons(), 1000); // Simulate 1 block per second
    } else {
        updateStatus(`${consumerId} cannot consume. Buffer is empty!`);
    }
}

// Render Buttons for Producers and Consumers
function renderProcessButtons() {
    producerButtonsContainer.innerHTML = '';
    consumerButtonsContainer.innerHTML = '';

    producers.forEach(producerId => {
        const button = document.createElement('button');
        button.textContent = producerId;
        button.id = producerId;
        button.addEventListener('click', () => produce(producerId));
        producerButtonsContainer.appendChild(button);
    });

    consumers.forEach(consumerId => {
        const button = document.createElement('button');
        button.textContent = consumerId;
        button.id = consumerId;
        button.addEventListener('click', () => consume(consumerId));
        consumerButtonsContainer.appendChild(button);
    });
}

// Toggle Buttons Based on Buffer State
function toggleButtons() {
    producers.forEach(producerId => {
        const button = document.getElementById(producerId);
        button.disabled = !buffer.includes(null);
    });

    consumers.forEach(consumerId => {
        const button = document.getElementById(consumerId);
        button.disabled = !buffer.some(block => block !== null);
    });
}

// Initialize Processes
function initializeProcesses() {
    const numProducers = parseInt(numProducersInput.value, 10);
    const numConsumers = parseInt(numConsumersInput.value, 10);

    producers = Array.from({ length: numProducers }, (_, i) => `Producer-${i + 1}`);
    consumers = Array.from({ length: numConsumers }, (_, i) => `Consumer-${i + 1}`);

    producerHistory = {};
    consumerHistory = {};

    renderProcessButtons();
    updateHistoryDisplay();
    toggleButtons();
    updateStatus('Processes updated. Ready to simulate.');
}

// Initialize Simulation
function initializeSimulation() {
    updateBufferDisplay();
    initializeProcesses();
}

// Event Listener for Updating Processes
updateProcessesButton.addEventListener('click', initializeProcesses);

// Start the simulation
initializeSimulation();