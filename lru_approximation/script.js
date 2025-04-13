let simulationData = [];
let currentStep = 0;

function startSimulation() {
  const inputString = document.getElementById("pages").value;
  const capacity = parseInt(document.getElementById("capacity").value);
  const t = inputString
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n));

  simulationData = [];
  currentStep = 0;

  let q = []; // now an array of { page, ref }
  let hits = 0;
  let faults = 0;

  for (let i = 0; i < t.length; i++) {
    const page = t[i];
    let hit = false;
    let action = '';
    let pageIndex = q.findIndex(p => p.page === page);

    if (pageIndex === -1) {
      // MISS
      if (q.length < capacity) {
        q.push({ page, ref: false });
        action = `Page ${page} added (fault, space available)`;
      } else {
        let ptr = 0;

        // Second-Chance Replacement Logic
        while (q[ptr].ref) {
          q[ptr].ref = false;
          q.push(q.shift()); // rotate to back
        }

        q.shift(); // remove the page with ref == 0
        q.push({ page, ref: false });
        action = `Page ${page} added (fault, replaced page)`;
      }
      faults++;
    } else {
      // HIT
      q[pageIndex].ref = true;
      hit = true;
      hits++;
      action = `Page ${page} is a hit`;
    }

    // Save the step state
    simulationData.push({
      index: i,
      page,
      queue: q.map(p => p.page),
      bitref: q.map(p => p.ref),
      hit,
      action,
      hits,
      faults
    });
  }

  renderStep();
}

function renderStep() {
  const output = document.getElementById("output");
  if (simulationData.length === 0) {
    output.textContent = "Click Start to run the simulation.";
    return;
  }

  const step = simulationData[currentStep];
  output.innerText =
    `Step ${step.index + 1}:\n` +
    `Page Referenced: ${step.page}\n` +
    `Action: ${step.action}\n` +
    `Queue: [${step.queue.join(', ')}]\n` +
    `Reference Bits: [${step.bitref.map(b => b ? 1 : 0).join(', ')}]\n` +
    `Hit: ${step.hit ? "Yes" : "No"}\n` +
    `Hits so far: ${step.hits}\n` +
    `Faults so far: ${step.faults}`;
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
  document.getElementById("pages").value = "";
  document.getElementById("capacity").value = "";
  document.getElementById("output").textContent = "";
  simulationData = [];
  currentStep = 0;
}
