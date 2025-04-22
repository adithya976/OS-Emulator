document.addEventListener('DOMContentLoaded', init);

function init() {
    const algorithmSelect = document.getElementById('algorithm');
    const processorsInput = document.getElementById('processors');
    const weightsInput = document.getElementById('processor-weights');
    const taskListInput = document.getElementById('task-list');
    const randomTasksBtn = document.getElementById('random-tasks');
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
    randomTasksBtn.addEventListener('click', generateRandomTasks);
    runSimulationBtn.addEventListener('click', runSimulation);
    stepSimulationBtn.addEventListener('click', stepSimulation);
    resetSimulationBtn.addEventListener('click', resetSimulation);
    
    function generateRandomTasks() {
        const length = Math.floor(Math.random() * 15) + 10; // 10-24 tasks
        let tasks = [];
        
        for (let i = 0; i < length; i++) {
            tasks.push(Math.floor(Math.random() * 10) + 1); // 1-10 time units
        }
        
        taskListInput.value = tasks.join(',');
    }
    
    function runSimulation() {
        resetSimulation();
        const tasks = taskListInput.value.split(',').map(Number);
        const processors = parseInt(processorsInput.value);
        const algorithm = algorithmSelect.value;
        
        let weights = [];
        if (weightsInput.value.trim() !== '') {
            weights = weightsInput.value.split(',').map(Number);
            if (weights.length !== processors) {
                alert('Number of weights must match number of processors');
                return;
            }
        } else {
            weights = Array(processors).fill(1); // Default equal weights
        }
        
        if (tasks.some(isNaN)) {
            alert('Please enter a valid task list (comma-separated numbers)');
            return;
        }
        
        if (isNaN(processors)) {
            alert('Please enter a valid number of processors');
            return;
        }
        
        // Run the selected algorithm
        switch (algorithm) {
            case 'round-robin':
                simulationData = roundRobinAlgorithm(tasks, processors, weights);
                break;
            case 'least-connections':
                simulationData = leastConnectionsAlgorithm(tasks, processors, weights);
                break;
            case 'weighted-rr':
                simulationData = weightedRoundRobinAlgorithm(tasks, processors, weights);
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
        
        // Display the processor table
        let tableHtml = `<table class="processor-table">
            <thead>
                <tr>
                    <th>Processor</th>
                    <th>Weight</th>
                    <th>Current Load</th>
                    <th>Assigned Tasks</th>
                    <th>Total Time</th>
                </tr>
            </thead>
            <tbody>`;
        
        // Add rows for each processor
        for (let i = 0; i < simulationData.processors; i++) {
            const processor = step.processors[i];
            const currentTask = processor.tasks.find(t => t.status === 'processing');
            
            tableHtml += `<tr>
                <td>Processor ${i+1}</td>
                <td>${processor.weight}</td>
                <td>${currentTask ? currentTask.duration : 'Idle'}</td>
                <td>`;
            
            // Show assigned tasks with status
            processor.tasks.forEach(task => {
                tableHtml += `<span class="${task.status === 'completed' ? 'completed-task' : 
                                      task.status === 'processing' ? 'current-task' : 
                                      'waiting-task'}">${task.duration}</span> `;
            });
            
            tableHtml += `</td>
                <td>${processor.totalTime}</td>
            </tr>`;
        }
        
        tableHtml += `</tbody></table>`;
        visualizationContainer.innerHTML = tableHtml;
        
        // Display Gantt chart
        let ganttHtml = `<div class="gantt-chart">
            <h4>Task Execution Timeline</h4>`;
        
        // Find maximum time for scaling
        const maxTime = Math.max(...step.processors.map(p => p.totalTime), 10);
        
        // Add rows for each processor
        for (let i = 0; i < simulationData.processors; i++) {
            const processor = step.processors[i];
            ganttHtml += `<div class="gantt-row">
                <div class="gantt-label">Processor ${i+1}</div>
                <div class="gantt-bar-container">`;
            
            let lastEnd = 0;
            processor.tasks.forEach(task => {
                if (task.status === 'completed' || task.status === 'processing') {
                    const startPercent = (lastEnd / maxTime) * 100;
                    const widthPercent = (task.duration / maxTime) * 100;
                    
                    ganttHtml += `<div class="gantt-bar" 
                        style="left: ${startPercent}%; width: ${widthPercent}%;"
                        title="Task: ${task.duration} units"></div>`;
                    
                    lastEnd += task.duration;
                }
            });
            
            // Add idle time if any
            if (lastEnd < maxTime) {
                const idlePercent = ((maxTime - lastEnd) / maxTime) * 100;
                ganttHtml += `<div class="gantt-bar gantt-bar-idle" 
                    style="left: ${lastEnd / maxTime * 100}%; width: ${idlePercent}%;"
                    title="Idle time"></div>`;
            }
            
            ganttHtml += `</div></div>`;
        }
        
        // Add time marks
        ganttHtml += `<div class="gantt-time-marks">
            <span>0</span>
            <span>${Math.floor(maxTime/2)}</span>
            <span>${maxTime}</span>
        </div>`;
        
        ganttHtml += `</div>`;
        visualizationContainer.innerHTML += ganttHtml;
        
        // Display statistics
        let totalTasks = 0;
        let completedTasks = 0;
        let processingTasks = 0;
        let waitingTasks = 0;
        let totalTime = 0;
        
        step.processors.forEach(processor => {
            totalTasks += processor.tasks.length;
            processor.tasks.forEach(task => {
                if (task.status === 'completed') completedTasks++;
                else if (task.status === 'processing') processingTasks++;
                else waitingTasks++;
            });
            totalTime += processor.totalTime;
        });
        
        const avgLoad = step.processors.reduce((sum, p) => sum + p.totalTime, 0) / 
                       step.processors.length;
        const maxLoad = Math.max(...step.processors.map(p => p.totalTime));
        const minLoad = Math.min(...step.processors.map(p => p.totalTime));
        const loadImbalance = maxLoad - minLoad;
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Completed Tasks</div>
                    <div class="stat-value">${completedTasks}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Processing Tasks</div>
                    <div class="stat-value">${processingTasks}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Waiting Tasks</div>
                    <div class="stat-value">${waitingTasks}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Average Load</div>
                    <div class="stat-value">${avgLoad.toFixed(1)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Max Load</div>
                    <div class="stat-value">${maxLoad}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Load Imbalance</div>
                    <div class="stat-value">${loadImbalance}</div>
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
        if (step.action) {
            actionText = step.action;
        } else if (stepIndex === 0) {
            actionText = 'Simulation initialized';
        } else {
            actionText = 'Continuing task processing';
        }
        
        detailItem.innerHTML = `
            <div class="detail-step">Time Unit ${stepIndex}</div>
            <div class="detail-action">${actionText}</div>
        `;
        
        detailsContainer.appendChild(detailItem);
        detailsContainer.scrollTop = detailsContainer.scrollHeight;
    }
    
    // Round Robin Algorithm Implementation
    function roundRobinAlgorithm(tasks, processors, weights) {
        const steps = [];
        const processorStates = Array(processors).fill().map((_, i) => ({
            weight: weights[i],
            tasks: [],
            totalTime: 0,
            currentTask: null
        }));
        
        let nextProcessor = 0;
        let time = 0;
        
        while (true) {
            const step = {
                time,
                processors: JSON.parse(JSON.stringify(processorStates)),
                action: ''
            };
            
            // Assign new tasks using round robin
            if (time === 0) {
                // Initial assignment
                for (let i = 0; i < tasks.length; i++) {
                    const processorIndex = i % processors;
                    processorStates[processorIndex].tasks.push({
                        duration: tasks[i],
                        status: 'waiting',
                        assignedTime: time
                    });
                    step.action = `Assigned task ${tasks[i]} to Processor ${processorIndex + 1}`;
                }
            }
            
            // Process current tasks
            let allIdle = true;
            for (let i = 0; i < processorStates.length; i++) {
                const processor = processorStates[i];
                
                // Find current task (either processing or next waiting)
                if (!processor.currentTask || processor.currentTask.status === 'completed') {
                    // Find next waiting task
                    const waitingIndex = processor.tasks.findIndex(t => t.status === 'waiting');
                    if (waitingIndex >= 0) {
                        processor.currentTask = processor.tasks[waitingIndex];
                        processor.currentTask.status = 'processing';
                        processor.currentTask.startTime = time;
                        step.action += step.action ? '<br>' : '';
                        step.action += `Processor ${i + 1} started task ${processor.currentTask.duration}`;
                    }
                }
                
                // Process current task
                if (processor.currentTask && processor.currentTask.status === 'processing') {
                    allIdle = false;
                    processor.currentTask.duration--;
                    processor.totalTime++;
                    
                    if (processor.currentTask.duration <= 0) {
                        processor.currentTask.status = 'completed';
                        processor.currentTask.endTime = time + 1;
                        step.action += step.action ? '<br>' : '';
                        step.action += `Processor ${i + 1} completed task`;
                    }
                }
            }
            
            steps.push(step);
            time++;
            
            // Check if all tasks are completed
            const allCompleted = processorStates.every(p => 
                p.tasks.every(t => t.status === 'completed'));
            if (allCompleted || allIdle) break;
        }
        
        return {
            algorithm: 'Round Robin',
            processors,
            steps,
            totalTime: time - 1
        };
    }
    
    // Least Connections Algorithm Implementation
    function leastConnectionsAlgorithm(tasks, processors, weights) {
        const steps = [];
        const processorStates = Array(processors).fill().map((_, i) => ({
            weight: weights[i],
            tasks: [],
            totalTime: 0,
            currentTask: null
        }));
        
        let time = 0;
        
        while (true) {
            const step = {
                time,
                processors: JSON.parse(JSON.stringify(processorStates)),
                action: ''
            };
            
            // Assign new tasks to least loaded processors
            if (time === 0) {
                // Initial assignment - assign to processor with least tasks
                for (let i = 0; i < tasks.length; i++) {
                    // Find processor with least tasks
                    let minTasks = Infinity;
                    let selectedProcessor = 0;
                    
                    for (let j = 0; j < processorStates.length; j++) {
                        const taskCount = processorStates[j].tasks.filter(t => 
                            t.status !== 'completed').length;
                        if (taskCount < minTasks) {
                            minTasks = taskCount;
                            selectedProcessor = j;
                        }
                    }
                    
                    processorStates[selectedProcessor].tasks.push({
                        duration: tasks[i],
                        status: 'waiting',
                        assignedTime: time
                    });
                    step.action = `Assigned task ${tasks[i]} to Processor ${selectedProcessor + 1} (least loaded)`;
                }
            }
            
            // Process current tasks
            let allIdle = true;
            for (let i = 0; i < processorStates.length; i++) {
                const processor = processorStates[i];
                
                // Find current task (either processing or next waiting)
                if (!processor.currentTask || processor.currentTask.status === 'completed') {
                    // Find next waiting task
                    const waitingIndex = processor.tasks.findIndex(t => t.status === 'waiting');
                    if (waitingIndex >= 0) {
                        processor.currentTask = processor.tasks[waitingIndex];
                        processor.currentTask.status = 'processing';
                        processor.currentTask.startTime = time;
                        step.action += step.action ? '<br>' : '';
                        step.action += `Processor ${i + 1} started task ${processor.currentTask.duration}`;
                    }
                }
                
                // Process current task
                if (processor.currentTask && processor.currentTask.status === 'processing') {
                    allIdle = false;
                    processor.currentTask.duration--;
                    processor.totalTime++;
                    
                    if (processor.currentTask.duration <= 0) {
                        processor.currentTask.status = 'completed';
                        processor.currentTask.endTime = time + 1;
                        step.action += step.action ? '<br>' : '';
                        step.action += `Processor ${i + 1} completed task`;
                    }
                }
            }
            
            steps.push(step);
            time++;
            
            // Check if all tasks are completed
            const allCompleted = processorStates.every(p => 
                p.tasks.every(t => t.status === 'completed'));
            if (allCompleted || allIdle) break;
        }
        
        return {
            algorithm: 'Least Connections',
            processors,
            steps,
            totalTime: time - 1
        };
    }
    
    // Weighted Round Robin Algorithm Implementation
    function weightedRoundRobinAlgorithm(tasks, processors, weights) {
        const steps = [];
        const processorStates = Array(processors).fill().map((_, i) => ({
            weight: weights[i],
            tasks: [],
            totalTime: 0,
            currentTask: null
        }));
        
        let assignments = Array(processors).fill(0);
        let time = 0;
        
        while (true) {
            const step = {
                time,
                processors: JSON.parse(JSON.stringify(processorStates)),
                action: ''
            };
            
            // Assign new tasks using weighted round robin
            if (time === 0) {
                // Calculate total weight
                const totalWeight = weights.reduce((sum, w) => sum + w, 0);
                
                // Assign tasks proportionally to weights
                for (let i = 0; i < tasks.length; i++) {
                    // Find next processor using weighted round robin
                    let selectedProcessor = 0;
                    let minRatio = Infinity;
                    
                    for (let j = 0; j < processorStates.length; j++) {
                        const ratio = assignments[j] / weights[j];
                        if (ratio < minRatio) {
                            minRatio = ratio;
                            selectedProcessor = j;
                        }
                    }
                    
                    processorStates[selectedProcessor].tasks.push({
                        duration: tasks[i],
                        status: 'waiting',
                        assignedTime: time
                    });
                    assignments[selectedProcessor]++;
                    step.action = `Assigned task ${tasks[i]} to Processor ${selectedProcessor + 1} (weight ${weights[selectedProcessor]})`;
                }
            }
            
            // Process current tasks
            let allIdle = true;
            for (let i = 0; i < processorStates.length; i++) {
                const processor = processorStates[i];
                
                // Find current task (either processing or next waiting)
                if (!processor.currentTask || processor.currentTask.status === 'completed') {
                    // Find next waiting task
                    const waitingIndex = processor.tasks.findIndex(t => t.status === 'waiting');
                    if (waitingIndex >= 0) {
                        processor.currentTask = processor.tasks[waitingIndex];
                        processor.currentTask.status = 'processing';
                        processor.currentTask.startTime = time;
                        step.action += step.action ? '<br>' : '';
                        step.action += `Processor ${i + 1} started task ${processor.currentTask.duration}`;
                    }
                }
                
                // Process current task
                if (processor.currentTask && processor.currentTask.status === 'processing') {
                    allIdle = false;
                    processor.currentTask.duration--;
                    processor.totalTime++;
                    
                    if (processor.currentTask.duration <= 0) {
                        processor.currentTask.status = 'completed';
                        processor.currentTask.endTime = time + 1;
                        step.action += step.action ? '<br>' : '';
                        step.action += `Processor ${i + 1} completed task`;
                    }
                }
            }
            
            steps.push(step);
            time++;
            
            // Check if all tasks are completed
            const allCompleted = processorStates.every(p => 
                p.tasks.every(t => t.status === 'completed'));
            if (allCompleted || allIdle) break;
        }
        
        return {
            algorithm: 'Weighted Round Robin',
            processors,
            steps,
            totalTime: time - 1
        };
    }
}
