document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const algorithmButtons = document.querySelectorAll('.algorithm-btn');
    const runButton = document.getElementById('run-algorithm');
    const resetButton = document.getElementById('reset');
    const compareButton = document.getElementById('compare-algorithms');
    const diskSizeInput = document.getElementById('disk-size');
    const headPositionInput = document.getElementById('head-position');
    const requestQueueInput = document.getElementById('request-queue');
    const nStepValueInput = document.getElementById('nstep-value');
    const diskTrack = document.querySelector('.disk-track');
    const cylinderMarkers = document.querySelector('.disk-cylinder-markers');
    const diskRequests = document.querySelector('.disk-requests');
    const algorithmStepsContainer = document.querySelector('.algorithm-steps');
    const totalDistanceElement = document.getElementById('total-distance');
    const avgDistanceElement = document.getElementById('avg-distance');
    const algorithmTitle = document.getElementById('algorithm-title');
    const algorithmDescription = document.getElementById('algorithm-description');
    const comparisonModal = document.getElementById('comparison-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    
    // State variables
    let currentAlgorithm = 'fcfs';
    let isRunning = false;
    let animationSpeed = 1000; // ms
    let algorithmResults = {};
    
    // Algorithm descriptions
    const algorithmInfo = {
        fcfs: {
            title: "First-Come, First-Served (FCFS)",
            description: "FCFS is the simplest disk scheduling algorithm. Requests are served in the order they arrive in the queue. It's fair but can lead to long seek times if requests are far apart."
        },
        sstf: {
            title: "Shortest Seek Time First (SSTF)",
            description: "SSTF selects the request that requires the least head movement from the current position. This minimizes seek time but may cause starvation of some requests."
        },
        scan: {
            title: "SCAN (Elevator Algorithm)",
            description: "The disk arm starts at one end and moves toward the other end, servicing requests along the way. When it reaches the other end, it reverses direction. This prevents starvation but may not be optimal for all workloads."
        },
        look: {
            title: "LOOK",
            description: "Similar to SCAN, but the disk arm only goes as far as the last request in each direction. It then reverses direction without going all the way to the end of the disk."
        },
        cscan: {
            title: "C-SCAN (Circular SCAN)",
            description: "Like SCAN, but when the disk arm reaches the end, it immediately returns to the beginning and starts moving in the same direction again. This provides more uniform wait times."
        },
        clook: {
            title: "C-LOOK",
            description: "Similar to C-SCAN, but the disk arm only goes as far as the last request in each direction before immediately returning to the other end without servicing requests on the return trip."
        },
        nstep: {
            title: "N-Step SCAN",
            description: "Divides the request queue into subqueues of size N. Each subqueue is serviced using SCAN, providing a balance between FCFS and SCAN."
        },
        fscan: {
            title: "FSCAN",
            description: "Uses two queues. While one queue is being serviced using SCAN, new requests are added to the other queue. This prevents indefinite postponement of requests."
        }
    };
    
    // Initialize
    function initialize() {
        updateAlgorithmInfo();
        setupEventListeners();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Algorithm selection
        algorithmButtons.forEach(button => {
            button.addEventListener('click', function() {
                algorithmButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentAlgorithm = this.dataset.algorithm;
                updateAlgorithmInfo();
            });
        });
        
        // Run algorithm
        runButton.addEventListener('click', runAlgorithm);
        
        // Reset
        resetButton.addEventListener('click', resetSimulation);
        
        // Compare algorithms
        compareButton.addEventListener('click', showComparison);
        
        // Close modal
        closeModalBtn.addEventListener('click', () => {
            comparisonModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === comparisonModal) {
                comparisonModal.style.display = 'none';
            }
        });
        
        // Input validation
        diskSizeInput.addEventListener('change', function() {
            if (parseInt(this.value) < 10) this.value = 10;
            if (parseInt(this.value) > 1000) this.value = 1000;
            
            if (parseInt(headPositionInput.value) >= parseInt(this.value)) {
                headPositionInput.value = parseInt(this.value) - 1;
            }
        });
        
        headPositionInput.addEventListener('change', function() {
            if (parseInt(this.value) < 0) this.value = 0;
            if (parseInt(this.value) >= parseInt(diskSizeInput.value)) {
                this.value = parseInt(diskSizeInput.value) - 1;
            }
        });
    }
    
    // Update algorithm information
    function updateAlgorithmInfo() {
        algorithmTitle.textContent = algorithmInfo[currentAlgorithm].title;
        algorithmDescription.textContent = algorithmInfo[currentAlgorithm].description;
    }
    
    // Run the selected algorithm
    function runAlgorithm() {
        if (isRunning) return;
        isRunning = true;
        
        // Clear previous visualization
        resetVisualization();
        
        // Get input values
        const diskSize = parseInt(diskSizeInput.value);
        let headPosition = parseInt(headPositionInput.value);
        const requestQueueStr = requestQueueInput.value.replace(/\s/g, '');
        const requestQueue = requestQueueStr.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num) && num >= 0 && num < diskSize);
        const direction = document.querySelector('input[name="direction"]:checked').value;
        const nValue = parseInt(nStepValueInput.value);
        
        // Validate input
        if (requestQueue.length === 0) {
            alert('Please enter valid request queue values.');
            isRunning = false;
            return;
        }
        
        // Setup visualization
        setupDiskTrack(diskSize);
        createRequestPoints(requestQueue, headPosition);
        
        // Run algorithm and get sequence
        let sequence;
        let executionSteps = [];
        let totalSeekDistance = 0;
        
        switch (currentAlgorithm) {
            case 'fcfs':
                [sequence, executionSteps, totalSeekDistance] = fcfsAlgorithm(headPosition, requestQueue);
                break;
            case 'sstf':
                [sequence, executionSteps, totalSeekDistance] = sstfAlgorithm(headPosition, requestQueue);
                break;
            case 'scan':
                [sequence, executionSteps, totalSeekDistance] = scanAlgorithm(headPosition, requestQueue, diskSize, direction);
                break;
            case 'look':
                [sequence, executionSteps, totalSeekDistance] = lookAlgorithm(headPosition, requestQueue, direction);
                break;
            case 'cscan':
                [sequence, executionSteps, totalSeekDistance] = cscanAlgorithm(headPosition, requestQueue, diskSize, direction);
                break;
            case 'clook':
                [sequence, executionSteps, totalSeekDistance] = clookAlgorithm(headPosition, requestQueue, direction);
                break;
            case 'nstep':
                [sequence, executionSteps, totalSeekDistance] = nstepScanAlgorithm(headPosition, requestQueue, diskSize, direction, nValue);
                break;
            case 'fscan':
                [sequence, executionSteps, totalSeekDistance] = fscanAlgorithm(headPosition, requestQueue, diskSize, direction);
                break;
        }
        
        // Store results for comparison
        algorithmResults[currentAlgorithm] = {
            totalSeekDistance,
            averageSeekDistance: totalSeekDistance / requestQueue.length
        };
        
        // Update statistics
        totalDistanceElement.textContent = totalSeekDistance;
        avgDistanceElement.textContent = (totalSeekDistance / requestQueue.length).toFixed(2);
        
        // Animate sequence
        animateSequence(sequence, executionSteps, headPosition);
    }
    
    // Reset the simulation
    function resetSimulation() {
        isRunning = false;
        resetVisualization();
        totalDistanceElement.textContent = '0';
        avgDistanceElement.textContent = '0';
    }
    
    // Reset visualization
    function resetVisualization() {
        cylinderMarkers.innerHTML = '';
        diskRequests.innerHTML = '';
        algorithmStepsContainer.innerHTML = '';
        
        // Reset disk head
        const diskHead = document.querySelector('.disk-head');
        if (diskHead) {
            diskHead.style.left = '0px';
        } else {
            const newDiskHead = document.createElement('div');
            newDiskHead.className = 'disk-head';
            diskTrack.appendChild(newDiskHead);
        }
    }
    
    // Setup disk track visualization
    function setupDiskTrack(diskSize) {
        cylinderMarkers.innerHTML = '';
        
        // Create cylinder markers
        const markerCount = 5; // Number of markers to show
        for (let i = 0; i <= markerCount; i++) {
            const position = Math.floor(i * (diskSize / markerCount));
            const marker = document.createElement('div');
            marker.className = 'cylinder-marker';
            
            const label = document.createElement('div');
            label.className = 'cylinder-marker-label';
            label.textContent = position;
            
            marker.style.left = `${(position / diskSize) * 100}%`;
            label.style.left = `${(position / diskSize) * 100}%`;
            
            cylinderMarkers.appendChild(marker);
            cylinderMarkers.appendChild(label);
        }
    }
    
    // Create request points visualization
    function createRequestPoints(requestQueue, headPosition) {
        diskRequests.innerHTML = '';
        const diskSize = parseInt(diskSizeInput.value);
        
        // Create initial head position marker
        createRequestPoint(headPosition, 'initial-head', diskSize);
        
        // Create request points
        requestQueue.forEach((position, index) => {
            createRequestPoint(position, `request-${index}`, diskSize);
        });
    }
    
    // Create a single request point
    function createRequestPoint(position, id, diskSize) {
        const point = document.createElement('div');
        point.className = 'request-point';
        point.id = id;
        point.style.left = `${(position / diskSize) * 100}%`;
        point.style.top = id === 'initial-head' ? '50px' : `${Math.random() * 200 + 50}px`;
        
        // Add label
        const label = document.createElement('div');
        label.className = 'request-label';
        label.textContent = position;
        label.style.position = 'absolute';
        label.style.top = '-20px';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '12px';
        point.appendChild(label);
        
        diskRequests.appendChild(point);
    }
    
    // Animate the sequence of head movements
    function animateSequence(sequence, executionSteps, initialHeadPosition) {
        const diskSize = parseInt(diskSizeInput.value);
        const diskHead = document.querySelector('.disk-head');
        
        // Set initial head position
        const initialLeftPos = (initialHeadPosition / diskSize) * 100;
        diskHead.style.left = `${initialLeftPos}%`;
        
        // Animate each step
        let currentStep = 0;
        
        function animateStep() {
            if (currentStep < sequence.length) {
                const position = sequence[currentStep];
                const stepDescription = executionSteps[currentStep];
                const leftPos = (position / diskSize) * 100;
                
                // Animate disk head
                diskHead.style.left = `${leftPos}%`;
                
                // Highlight current request
                const requestPoints = document.querySelectorAll('.request-point');
                requestPoints.forEach(point => {
                    point.classList.remove('active');
                    const pointPosition = parseInt(point.querySelector('.request-label').textContent);
                    if (pointPosition === position && point.id !== 'initial-head') {
                        point.classList.add('active');
                        point.classList.add('seek-animation');
                        setTimeout(() => {
                            point.classList.remove('seek-animation');
                            point.classList.add('processed');
                        }, animationSpeed / 2);
                    }
                });
                
                // Add step to steps container
                const stepElement = document.createElement('div');
                stepElement.className = 'step';
                
                const stepNumber = document.createElement('div');
                stepNumber.className = 'step-number';
                stepNumber.textContent = currentStep + 1;
                
                const stepDesc = document.createElement('div');
                stepDesc.className = 'step-description';
                stepDesc.textContent = stepDescription;
                
                stepElement.appendChild(stepNumber);
                stepElement.appendChild(stepDesc);
                algorithmStepsContainer.appendChild(stepElement);
                
                // Scroll to show the latest step
                algorithmStepsContainer.scrollTop = algorithmStepsContainer.scrollHeight;
                
                currentStep++;
                setTimeout(animateStep, animationSpeed);
            } else {
                isRunning = false;
            }
        }
        
        animateStep();
    }
    
    // FCFS Algorithm
    function fcfsAlgorithm(headPosition, requestQueue) {
        const sequence = [headPosition, ...requestQueue];
        const executionSteps = [];
        let totalSeekDistance = 0;
        
        for (let i = 1; i < sequence.length; i++) {
            const distance = Math.abs(sequence[i] - sequence[i-1]);
            totalSeekDistance += distance;
            executionSteps.push(`Moving from position ${sequence[i-1]} to ${sequence[i]} (distance: ${distance})`);
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // SSTF Algorithm
    function sstfAlgorithm(headPosition, requestQueue) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        const remainingRequests = [...requestQueue];
        
        while (remainingRequests.length > 0) {
            // Find the closest request
            let minDistance = Infinity;
            let minIndex = -1;
            
            for (let i = 0; i < remainingRequests.length; i++) {
                const distance = Math.abs(remainingRequests[i] - currentPosition);
                if (distance < minDistance) {
                    minDistance = distance;
                    minIndex = i;
                }
            }
            
            // Move to the closest request
            const nextPosition = remainingRequests[minIndex];
            sequence.push(nextPosition);
            totalSeekDistance += minDistance;
            executionSteps.push(`Moving from position ${currentPosition} to ${nextPosition} (distance: ${minDistance}) - shortest seek time`);
            
            // Update current position and remove the processed request
            currentPosition = nextPosition;
            remainingRequests.splice(minIndex, 1);
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // SCAN Algorithm
    function scanAlgorithm(headPosition, requestQueue, diskSize, direction) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        
        // Create a copy of the request queue and sort it
        const requests = [...requestQueue].sort((a, b) => a - b);
        
        // Split requests into those greater than and less than the head position
        const greaterRequests = requests.filter(pos => pos > headPosition);
        const lesserRequests = requests.filter(pos => pos < headPosition);
        
        // Determine sequence based on direction
        let scanSequence;
        if (direction === 'right') {
            scanSequence = [...greaterRequests, diskSize - 1, ...lesserRequests.reverse()];
            executionSteps.push(`SCAN: Moving right to the end of disk, then reversing direction`);
        } else {
            scanSequence = [...lesserRequests.reverse(), 0, ...greaterRequests];
            executionSteps.push(`SCAN: Moving left to the beginning of disk, then reversing direction`);
        }
        
        // Process the scan sequence
        for (const position of scanSequence) {
            const distance = Math.abs(position - currentPosition);
            if (distance > 0) { // Skip if already at this position
                totalSeekDistance += distance;
                sequence.push(position);
                executionSteps.push(`Moving from position ${currentPosition} to ${position} (distance: ${distance})`);
                currentPosition = position;
            }
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // LOOK Algorithm
    function lookAlgorithm(headPosition, requestQueue, direction) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        
        // Create a copy of the request queue and sort it
        const requests = [...requestQueue].sort((a, b) => a - b);
        
        // Split requests into those greater than and less than the head position
        const greaterRequests = requests.filter(pos => pos > headPosition);
        const lesserRequests = requests.filter(pos => pos < headPosition);
        
        // Determine sequence based on direction
        let lookSequence;
        if (direction === 'right') {
            lookSequence = [...greaterRequests, ...lesserRequests.reverse()];
            executionSteps.push(`LOOK: Moving right to the last request, then reversing direction`);
        } else {
            lookSequence = [...lesserRequests.reverse(), ...greaterRequests];
            executionSteps.push(`LOOK: Moving left to the first request, then reversing direction`);
        }
        
        // Process the look sequence
        for (const position of lookSequence) {
            const distance = Math.abs(position - currentPosition);
            totalSeekDistance += distance;
            sequence.push(position);
            executionSteps.push(`Moving from position ${currentPosition} to ${position} (distance: ${distance})`);
            currentPosition = position;
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // C-SCAN Algorithm
    function cscanAlgorithm(headPosition, requestQueue, diskSize, direction) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        
        // Create a copy of the request queue and sort it
        const requests = [...requestQueue].sort((a, b) => a - b);
        
        // Split requests into those greater than and less than the head position
        const greaterRequests = requests.filter(pos => pos > headPosition);
        const lesserRequests = requests.filter(pos => pos < headPosition);
        
        // Determine sequence based on direction
        let scanSequence;
        if (direction === 'right') {
            // Go right to the end, jump to the beginning, then continue right
            scanSequence = [...greaterRequests, diskSize - 1, 0, ...lesserRequests];
            executionSteps.push(`C-SCAN: Moving right to the end of disk, then returning to beginning`);
        } else {
            // Go left to the beginning, jump to the end, then continue left
            scanSequence = [...lesserRequests.reverse(), 0, diskSize - 1, ...greaterRequests.reverse()];
            executionSteps.push(`C-SCAN: Moving left to the beginning of disk, then returning to end`);
        }
        
        // Process the scan sequence
        for (let i = 0; i < scanSequence.length; i++) {
            const position = scanSequence[i];
            let distance;
            
            // Handle the wrap-around (jump) specially
            if ((direction === 'right' && position === 0 && i > 0) || 
                (direction === 'left' && position === diskSize - 1 && i > 0)) {
                // For C-SCAN, the return seek is not counted in the total distance
                distance = 0;
                executionSteps.push(`Returning to ${position} (rapid return, no seek time)`);
            } else {
                distance = Math.abs(position - currentPosition);
                executionSteps.push(`Moving from position ${currentPosition} to ${position} (distance: ${distance})`);
            }
            
            totalSeekDistance += distance;
            sequence.push(position);
            currentPosition = position;
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // C-LOOK Algorithm
    function clookAlgorithm(headPosition, requestQueue, direction) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        
        // Create a copy of the request queue and sort it
        const requests = [...requestQueue].sort((a, b) => a - b);
        
        // Split requests into those greater than and less than the head position
        const greaterRequests = requests.filter(pos => pos > headPosition);
        const lesserRequests = requests.filter(pos => pos < headPosition);
        
        // Determine sequence based on direction
        let lookSequence;
        if (direction === 'right') {
            // Go right to the last request, jump to the first request, then continue right
            lookSequence = [...greaterRequests];
            if (lesserRequests.length > 0) {
                lookSequence.push(lesserRequests[0]);
                // Add any remaining lesser requests
                for (let i = 1; i < lesserRequests.length; i++) {
                    lookSequence.push(lesserRequests[i]);
                }
            }
            executionSteps.push(`C-LOOK: Moving right to the last request, then returning to first request`);
        } else {
            // Go left to the first request, jump to the last request, then continue left
            lookSequence = [...lesserRequests.reverse()];
            if (greaterRequests.length > 0) {
                lookSequence.push(greaterRequests[greaterRequests.length - 1]);
                // Add any remaining greater requests in reverse
                for (let i = greaterRequests.length - 2; i >= 0; i--) {
                    lookSequence.push(greaterRequests[i]);
                }
            }
            executionSteps.push(`C-LOOK: Moving left to the first request, then returning to last request`);
        }
        
        // Process the look sequence
        for (let i = 0; i < lookSequence.length; i++) {
            const position = lookSequence[i];
            let distance;
            
            // Handle the jump specially
            if ((direction === 'right' && i > 0 && lesserRequests.length > 0 && position === lesserRequests[0]) ||
                (direction === 'left' && i > 0 && greaterRequests.length > 0 && position === greaterRequests[greaterRequests.length - 1])) {
                distance = 0; // For C-LOOK, the return seek is not counted
                executionSteps.push(`Returning to ${position} (rapid return, no seek time)`);
            } else {
                distance = Math.abs(position - currentPosition);
                executionSteps.push(`Moving from position ${currentPosition} to ${position} (distance: ${distance})`);
            }
            
            totalSeekDistance += distance;
            sequence.push(position);
            currentPosition = position;
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // N-Step SCAN Algorithm
    function nstepScanAlgorithm(headPosition, requestQueue, diskSize, direction, nValue) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        
        // Group requests into batches of size N
        const batchCount = Math.ceil(requestQueue.length / nValue);
        const batches = [];
        
        for (let i = 0; i < batchCount; i++) {
            const startIdx = i * nValue;
            const endIdx = Math.min(startIdx + nValue, requestQueue.length);
            batches.push(requestQueue.slice(startIdx, endIdx));
        }
        
        executionSteps.push(`N-Step SCAN: Dividing ${requestQueue.length} requests into ${batches.length} batches of size ${nValue}`);
        
        // Process each batch using SCAN
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            executionSteps.push(`Processing batch ${i+1}: ${batch.join(', ')}`);
            
            // Run SCAN algorithm on this batch
            const [batchSeq, batchSteps, batchDistance] = scanAlgorithm(currentPosition, batch, diskSize, direction);
            
            // Skip the first position (it's the current position)
            for (let j = 1; j < batchSeq.length; j++) {
                sequence.push(batchSeq[j]);
            }
            
            // Add steps but skip the first intro step from scanAlgorithm
            for (let j = 1; j < batchSteps.length; j++) {
                executionSteps.push(`  ${batchSteps[j]} (batch ${i+1})`);
            }
            
            totalSeekDistance += batchDistance;
            
            // Update current position for next batch
            if (batchSeq.length > 0) {
                currentPosition = batchSeq[batchSeq.length - 1];
            }
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // FSCAN Algorithm
    function fscanAlgorithm(headPosition, requestQueue, diskSize, direction) {
        const sequence = [headPosition];
        const executionSteps = [];
        let totalSeekDistance = 0;
        let currentPosition = headPosition;
        
        // Split requests into two queues (simulating initial and new arrivals)
        const midpoint = Math.floor(requestQueue.length / 2);
        const queue1 = requestQueue.slice(0, midpoint);
        const queue2 = requestQueue.slice(midpoint);
        
        executionSteps.push(`FSCAN: Dividing ${requestQueue.length} requests into 2 queues - Queue 1: ${queue1.length} requests, Queue 2: ${queue2.length} requests`);
        
        // Process first queue
        if (queue1.length > 0) {
            executionSteps.push(`Processing Queue 1: ${queue1.join(', ')}`);
            const [seq1, steps1, distance1] = scanAlgorithm(currentPosition, queue1, diskSize, direction);
            
            // Skip the first position (it's the current position)
            for (let i = 1; i < seq1.length; i++) {
                sequence.push(seq1[i]);
            }
            
            // Add steps but skip the first intro step from scanAlgorithm
            for (let i = 1; i < steps1.length; i++) {
                executionSteps.push(`  ${steps1[i]} (Queue 1)`);
            }
            
            totalSeekDistance += distance1;
            
            // Update current position for second queue
            if (seq1.length > 0) {
                currentPosition = seq1[seq1.length - 1];
            }
        }
        
        // Process second queue
        if (queue2.length > 0) {
            executionSteps.push(`Processing Queue 2: ${queue2.join(', ')}`);
            const [seq2, steps2, distance2] = scanAlgorithm(currentPosition, queue2, diskSize, direction);
            
            // Skip the first position (it's the current position)
            for (let i = 1; i < seq2.length; i++) {
                sequence.push(seq2[i]);
            }
            
            // Add steps but skip the first intro step from scanAlgorithm
            for (let i = 1; i < steps2.length; i++) {
                executionSteps.push(`  ${steps2[i]} (Queue 2)`);
            }
            
            totalSeekDistance += distance2;
        }
        
        return [sequence, executionSteps, totalSeekDistance];
    }
    
    // Show algorithm comparison
    function showComparison() {
        // Display the modal
        comparisonModal.style.display = 'block';
        
        // If we have no results, run all algorithms with current parameters
        if (Object.keys(algorithmResults).length === 0) {
            runAllAlgorithms();
        }
        
        // Create comparison chart
        createComparisonChart();
    }
    
    // Run all algorithms with current parameters
    function runAllAlgorithms() {
        // Get input values
        const diskSize = parseInt(diskSizeInput.value);
        const headPosition = parseInt(headPositionInput.value);
        const requestQueueStr = requestQueueInput.value.replace(/\s/g, '');
        const requestQueue = requestQueueStr.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num) && num >= 0 && num < diskSize);
        const direction = document.querySelector('input[name="direction"]:checked').value;
        const nValue = parseInt(nStepValueInput.value);
        
        // Validate input
        if (requestQueue.length === 0) {
            alert('Please enter valid request queue values.');
            return;
        }
        
        // Run each algorithm and store results
        let result;
        
        // FCFS
        result = fcfsAlgorithm(headPosition, requestQueue);
        algorithmResults['fcfs'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // SSTF
        result = sstfAlgorithm(headPosition, requestQueue);
        algorithmResults['sstf'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // SCAN
        result = scanAlgorithm(headPosition, requestQueue, diskSize, direction);
        algorithmResults['scan'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // LOOK
        result = lookAlgorithm(headPosition, requestQueue, direction);
        algorithmResults['look'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // C-SCAN
        result = cscanAlgorithm(headPosition, requestQueue, diskSize, direction);
        algorithmResults['cscan'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // C-LOOK
        result = clookAlgorithm(headPosition, requestQueue, direction);
        algorithmResults['clook'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // N-Step SCAN
        result = nstepScanAlgorithm(headPosition, requestQueue, diskSize, direction, nValue);
        algorithmResults['nstep'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
        
        // FSCAN
        result = fscanAlgorithm(headPosition, requestQueue, diskSize, direction);
        algorithmResults['fscan'] = {
            totalSeekDistance: result[2],
            averageSeekDistance: result[2] / requestQueue.length
        };
    }
    
    // Create comparison chart
    function createComparisonChart() {
        const chartContainer = document.getElementById('comparison-chart');
        chartContainer.innerHTML = '';
        
        // Sort algorithms by total seek distance
        const sortedAlgorithms = Object.keys(algorithmResults).sort((a, b) => 
            algorithmResults[a].totalSeekDistance - algorithmResults[b].totalSeekDistance
        );
        
        // Create the chart container
        const chart = document.createElement('div');
        chart.style.display = 'flex';
        chart.style.flexDirection = 'column';
        chart.style.height = '100%';
        
        // Algorithm titles mapping
        const algorithmTitles = {
            fcfs: 'FCFS',
            sstf: 'SSTF',
            scan: 'SCAN',
            look: 'LOOK',
            cscan: 'C-SCAN',
            clook: 'C-LOOK',
            nstep: 'N-Step SCAN',
            fscan: 'FSCAN'
        };
        
        // Create table for statistics
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.marginBottom = '20px';
        table.style.borderCollapse = 'collapse';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Algorithm', 'Total Seek Distance', 'Average Seek Distance'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.padding = '10px';
            th.style.textAlign = 'left';
            th.style.borderBottom = '1px solid #444';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        sortedAlgorithms.forEach(alg => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = algorithmTitles[alg] || alg;
            nameCell.style.padding = '10px';
            
            const totalCell = document.createElement('td');
            totalCell.textContent = algorithmResults[alg].totalSeekDistance;
            totalCell.style.padding = '10px';
            
            const avgCell = document.createElement('td');
            avgCell.textContent = algorithmResults[alg].averageSeekDistance.toFixed(2);
            avgCell.style.padding = '10px';
            
            row.appendChild(nameCell);
            row.appendChild(totalCell);
            row.appendChild(avgCell);
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        chartContainer.appendChild(table);
        
        // Create bar chart for visual comparison
        const maxDistance = Math.max(...sortedAlgorithms.map(alg => algorithmResults[alg].totalSeekDistance));
        const chartBars = document.createElement('div');
        chartBars.style.display = 'flex';
        chartBars.style.flexDirection = 'row';
        chartBars.style.height = '250px';
        chartBars.style.alignItems = 'flex-end';
        chartBars.style.gap = '15px';
        chartBars.style.paddingLeft = '40px';
        
        sortedAlgorithms.forEach(alg => {
            const barContainer = document.createElement('div');
            barContainer.style.display = 'flex';
            barContainer.style.flexDirection = 'column';
            barContainer.style.alignItems = 'center';
            barContainer.style.flex = '1';
            
            const bar = document.createElement('div');
            const height = (algorithmResults[alg].totalSeekDistance / maxDistance) * 100;
            bar.style.width = '100%';
            bar.style.height = `${height}%`;
            bar.style.backgroundColor = '#4361ee';
            bar.style.borderRadius = '4px 4px 0 0';
            
            const label = document.createElement('div');
            label.textContent = algorithmTitles[alg] || alg;
            label.style.marginTop = '10px';
            label.style.textAlign = 'center';
            label.style.fontSize = '12px';
            label.style.transform = 'rotate(-45deg)';
            label.style.transformOrigin = 'left top';
            label.style.whiteSpace = 'nowrap';
            
            const value = document.createElement('div');
            value.textContent = algorithmResults[alg].totalSeekDistance;
            value.style.marginTop = '5px';
            value.style.fontSize = '10px';
            
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(value);
            chartBars.appendChild(barContainer);
        });
        
        chartContainer.appendChild(chartBars);
    }
    
    // Initialize on page load
    initialize();
});

// Functions to improve for better visualization

// Setup disk track visualization - improved for better visibility
function setupDiskTrack(diskSize) {
    cylinderMarkers.innerHTML = '';
    
    // Create cylinder markers - increase marker count for better visibility
    const markerCount = 10; // Increased from 5
    for (let i = 0; i <= markerCount; i++) {
        const position = Math.floor(i * (diskSize / markerCount));
        const marker = document.createElement('div');
        marker.className = 'cylinder-marker';
        
        const label = document.createElement('div');
        label.className = 'cylinder-marker-label';
        label.textContent = position;
        
        marker.style.left = `${(position / diskSize) * 100}%`;
        label.style.left = `${(position / diskSize) * 100}%`;
        
        cylinderMarkers.appendChild(marker);
        cylinderMarkers.appendChild(label);
    }
}

// Create request points - improved visualization
function createRequestPoints(requestQueue, headPosition) {
    diskRequests.innerHTML = '';
    const diskSize = parseInt(diskSizeInput.value);
    
    // Create initial head position marker
    createRequestPoint(headPosition, 'initial-head', diskSize);
    
    // Create request points with better distribution
    requestQueue.forEach((position, index) => {
        createRequestPoint(position, `request-${index}`, diskSize);
    });
}

// Create a single request point - improved positioning algorithm
function createRequestPoint(position, id, diskSize) {
    const point = document.createElement('div');
    point.className = 'request-point';
    if (id === 'initial-head') {
        point.classList.add('initial-head');
    }
    point.id = id;
    
    // Position horizontally based on cylinder position
    point.style.left = `${(position / diskSize) * 100}%`;
    
    // Better vertical distribution to avoid overlap
    // For initial head, place it at the top
    let verticalPosition;
    if (id === 'initial-head') {
        verticalPosition = 20; // Fixed position at top for head start point
    } else {
        // Distribute request points better vertically
        const index = parseInt(id.split('-')[1]);
        verticalPosition = 50 + ((index % 5) * 30); // Distribute in rows
    }
    
    point.style.top = `${verticalPosition}px`;
    
    // Add label with better positioning
    const label = document.createElement('div');
    label.className = 'request-label';
    label.textContent = position;
    
    // Position label based on point placement
    if (id === 'initial-head') {
        label.style.top = '-20px';
    } else {
        label.style.top = '20px';
    }
    
    point.appendChild(label);
    diskRequests.appendChild(point);
}

// Animate the sequence - improved visual feedback
function animateSequence(sequence, executionSteps, initialHeadPosition) {
    const diskSize = parseInt(diskSizeInput.value);
    const diskHead = document.querySelector('.disk-head');
    
    if (!diskHead) {
        const newDiskHead = document.createElement('div');
        newDiskHead.className = 'disk-head';
        diskTrack.appendChild(newDiskHead);
    }
    
    // Set initial head position
    const initialLeftPos = (initialHeadPosition / diskSize) * 100;
    diskHead.style.left = `${initialLeftPos}%`;
    
    // Animate each step
    let currentStep = 0;
    
    function animateStep() {
        if (currentStep < sequence.length) {
            const position = sequence[currentStep];
            const stepDescription = executionSteps[currentStep];
            const leftPos = (position / diskSize) * 100;
            
            // Animate disk head with smoother transition
            diskHead.style.left = `${leftPos}%`;
            
            // Highlight current request - improved visual feedback
            const requestPoints = document.querySelectorAll('.request-point');
            requestPoints.forEach(point => {
                point.classList.remove('active');
                
                // Get the position from the label
                const pointLabel = point.querySelector('.request-label');
                if (pointLabel) {
                    const pointPosition = parseInt(pointLabel.textContent);
                    
                    if (pointPosition === position && point.id !== 'initial-head') {
                        point.classList.add('active');
                        point.classList.add('seek-animation');
                        
                        // After animation, mark as processed
                        setTimeout(() => {
                            point.classList.remove('seek-animation');
                            point.classList.add('processed');
                        }, animationSpeed / 2);
                    }
                }
            });
            
            // Add step to steps container with better formatting
            const stepElement = document.createElement('div');
            stepElement.className = 'step';
            
            const stepNumber = document.createElement('div');
            stepNumber.className = 'step-number';
            stepNumber.textContent = currentStep + 1;
            
            const stepDesc = document.createElement('div');
            stepDesc.className = 'step-description';
            stepDesc.textContent = stepDescription;
            
            stepElement.appendChild(stepNumber);
            stepElement.appendChild(stepDesc);
            algorithmStepsContainer.appendChild(stepElement);
            
            // Scroll to show the latest step
            algorithmStepsContainer.scrollTop = algorithmStepsContainer.scrollHeight;
            
            currentStep++;
            setTimeout(animateStep, animationSpeed);
        } else {
            isRunning = false;
        }
    }
    
    animateStep();
}

// Reset visualization with improved cleanup
function resetVisualization() {
    cylinderMarkers.innerHTML = '';
    diskRequests.innerHTML = '';
    algorithmStepsContainer.innerHTML = '';
    
    // Reset disk head
    const diskHead = document.querySelector('.disk-head');
    if (diskHead) {
        diskHead.style.left = '0%';
    } else {
        const newDiskHead = document.createElement('div');
        newDiskHead.className = 'disk-head';
        diskTrack.appendChild(newDiskHead);
    }
}

// Show comparison with improved modal display
function showComparison() {
    // Display the modal using flex
    comparisonModal.style.display = 'flex';
    
    // If we have no results, run all algorithms with current parameters
    if (Object.keys(algorithmResults).length === 0) {
        runAllAlgorithms();
    }
    
    // Create comparison chart
    createComparisonChart();
}

// Create comparison chart with better styling
function createComparisonChart() {
    const chartContainer = document.getElementById('comparison-chart');
    chartContainer.innerHTML = '';
    
    // Sort algorithms by total seek distance
    const sortedAlgorithms = Object.keys(algorithmResults).sort((a, b) => 
        algorithmResults[a].totalSeekDistance - algorithmResults[b].totalSeekDistance
    );
    
    // Create the chart container
    const chart = document.createElement('div');
    chart.style.display = 'flex';
    chart.style.flexDirection = 'column';
    chart.style.height = '100%';
    
    // Algorithm titles mapping
    const algorithmTitles = {
        fcfs: 'FCFS',
        sstf: 'SSTF',
        scan: 'SCAN',
        look: 'LOOK',
        cscan: 'C-SCAN',
        clook: 'C-LOOK',
        nstep: 'N-Step SCAN',
        fscan: 'FSCAN'
    };
    
    // Create table for statistics
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.marginBottom = '20px';
    table.style.borderCollapse = 'collapse';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Algorithm', 'Total Seek Distance', 'Average Seek Distance'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.padding = '10px';
        th.style.textAlign = 'left';
        th.style.borderBottom = '1px solid #444';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    sortedAlgorithms.forEach((alg, index) => {
        const row = document.createElement('tr');
        row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        
        const nameCell = document.createElement('td');
        nameCell.textContent = algorithmTitles[alg] || alg;
        nameCell.style.padding = '10px';
        
        const totalCell = document.createElement('td');
        totalCell.textContent = algorithmResults[alg].totalSeekDistance;
        totalCell.style.padding = '10px';
        
        const avgCell = document.createElement('td');
        avgCell.textContent = algorithmResults[alg].averageSeekDistance.toFixed(2);
        avgCell.style.padding = '10px';
        
        row.appendChild(nameCell);
        row.appendChild(totalCell);
        row.appendChild(avgCell);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    chartContainer.appendChild(table);
    
    // Create bar chart for visual comparison
    const maxDistance = Math.max(...sortedAlgorithms.map(alg => algorithmResults[alg].totalSeekDistance));
    const chartBars = document.createElement('div');
    chartBars.style.display = 'flex';
    chartBars.style.flexDirection = 'row';
    chartBars.style.height = '250px';
    chartBars.style.alignItems = 'flex-end';
    chartBars.style.gap = '15px';
    chartBars.style.paddingLeft = '40px';
    chartBars.style.marginTop = '20px';
    
    sortedAlgorithms.forEach((alg, index) => {
        const barContainer = document.createElement('div');
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.alignItems = 'center';
        barContainer.style.flex = '1';
        
        const bar = document.createElement('div');
        const height = (algorithmResults[alg].totalSeekDistance / maxDistance) * 100;
        bar.style.width = '100%';
        bar.style.height = `${height}%`;
        bar.style.backgroundColor = getAlgorithmColor(alg, index);
        bar.style.borderRadius = '4px 4px 0 0';
        bar.style.transition = 'height 0.5s ease';
        
        const label = document.createElement('div');
        label.textContent = algorithmTitles[alg] || alg;
        label.style.marginTop = '10px';
        label.style.textAlign = 'center';
        label.style.fontSize = '12px';
        label.style.transform = 'rotate(-45deg)';
        label.style.transformOrigin = 'left top';
        label.style.whiteSpace = 'nowrap';
        
        const value = document.createElement('div');
        value.textContent = algorithmResults[alg].totalSeekDistance;
        value.style.marginTop = '5px';
        value.style.fontSize = '10px';
        
        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        barContainer.appendChild(value);
        chartBars.appendChild(barContainer);
    });
    
    chartContainer.appendChild(chartBars);
}

// Helper function to get a color for each algorithm
function getAlgorithmColor(algorithm, index) {
    const colors = [
        '#3498db', // Blue
        '#2ecc71', // Green
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#9b59b6', // Purple
        '#1abc9c', // Teal
        '#34495e', // Dark Blue
        '#d35400'  // Dark Orange
    ];
    
    // Map algorithms to specific colors, or use index-based color
    const algorithmColors = {
        'fcfs': colors[0],
        'sstf': colors[1],
        'scan': colors[2],
        'look': colors[3],
        'cscan': colors[4],
        'clook': colors[5],
        'nstep': colors[6],
        'fscan': colors[7]
    };
    
    return algorithmColors[algorithm] || colors[index % colors.length];
}


// These code snippets should be added to script.js to improve visualization and fix any issues

// 1. Improved visualization for close points (replace or enhance the createRequestPoint function)
function createRequestPoint(position, id, diskSize) {
    const point = document.createElement('div');
    point.className = 'request-point';
    if (id === 'initial-head') {
        point.classList.add('initial-head');
    }
    point.id = id;
    
    // Position horizontally based on cylinder position
    point.style.left = `${(position / diskSize) * 100}%`;
    
    // Better vertical distribution to avoid overlap
    // For initial head, place it at a fixed position
    let verticalPosition;
    if (id === 'initial-head') {
        verticalPosition = 20; // Fixed position for head start point
    } else {
        // Distribute request points in a vertical pattern to prevent overlap
        // This helps distinguish close points by giving them different heights
        const index = parseInt(id.split('-')[1]);
        verticalPosition = 50 + ((index % 5) * 30); // Distribute in rows of 5
    }
    
    point.style.top = `${verticalPosition}px`;
    
    // Create label with clearer positioning
    const label = document.createElement('div');
    label.className = 'request-label';
    label.textContent = position;
    
    // Position label based on point type
    if (id === 'initial-head') {
        label.style.top = '-20px';
    } else {
        // Alternate label positions above/below to prevent overlap
        label.style.top = (index % 2 === 0) ? '20px' : '-20px';
    }
    
    // Add hover effect to make each point's value more visible
    point.title = `Position: ${position}`;
    
    point.appendChild(label);
    diskRequests.appendChild(point);
}

// 2. Fix for C-LOOK algorithm (correct implementation)
function clookAlgorithm(headPosition, requestQueue, direction) {
    const sequence = [headPosition];
    const executionSteps = [];
    let totalSeekDistance = 0;
    let currentPosition = headPosition;
    
    // Create a copy of the request queue and sort it
    const requests = [...requestQueue].sort((a, b) => a - b);
    
    // Split requests into those greater than and less than the head position
    const greaterRequests = requests.filter(pos => pos > headPosition);
    const lesserRequests = requests.filter(pos => pos < headPosition);
    
    // Determine sequence based on direction
    let lookSequence;
    if (direction === 'right') {
        // Go right to the last request, then jump to the first request
        lookSequence = [...greaterRequests];
        if (lesserRequests.length > 0) {
            executionSteps.push(`C-LOOK: Moving right to the last request (${Math.max(...greaterRequests)}), then returning to first request (${Math.min(...lesserRequests)})`);
            lookSequence = lookSequence.concat(lesserRequests);
        } else {
            executionSteps.push(`C-LOOK: Moving right through all requests (no need to return)`);
        }
    } else {
        // Go left to the first request, then jump to the last request
        lookSequence = [...lesserRequests.reverse()];
        if (greaterRequests.length > 0) {
            executionSteps.push(`C-LOOK: Moving left to the first request (${Math.min(...lesserRequests)}), then returning to last request (${Math.max(...greaterRequests)})`);
            lookSequence = lookSequence.concat(greaterRequests.reverse());
        } else {
            executionSteps.push(`C-LOOK: Moving left through all requests (no need to return)`);
        }
    }
    
    // Process the sequence
    for (let i = 0; i < lookSequence.length; i++) {
        const position = lookSequence[i];
        let distance;
        
        // Handle the jump specially
        if ((direction === 'right' && i > 0 && lesserRequests.length > 0 && 
             position === Math.min(...lesserRequests) && 
             lookSequence[i-1] === Math.max(...greaterRequests)) || 
            (direction === 'left' && i > 0 && greaterRequests.length > 0 && 
             position === Math.max(...greaterRequests) && 
             lookSequence[i-1] === Math.min(...lesserRequests))) {
            // For C-LOOK, the return seek is not counted in the total distance
            distance = 0;
            executionSteps.push(`Returning to ${position} (rapid return, no seek time)`);
        } else {
            distance = Math.abs(position - currentPosition);
            executionSteps.push(`Moving from position ${currentPosition} to ${position} (distance: ${distance})`);
        }
        
        totalSeekDistance += distance;
        sequence.push(position);
        currentPosition = position;
    }
    
    return [sequence, executionSteps, totalSeekDistance];
}

// 3. Improved disk track visualization with more markers for larger disk sizes
function setupDiskTrack(diskSize) {
    cylinderMarkers.innerHTML = '';
    
    // Create cylinder markers - dynamically increase for larger disk sizes
    const markerCount = diskSize > 500 ? 20 : (diskSize > 200 ? 15 : 10);
    
    for (let i = 0; i <= markerCount; i++) {
        const position = Math.floor(i * (diskSize / markerCount));
        const marker = document.createElement('div');
        marker.className = 'cylinder-marker';
        
        const label = document.createElement('div');
        label.className = 'cylinder-marker-label';
        label.textContent = position;
        
        marker.style.left = `${(position / diskSize) * 100}%`;
        label.style.left = `${(position / diskSize) * 100}%`;
        
        cylinderMarkers.appendChild(marker);
        cylinderMarkers.appendChild(label);
    }
}

// 4. Add tooltips to request points for better visibility of close points
document.addEventListener('DOMContentLoaded', function() {
    // Add existing event listeners
    
    // Add CSS for tooltips
    const style = document.createElement('style');
    style.textContent = `
        .request-point {
            cursor: pointer;
            z-index: 2;
        }
        .request-point:hover {
            z-index: 10;
            transform: translateX(-50%) scale(1.5);
        }
        .request-point:hover .request-label {
            font-weight: bold;
            background-color: rgba(255, 255, 255, 0.9);
            padding: 2px 5px;
            border-radius: 3px;
            z-index: 11;
        }
        .request-label {
            pointer-events: none;
        }
        
        /* Add this to make the seek lines visible */
        .seek-line {
            position: absolute;
            height: 2px;
            background-color: rgba(231, 76, 60, 0.5);
            z-index: 1;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
});

// 5. Draw seek lines to better visualize the movement between points
function animateSequence(sequence, executionSteps, initialHeadPosition) {
    const diskSize = parseInt(diskSizeInput.value);
    const diskHead = document.querySelector('.disk-head');
    const diskTrack = document.querySelector('.disk-track');
    
    // Clear any existing seek lines
    document.querySelectorAll('.seek-line').forEach(line => line.remove());
    
    // Set initial head position
    const initialLeftPos = (initialHeadPosition / diskSize) * 100;
    diskHead.style.left = `${initialLeftPos}%`;
    
    // Animate each step
    let currentStep = 0;
    
    function animateStep() {
        if (currentStep < sequence.length) {
            const position = sequence[currentStep];
            const stepDescription = executionSteps[currentStep];
            const leftPos = (position / diskSize) * 100;
            
            // Draw seek line from current position to next position
            if (currentStep > 0) {
                const prevPosition = sequence[currentStep - 1];
                const prevLeftPos = (prevPosition / diskSize) * 100;
                
                // Only draw line if it's a real seek (not a jump in C-SCAN/C-LOOK)
                if (!stepDescription.includes("rapid return")) {
                    const seekLine = document.createElement('div');
                    seekLine.className = 'seek-line';
                    
                    // Calculate start and end positions
                    const startPos = Math.min(prevLeftPos, leftPos);
                    const endPos = Math.max(prevLeftPos, leftPos);
                    const width = endPos - startPos;
                    
                    seekLine.style.left = `${startPos}%`;
                    seekLine.style.width = `${width}%`;
                    seekLine.style.top = '50px'; // Center of track
                    
                    diskTrack.appendChild(seekLine);
                }
            }
            
            // Animate disk head
            diskHead.style.left = `${leftPos}%`;
            
            // Highlight current request
            const requestPoints = document.querySelectorAll('.request-point');
            requestPoints.forEach(point => {
                point.classList.remove('active');
                const pointLabel = point.querySelector('.request-label');
                if (pointLabel) {
                    const pointPosition = parseInt(pointLabel.textContent);
                    if (pointPosition === position && point.id !== 'initial-head') {
                        point.classList.add('active');
                        point.classList.add('seek-animation');
                        setTimeout(() => {
                            point.classList.remove('seek-animation');
                            point.classList.add('processed');
                        }, animationSpeed / 2);
                    }
                }
            });
            
            // Add step to steps container
            const stepElement = document.createElement('div');
            stepElement.className = 'step';
            
            const stepNumber = document.createElement('div');
            stepNumber.className = 'step-number';
            stepNumber.textContent = currentStep + 1;
            
            const stepDesc = document.createElement('div');
            stepDesc.className = 'step-description';
            stepDesc.textContent = stepDescription;
            
            stepElement.appendChild(stepNumber);
            stepElement.appendChild(stepDesc);
            algorithmStepsContainer.appendChild(stepElement);
            
            // Scroll to show the latest step
            algorithmStepsContainer.scrollTop = algorithmStepsContainer.scrollHeight;
            
            currentStep++;
            setTimeout(animateStep, animationSpeed);
        } else {
            isRunning = false;
        }
    }
    
    animateStep();
}

// 6. Add CSS styles for better visualization of request points
document.addEventListener('DOMContentLoaded', function() {
    // Add this style to help with visualization of close points
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        /* Better styles for request points */
        .request-point {
            position: absolute;
            width: 12px;
            height: 12px;
            background-color: #2980b9;
            border-radius: 50%;
            transform: translateX(-50%);
            transition: transform 0.2s ease;
            border: 2px solid white;
            box-shadow: 0 0 3px rgba(0,0,0,0.3);
        }
        
        .request-point.initial-head {
            background-color: #e67e22;
            width: 14px;
            height: 14px;
        }
        
        .request-label {
            background-color: rgba(255,255,255,0.7);
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 11px;
            white-space: nowrap;
        }
        
        /* Highlight visited cylinders */
        .cylinder-highlight {
            position: absolute;
            height: 100%;
            width: 1px;
            background-color: rgba(46, 204, 113, 0.5);
            z-index: 1;
        }
        
        /* Improve step display */
        .step {
            display: flex;
            margin-bottom: 5px;
            padding: 5px;
            border-bottom: 1px solid #eee;
        }
        
        .step-number {
            font-weight: bold;
            margin-right: 10px;
            color: #3498db;
        }
    `;
    document.head.appendChild(additionalStyles);
});

// 7. Fix reset animation to properly clear all visualization elements
function resetSimulation() {
    isRunning = false;
    
    // Clear all visualization elements
    cylinderMarkers.innerHTML = '';
    diskRequests.innerHTML = '';
    algorithmStepsContainer.innerHTML = '';
    
    // Remove any seek lines
    document.querySelectorAll('.seek-line').forEach(line => line.remove());
    document.querySelectorAll('.cylinder-highlight').forEach(highlight => highlight.remove());
    
    // Reset disk head
    const diskHead = document.querySelector('.disk-head');
    if (diskHead) {
        diskHead.style.left = '0px';
    } else {
        const newDiskHead = document.createElement('div');
        newDiskHead.className = 'disk-head';
        diskTrack.appendChild(newDiskHead);
    }
    
    // Reset statistics
    totalDistanceElement.textContent = '0';
    avgDistanceElement.textContent = '0';
}

// 8. Add a speed control slider for the animation
function addSpeedControl() {
    const inputSection = document.querySelector('.input-section');
    const runButton = document.getElementById('run-algorithm');
    
    // Create speed control
    const speedControlDiv = document.createElement('div');
    speedControlDiv.className = 'form-group';
    
    const speedLabel = document.createElement('label');
    speedLabel.setAttribute('for', 'animation-speed');
    speedLabel.textContent = 'Animation Speed:';
    
    const speedSlider = document.createElement('input');
    speedSlider.setAttribute('type', 'range');
    speedSlider.setAttribute('id', 'animation-speed');
    speedSlider.setAttribute('min', '100');
    speedSlider.setAttribute('max', '2000');
    speedSlider.setAttribute('value', '1000');
    speedSlider.style.width = '100%';
    
    const speedValue = document.createElement('span');
    speedValue.setAttribute('id', 'speed-value');
    speedValue.textContent = 'Normal';
    speedValue.style.marginLeft = '10px';
    
    speedSlider.addEventListener('input', function() {
        animationSpeed = parseInt(this.value);
        
        if (animationSpeed <= 300) {
            speedValue.textContent = 'Fast';
        } else if (animationSpeed <= 800) {
            speedValue.textContent = 'Medium';
        } else if (animationSpeed <= 1500) {
            speedValue.textContent = 'Normal';
        } else {
            speedValue.textContent = 'Slow';
        }
    });
    
    speedControlDiv.appendChild(speedLabel);
    speedControlDiv.appendChild(speedSlider);
    speedControlDiv.appendChild(speedValue);
    
    // Insert before the run button
    inputSection.insertBefore(speedControlDiv, runButton);
}

// Initialize the speed control when the document loads
document.addEventListener('DOMContentLoaded', function() {
    addSpeedControl();
});