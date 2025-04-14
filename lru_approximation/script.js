let simulationData = [];
let currentStep = 0;

function startSimulation() {
  const inputString = document.getElementById("pages").value;
  const capacity = parseInt(document.getElementById("capacity").value);
  const pages = inputString.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

  simulationData = [];
  currentStep = 0;
  let queue = []; // [{ page, ref }]
  let hits = 0, faults = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    let action = "", hit = false, replaced = null;
    const index = queue.findIndex(p => p.page === page);

    if (index !== -1) {
      queue[index].ref = true;
      hit = true;
      hits++;
      action = `Page ${page} is a hit. Reference bit set to 1.`;
    } else {
      faults++;
      if (queue.length < capacity) {
        queue.push({ page, ref: false });
        action = `Page ${page} added (no replacement).`;
      } else {
        while (queue[0].ref) {
          queue[0].ref = false;
          queue.push(queue.shift()); // Rotate
        }
        replaced = queue[0].page;
        queue.shift(); // Remove page with ref = 0
        queue.push({ page, ref: false });
        action = `Page ${page} replaced page ${replaced}.`;
      }
    }

    simulationData.push({
      index: i + 1,
      page,
      action,
      hit,
      replaced,
      hits,
      faults,
      queue: queue.map(p => ({ ...p }))
    });
  }

  renderStep();
}

function renderStep() {
  if (simulationData.length === 0) return;

  const step = simulationData[currentStep];

  document.getElementById("stepCount").innerText = step.index;
  document.getElementById("pageRef").innerText = step.page;
  document.getElementById("action").innerText = step.action;
  document.getElementById("hit").innerText = step.hit ? "Yes ✅" : "No ❌";
  document.getElementById("hitCount").innerText = step.hits;
  document.getElementById("faultCount").innerText = step.faults;

  const frameDisplay = document.getElementById("frameDisplay");
  frameDisplay.innerHTML = "";

  step.queue.forEach(p => {
    const box = document.createElement("div");
    box.classList.add("frame-box");
    if (p.page === step.page && step.hit) box.classList.add("hit");
    if (p.page === step.replaced) box.classList.add("replaced");

    box.innerHTML = `
      <div><strong>${p.page}</strong></div>
      <div class="bit">Bit: ${p.ref ? 1 : 0}</div>
    `;
    frameDisplay.appendChild(box);
  });
}

function nextStep() {
  if (currentStep < simulationData.length - 1) {
    currentStep++;
    renderStep();
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
}

function resetSimulation() {
  simulationData = [];
  currentStep = 0;
  document.getElementById("frameDisplay").innerHTML = "";
  document.getElementById("stepCount").innerText = "0";
  document.getElementById("pageRef").innerText = "-";
  document.getElementById("action").innerText = "";
  document.getElementById("hit").innerText = "-";
  document.getElementById("hitCount").innerText = "0";
  document.getElementById("faultCount").innerText = "0";
  document.getElementById("pages").value = "";
  document.getElementById("capacity").value = "";
}
