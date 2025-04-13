document.addEventListener('DOMContentLoaded', function() {
    const initialSetupForm = document.getElementById('initial-setup-form');
    const startSimulationBtn = document.getElementById('start-simulation');
    const ipcTypeSelect = document.getElementById('ipc-type');
    
    const simulationContainers = {
      pipe_full: document.getElementById('pipe-full-container'),
      pipe_half: document.getElementById('pipe-half-container'),
      shm_full: document.getElementById('shm-full-container'),
      shm_half: document.getElementById('shm-half-container'),
      mq_full: document.getElementById('mq-full-container'),
      mq_half: document.getElementById('mq-half-container')
    };
    
    let activeSimulation = null;
    
    startSimulationBtn.addEventListener('click', function() {
      const selectedSimulation = ipcTypeSelect.value;
      startSimulation(selectedSimulation);
    });
    
    function startSimulation(simulationType) {
      initialSetupForm.style.display = 'none';
      
      simulationContainers[simulationType].style.display = 'block';
      
      activeSimulation = simulationType;
      
      switch(simulationType) {
        case 'pipe_full':
          initPipeFullDuplex();
          break;
        case 'pipe_half':
          initPipeHalfDuplex();
          break;
        case 'shm_full':
          initSharedMemoryFullDuplex();
          break;
        case 'shm_half':
          initSharedMemoryHalfDuplex();
          break;
        case 'mq_full':
          initMessageQueueFullDuplex();
          break;
        case 'mq_half':
          initMessageQueueHalfDuplex();
          break;
      }
    }
    
    function returnToMenu() {
      Object.values(simulationContainers).forEach(container => {
        container.style.display = 'none';
      });
      
      activeSimulation = null;
      
      initialSetupForm.style.display = 'block';
    }
  
    function createMessageElement(text, isParent) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isParent ? 'message-parent' : 'message-child'}`;
      
      const timestamp = document.createElement('span');
      timestamp.className = 'message-time';
      timestamp.textContent = new Date().toLocaleTimeString();
      
      const messageText = document.createElement('span');
      messageText.className = 'message-text';
      messageText.textContent = text;
      
      messageDiv.appendChild(timestamp);
      messageDiv.appendChild(messageText);
      
      return messageDiv;
    }
  
    function displayStatusMessage(containerId, message, type) {
      const resultArea = document.getElementById(`${containerId}-result-area`);
      
      const statusDiv = document.createElement('div');
      statusDiv.className = `message-result ${type}`;
      statusDiv.textContent = message;
      
      resultArea.innerHTML = '';
      resultArea.appendChild(statusDiv);
      
      setTimeout(() => {
        resultArea.innerHTML = '';
      }, 3000);
    }
  
    /*
     * Full Duplex Pipe Communication Implementation
     */
    function initPipeFullDuplex() {
      const parentInput = document.getElementById('parent-input-full');
      const childInput = document.getElementById('child-input-full');
      const parentSendBtn = document.getElementById('parent-send-full');
      const childSendBtn = document.getElementById('child-send-full');
      const parentReceived = document.getElementById('parent-received-full');
      const childReceived = document.getElementById('child-received-full');
      const resetBtn = document.getElementById('reset-pipe-full');
      const backToMenuBtn = document.getElementById('back-to-menu-pipe-full');
      const showInfoBtn = document.getElementById('show-info-pipe-full');
      
      const parentToChildPipe = document.querySelector('.pipe-parent-to-child');
      const childToParentPipe = document.querySelector('.pipe-child-to-parent');
      const parentToChildBubble = parentToChildPipe.querySelector('.message-bubble');
      const childToParentBubble = childToParentPipe.querySelector('.message-bubble');
  
      parentSendBtn.addEventListener('click', function() {
        const message = parentInput.value.trim();
        
        if (!message) {
          displayStatusMessage('pipe-full', 'Please enter a message to send', 'error');
          return;
        }
        
        parentToChildBubble.classList.remove('hidden');
        parentToChildBubble.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          childReceived.appendChild(createMessageElement(message, true));
          childReceived.scrollTop = childReceived.scrollHeight;
          
          parentToChildBubble.classList.add('hidden');
          parentToChildBubble.style.transform = '';
          
          parentInput.value = '';
          
          displayStatusMessage('pipe-full', 'Message sent successfully from Parent to Child', 'success');
        }, 1000);
      });
  
      childSendBtn.addEventListener('click', function() {
        const message = childInput.value.trim();
        
        if (!message) {
          displayStatusMessage('pipe-full', 'Please enter a message to send', 'error');
          return;
        }
        
        childToParentBubble.classList.remove('hidden');
        childToParentBubble.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
          parentReceived.appendChild(createMessageElement(message, false));
          parentReceived.scrollTop = parentReceived.scrollHeight;
          
          childToParentBubble.classList.add('hidden');
          childToParentBubble.style.transform = '';
          
          childInput.value = '';
          
          displayStatusMessage('pipe-full', 'Message sent successfully from Child to Parent', 'success');
        }, 1000);
      });
  
      resetBtn.addEventListener('click', function() {
        parentInput.value = '';
        childInput.value = '';
        parentReceived.innerHTML = '';
        childReceived.innerHTML = '';
        
        parentToChildBubble.classList.add('hidden');
        childToParentBubble.classList.add('hidden');
        parentToChildBubble.style.transform = '';
        childToParentBubble.style.transform = '';
        
        displayStatusMessage('pipe-full', 'Simulation reset', 'info');
      });
  
      backToMenuBtn.addEventListener('click', returnToMenu);
  
      let infoVisible = true;
      const ipcDescription = document.querySelector('#pipe-full-container .ipc-description');
      
      showInfoBtn.addEventListener('click', function() {
        if (infoVisible) {
          ipcDescription.style.display = 'none';
          infoVisible = false;
        } else {
          ipcDescription.style.display = 'block';
          infoVisible = true;
        }
      });
    }
  
    /*
     * Half Duplex Pipe Communication Implementation
     */
    function initPipeHalfDuplex() {
      const parentInput = document.getElementById('parent-input-half');
      const childInput = document.getElementById('child-input-half');
      const parentSendBtn = document.getElementById('parent-send-half');
      const childSendBtn = document.getElementById('child-send-half');
      const parentReceived = document.getElementById('parent-received-half');
      const childReceived = document.getElementById('child-received-half');
      const resetBtn = document.getElementById('reset-pipe-half');
      const backToMenuBtn = document.getElementById('back-to-menu-pipe-half');
      const showInfoBtn = document.getElementById('show-info-pipe-half');
      const directionStatus = document.getElementById('direction-status');
      
      const halfDuplexPipe = document.querySelector('.pipe-half-duplex');
      const halfDuplexBubble = halfDuplexPipe.querySelector('.message-bubble');
      
      let isTransmitting = false;
  
      function updateDirectionIndicator() {
        switch(communicationDirection) {
          case 'none':
            directionStatus.textContent = 'None';
            directionStatus.className = '';
            break;
          case 'parent-to-child':
            directionStatus.textContent = 'Parent → Child';
            directionStatus.className = 'parent-turn';
            break;
          case 'child-to-parent':
            directionStatus.textContent = 'Child → Parent';
            directionStatus.className = 'child-turn';
            break;
        }
      }
  
      parentSendBtn.addEventListener('click', function() {
        const message = parentInput.value.trim();
        
        if (!message) {
          displayStatusMessage('pipe-half', 'Please enter a message to send', 'error');
          return;
        }
        
        if (isTransmitting) {
          displayStatusMessage('pipe-half', 'Communication channel is busy', 'error');
          return;
        }
        
        communicationDirection = 'parent-to-child';
        isTransmitting = true;
        updateDirectionIndicator();
        
        halfDuplexBubble.classList.remove('child-to-parent-half');
        halfDuplexBubble.classList.add('parent-to-child-half');
        halfDuplexBubble.classList.remove('hidden');
        halfDuplexBubble.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          childReceived.appendChild(createMessageElement(message, true));
          childReceived.scrollTop = childReceived.scrollHeight;
          
          halfDuplexBubble.classList.add('hidden');
          halfDuplexBubble.style.transform = '';
          
          parentInput.value = '';
          
          isTransmitting = false;
          
          displayStatusMessage('pipe-half', 'Message sent successfully from Parent to Child', 'success');
        }, 1000);
      });
  
      childSendBtn.addEventListener('click', function() {
        const message = childInput.value.trim();
        
        if (!message) {
          displayStatusMessage('pipe-half', 'Please enter a message to send', 'error');
          return;
        }
        
        if (isTransmitting) {
          displayStatusMessage('pipe-half', 'Communication channel is busy', 'error');
          return;
        }
        
        communicationDirection = 'child-to-parent';
        isTransmitting = true;
        updateDirectionIndicator();
        
        halfDuplexBubble.classList.remove('parent-to-child-half');
        halfDuplexBubble.classList.add('child-to-parent-half');
        halfDuplexBubble.classList.remove('hidden');
        halfDuplexBubble.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
          parentReceived.appendChild(createMessageElement(message, false));
          parentReceived.scrollTop = parentReceived.scrollHeight;
          
          halfDuplexBubble.classList.add('hidden');
          halfDuplexBubble.style.transform = '';
          
          childInput.value = '';
          
          isTransmitting = false;
          
          displayStatusMessage('pipe-half', 'Message sent successfully from Child to Parent', 'success');
        }, 1000);
      });
  
      resetBtn.addEventListener('click', function() {
        parentInput.value = '';
        childInput.value = '';
        parentReceived.innerHTML = '';
        childReceived.innerHTML = '';
        
        communicationDirection = 'none';
        isTransmitting = false;
        updateDirectionIndicator();
        
        halfDuplexBubble.classList.add('hidden');
        halfDuplexBubble.style.transform = '';
        
        displayStatusMessage('pipe-half', 'Simulation reset', 'info');
      });
  
      backToMenuBtn.addEventListener('click', returnToMenu);
  
      let infoVisible = true;
      const ipcDescription = document.querySelector('#pipe-half-container .ipc-description');
      
      showInfoBtn.addEventListener('click', function() {
        if (infoVisible) {
          ipcDescription.style.display = 'none';
          infoVisible = false;
        } else {
          ipcDescription.style.display = 'block';
          infoVisible = true;
        }
      });
      
      updateDirectionIndicator();
    }
  
    /*
     * Full Duplex Shared Memory Implementation
     */
    function initSharedMemoryFullDuplex() {
      const parentInput = document.getElementById('parent-shm-input-full');
      const childInput = document.getElementById('child-shm-input-full');
      const parentSendBtn = document.getElementById('parent-shm-send-full');
      const childSendBtn = document.getElementById('child-shm-send-full');
      const parentReceived = document.getElementById('parent-shm-received-full');
      const childReceived = document.getElementById('child-shm-received-full');
      const parentMemoryContent = document.getElementById('parent-memory-content-full');
      const childMemoryContent = document.getElementById('child-memory-content-full');
      const resetBtn = document.getElementById('reset-shm-full');
      const backToMenuBtn = document.getElementById('back-to-menu-shm-full');
      const showInfoBtn = document.getElementById('show-info-shm-full');
  
      parentSendBtn.addEventListener('click', function() {
        const message = parentInput.value.trim();
        
        if (!message) {
          displayStatusMessage('shm-full', 'Please enter a message to send', 'error');
          return;
        }
        
        parentMemoryContent.textContent = message;
        parentMemoryContent.style.backgroundColor = 'rgba(0, 123, 255, 0.2)';
        
        setTimeout(() => {
          childReceived.appendChild(createMessageElement(message, true));
          childReceived.scrollTop = childReceived.scrollHeight;
          
          parentMemoryContent.style.backgroundColor = '';
          
          parentInput.value = '';
          
          displayStatusMessage('shm-full', 'Data written to shared memory by Parent and read by Child', 'success');
        }, 800);
      });
  
      childSendBtn.addEventListener('click', function() {
        const message = childInput.value.trim();
        
        if (!message) {
          displayStatusMessage('shm-full', 'Please enter a message to send', 'error');
          return;
        }
        
        childMemoryContent.textContent = message;
        childMemoryContent.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
        
        setTimeout(() => {
          parentReceived.appendChild(createMessageElement(message, false));
          parentReceived.scrollTop = parentReceived.scrollHeight;
          
          childMemoryContent.style.backgroundColor = '';
          
          childInput.value = '';
          
          displayStatusMessage('shm-full', 'Data written to shared memory by Child and read by Parent', 'success');
        }, 800);
      });
  
      resetBtn.addEventListener('click', function() {
        parentInput.value = '';
        childInput.value = '';
        parentReceived.innerHTML = '';
        childReceived.innerHTML = '';
        parentMemoryContent.textContent = '';
        childMemoryContent.textContent = '';
        parentMemoryContent.style.backgroundColor = '';
        childMemoryContent.style.backgroundColor = '';
        
        displayStatusMessage('shm-full', 'Simulation reset', 'info');
      });
  
      backToMenuBtn.addEventListener('click', returnToMenu);
  
      let infoVisible = true;
      const ipcDescription = document.querySelector('#shm-full-container .ipc-description');
      
      showInfoBtn.addEventListener('click', function() {
        if (infoVisible) {
          ipcDescription.style.display = 'none';
          infoVisible = false;
        } else {
          ipcDescription.style.display = 'block';
          infoVisible = true;
        }
      });
    }
  
    /*
     * Half Duplex Shared Memory Implementation
     */
    function initSharedMemoryHalfDuplex() {
      const parentInput = document.getElementById('parent-shm-input-half');
      const childInput = document.getElementById('child-shm-input-half');
      const parentSendBtn = document.getElementById('parent-shm-send-half');
      const childSendBtn = document.getElementById('child-shm-send-half');
      const parentReceived = document.getElementById('parent-shm-received-half');
      const childReceived = document.getElementById('child-shm-received-half');
      const sharedMemoryContent = document.getElementById('shared-memory-content-half');
      const memoryStatus = document.getElementById('memory-status');
      const resetBtn = document.getElementById('reset-shm-half');
      const backToMenuBtn = document.getElementById('back-to-menu-shm-half');
      const showInfoBtn = document.getElementById('show-info-shm-half');
      
      let memoryBusy = false;
  
      function updateMemoryStatus() {
        if (memoryBusy) {
          memoryStatus.textContent = `Writing by ${currentWriter === 'parent' ? 'Parent' : 'Child'}`;
          memoryStatus.classList.add('busy');
        } else if (currentWriter) {
          memoryStatus.textContent = `Ready for reading (last written by ${currentWriter === 'parent' ? 'Parent' : 'Child'})`;
          memoryStatus.classList.remove('busy');
        } else {
          memoryStatus.textContent = 'Available';
          memoryStatus.classList.remove('busy');
        }
      }
  
      parentSendBtn.addEventListener('click', function() {
        const message = parentInput.value.trim();
        
        if (!message) {
          displayStatusMessage('shm-half', 'Please enter a message to send', 'error');
          return;
        }
        
        if (memoryBusy) {
          displayStatusMessage('shm-half', 'Shared memory is currently busy', 'error');
          return;
        }
        
        memoryBusy = true;
        currentWriter = 'parent';
        updateMemoryStatus();
        
        sharedMemoryContent.textContent = message;
        sharedMemoryContent.style.backgroundColor = 'rgba(0, 123, 255, 0.2)';
        
        setTimeout(() => {
          memoryBusy = false;
          updateMemoryStatus();
          
          childReceived.appendChild(createMessageElement(message, true));
          childReceived.scrollTop = childReceived.scrollHeight;
          
          parentInput.value = '';
          
          displayStatusMessage('shm-half', 'Data written to shared memory by Parent and read by Child', 'success');
        }, 1000);
      });
  
      childSendBtn.addEventListener('click', function() {
        const message = childInput.value.trim();
        
        if (!message) {
          displayStatusMessage('shm-half', 'Please enter a message to send', 'error');
          return;
        }
        
        if (memoryBusy) {
          displayStatusMessage('shm-half', 'Shared memory is currently busy', 'error');
          return;
        }
        
        memoryBusy = true;
        currentWriter = 'child';
        updateMemoryStatus();
        
        sharedMemoryContent.textContent = message;
        sharedMemoryContent.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
        
        setTimeout(() => {
          memoryBusy = false;
          updateMemoryStatus();
          
          parentReceived.appendChild(createMessageElement(message, false));
          parentReceived.scrollTop = parentReceived.scrollHeight;
          
          childInput.value = '';
          
          displayStatusMessage('shm-half', 'Data written to shared memory by Child and read by Parent', 'success');
        }, 1000);
      });
  
      resetBtn.addEventListener('click', function() {
        parentInput.value = '';
        childInput.value = '';
        parentReceived.innerHTML = '';
        childReceived.innerHTML = '';
        sharedMemoryContent.textContent = '';
        sharedMemoryContent.style.backgroundColor = '';
        memoryBusy = false;
        currentWriter = null;
        updateMemoryStatus();
        
        displayStatusMessage('shm-half', 'Simulation reset', 'info');
      });
  
      backToMenuBtn.addEventListener('click', returnToMenu);
  
      let infoVisible = true;
      const ipcDescription = document.querySelector('#shm-half-container .ipc-description');
      
      showInfoBtn.addEventListener('click', function() {
        if (infoVisible) {
          ipcDescription.style.display = 'none';
          infoVisible = false;
        } else {
          ipcDescription.style.display = 'block';
          infoVisible = true;
        }
      });
      
      updateMemoryStatus();
    }
  
    /*
     * Full Duplex Message Queue Implementation
     */
    function initMessageQueueFullDuplex() {
      const parentInput = document.getElementById('parent-mq-input-full');
      const childInput = document.getElementById('child-mq-input-full');
      const parentSendBtn = document.getElementById('parent-mq-send-full');
      const childSendBtn = document.getElementById('child-mq-send-full');
      const parentPrioritySelect = document.getElementById('parent-mq-priority-full');
      const childPrioritySelect = document.getElementById('child-mq-priority-full');
      const parentReceived = document.getElementById('parent-mq-received-full');
      const childReceived = document.getElementById('child-mq-received-full');
      const parentQueueVisual = document.getElementById('parent-queue-full');
      const childQueueVisual = document.getElementById('child-queue-full');
      const resetBtn = document.getElementById('reset-mq-full');
      const backToMenuBtn = document.getElementById('back-to-menu-mq-full');
      const showInfoBtn = document.getElementById('show-info-mq-full');
      
      let parentQueue = [];
      let childQueue = [];
      const maxQueueSize = 5;
  
      function updateQueueVisual() {
        parentQueueVisual.innerHTML = '';
        if (parentQueue.length === 0) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'queue-slot empty';
          emptySlot.textContent = 'Queue Empty';
          parentQueueVisual.appendChild(emptySlot);
        } else {
          const sortedParentQueue = [...parentQueue].sort((a, b) => b.priority - a.priority);
          sortedParentQueue.forEach(item => {
            const slot = document.createElement('div');
            slot.className = `queue-slot child-slot ${item.type === 'request' ? 'request-msg' : 'response-msg'}`;
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'queue-msg-time';
            timeSpan.textContent = item.timestamp;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'queue-msg-text';
            textSpan.textContent = item.text;
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `queue-msg-type ${item.type === 'request' ? 'request-type' : 'response-type'}`;
            typeSpan.textContent = item.type === 'request' ? 'REQ' : 'RES';
            
            slot.appendChild(timeSpan);
            slot.appendChild(textSpan);
            slot.appendChild(typeSpan);
            parentQueueVisual.appendChild(slot);
          });
        }
        
        childQueueVisual.innerHTML = '';
        if (childQueue.length === 0) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'queue-slot empty';
          emptySlot.textContent = 'Queue Empty';
          childQueueVisual.appendChild(emptySlot);
        } else {
          const sortedChildQueue = [...childQueue].sort((a, b) => b.priority - a.priority);
          sortedChildQueue.forEach(item => {
            const slot = document.createElement('div');
            slot.className = `queue-slot parent-slot ${item.type === 'request' ? 'request-msg' : 'response-msg'}`;
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'queue-msg-time';
            timeSpan.textContent = item.timestamp;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'queue-msg-text';
            textSpan.textContent = item.text;
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `queue-msg-type ${item.type === 'request' ? 'request-type' : 'response-type'}`;
            typeSpan.textContent = item.type === 'request' ? 'REQ' : 'RES';
            
            slot.appendChild(timeSpan);
            slot.appendChild(textSpan);
            slot.appendChild(typeSpan);
            childQueueVisual.appendChild(slot);
          });
        }
      }
  
      function processQueues() {
        if (parentQueue.length > 0) {
          parentQueue.sort((a, b) => b.priority - a.priority);
          const message = parentQueue.shift();
          
          parentReceived.appendChild(createMessageElement(message.text, false));
          parentReceived.scrollTop = parentReceived.scrollHeight;
          
          displayStatusMessage('mq-full', 'Message processed from Parent Queue', 'info');
        }
        
        if (childQueue.length > 0) {
          childQueue.sort((a, b) => b.priority - a.priority);
          const message = childQueue.shift();
          
          childReceived.appendChild(createMessageElement(message.text, true));
          childReceived.scrollTop = childReceived.scrollHeight;
          
          displayStatusMessage('mq-full', 'Message processed from Child Queue', 'info');
        }
        
        updateQueueVisual();
      }
  
      let queueProcessorInterval = setInterval(processQueues, 3000);
  
      parentSendBtn.addEventListener('click', function() {
        const message = parentInput.value.trim();
        const priority = parseInt(parentPrioritySelect.value);
        
        if (!message) {
          displayStatusMessage('mq-full', 'Please enter a message to send', 'error');
          return;
        }
        
        if (childQueue.length >= maxQueueSize) {
          displayStatusMessage('mq-full', 'Child\'s queue is full, message discarded', 'error');
          return;
        }
        
        childQueue.push({
          text: message,
          priority: priority,
          timestamp: new Date().toLocaleTimeString(),
        });
        
        parentInput.value = '';
        
        updateQueueVisual();
        
        displayStatusMessage('mq-full', 'Message added to Child Queue with priority ' + priority, 'success');
      });
  
      childSendBtn.addEventListener('click', function() {
        const message = childInput.value.trim();
        const priority = parseInt(childPrioritySelect ? childPrioritySelect.value : 1);
        
        if (!message) {
          displayStatusMessage('mq-full', 'Please enter a message to send', 'error');
          return;
        }
        
        if (parentQueue.length >= maxQueueSize) {
          displayStatusMessage('mq-full', 'Parent\'s queue is full, message discarded', 'error');
          return;
        }
        
        parentQueue.push({
          text: message,
          priority: priority,
          timestamp: new Date().toLocaleTimeString(),
        });
        
        childInput.value = '';
        
        updateQueueVisual();
        
        displayStatusMessage('mq-full', 'Message added to Parent Queue with priority ' + priority, 'success');
      });
  
      resetBtn.addEventListener('click', function() {
        parentInput.value = '';
        childInput.value = '';
        parentReceived.innerHTML = '';
        childReceived.innerHTML = '';
        parentQueue = [];
        childQueue = [];
        updateQueueVisual();
        
        displayStatusMessage('mq-full', 'Simulation reset', 'info');
      });
  
      backToMenuBtn.addEventListener('click', function() {
        clearInterval(queueProcessorInterval);
        returnToMenu();
      });
  
      let infoVisible = true;
      const ipcDescription = document.querySelector('#mq-full-container .ipc-description');
      
      showInfoBtn.addEventListener('click', function() {
        if (infoVisible) {
          ipcDescription.style.display = 'none';
          infoVisible = false;
        } else {
          ipcDescription.style.display = 'block';
          infoVisible = true;
        }
      });
      
      updateQueueVisual();
    }
  
    /*
     * Half Duplex Message Queue Implementation
     */
    function initMessageQueueHalfDuplex() {
      const parentInput = document.getElementById('parent-mq-input-half');
      const childInput = document.getElementById('child-mq-input-half');
      const parentSendBtn = document.getElementById('parent-mq-send-half');
      const childSendBtn = document.getElementById('child-mq-send-half');
      const parentPrioritySelect = document.getElementById('parent-mq-priority-half');
      const childPrioritySelect = document.getElementById('child-mq-priority-half');
      const parentReceived = document.getElementById('parent-mq-received-half');
      const childReceived = document.getElementById('child-mq-received-half');
      const sharedQueueVisual = document.getElementById('shared-queue-half');
      const turnIndicator = document.getElementById('current-turn-half');
      const conversationState = document.getElementById('conversation-state-half');
      const resetBtn = document.getElementById('reset-mq-half');
      const backToMenuBtn = document.getElementById('back-to-menu-mq-half');
      const showInfoBtn = document.getElementById('show-info-mq-half');
      
      let sharedQueue = [];
      const maxQueueSize = 5;
      
  
      function updateQueueVisual() {
        sharedQueueVisual.innerHTML = '';
        if (sharedQueue.length === 0) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'queue-slot empty';
          emptySlot.textContent = 'Queue Empty';
          sharedQueueVisual.appendChild(emptySlot);
        } else {
          const sortedQueue = [...sharedQueue].sort((a, b) => b.priority - a.priority);
          sortedQueue.forEach(item => {
            const slot = document.createElement('div');
            slot.className = `queue-slot ${item.sender === 'parent' ? 'parent-slot' : 'child-slot'} ${item.type === 'request' ? 'request-msg' : 'response-msg'}`;
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'queue-msg-time';
            timeSpan.textContent = item.timestamp;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'queue-msg-text';
            textSpan.textContent = item.text;
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `queue-msg-type ${item.type === 'request' ? 'request-type' : 'response-type'}`;
            typeSpan.textContent = item.type === 'request' ? 'REQ' : 'RES';
            
            slot.appendChild(timeSpan);
            slot.appendChild(textSpan);
            slot.appendChild(typeSpan);
            sharedQueueVisual.appendChild(slot);
          });
        }
        
        updateConversationState();
      }
  
      function updateConversationState() {
        turnIndicator.textContent = currentTurn === 'parent' ? 'Parent' : 'Child';
        turnIndicator.className = currentTurn === 'parent' ? 'parent-turn' : 'child-turn';
        
        switch(conversationMode) {
          case 'initial':
            conversationState.textContent = 'Ready for new communication';
            conversationState.className = 'initial-state';
            break;
          case 'awaiting-response':
            conversationState.textContent = `${currentTurn === 'parent' ? 'Child' : 'Parent'} should respond`;
            conversationState.className = 'awaiting-response';
            break;
          case 'responded':
            conversationState.textContent = 'Communication complete';
            conversationState.className = currentTurn === 'parent' ? 'parent-turn' : 'child-turn';
            break;
        }
        
        if (parentSendBtn && childSendBtn) {
          if (conversationMode === 'initial') {
            parentSendBtn.disabled = currentTurn !== 'parent';
            childSendBtn.disabled = currentTurn !== 'child';
          } else if (conversationMode === 'awaiting-response') {
            parentSendBtn.disabled = currentTurn === 'parent';
            childSendBtn.disabled = currentTurn === 'child';
          } else {
            parentSendBtn.disabled = true;
            childSendBtn.disabled = true;
          }
        }
      }
  
      function processQueue() {
        if (sharedQueue.length > 0) {
          sharedQueue.sort((a, b) => b.priority - a.priority);
          const message = sharedQueue.shift();
          
          if (message.sender === 'parent') {
            childReceived.appendChild(createMessageElement(message.text, true));
            childReceived.scrollTop = childReceived.scrollHeight;
            
            if (message.type === 'request') {
              currentTurn = 'child';
              conversationMode = 'awaiting-response';
              lastMessageType = 'request';
            } else {
              currentTurn = 'child';
              conversationMode = 'responded';
              lastMessageType = 'response';
            }
          } else {
            parentReceived.appendChild(createMessageElement(message.text, false));
            parentReceived.scrollTop = parentReceived.scrollHeight;
            
            if (message.type === 'request') {
              currentTurn = 'parent';
              conversationMode = 'awaiting-response';
              lastMessageType = 'request';
            } else {
              currentTurn = 'parent';
              conversationMode = 'responded';
              lastMessageType = 'response';
            }
          }
          
          displayStatusMessage('mq-half', `Message processed from ${message.sender}`, 'info');
          updateQueueVisual();
        }
      }
  
      let queueProcessorInterval = setInterval(processQueue, 3000);
  
      parentSendBtn.addEventListener('click', function() {
        const message = parentInput.value.trim();
        const priority = parseInt(parentPrioritySelect ? parentPrioritySelect.value : 1);
        
        if (!message) {
          displayStatusMessage('mq-half', 'Please enter a message to send', 'error');
          return;
        }
        
        if (sharedQueue.length >= maxQueueSize) {
          displayStatusMessage('mq-half', 'Queue is full, message discarded', 'error');
          return;
        }
        
        const msgType = conversationMode === 'awaiting-response' ? 'response' : 'request';
        
        sharedQueue.push({
          text: message,
          priority: priority,
          timestamp: new Date().toLocaleTimeString(),
          sender: 'parent',
          type: msgType
        });
        
        parentInput.value = '';
        
        if (conversationMode === 'initial') {
          conversationMode = 'awaiting-response';
          lastMessageType = 'request';
        } else if (conversationMode === 'awaiting-response') {
          conversationMode = 'responded';
        }
        
        updateQueueVisual();
        
        displayStatusMessage('mq-half', `${msgType === 'request' ? 'Request' : 'Response'} added to queue with priority ${priority}`, 'success');
      });
  
      childSendBtn.addEventListener('click', function() {
        const message = childInput.value.trim();
        const priority = parseInt(childPrioritySelect ? childPrioritySelect.value : 1);
        
        if (!message) {
          displayStatusMessage('mq-half', 'Please enter a message to send', 'error');
          return;
        }
        
        if (sharedQueue.length >= maxQueueSize) {
          displayStatusMessage('mq-half', 'Queue is full, message discarded', 'error');
          return;
        }
        
        const msgType = conversationMode === 'awaiting-response' ? 'response' : 'request';
        
        sharedQueue.push({
          text: message,
          priority: priority,
          timestamp: new Date().toLocaleTimeString(),
          sender: 'child',
          type: msgType
        });
        
        childInput.value = '';
        
        if (conversationMode === 'initial') {
          conversationMode = 'awaiting-response';
          lastMessageType = 'request';
        } else if (conversationMode === 'awaiting-response') {
          conversationMode = 'responded';
        }
        
        updateQueueVisual();
        
        displayStatusMessage('mq-half', `${msgType === 'request' ? 'Request' : 'Response'} added to queue with priority ${priority}`, 'success');
      });
  
      resetBtn.addEventListener('click', function() {
        parentInput.value = '';
        childInput.value = '';
        parentReceived.innerHTML = '';
        childReceived.innerHTML = '';
        sharedQueue = [];
        
        currentTurn = 'parent';
        conversationMode = 'initial';
        lastMessageType = null;
        
        updateQueueVisual();
        
        displayStatusMessage('mq-half', 'Simulation reset', 'info');
      });
  
      backToMenuBtn.addEventListener('click', function() {
        clearInterval(queueProcessorInterval);
        returnToMenu();
      });
  
      let infoVisible = true;
      const ipcDescription = document.querySelector('#mq-half-container .ipc-description');
      
      showInfoBtn.addEventListener('click', function() {
        if (infoVisible) {
          ipcDescription.style.display = 'none';
          infoVisible = false;
        } else {
          ipcDescription.style.display = 'block';
          infoVisible = true;
        }
      });
      
      updateQueueVisual();
    }
  
    const allBackButtons = document.querySelectorAll('[id^="back-to-menu-"]');
    allBackButtons.forEach(button => {
      button.addEventListener('click', returnToMenu);
    });
  });