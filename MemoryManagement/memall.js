document.addEventListener('DOMContentLoaded', init);

function init() {
  const totalMemoryInput = document.getElementById('total-memory');
  const allocationTypeSelect = document.getElementById('allocation-type');
  const mftControls = document.getElementById('mft-controls');
  const mvtControls = document.getElementById('mvt-controls');
  const numPartitionsInput = document.getElementById('num-partitions');
  const partitionSizesContainer = document.getElementById('partition-sizes-container');
  const processesContainer = document.getElementById('processes-container');
  const addProcessBtn = document.getElementById('add-process');
  const runSimulationBtn = document.getElementById('run-simulation');
  const resetSimulationBtn = document.getElementById('reset-simulation');
  const memoryContainer = document.getElementById('memory-container');
  const allocationInfo = document.getElementById('allocation-info');
  const addAllocatedSegmentBtn = document.getElementById('add-allocated-segment');
  const allocatedSegmentsContainer = document.getElementById('allocated-segments-container');
  const runCompactionBtn = document.getElementById('run-compaction');
  runCompactionBtn.addEventListener('click', performCompaction);
  const colors = ['#FF6B6B','#4ECDC4','#FFD166','#06D6A0','#118AB2','#F7B801','#7F7EFF','#EF476F','#3BCEAC','#FC7307'];
  let memory = [], processes = [], partitions = [];
  const osSize = 40;

  toggleAllocControls();
  updatePartitionSizeInputs();
  resetProcesses();
  setupMemory();

  allocationTypeSelect.addEventListener('change', () => {
    toggleAllocControls();
    resetProcesses();
    setupMemory();
  });
  numPartitionsInput.addEventListener('change', updatePartitionSizeInputs);
  addProcessBtn.addEventListener('click', addProcess);
  addAllocatedSegmentBtn.addEventListener('click', addUsedSegment);
  runSimulationBtn.addEventListener('click', runSimulation);
  resetSimulationBtn.addEventListener('click', resetSim);
  totalMemoryInput.addEventListener('change', () => {
    updatePartitionSizeInputs();
    resetProcesses();
    setupMemory();
  });

  function toggleAllocControls() {
    if (allocationTypeSelect.value === 'mft') {
      mftControls.style.display = 'block';
      mvtControls.style.display = 'none';
    } else {
      mftControls.style.display = 'none';
      mvtControls.style.display = 'block';
    }
  }
  function performCompaction() {
    if (allocationTypeSelect.value !== 'mvt') return;
    
    let totalMem = parseInt(totalMemoryInput.value);
    
    // Get all non-free memory blocks (OS, allocated processes, used segments)
    let nonFreeBlocks = memory.filter(block => block.type !== 'free');
    nonFreeBlocks.sort((a, b) => a.start - b.start);
    
    // Start compaction from the end of OS space
    let currentAddress = osSize;
    
    // Create new compacted memory array with OS block
    let compactedMemory = [memory.find(block => block.type === 'os')];
    
    // Move each non-free block (except OS) to its new position
    nonFreeBlocks.forEach(block => {
      if (block.type === 'os') return; // Skip OS block
      
      let blockSize = block.size;
      let newBlock = {...block};
      newBlock.start = currentAddress;
      newBlock.end = currentAddress + blockSize - 1;
      
      compactedMemory.push(newBlock);
      currentAddress += blockSize;
    });
    
    // Add a single free block at the end if there's space left
    if (currentAddress < totalMem) {
      compactedMemory.push({
        id: 'free-' + currentAddress,
        type: 'free',
        start: currentAddress,
        size: totalMem - currentAddress,
        end: totalMem - 1
      });
    }
    
    // Replace current memory with compacted memory
    memory = compactedMemory;
    
    // Recalculate free memory for allocation info
    let freeBlock = memory.find(block => block.type === 'free');
    let externalFrag = freeBlock ? freeBlock.size : 0;
    
    // Redraw the memory visualization
    renderMemoryMVT();
    
    // Update allocation info to show compaction results
    let allocatedCount = processes.filter(p => p.allocated).length;
    let details = {
      success: true,
      partial: allocatedCount < processes.length,
      message: 'Memory compaction completed. Free memory consolidated.',
      allocatedProcesses: allocatedCount,
      totalProcesses: processes.length,
      externalFragmentation: externalFrag
    };
    
    displayInfo('mvt', details);
  }

  function updatePartitionSizeInputs() {
    partitionSizesContainer.innerHTML = '';
    let n = parseInt(numPartitionsInput.value);
    let totalMem = parseInt(totalMemoryInput.value);
    let avail = totalMem - osSize;
    let base = Math.floor(avail / n);
    let rem = avail - base * n;
    for (let i = 0; i < n; i++) {
      let sz = i === n - 1 ? base + rem : base;
      let div = document.createElement('div');
      div.classList.add('input-group');
      div.innerHTML = `<label>Partition ${i+1} Size (KB):</label>
                       <input type="number" class="partition-size" min="1" max="${avail}" value="${sz}">`;
      partitionSizesContainer.appendChild(div);
    }
  }

  function resetProcesses() {
    processesContainer.innerHTML = '';
    processes = [];
    addProcess();
  }

  function setupMemory() {
    memory = [];
    memoryContainer.innerHTML = '';
    allocationInfo.innerHTML = '';
    memory.push({ id:'os', type:'os', start:0, size:osSize, end:osSize-1 });
    if (allocationTypeSelect.value === 'mft') {
      memoryContainer.className = 'mft-container';
    } else {
      memoryContainer.className = 'mvt-container';
    }
  }

  function addProcess() {
    let idx = processesContainer.childElementCount;
    let div = document.createElement('div');
    div.classList.add('input-group');
    div.innerHTML = `<label>Process ${idx+1} Size (KB):</label>
                     <input type="number" class="process-size" min="1" value="${Math.floor(Math.random()*31)+10}">
                     <button type="button" class="remove-process">Remove</button>`;
    div.querySelector('.remove-process').addEventListener('click', () => {
      processesContainer.removeChild(div);
      updateProcLabels();
    });
    processesContainer.appendChild(div);
  }

  function updateProcLabels() {
    let list = processesContainer.querySelectorAll('.input-group');
    list.forEach((d,i) => {
      d.querySelector('label').textContent = `Process ${i+1} Size (KB):`;
    });
  }

  function addUsedSegment() {
    let idx = allocatedSegmentsContainer.childElementCount;
    let div = document.createElement('div');
    div.classList.add('input-group');
    div.innerHTML = `<label>Segment Start:</label>
                     <input type="number" class="segment-start" min="${osSize}" value="${osSize + idx*20}">
                     <label>Size (KB):</label>
                     <input type="number" class="segment-size" min="1" value="20">
                     <button type="button" class="remove-segment">Remove</button>`;
    div.querySelector('.remove-segment').addEventListener('click', () => {
      allocatedSegmentsContainer.removeChild(div);
    });
    allocatedSegmentsContainer.appendChild(div);
  }

  function getUsedSegments() {
    let segs = [];
    let totalMem = parseInt(totalMemoryInput.value);
    let divs = allocatedSegmentsContainer.querySelectorAll('.input-group');
    divs.forEach(d => {
      let st = parseInt(d.querySelector('.segment-start').value);
      let sz = parseInt(d.querySelector('.segment-size').value);
      if (!isNaN(st) && !isNaN(sz) && st>=osSize && (st+sz-1)<totalMem && sz>0) {
        segs.push({ start:st, size:sz });
      }
    });
    return segs;
  }

  function mergeSegments(segs) {
    if (!segs.length) return segs;
    segs.sort((a,b)=>a.start-b.start);
    let merged=[segs[0]];
    for (let i=1;i<segs.length;i++){
      let last=merged[merged.length-1];
      let lastEnd=last.start+last.size-1;
      let curEnd=segs[i].start+segs[i].size-1;
      if (segs[i].start<=lastEnd+1) {
        if (curEnd>lastEnd) last.size = (curEnd-last.start+1);
      } else merged.push(segs[i]);
    }
    return merged;
  }

  function buildFreeFromUsed(used, totalMem) {
    let free=[];
    used.sort((a,b)=>a.start-b.start);
    let current=osSize;
    used.forEach(u=>{
      let gap=u.start-current;
      if(gap>0) free.push({start:current, end:u.start-1, size:gap});
      current=u.start+u.size;
    });
    if(current<=totalMem-1) {
      free.push({start:current, end:totalMem-1, size: (totalMem-1)-current+1});
    }
    return free;
  }

  function allocateProcessesMVT(freeSegments) {
    processes.forEach(p=>{
      p.allocated=false;
      for(let i=0;i<freeSegments.length;i++){
        if(freeSegments[i].size>=p.size){
          let st=freeSegments[i].start;
          let en=st+p.size-1;
          memory.push({id:'process-'+p.id, type:'process', processId:p.id, start:st, size:p.size, actualSize:p.size, end:en});
          p.allocated=true;
          freeSegments[i].start=en+1;
          freeSegments[i].size=freeSegments[i].end-freeSegments[i].start+1;
          if(freeSegments[i].size<=0) freeSegments.splice(i,1);
          break;
        }
      }
    });
    freeSegments.forEach(f=> {
      memory.push({id:'free-'+f.start, type:'free', start:f.start, size:f.size, end:f.end});
    });
  }

  function runSimulation() {
    memory=[];
    memory.push({ id:'os', type:'os', start:0, size:osSize, end:osSize-1 });
    processes=[];
    let pInputs=processesContainer.querySelectorAll('.process-size');
    pInputs.forEach((inp,i)=>{
      let sz=parseInt(inp.value);
      if(sz<1||isNaN(sz)) return;
      processes.push({id:i, size:sz});
    });
    let totalMem=parseInt(totalMemoryInput.value);
    let allocType=allocationTypeSelect.value;

    if(allocType==='mft'){
      partitions=[];
      let startPos=osSize;
      let sizes=partitionSizesContainer.querySelectorAll('.partition-size');
      sizes.forEach((s,i)=>{
        let val=parseInt(s.value);
        if(val<1||isNaN(val)) return;
        partitions.push({id:i, start:startPos, size:val, end:startPos+val-1, allocated:false, processId:null});
        memory.push({type:'partition', partitionId:i, start:startPos, size:val, end:startPos+val-1});
        startPos+=val;
      });
      if(startPos<totalMem) {
        memory.push({id:'unused', type:'free', start:startPos, size:totalMem-startPos, end:totalMem-1});
      }
      let sum=partitions.reduce((a,c)=>a+c.size,0);
      if(sum>(totalMem-osSize)) return;
      let details=allocateMFT();
      memory.sort((a,b)=>a.start-b.start);
      renderMemoryMFT();
      displayInfo('mft',details);
    } else {
      let used=mergeSegments(getUsedSegments());
      used.forEach(u=>{
        memory.push({id:'used-'+u.start, type:'used', start:u.start, size:u.size, end:u.start+u.size-1});
      });
      let free=buildFreeFromUsed(used, totalMem);
      allocateProcessesMVT(free);
      memory.sort((a,b)=>a.start-b.start);
      let allocatedCount=processes.filter(p=>p.allocated).length;
      let details={
        success:true,
        partial:allocatedCount<processes.length,
        message:allocatedCount===processes.length
          ? 'All processes allocated successfully!'
          : `${allocatedCount} out of ${processes.length} processes allocated.`,
        allocatedProcesses:allocatedCount,
        totalProcesses:processes.length
      };
      let freeBlocks = memory.filter(m => m.type === 'free');
      let externalFrag = freeBlocks.reduce((acc, block) => acc + block.size, 0);
      details.externalFragmentation = externalFrag;
      renderMemoryMVT();
      displayInfo('mvt', details);
    }
  }

  function allocateMFT() {
    let unallocated=[], frag=0;
    processes.forEach(pr=>{
      let chosen=null;
      for(let part of partitions){
        if(!part.allocated && part.size>=pr.size){
          chosen=part; 
          break;
        }
      }
      if(chosen){
        chosen.allocated=true;
        chosen.processId=pr.id;
        pr.allocated=true;
        let wasted = chosen.size - pr.size;
        frag += wasted;
        let block = memory.find(b=>b.type==='partition' && b.partitionId===chosen.id);
        if(block){
          block.allocated=true;
          block.processId=pr.id;
          block.wasted=wasted;
          block.actualSize=pr.size;
        }
      } else {
        pr.allocated=false;
        unallocated.push(pr.id);
      }
    });
    let allocatedCount = processes.filter(p=>p.allocated).length;
    let totalCount = processes.length;
    if(unallocated.length > 0) {
      return {
        success:true,
        partial:true,
        message:`${allocatedCount} out of ${totalCount} processes allocated.`,
        unallocatedProcesses:unallocated,
        totalInternalFragmentation:frag,
        allocatedProcesses:allocatedCount,
        totalProcesses:totalCount
      };
    } else {
      return {
        success:true,
        partial:false,
        message:'All processes allocated successfully!',
        totalInternalFragmentation:frag,
        allocatedProcesses:allocatedCount,
        totalProcesses:totalCount
      };
    }
  }

  // MFT rendering – restored to previous version with detailed labels
  function renderMemoryMFT() {
    memoryContainer.innerHTML = '';
    let scale = document.createElement('div');
    scale.classList.add('memory-scale');
    let content = document.createElement('div');
    content.classList.add('memory-content');
    let totalMem = parseInt(totalMemoryInput.value);

    scale.style.height = '100%';
    content.style.height = '100%';

    let step = totalMem > 500 ? 100 : 50;
    for (let i = 0; i <= totalMem; i += step) {
      let pos = (i / totalMem) * 100;
      let mk = document.createElement('div');
      mk.classList.add('memory-scale-mark');
      mk.style.top = `${pos}%`;
      mk.textContent = i;
      scale.appendChild(mk);
    }
    memoryContainer.appendChild(scale);
    memoryContainer.appendChild(content);

    memory.forEach(b => {
      let e = document.createElement('div');
      e.classList.add('memory-block', b.type);
      let h = (b.size / totalMem) * 100;
      let p = (b.start / totalMem) * 100;
      e.style.top = `${p}%`;
      e.style.height = `${h}%`;

      if(b.type==='os') {
        e.textContent = 'Operating System';
      } else if(b.type==='free'){
        e.textContent = 'Free Space';
        let sl = document.createElement('div');
        sl.classList.add('size-label');
        sl.textContent = `${b.size} KB`;
        e.appendChild(sl);
      } else if(b.type==='partition'){
        if(b.allocated){
          e.style.backgroundColor = colors[b.processId % colors.length];
          e.innerHTML = `<div class="process-label">P${b.processId+1}</div>
                         <div class="size-label">${b.actualSize} KB</div>`;
          if(b.wasted > 0){
            let fl = document.createElement('div');
            fl.classList.add('fragment-label');
            fl.textContent = `Wasted: ${b.wasted} KB`;
            e.appendChild(fl);
            let fi = document.createElement('div');
            fi.classList.add('fragmentation-indicator');
            fi.style.height = `${(b.wasted/b.size)*100}%`;
            e.appendChild(fi);
          }
        } else {
          e.style.backgroundColor = '#b8c6db';
          e.innerHTML = `<div class="process-label">Partition ${b.partitionId+1}</div>
                         <div class="size-label">${b.size} KB</div>
                         <div class="status-label">Empty</div>`;
        }
      }
      content.appendChild(e);
    });
    buildLegend();
  }

  // MVT rendering – each block shows only its start-end address with pattern styling
  function renderMemoryMVT() {
    memoryContainer.innerHTML = '';
    let totalMem = parseInt(totalMemoryInput.value);
    let scale = document.createElement('div');
    scale.classList.add('memory-scale');
    let containerHeight = 400;
    let step = totalMem > 500 ? 100 : 50;

    for (let i = 0; i <= totalMem; i += step) {
      let mark = document.createElement('div');
      mark.classList.add('memory-scale-mark');
      let yPos = (i / totalMem) * containerHeight;
      mark.style.top = `${yPos}px`;
      mark.textContent = i;
      scale.appendChild(mark);
    }

    let memoryWrapper = document.createElement('div');
    memoryWrapper.classList.add('mvt-memory-wrapper');

    memory.forEach(block => {
      let blockEl = document.createElement('div');
      blockEl.classList.add('mvt-block', block.type);
      let topPosition = (block.start / totalMem) * containerHeight;
      let blockHeight = (block.size / totalMem) * containerHeight;
      blockHeight = Math.max(blockHeight, 5);
      blockEl.style.top = `${topPosition}px`;
      blockEl.style.height = `${blockHeight}px`;

      if (block.type === 'os') {
         blockEl.style.backgroundColor = "#34495e";
      } else if (block.type === 'free') {
         blockEl.style.backgroundColor = "#eee";
         blockEl.style.backgroundImage = "repeating-linear-gradient(45deg, rgba(200,200,200,0.3), rgba(200,200,200,0.3) 10px, rgba(150,150,150,0.3) 10px, rgba(150,150,150,0.3) 20px)";
      } else if (block.type === 'used') {
         blockEl.style.backgroundColor = "#ffe6cc";
         blockEl.style.backgroundImage = "repeating-linear-gradient(45deg, rgba(255,230,204,0.3), rgba(255,230,204,0.3) 10px, rgba(255,204,153,0.3) 10px, rgba(255,204,153,0.3) 20px)";
      } else if (block.type === 'process') {
         blockEl.style.backgroundColor = colors[block.processId % colors.length];
      }
      let addrLabel = document.createElement('div');
      addrLabel.textContent = `${block.start}-${block.end}`;
      blockEl.appendChild(addrLabel);
      memoryWrapper.appendChild(blockEl);
    });

    memoryContainer.appendChild(scale);
    memoryContainer.appendChild(memoryWrapper);
    buildLegend();
  }

  function displayInfo(type, details) {
    let html = '';
    if (details.success) {
      html += `<div class="allocation-result">
                <p><strong>${details.message}</strong></p>
                <p>Processes allocated: ${details.allocatedProcesses} of ${details.totalProcesses}</p>`;
      if (type === 'mft') {
        html += `<p>Total internal fragmentation: ${details.totalInternalFragmentation} KB</p>`;
        if (details.unallocatedProcesses && details.unallocatedProcesses.length > 0) {
          html += `<p>Unallocated processes: ${details.unallocatedProcesses.map(p => `P${p+1}`).join(', ')}</p>`;
        }
      } else {
        html += `<p>External Fragmentation: ${details.externalFragmentation} KB</p>`;
      }
      html += `</div>
               <h4>Allocation Table</h4>
               <table class="allocation-table">
                <thead>
                  <tr>
                    <th>Process</th>
                    <th>Size (KB)</th>
                    <th>Status</th>
                    ${type === 'mft' ? '<th>Partition</th>' : '<th>Start Address</th>'}
                    ${type === 'mft' ? '<th>Internal Fragmentation</th>' : '<th>End Address</th>'}
                  </tr>
                </thead>
                <tbody>`;
      processes.forEach(p => {
        let allocDetails = '';
        let fragDetails = '';
        if (p.allocated) {
          let alloc = memory.find(m => m.type === (type === 'mft' ? 'partition' : 'process') && m.processId === p.id);
          if (type === 'mft') {
            let partition = partitions.find(part => part.processId === p.id);
            allocDetails = partition ? `Partition ${partition.id + 1}` : 'N/A';
            fragDetails = alloc ? `${alloc.wasted} KB` : 'N/A';
          } else {
            allocDetails = alloc ? `${alloc.start}` : 'N/A';
            fragDetails = alloc ? `${alloc.end}` : 'N/A';
          }
        }
        html += `<tr>
                  <td>P${p.id + 1}</td>
                  <td>${p.size} KB</td>
                  <td>${p.allocated ? 'Allocated' : 'Not Allocated'}</td>
                  <td>${p.allocated ? allocDetails : 'N/A'}</td>
                  <td>${p.allocated ? fragDetails : 'N/A'}</td>
                </tr>`;
      });
      html += `</tbody></table>`;
    } else {
      html += `<p class="error">${details.message}</p>`;
    }
    allocationInfo.innerHTML = html;
  }

  function buildLegend() {
    const legendContainer = document.getElementById('legend-container');
    legendContainer.innerHTML = '';
    let legend = document.createElement('div');
    legend.classList.add('legend');

    if(allocationTypeSelect.value === 'mvt'){
      let osItem = document.createElement('div');
      osItem.classList.add('legend-item');
      osItem.innerHTML = `<div class="legend-color" style="background-color: #34495e;"></div><span>Operating System</span>`;
      legend.appendChild(osItem);
      let freeItem = document.createElement('div');
      freeItem.classList.add('legend-item');
      freeItem.innerHTML = `<div class="legend-color" style="background-color: #eee;"></div><span>Free Space</span>`;
      legend.appendChild(freeItem);
      let usedItem = document.createElement('div');
      usedItem.classList.add('legend-item');
      usedItem.innerHTML = `<div class="legend-color" style="background-color: #ffe6cc;"></div><span>Used Memory</span>`;
      legend.appendChild(usedItem);
      for(let i=0;i<Math.min(processes.length,colors.length); i++){
        if(processes[i] && processes[i].allocated){
          let procItem = document.createElement('div');
          procItem.classList.add('legend-item');
          procItem.innerHTML = `<div class="legend-color" style="background-color: ${colors[i]};"></div><span>Process ${i+1}</span>`;
          legend.appendChild(procItem);
        }
      }
    } else {
      let osItem = document.createElement('div');
      osItem.classList.add('legend-item');
      osItem.innerHTML = `<div class="legend-color" style="background-color: #34495e;"></div><span>Operating System</span>`;
      legend.appendChild(osItem);
      let freeItem = document.createElement('div');
      freeItem.classList.add('legend-item');
      freeItem.innerHTML = `<div class="legend-color" style="background-color: #eee;"></div><span>Free Space</span>`;
      legend.appendChild(freeItem);
      for(let i=0;i<Math.min(processes.length,colors.length); i++){
        if(processes[i] && processes[i].allocated){
          let procItem = document.createElement('div');
          procItem.classList.add('legend-item');
          procItem.innerHTML = `<div class="legend-color" style="background-color: ${colors[i]};"></div><span>Process ${i+1}</span>`;
          legend.appendChild(procItem);
        }
      }
    }
    legendContainer.appendChild(legend);
  }

  function resetSim() {
    resetProcesses();
    setupMemory();
    if (allocationTypeSelect.value === 'mvt') {
      allocatedSegmentsContainer.innerHTML = '';
    }
    allocationInfo.innerHTML = '';
    document.getElementById('legend-container').innerHTML = '';
  }
}
