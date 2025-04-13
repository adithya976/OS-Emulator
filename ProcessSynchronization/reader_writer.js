// DOM Elements
const readerButtonsContainer = document.getElementById('readerButtons');
const writerButtonsContainer = document.getElementById('writerButtons');
const roomStatusDisplay = document.getElementById('roomStatus');
const roomOccupantsDisplay = document.getElementById('roomOccupants');
const numReadersInput = document.getElementById('numReaders');
const numWritersInput = document.getElementById('numWriters');
const updateProcessesButton = document.getElementById('updateProcesses');

// State Variables
let readers = [];
let writers = [];
let roomStatus = 'Empty';
let roomOccupants = [];

// Update Room Status
function updateRoomStatus() {
    if (roomOccupants.length === 0) {
        roomStatus = 'Empty';
        roomStatusDisplay.className = 'empty';
    } else if (roomOccupants.some(occupant => occupant.startsWith('Writer'))) {
        roomStatus = 'Writer Mode';
        roomStatusDisplay.className = 'writer-mode';
    } else {
        roomStatus = 'Reader Mode';
        roomStatusDisplay.className = 'reader-mode';
    }

    roomStatusDisplay.textContent = roomStatus;
    roomOccupantsDisplay.textContent = roomOccupants.length > 0 ? roomOccupants.join(', ') : 'None';
}

// Reader Function
function toggleReader(readerId) {
    if (roomStatus === 'Writer Mode') return;

    const index = roomOccupants.indexOf(readerId);
    if (index === -1) {
        roomOccupants.push(readerId);
    } else {
        roomOccupants.splice(index, 1);
    }

    updateRoomStatus();
}

// Writer Function
function toggleWriter(writerId) {
    const index = roomOccupants.indexOf(writerId);
    if (index === -1) {
        // If the room is not empty, the writer cannot enter
        if (roomOccupants.length > 0) return;

        // Add the writer to the room
        roomOccupants.push(writerId);
    } else {
        // Remove the writer from the room
        roomOccupants.splice(index, 1);
    }

    updateRoomStatus();
}

// Render Buttons for Readers and Writers
function renderProcessButtons() {
    readerButtonsContainer.innerHTML = '';
    writerButtonsContainer.innerHTML = '';

    readers.forEach(readerId => {
        const button = document.createElement('button');
        button.textContent = readerId;
        button.id = readerId;
        button.addEventListener('click', () => toggleReader(readerId));
        readerButtonsContainer.appendChild(button);
    });

    writers.forEach(writerId => {
        const button = document.createElement('button');
        button.textContent = writerId;
        button.id = writerId;
        button.addEventListener('click', () => toggleWriter(writerId));
        writerButtonsContainer.appendChild(button);
    });
}

// Initialize Processes
function initializeProcesses() {
    const numReaders = parseInt(numReadersInput.value, 10);
    const numWriters = parseInt(numWritersInput.value, 10);

    readers = Array.from({ length: numReaders }, (_, i) => `Reader-${i + 1}`);
    writers = Array.from({ length: numWriters }, (_, i) => `Writer-${i + 1}`);

    roomOccupants = [];
    updateRoomStatus();
    renderProcessButtons();
}

// Event Listener for Updating Processes
updateProcessesButton.addEventListener('click', initializeProcesses);

// Initialize Simulation
initializeProcesses();